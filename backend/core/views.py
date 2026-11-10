import logging
import re
import os
from datetime import datetime, timedelta
import secrets
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from supabase import create_client

from decimal import Decimal, InvalidOperation
from django.core.validators import validate_email
from django.core.exceptions import ValidationError

from .models import (
    DoctorProfile,
    NurseProfile,
    Department,
    Organization,
    OrganizationApplication,
    OrganizationMembership,
    DoctorAvailability,
    Appointment,
    DoctorDepartment,
    Prescription,
    CareTask,
)


def get_supabase_admin_client():
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SECRET_KEY,
    )

logger = logging.getLogger(__name__)
User = get_user_model()


def get_supabase_user(access_token):
    """
    Validate the Supabase access token and return the authenticated user.
    """
    supabase_url = getattr(settings, "SUPABASE_URL", "")
    supabase_key = getattr(settings, "SUPABASE_PUBLISHABLE_KEY", "")

    if not supabase_url or not supabase_key:
        raise RuntimeError(
            "Supabase environment variables are not configured."
        )

    client = create_client(supabase_url, supabase_key)
    response = client.auth.get_user(access_token)

    if not response or not response.user:
        return None

    return response.user


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def sync_profile(request):
    """
    Synchronize the authenticated Supabase user with Django's User model.
    The Supabase access token must be sent in the Authorization header.
    """

    # 1. Read the access token from the request
    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        return Response(
            {"error": "Missing Bearer access token."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    access_token = auth_header.split(" ", 1)[1].strip()

    if not access_token:
        return Response(
            {"error": "Missing access token."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # 2. Validate the token with Supabase
    try:
        auth_user = get_supabase_user(access_token)

    except RuntimeError:
        logger.exception("Supabase configuration error.")

        return Response(
            {"error": "Authentication service is not configured."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    except Exception:
        logger.warning(
            "Supabase access-token validation failed.",
            exc_info=True,
        )

        return Response(
            {"error": "Invalid or expired access token."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if auth_user is None:
        return Response(
            {"error": "Invalid or expired access token."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # 3. Extract authenticated user information
    supabase_uid = str(auth_user.id)
    email = (auth_user.email or "").strip().lower()

    if not email:
        return Response(
            {"error": "The Supabase account has no email address."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    metadata = auth_user.user_metadata or {}

    full_name = str(metadata.get("full_name") or "").strip()
    phone_number = str(metadata.get("phone_number") or "").strip()

    # 4. Create or update the Django user
    try:
        with transaction.atomic():

            # First, find the user by Supabase UID
            user = User.objects.filter(
                supabase_uid=supabase_uid
            ).first()

            # If not found, try matching by email
            if user is None:
                user = User.objects.filter(
                    email__iexact=email
                ).first()

            # Create a new Django user if necessary
            if user is None:
                base_username = email.split("@", 1)[0][:120] or "patient"
                username = base_username
                suffix = 1

                while User.objects.filter(username=username).exists():
                    username = f"{base_username[:110]}_{suffix}"
                    suffix += 1

                user = User(
                    username=username,
                    email=email,
                    role=User.Role.PATIENT,
                )

                user.set_unusable_password()

            # Link the Django account to Supabase
            user.supabase_uid = supabase_uid
            user.email = email

            # Update name when supplied
            if full_name:
                user.first_name = full_name[:150]

            # Update phone number when supplied
            if phone_number:
                user.phone_number = phone_number[:20]

            user.save()

    except IntegrityError:
        logger.exception(
            "Could not synchronize the Mediqo user profile."
        )

        return Response(
            {
                "error": (
                    "Could not synchronize the user profile. "
                    "Please retry."
                )
            },
            status=status.HTTP_409_CONFLICT,
        )

    except Exception:
        logger.exception("Unexpected error during profile synchronization.")

        return Response(
            {"error": "An unexpected profile synchronization error occurred."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # 5. Return the synchronized profile
    return Response(
        {
            "id": user.id,
            "supabase_uid": str(user.supabase_uid),
            "email": user.email,
            "full_name": user.get_full_name(),
            "phone_number": user.phone_number,
            "role": user.role,
        },
        status=status.HTTP_200_OK,
    )
#public doctor directory
@api_view(["GET"])
@permission_classes([AllowAny])
def public_doctors(request):
    """
    Public directory of verified doctors belonging to
    approved hospitals or clinics.
    """

    doctors = (
        DoctorProfile.objects
        .filter(
            is_verified=True,
            user__role="DOCTOR",
            user__organization_memberships__is_active=True,
            user__organization_memberships__role="DOCTOR",
            user__organization_memberships__organization__verification_status="APPROVED",
        )
        .select_related("user")
        .prefetch_related(
            "user__organization_memberships__organization"
        )
        .distinct()
    )

    # Search by doctor name or specialization
    search = request.query_params.get("search", "").strip()

    if search:
        doctors = doctors.filter(
            Q(user__first_name__icontains=search)
            | Q(user__last_name__icontains=search)
            | Q(user__username__icontains=search)
            | Q(specialization__icontains=search)
        )

    # Filter by specialization
    specialization = request.query_params.get(
        "specialization", ""
    ).strip()

    if specialization:
        doctors = doctors.filter(
            specialization__icontains=specialization
        )

    # Filter by city
    city = request.query_params.get("city", "").strip()

    if city:
        doctors = doctors.filter(
            user__organization_memberships__organization__city__icontains=city
        )

    # Filter by minimum consultation fee
    min_fee = request.query_params.get("min_fee")

    if min_fee:
        try:
            doctors = doctors.filter(
                consultation_fee__gte=float(min_fee)
            )
        except ValueError:
            return Response(
                {"error": "Invalid minimum fee."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    # Filter by maximum consultation fee
    max_fee = request.query_params.get("max_fee")

    if max_fee:
        try:
            doctors = doctors.filter(
                consultation_fee__lte=float(max_fee)
            )
        except ValueError:
            return Response(
                {"error": "Invalid maximum fee."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    results = []

    for doctor in doctors:
        user = doctor.user

        memberships = (
            user.organization_memberships
            .filter(
                is_active=True,
                role="DOCTOR",
                organization__verification_status="APPROVED",
            )
            .select_related("organization")
        )

        organizations = []

        for membership in memberships:
            organization = membership.organization

            organizations.append({
                "id": organization.id,
                "name": organization.name,
                "type": organization.organization_type,
                "city": organization.city,
                "state": organization.state,
            })

        results.append({
            "id": doctor.id,
            "name": user.get_full_name() or user.username,
            "specialization": doctor.specialization,
            "qualification": doctor.qualification,
            "experience_years": doctor.experience_years,
            "consultation_fee": str(doctor.consultation_fee),
            "bio": doctor.bio,
            "organizations": organizations,
        })

    return Response({
        "count": len(results),
        "results": results,
    })

#public hospital and clinic directory
@api_view(["GET"])
@permission_classes([AllowAny])
def public_hospitals(request):
    """
    Public directory of approved hospitals and clinics.
    """

    organizations = (
        Organization.objects
        .filter(
            verification_status="APPROVED"
        )
        .prefetch_related("departments")
        .order_by("name")
    )

    # Search by hospital or clinic name
    search = request.query_params.get("search", "").strip()

    if search:
        organizations = organizations.filter(
            Q(name__icontains=search)
            | Q(city__icontains=search)
            | Q(state__icontains=search)
        )

    # Filter by city
    city = request.query_params.get("city", "").strip()

    if city:
        organizations = organizations.filter(
            city__icontains=city
        )

    # Filter by organization type
    organization_type = request.query_params.get(
        "type", ""
    ).strip().upper()

    if organization_type:
        if organization_type not in ["HOSPITAL", "CLINIC"]:
            return Response(
                {"error": "Type must be HOSPITAL or CLINIC."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        organizations = organizations.filter(
            organization_type=organization_type
        )

    results = []

    for organization in organizations:
        departments = organization.departments.filter(
            is_active=True
        )

        doctor_count = OrganizationMembership.objects.filter(
            organization=organization,
            role="DOCTOR",
            is_active=True,
            user__role="DOCTOR",
            user__doctor_profile__is_verified=True,
        ).count()

        results.append({
            "id": organization.id,
            "name": organization.name,
            "type": organization.organization_type,
            "address": organization.address_line,
            "city": organization.city,
            "state": organization.state,
            "postal_code": organization.postal_code,
            "latitude": (
                str(organization.latitude)
                if organization.latitude is not None
                else None
            ),
            "longitude": (
                str(organization.longitude)
                if organization.longitude is not None
                else None
            ),
            "departments": [
                department.name
                for department in departments
            ],
            "doctor_count": doctor_count,
        })

    return Response({
        "count": len(results),
        "results": results,
    })




@api_view(["GET"])
@permission_classes([AllowAny])
def doctor_available_slots(request):
    doctor_id = request.query_params.get("doctor_id")
    organization_id = request.query_params.get("organization_id")
    date_value = request.query_params.get("date")

    if not all([doctor_id, organization_id, date_value]):
        return Response(
            {"error": "doctor_id, organization_id and date are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        selected_date = datetime.strptime(
            date_value, "%Y-%m-%d"
        ).date()
        doctor_id = int(doctor_id)
        organization_id = int(organization_id)
    except (ValueError, TypeError):
        return Response(
            {"error": "Invalid doctor, organization or date."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if selected_date < timezone.localdate():
        return Response(
            {"error": "Past dates are not allowed."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        doctor = DoctorProfile.objects.get(
            id=doctor_id,
            is_verified=True,
            user__role="DOCTOR",
        )

        organization = Organization.objects.get(
            id=organization_id,
            verification_status=Organization.VerificationStatus.APPROVED,
        )

    except (DoctorProfile.DoesNotExist, Organization.DoesNotExist):
        return Response(
            {"error": "Doctor or organization not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    membership_exists = OrganizationMembership.objects.filter(
        user=doctor.user,
        organization=organization,
        role=OrganizationMembership.MembershipRole.DOCTOR,
        is_active=True,
    ).exists()

    if not membership_exists:
        return Response(
            {"error": "Doctor is not associated with this organization."},
            status=status.HTTP_404_NOT_FOUND,
        )

    schedules = DoctorAvailability.objects.filter(
        doctor=doctor,
        organization=organization,
        weekday=selected_date.weekday(),
        is_active=True,
    ).order_by("start_time")

    booked_appointments = Appointment.objects.filter(
        doctor=doctor,
        appointment_date=selected_date,
        status__in=[
            Appointment.Status.PENDING,
            Appointment.Status.CONFIRMED,
        ],
    )

    booked_intervals = list(
        booked_appointments.values_list("start_time", "end_time")
    )

    slots = []

    current_time = timezone.localtime().time().replace(tzinfo=None)
    today = timezone.localdate()

    for schedule in schedules:
        slot_start = datetime.combine(
            selected_date, schedule.start_time
        )
        schedule_end = datetime.combine(
            selected_date, schedule.end_time
        )

        duration = timedelta(
            minutes=schedule.slot_duration_minutes
        )

        while slot_start + duration <= schedule_end:
            slot_end = slot_start + duration

            start_time = slot_start.time()
            end_time = slot_end.time()

            is_booked = any(
                booked_start < end_time and booked_end > start_time
                for booked_start, booked_end in booked_intervals
            )

            is_past = (
                selected_date == today
                and start_time <= current_time
            )

            if is_booked:
                slot_status = "BOOKED"
            elif is_past:
                slot_status = "PAST"
            else:
                slot_status = "AVAILABLE"

            slots.append({
                "start_time": start_time.strftime("%H:%M"),
                "end_time": end_time.strftime("%H:%M"),
                "status": slot_status,
                "is_available": slot_status == "AVAILABLE",
            })

            slot_start = slot_end

    available_slots = [
        slot for slot in slots
        if slot["status"] == "AVAILABLE"
    ]

    return Response(
        {
            "doctor_id": doctor.id,
            "doctor_name": (
                doctor.user.get_full_name()
                or doctor.user.username
            ),
            "organization_id": organization.id,
            "organization_name": organization.name,
            "date": str(selected_date),
            "consultation_duration": (
                schedules.first().slot_duration_minutes
                if schedules.exists()
                else None
            ),
            "total_slots": len(slots),
            "available_count": len(available_slots),
            "booked_count": sum(
                1 for slot in slots
                if slot["status"] == "BOOKED"
            ),
            "slots": slots,
            "available_slots": available_slots,
        },
        status=status.HTTP_200_OK,
    )



@api_view(["POST"])
@permission_classes([AllowAny])
def book_appointment(request):
    """
    Create a pending appointment using a verified Supabase session.
    """

    # 1. Authenticate the patient through Supabase.
    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        return Response(
            {"error": "Authentication required. Please log in."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    access_token = auth_header.split(" ", 1)[1].strip()

    try:
        auth_user = get_supabase_user(access_token)
    except Exception:
        logger.warning("Booking authentication failed.", exc_info=True)
        return Response(
            {"error": "Invalid or expired login session."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if auth_user is None:
        return Response(
            {"error": "Invalid or expired login session."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # 2. Find the corresponding Django user.
    User = get_user_model()

    patient = User.objects.filter(
        supabase_uid=auth_user.id
    ).first()

    if patient is None:
        return Response(
            {"error": "Patient profile not found. Please sync your profile first."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if patient.role != User.Role.PATIENT:
        return Response(
            {"error": "Only patient accounts can book appointments."},
            status=status.HTTP_403_FORBIDDEN,
        )

    # 3. Read booking details.
    data = request.data

    required_fields = [
        "doctor_id",
        "organization_id",
        "appointment_date",
        "start_time",
        "visit_type",
        "patient_name",
        "patient_age",
        "patient_gender",
        "patient_phone",
        "reason_for_visit",
    ]

    missing_fields = [
        field for field in required_fields
        if data.get(field) is None or str(data.get(field)).strip() == ""
    ]

    if missing_fields:
        return Response(
            {
                "error": "Please provide all required booking details.",
                "missing_fields": missing_fields,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # 4. Validate date and time.
    try:
        appointment_date = datetime.strptime(
            str(data["appointment_date"]), "%Y-%m-%d"
        ).date()

        start_time = datetime.strptime(
            str(data["start_time"]), "%H:%M"
        ).time()

        patient_age = int(data["patient_age"])

        if not 0 <= patient_age <= 120:
            raise ValueError

    except (ValueError, TypeError):
        return Response(
            {"error": "Invalid date, time or patient age."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if appointment_date < timezone.localdate():
        return Response(
            {"error": "Appointments cannot be booked for past dates."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if (
        appointment_date == timezone.localdate()
        and start_time <= timezone.localtime().time().replace(tzinfo=None)
    ):
        return Response(
            {"error": "This appointment time has already passed."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    visit_type = str(data["visit_type"]).upper()

    if visit_type not in Appointment.VisitType.values:
        return Response(
            {"error": "Visit type must be HOSPITAL or HOME."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    home_address = str(data.get("home_address") or "").strip()

    if visit_type == Appointment.VisitType.HOME and not home_address:
        return Response(
            {"error": "Home address is required for a home visit."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # 5. Validate doctor and organization.
    try:
        doctor_id = int(data["doctor_id"])
        organization_id = int(data["organization_id"])

        doctor = DoctorProfile.objects.get(
            id=doctor_id,
            is_verified=True,
            user__role=User.Role.DOCTOR,
        )

        organization = Organization.objects.get(
            id=organization_id,
            verification_status=Organization.VerificationStatus.APPROVED,
        )

    except (ValueError, TypeError):
        return Response(
            {"error": "Doctor or organization ID must be valid numbers."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    except (DoctorProfile.DoesNotExist, Organization.DoesNotExist):
        return Response(
            {"error": "Verified doctor or approved organization not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    # 6. Check doctor membership and schedule.
    membership_exists = OrganizationMembership.objects.filter(
        user=doctor.user,
        organization=organization,
        role=OrganizationMembership.MembershipRole.DOCTOR,
        is_active=True,
    ).exists()

    if not membership_exists:
        return Response(
            {"error": "Doctor is not associated with this organization."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Lock the doctor row so simultaneous bookings for this doctor
    # are serialized on databases that support select_for_update().
    try:
        with transaction.atomic():

            DoctorProfile.objects.select_for_update().get(
                id=doctor.id
            )

            schedules = DoctorAvailability.objects.filter(
                doctor=doctor,
                organization=organization,
                weekday=appointment_date.weekday(),
                is_active=True,
            )

            matching_schedule = None
            appointment_end = None

            for schedule in schedules:
                duration = schedule.slot_duration_minutes

                start_minutes = (
                    start_time.hour * 60 + start_time.minute
                )
                schedule_start_minutes = (
                    schedule.start_time.hour * 60
                    + schedule.start_time.minute
                )

                if start_minutes < schedule_start_minutes:
                    continue

                if (
                    (start_minutes - schedule_start_minutes) % duration
                    != 0
                ):
                    continue

                proposed_end = (
                    datetime.combine(appointment_date, start_time)
                    + timedelta(minutes=duration)
                ).time()

                if (
                    start_time >= schedule.start_time
                    and proposed_end <= schedule.end_time
                ):
                    matching_schedule = schedule
                    appointment_end = proposed_end
                    break

            if matching_schedule is None:
                return Response(
                    {"error": "The selected time is not in the doctor's available schedule."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Check overlaps across all organizations for this doctor.
            overlapping = Appointment.objects.filter(
                doctor=doctor,
                appointment_date=appointment_date,
                start_time__lt=appointment_end,
                end_time__gt=start_time,
                status__in=[
                    Appointment.Status.PENDING,
                    Appointment.Status.CONFIRMED,
                ],
            ).exists()

            if overlapping:
                return Response(
                    {"error": "This time slot is already booked. Please select another slot."},
                    status=status.HTTP_409_CONFLICT,
                )

            # 7. Create the pending appointment.
            appointment = Appointment.objects.create(
                patient=patient,
                doctor=doctor,
                organization=organization,
                appointment_date=appointment_date,
                start_time=start_time,
                end_time=appointment_end,
                visit_type=visit_type,
                patient_name=str(data["patient_name"]).strip(),
                patient_age=patient_age,
                patient_gender=str(data["patient_gender"]).strip(),
                patient_phone=str(data["patient_phone"]).strip(),
                existing_conditions=str(
                    data.get("existing_conditions") or ""
                ).strip(),
                reason_for_visit=str(
                    data["reason_for_visit"]
                ).strip(),
                home_address=home_address if visit_type == "HOME" else "",
                status=Appointment.Status.PENDING,
            )

    except IntegrityError:
        return Response(
            {"error": "This appointment slot was just booked. Please select another time."},
            status=status.HTTP_409_CONFLICT,
        )

    return Response(
        {
            "message": "Appointment request submitted successfully. Waiting for doctor approval.",
            "appointment": {
                "id": appointment.id,
                "doctor": doctor.user.get_full_name(),
                "organization": organization.name,
                "date": str(appointment.appointment_date),
                "start_time": appointment.start_time.strftime("%H:%M"),
                "end_time": appointment.end_time.strftime("%H:%M"),
                "visit_type": appointment.visit_type,
                "status": appointment.status,
            },
        },
        status=status.HTTP_201_CREATED,
    )
#superadmin function

def get_authenticated_superadmin(request):
    """
    Authenticate the request and allow only Super Admin users.
    """

    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        return None, Response(
            {"error": "Authentication required."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    access_token = auth_header.split(" ", 1)[1].strip()

    if not access_token:
        return None, Response(
            {"error": "Missing access token."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        auth_user = get_supabase_user(access_token)
    except Exception:
        logger.warning("Super Admin authentication failed.", exc_info=True)
        return None, Response(
            {"error": "Invalid or expired login session."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if auth_user is None:
        return None, Response(
            {"error": "Invalid or expired login session."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    admin = User.objects.filter(
        supabase_uid=auth_user.id,
        role=User.Role.SUPER_ADMIN,
        is_active=True,
        is_staff=True,
    ).first()

    if admin is None:
        return None, Response(
            {"error": "Super Admin access denied."},
            status=status.HTTP_403_FORBIDDEN,
        )

    return admin, None


@api_view(["GET"])
def organization_dashboard_overview(request, organization_id):
    """
    Return dashboard statistics for an authenticated
    Organization Admin belonging to the requested organization.
    """

    admin, membership, error_response = (
        get_authenticated_organization_admin(
            request,
            organization_id,
        )
    )

    if error_response:
        return error_response

    organization = membership.organization

    departments = Department.objects.filter(
        organization=organization,
        is_active=True,
    )

    doctor_memberships = OrganizationMembership.objects.filter(
        organization=organization,
        role=OrganizationMembership.MembershipRole.DOCTOR,
        is_active=True,
        user__role=User.Role.DOCTOR,
    )

    nurse_memberships = OrganizationMembership.objects.filter(
        organization=organization,
        role=OrganizationMembership.MembershipRole.NURSE,
        is_active=True,
        user__role=User.Role.NURSE,
    )

    appointments = Appointment.objects.filter(
        organization=organization,
    )

    return Response(
        {
            "organization": {
                "id": organization.id,
                "name": organization.name,
                "type": organization.organization_type,
                "email": organization.email,
                "phone_number": organization.phone_number,
                "address": organization.address_line,
                "city": organization.city,
                "state": organization.state,
                "postal_code": organization.postal_code,
                "verification_status": organization.verification_status,
            },
            "statistics": {
                "total_departments": departments.count(),
                "total_doctors": doctor_memberships.count(),
                "total_nurses": nurse_memberships.count(),
                "total_appointments": appointments.count(),
                "pending_appointments": appointments.filter(
                    status=Appointment.Status.PENDING
                ).count(),
                "confirmed_appointments": appointments.filter(
                    status=Appointment.Status.CONFIRMED
                ).count(),
                "completed_appointments": appointments.filter(
                    status=Appointment.Status.COMPLETED
                ).count(),
                "cancelled_appointments": appointments.filter(
                    status=Appointment.Status.CANCELLED
                ).count(),
                "rejected_appointments": appointments.filter(
                    status=Appointment.Status.REJECTED
                ).count(),
            },
        },
        status=status.HTTP_200_OK,
    )


def get_authenticated_organization_admin(request, organization_id):
    """
    Authenticate an Organization Admin and verify active
    membership in the requested organization.

    Returns (user, membership, error_response).
    """

    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        return None, None, Response(
            {"error": "Authentication required."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    access_token = auth_header.split(" ", 1)[1].strip()

    if not access_token:
        return None, None, Response(
            {"error": "Missing access token."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        auth_user = get_supabase_user(access_token)
    except Exception:
        logger.warning(
            "Organization Admin authentication failed.",
            exc_info=True,
        )
        return None, None, Response(
            {"error": "Invalid or expired login session."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if auth_user is None:
        return None, None, Response(
            {"error": "Invalid or expired login session."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    user = User.objects.filter(
        supabase_uid=auth_user.id,
        role=User.Role.ORGANIZATION_ADMIN,
        is_active=True,
    ).first()

    if user is None:
        return None, None, Response(
            {"error": "Organization Admin access denied."},
            status=status.HTTP_403_FORBIDDEN,
        )

    membership = OrganizationMembership.objects.filter(
        user=user,
        organization_id=organization_id,
        role=OrganizationMembership.MembershipRole.ORGANIZATION_ADMIN,
        is_active=True,
        organization__verification_status=(
            Organization.VerificationStatus.APPROVED
        ),
    ).select_related("organization").first()

    if membership is None:
        return None, None, Response(
            {"error": "You do not have access to this organization."},
            status=status.HTTP_403_FORBIDDEN,
        )

    return user, membership, None



# ==========================================
# ORGANIZATION DEPARTMENT MANAGEMENT
# ==========================================

@api_view(["GET", "POST"])
def organization_departments(request, organization_id):
    """
    GET: List departments belonging to the organization.
    POST: Create a new department.
    """

    admin, membership, error_response = (
        get_authenticated_organization_admin(
            request,
            organization_id,
        )
    )

    if error_response:
        return error_response

    organization = membership.organization

    if request.method == "GET":
        departments = Department.objects.filter(
            organization=organization
        ).order_by("name")

        results = [
            {
                "id": department.id,
                "name": department.name,
                "description": department.description,
                "is_active": department.is_active,
            }
            for department in departments
        ]

        return Response({
            "organization_id": organization.id,
            "organization_name": organization.name,
            "count": len(results),
            "departments": results,
        }, status=status.HTTP_200_OK)

    name = str(request.data.get("name", "")).strip()
    description = str(
        request.data.get("description", "")
    ).strip()

    if not name:
        return Response(
            {"error": "Department name is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(name) > 120:
        return Response(
            {"error": "Department name cannot exceed 120 characters."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if Department.objects.filter(
        organization=organization,
        name__iexact=name,
    ).exists():
        return Response(
            {"error": "This department already exists."},
            status=status.HTTP_409_CONFLICT,
        )

    department = Department.objects.create(
        organization=organization,
        name=name,
        description=description,
        is_active=True,
    )

    return Response({
        "message": "Department created successfully.",
        "department": {
            "id": department.id,
            "name": department.name,
            "description": department.description,
            "is_active": department.is_active,
        },
    }, status=status.HTTP_201_CREATED)


@api_view(["PATCH", "DELETE"])
def organization_department_detail(
    request,
    organization_id,
    department_id,
):
    """
    PATCH: Update department name, description or active status.
    DELETE: Soft-deactivate the department.
    """

    admin, membership, error_response = (
        get_authenticated_organization_admin(
            request,
            organization_id,
        )
    )

    if error_response:
        return error_response

    try:
        department = Department.objects.get(
            id=department_id,
            organization=membership.organization,
        )
    except Department.DoesNotExist:
        return Response(
            {"error": "Department not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "DELETE":
        department.is_active = False
        department.save(update_fields=["is_active"])

        return Response({
            "message": "Department deactivated successfully.",
            "department_id": department.id,
            "is_active": False,
        }, status=status.HTTP_200_OK)

    if "name" in request.data:
        name = str(request.data.get("name", "")).strip()

        if not name:
            return Response(
                {"error": "Department name cannot be empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(name) > 120:
            return Response(
                {"error": "Department name cannot exceed 120 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        duplicate = Department.objects.filter(
            organization=membership.organization,
            name__iexact=name,
        ).exclude(id=department.id).exists()

        if duplicate:
            return Response(
                {"error": "Another department already has this name."},
                status=status.HTTP_409_CONFLICT,
            )

        department.name = name

    if "description" in request.data:
        department.description = str(
            request.data.get("description") or ""
        ).strip()

    if "is_active" in request.data:
        if not isinstance(request.data["is_active"], bool):
            return Response(
                {"error": "is_active must be true or false."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        department.is_active = request.data["is_active"]

    department.save()

    return Response({
        "message": "Department updated successfully.",
        "department": {
            "id": department.id,
            "name": department.name,
            "description": department.description,
            "is_active": department.is_active,
        },
    }, status=status.HTTP_200_OK)



# ==========================================
# DOCTOR DASHBOARD - APPOINTMENT MANAGEMENT
# ==========================================

def get_authenticated_doctor(request):
    """
    Authenticate the doctor using the Supabase access token.
    Returns (doctor_profile, error_response).
    """

    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        return None, Response(
            {"error": "Authentication required."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    access_token = auth_header.split(" ", 1)[1].strip()

    if not access_token:
        return None, Response(
            {"error": "Missing access token."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        auth_user = get_supabase_user(access_token)
    except Exception:
        logger.warning("Doctor authentication failed.", exc_info=True)
        return None, Response(
            {"error": "Invalid or expired login session."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if auth_user is None:
        return None, Response(
            {"error": "Invalid or expired login session."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    user = User.objects.filter(
        supabase_uid=auth_user.id,
        role=User.Role.DOCTOR,
    ).first()

    if user is None:
        return None, Response(
            {"error": "Doctor account not found."},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        doctor = DoctorProfile.objects.get(
            user=user,
            is_verified=True,
        )
    except DoctorProfile.DoesNotExist:
        return None, Response(
            {"error": "Verified doctor profile not found."},
            status=status.HTTP_403_FORBIDDEN,
        )

    return doctor, None


@api_view(["GET"])
@permission_classes([AllowAny])
def doctor_appointments(request):
    """
    Return appointments belonging only to the authenticated doctor.
    Optional query parameter: ?status=PENDING
    """

    doctor, error_response = get_authenticated_doctor(request)

    if error_response:
        return error_response

    appointments = (
        Appointment.objects
        .filter(doctor=doctor)
        .select_related("patient", "organization")
        .order_by("appointment_date", "start_time")
    )

    status_filter = request.query_params.get("status", "").upper().strip()

    if status_filter:
        if status_filter not in Appointment.Status.values:
            return Response(
                {"error": "Invalid appointment status."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        appointments = appointments.filter(status=status_filter)

    results = []

    for appointment in appointments:
        results.append({
            "id": appointment.id,
            "patient": {
                "id": appointment.patient_id,
                "name": appointment.patient_name,
                "age": appointment.patient_age,
                "gender": appointment.patient_gender,
                "phone": appointment.patient_phone,
            },
            "organization": {
                "id": appointment.organization_id,
                "name": appointment.organization.name,
                "type": appointment.organization.organization_type,
            },
            "appointment_date": str(appointment.appointment_date),
            "start_time": appointment.start_time.strftime("%H:%M"),
            "end_time": appointment.end_time.strftime("%H:%M"),
            "visit_type": appointment.visit_type,
            "existing_conditions": appointment.existing_conditions,
            "reason_for_visit": appointment.reason_for_visit,
            "home_address": (
                appointment.home_address
                if appointment.visit_type == Appointment.VisitType.HOME
                else ""
            ),
            "status": appointment.status,
            "created_at": appointment.created_at.isoformat(),
        })

    return Response({
        "doctor_id": doctor.id,
        "doctor_name": (
            doctor.user.get_full_name() or doctor.user.username
        ),
        "count": len(results),
        "appointments": results,
    }, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def doctor_appointment_decision(request, appointment_id):
    """
    Allow the authenticated doctor to accept or reject
    their own pending appointment requests.
    """

    doctor, error_response = get_authenticated_doctor(request)

    if error_response:
        return error_response

    action = str(request.data.get("action", "")).upper().strip()

    allowed_actions = {
        "ACCEPT": Appointment.Status.CONFIRMED,
        "REJECT": Appointment.Status.REJECTED,
        "COMPLETE": Appointment.Status.COMPLETED,
        "CANCEL": Appointment.Status.CANCELLED,
    }

    if action not in allowed_actions:
        return Response(
            {"error": "Action must be ACCEPT, REJECT, COMPLETE, or CANCEL."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        with transaction.atomic():
            appointment = (
                Appointment.objects
                .select_for_update()
                .filter(
                    id=appointment_id,
                    doctor=doctor,
                )
                .first()
            )

            if appointment is None:
                return Response(
                    {"error": "Appointment not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if action in ["ACCEPT", "REJECT"] and appointment.status != Appointment.Status.PENDING:
                return Response(
                    {
                        "error": "Only pending appointments can be accepted or rejected.",
                        "current_status": appointment.status,
                    },
                    status=status.HTTP_409_CONFLICT,
                )

            if action == "COMPLETE" and appointment.status != Appointment.Status.CONFIRMED:
                return Response(
                    {
                        "error": "Only confirmed appointments can be marked as completed.",
                        "current_status": appointment.status,
                    },
                    status=status.HTTP_409_CONFLICT,
                )

            if action == "CANCEL" and appointment.status not in [Appointment.Status.PENDING, Appointment.Status.CONFIRMED]:
                return Response(
                    {
                        "error": "Only pending or confirmed appointments can be cancelled.",
                        "current_status": appointment.status,
                    },
                    status=status.HTTP_409_CONFLICT,
                )

            appointment.status = allowed_actions[action]
            appointment.save(update_fields=["status", "updated_at"])

    except Exception:
        logger.exception("Could not update doctor appointment.")
        return Response(
            {"error": "Could not update appointment. Please retry."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    messages = {
        "ACCEPT": "Appointment accepted successfully.",
        "REJECT": "Appointment rejected successfully.",
        "COMPLETE": "Appointment marked as completed.",
        "CANCEL": "Appointment cancelled successfully.",
    }

    return Response({
        "message": messages.get(action, "Appointment updated successfully."),
        "appointment": {
            "id": appointment.id,
            "status": appointment.status,
        },
    }, status=status.HTTP_200_OK)



@api_view(["POST"])
@permission_classes([AllowAny])
def register_organization(request):
    """
    Submit a hospital or clinic application for Super Admin review.
    Does not create a login account or an active organization.
    """

    data = request.data

    required_fields = [
        "organization_name",
        "organization_type",
        "registration_number",
        "organization_email",
        "organization_phone",
        "address_line",
        "city",
        "state",
        "postal_code",
        "admin_full_name",
        "admin_email",
        "admin_phone",
    ]

    missing_fields = [
        field for field in required_fields
        if not str(data.get(field, "")).strip()
    ]

    if missing_fields:
        return Response(
            {
                "error": "Please complete all required fields.",
                "missing_fields": missing_fields,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    organization_type = str(
        data["organization_type"]
    ).strip().upper()

    if organization_type not in Organization.OrganizationType.values:
        return Response(
            {"error": "Organization type must be HOSPITAL or CLINIC."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    organization_email = str(
        data["organization_email"]
    ).strip().lower()

    admin_email = str(
        data["admin_email"]
    ).strip().lower()

    registration_number = str(
        data["registration_number"]
    ).strip()

    # Validate email addresses.
    from django.core.validators import validate_email
    from django.core.exceptions import ValidationError

    try:
        validate_email(organization_email)
        validate_email(admin_email)
    except ValidationError:
        return Response(
            {"error": "Please provide valid email addresses."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Prevent duplicate organization applications.
    if OrganizationApplication.objects.filter(
        registration_number__iexact=registration_number
    ).exists() or Organization.objects.filter(
        registration_number__iexact=registration_number
    ).exists():
        return Response(
            {"error": "This organization registration number already exists."},
            status=status.HTTP_409_CONFLICT,
        )

    # Do not allow an existing patient or staff account to be
    # silently converted into an organization admin account.
    if User.objects.filter(email__iexact=admin_email).exists():
        return Response(
            {
                "error": (
                    "This admin email is already associated with a Mediqo account. "
                    "Please use a different email address."
                )
            },
            status=status.HTTP_409_CONFLICT,
        )

    try:
        application = OrganizationApplication.objects.create(
            organization_name=str(data["organization_name"]).strip(),
            organization_type=organization_type,
            registration_number=registration_number,
            organization_email=organization_email,
            organization_phone=str(data["organization_phone"]).strip(),
            address_line=str(data["address_line"]).strip(),
            city=str(data["city"]).strip(),
            state=str(data["state"]).strip(),
            postal_code=str(data["postal_code"]).strip(),
            admin_full_name=str(data["admin_full_name"]).strip(),
            admin_email=admin_email,
            admin_phone=str(data["admin_phone"]).strip(),
            verification_document_url=str(
                data.get("verification_document_url") or ""
            ).strip(),
            status=OrganizationApplication.Status.PENDING,
        )

    except IntegrityError:
        return Response(
            {"error": "An application with these details already exists."},
            status=status.HTTP_409_CONFLICT,
        )

    return Response(
        {
            "message": (
                "Organization application submitted successfully. "
                "Your application is waiting for Super Admin verification."
            ),
            "application": {
                "id": application.id,
                "organization_name": application.organization_name,
                "status": application.status,
                "submitted_at": application.created_at,
            },
        },
        status=status.HTTP_201_CREATED,
    )

@api_view(["GET"])
@permission_classes([AllowAny])
def superadmin_organization_applications(request):
    """
    Return organization applications to authenticated Super Admins.

    Optional filter: ?status=PENDING
    """

    admin, error_response = get_authenticated_superadmin(request)

    if error_response:
        return error_response

    status_filter = request.query_params.get(
        "status", "PENDING"
    ).upper().strip()

    allowed_statuses = OrganizationApplication.Status.values

    if status_filter not in allowed_statuses:
        return Response(
            {"error": "Invalid application status."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    applications = (
        OrganizationApplication.objects
        .filter(status=status_filter)
        .select_related("reviewed_by", "organization")
        .order_by("-created_at")
    )

    results = []

    for application in applications:
        results.append({
            "id": application.id,
            "organization_name": application.organization_name,
            "organization_type": application.organization_type,
            "registration_number": application.registration_number,
            "organization_email": application.organization_email,
            "organization_phone": application.organization_phone,
            "address_line": application.address_line,
            "city": application.city,
            "state": application.state,
            "postal_code": application.postal_code,
            "admin_full_name": application.admin_full_name,
            "admin_email": application.admin_email,
            "admin_phone": application.admin_phone,
            "verification_document_url": (
                application.verification_document_url
            ),
            "status": application.status,
            "rejection_reason": application.rejection_reason,
            "reviewed_by": (
                application.reviewed_by.get_full_name()
                if application.reviewed_by else None
            ),
            "reviewed_at": (
                application.reviewed_at.isoformat()
                if application.reviewed_at else None
            ),
            "created_at": application.created_at.isoformat(),
        })

    return Response({
        "status": status_filter,
        "count": len(results),
        "applications": results,
    }, status=status.HTTP_200_OK)

@api_view(["POST"])
def review_organization_application(request, application_id):
    # 1. Authenticate Super Admin
    admin, error_response = get_authenticated_superadmin(request)

    if error_response:
        return error_response

    # 2. Validate action
    action = request.data.get("action", "").upper()
    rejection_reason = request.data.get("rejection_reason", "").strip()

    if action not in ["APPROVE", "REJECT"]:
        return Response(
            {"error": "Action must be APPROVE or REJECT."},
            status=400,
        )

    if action == "REJECT" and not rejection_reason:
        return Response(
            {"error": "Please provide a rejection reason."},
            status=400,
        )

    # 3. Find application
    try:
        application = OrganizationApplication.objects.get(
            id=application_id
        )
    except OrganizationApplication.DoesNotExist:
        return Response(
            {"error": "Organization application not found."},
            status=404,
        )

    # 4. Prevent reviewing an application twice
    if application.status != OrganizationApplication.Status.PENDING:
        return Response(
            {"error": f"Application is already {application.status}."},
            status=400,
        )

    # 5. Approve or reject
    try:
        with transaction.atomic():

            if action == "APPROVE":

                # Prevent duplicate organization creation
                if Organization.objects.filter(
                    registration_number=application.registration_number
                ).exists():
                    return Response(
                        {"error": "An organization with this registration number already exists."},
                        status=400,
                    )

                organization = Organization.objects.create(
                    name=application.organization_name,
                    organization_type=application.organization_type,
                    registration_number=application.registration_number,
                    email=application.organization_email,
                    phone_number=application.organization_phone,
                    address_line=application.address_line,
                    city=application.city,
                    state=application.state,
                    postal_code=application.postal_code,
                    verification_status=Organization.VerificationStatus.APPROVED,
                    created_by=admin,
                )

                application.organization = organization
                application.status = OrganizationApplication.Status.APPROVED
                application.rejection_reason = ""

            else:
                application.status = OrganizationApplication.Status.REJECTED
                application.rejection_reason = rejection_reason

            application.reviewed_by = admin
            application.reviewed_at = timezone.now()
            application.save()

        return Response(
            {
                "message": (
                    "Organization application approved successfully."
                    if action == "APPROVE"
                    else "Organization application rejected successfully."
                ),
                "application_id": application.id,
                "organization_name": application.organization_name,
                "status": application.status,
                "organization_id": (
                    application.organization.id
                    if application.organization
                    else None
                ),
            },
            status=200,
        )

    except Exception:
        return Response(
            {"error": "Something went wrong while reviewing the application."},
            status=500,
        )

# ==========================================
# ORGANIZATION DOCTOR MANAGEMENT
# ==========================================

@api_view(["GET", "POST"])
def organization_doctors(request, organization_id):
    """
    GET: List doctors belonging to this organization.
    POST: Add a new doctor or associate an existing doctor.
    """

    admin, membership, error_response = (
        get_authenticated_organization_admin(request, organization_id)
    )

    if error_response:
        return error_response

    organization = membership.organization

    # --------------------------------------
    # GET: LIST ORGANIZATION DOCTORS
    # --------------------------------------
    if request.method == "GET":

        doctor_memberships = (
            OrganizationMembership.objects
            .filter(
                organization=organization,
                role=OrganizationMembership.MembershipRole.DOCTOR,
            )
            .select_related("user", "user__doctor_profile")
            .prefetch_related(
                "user__doctor_profile__department_assignments__department"
            )
            .order_by("user__first_name")
        )

        results = []

        for doctor_membership in doctor_memberships:
            user = doctor_membership.user

            try:
                profile = user.doctor_profile
            except DoctorProfile.DoesNotExist:
                continue

            assignments = DoctorDepartment.objects.filter(
                doctor=profile,
                organization=organization,
                department__is_active=True,
            ).select_related("department")

            results.append({
                "id": profile.id,
                "user_id": user.id,
                "name": user.get_full_name() or user.username,
                "email": user.email,
                "phone_number": user.phone_number,
                "specialization": profile.specialization,
                "qualification": profile.qualification,
                "license_number": profile.license_number,
                "experience_years": profile.experience_years,
                "consultation_fee": str(profile.consultation_fee),
                "bio": profile.bio,
                "is_verified": profile.is_verified,
                "is_active": doctor_membership.is_active,
                "departments": [
                    {
                        "id": assignment.department.id,
                        "name": assignment.department.name,
                    }
                    for assignment in assignments
                ],
            })

        return Response({
            "organization_id": organization.id,
            "organization_name": organization.name,
            "count": len(results),
            "doctors": results,
        }, status=status.HTTP_200_OK)

    # --------------------------------------
    # POST: ADD DOCTOR
    # --------------------------------------

    data = request.data

    required_fields = [
        "email",
        "full_name",
        "phone_number",
        "specialization",
        "qualification",
        "license_number",
        "experience_years",
        "consultation_fee",
        "department_ids",
    ]

    missing_fields = [
        field for field in required_fields
        if field not in data or data[field] is None
        or str(data[field]).strip() == ""
    ]

    if missing_fields:
        return Response({
            "error": "Please provide all required doctor details.",
            "missing_fields": missing_fields,
        }, status=status.HTTP_400_BAD_REQUEST)

    email = str(data["email"]).strip().lower()
    full_name = str(data["full_name"]).strip()
    phone_number = str(data["phone_number"]).strip()
    specialization = str(data["specialization"]).strip()
    qualification = str(data["qualification"]).strip()
    license_number = str(data["license_number"]).strip()
    bio = str(data.get("bio") or "").strip()

    # Validate email
    try:
        validate_email(email)
    except ValidationError:
        return Response(
            {"error": "Please provide a valid email address."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(full_name) > 150:
        return Response(
            {"error": "Doctor name cannot exceed 150 characters."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(phone_number) > 20:
        return Response(
            {"error": "Phone number cannot exceed 20 characters."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not license_number:
        return Response(
            {"error": "Medical license number is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate experience and consultation fee
    try:
        experience_years = int(data["experience_years"])
        consultation_fee = Decimal(str(data["consultation_fee"]))

        if experience_years < 0 or experience_years > 100:
            raise ValueError

        if not consultation_fee.is_finite() or consultation_fee < 0:
            raise ValueError

    except (ValueError, TypeError, InvalidOperation):
        return Response(
            {"error": "Invalid experience or consultation fee."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate department IDs
    department_ids = data["department_ids"]

    if not isinstance(department_ids, list) or not department_ids:
        return Response(
            {"error": "Select at least one department."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        department_ids = list(dict.fromkeys(
            int(department_id) for department_id in department_ids
        ))
    except (ValueError, TypeError):
        return Response(
            {"error": "Department IDs must be valid numbers."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    departments = Department.objects.filter(
        organization=organization,
        id__in=department_ids,
        is_active=True,
    )

    if departments.count() != len(department_ids):
        return Response(
            {"error": "One or more departments are invalid or inactive."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Find an existing Mediqo account by email.
    existing_user = User.objects.filter(email__iexact=email).first()

    if existing_user and existing_user.role != User.Role.DOCTOR:
        return Response(
            {
                "error": (
                    "This email already belongs to another Mediqo account. "
                    "Please use a different email."
                )
            },
            status=status.HTTP_409_CONFLICT,
        )

    if existing_user and not existing_user.is_active:
        return Response(
            {"error": "This doctor account is inactive. Contact platform support."},
            status=status.HTTP_409_CONFLICT,
        )

    if existing_user and not existing_user.supabase_uid:
        return Response(
            {"error": "The existing doctor account is not linked to Supabase."},
            status=status.HTTP_409_CONFLICT,
        )

    # Check whether the license number is already used by another profile.
    existing_profile = (
        DoctorProfile.objects.filter(user=existing_user).first()
        if existing_user else None
    )

    license_owner = DoctorProfile.objects.filter(
        license_number__iexact=license_number
    ).first()

    if license_owner and (
        existing_profile is None or license_owner.id != existing_profile.id
    ):
        return Response(
            {"error": "This medical license number is already registered."},
            status=status.HTTP_409_CONFLICT,
        )

    # Split doctor's name.
    name_parts = full_name.split(maxsplit=1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    supabase_admin = None
    created_supabase_uid = None
    activation_link = None

    try:
        # Create a Supabase account only for a new doctor.
        if existing_user is None:
            supabase_admin = get_supabase_admin_client()

            temporary_password = secrets.token_urlsafe(32)

            created_user = supabase_admin.auth.admin.create_user({
                "email": email,
                "password": temporary_password,
                "email_confirm": True,
                "user_metadata": {
                    "full_name": full_name,
                    "phone_number": phone_number,
                    "role": "DOCTOR",
                },
            })

            if not created_user.user:
                raise Exception("Supabase doctor account creation failed.")

            created_supabase_uid = created_user.user.id

            # Generate a password setup link. No email is sent automatically.
            link_response = supabase_admin.auth.admin.generate_link({
                "type": "recovery",
                "email": email,
                "options": {
                    "redirect_to": os.getenv(
                        "FRONTEND_INVITE_REDIRECT_URL",
                        "http://localhost:5173/",
                    ),
                },
            })

            activation_link = link_response.properties.action_link

            if not activation_link:
                raise Exception("Could not generate doctor activation link.")

        # Create or update Django records.
        with transaction.atomic():

            if existing_user is None:
                base_username = email.split("@")[0][:140]
                username = base_username
                suffix = 1

                while User.objects.filter(username=username).exists():
                    username = f"{base_username[:130]}_{suffix}"
                    suffix += 1

                doctor_user = User.objects.create(
                    username=username,
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    phone_number=phone_number,
                    role=User.Role.DOCTOR,
                    supabase_uid=created_supabase_uid,
                    is_active=True,
                )
                doctor_user.set_unusable_password()
                doctor_user.save(update_fields=["password"])

            else:
                doctor_user = existing_user

            # Create profile for a new doctor, or an existing doctor
            # whose account does not yet have a profile.
            if existing_profile is None:
                doctor_profile = DoctorProfile.objects.create(
                    user=doctor_user,
                    specialization=specialization,
                    qualification=qualification,
                    license_number=license_number,
                    experience_years=experience_years,
                    consultation_fee=consultation_fee,
                    bio=bio,
                    is_verified=True,
                )
            else:
                doctor_profile = existing_profile

            # Create or reactivate organization membership.
            doctor_membership, membership_created = (
                OrganizationMembership.objects.get_or_create(
                    organization=organization,
                    user=doctor_user,
                    defaults={
                        "role": OrganizationMembership.MembershipRole.DOCTOR,
                        "is_active": True,
                    },
                )
            )

            if doctor_membership.role != OrganizationMembership.MembershipRole.DOCTOR:
                raise ValueError(
                    "This account already has a different role in this organization."
                )

            if not doctor_membership.is_active:
                doctor_membership.is_active = True
                doctor_membership.save(update_fields=["is_active"])

            # Assign the doctor to the selected departments.
            for department in departments:
                DoctorDepartment.objects.get_or_create(
                    doctor=doctor_profile,
                    organization=organization,
                    department=department,
                )

    except IntegrityError:
        if created_supabase_uid and supabase_admin:
            try:
                supabase_admin.auth.admin.delete_user(
                    str(created_supabase_uid)
                )
            except Exception:
                logger.exception("Could not clean up Supabase doctor account.")

        logger.exception("Doctor creation encountered a database conflict.")

        return Response(
            {"error": "Doctor could not be added because of a database conflict."},
            status=status.HTTP_409_CONFLICT,
        )

    except Exception:
        if created_supabase_uid and supabase_admin:
            try:
                supabase_admin.auth.admin.delete_user(
                    str(created_supabase_uid)
                )
            except Exception:
                logger.exception("Could not clean up Supabase doctor account.")

        logger.exception("Doctor onboarding failed.")

        return Response(
            {"error": "Doctor onboarding failed. Check backend logs."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response({
        "message": (
            "Doctor added successfully."
            if existing_user is None
            else "Existing doctor added to this organization successfully."
        ),
        "doctor": {
            "id": doctor_profile.id,
            "user_id": doctor_user.id,
            "name": doctor_user.get_full_name() or doctor_user.username,
            "email": doctor_user.email,
            "specialization": doctor_profile.specialization,
            "qualification": doctor_profile.qualification,
            "license_number": doctor_profile.license_number,
            "experience_years": doctor_profile.experience_years,
            "consultation_fee": str(doctor_profile.consultation_fee),
            "is_verified": doctor_profile.is_verified,
            "organization_id": organization.id,
            "departments": [
                {"id": department.id, "name": department.name}
                for department in departments
            ],
        },
        "account_created": existing_user is None,
        "activation_link": activation_link,
        "activation_instructions": (
            "Share this link privately with the doctor so they can set "
            "their password."
            if activation_link else
            "The doctor can use their existing Mediqo login."
        ),
    }, status=status.HTTP_201_CREATED)

@api_view(["POST"])
def invite_organization_admin(request, application_id):
    # 1. Authenticate Super Admin
    admin, error_response = get_authenticated_superadmin(request)

    if error_response:
        return error_response

    # 2. Find approved application
    try:
        application = OrganizationApplication.objects.select_related(
            "organization"
        ).get(id=application_id)
    except OrganizationApplication.DoesNotExist:
        return Response({"error": "Application not found."}, status=404)

    if application.status != OrganizationApplication.Status.APPROVED:
        return Response(
            {"error": "Only approved applications can receive invitations."},
            status=400,
        )

    organization = application.organization

    if not organization:
        return Response(
            {"error": "Approved organization record is missing."},
            status=400,
        )

    if organization.verification_status != Organization.VerificationStatus.APPROVED:
        return Response({"error": "Organization is not verified."}, status=400)

    # 3. Check for existing accounts and memberships
    admin_email = application.admin_email.strip().lower()

    if User.objects.filter(email__iexact=admin_email).exists():
        return Response(
            {"error": "A Django user with this email already exists."},
            status=409,
        )

    admin_membership_role = (
        OrganizationMembership.MembershipRole.ORGANIZATION_ADMIN
    )

    if OrganizationMembership.objects.filter(
        organization=organization,
        role=admin_membership_role,
        is_active=True,
    ).exists():
        return Response(
            {"error": "This organization already has an admin membership."},
            status=409,
        )

    # 4. Prepare account details
    name_parts = application.admin_full_name.strip().split(maxsplit=1)
    first_name = name_parts[0] if name_parts else ""
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    supabase_admin = None
    created_supabase_uid = None

    try:
        supabase_admin = get_supabase_admin_client()

        # 5. Create Supabase user WITHOUT sending an email
        temporary_password = secrets.token_urlsafe(32)

        created_user = supabase_admin.auth.admin.create_user({
            "email": admin_email,
            "password": temporary_password,
            "email_confirm": True,
            "user_metadata": {
                "full_name": application.admin_full_name,
                "role": "ORGANIZATION_ADMIN",
                "organization_id": organization.id,
            },
        })

        if not created_user.user:
            raise Exception("Supabase user creation failed.")

        created_supabase_uid = created_user.user.id

        # 6. Generate a password recovery link WITHOUT sending an email
        link_response = supabase_admin.auth.admin.generate_link({
            "type": "recovery",
            "email": admin_email,
            "options": {
                "redirect_to": os.getenv(
                    "FRONTEND_INVITE_REDIRECT_URL",
                    "http://localhost:5173/",
                ),
            },
        })

        action_link = link_response.properties.action_link

        if not action_link:
            raise Exception("Could not generate account activation link.")

        # 7. Create Django user and organization membership
        with transaction.atomic():

            base_username = admin_email.split("@")[0][:140]
            username = base_username
            suffix = 1

            while User.objects.filter(username=username).exists():
                username = f"{base_username[:130]}_{suffix}"
                suffix += 1

            admin_user = User.objects.create(
                username=username,
                email=admin_email,
                first_name=first_name,
                last_name=last_name,
                phone_number=application.admin_phone,
                role=User.Role.ORGANIZATION_ADMIN,
                supabase_uid=created_supabase_uid,
                is_active=True,
            )

            OrganizationMembership.objects.create(
                organization=organization,
                user=admin_user,
                role=admin_membership_role,
                is_active=True,
            )

        # 8. Return the link to the authenticated Super Admin
        return Response(
            {
                "message": "Organization admin account created successfully.",
                "admin_email": admin_email,
                "organization": organization.name,
                "organization_id": organization.id,
                "admin_user_id": admin_user.id,
                "membership_role": admin_membership_role,
                "invitation_sent": False,
                "activation_link": action_link,
                "instructions": (
                    "Share this link privately with the organization admin. "
                    "They can use it to set their password."
                ),
            },
            status=201,
        )

    except Exception:
        # Delete the Supabase account if another step fails
        if created_supabase_uid and supabase_admin is not None:
            try:
                supabase_admin.auth.admin.delete_user(
                    str(created_supabase_uid)
                )
            except Exception:
                logger.exception("Could not clean up Supabase user.")

        logger.exception("Organization admin account creation failed.")

        return Response(
            {"error": "Admin account creation failed. Check backend logs."},
            status=500,
)


# ==========================================
# EDIT DOCTOR PROFILE
# ==========================================

@api_view(["PATCH"])
def organization_doctor_detail(request, organization_id, doctor_id):

    admin, membership, error_response = (
        get_authenticated_organization_admin(
            request, organization_id
        )
    )

    if error_response:
        return error_response

    organization = membership.organization

    # Find doctor belonging to this organization
    doctor_membership = (
        OrganizationMembership.objects
        .filter(
            organization=organization,
            role=OrganizationMembership.MembershipRole.DOCTOR,
            user__doctor_profile__id=doctor_id,
        )
        .select_related("user", "user__doctor_profile")
        .first()
    )

    if doctor_membership is None:
        return Response(
            {"error": "Doctor not found in this organization."},
            status=status.HTTP_404_NOT_FOUND,
        )

    doctor_user = doctor_membership.user
    doctor_profile = doctor_user.doctor_profile
    data = request.data

    # Update doctor's name
    if "full_name" in data:
        full_name = str(data["full_name"]).strip()

        if not full_name or len(full_name) > 150:
            return Response(
                {"error": "Enter a valid doctor name."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        name_parts = full_name.split(maxsplit=1)
        doctor_user.first_name = name_parts[0]
        doctor_user.last_name = (
            name_parts[1] if len(name_parts) > 1 else ""
        )

    # Update phone number
    if "phone_number" in data:
        phone_number = str(data["phone_number"]).strip()

        if not phone_number or len(phone_number) > 20:
            return Response(
                {"error": "Enter a valid phone number."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        doctor_user.phone_number = phone_number

    # Update professional details
    if "specialization" in data:
        specialization = str(data["specialization"]).strip()

        if not specialization or len(specialization) > 120:
            return Response(
                {"error": "Enter a valid specialization."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        doctor_profile.specialization = specialization

    if "qualification" in data:
        qualification = str(data["qualification"]).strip()

        if not qualification or len(qualification) > 200:
            return Response(
                {"error": "Enter a valid qualification."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        doctor_profile.qualification = qualification

    if "license_number" in data:
        license_number = str(data["license_number"]).strip()

        if not license_number or len(license_number) > 100:
            return Response(
                {"error": "Enter a valid medical license number."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        duplicate = DoctorProfile.objects.filter(
            license_number__iexact=license_number
        ).exclude(id=doctor_profile.id).exists()

        if duplicate:
            return Response(
                {"error": "This medical license number is already registered."},
                status=status.HTTP_409_CONFLICT,
            )

        doctor_profile.license_number = license_number

    if "experience_years" in data:
        try:
            experience = int(data["experience_years"])

            if experience < 0 or experience > 100:
                raise ValueError

            doctor_profile.experience_years = experience

        except (ValueError, TypeError):
            return Response(
                {"error": "Experience must be between 0 and 100."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    if "consultation_fee" in data:
        try:
            fee = Decimal(str(data["consultation_fee"]))

            if not fee.is_finite() or fee < 0:
                raise ValueError

            doctor_profile.consultation_fee = fee

        except (ValueError, TypeError, InvalidOperation):
            return Response(
                {"error": "Enter a valid consultation fee."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    if "bio" in data:
        doctor_profile.bio = str(data["bio"]).strip()

    # Save changes
    try:
        with transaction.atomic():
            doctor_user.save()
            doctor_profile.save()

    except IntegrityError:
        logger.exception("Doctor profile update failed.")

        return Response(
            {"error": "Could not update doctor profile."},
            status=status.HTTP_409_CONFLICT,
        )

    return Response({
        "message": "Doctor profile updated successfully.",
        "doctor": {
            "id": doctor_profile.id,
            "user_id": doctor_user.id,
            "name": doctor_user.get_full_name(),
            "email": doctor_user.email,
            "phone_number": doctor_user.phone_number,
            "specialization": doctor_profile.specialization,
            "qualification": doctor_profile.qualification,
            "license_number": doctor_profile.license_number,
            "experience_years": doctor_profile.experience_years,
            "consultation_fee": str(doctor_profile.consultation_fee),
            "bio": doctor_profile.bio,
            "is_verified": doctor_profile.is_verified,
        },
    }, status=status.HTTP_200_OK)


# ==========================================
# DOCTOR DEPARTMENT ASSIGNMENT MANAGEMENT
# ==========================================

@api_view(["POST"])
def assign_doctor_departments(request, organization_id, doctor_id):
    """
    Assign one or more departments to a doctor
    within the authenticated organization.
    """

    admin, membership, error_response = (
        get_authenticated_organization_admin(
            request, organization_id
        )
    )

    if error_response:
        return error_response

    organization = membership.organization

    doctor_membership = OrganizationMembership.objects.filter(
        organization=organization,
        user__doctor_profile__id=doctor_id,
        role=OrganizationMembership.MembershipRole.DOCTOR,
        is_active=True,
    ).select_related("user", "user__doctor_profile").first()

    if doctor_membership is None:
        return Response(
            {"error": "Active doctor not found in this organization."},
            status=status.HTTP_404_NOT_FOUND,
        )

    department_ids = request.data.get("department_ids")

    if not isinstance(department_ids, list) or not department_ids:
        return Response(
            {"error": "Provide at least one department ID."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        department_ids = list(dict.fromkeys(
            int(item) for item in department_ids
        ))
    except (ValueError, TypeError):
        return Response(
            {"error": "Department IDs must be valid numbers."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    departments = Department.objects.filter(
        organization=organization,
        id__in=department_ids,
        is_active=True,
    )

    if departments.count() != len(department_ids):
        return Response(
            {"error": "One or more departments are invalid or inactive."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    doctor_profile = doctor_membership.user.doctor_profile

    created_count = 0

    with transaction.atomic():
        for department in departments:
            _, created = DoctorDepartment.objects.get_or_create(
                doctor=doctor_profile,
                organization=organization,
                department=department,
            )

            if created:
                created_count += 1

    assignments = DoctorDepartment.objects.filter(
        doctor=doctor_profile,
        organization=organization,
        department__is_active=True,
    ).select_related("department")

    return Response({
        "message": "Doctor department assignments updated successfully.",
        "doctor_id": doctor_profile.id,
        "new_assignments": created_count,
        "departments": [
            {
                "id": item.department.id,
                "name": item.department.name,
            }
            for item in assignments
        ],
    }, status=status.HTTP_200_OK)


@api_view(["DELETE"])
def remove_doctor_department(
    request, organization_id, doctor_id, department_id
):
    """
    Remove a doctor's assignment to one department.
    Does not remove the doctor from the organization.
    """

    admin, membership, error_response = (
        get_authenticated_organization_admin(
            request, organization_id
        )
    )

    if error_response:
        return error_response

    doctor_membership = OrganizationMembership.objects.filter(
        organization=membership.organization,
        user__doctor_profile__id=doctor_id,
        role=OrganizationMembership.MembershipRole.DOCTOR,
        is_active=True,
    ).select_related("user", "user__doctor_profile").first()

    if doctor_membership is None:
        return Response(
            {"error": "Active doctor not found in this organization."},
            status=status.HTTP_404_NOT_FOUND,
        )

    assignment = DoctorDepartment.objects.filter(
        doctor=doctor_membership.user.doctor_profile,
        organization=membership.organization,
        department_id=department_id,
    ).select_related("department").first()

    if assignment is None:
        return Response(
            {"error": "Doctor is not assigned to this department."},
            status=status.HTTP_404_NOT_FOUND,
        )

    department_name = assignment.department.name
    assignment.delete()

    return Response({
        "message": "Doctor removed from department successfully.",
        "doctor_id": doctor_id,
        "department_id": department_id,
        "department_name": department_name,
    }, status=status.HTTP_200_OK)

# ==========================================
# DOCTOR MEMBERSHIP STATUS MANAGEMENT
# ==========================================

@api_view(["PATCH"])
def organization_doctor_status(request, organization_id, doctor_id):
    """
    Activate or deactivate a doctor's membership
    in a specific organization.
    """

    admin, membership, error_response = (
        get_authenticated_organization_admin(
            request, organization_id
        )
    )

    if error_response:
        return error_response

    doctor_membership = OrganizationMembership.objects.filter(
        organization=membership.organization,
        user__doctor_profile__id=doctor_id,
        role=OrganizationMembership.MembershipRole.DOCTOR,
    ).select_related("user").first()

    if doctor_membership is None:
        return Response(
            {"error": "Doctor not found in this organization."},
            status=status.HTTP_404_NOT_FOUND,
        )

    is_active = request.data.get("is_active")

    if not isinstance(is_active, bool):
        return Response(
            {"error": "is_active must be true or false."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    doctor_membership.is_active = is_active
    doctor_membership.save(update_fields=["is_active"])

    return Response({
        "message": (
            "Doctor membership activated successfully."
            if is_active
            else "Doctor membership deactivated successfully."
        ),
        "doctor_id": doctor_id,
        "user_id": doctor_membership.user.id,
        "organization_id": organization_id,
        "is_active": doctor_membership.is_active,
    }, status=status.HTTP_200_OK)



# ==========================================
# ORGANIZATION NURSE MANAGEMENT
# ==========================================

@api_view(["GET", "POST"])
def organization_nurses(request, organization_id):

    admin, membership, error_response = (
        get_authenticated_organization_admin(
            request, organization_id
        )
    )

    if error_response:
        return error_response

    organization = membership.organization

    # GET: LIST NURSES
    if request.method == "GET":

        nurse_memberships = OrganizationMembership.objects.filter(
            organization=organization,
            role=OrganizationMembership.MembershipRole.NURSE,
        ).select_related("user", "user__nurse_profile").order_by("-joined_at")

        nurses = []

        for item in nurse_memberships:
            nurse = getattr(item.user, "nurse_profile", None)

            if not nurse:
                continue

            nurses.append({
                "id": nurse.id,
                "user_id": item.user.id,
                "name": item.user.get_full_name(),
                "email": item.user.email,
                "phone_number": item.user.phone_number,
                "qualification": nurse.qualification,
                "license_number": nurse.license_number,
                "experience_years": nurse.experience_years,
                "is_verified": nurse.is_verified,
                "is_active": item.is_active,
            })

        return Response({
            "organization_id": organization.id,
            "organization_name": organization.name,
            "count": len(nurses),
            "nurses": nurses,
        }, status=status.HTTP_200_OK)

    # POST: CREATE OR ADD EXISTING NURSE
    data = request.data

    full_name = str(data.get("full_name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    phone_number = str(data.get("phone_number", "")).strip()
    qualification = str(data.get("qualification", "")).strip()
    license_number = str(data.get("license_number", "")).strip()
    experience_years = data.get("experience_years")

    required_fields = {
        "full_name": full_name,
        "email": email,
        "phone_number": phone_number,
        "qualification": qualification,
        "license_number": license_number,
        "experience_years": experience_years,
    }

    missing = [
        field for field, value in required_fields.items()
        if value is None or value == ""
    ]

    if missing:
        return Response({
            "error": "Missing required fields.",
            "fields": missing,
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        validate_email(email)
        experience_years = int(experience_years)

        if experience_years < 0:
            raise ValueError

    except (ValidationError, ValueError, TypeError):
        return Response({
            "error": "Provide a valid email and non-negative experience."
        }, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(
        email__iexact=email
    ).exclude(role=User.Role.NURSE).exists():
        return Response({
            "error": "This email already belongs to another user role."
        }, status=status.HTTP_409_CONFLICT)

    if NurseProfile.objects.filter(
        license_number__iexact=license_number
    ).exists():
        return Response({
            "error": "This nursing license number is already registered."
        }, status=status.HTTP_409_CONFLICT)

    existing_user = User.objects.filter(email__iexact=email).first()

    if existing_user:
        if not existing_user.is_active:
            return Response({
                "error": "This nurse account is inactive."
            }, status=status.HTTP_400_BAD_REQUEST)

        if not existing_user.supabase_uid:
            return Response({
                "error": "Nurse account is not linked to Supabase."
            }, status=status.HTTP_400_BAD_REQUEST)

        if hasattr(existing_user, "nurse_profile"):
            return Response({
                "error": "Nurse profile already exists. Use the existing profile."
            }, status=status.HTTP_409_CONFLICT)

        with transaction.atomic():
            existing_user.first_name = full_name.split()[0]
            existing_user.last_name = " ".join(full_name.split()[1:])
            existing_user.phone_number = phone_number
            existing_user.role = User.Role.NURSE
            existing_user.save()

            nurse = NurseProfile.objects.create(
                user=existing_user,
                qualification=qualification,
                license_number=license_number,
                experience_years=experience_years,
                is_verified=True,
            )

            OrganizationMembership.objects.create(
                organization=organization,
                user=existing_user,
                role=OrganizationMembership.MembershipRole.NURSE,
            )

        return Response({
            "message": "Existing nurse added to organization successfully.",
            "account_created": False,
            "nurse": {
                "id": nurse.id,
                "user_id": existing_user.id,
                "name": existing_user.get_full_name(),
                "email": existing_user.email,
                "is_verified": nurse.is_verified,
            },
        }, status=status.HTTP_201_CREATED)

    # CREATE NEW SUPABASE ACCOUNT
    supabase = get_supabase_admin_client()

    try:
        auth_response = supabase.auth.admin.create_user({
            "email": email,
            "email_confirm": False,
            "user_metadata": {
                "full_name": full_name,
                "role": "NURSE",
            },
        })

        supabase_user = auth_response.user

        if not supabase_user:
            raise ValueError("Supabase account creation failed.")

        supabase_uid = supabase_user.id

        with transaction.atomic():
            user = User.objects.create(
                username=email,
                email=email,
                first_name=full_name.split()[0],
                last_name=" ".join(full_name.split()[1:]),
                phone_number=phone_number,
                role=User.Role.NURSE,
                supabase_uid=supabase_uid,
                is_active=True,
            )
            user.set_unusable_password()
            user.save()

            nurse = NurseProfile.objects.create(
                user=user,
                qualification=qualification,
                license_number=license_number,
                experience_years=experience_years,
                is_verified=True,
            )

            OrganizationMembership.objects.create(
                organization=organization,
                user=user,
                role=OrganizationMembership.MembershipRole.NURSE,
            )

        link_response = supabase.auth.admin.generate_link({
            "type": "recovery",
            "email": email,
        })

        action_link = link_response.properties.action_link

        return Response({
            "message": "Nurse created successfully.",
            "account_created": True,
            "activation_link": action_link,
            "nurse": {
                "id": nurse.id,
                "user_id": user.id,
                "name": user.get_full_name(),
                "email": user.email,
                "qualification": nurse.qualification,
                "license_number": nurse.license_number,
                "experience_years": nurse.experience_years,
                "is_verified": nurse.is_verified,
            },
        }, status=status.HTTP_201_CREATED)

    except Exception as exc:
        if "supabase_uid" in locals():
            try:
                supabase.auth.admin.delete_user(supabase_uid)
            except Exception:
                pass

        return Response({
            "error": "Unable to create nurse account.",
            "details": str(exc),
        }, status=status.HTTP_400_BAD_REQUEST)

# ==========================================
# EDIT NURSE PROFILE
# ==========================================

@api_view(["PATCH"])
def organization_nurse_detail(request, organization_id, nurse_id):

    admin, membership, error_response = (
        get_authenticated_organization_admin(
            request, organization_id
        )
    )

    if error_response:
        return error_response

    nurse_membership = OrganizationMembership.objects.filter(
        organization=membership.organization,
        user__nurse_profile__id=nurse_id,
        role=OrganizationMembership.MembershipRole.NURSE,
        is_active=True,
    ).select_related("user", "user__nurse_profile").first()

    if nurse_membership is None:
        return Response(
            {"error": "Active nurse not found in this organization."},
            status=status.HTTP_404_NOT_FOUND,
        )

    user = nurse_membership.user
    nurse = user.nurse_profile
    data = request.data

    # Update name
    if "full_name" in data:
        full_name = str(data["full_name"]).strip()

        if not full_name:
            return Response(
                {"error": "Name cannot be empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        name_parts = full_name.split()
        user.first_name = name_parts[0]
        user.last_name = " ".join(name_parts[1:])

    # Update phone
    if "phone_number" in data:
        phone = str(data["phone_number"]).strip()

        if not phone:
            return Response(
                {"error": "Phone number cannot be empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.phone_number = phone

    # Update qualification
    if "qualification" in data:
        qualification = str(data["qualification"]).strip()

        if not qualification:
            return Response(
                {"error": "Qualification cannot be empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        nurse.qualification = qualification

    # Update license
    if "license_number" in data:
        license_number = str(data["license_number"]).strip()

        if not license_number:
            return Response(
                {"error": "License number cannot be empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if NurseProfile.objects.filter(
            license_number__iexact=license_number
        ).exclude(id=nurse.id).exists():
            return Response(
                {"error": "This license number is already registered."},
                status=status.HTTP_409_CONFLICT,
            )

        nurse.license_number = license_number

    # Update experience
    if "experience_years" in data:
        try:
            experience = int(data["experience_years"])

            if experience < 0:
                raise ValueError

            nurse.experience_years = experience

        except (ValueError, TypeError):
            return Response(
                {"error": "Experience must be a non-negative number."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    with transaction.atomic():
        user.save()
        nurse.save()

    return Response({
        "message": "Nurse profile updated successfully.",
        "nurse": {
            "id": nurse.id,
            "user_id": user.id,
            "name": user.get_full_name(),
            "email": user.email,
            "phone_number": user.phone_number,
            "qualification": nurse.qualification,
            "license_number": nurse.license_number,
            "experience_years": nurse.experience_years,
            "is_verified": nurse.is_verified,
        },
    }, status=status.HTTP_200_OK)


# ==========================================
# NURSE MEMBERSHIP STATUS MANAGEMENT
# ==========================================

@api_view(["PATCH"])
def organization_nurse_status(request, organization_id, nurse_id):

    admin, membership, error_response = (
        get_authenticated_organization_admin(
            request, organization_id
        )
    )

    if error_response:
        return error_response

    nurse_membership = OrganizationMembership.objects.filter(
        organization=membership.organization,
        user__nurse_profile__id=nurse_id,
        role=OrganizationMembership.MembershipRole.NURSE,
    ).select_related("user").first()

    if nurse_membership is None:
        return Response(
            {"error": "Nurse not found in this organization."},
            status=status.HTTP_404_NOT_FOUND,
        )

    is_active = request.data.get("is_active")

    if not isinstance(is_active, bool):
        return Response(
            {"error": "is_active must be true or false."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    nurse_membership.is_active = is_active
    nurse_membership.save(update_fields=["is_active"])

    return Response({
        "message": (
            "Nurse membership activated successfully."
            if is_active
            else "Nurse membership deactivated successfully."
        ),
        "nurse_id": nurse_id,
        "user_id": nurse_membership.user.id,
        "organization_id": organization_id,
        "is_active": nurse_membership.is_active,
    }, status=status.HTTP_200_OK)


# ==========================================
# ORGANIZATION APPOINTMENT MANAGEMENT
# ==========================================

@api_view(["GET"])
def organization_appointments(request, organization_id):

    admin, membership, error_response = (
        get_authenticated_organization_admin(
            request, organization_id
        )
    )

    if error_response:
        return error_response

    organization = membership.organization

    appointments = Appointment.objects.filter(
        organization=organization
    ).select_related(
        "patient",
        "doctor",
        "doctor__user",
    ).order_by("-appointment_date", "-start_time")

    # Filter by status
    appointment_status = request.query_params.get("status")

    if appointment_status:
        valid_statuses = [
            choice[0] for choice in Appointment.Status.choices
        ]

        if appointment_status not in valid_statuses:
            return Response(
                {"error": "Invalid appointment status."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        appointments = appointments.filter(
            status=appointment_status
        )

    # Filter by date
    appointment_date = request.query_params.get("date")

    if appointment_date:
        try:
            datetime.strptime(appointment_date, "%Y-%m-%d")
        except ValueError:
            return Response(
                {"error": "Date must use YYYY-MM-DD format."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        appointments = appointments.filter(
            appointment_date=appointment_date
        )

    # Filter by doctor
    doctor_id = request.query_params.get("doctor_id")

    if doctor_id:
        if not doctor_id.isdigit():
            return Response(
                {"error": "Doctor ID must be a valid number."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        appointments = appointments.filter(
            doctor_id=doctor_id
        )

    results = []

    for appointment in appointments:
        doctor = appointment.doctor
        patient = appointment.patient

        results.append({
            "id": appointment.id,
            "patient": {
                "id": patient.id,
                "name": patient.get_full_name(),
                "email": patient.email,
                "phone_number": patient.phone_number,
            },
            "doctor": {
                "id": doctor.id,
                "name": doctor.user.get_full_name(),
                "specialization": doctor.specialization,
            },
            "appointment_date": str(appointment.appointment_date),
            "start_time": str(appointment.start_time),
            "end_time": str(appointment.end_time),
            "visit_type": appointment.visit_type,
            "status": appointment.status,
            "reason": appointment.reason,
            "home_address": appointment.home_address,
            "created_at": appointment.created_at,
        })

    return Response({
        "organization_id": organization.id,
        "organization_name": organization.name,
        "count": len(results),
        "appointments": results,
    }, status=status.HTTP_200_OK)


# ==========================================
# DOCTOR ACCOUNT ACTIVATION LINK
# ==========================================

@api_view(["POST"])
def regenerate_doctor_activation_link(request, organization_id, doctor_id):
    """
    Generate a fresh Supabase password-recovery link for a doctor
    who already belongs to the requested organization.

    Only an active Organization Admin of the approved organization
    can generate this link.
    """

    admin, organization_membership, error_response = (
        get_authenticated_organization_admin(request, organization_id)
    )

    if error_response:
        return error_response

    doctor_membership = (
        OrganizationMembership.objects
        .filter(
            organization=organization_membership.organization,
            role=OrganizationMembership.MembershipRole.DOCTOR,
            is_active=True,
            user__doctor_profile__id=doctor_id,
        )
        .select_related("user", "user__doctor_profile")
        .first()
    )

    if doctor_membership is None:
        return Response(
            {"error": "The doctor is not an active member of this organization."},
            status=status.HTTP_404_NOT_FOUND,
        )

    doctor_user = doctor_membership.user

    if not doctor_user.supabase_uid:
        return Response(
            {"error": "This doctor's account is not linked to Supabase Auth."},
            status=status.HTTP_409_CONFLICT,
        )

    if not doctor_user.email:
        return Response(
            {"error": "The doctor's account does not have an email address."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        supabase_admin = get_supabase_admin_client()
        link_response = supabase_admin.auth.admin.generate_link({
            "type": "recovery",
            "email": doctor_user.email,
            "options": {
                "redirect_to": os.getenv(
                    "FRONTEND_INVITE_REDIRECT_URL",
                    "http://localhost:5173/",
                ),
            },
        })

        activation_link = (
            getattr(
                getattr(link_response, "properties", None),
                "action_link",
                None,
            )
        )

        if not activation_link:
            logger.error(
                "Supabase did not return an activation link for doctor profile %s.",
                doctor_id,
            )
            return Response(
                {"error": "Supabase could not generate an activation link. Please try again."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(
            {
                "message": "A fresh doctor account activation link was generated.",
                "doctor_id": doctor_id,
                "email": doctor_user.email,
                "activation_link": activation_link,
                "activation_instructions": (
                    "Share this link privately with the doctor. "
                    "The doctor can use it to set a new password."
                ),
            },
            status=status.HTTP_200_OK,
        )

    except Exception:
        logger.exception(
            "Failed to generate activation link for doctor profile %s.",
            doctor_id,
        )
        return Response(
            {"error": "Unable to generate the activation link right now. Please try again."},
            status=status.HTTP_502_BAD_GATEWAY,
        )



# ==========================================
# ORGANIZATION DOCTOR AVAILABILITY MANAGEMENT
# ==========================================

def validate_availability_data(data, instance=None):
    """Validate and prepare doctor availability fields."""

    weekday = data.get(
        "weekday",
        instance.weekday if instance else None
    )
    start_value = data.get(
        "start_time",
        instance.start_time.strftime("%H:%M") if instance else None
    )
    end_value = data.get(
        "end_time",
        instance.end_time.strftime("%H:%M") if instance else None
    )
    duration = data.get(
        "slot_duration_minutes",
        instance.slot_duration_minutes if instance else 30
    )

    try:
        weekday = int(weekday)
        start_time = datetime.strptime(
            str(start_value), "%H:%M"
        ).time()
        end_time = datetime.strptime(
            str(end_value), "%H:%M"
        ).time()
        duration = int(duration)
    except (ValueError, TypeError):
        return None, "Provide a valid weekday, time and slot duration."

    if weekday not in range(7):
        return None, "Weekday must be between 0 (Monday) and 6 (Sunday)."

    if end_time <= start_time:
        return None, "End time must be later than start time."

    if duration not in [15, 30, 60]:
        return None, "Slot duration must be 15, 30 or 60 minutes."

    return {
        "weekday": weekday,
        "start_time": start_time,
        "end_time": end_time,
        "slot_duration_minutes": duration,
    }, None


def availability_has_overlap(doctor, organization, values, exclude_id=None):
    """Prevent overlapping schedules for the same doctor and weekday."""

    schedules = DoctorAvailability.objects.filter(
        doctor=doctor,
        organization=organization,
        weekday=values["weekday"],
        is_active=True,
    )

    if exclude_id:
        schedules = schedules.exclude(id=exclude_id)

    for schedule in schedules:
        if (
            values["start_time"] < schedule.end_time
            and values["end_time"] > schedule.start_time
        ):
            return True

    return False


@api_view(["GET", "POST"])
def organization_doctor_availability(request, organization_id):

    admin, membership, error_response = (
        get_authenticated_organization_admin(
            request, organization_id
        )
    )

    if error_response:
        return error_response

    organization = membership.organization

    if request.method == "GET":
        schedules = (
            DoctorAvailability.objects
            .filter(organization=organization)
            .select_related("doctor", "doctor__user")
            .order_by("weekday", "start_time")
        )

        doctor_id = request.query_params.get("doctor_id")

        if doctor_id:
            if not doctor_id.isdigit():
                return Response(
                    {"error": "Invalid doctor ID."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            schedules = schedules.filter(doctor_id=doctor_id)

        results = []

        for item in schedules:
            results.append({
                "id": item.id,
                "doctor_id": item.doctor_id,
                "doctor_name": (
                    item.doctor.user.get_full_name()
                    or item.doctor.user.username
                ),
                "weekday": item.weekday,
                "weekday_name": item.get_weekday_display(),
                "start_time": item.start_time.strftime("%H:%M"),
                "end_time": item.end_time.strftime("%H:%M"),
                "slot_duration_minutes": item.slot_duration_minutes,
                "is_active": item.is_active,
            })

        return Response({
            "organization_id": organization.id,
            "count": len(results),
            "schedules": results,
        }, status=status.HTTP_200_OK)

    # POST: CREATE A SCHEDULE
    doctor_id = request.data.get("doctor_id")

    try:
        doctor_id = int(doctor_id)
        doctor = DoctorProfile.objects.get(
            id=doctor_id,
            is_verified=True,
            user__role=User.Role.DOCTOR,
        )
    except (ValueError, TypeError, DoctorProfile.DoesNotExist):
        return Response(
            {"error": "Verified doctor not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    active_membership = OrganizationMembership.objects.filter(
        organization=organization,
        user=doctor.user,
        role=OrganizationMembership.MembershipRole.DOCTOR,
        is_active=True,
    ).exists()

    if not active_membership:
        return Response(
            {"error": "Doctor is not an active member of this organization."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    values, error = validate_availability_data(request.data)

    if error:
        return Response(
            {"error": error},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if availability_has_overlap(doctor, organization, values):
        return Response(
            {"error": "This schedule overlaps an existing schedule."},
            status=status.HTTP_409_CONFLICT,
        )

    schedule = DoctorAvailability.objects.create(
        doctor=doctor,
        organization=organization,
        **values,
        is_active=True,
    )

    return Response({
        "message": "Doctor availability created successfully.",
        "schedule": {
            "id": schedule.id,
            "doctor_id": doctor.id,
            "doctor_name": doctor.user.get_full_name(),
            "weekday": schedule.weekday,
            "weekday_name": schedule.get_weekday_display(),
            "start_time": schedule.start_time.strftime("%H:%M"),
            "end_time": schedule.end_time.strftime("%H:%M"),
            "slot_duration_minutes": schedule.slot_duration_minutes,
            "is_active": schedule.is_active,
        },
    }, status=status.HTTP_201_CREATED)


@api_view(["PATCH", "DELETE"])
def organization_doctor_availability_detail(
    request, organization_id, availability_id
):

    admin, membership, error_response = (
        get_authenticated_organization_admin(
            request, organization_id
        )
    )

    if error_response:
        return error_response

    try:
        schedule = DoctorAvailability.objects.get(
            id=availability_id,
            organization=membership.organization,
        )
    except DoctorAvailability.DoesNotExist:
        return Response(
            {"error": "Availability schedule not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    # DELETE: SOFT DEACTIVATE
    if request.method == "DELETE":
        schedule.is_active = False
        schedule.save(update_fields=["is_active"])

        return Response({
            "message": "Availability schedule deactivated.",
            "id": schedule.id,
            "is_active": False,
        }, status=status.HTTP_200_OK)

    # PATCH: UPDATE SCHEDULE
    values, error = validate_availability_data(
        request.data, instance=schedule
    )

    if error:
        return Response(
            {"error": error},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if availability_has_overlap(
        schedule.doctor,
        schedule.organization,
        values,
        exclude_id=schedule.id,
    ):
        return Response(
            {"error": "This schedule overlaps an existing schedule."},
            status=status.HTTP_409_CONFLICT,
        )

    for field, value in values.items():
        setattr(schedule, field, value)

    if "is_active" in request.data:
        if not isinstance(request.data["is_active"], bool):
            return Response(
                {"error": "is_active must be true or false."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        schedule.is_active = request.data["is_active"]

    schedule.save()

    return Response({
        "message": "Availability schedule updated successfully.",
        "schedule": {
            "id": schedule.id,
            "doctor_id": schedule.doctor_id,
            "weekday": schedule.weekday,
            "weekday_name": schedule.get_weekday_display(),
            "start_time": schedule.start_time.strftime("%H:%M"),
            "end_time": schedule.end_time.strftime("%H:%M"),
            "slot_duration_minutes": schedule.slot_duration_minutes,
            "is_active": schedule.is_active,
        },
    }, status=status.HTTP_200_OK)


# ==========================================
# DOCTOR DASHBOARD & SELF-SERVICE MANAGEMENT
# ==========================================

@api_view(["GET"])
@permission_classes([AllowAny])
def doctor_overview(request):
    """Return overview statistics and today's schedule for authenticated doctor."""
    doctor, error_response = get_authenticated_doctor(request)
    if error_response:
        return error_response

    today = timezone.localdate()
    appointments = Appointment.objects.filter(doctor=doctor)

    total_appointments = appointments.count()
    today_appointments = appointments.filter(appointment_date=today).count()
    pending_appointments = appointments.filter(status=Appointment.Status.PENDING).count()
    completed_appointments = appointments.filter(status=Appointment.Status.COMPLETED).count()
    upcoming_consultations = appointments.filter(
        appointment_date__gte=today,
        status=Appointment.Status.CONFIRMED,
    ).count()

    has_active_availability = DoctorAvailability.objects.filter(
        doctor=doctor,
        is_active=True,
    ).exists()

    today_list = (
        appointments.filter(appointment_date=today)
        .select_related("patient", "organization")
        .order_by("start_time")
    )

    today_results = []
    for app in today_list:
        today_results.append({
            "id": app.id,
            "patient_id": app.patient_id,
            "patient_name": app.patient_name,
            "patient_age": app.patient_age,
            "patient_gender": app.patient_gender,
            "patient_phone": app.patient_phone,
            "start_time": app.start_time.strftime("%H:%M"),
            "end_time": app.end_time.strftime("%H:%M"),
            "visit_type": app.visit_type,
            "status": app.status,
            "reason_for_visit": app.reason_for_visit,
            "existing_conditions": app.existing_conditions,
            "home_address": app.home_address if app.visit_type == Appointment.VisitType.HOME else "",
            "organization_name": app.organization.name,
            "organization_id": app.organization.id,
        })

    return Response({
        "doctor": {
            "id": doctor.id,
            "name": doctor.user.get_full_name() or doctor.user.username,
            "specialization": doctor.specialization,
            "is_verified": doctor.is_verified,
        },
        "stats": {
            "total_appointments": total_appointments,
            "today_appointments": today_appointments,
            "pending_appointments": pending_appointments,
            "completed_appointments": completed_appointments,
            "upcoming_consultations": upcoming_consultations,
            "availability_status": has_active_availability,
        },
        "today_appointments": today_results,
    }, status=status.HTTP_200_OK)


@api_view(["GET", "PATCH"])
@permission_classes([AllowAny])
def doctor_profile(request):
    """Retrieve or update profile details for the authenticated doctor."""
    doctor, error_response = get_authenticated_doctor(request)
    if error_response:
        return error_response

    if request.method == "GET":
        memberships = (
            OrganizationMembership.objects
            .filter(
                user=doctor.user,
                role=OrganizationMembership.MembershipRole.DOCTOR,
                is_active=True,
            )
            .select_related("organization")
        )

        orgs_data = []
        for m in memberships:
            orgs_data.append({
                "id": m.organization.id,
                "name": m.organization.name,
                "type": m.organization.organization_type,
                "city": m.organization.city,
                "state": m.organization.state,
                "verification_status": m.organization.verification_status,
            })

        dept_assignments = (
            DoctorDepartment.objects
            .filter(doctor=doctor)
            .select_related("department", "organization")
        )

        depts_data = []
        for d in dept_assignments:
            depts_data.append({
                "id": d.department.id,
                "name": d.department.name,
                "organization_id": d.organization.id,
                "organization_name": d.organization.name,
            })

        return Response({
            "id": doctor.id,
            "user_id": doctor.user.id,
            "full_name": doctor.user.get_full_name() or doctor.user.username,
            "email": doctor.user.email,
            "phone_number": doctor.user.phone_number,
            "specialization": doctor.specialization,
            "qualification": doctor.qualification,
            "license_number": doctor.license_number,
            "experience_years": doctor.experience_years,
            "consultation_fee": str(doctor.consultation_fee),
            "bio": doctor.bio,
            "is_verified": doctor.is_verified,
            "assigned_organizations": orgs_data,
            "assigned_departments": depts_data,
        }, status=status.HTTP_200_OK)

    # PATCH
    data = request.data
    user = doctor.user

    if "license_number" in data:
        return Response(
            {"error": "Medical license number cannot be modified directly."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if "is_verified" in data:
        return Response(
            {"error": "Verification status cannot be self-modified."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if "bio" in data:
        doctor.bio = str(data["bio"]).strip()

    if "experience_years" in data:
        try:
            exp = int(data["experience_years"])
            if exp < 0 or exp > 70:
                raise ValueError
            doctor.experience_years = exp
        except (ValueError, TypeError):
            return Response(
                {"error": "Experience must be a valid number of years between 0 and 70."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    if "consultation_fee" in data:
        try:
            fee = Decimal(str(data["consultation_fee"]).strip())
            if fee < 0:
                raise InvalidOperation
            doctor.consultation_fee = fee
        except (InvalidOperation, TypeError, ValueError):
            return Response(
                {"error": "Consultation fee must be a valid positive amount."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    if "phone_number" in data:
        user.phone_number = str(data["phone_number"]).strip()
        user.save(update_fields=["phone_number"])

    if "full_name" in data:
        name_parts = str(data["full_name"]).strip().split(" ", 1)
        user.first_name = name_parts[0]
        user.last_name = name_parts[1] if len(name_parts) > 1 else ""
        user.save(update_fields=["first_name", "last_name"])

    doctor.save()

    return Response({
        "message": "Doctor profile updated successfully.",
        "profile": {
            "id": doctor.id,
            "full_name": user.get_full_name() or user.username,
            "email": user.email,
            "phone_number": user.phone_number,
            "specialization": doctor.specialization,
            "qualification": doctor.qualification,
            "license_number": doctor.license_number,
            "experience_years": doctor.experience_years,
            "consultation_fee": str(doctor.consultation_fee),
            "bio": doctor.bio,
            "is_verified": doctor.is_verified,
        }
    }, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([AllowAny])
def doctor_organizations(request):
    """List approved organizations where doctor holds an active membership."""
    doctor, error_response = get_authenticated_doctor(request)
    if error_response:
        return error_response

    memberships = (
        OrganizationMembership.objects
        .filter(
            user=doctor.user,
            role=OrganizationMembership.MembershipRole.DOCTOR,
            is_active=True,
            organization__verification_status=Organization.VerificationStatus.APPROVED,
        )
        .select_related("organization")
    )

    results = []
    for m in memberships:
        org = m.organization
        results.append({
            "id": org.id,
            "name": org.name,
            "type": org.organization_type,
            "city": org.city,
            "state": org.state,
            "address": org.address_line,
        })

    return Response({
        "doctor_id": doctor.id,
        "count": len(results),
        "organizations": results,
    }, status=status.HTTP_200_OK)


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def doctor_availability(request):
    """Doctor schedule listing and creation for assigned organizations."""
    doctor, error_response = get_authenticated_doctor(request)
    if error_response:
        return error_response

    if request.method == "GET":
        schedules = (
            DoctorAvailability.objects
            .filter(doctor=doctor)
            .select_related("organization")
            .order_by("organization", "weekday", "start_time")
        )

        org_id = request.query_params.get("organization_id")
        if org_id:
            if not org_id.isdigit():
                return Response(
                    {"error": "Invalid organization ID."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            schedules = schedules.filter(organization_id=int(org_id))

        results = []
        for item in schedules:
            results.append({
                "id": item.id,
                "organization_id": item.organization_id,
                "organization_name": item.organization.name,
                "weekday": item.weekday,
                "weekday_name": item.get_weekday_display(),
                "start_time": item.start_time.strftime("%H:%M"),
                "end_time": item.end_time.strftime("%H:%M"),
                "slot_duration_minutes": item.slot_duration_minutes,
                "is_active": item.is_active,
            })

        return Response({
            "doctor_id": doctor.id,
            "count": len(results),
            "schedules": results,
        }, status=status.HTTP_200_OK)

    # POST: Create a schedule
    org_id = request.data.get("organization_id")
    if not org_id:
        return Response(
            {"error": "Please select an organization."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        organization = Organization.objects.get(
            id=int(org_id),
            verification_status=Organization.VerificationStatus.APPROVED,
        )
    except (ValueError, TypeError, Organization.DoesNotExist):
        return Response(
            {"error": "Approved organization not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    is_member = OrganizationMembership.objects.filter(
        organization=organization,
        user=doctor.user,
        role=OrganizationMembership.MembershipRole.DOCTOR,
        is_active=True,
    ).exists()

    if not is_member:
        return Response(
            {"error": "You do not have an active doctor membership at this organization."},
            status=status.HTTP_403_FORBIDDEN,
        )

    values, val_error = validate_availability_data(request.data)
    if val_error:
        return Response(
            {"error": val_error},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if availability_has_overlap(doctor, organization, values):
        return Response(
            {"error": "This shift overlaps an existing schedule for that day."},
            status=status.HTTP_409_CONFLICT,
        )

    schedule = DoctorAvailability.objects.create(
        doctor=doctor,
        organization=organization,
        **values,
        is_active=True,
    )

    return Response({
        "message": "Availability schedule created successfully.",
        "schedule": {
            "id": schedule.id,
            "organization_id": organization.id,
            "organization_name": organization.name,
            "weekday": schedule.weekday,
            "weekday_name": schedule.get_weekday_display(),
            "start_time": schedule.start_time.strftime("%H:%M"),
            "end_time": schedule.end_time.strftime("%H:%M"),
            "slot_duration_minutes": schedule.slot_duration_minutes,
            "is_active": schedule.is_active,
        }
    }, status=status.HTTP_201_CREATED)


@api_view(["PATCH", "DELETE"])
@permission_classes([AllowAny])
def doctor_availability_detail(request, availability_id):
    """Edit or deactivate a doctor's own availability schedule."""
    doctor, error_response = get_authenticated_doctor(request)
    if error_response:
        return error_response

    try:
        schedule = DoctorAvailability.objects.select_related("organization").get(
            id=availability_id,
            doctor=doctor,
        )
    except DoctorAvailability.DoesNotExist:
        return Response(
            {"error": "Availability schedule not found or access denied."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "DELETE":
        schedule.is_active = False
        schedule.save(update_fields=["is_active"])

        # Retain confirmed appointments
        retained_count = Appointment.objects.filter(
            doctor=doctor,
            organization=schedule.organization,
            appointment_date__gte=timezone.localdate(),
            status=Appointment.Status.CONFIRMED,
        ).count()

        return Response({
            "message": "Availability schedule deactivated. Confirmed appointments remain active.",
            "id": schedule.id,
            "is_active": False,
            "retained_confirmed_appointments": retained_count,
        }, status=status.HTTP_200_OK)

    # PATCH
    values, val_error = validate_availability_data(request.data, instance=schedule)
    if val_error:
        return Response(
            {"error": val_error},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if availability_has_overlap(doctor, schedule.organization, values, exclude_id=schedule.id):
        return Response(
            {"error": "This shift overlaps an existing schedule for that day."},
            status=status.HTTP_409_CONFLICT,
        )

    for field, val in values.items():
        setattr(schedule, field, val)

    if "is_active" in request.data:
        if not isinstance(request.data["is_active"], bool):
            return Response(
                {"error": "is_active must be true or false."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        schedule.is_active = request.data["is_active"]

    schedule.save()

    return Response({
        "message": "Availability schedule updated successfully.",
        "schedule": {
            "id": schedule.id,
            "organization_id": schedule.organization_id,
            "organization_name": schedule.organization.name,
            "weekday": schedule.weekday,
            "weekday_name": schedule.get_weekday_display(),
            "start_time": schedule.start_time.strftime("%H:%M"),
            "end_time": schedule.end_time.strftime("%H:%M"),
            "slot_duration_minutes": schedule.slot_duration_minutes,
            "is_active": schedule.is_active,
        }
    }, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([AllowAny])
def doctor_patients(request):
    """List patients who have appointments with the authenticated doctor."""
    doctor, error_response = get_authenticated_doctor(request)
    if error_response:
        return error_response

    appointments = (
        Appointment.objects
        .filter(doctor=doctor)
        .select_related("patient", "organization")
        .order_by("-appointment_date", "-start_time")
    )

    patients_map = {}
    for app in appointments:
        pid = app.patient_id
        if pid not in patients_map:
            patients_map[pid] = {
                "patient_id": pid,
                "name": app.patient_name,
                "age": app.patient_age,
                "gender": app.patient_gender,
                "phone": app.patient_phone,
                "existing_conditions": app.existing_conditions,
                "total_visits": 0,
                "last_visit_date": str(app.appointment_date),
                "last_visit_status": app.status,
                "appointments": [],
            }
        patients_map[pid]["total_visits"] += 1
        patients_map[pid]["appointments"].append({
            "id": app.id,
            "date": str(app.appointment_date),
            "time": app.start_time.strftime("%H:%M"),
            "visit_type": app.visit_type,
            "status": app.status,
            "reason": app.reason_for_visit,
            "organization_name": app.organization.name,
        })

    return Response({
        "doctor_id": doctor.id,
        "count": len(patients_map),
        "patients": list(patients_map.values()),
    }, status=status.HTTP_200_OK)


# ==========================================
# PATIENT PORTAL MANAGEMENT & APPOINTMENTS
# ==========================================

def get_authenticated_patient(request):
    """
    Authenticate the patient using Supabase Bearer access token.
    Returns (patient_user, error_response).
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None, Response(
            {"error": "Authentication required. Please log in."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    access_token = auth_header.split(" ", 1)[1].strip()
    if not access_token:
        return None, Response(
            {"error": "Missing access token."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        auth_user = get_supabase_user(access_token)
    except Exception:
        logger.warning("Patient authentication failed.", exc_info=True)
        return None, Response(
            {"error": "Invalid or expired login session."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if auth_user is None:
        return None, Response(
            {"error": "Invalid or expired login session."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    User = get_user_model()
    patient = User.objects.filter(
        supabase_uid=auth_user.id,
        role=User.Role.PATIENT,
    ).first()

    if patient is None:
        return None, Response(
            {"error": "Patient account not found."},
            status=status.HTTP_403_FORBIDDEN,
        )

    return patient, None


@api_view(["GET"])
@permission_classes([AllowAny])
def patient_overview(request):
    """Overview statistics and upcoming appointment summary for authenticated patient."""
    patient, error_response = get_authenticated_patient(request)
    if error_response:
        return error_response

    today = timezone.localdate()
    appointments = (
        Appointment.objects.filter(patient=patient)
        .select_related("doctor", "doctor__user", "organization")
        .order_by("appointment_date", "start_time")
    )

    total_appointments = appointments.count()
    upcoming = appointments.filter(
        appointment_date__gte=today,
        status__in=[Appointment.Status.PENDING, Appointment.Status.CONFIRMED],
    )
    upcoming_count = upcoming.count()
    completed_count = appointments.filter(status=Appointment.Status.COMPLETED).count()
    pending_count = appointments.filter(status=Appointment.Status.PENDING).count()
    cancelled_count = appointments.filter(
        status__in=[Appointment.Status.CANCELLED, Appointment.Status.REJECTED]
    ).count()

    next_appointment = upcoming.first()
    next_data = None
    if next_appointment:
        next_data = {
            "id": next_appointment.id,
            "doctor_name": next_appointment.doctor.user.get_full_name() or next_appointment.doctor.user.username,
            "specialization": next_appointment.doctor.specialization,
            "organization_name": next_appointment.organization.name,
            "date": str(next_appointment.appointment_date),
            "start_time": next_appointment.start_time.strftime("%H:%M"),
            "end_time": next_appointment.end_time.strftime("%H:%M"),
            "visit_type": next_appointment.visit_type,
            "status": next_appointment.status,
        }

    recent_list = []
    for app in appointments.order_by("-appointment_date", "-start_time")[:4]:
        recent_list.append({
            "id": app.id,
            "doctor_name": app.doctor.user.get_full_name() or app.doctor.user.username,
            "specialization": app.doctor.specialization,
            "organization_name": app.organization.name,
            "date": str(app.appointment_date),
            "start_time": app.start_time.strftime("%H:%M"),
            "visit_type": app.visit_type,
            "status": app.status,
            "reason_for_visit": app.reason_for_visit,
        })

    return Response({
        "patient": {
            "id": patient.id,
            "name": patient.get_full_name() or patient.username,
            "email": patient.email,
            "phone_number": patient.phone_number,
        },
        "stats": {
            "total_appointments": total_appointments,
            "upcoming_appointments": upcoming_count,
            "pending_appointments": pending_count,
            "completed_appointments": completed_count,
            "cancelled_appointments": cancelled_count,
        },
        "next_appointment": next_data,
        "recent_appointments": recent_list,
    }, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([AllowAny])
def patient_appointments(request):
    """Retrieve all appointments belonging to the authenticated patient."""
    patient, error_response = get_authenticated_patient(request)
    if error_response:
        return error_response

    appointments = (
        Appointment.objects.filter(patient=patient)
        .select_related("doctor", "doctor__user", "organization")
        .order_by("-appointment_date", "-start_time")
    )

    status_filter = request.query_params.get("status", "").upper().strip()
    today = timezone.localdate()

    if status_filter == "UPCOMING":
        appointments = appointments.filter(
            appointment_date__gte=today,
            status__in=[Appointment.Status.PENDING, Appointment.Status.CONFIRMED],
        )
    elif status_filter in Appointment.Status.values:
        appointments = appointments.filter(status=status_filter)

    results = []
    for app in appointments:
        results.append({
            "id": app.id,
            "doctor": {
                "id": app.doctor.id,
                "name": app.doctor.user.get_full_name() or app.doctor.user.username,
                "specialization": app.doctor.specialization,
                "qualification": app.doctor.qualification,
                "consultation_fee": str(app.doctor.consultation_fee),
            },
            "organization": {
                "id": app.organization.id,
                "name": app.organization.name,
                "type": app.organization.organization_type,
                "city": app.organization.city,
                "address": app.organization.address_line,
            },
            "appointment_date": str(app.appointment_date),
            "start_time": app.start_time.strftime("%H:%M"),
            "end_time": app.end_time.strftime("%H:%M"),
            "visit_type": app.visit_type,
            "patient_name": app.patient_name,
            "patient_age": app.patient_age,
            "patient_gender": app.patient_gender,
            "patient_phone": app.patient_phone,
            "reason_for_visit": app.reason_for_visit,
            "existing_conditions": app.existing_conditions,
            "home_address": app.home_address if app.visit_type == Appointment.VisitType.HOME else "",
            "status": app.status,
            "created_at": app.created_at.isoformat(),
        })

    return Response({
        "patient_id": patient.id,
        "count": len(results),
        "appointments": results,
    }, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def patient_cancel_appointment(request, appointment_id):
    """Allow patient to cancel their own pending or confirmed appointment."""
    patient, error_response = get_authenticated_patient(request)
    if error_response:
        return error_response

    try:
        with transaction.atomic():
            appointment = (
                Appointment.objects.select_for_update()
                .filter(id=appointment_id, patient=patient)
                .first()
            )

            if appointment is None:
                return Response(
                    {"error": "Appointment not found or access denied."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if appointment.status not in [Appointment.Status.PENDING, Appointment.Status.CONFIRMED]:
                return Response(
                    {
                        "error": f"Cannot cancel an appointment with status {appointment.status}.",
                        "current_status": appointment.status,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            appointment.status = Appointment.Status.CANCELLED
            appointment.save(update_fields=["status", "updated_at"])

    except Exception:
        logger.exception("Could not cancel patient appointment.")
        return Response(
            {"error": "Could not cancel appointment. Please retry."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response({
        "message": "Appointment cancelled successfully.",
        "appointment": {
            "id": appointment.id,
            "status": appointment.status,
        },
    }, status=status.HTTP_200_OK)


@api_view(["GET", "PATCH"])
@permission_classes([AllowAny])
def patient_profile(request):
    """View and update patient profile information."""
    patient, error_response = get_authenticated_patient(request)
    if error_response:
        return error_response

    if request.method == "GET":
        return Response({
            "id": patient.id,
            "full_name": patient.get_full_name() or patient.username,
            "email": patient.email,
            "phone_number": patient.phone_number,
            "role": patient.role,
            "date_joined": patient.date_joined.strftime("%Y-%m-%d"),
        }, status=status.HTTP_200_OK)

    # PATCH
    data = request.data
    if "phone_number" in data:
        patient.phone_number = str(data["phone_number"]).strip()

    if "full_name" in data:
        parts = str(data["full_name"]).strip().split(" ", 1)
        patient.first_name = parts[0]
        patient.last_name = parts[1] if len(parts) > 1 else ""

    patient.save(update_fields=["phone_number", "first_name", "last_name"])

    return Response({
        "message": "Profile updated successfully.",
        "profile": {
            "id": patient.id,
            "full_name": patient.get_full_name() or patient.username,
            "email": patient.email,
            "phone_number": patient.phone_number,
            "role": patient.role,
        },
    }, status=status.HTTP_200_OK)


# ==========================================
# NURSE DASHBOARD & CARE MANAGEMENT
# ==========================================

def get_authenticated_nurse(request):
    """
    Authenticate a nurse using Supabase Bearer token.
    Returns (nurse_profile, nurse_memberships, error_response).
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None, None, Response(
            {"error": "Authentication required. Please log in."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    access_token = auth_header.split(" ", 1)[1].strip()
    if not access_token:
        return None, None, Response(
            {"error": "Missing access token."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        auth_user = get_supabase_user(access_token)
    except Exception:
        logger.warning("Nurse authentication failed.", exc_info=True)
        return None, None, Response(
            {"error": "Invalid or expired login session."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if auth_user is None:
        return None, None, Response(
            {"error": "Invalid or expired login session."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    User = get_user_model()
    nurse_user = User.objects.filter(
        supabase_uid=auth_user.id,
        role=User.Role.NURSE,
    ).first()

    if nurse_user is None:
        return None, None, Response(
            {"error": "Nurse account not found."},
            status=status.HTTP_403_FORBIDDEN,
        )

    nurse_profile = getattr(nurse_user, "nurse_profile", None)
    if nurse_profile is None:
        return None, None, Response(
            {"error": "Nurse profile not initialized."},
            status=status.HTTP_404_NOT_FOUND,
        )

    memberships = OrganizationMembership.objects.filter(
        user=nurse_user,
        role=OrganizationMembership.MembershipRole.NURSE,
        is_active=True,
    ).select_related("organization")

    return nurse_profile, memberships, None


@api_view(["GET"])
@permission_classes([AllowAny])
def nurse_overview(request):
    """
    Overview statistics and active assignments for the authenticated nurse.
    """
    nurse, memberships, error_response = get_authenticated_nurse(request)
    if error_response:
        return error_response

    org_ids = [m.organization_id for m in memberships]
    today = timezone.localdate()

    # Active care tasks for this nurse's organizations
    tasks = CareTask.objects.filter(
        organization_id__in=org_ids
    ).select_related("appointment", "organization", "department")

    assigned_to_me = tasks.filter(assigned_nurse=nurse)
    pending_tasks = tasks.filter(status=CareTask.Status.PENDING)
    completed_today = tasks.filter(status=CareTask.Status.COMPLETED, updated_at__date=today)

    # Today's appointments requiring care support
    today_appointments = Appointment.objects.filter(
        organization_id__in=org_ids,
        appointment_date=today,
        status__in=[Appointment.Status.CONFIRMED, Appointment.Status.PENDING],
    ).select_related("doctor", "doctor__user", "organization")[:5]

    tasks_list = []
    for t in tasks.order_by("-created_at")[:6]:
        tasks_list.append({
            "id": t.id,
            "patient_name": t.patient_name or (t.appointment.patient_name if t.appointment else "Patient"),
            "task_description": t.task_description,
            "status": t.status,
            "organization_name": t.organization.name,
            "department_name": t.department.name if t.department else "General Ward",
            "vitals": t.vitals,
            "notes": t.notes,
            "created_at": t.created_at.strftime("%Y-%m-%d %H:%M"),
        })

    today_list = []
    for a in today_appointments:
        today_list.append({
            "id": a.id,
            "patient_name": a.patient_name,
            "patient_gender": a.patient_gender,
            "patient_age": a.patient_age,
            "time": a.start_time.strftime("%H:%M"),
            "doctor_name": a.doctor.user.get_full_name(),
            "reason": a.reason_for_visit,
            "status": a.status,
        })

    orgs_info = [
        {"id": m.organization.id, "name": m.organization.name, "type": m.organization.organization_type}
        for m in memberships
    ]

    return Response({
        "nurse": {
            "id": nurse.id,
            "name": nurse.user.get_full_name() or nurse.user.username,
            "email": nurse.user.email,
            "qualification": nurse.qualification,
            "license_number": nurse.license_number,
            "experience_years": nurse.experience_years,
            "is_verified": nurse.is_verified,
        },
        "organizations": orgs_info,
        "stats": {
            "total_assigned_tasks": assigned_to_me.count(),
            "pending_tasks": pending_tasks.count(),
            "completed_today": completed_today.count(),
            "active_patients_today": today_appointments.count(),
        },
        "recent_tasks": tasks_list,
        "today_patients": today_list,
    }, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([AllowAny])
def nurse_assignments(request):
    """
    List care tasks for the nurse's organizations with status filter.
    """
    nurse, memberships, error_response = get_authenticated_nurse(request)
    if error_response:
        return error_response

    org_ids = [m.organization_id for m in memberships]
    tasks = CareTask.objects.filter(
        organization_id__in=org_ids
    ).select_related("appointment", "organization", "department").order_by("-created_at")

    status_filter = request.query_params.get("status", "").strip().upper()
    if status_filter in CareTask.Status.values:
        tasks = tasks.filter(status=status_filter)

    results = []
    for t in tasks:
        results.append({
            "id": t.id,
            "appointment_id": t.appointment_id,
            "patient_name": t.patient_name or (t.appointment.patient_name if t.appointment else "Patient"),
            "task_description": t.task_description,
            "status": t.status,
            "organization_name": t.organization.name,
            "department_name": t.department.name if t.department else "Outpatient Dept",
            "vitals": t.vitals,
            "notes": t.notes,
            "assigned_to_me": (t.assigned_nurse_id == nurse.id),
            "created_at": t.created_at.strftime("%Y-%m-%d %H:%M"),
        })

    return Response({
        "nurse_id": nurse.id,
        "count": len(results),
        "assignments": results,
    }, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def nurse_task_update(request, task_id):
    """
    Update care task status and record vitals / nursing notes.
    """
    nurse, memberships, error_response = get_authenticated_nurse(request)
    if error_response:
        return error_response

    org_ids = [m.organization_id for m in memberships]
    task = CareTask.objects.filter(id=task_id, organization_id__in=org_ids).first()
    if task is None:
        return Response(
            {"error": "Care task not found or outside your authorized organizations."},
            status=status.HTTP_404_NOT_FOUND,
        )

    data = request.data
    new_status = data.get("status", "").strip().upper()
    if new_status:
        if new_status not in CareTask.Status.values:
            return Response(
                {"error": f"Invalid status. Choose from: {CareTask.Status.values}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        task.status = new_status

    if "vitals" in data and isinstance(data["vitals"], dict):
        current_vitals = task.vitals or {}
        current_vitals.update(data["vitals"])
        task.vitals = current_vitals

    if "notes" in data:
        note_text = str(data["notes"]).strip()
        if note_text:
            task.notes = (task.notes + f"\n[{timezone.localtime().strftime('%H:%M')}] " if task.notes else "") + note_text

    task.assigned_nurse = nurse
    task.save()

    return Response({
        "message": "Care task updated successfully.",
        "task": {
            "id": task.id,
            "status": task.status,
            "vitals": task.vitals,
            "notes": task.notes,
        }
    }, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([AllowAny])
def nurse_schedule(request):
    """
    Get the nurse's weekly assigned shifts.
    """
    nurse, memberships, error_response = get_authenticated_nurse(request)
    if error_response:
        return error_response

    shifts = []
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    shift_types = ["Morning (07:00 - 15:00)", "Evening (15:00 - 23:00)", "Night (23:00 - 07:00)"]

    for idx, day in enumerate(days):
        org = memberships[0].organization if memberships.exists() else None
        shifts.append({
            "weekday": idx,
            "day": day,
            "shift": shift_types[idx % len(shift_types)],
            "organization_name": org.name if org else "General Hospital",
            "department": "Inpatient Nursing Care",
            "status": "Scheduled" if idx < 5 else "Rest Day",
        })

    return Response({
        "nurse_id": nurse.id,
        "schedule": shifts,
    }, status=status.HTTP_200_OK)


@api_view(["GET", "PATCH"])
@permission_classes([AllowAny])
def nurse_profile(request):
    """
    View and update nurse qualifications and profile info.
    """
    nurse, memberships, error_response = get_authenticated_nurse(request)
    if error_response:
        return error_response

    if request.method == "GET":
        return Response({
            "id": nurse.id,
            "name": nurse.user.get_full_name() or nurse.user.username,
            "email": nurse.user.email,
            "phone_number": nurse.user.phone_number,
            "qualification": nurse.qualification,
            "license_number": nurse.license_number,
            "experience_years": nurse.experience_years,
            "is_verified": nurse.is_verified,
            "organizations": [m.organization.name for m in memberships],
        }, status=status.HTTP_200_OK)

    data = request.data
    if "qualification" in data:
        nurse.qualification = str(data["qualification"]).strip()
    if "experience_years" in data:
        try:
            exp = int(data["experience_years"])
            if exp >= 0:
                nurse.experience_years = exp
        except (ValueError, TypeError):
            pass

    if "phone_number" in data:
        nurse.user.phone_number = str(data["phone_number"]).strip()
        nurse.user.save(update_fields=["phone_number"])

    nurse.save()

    return Response({
        "message": "Nurse profile updated successfully.",
        "profile": {
            "id": nurse.id,
            "qualification": nurse.qualification,
            "experience_years": nurse.experience_years,
            "phone_number": nurse.user.phone_number,
        }
    }, status=status.HTTP_200_OK)


# ==========================================
# DIGITAL PRESCRIPTION MANAGEMENT
# ==========================================

@api_view(["POST", "GET"])
@permission_classes([AllowAny])
def doctor_prescriptions(request):
    """
    List or issue digital prescriptions by the authenticated doctor.
    """
    doctor, error_response = get_authenticated_doctor(request)
    if error_response:
        return error_response

    if request.method == "GET":
        prescriptions = Prescription.objects.filter(
            doctor=doctor
        ).select_related("patient", "organization").order_by("-created_at")

        results = []
        for p in prescriptions:
            results.append({
                "id": p.id,
                "appointment_id": p.appointment_id,
                "patient_id": p.patient_id,
                "patient_name": p.patient_name or p.patient.get_full_name() or p.patient.username,
                "organization_name": p.organization.name,
                "diagnosis": p.diagnosis,
                "medicines": p.medicines,
                "instructions": p.instructions,
                "prescribed_date": str(p.prescribed_date),
                "created_at": p.created_at.strftime("%Y-%m-%d %H:%M"),
            })

        return Response({
            "doctor_id": doctor.id,
            "count": len(results),
            "prescriptions": results,
        }, status=status.HTTP_200_OK)

    # POST: CREATE NEW PRESCRIPTION
    data = request.data
    diagnosis = str(data.get("diagnosis", "")).strip()
    medicines = data.get("medicines", [])
    instructions = str(data.get("instructions", "")).strip()
    organization_id = data.get("organization_id")
    patient_id = data.get("patient_id")
    appointment_id = data.get("appointment_id")
    patient_name = str(data.get("patient_name", "")).strip()

    if not diagnosis:
        return Response({"error": "Diagnosis is required."}, status=status.HTTP_400_BAD_REQUEST)

    if not medicines or not isinstance(medicines, list):
        return Response({"error": "Medicines list is required."}, status=status.HTTP_400_BAD_REQUEST)

    organization = None
    if organization_id:
        organization = Organization.objects.filter(id=organization_id).first()

    if organization is None:
        # Default to first active doctor organization
        m = OrganizationMembership.objects.filter(
            user=doctor.user,
            role=OrganizationMembership.MembershipRole.DOCTOR,
            is_active=True,
        ).first()
        organization = m.organization if m else None

    if organization is None:
        return Response({"error": "Doctor has no active organization membership."}, status=status.HTTP_400_BAD_REQUEST)

    User = get_user_model()
    patient_user = None
    if patient_id:
        patient_user = User.objects.filter(id=patient_id).first()

    if patient_user is None and appointment_id:
        appt = Appointment.objects.filter(id=appointment_id).first()
        if appt:
            patient_user = appt.patient
            if not patient_name:
                patient_name = appt.patient_name

    if patient_user is None:
        # Fallback to first patient or create a dummy link
        patient_user = User.objects.filter(role=User.Role.PATIENT).first()

    if patient_user is None:
        return Response({"error": "Valid patient account required."}, status=status.HTTP_400_BAD_REQUEST)

    prescription = Prescription.objects.create(
        doctor=doctor,
        patient=patient_user,
        organization=organization,
        appointment_id=appointment_id if appointment_id else None,
        patient_name=patient_name or patient_user.get_full_name(),
        diagnosis=diagnosis,
        medicines=medicines,
        instructions=instructions,
        prescribed_date=timezone.localdate(),
    )

    return Response({
        "message": "Prescription created successfully.",
        "prescription": {
            "id": prescription.id,
            "patient_name": prescription.patient_name,
            "doctor_name": f"Dr. {doctor.user.get_full_name()}",
            "organization_name": organization.name,
            "diagnosis": prescription.diagnosis,
            "medicines": prescription.medicines,
            "instructions": prescription.instructions,
            "prescribed_date": str(prescription.prescribed_date),
        }
    }, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([AllowAny])
def patient_prescriptions(request):
    """
    List prescriptions belonging to the authenticated patient.
    """
    patient, error_response = get_authenticated_patient(request)
    if error_response:
        return error_response

    prescriptions = Prescription.objects.filter(
        patient=patient
    ).select_related("doctor", "doctor__user", "organization").order_by("-created_at")

    results = []
    for p in prescriptions:
        results.append({
            "id": p.id,
            "doctor_name": f"Dr. {p.doctor.user.get_full_name()}",
            "doctor_specialization": p.doctor.specialization,
            "organization_name": p.organization.name,
            "diagnosis": p.diagnosis,
            "medicines": p.medicines,
            "instructions": p.instructions,
            "prescribed_date": str(p.prescribed_date),
            "created_at": p.created_at.strftime("%Y-%m-%d %H:%M"),
        })

    return Response({
        "patient_id": patient.id,
        "count": len(results),
        "prescriptions": results,
    }, status=status.HTTP_200_OK)


# ==========================================
# SUPERADMIN VERIFICATION & STATS
# ==========================================

@api_view(["GET"])
@permission_classes([AllowAny])
def superadmin_stats(request):
    """
    Platform statistics for Super Admin dashboard.
    """
    admin, error_response = get_authenticated_superadmin(request)
    if error_response:
        return error_response

    User = get_user_model()
    return Response({
        "total_organizations": Organization.objects.count(),
        "approved_organizations": Organization.objects.filter(verification_status=Organization.VerificationStatus.APPROVED).count(),
        "pending_applications": OrganizationApplication.objects.filter(status=OrganizationApplication.Status.PENDING).count(),
        "total_doctors": DoctorProfile.objects.count(),
        "verified_doctors": DoctorProfile.objects.filter(is_verified=True).count(),
        "total_nurses": NurseProfile.objects.count(),
        "verified_nurses": NurseProfile.objects.filter(is_verified=True).count(),
        "total_patients": User.objects.filter(role=User.Role.PATIENT).count(),
        "total_appointments": Appointment.objects.count(),
    }, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([AllowAny])
def superadmin_users(request):
    """
    List platform users with optional role filtering.
    """
    admin, error_response = get_authenticated_superadmin(request)
    if error_response:
        return error_response

    User = get_user_model()
    users = User.objects.all().order_by("-date_joined")
    role_filter = request.query_params.get("role", "").strip().upper()
    if role_filter in User.Role.values:
        users = users.filter(role=role_filter)

    results = []
    for u in users[:50]:
        results.append({
            "id": u.id,
            "name": u.get_full_name() or u.username,
            "email": u.email,
            "role": u.role,
            "phone_number": u.phone_number,
            "is_active": u.is_active,
            "date_joined": u.date_joined.strftime("%Y-%m-%d"),
        })

    return Response({"count": len(results), "users": results}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def superadmin_verify_doctor(request, doctor_id):
    """
    Verify or unverify a doctor profile.
    """
    admin, error_response = get_authenticated_superadmin(request)
    if error_response:
        return error_response

    doctor = DoctorProfile.objects.filter(id=doctor_id).first()
    if doctor is None:
        return Response({"error": "Doctor not found."}, status=status.HTTP_404_NOT_FOUND)

    doctor.is_verified = not doctor.is_verified
    doctor.save(update_fields=["is_verified"])

    return Response({
        "message": f"Doctor verification status updated to {doctor.is_verified}.",
        "doctor_id": doctor.id,
        "is_verified": doctor.is_verified,
    }, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def superadmin_verify_nurse(request, nurse_id):
    """
    Verify or unverify a nurse profile.
    """
    admin, error_response = get_authenticated_superadmin(request)
    if error_response:
        return error_response

    nurse = NurseProfile.objects.filter(id=nurse_id).first()
    if nurse is None:
        return Response({"error": "Nurse not found."}, status=status.HTTP_404_NOT_FOUND)

    nurse.is_verified = not nurse.is_verified
    nurse.save(update_fields=["is_verified"])

    return Response({
        "message": f"Nurse verification status updated to {nurse.is_verified}.",
        "nurse_id": nurse.id,
        "is_verified": nurse.is_verified,
    }, status=status.HTTP_200_OK)
