from datetime import date
from decimal import Decimal
from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Appointment, ShiftType, VisitType, AppointmentStatus
from .serializers import AppointmentSerializer
from patients.models import Patient
from billing.models import Invoice, Service, AppointmentProcedure, Payment
from billing.serializers import ServiceSerializer, AppointmentProcedureSerializer


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all().select_related('patient', 'invoice').prefetch_related('procedures')
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_saas_admin():
            qs = Appointment.objects.all()
        elif getattr(user, 'clinic', None):
            qs = Appointment.objects.filter(clinic=user.clinic)
        else:
            qs = Appointment.objects.none()

        qs = qs.select_related('patient', 'invoice').prefetch_related('procedures')
        
        # Filter by date
        date_str = self.request.query_params.get('date', None)
        if date_str:
            qs = qs.filter(visit_date=date_str)
        
        # Filter by shift
        shift = self.request.query_params.get('shift', None)
        if shift:
            qs = qs.filter(shift=shift)

        # Filter by status
        status_param = self.request.query_params.get('status', None)
        if status_param:
            qs = qs.filter(status=status_param)

        # Filter by search (patient name or phone)
        search = self.request.query_params.get('search', None)
        if search:
            search = search.strip()
            qs = qs.filter(Q(patient__name__icontains=search) | Q(patient__phone__icontains=search))

        return qs.order_by('queue_number')

    def perform_create(self, serializer):
        user = self.request.user
        if getattr(user, 'clinic', None):
            serializer.save(clinic=user.clinic)
        else:
            serializer.save()

    @action(detail=False, methods=['get'])
    def shift_summary(self, request):
        """
        Returns real-time capacity and queue stats for a given date and shift.
        """
        visit_date_str = request.query_params.get('date', date.today().isoformat())
        shift = request.query_params.get('shift', ShiftType.MORNING)

        user = request.user
        base_qs = Appointment.objects.all()
        if not user.is_saas_admin():
            if getattr(user, 'clinic', None):
                base_qs = base_qs.filter(clinic=user.clinic)
            else:
                base_qs = base_qs.none()

        appointments = base_qs.filter(
            visit_date=visit_date_str,
            shift=shift
        ).exclude(status=AppointmentStatus.CANCELLED)

        waiting_count = appointments.filter(status=AppointmentStatus.WAITING).count()
        with_doctor_count = appointments.filter(status=AppointmentStatus.WITH_DOCTOR).count()
        completed_count = appointments.filter(status=AppointmentStatus.COMPLETED).count()

        return Response({
            'date': visit_date_str,
            'shift': shift,
            'total_in_queue': appointments.count(),
            'waiting': waiting_count,
            'with_doctor': with_doctor_count,
            'completed': completed_count,
        })

    @action(detail=False, methods=['get'])
    def doctor_dashboard(self, request):
        """
        Dedicated endpoint for the Senior-Friendly Doctor Portal.
        Returns the patient currently in examination room, waiting queue, and common quick buttons.
        """
        target_date_str = request.query_params.get('date') or date.today().isoformat()

        user = request.user
        base_qs = Appointment.objects.all()
        if not user.is_saas_admin():
            if getattr(user, 'clinic', None):
                base_qs = base_qs.filter(clinic=user.clinic)
            else:
                base_qs = base_qs.none()

        # Current patient inside with doctor
        current_app = base_qs.filter(
            visit_date=target_date_str,
            status=AppointmentStatus.WITH_DOCTOR
        ).select_related('patient', 'invoice').prefetch_related('procedures').first()

        # If not found for today, check latest active across any date
        if not current_app:
            current_app = base_qs.filter(
                status=AppointmentStatus.WITH_DOCTOR
            ).select_related('patient', 'invoice').prefetch_related('procedures').first()

        # Waiting patients for target date
        waiting_apps = base_qs.filter(
            visit_date=target_date_str,
            status=AppointmentStatus.WAITING
        ).select_related('patient', 'invoice').order_by('queue_number')

        completed_count = base_qs.filter(
            visit_date=target_date_str,
            status=AppointmentStatus.COMPLETED
        ).count()

        common_services = Service.objects.filter(is_common=True).order_by('name')

        return Response({
            'current_patient': AppointmentSerializer(current_app).data if current_app else None,
            'waiting_patients': AppointmentSerializer(waiting_apps, many=True).data,
            'completed_count': completed_count,
            'common_services': ServiceSerializer(common_services, many=True).data,
            'date': target_date_str,
        })

    @action(detail=True, methods=['post'])
    def call_in(self, request, pk=None):
        """
        Moves the patient into the doctor's room (WITH_DOCTOR).
        """
        appointment = self.get_object()
        appointment.status = AppointmentStatus.WITH_DOCTOR
        appointment.save()
        return Response(AppointmentSerializer(appointment).data)

    @action(detail=True, methods=['get', 'post'])
    def procedures(self, request, pk=None):
        """
        GET: Returns procedures for this visit.
        POST: Adds/Updates procedures for this visit and recalculates invoice total.
              Auto-saves any new procedure name into the Service catalog.
        """
        appointment = self.get_object()

        if request.method == 'GET':
            procs = appointment.procedures.all()
            return Response(AppointmentProcedureSerializer(procs, many=True).data)

        # POST: Sync procedures list
        procs_data = request.data.get('procedures', [])
        doctor_notes = request.data.get('doctor_notes')

        if doctor_notes is not None:
            appointment.doctor_notes = doctor_notes
            appointment.save()

        # Replace procedures
        appointment.procedures.all().delete()
        total_procedures_cost = Decimal('0.00')

        for item in procs_data:
            name = (item.get('name') or '').strip()
            if not name:
                continue
            try:
                price = Decimal(str(item.get('price', '0')))
            except Exception:
                price = Decimal('0.00')

            # Auto-save or get from Service catalog
            service, _ = Service.objects.get_or_create(
                name=name,
                defaults={'default_price': price}
            )

            AppointmentProcedure.objects.create(
                appointment=appointment,
                service=service,
                name=name,
                price=price
            )
            total_procedures_cost += price

        # Update or create invoice total amount
        invoice = getattr(appointment, 'invoice', None)
        if not invoice:
            invoice = Invoice.objects.create(
                visit=appointment,
                total_amount=total_procedures_cost
            )
        else:
            invoice.total_amount = total_procedures_cost
            invoice.save()

        # If doctor explicitly clicked "حفظ وإنهاء الكشف من عند الطبيب":
        if request.data.get('complete_and_send'):
            # Patient has finished in the doctor's room and is ready for Reception checkout
            # We can keep status WITH_DOCTOR or mark READY_FOR_CHECKOUT, but keep WITH_DOCTOR
            # until reception clicks "إنهاء الزيارة والدفع"
            pass

        return Response(AppointmentSerializer(appointment).data)

    @action(detail=True, methods=['post'])
    def checkout(self, request, pk=None):
        """
        Checkout and complete the visit:
        - Updates procedures if sent
        - Computes today's total, prior debt, deposit paid, and amount paid now
        - Records Payment
        - Marks status as COMPLETED
        """
        appointment = self.get_object()
        patient = appointment.patient

        # 1. Update procedures if provided
        procs_data = request.data.get('procedures')
        if procs_data is not None:
            appointment.procedures.all().delete()
            total_cost = Decimal('0.00')
            for item in procs_data:
                name = (item.get('name') or '').strip()
                if not name:
                    continue
                try:
                    price = Decimal(str(item.get('price', '0')))
                except Exception:
                    price = Decimal('0.00')

                service, _ = Service.objects.get_or_create(
                    name=name,
                    defaults={'default_price': price}
                )
                AppointmentProcedure.objects.create(
                    appointment=appointment,
                    service=service,
                    name=name,
                    price=price
                )
                total_cost += price
        else:
            total_cost = sum((p.price for p in appointment.procedures.all()), Decimal('0.00'))

        # 2. Update Invoice
        discount_raw = request.data.get('discount', '0')
        try:
            discount_val = Decimal(str(discount_raw))
        except Exception:
            discount_val = Decimal('0.00')

        invoice, _ = Invoice.objects.get_or_create(visit=appointment)
        invoice.total_amount = total_cost
        invoice.discount = discount_val
        invoice.save()

        # 3. Process payment paid now
        paid_now_raw = request.data.get('paid_now', '0')
        notes = request.data.get('notes', '')

        try:
            paid_now = Decimal(str(paid_now_raw))
        except Exception:
            paid_now = Decimal('0.00')

        if paid_now > 0:
            Payment.objects.create(
                patient=patient,
                appointment=appointment,
                amount=paid_now,
                payment_type=Payment.PaymentType.CHECKOUT,
                notes=notes or 'سداد عند إنهاء الزيارة'
            )
            needed_for_this_invoice = max(Decimal('0.00'), invoice.net_amount - invoice.paid_amount)
            if paid_now <= needed_for_this_invoice:
                invoice.paid_amount += paid_now
                excess = Decimal('0.00')
            else:
                invoice.paid_amount += needed_for_this_invoice
                excess = paid_now - needed_for_this_invoice

            if notes:
                invoice.notes = f"{invoice.notes} | {notes}".strip(' |')
            invoice.save()

            if excess > 0:
                unpaid_invoices = Invoice.objects.filter(
                    visit__patient=patient
                ).exclude(id=invoice.id).order_by('created_at')
                for past_inv in unpaid_invoices:
                    if excess <= 0:
                        break
                    past_needed = max(Decimal('0.00'), past_inv.net_amount - past_inv.paid_amount)
                    if past_needed > 0:
                        alloc = min(excess, past_needed)
                        past_inv.paid_amount += alloc
                        past_inv.save()
                        excess -= alloc

        # 4. Mark status completed
        appointment.status = AppointmentStatus.COMPLETED
        if request.data.get('doctor_notes'):
            appointment.doctor_notes = request.data.get('doctor_notes')
        appointment.save()

        return Response({
            'message': 'تم إنهاء الزيارة وتسوية الحساب بنجاح',
            'appointment': AppointmentSerializer(appointment).data,
            'total_procedures_cost': float(total_cost),
            'discount': float(discount_val),
            'paid_now': float(paid_now),
            'invoice_remaining': float(invoice.remaining_amount),
            'patient_total_remaining_debt': float(patient.total_remaining_balance)
        })

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        appointment = self.get_object()
        new_status = request.data.get('status')
        if new_status not in AppointmentStatus.values:
            return Response(
                {'error': f"الحالة غير صالحة. الحالات المتاحة: {', '.join(AppointmentStatus.values)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        appointment.status = new_status
        appointment.save()
        return Response(AppointmentSerializer(appointment).data)

    @action(detail=True, methods=['patch'])
    def update_notes(self, request, pk=None):
        appointment = self.get_object()
        doctor_notes = request.data.get('doctor_notes', '')
        appointment.doctor_notes = doctor_notes
        appointment.save()
        return Response(AppointmentSerializer(appointment).data)


class PublicAppointmentTicketView(APIView):
    """
    Public ticket view accessible by patient via QR code or shared link without login.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        try:
            app = Appointment.objects.select_related('patient', 'clinic', 'invoice').get(pk=pk)
        except Appointment.DoesNotExist:
            return Response({'error': 'تذكرة الموعد غير موجودة أو تم حذفها'}, status=status.HTTP_404_NOT_FOUND)

        inv = getattr(app, 'invoice', None)
        paid = float(inv.paid_amount) if inv else 0.0
        remaining = float(inv.remaining_amount) if inv else 0.0
        total = float(inv.total_amount) if inv else 0.0

        return Response({
            'id': app.id,
            'queue_number': app.queue_number,
            'patient_name': app.patient.name,
            'patient_phone': app.patient.phone,
            'visit_date': app.visit_date.isoformat(),
            'shift': app.shift,
            'shift_display': app.get_shift_display(),
            'appointment_time': app.appointment_time,
            'visit_type': app.visit_type,
            'visit_type_display': app.get_visit_type_display(),
            'status': app.status,
            'status_display': app.get_status_display(),
            'clinic_name': app.clinic.name if app.clinic else 'عيادة الأسنان',
            'clinic_phone': getattr(app.clinic, 'phone', '01011079572') or '01011079572',
            'paid_amount': paid,
            'remaining_amount': remaining,
            'total_amount': total,
        })

