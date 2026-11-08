from django.contrib import admin
from .models import (
    UserProfile, FarmerProfile, ExpertProfile,
    Query, Response, ChatbotFAQ,
    Guide,
    CropPrice, Scheme,
    AIResult,
)

admin.site.register(UserProfile)
admin.site.register(FarmerProfile)
admin.site.register(ExpertProfile)
admin.site.register(Query)
admin.site.register(Response)
admin.site.register(ChatbotFAQ)
admin.site.register(Guide)
admin.site.register(CropPrice)
admin.site.register(Scheme)
admin.site.register(AIResult)
