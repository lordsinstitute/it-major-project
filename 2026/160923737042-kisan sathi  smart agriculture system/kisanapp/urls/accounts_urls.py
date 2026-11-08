from django.urls import path
from kisanapp.views.accounts_views import (
    farmer_signup, farmer_login,
    expert_signup, expert_login,
    admin_login, user_logout,
)

urlpatterns = [
    path('farmer/signup/', farmer_signup, name='farmer_signup'),
    path('farmer/login/', farmer_login, name='farmer_login'),
    path('expert/signup/', expert_signup, name='expert_signup'),
    path('expert/login/', expert_login, name='expert_login'),
    path('admin/login/', admin_login, name='admin_login'),
    path('logout/', user_logout, name='logout'),
]
