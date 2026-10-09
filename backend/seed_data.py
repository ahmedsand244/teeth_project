import os
import django
from datetime import date, timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dentflow_backend.settings')
django.setup()

from accounts.models import User, UserRole
from patients.models import Patient, Gender
from appointments.models import Appointment, VisitType, ShiftType, AppointmentStatus
from appointments.queue_engine import get_next_queue_number
from billing.models import Invoice

def seed():
    print("Clearing test data...")
    Invoice.objects.all().delete()
    Appointment.objects.all().delete()
    Patient.objects.all().delete()
    User.objects.all().delete()

    print("Creating Staff Accounts...")
    doctor = User.objects.create_superuser(
        username='doctor',
        password='doctor123',
        full_name='د. أحمد الشناوي',
        phone='01012345678',
        role=UserRole.DOCTOR
    )

    assistant = User.objects.create_user(
        username='assistant',
        password='assistant123',
        full_name='سارة ممدوح (الاستقبال)',
        phone='01198765432',
        role=UserRole.ASSISTANT
    )

    print(f"Users created: Doctor ({doctor.username}), Assistant ({assistant.username})")

    # Determine an active working day (not Friday).
    # If today is Friday, pick tomorrow Saturday
    today = date.today()
    if today.weekday() == 4: # Friday
        active_date = today + timedelta(days=1)
    else:
        active_date = today

    print(f"Seeding demo patients & appointments for date: {active_date}...")

    # Create Patients
    p1 = Patient.objects.create(name='محمد محمود عبد الفتاح', phone='01023456789', gender=Gender.MALE, age=34, notes='يعاني من حساسية البنسلين')
    p2 = Patient.objects.create(name='فاطمة علي حسن', phone='01155443322', gender=Gender.FEMALE, age=28, notes='مريضة سكر، تتابع بانتظام')
    p3 = Patient.objects.create(name='عمر طارق النجار', phone='01233445566', gender=Gender.MALE, age=21, notes='حالة تقويم متابعة دورية')
    p4 = Patient.objects.create(name='نادية مصطفى إبراهيم', phone='01099887766', gender=Gender.FEMALE, age=42, notes='عميل VIP معرفة الدكتور')
    p5 = Patient.objects.create(name='كريم شريف السعيد', phone='01511223344', gender=Gender.MALE, age=19, notes='حالة فجر فوري - وجع ضرس حاد')
    p6 = Patient.objects.create(name='منى كمال البحيري', phone='01077665544', gender=Gender.FEMALE, age=25, notes='استشارة تقويم')

    # Seed Prior Visit for p3 and p6 so Ortho prerequisite passes
    prior_app = Appointment.objects.create(
        patient=p3,
        visit_type=VisitType.GENERAL_CHECKUP,
        shift=ShiftType.MORNING,
        visit_date=active_date - timedelta(days=7 if active_date.weekday() != 4 else 8),
        queue_number=2,
        status=AppointmentStatus.COMPLETED,
        doctor_notes='تم الفحص المبدئي والتأكد من ملاءمة خطة التقويم.'
    )
    Invoice.objects.create(
        visit=prior_app,
        total_amount=Decimal('350.00'),
        discount=Decimal('50.00'),
        paid_amount=Decimal('300.00'),
        notes='خصم كشف مبدئي'
    )

    prior_app6 = Appointment.objects.create(
        patient=p6,
        visit_type=VisitType.GENERAL_CHECKUP,
        shift=ShiftType.MORNING,
        visit_date=active_date - timedelta(days=5),
        queue_number=3,
        status=AppointmentStatus.COMPLETED,
        doctor_notes='تم عمل أشعة بانوراما واستشارة تقويم معتمدة.'
    )
    Invoice.objects.create(
        visit=prior_app6,
        total_amount=Decimal('400.00'),
        discount=Decimal('0.00'),
        paid_amount=Decimal('400.00'),
        notes=''
    )

    # Now let's book today's appointments adhering strictly to smart queue sequence:
    # 1. p6: Orthodontics New Fit -> Token 1 (Ortho designated)
    taken_m = set()
    t1 = get_next_queue_number(VisitType.ORTHO_NEW_FIT, taken_m)
    taken_m.add(t1)
    a1 = Appointment.objects.create(
        patient=p6,
        visit_type=VisitType.ORTHO_NEW_FIT,
        shift=ShiftType.MORNING,
        visit_date=active_date,
        queue_number=t1,
        status=AppointmentStatus.WITH_DOCTOR,
        doctor_notes='جلسة تركيب الأقواس العلوية والسفلية (9:00 صباحاً)'
    )
    Invoice.objects.create(
        visit=a1,
        total_amount=Decimal('3000.00'),
        discount=Decimal('300.00'),
        paid_amount=Decimal('2000.00'),
        notes='خصم تركيب تقويم نقداً'
    )

    # 2. p1: General Checkup -> Token 2
    t2 = get_next_queue_number(VisitType.GENERAL_CHECKUP, taken_m)
    taken_m.add(t2)
    a2 = Appointment.objects.create(
        patient=p1,
        visit_type=VisitType.GENERAL_CHECKUP,
        shift=ShiftType.MORNING,
        visit_date=active_date,
        queue_number=t2,
        status=AppointmentStatus.WAITING,
        doctor_notes=''
    )
    Invoice.objects.create(
        visit=a2,
        total_amount=Decimal('300.00'),
        discount=Decimal('50.00'),
        paid_amount=Decimal('250.00'),
        notes='خصم حبايب'
    )

    # 3. p2: General Checkup -> Token 3
    t3 = get_next_queue_number(VisitType.GENERAL_CHECKUP, taken_m)
    taken_m.add(t3)
    a3 = Appointment.objects.create(
        patient=p2,
        visit_type=VisitType.GENERAL_CHECKUP,
        shift=ShiftType.MORNING,
        visit_date=active_date,
        queue_number=t3,
        status=AppointmentStatus.WAITING,
        doctor_notes=''
    )
    Invoice.objects.create(
        visit=a3,
        total_amount=Decimal('500.00'),
        discount=Decimal('0.00'),
        paid_amount=Decimal('200.00'),
        notes='حشو عصب جلسة أولى - متبقي 300'
    )

    # 4. p5: Dawn Walkin (General Checkup) -> Token 4
    t4 = get_next_queue_number(VisitType.GENERAL_CHECKUP, taken_m)
    taken_m.add(t4)
    a4 = Appointment.objects.create(
        patient=p5,
        visit_type=VisitType.GENERAL_CHECKUP,
        shift=ShiftType.MORNING,
        visit_date=active_date,
        queue_number=t4,
        status=AppointmentStatus.WAITING,
        is_dawn_walkin=True,
        doctor_notes=''
    )
    Invoice.objects.create(
        visit=a4,
        total_amount=Decimal('300.00'),
        discount=Decimal('0.00'),
        paid_amount=Decimal('300.00'),
        notes='كشف فجر مستعجل مسدد بالكامل'
    )

    # 5. p3: Ortho Followup -> Token 5 (Ortho designated)
    t5 = get_next_queue_number(VisitType.ORTHO_FOLLOWUP, taken_m)
    taken_m.add(t5)
    a5 = Appointment.objects.create(
        patient=p3,
        visit_type=VisitType.ORTHO_FOLLOWUP,
        shift=ShiftType.MORNING,
        visit_date=active_date,
        queue_number=t5,
        status=AppointmentStatus.WAITING,
        doctor_notes=''
    )
    Invoice.objects.create(
        visit=a5,
        total_amount=Decimal('400.00'),
        discount=Decimal('50.00'),
        paid_amount=Decimal('350.00'),
        notes='جلسة شد وتغيير أسلاك'
    )

    print("Seed completed successfully!")
    print(f"Allocated Morning Queue Tokens: {sorted(list(taken_m))} -> All following the exact designated slots!")

if __name__ == '__main__':
    seed()
