from rest_framework.permissions import BasePermission
from .models import UserRole


class IsDoctor(BasePermission):
    """
    Allows access only to authenticated Doctors or Superusers.
    Strictly forbids Assistants.
    """
    message = "هذا القسم مخصص للطبيب فقط. غير مصرح للمساعد بالاطلاع على هذه البيانات المالية أو الحساسة."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.role == UserRole.DOCTOR or request.user.is_superuser


class IsAssistantOrDoctor(BasePermission):
    """
    Allows access to Doctors and Assistants for daily reception workflow.
    """
    message = "يجب تسجيل الدخول كمساعد أو طبيب لتنفيذ هذا الإجراء."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.role in [UserRole.ASSISTANT, UserRole.DOCTOR] or request.user.is_superuser


class IsAssistant(BasePermission):
    """
    Allows access specifically to assistants (and doctors).
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)


class IsSaaSAdmin(BasePermission):
    """
    Allows access only to the SaaS Platform Owner / Superuser.
    """
    message = "هذا القسم مخصص لإدارة المنصة وصاحب الموقع (SaaS) فقط."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.is_saas_admin()

