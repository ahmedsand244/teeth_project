from decimal import Decimal
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Invoice, Service, AppointmentProcedure, Payment
from .serializers import InvoiceSerializer, ServiceSerializer, AppointmentProcedureSerializer, PaymentSerializer


class ServiceViewSet(viewsets.ModelViewSet):
    """
    Catalog of clinic dental procedures with default prices.
    Supports instant autocomplete search and auto-creation of new services.
    """
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

    def get_queryset(self):
        qs = Service.objects.all()
        q = self.request.query_params.get('search') or self.request.query_params.get('q')
        if q:
            qs = qs.filter(name__icontains=q.strip())
        return qs.order_by('-is_common', 'name')

    @action(detail=False, methods=['get'])
    def common(self, request):
        """Returns the quick-access common procedures for the Doctor's senior-friendly buttons."""
        common_services = Service.objects.filter(is_common=True).order_by('name')
        return Response(ServiceSerializer(common_services, many=True).data)


class PaymentViewSet(viewsets.ModelViewSet):
    """
    Patient payment transactions (Deposits, Checkout payments, Debt settlements).
    """
    queryset = Payment.objects.all().select_related('patient', 'appointment')
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Payment.objects.all().select_related('patient', 'appointment')
        if not user.is_saas_admin():
            if getattr(user, 'clinic', None):
                qs = qs.filter(patient__clinic=user.clinic)
            else:
                qs = qs.none()

        patient_id = self.request.query_params.get('patient')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        appointment_id = self.request.query_params.get('appointment')
        if appointment_id:
            qs = qs.filter(appointment_id=appointment_id)
        return qs.order_by('-created_at')

    def create(self, request, *args, **kwargs):
        patient_id = request.data.get('patient')
        appointment_id = request.data.get('appointment')
        amount_raw = request.data.get('amount')
        payment_type = request.data.get('payment_type', Payment.PaymentType.CHECKOUT)
        notes = request.data.get('notes', '')

        try:
            amount = Decimal(str(amount_raw))
            if amount <= 0:
                raise ValueError()
        except Exception:
            return Response({'error': 'يرجى إدخال مبلغ دفع موجب أكبر من الصفر'}, status=status.HTTP_400_BAD_REQUEST)

        payment = Payment.objects.create(
            patient_id=patient_id,
            appointment_id=appointment_id,
            amount=amount,
            payment_type=payment_type,
            notes=notes
        )

        # If payment is for a specific appointment, update that invoice
        if appointment_id:
            invoice = Invoice.objects.filter(visit_id=appointment_id).first()
            if invoice:
                invoice.paid_amount += amount
                if notes:
                    invoice.notes = f"{invoice.notes} | {notes}".strip(' |')
                invoice.save()
        elif payment_type == Payment.PaymentType.DEBT_SETTLEMENT and patient_id:
            # Pay down patient's unpaid past invoices from oldest to newest
            remaining_to_allocate = amount
            unpaid_invoices = Invoice.objects.filter(
                visit__patient_id=patient_id
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

        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)


class InvoiceViewSet(viewsets.ModelViewSet):
    """
    Handles individual patient invoice management and payments.
    """
    queryset = Invoice.objects.all().select_related('visit__patient', 'visit')
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Invoice.objects.all().select_related('visit__patient', 'visit')
        if not user.is_saas_admin():
            if getattr(user, 'clinic', None):
                qs = qs.filter(visit__clinic=user.clinic)
            else:
                qs = qs.none()

        patient_id = self.request.query_params.get('patient', None)
        if patient_id:
            qs = qs.filter(visit__patient_id=patient_id)
        visit_id = self.request.query_params.get('visit', None)
        if visit_id:
            qs = qs.filter(visit_id=visit_id)
        return qs

    @action(detail=True, methods=['patch'])
    def record_payment(self, request, pk=None):
        invoice = self.get_object()
        additional_payment = request.data.get('additional_payment')
        notes = request.data.get('notes', '')

        if additional_payment is None:
            return Response({'error': 'يرجى تحديد المبلغ المدفوع الإضافي'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            add_val = Decimal(str(additional_payment))
            if add_val <= 0:
                raise ValueError()
        except Exception:
            return Response({'error': 'المبلغ المدفوع يجب أن يكون رقماً موجباً أكبر من الصفر'}, status=status.HTTP_400_BAD_REQUEST)

        invoice.paid_amount += add_val
        if notes:
            invoice.notes = f"{invoice.notes} | {notes}".strip(' |')
        invoice.save()

        # Also create a Payment record for financial audit trail
        Payment.objects.create(
            patient=invoice.visit.patient,
            appointment=invoice.visit,
            amount=add_val,
            payment_type=Payment.PaymentType.CHECKOUT,
            notes=notes
        )

        return Response(InvoiceSerializer(invoice).data)
