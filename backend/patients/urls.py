from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PatientViewSet, PublicPatientRecordView

router = DefaultRouter()
router.register(r'', PatientViewSet, basename='patient')

urlpatterns = [
    path('public-record/<int:pk>/', PublicPatientRecordView.as_view(), name='public-record'),
    path('', include(router.urls)),
]
