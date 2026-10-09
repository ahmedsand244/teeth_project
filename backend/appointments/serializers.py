from rest_framework import serializers
from decimal import Decimal
from datetime import date
from .models import Appointment, VisitType, ShiftType, AppointmentStatus
from .queue_engine import get_next_queue_number
from patients.models import Patient
from patients.serializers import PatientSerializer
from billing.models import Invoice, Payment
from billing.serializers import InvoiceSerializer, AppointmentProcedureSerializer


class AppointmentSerializer(serializers.ModelSerializer):
    patient_details = PatientSerializer(source='patient', read_only=True)
    invoice = InvoiceSerializer(read_only=True)
    procedures = AppointmentProcedureSerializer(many=True, read_only=True)
    visit_type_display = serializers.CharField(source='get_visit_type_display', read_only=True)
    shift_display = serializers.CharField(source='get_shift_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    queue_number = serializers.IntegerField(required=False)
    appointment_time = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')

    # Optional initial invoice / deposit fields
    initial_total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, write_only=True, default=Decimal('0.00'))
    initial_discount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, write_only=True, default=Decimal('0.00'))
    initial_paid_amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, write_only=True, default=Decimal('0.00'))
    initial_invoice_notes = serializers.CharField(max_length=255, required=False, write_only=True, default='', allow_blank=True)

    class Meta:
        model = Appointment
        fields = [
            'id', 'patient', 'patient_details',
            'visit_type', 'visit_type_display',
            'shift', 'shift_display',
            'visit_date', 'appointment_time', 'queue_number',
            'status', 'status_display',
            'is_dawn_walkin', 'doctor_notes',
            'procedures', 'invoice', 'created_at', 'updated_at',
            'initial_total_amount', 'initial_discount',
            'initial_paid_amount', 'initial_invoice_notes'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        visit_date = attrs.get('visit_date', self.instance.visit_date if self.instance else None)
        if not visit_date:
            raise serializers.ValidationError({"visit_date": "تاريخ الزيارة مطلوب."})
        return attrs

    def create(self, validated_data):
        initial_total = validated_data.pop('initial_total_amount', Decimal('0.00'))
        initial_discount = validated_data.pop('initial_discount', Decimal('0.00'))
        initial_paid = validated_data.pop('initial_paid_amount', Decimal('0.00'))
        initial_notes = validated_data.pop('initial_invoice_notes', '')

        visit_date = validated_data['visit_date']
        shift = validated_data.get('shift', ShiftType.MORNING)
        visit_type = validated_data.get('visit_type', VisitType.GENERAL_CHECKUP)

        request = self.context.get('request')
        clinic = None
        if request and request.user and getattr(request.user, 'clinic', None):
            clinic = request.user.clinic
        elif validated_data.get('patient') and getattr(validated_data['patient'], 'clinic', None):
            clinic = validated_data['patient'].clinic

        if clinic:
            validated_data['clinic'] = clinic

        # Queue token assignment: check if manual queue_number provided
        manual_queue = validated_data.get('queue_number')
        if not manual_queue:
            token_filter = {
                'visit_date': visit_date,
                'shift': shift
            }
            if clinic:
                token_filter['clinic'] = clinic

            taken_tokens = set(
                Appointment.objects.filter(
                    **token_filter
                ).exclude(status=AppointmentStatus.CANCELLED).values_list('queue_number', flat=True)
            )
            validated_data['queue_number'] = get_next_queue_number(visit_type, taken_tokens)

        appointment = Appointment.objects.create(**validated_data)

        # Create corresponding Invoice
        Invoice.objects.create(
            visit=appointment,
            total_amount=initial_total,
            discount=initial_discount,
            paid_amount=initial_paid,
            notes=initial_notes
        )

        # Record deposit payment if initial_paid > 0
        if initial_paid > Decimal('0.00'):
            Payment.objects.create(
                patient=appointment.patient,
                appointment=appointment,
                amount=initial_paid,
                payment_type=Payment.PaymentType.DEPOSIT,
                notes=initial_notes or 'مقدم حجز مبدئي'
            )

        return appointment

    def update(self, instance, validated_data):
        initial_total = validated_data.pop('initial_total_amount', None)
        initial_discount = validated_data.pop('initial_discount', None)
        initial_paid = validated_data.pop('initial_paid_amount', None)
        initial_notes = validated_data.pop('initial_invoice_notes', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update invoice if amounts were provided
        if hasattr(instance, 'invoice') and instance.invoice:
            inv = instance.invoice
            updated_inv = False
            if initial_total is not None:
                inv.total_amount = initial_total
                updated_inv = True
            if initial_discount is not None:
                inv.discount = initial_discount
                updated_inv = True
            if initial_paid is not None:
                inv.paid_amount = initial_paid
                updated_inv = True
            if initial_notes is not None:
                inv.notes = initial_notes
                updated_inv = True
            if updated_inv:
                inv.save()
        return instance
