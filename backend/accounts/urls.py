from django.urls import path
from .views import (
    LoginView, CurrentUserView, LogoutView,
    RegisterDoctorView, RegisterAssistantView, ForgotPasswordView,
    PendingAssistantsView, StaffListCreateView, StaffDetailView,
    SaaSClinicsView, SaaSRenewSubscriptionView, SaaSToggleClinicView,
    SaaSDeleteClinicView, ChangePasswordView
)

urlpatterns = [
    # Auth
    path('login/', LoginView.as_view(), name='login'),
    path('me/', CurrentUserView.as_view(), name='current_user'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    
    # Registration & Join Flows
    path('register-doctor/', RegisterDoctorView.as_view(), name='register_doctor'),
    path('register-assistant/', RegisterAssistantView.as_view(), name='register_assistant'),
    
    # Doctor Approval on Assistants
    path('pending-assistants/', PendingAssistantsView.as_view(), name='pending_assistants'),
    
    # Staff Management inside Clinic
    path('staff/', StaffListCreateView.as_view(), name='staff_list_create'),
    path('staff/<int:pk>/', StaffDetailView.as_view(), name='staff_detail'),
    
    # SaaS Platform Owner Endpoints (لصاحب الموقع)
    path('saas/clinics/', SaaSClinicsView.as_view(), name='saas_clinics'),
    path('saas/renew-subscription/<int:pk>/', SaaSRenewSubscriptionView.as_view(), name='saas_renew'),
    path('saas/toggle-clinic/<int:pk>/', SaaSToggleClinicView.as_view(), name='saas_toggle'),
    path('saas/delete-clinic/<int:pk>/', SaaSDeleteClinicView.as_view(), name='saas_delete_clinic'),
]
