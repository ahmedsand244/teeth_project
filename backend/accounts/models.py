from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
import datetime
import random


class UserRole(models.TextChoices):
    SAAS_ADMIN = 'SAAS_ADMIN', 'مدير المنصة (SaaS)'
    DOCTOR = 'DOCTOR', 'طبيب'
    ASSISTANT = 'ASSISTANT', 'مساعد / استقبال'


class SubscriptionStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', 'نشط'
    TRIAL = 'TRIAL', 'تجريبي'
    EXPIRED = 'EXPIRED', 'منتهي'
    SUSPENDED = 'SUSPENDED', 'معلق'


class Clinic(models.Model):
    name = models.CharField(max_length=255, verbose_name='اسم العيادة')
    invite_code = models.CharField(max_length=20, unique=True, verbose_name='كود انضمام المساعدين')
    phone = models.CharField(max_length=30, blank=True, verbose_name='هاتف العيادة')
    address = models.CharField(max_length=255, blank=True, verbose_name='عنوان العيادة')
    
    # SaaS Subscription
    plan_name = models.CharField(max_length=100, default='الاشتراك الشهري الاحترافي', verbose_name='اسم الباقة')
    monthly_price = models.DecimalField(max_digits=10, decimal_places=2, default=500.00, verbose_name='قيمة الاشتراك الشهري')
    subscription_status = models.CharField(
        max_length=20, 
        choices=SubscriptionStatus.choices, 
        default=SubscriptionStatus.ACTIVE,
        verbose_name='حالة الاشتراك'
    )
    subscription_start_date = models.DateField(default=timezone.localdate, verbose_name='تاريخ بدء الاشتراك')
    subscription_end_date = models.DateField(null=True, blank=True, verbose_name='تاريخ انتهاء الاشتراك')
    is_active = models.BooleanField(default=True, verbose_name='العيادة نشطة ومفعلة')
    created_at = models.DateTimeField(auto_now_add=True)

    def days_remaining(self):
        today = timezone.localdate()
        if self.subscription_end_date:
            return (self.subscription_end_date - today).days
        return 30

    def is_subscription_active(self):
        today = timezone.localdate()
        if not self.is_active:
            return False
        if self.subscription_end_date and self.subscription_end_date < today:
            return False
        return True

    def save(self, *args, **kwargs):
        if not self.subscription_end_date:
            self.subscription_end_date = timezone.localdate() + datetime.timedelta(days=30)
        if not self.invite_code:
            self.invite_code = f"CLINIC-{random.randint(1000, 9999)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.invite_code})"


class User(AbstractUser):
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.ASSISTANT,
        verbose_name='الدور الوظيفي'
    )
    full_name = models.CharField(max_length=255, blank=True, verbose_name='الاسم الكامل')
    phone = models.CharField(max_length=20, blank=True, verbose_name='رقم الهاتف')
    
    # Multi-tenant Clinic association
    clinic = models.ForeignKey(
        Clinic, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='members',
        verbose_name='العيادة التابع لها'
    )
    
    # Approval: Doctors are auto-approved. Assistants registered via invite/public must be approved by doctor!
    is_approved = models.BooleanField(default=True, verbose_name='تمت الموافقة وتفعيل الحساب')

    def is_saas_admin(self):
        return self.role == UserRole.SAAS_ADMIN or self.is_superuser

    def is_doctor(self):
        return self.role == UserRole.DOCTOR or self.is_superuser or self.role == UserRole.SAAS_ADMIN

    def is_assistant(self):
        return self.role == UserRole.ASSISTANT

    def __str__(self):
        role_label = self.get_role_display()
        name = self.full_name or self.username
        return f"{name} ({role_label})"

