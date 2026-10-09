from django.db import models
from django.core.exceptions import ValidationError
from patients.models import Patient


class VisitType(models.TextChoices):
    GENERAL_CHECKUP = 'GENERAL_CHECKUP', 'كشف'
    FOLLOWUP_CHECKUP = 'FOLLOWUP_CHECKUP', 'متابعة كشف'
    ORTHO_NEW_FIT = 'ORTHO_NEW_FIT', 'تركيب تقويم'
    ORTHO_FOLLOWUP = 'ORTHO_FOLLOWUP', 'متابعة تقويم'


class ShiftType(models.TextChoices):
    MORNING = 'MORNING', 'صباحي (9:00 ص - 2:00 م)'
    EVENING = 'EVENING', 'مسائي (5:00 م - 10:00 م)'


class AppointmentStatus(models.TextChoices):
    WAITING = 'WAITING', 'في الانتظار'
    WITH_DOCTOR = 'WITH_DOCTOR', 'مع الطبيب'
    COMPLETED = 'COMPLETED', 'تم الكشف'
    CANCELLED = 'CANCELLED', 'ملغي'


class Appointment(models.Model):
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='appointments',
        verbose_name='المريض'
    )
    clinic = models.ForeignKey(
        'accounts.Clinic',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='appointments',
        verbose_name='العيادة'
    )
    visit_type = models.CharField(
        max_length=30,
        choices=VisitType.choices,
        default=VisitType.GENERAL_CHECKUP,
        verbose_name='نوع الزيارة'
    )
    shift = models.CharField(
        max_length=20,
        choices=ShiftType.choices,
        default=ShiftType.MORNING,
        verbose_name='الشيفت'
    )
    visit_date = models.DateField(verbose_name='تاريخ الزيارة')
    appointment_time = models.CharField(
        max_length=20,
        blank=True,
        default='',
        verbose_name='الساعة / وقت الموعد'
    )
    queue_number = models.PositiveIntegerField(verbose_name='رقم الدور')
    status = models.CharField(
        max_length=20,
        choices=AppointmentStatus.choices,
        default=AppointmentStatus.WAITING,
        verbose_name='الحالة'
    )
    is_dawn_walkin = models.BooleanField(
        default=False,
        verbose_name='كشف فجر / فوري (كوتة محجوزة)'
    )
    doctor_notes = models.TextField(
        blank=True,
        default='',
        verbose_name='ملاحظات الطبيب والتشخيص'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاريخ الإنشاء')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='تاريخ التحديث')

    class Meta:
        ordering = ['visit_date', 'queue_number']
        verbose_name = 'موعد / كشف'
        verbose_name_plural = 'المواعيد والكشوفات'

    def __str__(self):
        return f"[{self.queue_number}] {self.patient.name} - {self.get_visit_type_display()} ({self.visit_date} {self.get_shift_display()})"
