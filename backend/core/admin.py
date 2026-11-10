from django.contrib import admin

# Register your models here.
from .models import DoctorAvailability, Appointment

@admin.register(DoctorAvailability)
class DoctorAvailabilityAdmin(admin.ModelAdmin):
    list_display = (
        "doctor",
        "organization",
        "weekday",
        "start_time",
        "end_time",
        "slot_duration_minutes",
        "is_active",
    )
    list_filter = ("weekday", "organization", "is_active")
    search_fields = ("doctor__user__username", "organization__name")


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = (
        "patient_name",
        "doctor",
        "organization",
        "appointment_date",
        "start_time",
        "visit_type",
        "status",
    )
    list_filter = ("status", "visit_type", "appointment_date")
    search_fields = (
        "patient_name",
        "patient_phone",
        "doctor__user__username",
    )
    readonly_fields = ("created_at", "updated_at")

    
from .models import (
    User,
    Organization,
    OrganizationMembership,
    Department,
    DoctorProfile,
    NurseProfile,
)


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("username", "email", "role", "phone_number", "is_active")
    list_filter = ("role", "is_active")
    search_fields = ("username", "email", "phone_number")


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "organization_type",
        "city",
        "verification_status",
        "created_at",
    )
    list_filter = ("organization_type", "verification_status", "city")
    search_fields = ("name", "registration_number", "city")


@admin.register(OrganizationMembership)
class OrganizationMembershipAdmin(admin.ModelAdmin):
    list_display = ("user", "organization", "role", "is_active")
    list_filter = ("role", "is_active")
    search_fields = ("user__username", "organization__name")


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("name", "organization", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name", "organization__name")


@admin.register(DoctorProfile)
class DoctorProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "specialization",
        "qualification",
        "experience_years",
        "consultation_fee",
        "is_verified",
    )
    list_filter = ("specialization", "is_verified")
    search_fields = ("user__username", "specialization", "license_number")


@admin.register(NurseProfile)
class NurseProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "qualification", "experience_years", "is_verified")
    list_filter = ("is_verified",)
    search_fields = ("user__username", "license_number")
