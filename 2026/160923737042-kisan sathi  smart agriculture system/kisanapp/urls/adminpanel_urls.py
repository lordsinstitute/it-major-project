from django.urls import path
from kisanapp.views.adminpanel_views import (
    dashboard, approve_accounts,
    approve_farmer, approve_expert,
    update_prices, delete_price,
    manage_schemes, delete_scheme,
    view_all_queries,
)

urlpatterns = [
    path('dashboard/', dashboard, name='admin_dashboard'),
    path('approve-accounts/', approve_accounts, name='admin_approve_accounts'),
    path('approve-farmer/<int:farmer_id>/', approve_farmer, name='admin_approve_farmer'),
    path('approve-expert/<int:expert_id>/', approve_expert, name='admin_approve_expert'),
    path('update-prices/', update_prices, name='admin_update_prices'),
    path('delete-price/<int:price_id>/', delete_price, name='admin_delete_price'),
    path('schemes/', manage_schemes, name='admin_schemes'),
    path('delete-scheme/<int:scheme_id>/', delete_scheme, name='admin_delete_scheme'),
    path('queries/', view_all_queries, name='admin_all_queries'),
]
