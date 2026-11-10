import datetime
from unittest.mock import MagicMock, patch
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from core.models import (
    User,
    Organization,
    OrganizationMembership,
    Department,
    DoctorProfile,
    DoctorDepartment,
    DoctorAvailability,
    Appointment,
    NurseProfile,
    Prescription,
    CareTask,
)


class DoctorDashboardApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create Doctor User
        self.doctor_user = User.objects.create_user(
            username="test_dr_smith",
            email="dr.smith@example.com",
            first_name="John",
            last_name="Smith",
            role=User.Role.DOCTOR,
            supabase_uid="11111111-1111-1111-1111-111111111111",
        )

        # Create Patient User
        self.patient_user = User.objects.create_user(
            username="test_patient_jane",
            email="jane.patient@example.com",
            first_name="Jane",
            last_name="Doe",
            role=User.Role.PATIENT,
            supabase_uid="22222222-2222-2222-2222-222222222222",
        )

        # Create Organization
        self.organization = Organization.objects.create(
            name="General City Hospital",
            organization_type=Organization.OrganizationType.HOSPITAL,
            registration_number="REG-HOSP-001",
            email="contact@generalcityhospital.com",
            phone_number="1234567890",
            address_line="100 Main St",
            city="Metropolis",
            state="Central",
            postal_code="12345",
            verification_status=Organization.VerificationStatus.APPROVED,
            created_by=self.doctor_user,
        )

        # Create Department
        self.department = Department.objects.create(
            organization=self.organization,
            name="Cardiology",
            description="Cardiovascular medicine",
        )

        # Create Doctor Profile
        self.doctor_profile = DoctorProfile.objects.create(
            user=self.doctor_user,
            specialization="Cardiologist",
            qualification="MBBS, MD Cardiology",
            license_number="LIC-MED-7788",
            experience_years=12,
            consultation_fee=750.00,
            bio="Senior cardiologist specializing in heart rhythm.",
            is_verified=True,
        )

        # Assign Doctor to Organization
        self.membership = OrganizationMembership.objects.create(
            organization=self.organization,
            user=self.doctor_user,
            role=OrganizationMembership.MembershipRole.DOCTOR,
            is_active=True,
        )

        # Assign Doctor to Department
        self.doctor_department = DoctorDepartment.objects.create(
            doctor=self.doctor_profile,
            organization=self.organization,
            department=self.department,
        )

        # Mock auth user return object
        self.mock_auth_user = MagicMock()
        self.mock_auth_user.id = "11111111-1111-1111-1111-111111111111"
        self.mock_auth_user.email = "dr.smith@example.com"

        self.auth_headers = {"HTTP_AUTHORIZATION": "Bearer valid-mock-token"}

    @patch("core.views.get_supabase_user")
    def test_doctor_overview(self, mock_get_user):
        mock_get_user.return_value = self.mock_auth_user

        # Create appointment for today
        today = timezone.localdate()
        Appointment.objects.create(
            patient=self.patient_user,
            doctor=self.doctor_profile,
            organization=self.organization,
            appointment_date=today,
            start_time=datetime.time(10, 0),
            end_time=datetime.time(10, 30),
            visit_type=Appointment.VisitType.HOSPITAL,
            patient_name="Jane Doe",
            patient_age=32,
            patient_gender="Female",
            patient_phone="9876543210",
            reason_for_visit="Routine cardiac checkup",
            status=Appointment.Status.PENDING,
        )

        response = self.client.get("/api/doctor/overview/", **self.auth_headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertEqual(data["doctor"]["specialization"], "Cardiologist")
        self.assertEqual(data["stats"]["total_appointments"], 1)
        self.assertEqual(data["stats"]["today_appointments"], 1)
        self.assertEqual(data["stats"]["pending_appointments"], 1)
        self.assertEqual(len(data["today_appointments"]), 1)
        self.assertEqual(data["today_appointments"][0]["patient_name"], "Jane Doe")

    @patch("core.views.get_supabase_user")
    def test_doctor_profile_get_and_patch(self, mock_get_user):
        mock_get_user.return_value = self.mock_auth_user

        # GET profile
        get_res = self.client.get("/api/doctor/profile/", **self.auth_headers)
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        data = get_res.json()
        self.assertEqual(data["license_number"], "LIC-MED-7788")
        self.assertEqual(len(data["assigned_organizations"]), 1)
        self.assertEqual(len(data["assigned_departments"]), 1)

        # PATCH allowed fields (bio, consultation_fee, experience_years)
        patch_res = self.client.patch(
            "/api/doctor/profile/",
            {
                "bio": "Updated clinical bio for Dr. Smith.",
                "consultation_fee": "850.00",
                "experience_years": 14,
            },
            format="json",
            **self.auth_headers,
        )
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.doctor_profile.refresh_from_db()
        self.assertEqual(self.doctor_profile.bio, "Updated clinical bio for Dr. Smith.")
        self.assertEqual(str(self.doctor_profile.consultation_fee), "850.00")
        self.assertEqual(self.doctor_profile.experience_years, 14)

        # PATCH attempt on protected field (license_number) must fail
        bad_patch = self.client.patch(
            "/api/doctor/profile/",
            {"license_number": "NEW-FAKE-LICENSE"},
            format="json",
            **self.auth_headers,
        )
        self.assertEqual(bad_patch.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("core.views.get_supabase_user")
    def test_doctor_availability_multiple_shifts_and_overlap(self, mock_get_user):
        mock_get_user.return_value = self.mock_auth_user

        # Shift 1 (Morning: 09:00 - 13:00) on Monday (weekday=0)
        shift1_res = self.client.post(
            "/api/doctor/availability/",
            {
                "organization_id": self.organization.id,
                "weekday": 0,
                "start_time": "09:00",
                "end_time": "13:00",
                "slot_duration_minutes": 15,
            },
            format="json",
            **self.auth_headers,
        )
        self.assertEqual(shift1_res.status_code, status.HTTP_201_CREATED)

        # Shift 2 (Evening: 16:00 - 20:00) on Monday (weekday=0) - Non-overlapping
        shift2_res = self.client.post(
            "/api/doctor/availability/",
            {
                "organization_id": self.organization.id,
                "weekday": 0,
                "start_time": "16:00",
                "end_time": "20:00",
                "slot_duration_minutes": 30,
            },
            format="json",
            **self.auth_headers,
        )
        self.assertEqual(shift2_res.status_code, status.HTTP_201_CREATED)

        # Overlapping Shift (11:00 - 14:00) on Monday - Must be rejected with 409 Conflict
        overlap_res = self.client.post(
            "/api/doctor/availability/",
            {
                "organization_id": self.organization.id,
                "weekday": 0,
                "start_time": "11:00",
                "end_time": "14:00",
                "slot_duration_minutes": 15,
            },
            format="json",
            **self.auth_headers,
        )
        self.assertEqual(overlap_res.status_code, status.HTTP_409_CONFLICT)

        # Verify 2 active shifts created
        get_res = self.client.get(
            f"/api/doctor/availability/?organization_id={self.organization.id}",
            **self.auth_headers,
        )
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(get_res.json()["schedules"]), 2)

    @patch("core.views.get_supabase_user")
    def test_appointment_lifecycle_decisions(self, mock_get_user):
        mock_get_user.return_value = self.mock_auth_user

        today = timezone.localdate()
        appointment = Appointment.objects.create(
            patient=self.patient_user,
            doctor=self.doctor_profile,
            organization=self.organization,
            appointment_date=today + datetime.timedelta(days=1),
            start_time=datetime.time(11, 0),
            end_time=datetime.time(11, 30),
            visit_type=Appointment.VisitType.HOSPITAL,
            patient_name="Jane Doe",
            patient_age=32,
            patient_gender="Female",
            patient_phone="9876543210",
            reason_for_visit="Heart palpitations",
            status=Appointment.Status.PENDING,
        )

        # 1. ACCEPT (Pending -> Confirmed)
        accept_res = self.client.post(
            f"/api/doctor/appointments/{appointment.id}/decision/",
            {"action": "ACCEPT"},
            format="json",
            **self.auth_headers,
        )
        self.assertEqual(accept_res.status_code, status.HTTP_200_OK)
        appointment.refresh_from_db()
        self.assertEqual(appointment.status, Appointment.Status.CONFIRMED)

        # 2. COMPLETE (Confirmed -> Completed)
        complete_res = self.client.post(
            f"/api/doctor/appointments/{appointment.id}/decision/",
            {"action": "COMPLETE"},
            format="json",
            **self.auth_headers,
        )
        self.assertEqual(complete_res.status_code, status.HTTP_200_OK)
        appointment.refresh_from_db()
        self.assertEqual(appointment.status, Appointment.Status.COMPLETED)

    @patch("core.views.get_supabase_user")
    def test_doctor_patients_list(self, mock_get_user):
        mock_get_user.return_value = self.mock_auth_user

        Appointment.objects.create(
            patient=self.patient_user,
            doctor=self.doctor_profile,
            organization=self.organization,
            appointment_date=timezone.localdate(),
            start_time=datetime.time(14, 0),
            end_time=datetime.time(14, 30),
            visit_type=Appointment.VisitType.HOSPITAL,
            patient_name="Jane Doe",
            patient_age=32,
            patient_gender="Female",
            patient_phone="9876543210",
            reason_for_visit="Hypertension review",
            status=Appointment.Status.CONFIRMED,
        )

        res = self.client.get("/api/doctor/patients/", **self.auth_headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(data["count"], 1)
        self.assertEqual(data["patients"][0]["name"], "Jane Doe")
        self.assertEqual(data["patients"][0]["total_visits"], 1)



class PatientPortalApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Doctor User
        self.doctor_user = User.objects.create_user(
            username="dr_patient_test",
            email="dr.patient_test@example.com",
            first_name="Alice",
            last_name="Wong",
            role=User.Role.DOCTOR,
            supabase_uid="33333333-3333-3333-3333-333333333333",
        )

        # Patient User 1
        self.patient_user1 = User.objects.create_user(
            username="patient_one",
            email="patient1@example.com",
            first_name="John",
            last_name="Doe",
            role=User.Role.PATIENT,
            supabase_uid="44444444-4444-4444-4444-444444444444",
        )

        # Patient User 2
        self.patient_user2 = User.objects.create_user(
            username="patient_two",
            email="patient2@example.com",
            first_name="Bob",
            last_name="Builder",
            role=User.Role.PATIENT,
            supabase_uid="55555555-5555-5555-5555-555555555555",
        )

        # Organization
        self.organization = Organization.objects.create(
            name="Saint Mary Health",
            organization_type=Organization.OrganizationType.HOSPITAL,
            registration_number="REG-STMARY-002",
            email="info@saintmaryhealth.com",
            phone_number="5551234567",
            address_line="200 Health Blvd",
            city="Metropolis",
            state="Central",
            postal_code="54321",
            verification_status=Organization.VerificationStatus.APPROVED,
            created_by=self.doctor_user,
        )

        # Doctor Profile
        self.doctor_profile = DoctorProfile.objects.create(
            user=self.doctor_user,
            specialization="Pediatrician",
            qualification="MBBS, DCH",
            license_number="LIC-PED-9900",
            experience_years=8,
            consultation_fee=500.00,
            bio="Compassionate pediatrician.",
            is_verified=True,
        )

        # Doctor Membership
        self.membership = OrganizationMembership.objects.create(
            organization=self.organization,
            user=self.doctor_user,
            role=OrganizationMembership.MembershipRole.DOCTOR,
            is_active=True,
        )

        # Mock Auth Users
        self.mock_auth_patient1 = MagicMock()
        self.mock_auth_patient1.id = "44444444-4444-4444-4444-444444444444"
        self.mock_auth_patient1.email = "patient1@example.com"

        self.mock_auth_patient2 = MagicMock()
        self.mock_auth_patient2.id = "55555555-5555-5555-5555-555555555555"
        self.mock_auth_patient2.email = "patient2@example.com"

        self.patient1_auth = {"HTTP_AUTHORIZATION": "Bearer mock-patient1-token"}
        self.patient2_auth = {"HTTP_AUTHORIZATION": "Bearer mock-patient2-token"}

    @patch("core.views.get_supabase_user")
    def test_patient_overview(self, mock_get_user):
        mock_get_user.return_value = self.mock_auth_patient1

        today = timezone.localdate()
        future_date = today + datetime.timedelta(days=2)

        # 1 Pending future
        Appointment.objects.create(
            patient=self.patient_user1,
            doctor=self.doctor_profile,
            organization=self.organization,
            appointment_date=future_date,
            start_time=datetime.time(10, 0),
            end_time=datetime.time(10, 15),
            visit_type=Appointment.VisitType.HOSPITAL,
            patient_name="John Doe",
            patient_age=30,
            patient_gender="Male",
            patient_phone="1234567890",
            reason_for_visit="Fever",
            status=Appointment.Status.PENDING,
        )

        # 1 Completed past
        Appointment.objects.create(
            patient=self.patient_user1,
            doctor=self.doctor_profile,
            organization=self.organization,
            appointment_date=today - datetime.timedelta(days=5),
            start_time=datetime.time(11, 0),
            end_time=datetime.time(11, 15),
            visit_type=Appointment.VisitType.HOSPITAL,
            patient_name="John Doe",
            patient_age=30,
            patient_gender="Male",
            patient_phone="1234567890",
            reason_for_visit="Routine check",
            status=Appointment.Status.COMPLETED,
        )

        # 1 Cancelled
        Appointment.objects.create(
            patient=self.patient_user1,
            doctor=self.doctor_profile,
            organization=self.organization,
            appointment_date=today - datetime.timedelta(days=1),
            start_time=datetime.time(14, 0),
            end_time=datetime.time(14, 15),
            visit_type=Appointment.VisitType.HOSPITAL,
            patient_name="John Doe",
            patient_age=30,
            patient_gender="Male",
            patient_phone="1234567890",
            reason_for_visit="Follow up",
            status=Appointment.Status.CANCELLED,
        )

        res = self.client.get("/api/patient/overview/", **self.patient1_auth)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        stats_data = data["stats"]
        self.assertEqual(stats_data["total_appointments"], 3)
        self.assertEqual(stats_data["pending_appointments"], 1)
        self.assertEqual(stats_data["completed_appointments"], 1)
        self.assertEqual(stats_data["cancelled_appointments"], 1)
        self.assertEqual(stats_data["upcoming_appointments"], 1)
        self.assertIsNotNone(data["next_appointment"])
        self.assertEqual(data["next_appointment"]["doctor_name"], "Alice Wong")

    @patch("core.views.get_supabase_user")
    def test_patient_appointments_list_and_filtering(self, mock_get_user):
        mock_get_user.return_value = self.mock_auth_patient1

        today = timezone.localdate()
        Appointment.objects.create(
            patient=self.patient_user1,
            doctor=self.doctor_profile,
            organization=self.organization,
            appointment_date=today + datetime.timedelta(days=1),
            start_time=datetime.time(9, 0),
            end_time=datetime.time(9, 15),
            visit_type=Appointment.VisitType.HOSPITAL,
            patient_name="John Doe",
            patient_age=30,
            patient_gender="Male",
            patient_phone="1234567890",
            reason_for_visit="Checkup",
            status=Appointment.Status.CONFIRMED,
        )
        Appointment.objects.create(
            patient=self.patient_user1,
            doctor=self.doctor_profile,
            organization=self.organization,
            appointment_date=today - datetime.timedelta(days=2),
            start_time=datetime.time(9, 0),
            end_time=datetime.time(9, 15),
            visit_type=Appointment.VisitType.HOSPITAL,
            patient_name="John Doe",
            patient_age=30,
            patient_gender="Male",
            patient_phone="1234567890",
            reason_for_visit="Vaccine",
            status=Appointment.Status.COMPLETED,
        )

        # List all
        res = self.client.get("/api/patient/appointments/", **self.patient1_auth)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()["count"], 2)

        # Filter by CONFIRMED
        res_conf = self.client.get("/api/patient/appointments/?status=CONFIRMED", **self.patient1_auth)
        self.assertEqual(res_conf.status_code, status.HTTP_200_OK)
        self.assertEqual(res_conf.json()["count"], 1)
        self.assertEqual(res_conf.json()["appointments"][0]["status"], "CONFIRMED")

    @patch("core.views.get_supabase_user")
    def test_patient_data_isolation(self, mock_get_user):
        # Patient 1 creates appointment
        Appointment.objects.create(
            patient=self.patient_user1,
            doctor=self.doctor_profile,
            organization=self.organization,
            appointment_date=timezone.localdate() + datetime.timedelta(days=1),
            start_time=datetime.time(9, 0),
            end_time=datetime.time(9, 15),
            visit_type=Appointment.VisitType.HOSPITAL,
            patient_name="John Doe",
            patient_age=30,
            patient_gender="Male",
            patient_phone="1234567890",
            reason_for_visit="Private checkup",
            status=Appointment.Status.CONFIRMED,
        )

        # Patient 2 requests appointments
        mock_get_user.return_value = self.mock_auth_patient2
        res = self.client.get("/api/patient/appointments/", **self.patient2_auth)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()["count"], 0)

    @patch("core.views.get_supabase_user")
    def test_patient_cancel_appointment(self, mock_get_user):
        mock_get_user.return_value = self.mock_auth_patient1

        appt = Appointment.objects.create(
            patient=self.patient_user1,
            doctor=self.doctor_profile,
            organization=self.organization,
            appointment_date=timezone.localdate() + datetime.timedelta(days=3),
            start_time=datetime.time(10, 0),
            end_time=datetime.time(10, 15),
            visit_type=Appointment.VisitType.HOSPITAL,
            patient_name="John Doe",
            patient_age=30,
            patient_gender="Male",
            patient_phone="1234567890",
            reason_for_visit="Ear ache",
            status=Appointment.Status.PENDING,
        )

        # 1. Other patient cannot cancel
        mock_get_user.return_value = self.mock_auth_patient2
        res_forbidden = self.client.post(
            f"/api/patient/appointments/{appt.id}/cancel/",
            {},
            format="json",
            **self.patient2_auth,
        )
        self.assertEqual(res_forbidden.status_code, status.HTTP_404_NOT_FOUND)

        # 2. Patient 1 cancels successfully
        mock_get_user.return_value = self.mock_auth_patient1
        res_cancel = self.client.post(
            f"/api/patient/appointments/{appt.id}/cancel/",
            {},
            format="json",
            **self.patient1_auth,
        )
        self.assertEqual(res_cancel.status_code, status.HTTP_200_OK)
        appt.refresh_from_db()
        self.assertEqual(appt.status, Appointment.Status.CANCELLED)

        # 3. Cannot cancel an already cancelled appointment
        res_again = self.client.post(
            f"/api/patient/appointments/{appt.id}/cancel/",
            {},
            format="json",
            **self.patient1_auth,
        )
        self.assertEqual(res_again.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("core.views.get_supabase_user")
    def test_patient_profile_management(self, mock_get_user):
        mock_get_user.return_value = self.mock_auth_patient1

        # GET Profile
        res_get = self.client.get("/api/patient/profile/", **self.patient1_auth)
        self.assertEqual(res_get.status_code, status.HTTP_200_OK)
        self.assertEqual(res_get.json()["email"], "patient1@example.com")

        # PATCH Profile
        res_patch = self.client.patch(
            "/api/patient/profile/",
            {"full_name": "John Alexander Doe", "phone_number": "+1-555-9876"},
            format="json",
            **self.patient1_auth,
        )
        self.assertEqual(res_patch.status_code, status.HTTP_200_OK)
        self.patient_user1.refresh_from_db()
        self.assertEqual(self.patient_user1.first_name, "John")
        self.assertEqual(self.patient_user1.last_name, "Alexander Doe")
        self.assertEqual(self.patient_user1.phone_number, "+1-555-9876")

    @patch("core.views.get_supabase_user")
    def test_booking_conflict_prevention(self, mock_get_user):
        target_date = timezone.localdate() + datetime.timedelta(days=2)
        weekday = target_date.weekday()

        # Doctor Availability for that weekday
        DoctorAvailability.objects.create(
            doctor=self.doctor_profile,
            organization=self.organization,
            weekday=weekday,
            start_time=datetime.time(9, 0),
            end_time=datetime.time(12, 0),
            slot_duration_minutes=15,
            is_active=True,
        )

        booking_payload = {
            "doctor_id": self.doctor_profile.id,
            "organization_id": self.organization.id,
            "appointment_date": target_date.isoformat(),
            "start_time": "09:00",
            "visit_type": "HOSPITAL",
            "patient_name": "John Doe",
            "patient_age": 30,
            "patient_gender": "Male",
            "patient_phone": "1234567890",
            "reason_for_visit": "Cold and cough",
        }

        # First booking succeeds
        mock_get_user.return_value = self.mock_auth_patient1
        res1 = self.client.post("/api/appointments/book/", booking_payload, format="json", **self.patient1_auth)
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        # Concurrent booking attempt for the exact same slot by another patient fails with 409 Conflict
        mock_get_user.return_value = self.mock_auth_patient2
        res2 = self.client.post("/api/appointments/book/", booking_payload, format="json", **self.patient2_auth)
        self.assertEqual(res2.status_code, status.HTTP_409_CONFLICT)


class HealthcareCoreUpgradeTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Doctor
        self.doctor_user = User.objects.create_user(
            username="doc_upgrade",
            email="doc_upgrade@example.com",
            first_name="Marcus",
            last_name="Vance",
            role=User.Role.DOCTOR,
            supabase_uid="77777777-7777-7777-7777-777777777777",
        )
        self.doctor_profile = DoctorProfile.objects.create(
            user=self.doctor_user,
            specialization="Cardiology",
            qualification="MBBS, MD",
            license_number="DOC-UPG-1122",
            experience_years=10,
            consultation_fee=600,
            is_verified=True,
        )

        # Nurse
        self.nurse_user = User.objects.create_user(
            username="nurse_florence",
            email="florence@example.com",
            first_name="Florence",
            last_name="Nightingale",
            role=User.Role.NURSE,
            supabase_uid="88888888-8888-8888-8888-888888888888",
        )
        self.nurse_profile = NurseProfile.objects.create(
            user=self.nurse_user,
            qualification="B.Sc. Nursing, RN",
            license_number="RN-UPG-3344",
            experience_years=5,
            is_verified=False,
        )

        # Patient
        self.patient_user = User.objects.create_user(
            username="patient_charlie",
            email="charlie@example.com",
            first_name="Charlie",
            last_name="Brown",
            role=User.Role.PATIENT,
            supabase_uid="99999999-9999-9999-9999-999999999999",
        )

        # Super Admin
        self.superadmin_user = User.objects.create_user(
            username="super_admin_test",
            email="superadmin@mediqo.com",
            first_name="Root",
            last_name="Admin",
            role=User.Role.SUPER_ADMIN,
            is_staff=True,
            supabase_uid="00000000-0000-0000-0000-000000000000",
        )

        # Organization
        self.organization = Organization.objects.create(
            name="Trinity Medical Center",
            organization_type=Organization.OrganizationType.HOSPITAL,
            registration_number="REG-TRINITY-778",
            email="info@trinitymedical.org",
            phone_number="5559876543",
            address_line="500 Health Way",
            city="Metropolis",
            state="Central",
            postal_code="54321",
            verification_status=Organization.VerificationStatus.APPROVED,
            created_by=self.doctor_user,
        )

        # Memberships
        OrganizationMembership.objects.create(
            organization=self.organization,
            user=self.doctor_user,
            role=OrganizationMembership.MembershipRole.DOCTOR,
            is_active=True,
        )
        OrganizationMembership.objects.create(
            organization=self.organization,
            user=self.nurse_user,
            role=OrganizationMembership.MembershipRole.NURSE,
            is_active=True,
        )

        # Mock tokens
        self.mock_doc = MagicMock(id="77777777-7777-7777-7777-777777777777", email="doc_upgrade@example.com")
        self.mock_nurse = MagicMock(id="88888888-8888-8888-8888-888888888888", email="florence@example.com")
        self.mock_patient = MagicMock(id="99999999-9999-9999-9999-999999999999", email="charlie@example.com")
        self.mock_admin = MagicMock(id="00000000-0000-0000-0000-000000000000", email="superadmin@mediqo.com")

        self.doc_auth = {"HTTP_AUTHORIZATION": "Bearer mock-doc"}
        self.nurse_auth = {"HTTP_AUTHORIZATION": "Bearer mock-nurse"}
        self.patient_auth = {"HTTP_AUTHORIZATION": "Bearer mock-patient"}
        self.admin_auth = {"HTTP_AUTHORIZATION": "Bearer mock-admin"}

    @patch("core.views.get_supabase_user")
    def test_nurse_overview_and_assignments(self, mock_get_user):
        mock_get_user.return_value = self.mock_nurse

        # Create CareTask
        task = CareTask.objects.create(
            organization=self.organization,
            patient_name="Charlie Brown",
            task_description="Initial Post-Op Vitals Check",
            status=CareTask.Status.PENDING,
        )

        # Overview
        res = self.client.get("/api/nurse/overview/", **self.nurse_auth)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(data["nurse"]["name"], "Florence Nightingale")
        self.assertEqual(data["stats"]["pending_tasks"], 1)

        # Assignments
        res_assign = self.client.get("/api/nurse/assignments/", **self.nurse_auth)
        self.assertEqual(res_assign.status_code, status.HTTP_200_OK)
        self.assertEqual(res_assign.json()["count"], 1)

    @patch("core.views.get_supabase_user")
    def test_nurse_task_update_and_vitals(self, mock_get_user):
        mock_get_user.return_value = self.mock_nurse

        task = CareTask.objects.create(
            organization=self.organization,
            patient_name="Charlie Brown",
            task_description="Triage Vital Check",
            status=CareTask.Status.PENDING,
        )

        update_payload = {
            "status": "COMPLETED",
            "vitals": {"bp": "118/76", "pulse": "70", "temp": "98.4", "spo2": "99"},
            "notes": "Patient is stable and alert.",
        }

        res = self.client.post(
            f"/api/nurse/tasks/{task.id}/update/",
            update_payload,
            format="json",
            **self.nurse_auth,
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        task.refresh_from_db()
        self.assertEqual(task.status, CareTask.Status.COMPLETED)
        self.assertEqual(task.vitals["bp"], "118/76")
        self.assertIn("Patient is stable and alert.", task.notes)
        self.assertEqual(task.assigned_nurse, self.nurse_profile)

    @patch("core.views.get_supabase_user")
    def test_nurse_permission_boundaries(self, mock_get_user):
        # Nurse cannot modify doctor availability
        mock_get_user.return_value = self.mock_nurse
        res = self.client.post(
            "/api/doctor/availability/",
            {"weekday": 0, "start_time": "09:00", "end_time": "12:00"},
            format="json",
            **self.nurse_auth,
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    @patch("core.views.get_supabase_user")
    def test_prescription_lifecycle(self, mock_get_user):
        # 1. Doctor creates prescription
        mock_get_user.return_value = self.mock_doc

        rx_payload = {
            "patient_name": "Charlie Brown",
            "patient_id": self.patient_user.id,
            "organization_id": self.organization.id,
            "diagnosis": "Acute Bronchitis",
            "medicines": [
                {"name": "Amoxicillin", "dosage": "500mg", "frequency": "Three times daily", "duration": "7 days"},
                {"name": "Paracetamol", "dosage": "650mg", "frequency": "As needed", "duration": "3 days"},
            ],
            "instructions": "Drink plenty of warm liquids. Rest adequately.",
        }

        res_create = self.client.post("/api/doctor/prescriptions/", rx_payload, format="json", **self.doc_auth)
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_create.json()["prescription"]["diagnosis"], "Acute Bronchitis")

        # 2. Doctor views their issued prescriptions
        res_doc_list = self.client.get("/api/doctor/prescriptions/", **self.doc_auth)
        self.assertEqual(res_doc_list.status_code, status.HTTP_200_OK)
        self.assertEqual(res_doc_list.json()["count"], 1)

        # 3. Patient views their prescriptions
        mock_get_user.return_value = self.mock_patient
        res_patient_list = self.client.get("/api/patient/prescriptions/", **self.patient_auth)
        self.assertEqual(res_patient_list.status_code, status.HTTP_200_OK)
        self.assertEqual(res_patient_list.json()["count"], 1)
        self.assertEqual(res_patient_list.json()["prescriptions"][0]["diagnosis"], "Acute Bronchitis")

    @patch("core.views.get_supabase_user")
    def test_superadmin_verification_and_stats(self, mock_get_user):
        mock_get_user.return_value = self.mock_admin

        # Stats
        res_stats = self.client.get("/api/superadmin/stats/", **self.admin_auth)
        self.assertEqual(res_stats.status_code, status.HTTP_200_OK)
        self.assertIn("total_organizations", res_stats.json())

        # Verify Nurse
        self.assertFalse(self.nurse_profile.is_verified)
        res_nurse_v = self.client.post(f"/api/superadmin/nurses/{self.nurse_profile.id}/verify/", **self.admin_auth)
        self.assertEqual(res_nurse_v.status_code, status.HTTP_200_OK)
        self.nurse_profile.refresh_from_db()
        self.assertTrue(self.nurse_profile.is_verified)
