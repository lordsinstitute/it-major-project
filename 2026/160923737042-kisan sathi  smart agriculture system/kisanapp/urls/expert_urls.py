from django.urls import path
from kisanapp.views.expert_views import (
    dashboard, upload_guide, view_guides,
    view_queries, respond_query, ai_suggestion_verify,
)

urlpatterns = [
    path('dashboard/', dashboard, name='expert_dashboard'),
    path('upload-guide/', upload_guide, name='expert_upload_guide'),
    path('guides/', view_guides, name='expert_guides'),
    path('queries/', view_queries, name='expert_queries'),
    path('queries/<int:query_id>/respond/', respond_query, name='expert_respond_query'),
    path('ai-verify/', ai_suggestion_verify, name='expert_ai_verify'),
]
