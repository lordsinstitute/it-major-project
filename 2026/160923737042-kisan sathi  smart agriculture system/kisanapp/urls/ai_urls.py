from django.urls import path
from kisanapp.views.ai_views import (
    ai_dashboard, disease_detection,
    yield_prediction, fertilizer_recommendation, ai_history,
)

urlpatterns = [
    path('', ai_dashboard, name='ai_dashboard'),
    path('disease-detection/', disease_detection, name='ai_disease_detection'),
    path('yield-prediction/', yield_prediction, name='ai_yield_prediction'),
    path('fertilizer/', fertilizer_recommendation, name='ai_fertilizer'),
    path('history/', ai_history, name='ai_history'),
]
