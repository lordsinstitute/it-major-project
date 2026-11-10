
from django.urls import path
from . import views

urlpatterns = [
    path("profile/sync/", views.sync_profile, name="sync-profile"),
    path("public/doctors/", views.public_doctors, name="public-doctors"),
    path("public/hospitals/", views.public_hospitals, name="public-hospitals"),
    path("public/availability/", views.doctor_available_slots, name="doctor-available-slots"),
    path("appointments/book/", views.book_appointment, name="book-appointment"),
    path("patient/overview/", views.patient_overview, name="patient-overview"),
    path("patient/appointments/", views.patient_appointments, name="patient-appointments"),
    path("patient/appointments/<int:appointment_id>/cancel/", views.patient_cancel_appointment, name="patient-cancel-appointment"),
    path("patient/profile/", views.patient_profile, name="patient-profile"),


    path("doctor/appointments/", views.doctor_appointments, name="doctor-appointments"),
    path("doctor/appointments/<int:appointment_id>/decision/", views.doctor_appointment_decision, name="doctor-appointment-decision"),
    path("doctor/overview/", views.doctor_overview, name="doctor-overview"),
    path("doctor/profile/", views.doctor_profile, name="doctor-profile"),
    path("doctor/organizations/", views.doctor_organizations, name="doctor-organizations"),
    path("doctor/availability/", views.doctor_availability, name="doctor-availability"),
    path("doctor/availability/<int:availability_id>/", views.doctor_availability_detail, name="doctor-availability-detail"),
    path("doctor/patients/", views.doctor_patients, name="doctor-patients"),

    path("organization/register/", views.register_organization, name="organization-register"),
    path("superadmin/organizations/", views.superadmin_organization_applications, name="superadmin-organization-applications"),
    path("superadmin/organizations/<int:application_id>/review/", views.review_organization_application, name="review-organization-application"),
    path("superadmin/organizations/<int:application_id>/invite-admin/", views.invite_organization_admin, name="invite-organization-admin"),

    path("organization/<int:organization_id>/dashboard/", views.organization_dashboard_overview, name="organization-dashboard-overview"),

    path("organization/<int:organization_id>/departments/", views.organization_departments, name="organization-departments"),
    path("organization/<int:organization_id>/departments/<int:department_id>/", views.organization_department_detail, name="organization-department-detail"),

    path("organization/<int:organization_id>/doctors/", 
         views.organization_doctors,
           name="organization-doctors"),
    path("organization/<int:organization_id>/doctors/<int:doctor_id>/",
          views.organization_doctor_detail, 
          name="organization-doctor-detail"),
    path("organization/<int:organization_id>/doctors/<int:doctor_id>/departments/", 
         views.assign_doctor_departments, 
         name="assign-doctor-departments"),
    path("organization/<int:organization_id>/doctors/<int:doctor_id>/departments/<int:department_id>/", 
         views.remove_doctor_department, 
         name="remove-doctor-department"),
    path("organization/<int:organization_id>/doctors/<int:doctor_id>/status/",
          views.organization_doctor_status,
            name="organization-doctor-status"),

    # Regenerate doctor activation link
    path(
        "organization/<int:organization_id>/doctors/<int:doctor_id>/activation-link/",
        views.regenerate_doctor_activation_link,
        name="regenerate-doctor-activation-link",
    ),

    path("organization/<int:organization_id>/nurses/", 
         views.organization_nurses, 
         name="organization-nurses"),
    path("organization/<int:organization_id>/nurses/<int:nurse_id>/", 
         views.organization_nurse_detail, 
         name="organization-nurse-detail"),
    path("organization/<int:organization_id>/nurses/<int:nurse_id>/status/", 
         views.organization_nurse_status, 
         name="organization-nurse-status"),

    path("organization/<int:organization_id>/appointments/", 
         views.organization_appointments, 
         name="organization-appointments"),

     
path(
    "organization/<int:organization_id>/availability/",
    views.organization_doctor_availability,
    name="organization-doctor-availability",
),
path(
    "organization/<int:organization_id>/availability/<int:availability_id>/",
    views.organization_doctor_availability_detail,
    name="organization-doctor-availability-detail",
),


    # Nurse endpoints
    path("nurse/overview/", views.nurse_overview, name="nurse-overview"),
    path("nurse/assignments/", views.nurse_assignments, name="nurse-assignments"),
    path("nurse/tasks/<int:task_id>/update/", views.nurse_task_update, name="nurse-task-update"),
    path("nurse/schedule/", views.nurse_schedule, name="nurse-schedule"),
    path("nurse/profile/", views.nurse_profile, name="nurse-profile"),

    # Digital Prescription endpoints
    path("doctor/prescriptions/", views.doctor_prescriptions, name="doctor-prescriptions"),
    path("patient/prescriptions/", views.patient_prescriptions, name="patient-prescriptions"),

    # SuperAdmin Verification & Stats
    path("superadmin/stats/", views.superadmin_stats, name="superadmin-stats"),
    path("superadmin/users/", views.superadmin_users, name="superadmin-users"),
    path("superadmin/doctors/<int:doctor_id>/verify/", views.superadmin_verify_doctor, name="superadmin-verify-doctor"),
    path("superadmin/nurses/<int:nurse_id>/verify/", views.superadmin_verify_nurse, name="superadmin-verify-nurse"),

]
