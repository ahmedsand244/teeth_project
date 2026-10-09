from decimal import Decimal
from rest_framework import viewsets, filters, permissions, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Patient
from .serializers import PatientSerializer
from billing.models import Invoice, Payment
from billing.serializers import PaymentSerializer, InvoiceSerializer


class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'phone']

    def get_queryset(self):
        user = self.request.user
        if user.is_saas_admin():
            qs = Patient.objects.all()
        elif getattr(user, 'clinic', None):
            qs = Patient.objects.filter(clinic=user.clinic)
        else:
            qs = Patient.objects.none()

        query = self.request.query_params.get('q', None) or self.request.query_params.get('search', None)
        if query:
            query = query.strip()
            qs = qs.filter(Q(name__icontains=query) | Q(phone__icontains=query))
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if getattr(user, 'clinic', None):
            serializer.save(clinic=user.clinic)
        else:
            serializer.save()

    @action(detail=True, methods=['get'])
    def financial_profile(self, request, pk=None):
        """
        Complete financial ledger for a patient:
        - Top summary: total billed, total paid, net outstanding debt
        - History of all visits, procedures, invoices, and payment receipts
        """
        patient = self.get_object()

        # Collect visits and invoices
        appointments = patient.appointments.all().order_by('-visit_date', '-id')
        visits_history = []

        for app in appointments:
            inv = getattr(app, 'invoice', None)
            procs = [{
                'id': p.id,
                'name': p.name,
                'service_name': p.name,
                'price': float(p.price)
            } for p in app.procedures.all()]

            payments = [{
                'id': pmt.id,
                'amount': float(pmt.amount),
                'type': pmt.payment_type,
                'type_display': pmt.get_payment_type_display(),
                'date': pmt.created_at.strftime('%Y-%m-%d %H:%M'),
                'notes': pmt.notes
            } for pmt in app.payments.all()]

            # Determine true financial numbers for this visit
            proc_sum = sum(p['price'] for p in procs)
            pmt_sum = sum(pmt['amount'] for pmt in payments)
            
            tot = float(inv.total_amount) if (inv and inv.total_amount > 0) else proc_sum
            paid = float(inv.paid_amount) if (inv and inv.paid_amount > 0) else pmt_sum
            disc = float(inv.discount) if inv else 0.0
            net = max(0.0, tot - disc)
            rem = max(0.0, net - paid)

            inv_dict = {
                'total_amount': tot,
                'discount': disc,
                'net_amount': net,
                'paid_amount': paid,
                'remaining_amount': rem,
            }

            visits_history.append({
                'appointment_id': app.id,
                'date': str(app.visit_date),
                'time': app.appointment_time,
                'shift': app.get_shift_display(),
                'visit_type': app.get_visit_type_display(),
                'status': app.get_status_display(),
                'doctor_notes': app.doctor_notes,
                'procedures': procs,
                'invoice': inv_dict,
                'total_amount': tot,
                'discount': disc,
                'net_amount': net,
                'paid_amount': paid,
                'remaining_amount': rem,
                'is_settled': (rem <= 0),
                'payments': payments
            })

        # Standalone debt payments not tied to a single appointment
        standalone_payments = patient.payments.filter(appointment__isnull=True).order_by('-created_at')
        debt_payments = [{
            'id': pmt.id,
            'amount': float(pmt.amount),
            'type': pmt.payment_type,
            'type_display': pmt.get_payment_type_display(),
            'date': pmt.created_at.strftime('%Y-%m-%d %H:%M'),
            'notes': pmt.notes
        } for pmt in standalone_payments]

        return Response({
            'patient': {
                'id': patient.id,
                'name': patient.name,
                'phone': patient.phone,
                'age': patient.age,
                'gender': patient.gender,
                'notes': patient.notes,
                'medical_history': patient.medical_history,
                'created_at': patient.created_at.strftime('%Y-%m-%d')
            },
            'summary': {
                'total_billed': patient.total_billed,
                'total_paid': patient.total_paid,
                'total_remaining_balance': patient.total_remaining_balance,
                'total_remaining_debt': patient.total_remaining_balance,
                'total_visits': patient.appointments.count(),
                'visits_count': patient.appointments.count()
            },
            'visits': visits_history,
            'standalone_payments': debt_payments
        })

    @action(detail=True, methods=['post'])
    def pay_debt(self, request, pk=None):
        """
        Record a payment directly against patient's outstanding balance / previous debt.
        Allocates the payment across oldest unpaid invoices.
        """
        patient = self.get_object()
        amount_raw = request.data.get('amount')
        notes = request.data.get('notes', 'سداد مديونية سابقة من الملف المالي')

        try:
            amount = Decimal(str(amount_raw))
            if amount <= 0:
                raise ValueError()
        except Exception:
            return Response({'error': 'يرجى إدخال مبلغ دفع موجب أكبر من الصفر'}, status=status.HTTP_400_BAD_REQUEST)

        # Create payment record
        pmt = Payment.objects.create(
            patient=patient,
            amount=amount,
            payment_type=Payment.PaymentType.DEBT_SETTLEMENT,
            notes=notes
        )

        # Allocate payment to patient's unpaid past invoices from oldest to newest
        remaining_to_allocate = amount
        unpaid_invoices = Invoice.objects.filter(
            visit__patient=patient
        ).order_by('created_at')

        for inv in unpaid_invoices:
            if remaining_to_allocate <= 0:
                break
            rem = inv.remaining_amount
            if rem > 0:
                alloc = min(rem, remaining_to_allocate)
                inv.paid_amount += alloc
                inv.save()
                remaining_to_allocate -= alloc

        return Response({
            'message': f'تم تسجيل سداد مديونية بقيمة {amount} ج.م بنجاح',
            'payment': PaymentSerializer(pmt).data,
            'new_debt_balance': patient.total_remaining_balance
        })


class PublicPatientRecordView(APIView):
    """
    Public medical record and visits ledger view accessible by patient or doctor via shared link.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        try:
            patient = Patient.objects.select_related('clinic').get(pk=pk)
        except Patient.DoesNotExist:
            return Response({'error': 'ملف المريض غير موجود أو تم حذفه'}, status=status.HTTP_404_NOT_FOUND)

        appointments = patient.appointments.all().order_by('-visit_date', '-id')
        visits_history = []
        for app in appointments:
            inv = getattr(app, 'invoice', None)
            procs = [{
                'id': p.id,
                'name': p.name,
                'price': float(p.price)
            } for p in app.procedures.all()]

            visits_history.append({
                'appointment_id': app.id,
                'date': app.visit_date.isoformat(),
                'shift': app.get_shift_display(),
                'status': app.get_status_display(),
                'visit_type': app.get_visit_type_display(),
                'procedures': procs,
                'doctor_notes': app.doctor_notes,
                'total_amount': float(inv.total_amount) if inv else 0.0,
                'paid_amount': float(inv.paid_amount) if inv else 0.0,
                'remaining_amount': float(inv.remaining_amount) if inv else 0.0,
            })

        return Response({
            'patient': {
                'id': patient.id,
                'name': patient.name,
                'phone': patient.phone,
                'age': patient.age,
                'gender': patient.gender,
                'notes': patient.notes,
                'clinic_name': patient.clinic.name if patient.clinic else 'عيادة الأسنان',
                'clinic_phone': getattr(patient.clinic, 'phone', '01011079572') or '01011079572',
            },
            'summary': {
                'total_billed': patient.total_billed,
                'total_paid': patient.total_paid,
                'total_remaining': patient.total_remaining_balance,
                'visits_count': appointments.count()
            },
            'visits': visits_history
        })

