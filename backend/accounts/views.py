from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.utils import timezone
from django.db.models import Sum, Count
import datetime

from .models import User, UserRole, Clinic, SubscriptionStatus
from .serializers import (
    LoginSerializer, UserSerializer, ClinicSerializer,
    RegisterDoctorSerializer, RegisterAssistantSerializer,
    ForgotPasswordSerializer, CreateStaffSerializer
)
from .permissions import IsDoctor, IsSaaSAdmin


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        user_data = UserSerializer(user).data

        # Subscription notice if clinic is near expiry or expired
        subscription_warning = None
        if user.clinic and not user.is_saas_admin():
            days = user.clinic.days_remaining()
            if days <= 0:
                subscription_warning = "انتهت فترة اشتراك العيادة. يرجى التواصل مع إدارة المنصة للتجديد."
            elif days <= 7:
                subscription_warning = f"تنبيه: متبقي على انتهاء اشتراك العيادة {days} أيام."

        return Response({
            'token': token.key,
            'user': user_data,
            'subscription_warning': subscription_warning,
            'message': f"مرحباً بك {user.full_name or user.username}"
        }, status=status.HTTP_200_OK)


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            request.user.auth_token.delete()
        except Exception:
            pass
        return Response({'message': 'تم تسجيل الخروج بنجاح'}, status=status.HTTP_200_OK)


class RegisterDoctorView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterDoctorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'message': f"تم تسجيل الطبيب وإنشاء عيادة ({user.clinic.name}) بنجاح! كود انضمام المساعدين: {user.clinic.invite_code}",
            'user': UserSerializer(user).data,
            'token': token.key
        }, status=status.HTTP_201_CREATED)


class RegisterAssistantView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterAssistantSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        assistant = serializer.save()
        return Response({
            'message': f"تم إرسال طلب الانضمام لعيادة ({assistant.clinic.name}) بنجاح! حسابك بانتظار موافقة الدكتور لاعتماده وتفعيله.",
            'pending': True,
            'clinic_name': assistant.clinic.name
        }, status=status.HTTP_201_CREATED)


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        new_password = serializer.validated_data['new_password']
        user.set_password(new_password)
        user.save()
        return Response({
            'message': "تمت استعادة الحساب وتعيين كلمة المرور الجديدة بنجاح. يمكنك تسجيل الدخول الآن."
        }, status=status.HTTP_200_OK)


class PendingAssistantsView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    def get(self, request):
        if not request.user.clinic:
            return Response([])
        pending = User.objects.filter(
            clinic=request.user.clinic, 
            role=UserRole.ASSISTANT, 
            is_approved=False
        ).order_by('-date_joined')
        return Response(UserSerializer(pending, many=True).data)

    def post(self, request):
        assistant_id = request.data.get('assistant_id')
        action = request.data.get('action') # 'approve' or 'reject'

        if not assistant_id or not action:
            return Response({'error': 'بيانات الطلب غير مكتملة'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            assistant = User.objects.get(
                id=assistant_id,
                clinic=request.user.clinic,
                role=UserRole.ASSISTANT
            )
        except User.DoesNotExist:
            return Response({'error': 'طلب المساعد غير موجود'}, status=status.HTTP_404_NOT_FOUND)

        if action == 'approve':
            assistant.is_approved = True
            assistant.is_active = True
            assistant.save()
            return Response({
                'message': f"تم قبول المساعد ({assistant.full_name or assistant.username}) وتفعيل حسابه بالعيادة بنجاح ✓"
            })
        elif action == 'reject':
            assistant_name = assistant.full_name or assistant.username
            assistant.delete()
            return Response({
                'message': f"تم رفض طلب المساعد ({assistant_name}) وحذف الطلب بنجاح."
            })
        
        return Response({'error': 'إجراء غير معروف'}, status=status.HTTP_400_BAD_REQUEST)


class StaffListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Multi-tenant: show staff of user's clinic or all if saas admin
        if request.user.is_saas_admin():
            staff = User.objects.all().order_by('-date_joined')
        elif request.user.clinic:
            staff = User.objects.filter(clinic=request.user.clinic, is_approved=True).order_by('-date_joined')
        else:
            staff = User.objects.filter(id=request.user.id)
        serializer = UserSerializer(staff, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CreateStaffSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        if request.user.clinic:
            user.clinic = request.user.clinic
            user.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'message': f"تم إضافة {'الطبيب' if user.role == UserRole.DOCTOR else 'المساعد'} بنجاح",
            'user': UserSerializer(user).data,
            'token': token.key
        }, status=status.HTTP_201_CREATED)


class StaffDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            if user.id == request.user.id:
                return Response({'error': 'لا يمكنك حذف حسابك الحالي المسجل به'}, status=status.HTTP_400_BAD_REQUEST)
            if not request.user.is_saas_admin() and user.clinic != request.user.clinic:
                return Response({'error': 'ليس لديك صلاحية لحذف موظف في عيادة أخرى'}, status=status.HTTP_403_FORBIDDEN)
            user.delete()
            return Response({'message': 'تم حذف حساب الموظف بنجاح'}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'المستخدم غير موجود'}, status=status.HTTP_404_NOT_FOUND)


# ==========================================
# SaaS Platform Management APIs (لصاحب المنصة)
# ==========================================

class SaaSClinicsView(APIView):
    permission_classes = [IsAuthenticated, IsSaaSAdmin]

    def get(self, request):
        clinics = Clinic.objects.all().order_by('-created_at')
        today = timezone.localdate()

        total_clinics = clinics.count()
        active_clinics = sum(1 for c in clinics if c.is_subscription_active())
        expired_clinics = sum(1 for c in clinics if not c.is_subscription_active())
        expiring_soon = sum(1 for c in clinics if 0 < c.days_remaining() <= 7)
        total_monthly_revenue = sum(float(c.monthly_price) for c in clinics if c.is_active)

        return Response({
            'statistics': {
                'total_clinics': total_clinics,
                'active_clinics': active_clinics,
                'expired_clinics': expired_clinics,
                'expiring_soon': expiring_soon,
                'total_monthly_revenue': total_monthly_revenue,
            },
            'clinics': ClinicSerializer(clinics, many=True).data
        })

    def post(self, request):
        # SaaS Admin directly adds a clinic and its doctor
        data = request.data
        clinic_name = data.get('clinic_name')
        doctor_name = data.get('doctor_name')
        doctor_username = data.get('doctor_username', '').strip().lower()
        doctor_password = data.get('doctor_password')
        phone = data.get('phone', '')
        days = int(data.get('days', 30))
        plan_name = data.get('plan_name', 'الاشتراك الشهري')
        monthly_price = float(data.get('monthly_price', 500))

        if not clinic_name or not doctor_username or not doctor_password:
            return Response({'error': 'يرجى إدخال اسم العيادة واسم مستخدم الطبيب وكلمة المرور'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username__iexact=doctor_username).exists():
            return Response({'error': 'اسم مستخدم الطبيب موجود مسبقاً'}, status=status.HTTP_400_BAD_REQUEST)

        import random
        invite_code = f"CLINIC-{random.randint(1000, 9999)}"
        while Clinic.objects.filter(invite_code=invite_code).exists():
            invite_code = f"CLINIC-{random.randint(1000, 9999)}"

        clinic = Clinic.objects.create(
            name=clinic_name,
            invite_code=invite_code,
            phone=phone,
            plan_name=plan_name,
            monthly_price=monthly_price,
            subscription_end_date=timezone.localdate() + datetime.timedelta(days=days),
            subscription_status=SubscriptionStatus.ACTIVE,
            is_active=True
        )

        doctor = User.objects.create(
            username=doctor_username,
            full_name=doctor_name or clinic_name,
            phone=phone,
            role=UserRole.DOCTOR,
            clinic=clinic,
            is_approved=True
        )
        doctor.set_password(doctor_password)
        doctor.save()

        return Response({
            'message': f"تم إنشاء عيادة ({clinic.name}) وحساب الدكتور بنجاح! كود الانضمام: {clinic.invite_code}",
            'clinic': ClinicSerializer(clinic).data
        }, status=status.HTTP_201_CREATED)


class SaaSRenewSubscriptionView(APIView):
    permission_classes = [IsAuthenticated, IsSaaSAdmin]

    def post(self, request, pk):
        try:
            clinic = Clinic.objects.get(pk=pk)
        except Clinic.DoesNotExist:
            return Response({'error': 'العيادة غير موجودة'}, status=status.HTTP_404_NOT_FOUND)

        days = int(request.data.get('days', 30))
        today = timezone.localdate()

        # If already expired, extend from today; otherwise extend from current end date
        if not clinic.subscription_end_date or clinic.subscription_end_date < today:
            new_end = today + datetime.timedelta(days=days)
        else:
            new_end = clinic.subscription_end_date + datetime.timedelta(days=days)

        clinic.subscription_end_date = new_end
        clinic.subscription_status = SubscriptionStatus.ACTIVE
        clinic.is_active = True
        clinic.save()

        return Response({
            'message': f"تم تجديد اشتراك عيادة ({clinic.name}) بنجاح لمدة {days} يوم حتى ({new_end}) ✓",
            'clinic': ClinicSerializer(clinic).data
        })


class SaaSToggleClinicView(APIView):
    permission_classes = [IsAuthenticated, IsSaaSAdmin]

    def post(self, request, pk):
        try:
            clinic = Clinic.objects.get(pk=pk)
        except Clinic.DoesNotExist:
            return Response({'error': 'العيادة غير موجودة'}, status=status.HTTP_404_NOT_FOUND)

        clinic.is_active = not clinic.is_active
        if not clinic.is_active:
            clinic.subscription_status = SubscriptionStatus.SUSPENDED
        else:
            clinic.subscription_status = SubscriptionStatus.ACTIVE
        clinic.save()

        status_text = "تفعيل" if clinic.is_active else "تجميد / إيقاف"
        return Response({
            'message': f"تم {status_text} عيادة ({clinic.name}) بنجاح.",
            'clinic': ClinicSerializer(clinic).data
        })


class SaaSDeleteClinicView(APIView):
    permission_classes = [IsAuthenticated, IsSaaSAdmin]

    def delete(self, request, pk):
        try:
            clinic = Clinic.objects.get(pk=pk)
        except Clinic.DoesNotExist:
            return Response({'error': 'العيادة غير موجودة'}, status=status.HTTP_404_NOT_FOUND)

        clinic_name = clinic.name
        # Delete associated users of this clinic (except SaaS Admin)
        User.objects.filter(clinic=clinic).exclude(role=UserRole.SAAS_ADMIN).delete()
        clinic.delete()

        return Response({
            'message': f"تم حذف عيادة ({clinic_name}) وحساب الطبيب وكافة بياناتها نهائياً بنجاح ✓"
        }, status=status.HTTP_200_OK)



class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        if not new_password or len(new_password) < 4:
            return Response({'error': 'كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Non-admin users must verify their old password
        if not request.user.is_saas_admin():
            if not old_password:
                return Response({'error': 'يرجى إدخال كلمة المرور الحالية'}, status=status.HTTP_400_BAD_REQUEST)
            if not request.user.check_password(old_password):
                return Response({'error': 'كلمة المرور الحالية غير صحيحة'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            # If admin supplied old_password, verify it
            if old_password and not request.user.check_password(old_password):
                return Response({'error': 'كلمة المرور الحالية غير صحيحة'}, status=status.HTTP_400_BAD_REQUEST)
                
        request.user.set_password(new_password)
        request.user.save()
        return Response({'message': 'تم تحديث كلمة المرور بنجاح ✓'}, status=status.HTTP_200_OK)


class ClinicSettingsView(APIView):
    """
    Allows the clinic doctor or staff to view and update clinic settings,
    including the clinic contact phone number displayed on tickets and medical records.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.clinic:
            return Response({'error': 'المستخدم غير مرتبط بعيادة'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ClinicSerializer(request.user.clinic).data)

    def patch(self, request):
        clinic = request.user.clinic
        if not clinic:
            return Response({'error': 'المستخدم غير مرتبط بعيادة'}, status=status.HTTP_400_BAD_REQUEST)

        phone = request.data.get('phone')
        name = request.data.get('name')
        address = request.data.get('address')

        if phone is not None:
            clinic.phone = str(phone).strip()
        if name is not None and str(name).strip():
            clinic.name = str(name).strip()
        if address is not None:
            clinic.address = str(address).strip()

        clinic.save()
        return Response({
            'message': 'تم حفظ بيانات وهاتف العيادة بنجاح ✓',
            'clinic': ClinicSerializer(clinic).data
        }, status=status.HTTP_200_OK)


