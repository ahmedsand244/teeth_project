from django.db import models


class Gender(models.TextChoices):
    MALE = 'MALE', 'ذكر'
    FEMALE = 'أنثى', 'أنثى'


class Patient(models.Model):
    name = models.CharField(max_length=255, verbose_name="اسم المريض")
    phone = models.CharField(max_length=30, blank=True, default='', db_index=True, verbose_name="رقم الهاتف")
    gender = models.CharField(max_length=10, choices=Gender.choices, default=Gender.MALE, verbose_name="الجنس")
    age = models.PositiveIntegerField(null=True, blank=True, verbose_name="العمر")
    notes = models.TextField(blank=True, default='', verbose_name="ملاحظات عامة")
    medical_history = models.TextField(blank=True, default='', verbose_name="التاريخ المرضي والحساسية")
    clinic = models.ForeignKey('accounts.Clinic', on_delete=models.CASCADE, null=True, blank=True, related_name='patients', verbose_name="العيادة")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ التسجيل")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ آخر تعديل")

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'مريض'
        verbose_name_plural = 'المرضى'

    @property
    def total_billed(self):
        from decimal import Decimal
        from billing.models import Invoice
        return float(sum((inv.net_amount for inv in Invoice.objects.filter(visit__patient=self)), Decimal('0.00')))

    @property
    def total_paid(self):
        from decimal import Decimal
        from billing.models import Payment, Invoice
        pmt_total = sum((pmt.amount for pmt in Payment.objects.filter(patient=self)), Decimal('0.00'))
        inv_total = sum((inv.paid_amount for inv in Invoice.objects.filter(visit__patient=self)), Decimal('0.00'))
        return float(max(pmt_total, inv_total))

    @property
    def total_remaining_balance(self):
        from decimal import Decimal
        return float(max(Decimal('0.00'), Decimal(str(self.total_billed)) - Decimal(str(self.total_paid))))

    def __str__(self):
        return f"{self.name} ({self.phone})"
