from django.utils import timezone

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        SUPER_ADMIN = "SUPER_ADMIN", "Super Admin"
        ORGANIZATION_ADMIN = "ORGANIZATION_ADMIN", "Organization Admin"
        DOCTOR = "DOCTOR", "Doctor"
        NURSE = "NURSE", "Nurse"
        PATIENT = "PATIENT", "Patient"

    email = models.EmailField(unique=True)
    supabase_uid = models.UUIDField(
    null=True,
    blank=True,
    unique=True,
    editable=False,
)
    phone_number = models.CharField(max_length=20, blank=True)
    role = models.CharField(
        max_length=30,
        choices=Role.choices,
        default=Role.PATIENT,
    )

    def __str__(self):
        return f"{self.username} ({self.role})"

class Organization(models.Model):
    class OrganizationType(models.TextChoices):
        HOSPITAL = "HOSPITAL", "Hospital"
        CLINIC = "CLINIC", "Clinic"

    class VerificationStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    name = models.CharField(max_length=200)
    organization_type = models.CharField(
        max_length=20,
        choices=OrganizationType.choices,
    )
    registration_number = models.CharField(
        max_length=100,
        unique=True,
    )
    email = models.EmailField()
    phone_number = models.CharField(max_length=20)
    address_line = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    verification_status = models.CharField(
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING,
    )
    created_by = models.ForeignKey(
        "core.User",
        on_delete=models.PROTECT,
        related_name="created_organizations",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class OrganizationApplication(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    # Organization details
    organization_name = models.CharField(max_length=200)
    organization_type = models.CharField(
        max_length=20,
        choices=Organization.OrganizationType.choices,
    )
    registration_number = models.CharField(max_length=100, unique=True)
    organization_email = models.EmailField()
    organization_phone = models.CharField(max_length=20)
    address_line = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)

    # Organization admin details
    admin_full_name = models.CharField(max_length=150)
    admin_email = models.EmailField()
    admin_phone = models.CharField(max_length=20)

    # Verification document URL (private storage)
    verification_document_url = models.URLField(
        max_length=1000,
        blank=True,
    )

    # Application review
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    rejection_reason = models.TextField(blank=True)

    reviewed_by = models.ForeignKey(
        "core.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_organization_applications",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    organization = models.OneToOneField(
        Organization,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="application",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return (
            f"{self.organization_name} - {self.status}"
        )


class OrganizationMembership(models.Model):
    class MembershipRole(models.TextChoices):
        ORGANIZATION_ADMIN = "ORGANIZATION_ADMIN", "Organization Admin"
        DOCTOR = "DOCTOR", "Doctor"
        NURSE = "NURSE", "Nurse"

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    user = models.ForeignKey(
        "core.User",
        on_delete=models.CASCADE,
        related_name="organization_memberships",
    )
    role = models.CharField(max_length=30, choices=MembershipRole.choices)
    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "user"],
                name="unique_organization_membership",
            )
        ]

    def __str__(self):
        return f"{self.user} - {self.organization}"


class Department(models.Model):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="departments",
    )
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "name"],
                name="unique_department_per_organization",
            )
        ]

    def __str__(self):
        return f"{self.name} - {self.organization.name}"


class DoctorProfile(models.Model):
    user = models.OneToOneField(
        "core.User",
        on_delete=models.CASCADE,
        related_name="doctor_profile",
    )
    specialization = models.CharField(max_length=120)
    qualification = models.CharField(max_length=200)
    license_number = models.CharField(max_length=100, unique=True)
    experience_years = models.PositiveSmallIntegerField(default=0)
    consultation_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )
    bio = models.TextField(blank=True)
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"Dr. {self.user.get_full_name()}"


class NurseProfile(models.Model):
    user = models.OneToOneField(
        "core.User",
        on_delete=models.CASCADE,
        related_name="nurse_profile",
    )
    qualification = models.CharField(max_length=200)
    license_number = models.CharField(max_length=100, unique=True)
    experience_years = models.PositiveSmallIntegerField(default=0)
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return self.user.get_full_name() or self.user.username


class DoctorAvailability(models.Model):
    """
    Defines a doctor's recurring working hours
    at a particular hospital or clinic.
    """

    class Weekday(models.IntegerChoices):
        MONDAY = 0, "Monday"
        TUESDAY = 1, "Tuesday"
        WEDNESDAY = 2, "Wednesday"
        THURSDAY = 3, "Thursday"
        FRIDAY = 4, "Friday"
        SATURDAY = 5, "Saturday"
        SUNDAY = 6, "Sunday"

    doctor = models.ForeignKey(
        DoctorProfile,
        on_delete=models.CASCADE,
        related_name="availabilities",
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="doctor_availabilities",
    )
    weekday = models.PositiveSmallIntegerField(choices=Weekday.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()
    slot_duration_minutes = models.PositiveSmallIntegerField(default=30)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["weekday", "start_time"]
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "doctor",
                    "organization",
                    "weekday",
                    "start_time",
                ],
                name="unique_doctor_availability",
            ),
            models.CheckConstraint(
                condition=models.Q(end_time__gt=models.F("start_time")),
                name="availability_end_after_start",
            ),
            models.CheckConstraint(
                condition=models.Q(slot_duration_minutes__gt=0),
                name="availability_slot_duration_positive",
            ),
        ]

    def __str__(self):
        return (
            f"Dr. {self.doctor.user.get_full_name()} - "
            f"{self.organization.name} - "
            f"{self.get_weekday_display()}"
        )


class DoctorDepartment(models.Model):
    """
    Connects a doctor to one or more departments
    within a specific organization.
    """

    doctor = models.ForeignKey(
        DoctorProfile,
        on_delete=models.CASCADE,
        related_name="department_assignments",
    )

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="doctor_department_assignments",
    )

    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name="doctor_assignments",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["doctor", "organization", "department"],
                name="unique_doctor_department_assignment",
            )
        ]

    def __str__(self):
        return (
            f"{self.doctor.user.get_full_name()} - "
            f"{self.department.name} - "
            f"{self.organization.name}"
        )


class Appointment(models.Model):
    class VisitType(models.TextChoices):
        HOSPITAL = "HOSPITAL", "Hospital Visit"
        HOME = "HOME", "Home Visit"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        CONFIRMED = "CONFIRMED", "Confirmed"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"
        REJECTED = "REJECTED", "Rejected"

    patient = models.ForeignKey(
        "core.User",
        on_delete=models.PROTECT,
        related_name="patient_appointments",
    )
    doctor = models.ForeignKey(
        DoctorProfile,
        on_delete=models.PROTECT,
        related_name="appointments",
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.PROTECT,
        related_name="appointments",
    )

    appointment_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()

    visit_type = models.CharField(
        max_length=20,
        choices=VisitType.choices,
        default=VisitType.HOSPITAL,
    )

    patient_name = models.CharField(max_length=150)
    patient_age = models.PositiveSmallIntegerField()
    patient_gender = models.CharField(max_length=20)
    patient_phone = models.CharField(max_length=20)

    existing_conditions = models.TextField(blank=True)
    reason_for_visit = models.TextField()

    home_address = models.TextField(blank=True)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-appointment_date", "-start_time"]
        constraints = [
    models.UniqueConstraint(
        fields=["doctor", "appointment_date", "start_time"],
        condition=models.Q(status__in=["PENDING", "CONFIRMED"]),
        name="unique_active_doctor_appointment_start",
    ),
    models.CheckConstraint(
        condition=models.Q(end_time__gt=models.F("start_time")),
        name="appointment_end_after_start",
    ),
]

    def __str__(self):
        return (
            f"{self.patient_name} - "
            f"Dr. {self.doctor.user.get_full_name()} - "
            f"{self.appointment_date}"
        )


class Prescription(models.Model):
    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.CASCADE,
        related_name="prescriptions",
        null=True,
        blank=True,
    )
    doctor = models.ForeignKey(
        DoctorProfile,
        on_delete=models.CASCADE,
        related_name="issued_prescriptions",
    )
    patient = models.ForeignKey(
        "core.User",
        on_delete=models.CASCADE,
        related_name="patient_prescriptions",
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="prescriptions",
    )
    patient_name = models.CharField(max_length=150, blank=True)
    diagnosis = models.TextField()
    medicines = models.JSONField(default=list)
    instructions = models.TextField(blank=True)
    prescribed_date = models.DateField(default=timezone.localdate)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Rx #{self.id} for {self.patient_name or self.patient.get_full_name()} by Dr. {self.doctor.user.get_full_name()}"


class CareTask(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        COMPLETED = "COMPLETED", "Completed"

    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.CASCADE,
        related_name="care_tasks",
        null=True,
        blank=True,
    )
    assigned_nurse = models.ForeignKey(
        NurseProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tasks",
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="care_tasks",
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="care_tasks",
    )
    patient_name = models.CharField(max_length=150, blank=True)
    task_description = models.CharField(max_length=255)
    vitals = models.JSONField(default=dict, blank=True)
    notes = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"CareTask #{self.id} - {self.task_description} ({self.status})"
