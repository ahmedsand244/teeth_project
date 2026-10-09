from django.test import TestCase
from datetime import date, timedelta
from decimal import Decimal
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User, UserRole
from patients.models import Patient, Gender
from appointments.models import Appointment, VisitType, ShiftType, AppointmentStatus
from appointments.queue_engine import is_ortho_token, is_general_token, get_next_queue_number
from billing.models import Invoice


class DentalClinicRulesTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.doctor = User.objects.create_superuser(
            username='dr_test',
            password='password123',
            role=UserRole.DOCTOR
        )
        self.assistant = User.objects.create_user(
            username='ast_test',
            password='password123',
            role=UserRole.ASSISTANT
        )
        self.patient1 = Patient.objects.create(name='أحمد إبراهيم', phone='01011112222', gender=Gender.MALE, age=30)
        self.patient2 = Patient.objects.create(name='مريم سعيد', phone='01033334444', gender=Gender.FEMALE, age=26)

    def test_smart_queue_number_allocation(self):
        # Test token classifier
        self.assertTrue(is_ortho_token(1))
        self.assertTrue(is_ortho_token(5))
        self.assertTrue(is_ortho_token(10))
        self.assertTrue(is_ortho_token(15))
        self.assertFalse(is_ortho_token(2))
        self.assertFalse(is_ortho_token(3))

        self.assertTrue(is_general_token(2))
        self.assertTrue(is_general_token(3))
        self.assertTrue(is_general_token(4))
        self.assertFalse(is_general_token(5))
        self.assertTrue(is_general_token(6))

        # Test incremental sequence allocation
        taken = set()
        # Ortho 1
        t1 = get_next_queue_number(VisitType.ORTHO_NEW_FIT, taken)
        self.assertEqual(t1, 1)
        taken.add(t1)

        # General 2, 3, 4
        t2 = get_next_queue_number(VisitType.GENERAL_CHECKUP, taken)
        self.assertEqual(t2, 2)
        taken.add(t2)
        t3 = get_next_queue_number(VisitType.GENERAL_CHECKUP, taken)
        self.assertEqual(t3, 3)
        taken.add(t3)
        t4 = get_next_queue_number(VisitType.GENERAL_CHECKUP, taken)
        self.assertEqual(t4, 4)
        taken.add(t4)

        # Ortho 5
        t5 = get_next_queue_number(VisitType.ORTHO_FOLLOWUP, taken)
        self.assertEqual(t5, 5)
        taken.add(t5)

        # General 6
        t6 = get_next_queue_number(VisitType.GENERAL_CHECKUP, taken)
        self.assertEqual(t6, 6)
        taken.add(t6)

    def test_friday_blocked(self):
        self.client.force_authenticate(user=self.assistant)
        # Find next Friday (weekday 4)
        d = date.today()
        while d.weekday() != 4:
            d += timedelta(days=1)

        res = self.client.post('/api/appointments/', {
            'patient': self.patient1.id,
            'visit_type': VisitType.GENERAL_CHECKUP,
            'shift': ShiftType.MORNING,
            'visit_date': d.isoformat(),
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("العيادة مغلقة تماماً يوم الجمعة", str(res.data))

    def test_monday_and_thursday_evening_blocked(self):
        self.client.force_authenticate(user=self.assistant)
        # Monday (0)
        d_mon = date.today()
        while d_mon.weekday() != 0:
            d_mon += timedelta(days=1)

        res = self.client.post('/api/appointments/', {
            'patient': self.patient1.id,
            'visit_type': VisitType.GENERAL_CHECKUP,
            'shift': ShiftType.EVENING,
            'visit_date': d_mon.isoformat(),
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("يومي الإثنين والخميس مخصصان للشيفت الصباحي فقط", str(res.data))

    def test_ortho_prerequisite_and_max_limit(self):
        self.client.force_authenticate(user=self.assistant)
        # Choose a Saturday
        d_sat = date.today()
        while d_sat.weekday() != 5:
            d_sat += timedelta(days=1)

        # 1. New patient without prior consultation cannot book Ortho New Fit
        res = self.client.post('/api/appointments/', {
            'patient': self.patient1.id,
            'visit_type': VisitType.ORTHO_NEW_FIT,
            'shift': ShiftType.MORNING,
            'visit_date': d_sat.isoformat(),
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("لا يمكن حجز تركيب تقويم جديد لمريض لم يخضع لكشف واستشارة أولية", str(res.data))

        # 2. Add prior consultation for patient1 and patient2
        Appointment.objects.create(
            patient=self.patient1,
            visit_type=VisitType.GENERAL_CHECKUP,
            shift=ShiftType.MORNING,
            visit_date=d_sat - timedelta(days=2),
            queue_number=2,
            status=AppointmentStatus.COMPLETED
        )
        Appointment.objects.create(
            patient=self.patient2,
            visit_type=VisitType.GENERAL_CHECKUP,
            shift=ShiftType.MORNING,
            visit_date=d_sat - timedelta(days=2),
            queue_number=3,
            status=AppointmentStatus.COMPLETED
        )

        # 3. New fit cannot be booked in Evening
        # Choose a Sunday (which normally allows Evening, but Ortho fit requires Morning)
        d_sun = date.today()
        while d_sun.weekday() != 6:
            d_sun += timedelta(days=1)

        res_eve = self.client.post('/api/appointments/', {
            'patient': self.patient1.id,
            'visit_type': VisitType.ORTHO_NEW_FIT,
            'shift': ShiftType.EVENING,
            'visit_date': d_sun.isoformat(),
        })
        self.assertEqual(res_eve.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("حالات تركيب التقويم الجديد تُحجز حصرياً في الشيفت الصباحي", str(res_eve.data))

        # 4. Book 2 fittings on d_sat Morning -> OK
        res1 = self.client.post('/api/appointments/', {
            'patient': self.patient1.id,
            'visit_type': VisitType.ORTHO_NEW_FIT,
            'shift': ShiftType.MORNING,
            'visit_date': d_sat.isoformat(),
        })
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        res2 = self.client.post('/api/appointments/', {
            'patient': self.patient2.id,
            'visit_type': VisitType.ORTHO_NEW_FIT,
            'shift': ShiftType.MORNING,
            'visit_date': d_sat.isoformat(),
        })
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)

        # 5. Attempt 3rd fitting on same day -> Blocked!
        patient3 = Patient.objects.create(name='ياسر صبري', phone='01188887777')
        Appointment.objects.create(
            patient=patient3,
            visit_type=VisitType.GENERAL_CHECKUP,
            shift=ShiftType.MORNING,
            visit_date=d_sat - timedelta(days=2),
            queue_number=4,
            status=AppointmentStatus.COMPLETED
        )

        res3 = self.client.post('/api/appointments/', {
            'patient': patient3.id,
            'visit_type': VisitType.ORTHO_NEW_FIT,
            'shift': ShiftType.MORNING,
            'visit_date': d_sat.isoformat(),
        })
        self.assertEqual(res3.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("تم الوصول للحد الأقصى لحالات تركيب التقويم الجديد لهذا اليوم", str(res3.data))

    def test_role_based_access_doctor_vs_assistant_analytics(self):
        # 1. Assistant tries to access financial dashboard -> 403 Forbidden!
        self.client.force_authenticate(user=self.assistant)
        res_ast = self.client.get('/api/analytics/dashboard/')
        self.assertEqual(res_ast.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("هذا القسم مخصص للطبيب فقط", str(res_ast.data))

        # 2. Doctor accesses financial dashboard -> 200 OK!
        self.client.force_authenticate(user=self.doctor)
        res_doc = self.client.get('/api/analytics/dashboard/')
        self.assertEqual(res_doc.status_code, status.HTTP_200_OK)
        self.assertIn('day_summary', res_doc.data)
        self.assertIn('shift_breakdown', res_doc.data)
        self.assertIn('treatment_breakdown', res_doc.data)
        self.assertIn('clinic_totals', res_doc.data)

    def test_financial_engine_math_safety(self):
        # Total = 1000, Discount = 150, Paid = 600 -> Net = 850, Remaining = 250
        d_sat = date.today()
        while d_sat.weekday() != 5:
            d_sat += timedelta(days=1)

        self.client.force_authenticate(user=self.assistant)
        res = self.client.post('/api/appointments/', {
            'patient': self.patient1.id,
            'visit_type': VisitType.GENERAL_CHECKUP,
            'shift': ShiftType.MORNING,
            'visit_date': d_sat.isoformat(),
            'initial_total_amount': '1000.00',
            'initial_discount': '150.00',
            'initial_paid_amount': '600.00',
            'initial_invoice_notes': 'خصم خاص'
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        invoice_data = res.data['invoice']
        self.assertEqual(float(invoice_data['total_amount']), 1000.00)
        self.assertEqual(float(invoice_data['discount']), 150.00)
        self.assertEqual(float(invoice_data['net_amount']), 850.00)
        self.assertEqual(float(invoice_data['paid_amount']), 600.00)
        self.assertEqual(float(invoice_data['remaining_amount']), 250.00)
