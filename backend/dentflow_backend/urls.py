"""
URL configuration for dentflow_backend project.
"""

from django.contrib import admin
from django.urls import path, include, re_path
from django.http import JsonResponse, HttpResponse
from django.conf import settings


def root_health(request):
    return JsonResponse({
        'system': 'DentFlow Pro Dental Clinic OS',
        'status': 'online',
        'version': '1.0.0',
        'engine': 'Django 6.1 + DRF',
        'author': 'Antigravity Principal Engineering'
    })


def serve_react_app(request):
    """
    Serves the compiled React Frontend (dist/index.html) if present.
    Allows running both Django backend and React frontend seamlessly
    on a single domain (such as PythonAnywhere).
    """
    dist_index = settings.BASE_DIR.parent / 'frontend' / 'dist' / 'index.html'
    if dist_index.exists():
        with open(dist_index, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read(), content_type='text/html')
    return root_health(request)


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/patients/', include('patients.urls')),
    path('api/appointments/', include('appointments.urls')),
    path('api/billing/', include('billing.urls')),
    path('api/analytics/', include('analytics.urls')),
    # Single-Page Application (React) fallback
    re_path(r'^(?!api/|admin/|static/|assets/).*$', serve_react_app, name='react_spa'),
]
