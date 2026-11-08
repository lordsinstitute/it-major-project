from django.urls import path
from kisanapp.views.farmer_views import (
    dashboard, view_schemes, view_crop_prices,
    post_query, query_result, view_guides,
    connect_farmers, chatbot, chatbot_api,
)

urlpatterns = [
    path('dashboard/', dashboard, name='farmer_dashboard'),
    path('schemes/', view_schemes, name='farmer_schemes'),
    path('crop-prices/', view_crop_prices, name='farmer_crop_prices'),
    path('post-query/', post_query, name='farmer_post_query'),
    path('query-result/', query_result, name='farmer_query_result'),
    path('guides/', view_guides, name='farmer_guides'),
    path('connect/', connect_farmers, name='farmer_connect'),
    path('chatbot/', chatbot, name='farmer_chatbot'),
    path('chatbot/api/', chatbot_api, name='chatbot_api'),
]
