from rest_framework import serializers
from django.contrib.auth import authenticate
from django.utils import timezone
import datetime
import random
from .models import User, UserRole, Clinic, SubscriptionStatus


class ClinicSerializer(serializers.ModelSerializer):
    days_remaining = serializers.IntegerField(read_only=True)
    is_subscription_active = serializers.BooleanField(read_only=True)
    doctor_name = serializers.SerializerMethodField()
    members_count = serializers.SerializerMethodField()
    patients_count = serializers.SerializerMethodField()
    subscription_start_date = serializers.DateField(format="%Y-%m-%d", required=False)
    subscription_end_date = serializers.DateField(format="%Y-%m-%d", required=False)

    class Meta:
        model = Clinic
        fields = [
            'id', 'name', 'invite_code', 'phone', 'address',
            'plan_name', 'monthly_price', 'subscription_status',
            'subscription_start_date', 'subscription_end_date',
            'days_remaining', 'is_subscription_active', 'is_active',
            'created_at', 'doctor_name', 'members_count', 'patients_count'
        ]

    def get_doctor_name(self, obj):
        doc = obj.members.filter(role=UserRole.DOCTOR).first()
        return doc.full_name or doc.username if doc else 'غير محدد'

    def get_members_count(self, obj):
        return obj.members.filter(is_approved=True).count()

    def get_patients_count(self, obj):
        return getattr(obj, 'patients', []).count() if hasattr(obj, 'patients') else 0


class UserSerializer(serializers.ModelSerializer):
    is_doctor = serializers.BooleanField(read_only=True)
    is_assistant = serializers.BooleanField(read_only=True)
    is_saas_admin = serializers.BooleanField(read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    clinic_info = ClinicSerializer(source='clinic', read_only=True)
    pending_assistants_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'full_name', 'phone', 'role', 'role_display',
            'is_doctor', 'is_assistant', 'is_saas_admin', 'is_approved',
            'clinic', 'clinic_info', 'pending_assistants_count', 'date_joined'
        ]
        read_only_fields = ['id', 'date_joined']

    def get_pending_assistants_count(self, obj):
        if obj.is_doctor() and obj.clinic:
            return User.objects.filter(clinic=obj.clinic, role=UserRole.ASSISTANT, is_approved=False).count()
        return 0


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        username = attrs.get('username').strip()
        password = attrs.get('password')

        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError("اسم المستخدم أو كلمة المرور غير صحيحة.")
        if not user.is_active:
            raise serializers.ValidationError("تم تعطيل هذا الحساب من قبل الإدارة.")
        
        # Check assistant approval by doctor
        if user.role == UserRole.ASSISTANT and not user.is_approved:
            clinic_name = user.clinic.name if user.clinic else "العيادة"
            raise serializers.ValidationError(
                f"حسابك قيد المراجعة بانتظار موافقة الدكتور في ({clinic_name}). "
                "يرجى التواصل مع الدكتور لاعتماد طلب انضمامك وتفعيل حسابك."
            )

        attrs['user'] = user
        return attrs


class RegisterDoctorSerializer(serializers.Serializer):
    full_name = serializers.CharField(required=True, max_length=255)
    username = serializers.CharField(required=True, max_length=150)
    password = serializers.CharField(required=True, min_length=4, write_only=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    clinic_name = serializers.CharField(required=True, max_length=255)
    clinic_address = serializers.CharField(required=False, allow_blank=True)

    def validate_username(self, value):
        val = value.strip().lower()
        if User.objects.filter(username__iexact=val).exists():
            raise serializers.ValidationError("اسم المستخدم هذا مستخدم بالفعل.")
        return val

    def create(self, validated_data):
        clinic_name = validated_data.pop('clinic_name')
        clinic_address = validated_data.pop('clinic_address', '')
        password = validated_data.pop('password')
        phone = validated_data.get('phone', '')

        # Generate unique invite code
        invite_code = f"CLINIC-{random.randint(1000, 9999)}"
        while Clinic.objects.filter(invite_code=invite_code).exists():
            invite_code = f"CLINIC-{random.randint(1000, 9999)}"

        clinic = Clinic.objects.create(
            name=clinic_name.strip(),
            invite_code=invite_code,
            phone=phone,
            address=clinic_address,
            subscription_end_date=timezone.localdate() + datetime.timedelta(days=30),
            subscription_status=SubscriptionStatus.ACTIVE,
            is_active=True
        )

        user = User.objects.create(
            role=UserRole.DOCTOR,
            clinic=clinic,
            is_approved=True,
            **validated_data
        )
        user.set_password(password)
        user.save()
        return user


class RegisterAssistantSerializer(serializers.Serializer):
    full_name = serializers.CharField(required=True, max_length=255)
    username = serializers.CharField(required=True, max_length=150)
    password = serializers.CharField(required=True, min_length=4, write_only=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    invite_code = serializers.CharField(required=True, max_length=50)

    def validate_username(self, value):
        val = value.strip().lower()
        if User.objects.filter(username__iexact=val).exists():
            raise serializers.ValidationError("اسم المستخدم هذا مستخدم بالفعل.")
        return val

    def validate_invite_code(self, value):
        code = value.strip().upper()
        clinic = Clinic.objects.filter(invite_code__iexact=code).first()
        if not clinic:
            raise serializers.ValidationError("كود انضمام العيادة غير صحيح أو غير موجود.")
        return clinic

    def create(self, validated_data):
        clinic = validated_data.pop('invite_code')
        password = validated_data.pop('password')

        user = User.objects.create(
            role=UserRole.ASSISTANT,
            clinic=clinic,
            is_approved=False, # Needs doctor approval!
            **validated_data
        )
        user.set_password(password)
        user.save()
        return user


class ForgotPasswordSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    phone = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=4, write_only=True)

    def validate(self, attrs):
        username = attrs.get('username').strip()
        phone = attrs.get('phone').strip()

        user = User.objects.filter(username__iexact=username).first()
        if not user:
            raise serializers.ValidationError("اسم المستخدم غير مسجل بالنظام.")
        
        # Normalize phone comparison
        user_phone = (user.phone or '').replace(' ', '').replace('-', '')
        req_phone = phone.replace(' ', '').replace('-', '')
        if not user_phone or user_phone != req_phone:
            raise serializers.ValidationError("رقم الهاتف المدخل لا يتطابق مع رقم الهاتف المسجل لهذا الحساب.")

        attrs['user'] = user
        return attrs


class CreateStaffSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=4, required=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'full_name', 'phone', 'role']
        read_only_fields = ['id']

    def validate_username(self, value):
        val = value.strip().lower()
        if User.objects.filter(username__iexact=val).exists():
            raise serializers.ValidationError("اسم المستخدم هذا مستخدم بالفعل، يرجى اختيار اسم آخر.")
        return val

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.is_approved = True # Direct creation by doctor is auto-approved
        user.save()
        return user
