from django.db import models
from decimal import Decimal
from appointments.models import Appointment
from patients.models import Patient


class Service(models.Model):
    name = models.CharField(max_length=255, unique=True, verbose_name='اسم الخدمة / الإجراء')
    default_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), verbose_name='السعر الافتراضي')
    is_common = models.BooleanField(default=False, verbose_name='إجراء شائع يظهر كزر سريع للطبيب')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'خدمة / إجراء'
        verbose_name_plural = 'الخدمات والإجراءات'

    def __str__(self):
        return f"{self.name} ({self.default_price} ج.م)"


class AppointmentProcedure(models.Model):
    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.CASCADE,
        related_name='procedures',
        verbose_name='الموعد / الجلسة'
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='appointment_procedures',
        verbose_name='الخدمة المرتبطة'
    )
    name = models.CharField(max_length=255, verbose_name='اسم الإجراء')
    price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), verbose_name='السعر')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        verbose_name = 'إجراء الجلسة'
        verbose_name_plural = 'إجراءات الجلسة'

    def __str__(self):
        return f"{self.name} - {self.price} ج.م ({self.appointment.patient.name})"


class Payment(models.Model):
    class PaymentType(models.TextChoices):
        DEPOSIT = 'DEPOSIT', 'مقدم / حجز مبدئي'
        CHECKOUT = 'CHECKOUT', 'سداد عند الخروج'
        DEBT_SETTLEMENT = 'DEBT_SETTLEMENT', 'سداد مديونية سابقة'
        OTHER = 'OTHER', 'دفع نقدي'

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='payments',
        verbose_name='المريض'
    )
    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='payments',
        verbose_name='الموعد المرتبط'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='المبلغ المدفوع')
    payment_type = models.CharField(
        max_length=30,
        choices=PaymentType.choices,
        default=PaymentType.CHECKOUT,
        verbose_name='نوع الدفع'
    )
    notes = models.CharField(max_length=255, blank=True, default='', verbose_name='ملاحظات الدفع')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاريخ الدفع')

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'عملية دفع'
        verbose_name_plural = 'عمليات الدفع'

    def __str__(self):
        return f"دفع {self.amount} ج.م - {self.patient.name} ({self.get_payment_type_display()})"


class Invoice(models.Model):
    visit = models.OneToOneField(
        Appointment,
        on_delete=models.CASCADE,
        related_name='invoice',
        verbose_name='الكشف / الموعد'
    )
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='المبلغ الإجمالي الأصلي'
    )
    discount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='قيمة الخصم'
    )
    paid_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='المسدد / المدفوع'
    )
    notes = models.CharField(
        max_length=255,
        blank=True,
        default='',
        verbose_name='ملاحظات الفاتورة'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاريخ الإنشاء')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='تاريخ التحديث')

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'فاتورة'
        verbose_name_plural = 'الفواتير'

    @property
    def net_amount(self) -> Decimal:
        net = self.total_amount - self.discount
        return max(Decimal('0.00'), net)

    @property
    def remaining_amount(self) -> Decimal:
        remaining = self.net_amount - self.paid_amount
        return max(Decimal('0.00'), remaining)

    def __str__(self):
        return f"فاتورة #{self.id} - {self.visit.patient.name} - المسدد: {self.paid_amount} / الباقي: {self.remaining_amount}"
