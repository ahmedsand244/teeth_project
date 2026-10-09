from rest_framework import serializers
from decimal import Decimal
from .models import Invoice, Service, AppointmentProcedure, Payment


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ['id', 'name', 'default_price', 'is_common', 'created_at']


class AppointmentProcedureSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='name', read_only=True)

    class Meta:
        model = AppointmentProcedure
        fields = ['id', 'appointment', 'service', 'name', 'service_name', 'price', 'created_at']


class PaymentSerializer(serializers.ModelSerializer):
    payment_type_display = serializers.CharField(source='get_payment_type_display', read_only=True)
    patient_name = serializers.CharField(source='patient.name', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'patient', 'patient_name', 'appointment',
            'amount', 'payment_type', 'payment_type_display',
            'notes', 'created_at'
        ]


class InvoiceSerializer(serializers.ModelSerializer):
    net_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    remaining_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    patient_name = serializers.CharField(source='visit.patient.name', read_only=True)
    patient_phone = serializers.CharField(source='visit.patient.phone', read_only=True)
    visit_type = serializers.CharField(source='visit.visit_type', read_only=True)
    visit_date = serializers.DateField(source='visit.visit_date', read_only=True)
    procedures = AppointmentProcedureSerializer(source='visit.procedures', many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'visit', 'total_amount', 'discount',
            'paid_amount', 'net_amount', 'remaining_amount',
            'notes', 'created_at', 'updated_at',
            'patient_name', 'patient_phone', 'visit_type', 'visit_date',
            'procedures'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'net_amount', 'remaining_amount']

    def validate(self, attrs):
        total = attrs.get('total_amount', self.instance.total_amount if self.instance else Decimal('0.00'))
        discount = attrs.get('discount', self.instance.discount if self.instance else Decimal('0.00'))
        paid = attrs.get('paid_amount', self.instance.paid_amount if self.instance else Decimal('0.00'))

        if discount < Decimal('0.00'):
            raise serializers.ValidationError({"discount": "قيمة الخصم لا يمكن أن تكون سالبة."})
        if total < Decimal('0.00'):
            raise serializers.ValidationError({"total_amount": "إجمالي المبلغ لا يمكن أن يكون سالباً."})
        if discount > total:
            raise serializers.ValidationError({"discount": "لا يمكن أن يتجاوز الخصم إجمالي المبلغ المطلوب."})
        if paid < Decimal('0.00'):
            raise serializers.ValidationError({"paid_amount": "المبلغ المدفوع لا يمكن أن يكون سالباً."})
        return attrs
