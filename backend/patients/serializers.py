from rest_framework import serializers
from .models import Patient


class PatientSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True, default='')
    total_billed = serializers.FloatField(read_only=True)
    total_paid = serializers.FloatField(read_only=True)
    total_remaining_balance = serializers.FloatField(read_only=True)
    visits_count = serializers.SerializerMethodField()
    has_consultation = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = [
            'id', 'name', 'phone', 'gender', 'age',
            'notes', 'medical_history', 'created_at', 'updated_at',
            'total_billed', 'total_paid', 'total_remaining_balance',
            'visits_count', 'has_consultation'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_total_remaining_balance(self, obj):
        # Calculate remaining balance across all patient visits
        from billing.models import Invoice
        invoices = Invoice.objects.filter(visit__patient=obj)
        total = sum(inv.remaining_amount for inv in invoices)
        return float(total)

    def get_visits_count(self, obj):
        return obj.appointments.count()

    def get_has_consultation(self, obj):
        # Check if patient had at least one previous consultation/visit
        return obj.appointments.filter(status__in=['COMPLETED', 'WITH_DOCTOR', 'WAITING']).exists()
