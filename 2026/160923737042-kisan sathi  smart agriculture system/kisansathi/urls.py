"""
KisanSathi URL Configuration
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.shortcuts import render


def index(request):
    return render(request, 'index.html')


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', index, name='index'),
    path('index.html/', index, name='home'),
    path('accounts/', include('kisanapp.urls.accounts_urls')),
    path('farmer/', include('kisanapp.urls.farmer_urls')),
    path('expert/', include('kisanapp.urls.expert_urls')),
    path('adminpanel/', include('kisanapp.urls.adminpanel_urls')),
    path('ai/', include('kisanapp.urls.ai_urls')),
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) \
  + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
