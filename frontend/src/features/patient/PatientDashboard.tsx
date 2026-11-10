import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Doctor } from "../../LandingPage";
import BookingPage from "../appointments/BookingPage";
import AppointmentHistory from "../appointments/AppointmentHistory";

const API_URL = "http://127.0.0.1:8000/api";

type Theme = "light" | "dark";

interface PatientDashboardProps {
  theme: Theme;
  onToggleTheme: () => void;
  onLogout: () => void;
  patientName?: string;
  initialTab?: PatientTab;
  onBackToHome?: () => void;
}

export type PatientTab =
  | "overview"
  | "doctors"
  | "hospitals"
  | "appointments"
  | "records"
  | "prescriptions"
  | "profile"
  | "settings";

interface PatientStats {
  total_appointments: number;
  upcoming_appointments: number;
  pending_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
}

interface NextAppointmentData {
  id: number;
  doctor_name: string;
  specialization: string;
  organization_name: string;
  date: string;
  start_time: string;
  end_time: string;
  visit_type: "HOSPITAL" | "HOME";
  status: string;
}

interface HospitalItem {
  id: number;
  name: string;
  type: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  departments: string[];
  doctor_count: number;
}

interface PatientProfileState {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  role: string;
}

export default function PatientDashboard({
  theme,
  onToggleTheme,
  onLogout,
  patientName = "Patient",
  initialTab = "overview",
  onBackToHome,
}: PatientDashboardProps) {
  const [activeTab, setActiveTab] = useState<PatientTab>(initialTab);

  // Overview Data
  const [stats, setStats] = useState<PatientStats | null>(null);
  const [nextAppointment, setNextAppointment] = useState<NextAppointmentData | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  // Find Doctors Data
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [doctorSpecialization, setDoctorSpecialization] = useState("");
  const [doctorCity, setDoctorCity] = useState("");
  const [doctorMaxFee, setDoctorMaxFee] = useState("");

  // Find Hospitals Data
  const [hospitals, setHospitals] = useState<HospitalItem[]>([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [hospitalSearch, setHospitalSearch] = useState("");
  const [hospitalCity, setHospitalCity] = useState("");

  // Booking Flow State
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);

  const [patientPrescriptions, setPatientPrescriptions] = useState<
    {
      id: number;
      doctor_name: string;
      doctor_specialization: string;
      organization_name: string;
      diagnosis: string;
      medicines: { name: string; dosage: string; frequency: string; duration: string; instructions?: string }[];
      instructions: string;
      prescribed_date: string;
    }[]
  >([]);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);

  // Profile Data
  const [profile, setProfile] = useState<PatientProfileState | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: "", phone_number: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  // Prescriptions & Records
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [pastRecords, setPastRecords] = useState<
    {
      id: number;
      doctor_name: string;
      specialization: string;
      organization_name: string;
      date: string;
      reason_for_visit: string;
      existing_conditions?: string;
      status: string;
    }[]
  >([]);

  const isDark = theme === "dark";

  const colors = {
    bg: isDark ? "#0f1717" : "#f4f9f8",
    sidebar: isDark ? "#142220" : "#ffffff",
    card: isDark ? "#1a2c29" : "#ffffff",
    cardSubtle: isDark ? "#12201e" : "#f8fbfb",
    border: isDark ? "#29423e" : "#e0ece9",
    text: isDark ? "#ecf6f4" : "#13312d",
    muted: isDark ? "#93b3ad" : "#65827c",
    primary: "#087f75",
    primaryHover: "#066b63",
    mint: isDark ? "#183b34" : "#e3f4ef",
    mintText: isDark ? "#74e0c8" : "#087f75",
    coral: "#f05a36",
    coralSubtle: isDark ? "#381f18" : "#fff1ed",
    active: isDark ? "#1f3833" : "#e5f5f0",
  };

  const getSessionToken = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) {
      throw new Error("Session expired. Please log in again.");
    }
    return data.session.access_token;
  }, []);

  // 1. Load Overview
  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const token = await getSessionToken();
      const res = await fetch(`${API_URL}/patient/overview/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setStats(data.stats);
        setNextAppointment(data.next_appointment);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setOverviewLoading(false);
    }
  }, [getSessionToken]);

  // 2. Load Doctors Directory
  const loadDoctors = useCallback(async () => {
    setDoctorsLoading(true);
    try {
      const params = new URLSearchParams();
      if (doctorSearch.trim()) params.append("search", doctorSearch.trim());
      if (doctorSpecialization.trim()) params.append("specialization", doctorSpecialization.trim());
      if (doctorCity.trim()) params.append("city", doctorCity.trim());
      if (doctorMaxFee.trim()) params.append("max_fee", doctorMaxFee.trim());

      const res = await fetch(`${API_URL}/public/doctors/?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setDoctors(data.results || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDoctorsLoading(false);
    }
  }, [doctorSearch, doctorSpecialization, doctorCity, doctorMaxFee]);

  // 3. Load Hospitals Directory
  const loadHospitals = useCallback(async () => {
    setHospitalsLoading(true);
    try {
      const params = new URLSearchParams();
      if (hospitalSearch.trim()) params.append("search", hospitalSearch.trim());
      if (hospitalCity.trim()) params.append("city", hospitalCity.trim());

      const res = await fetch(`${API_URL}/public/hospitals/?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setHospitals(data.results || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHospitalsLoading(false);
    }
  }, [hospitalSearch, hospitalCity]);

  // 4. Load Records
  const loadRecords = useCallback(async () => {
    setRecordsLoading(true);
    try {
      const token = await getSessionToken();
      const res = await fetch(`${API_URL}/patient/appointments/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.appointments) {
        setPastRecords(
          data.appointments.map((a: {
            id: number;
            doctor: { name: string; specialization: string };
            organization: { name: string };
            appointment_date: string;
            reason_for_visit: string;
            existing_conditions?: string;
            status: string;
          }) => ({
            id: a.id,
            doctor_name: a.doctor.name,
            specialization: a.doctor.specialization,
            organization_name: a.organization.name,
            date: a.appointment_date,
            reason_for_visit: a.reason_for_visit,
            existing_conditions: a.existing_conditions,
            status: a.status,
          }))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRecordsLoading(false);
    }
  }, [getSessionToken]);

  // Load Patient Prescriptions
  const loadPatientPrescriptions = useCallback(async () => {
    setPrescriptionsLoading(true);
    try {
      const token = await getSessionToken();
      const res = await fetch(`${API_URL}/patient/prescriptions/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.prescriptions) {
        setPatientPrescriptions(data.prescriptions);
      }
    } catch (err) {
      console.error("Failed to load prescriptions:", err);
    } finally {
      setPrescriptionsLoading(false);
    }
  }, [getSessionToken]);

  // 5. Load Profile
  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const token = await getSessionToken();
      const res = await fetch(`${API_URL}/patient/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data);
        setProfileForm({
          full_name: data.full_name || "",
          phone_number: data.phone_number || "",
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  }, [getSessionToken]);

  // Switch tabs
  useEffect(() => {
    if (activeTab === "overview") void loadOverview();
    else if (activeTab === "doctors") void loadDoctors();
    else if (activeTab === "hospitals") void loadHospitals();
    else if (activeTab === "records") void loadRecords();
    else if (activeTab === "prescriptions") void loadPatientPrescriptions();
    else if (activeTab === "profile") void loadProfile();
  }, [activeTab, loadOverview, loadDoctors, loadHospitals, loadRecords, loadProfile, loadPatientPrescriptions]);

  // Handle Save Profile
  async function handleSaveProfile() {
    setProfileSaving(true);
    setProfileMessage("");
    try {
      const token = await getSessionToken();
      const res = await fetch(`${API_URL}/patient/profile/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile.");
      setProfileMessage("Profile updated successfully.");
      await loadProfile();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating profile.";
      setProfileMessage(msg);
    } finally {
      setProfileSaving(false);
    }
  }

  // Handle Password Reset Request
  async function handlePasswordReset() {
    if (!profile?.email) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
        redirectTo: `${window.location.origin}/`,
      });
      if (error) throw error;
      alert(`Password reset instructions have been sent to ${profile.email}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Password reset failed.";
      alert(msg);
    }
  }

  // If a booking is currently triggered
  if (bookingDoctor) {
    return (
      <BookingPage
        doctor={bookingDoctor}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onBack={() => setBookingDoctor(null)}
        onBookingSuccess={() => {
          setBookingDoctor(null);
          setActiveTab("appointments");
        }}
      />
    );
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: colors.bg,
        color: colors.text,
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Sidebar Navigation */}
      <aside
        style={{
          width: 260,
          flexShrink: 0,
          backgroundColor: colors.sidebar,
          borderRight: `1px solid ${colors.border}`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "24px 16px",
          boxSizing: "border-box",
        }}
      >
        <div>
          {/* Brand */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "0 12px 24px",
              borderBottom: `1px solid ${colors.border}`,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: `linear-gradient(135deg, ${colors.primary}, #06a396)`,
                color: "#ffffff",
                display: "grid",
                placeItems: "center",
                fontSize: 22,
                fontWeight: 800,
                boxShadow: "0 4px 12px rgba(8, 127, 117, 0.25)",
              }}
            >
              M
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>
                Mediqo
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: colors.primary,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                }}
              >
                Patient Portal
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { id: "overview", label: "Overview", icon: "⊞" },
              { id: "doctors", label: "Find Doctors", icon: "🩺" },
              { id: "hospitals", label: "Find Hospitals", icon: "🏥" },
              { id: "appointments", label: "My Appointments", icon: "📅" },
              { id: "records", label: "Medical Records", icon: "📂" },
              { id: "prescriptions", label: "Prescriptions", icon: "💊" },
              { id: "profile", label: "My Profile", icon: "👤" },
              { id: "settings", label: "Settings", icon: "⚙" },
            ].map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as PatientTab)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    width: "100%",
                    padding: "12px 14px",
                    border: "none",
                    borderRadius: 10,
                    backgroundColor: active ? colors.active : "transparent",
                    color: active ? colors.primary : colors.text,
                    fontWeight: active ? 700 : 500,
                    fontSize: 14,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ fontSize: 18, width: 22, textAlign: "center" }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}

            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  padding: "10px 14px",
                  border: "none",
                  borderRadius: 10,
                  backgroundColor: "transparent",
                  color: colors.muted,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  textAlign: "left",
                  marginTop: 8,
                }}
              >
                <span style={{ fontSize: 16, width: 22, textAlign: "center" }}>←</span>
                <span>Public Website</span>
              </button>
            )}
          </nav>
        </div>

        {/* Bottom Theme & Logout Actions */}
        <div
          style={{
            borderTop: `1px solid ${colors.border}`,
            paddingTop: 16,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <button
            onClick={onToggleTheme}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              backgroundColor: colors.cardSubtle,
              color: colors.text,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <span>Theme</span>
            <span>{isDark ? "🌙 Dark" : "☀️ Light"}</span>
          </button>

          <button
            onClick={onLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "11px 14px",
              border: "none",
              borderRadius: 8,
              backgroundColor: colors.coralSubtle,
              color: colors.coral,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <span>⎋</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "32px 40px",
          maxHeight: "100vh",
          boxSizing: "border-box",
        }}
      >
        {/* Top Header */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 28,
          }}
        >
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>
              {activeTab === "overview" && `Hello, ${patientName}`}
              {activeTab === "doctors" && "Find Verified Doctors"}
              {activeTab === "hospitals" && "Hospitals & Medical Centers"}
              {activeTab === "appointments" && "My Appointments"}
              {activeTab === "records" && "Clinical Consultation Records"}
              {activeTab === "prescriptions" && "Medical Prescriptions"}
              {activeTab === "profile" && "Personal Health Profile"}
              {activeTab === "settings" && "Account Settings"}
            </h1>
            <p style={{ color: colors.muted, margin: "6px 0 0", fontSize: 14 }}>
              {activeTab === "overview" && "Your personal healthcare dashboard and upcoming medical visits."}
              {activeTab === "doctors" && "Discover specialists, view consultation fees, and book appointments."}
              {activeTab === "hospitals" && "Browse affiliated hospitals, clinics, and clinical departments."}
              {activeTab === "appointments" && "Track confirmed, pending, and past medical appointments."}
              {activeTab === "records" && "Review doctor notes and consultation histories from past visits."}
              {activeTab === "prescriptions" && "Access prescribed medications and doctor dosage instructions."}
              {activeTab === "profile" && "Manage your contact info, medical notes, and personal details."}
              {activeTab === "settings" && "Configure notifications, themes, and security preferences."}
            </p>
          </div>

          <button
            onClick={() => setActiveTab("doctors")}
            style={{
              padding: "11px 20px",
              backgroundColor: colors.primary,
              color: "#ffffff",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(8, 127, 117, 0.25)",
            }}
          >
            + Book Appointment
          </button>
        </header>

        {/* ------------------------------------------------------------- */}
        {/* 1. OVERVIEW */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "overview" && (
          <div>
            {overviewLoading ? (
              <div style={{ padding: 40, textAlign: "center", color: colors.muted }}>
                Loading health dashboard...
              </div>
            ) : (
              <>
                {/* Metrics */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                    gap: 18,
                    marginBottom: 28,
                  }}
                >
                  {[
                    { label: "Upcoming Visits", value: stats?.upcoming_appointments ?? 0, color: colors.primary },
                    { label: "Pending Requests", value: stats?.pending_appointments ?? 0, color: colors.coral },
                    { label: "Completed Consultations", value: stats?.completed_appointments ?? 0, color: "#16a34a" },
                    { label: "Total Bookings", value: stats?.total_appointments ?? 0, color: colors.text },
                  ].map((card, i) => (
                    <div
                      key={i}
                      style={{
                        backgroundColor: colors.card,
                        border: `1px solid ${colors.border}`,
                        borderRadius: 14,
                        padding: 22,
                      }}
                    >
                      <div style={{ fontSize: 13, color: colors.muted, fontWeight: 600, marginBottom: 8 }}>
                        {card.label}
                      </div>
                      <div style={{ fontSize: 32, fontWeight: 800, color: card.color }}>
                        {card.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Next Appointment Card */}
                {nextAppointment ? (
                  <div
                    style={{
                      backgroundColor: colors.card,
                      border: `2px solid ${colors.primary}`,
                      borderRadius: 14,
                      padding: 24,
                      marginBottom: 28,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 20,
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: "4px 10px",
                          borderRadius: 6,
                          backgroundColor: colors.mint,
                          color: colors.mintText,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        ● Next Scheduled Visit
                      </span>
                      <h2 style={{ fontSize: 20, margin: "10px 0 6px" }}>
                        {nextAppointment.doctor_name}
                      </h2>
                      <div style={{ fontSize: 14, color: colors.muted }}>
                        {nextAppointment.specialization} &nbsp;·&nbsp; 🏥 {nextAppointment.organization_name}
                      </div>
                      <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700 }}>
                        📅 {nextAppointment.date} &nbsp;·&nbsp; 🕒 {nextAppointment.start_time} - {nextAppointment.end_time} &nbsp;·&nbsp; {nextAppointment.visit_type === "HOME" ? "🏠 Home Visit" : "🏥 In-Clinic"}
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab("appointments")}
                      style={{
                        padding: "10px 18px",
                        borderRadius: 8,
                        border: `1px solid ${colors.border}`,
                        backgroundColor: colors.cardSubtle,
                        color: colors.text,
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      Manage Booking →
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      backgroundColor: colors.card,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 14,
                      padding: 28,
                      marginBottom: 28,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 16,
                    }}
                  >
                    <div>
                      <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 700 }}>
                        No Upcoming Visits Scheduled
                      </h3>
                      <p style={{ margin: 0, fontSize: 13, color: colors.muted }}>
                        Need medical consultation? Browse accredited doctors and reserve an available appointment slot.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("doctors")}
                      style={{
                        padding: "11px 22px",
                        backgroundColor: colors.primary,
                        color: "#ffffff",
                        border: "none",
                        borderRadius: 8,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Browse Doctors
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 2. FIND DOCTORS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "doctors" && (
          <div>
            {/* Filter Bar */}
            <div
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: 14,
                padding: 20,
                marginBottom: 24,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 12,
              }}
            >
              <input
                type="text"
                placeholder="Search by doctor name..."
                value={doctorSearch}
                onChange={(e) => setDoctorSearch(e.target.value)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.cardSubtle,
                  color: colors.text,
                  fontSize: 13,
                  outline: "none",
                }}
              />

              <input
                type="text"
                placeholder="Specialization (e.g. Cardiology)..."
                value={doctorSpecialization}
                onChange={(e) => setDoctorSpecialization(e.target.value)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.cardSubtle,
                  color: colors.text,
                  fontSize: 13,
                  outline: "none",
                }}
              />

              <input
                type="text"
                placeholder="City / Location..."
                value={doctorCity}
                onChange={(e) => setDoctorCity(e.target.value)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.cardSubtle,
                  color: colors.text,
                  fontSize: 13,
                  outline: "none",
                }}
              />

              <input
                type="number"
                placeholder="Max Fee (₹)..."
                value={doctorMaxFee}
                onChange={(e) => setDoctorMaxFee(e.target.value)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.cardSubtle,
                  color: colors.text,
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>

            {/* Doctors Grid */}
            {doctorsLoading ? (
              <div style={{ padding: 48, textAlign: "center", color: colors.muted }}>
                Loading verified doctors...
              </div>
            ) : doctors.length === 0 ? (
              <div
                style={{
                  padding: 48,
                  textAlign: "center",
                  backgroundColor: colors.card,
                  borderRadius: 14,
                  border: `1px solid ${colors.border}`,
                  color: colors.muted,
                }}
              >
                No doctors matched your search criteria.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18 }}>
                {doctors.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      backgroundColor: colors.card,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 14,
                      padding: 22,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div>
                          <strong style={{ fontSize: 17 }}>{doc.name}</strong>
                          <div style={{ fontSize: 13, color: colors.primary, fontWeight: 600 }}>
                            {doc.specialization}
                          </div>
                        </div>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: 6,
                            backgroundColor: colors.mint,
                            color: colors.mintText,
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          ✓ Verified
                        </span>
                      </div>

                      <div style={{ fontSize: 13, color: colors.muted, marginBottom: 12 }}>
                        🎓 {doc.qualification} &nbsp;·&nbsp; ⏳ {doc.experience_years} Years Exp.
                      </div>

                      {doc.bio && (
                        <p style={{ fontSize: 13, color: colors.text, margin: "0 0 14px", lineHeight: 1.4 }}>
                          {doc.bio}
                        </p>
                      )}

                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: colors.muted, marginBottom: 6, textTransform: "uppercase" }}>
                          Practicing Hospitals
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {doc.organizations?.map((org) => (
                            <span
                              key={org.id}
                              style={{
                                fontSize: 12,
                                padding: "4px 8px",
                                borderRadius: 6,
                                backgroundColor: colors.cardSubtle,
                                border: `1px solid ${colors.border}`,
                              }}
                            >
                              🏥 {org.name} ({org.city})
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        borderTop: `1px solid ${colors.border}`,
                        paddingTop: 16,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <span style={{ fontSize: 12, color: colors.muted }}>Consultation Fee</span>
                        <div style={{ fontSize: 18, fontWeight: 800, color: colors.primary }}>
                          ₹ {doc.consultation_fee}
                        </div>
                      </div>

                      <button
                        onClick={() => setBookingDoctor(doc)}
                        style={{
                          padding: "10px 20px",
                          borderRadius: 8,
                          border: "none",
                          backgroundColor: colors.primary,
                          color: "#ffffff",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Book Visit →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 3. FIND HOSPITALS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "hospitals" && (
          <div>
            <div
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: 14,
                padding: 20,
                marginBottom: 24,
                display: "grid",
                gridTemplateColumns: "2fr 1fr",
                gap: 12,
              }}
            >
              <input
                type="text"
                placeholder="Search hospital or clinic name..."
                value={hospitalSearch}
                onChange={(e) => setHospitalSearch(e.target.value)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.cardSubtle,
                  color: colors.text,
                  fontSize: 13,
                  outline: "none",
                }}
              />

              <input
                type="text"
                placeholder="Filter by city..."
                value={hospitalCity}
                onChange={(e) => setHospitalCity(e.target.value)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.cardSubtle,
                  color: colors.text,
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>

            {hospitalsLoading ? (
              <div style={{ padding: 48, textAlign: "center", color: colors.muted }}>
                Loading accredited hospitals...
              </div>
            ) : hospitals.length === 0 ? (
              <div
                style={{
                  padding: 48,
                  textAlign: "center",
                  backgroundColor: colors.card,
                  borderRadius: 14,
                  border: `1px solid ${colors.border}`,
                  color: colors.muted,
                }}
              >
                No hospitals matched your search.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18 }}>
                {hospitals.map((hosp) => (
                  <div
                    key={hosp.id}
                    style={{
                      backgroundColor: colors.card,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 14,
                      padding: 22,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <strong style={{ fontSize: 17 }}>{hosp.name}</strong>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: 6,
                            backgroundColor: colors.mint,
                            color: colors.mintText,
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {hosp.type}
                        </span>
                      </div>

                      <div style={{ fontSize: 13, color: colors.muted, marginBottom: 12 }}>
                        📍 {hosp.address}, {hosp.city}, {hosp.state} {hosp.postal_code}
                      </div>

                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: colors.muted, marginBottom: 6, textTransform: "uppercase" }}>
                          Clinical Departments
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {hosp.departments?.map((dept, i) => (
                            <span
                              key={i}
                              style={{
                                fontSize: 11,
                                padding: "4px 8px",
                                borderRadius: 6,
                                backgroundColor: colors.cardSubtle,
                                border: `1px solid ${colors.border}`,
                                color: colors.primary,
                                fontWeight: 600,
                              }}
                            >
                              ⚕ {dept}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        borderTop: `1px solid ${colors.border}`,
                        paddingTop: 14,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontSize: 13, color: colors.muted }}>
                        👥 {hosp.doctor_count} Doctor{hosp.doctor_count !== 1 ? "s" : ""} on staff
                      </span>

                      <button
                        onClick={() => {
                          setDoctorCity(hosp.city);
                          setActiveTab("doctors");
                        }}
                        style={{
                          padding: "8px 14px",
                          borderRadius: 6,
                          border: `1px solid ${colors.border}`,
                          backgroundColor: colors.cardSubtle,
                          color: colors.text,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        View Doctors →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 4. MY APPOINTMENTS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "appointments" && (
          <div>
            <AppointmentHistory
              onBookNew={() => setActiveTab("doctors")}
              colors={colors}
            />
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 5. MEDICAL RECORDS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "records" && (
          <div>
            <div
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: 14,
                padding: 24,
                marginBottom: 20,
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 6px" }}>
                Consultation Clinical Records
              </h2>
              <p style={{ fontSize: 13, color: colors.muted, margin: 0 }}>
                Aggregated medical histories, recorded symptoms, and doctor diagnoses from your appointments.
              </p>
            </div>

            {recordsLoading ? (
              <div style={{ padding: 40, textAlign: "center", color: colors.muted }}>
                Loading medical records...
              </div>
            ) : pastRecords.length === 0 ? (
              <div
                style={{
                  padding: 48,
                  textAlign: "center",
                  backgroundColor: colors.card,
                  borderRadius: 14,
                  border: `1px solid ${colors.border}`,
                  color: colors.muted,
                }}
              >
                No clinical records found. Once you complete doctor consultations, records will appear here.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {pastRecords.map((rec) => (
                  <div
                    key={rec.id}
                    style={{
                      backgroundColor: colors.card,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 12,
                      padding: 20,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <strong>{rec.doctor_name} ({rec.specialization})</strong>
                      <span style={{ fontSize: 12, color: colors.muted }}>📅 {rec.date}</span>
                    </div>

                    <div style={{ fontSize: 13, color: colors.muted, marginBottom: 8 }}>
                      🏥 {rec.organization_name}
                    </div>

                    <div style={{ fontSize: 13 }}>
                      <strong style={{ color: colors.muted }}>Chief Complaint / Symptoms:</strong>
                      <div style={{ marginTop: 2, padding: "8px 12px", backgroundColor: colors.cardSubtle, borderRadius: 6 }}>
                        {rec.reason_for_visit}
                      </div>
                    </div>

                    {rec.existing_conditions && (
                      <div style={{ fontSize: 13, marginTop: 8 }}>
                        <strong style={{ color: colors.muted }}>Pre-existing Conditions:</strong>
                        <div style={{ marginTop: 2, padding: "8px 12px", backgroundColor: colors.cardSubtle, borderRadius: 6 }}>
                          {rec.existing_conditions}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 6. PRESCRIPTIONS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "prescriptions" && (
          <div>
            <div
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: 14,
                padding: 24,
                marginBottom: 20,
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 6px" }}>
                My Prescriptions ({patientPrescriptions.length})
              </h2>
              <p style={{ fontSize: 13, color: colors.muted, margin: 0 }}>
                Digital prescriptions provided by doctors during your medical consultations.
              </p>
            </div>

            {prescriptionsLoading ? (
              <div style={{ padding: 40, textAlign: "center", color: colors.muted }}>
                Loading prescriptions...
              </div>
            ) : patientPrescriptions.length === 0 ? (
              <div
                style={{
                  padding: 40,
                  textAlign: "center",
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 14,
                  color: colors.muted,
                }}
              >
                No medical prescriptions recorded yet. Prescriptions issued by doctors during your consultations will appear here.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 16 }}>
                {patientPrescriptions.map((rx) => (
                  <div
                    key={rx.id}
                    style={{
                      backgroundColor: colors.card,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 14,
                      padding: 24,
                      boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        borderBottom: `1px solid ${colors.border}`,
                        paddingBottom: 14,
                        marginBottom: 16,
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: 16 }}>Prescription #RX-{rx.id}</strong>
                        <div style={{ fontSize: 12, color: colors.muted, marginTop: 3 }}>
                          Issued on: {rx.prescribed_date} • {rx.organization_name}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700, color: colors.primary }}>{rx.doctor_name}</div>
                        <div style={{ fontSize: 12, color: colors.muted }}>{rx.doctor_specialization}</div>
                      </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          borderRadius: 6,
                          backgroundColor: colors.coralSubtle,
                          color: colors.coral,
                          fontSize: 12,
                          fontWeight: 700,
                          marginBottom: 8,
                        }}
                      >
                        Diagnosis: {rx.diagnosis}
                      </span>
                      {rx.instructions && (
                        <p style={{ fontSize: 13, margin: "4px 0 0", color: colors.text }}>
                          <strong>Doctor Instructions:</strong> {rx.instructions}
                        </p>
                      )}
                    </div>

                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${colors.border}`, color: colors.muted }}>
                          <th style={{ textAlign: "left", padding: "8px 0" }}>Medication</th>
                          <th style={{ textAlign: "left", padding: "8px 0" }}>Dosage</th>
                          <th style={{ textAlign: "left", padding: "8px 0" }}>Frequency</th>
                          <th style={{ textAlign: "left", padding: "8px 0" }}>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(rx.medicines || []).map((med, idx) => (
                          <tr key={idx} style={{ borderBottom: `1px solid ${colors.border}` }}>
                            <td style={{ padding: "10px 0", fontWeight: 700 }}>{med.name}</td>
                            <td style={{ padding: "10px 0" }}>{med.dosage}</td>
                            <td style={{ padding: "10px 0" }}>{med.frequency}</td>
                            <td style={{ padding: "10px 0" }}>{med.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 7. MY PROFILE */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "profile" && (
          <div style={{ maxWidth: 600 }}>
            <div
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: 14,
                padding: 28,
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 20px" }}>
                Patient Profile Information
              </h2>

              {profileLoading ? (
                <div style={{ padding: 20, color: colors.muted }}>Loading profile...</div>
              ) : (
                <div style={{ display: "grid", gap: 16 }}>
                  {profileMessage && (
                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: 8,
                        backgroundColor: colors.mint,
                        color: colors.mintText,
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {profileMessage}
                    </div>
                  )}

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: colors.muted, marginBottom: 4 }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: `1px solid ${colors.border}`,
                        backgroundColor: colors.cardSubtle,
                        color: colors.text,
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: colors.muted, marginBottom: 4 }}>
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={profileForm.phone_number}
                      onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: `1px solid ${colors.border}`,
                        backgroundColor: colors.cardSubtle,
                        color: colors.text,
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: colors.muted, marginBottom: 4 }}>
                      Registered Email
                    </label>
                    <div style={{ padding: "10px 14px", backgroundColor: colors.cardSubtle, borderRadius: 8, color: colors.muted }}>
                      {profile?.email} (Managed via Supabase Auth)
                    </div>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <button
                      disabled={profileSaving}
                      onClick={() => void handleSaveProfile()}
                      style={{
                        padding: "11px 22px",
                        borderRadius: 8,
                        border: "none",
                        backgroundColor: colors.primary,
                        color: "#ffffff",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {profileSaving ? "Saving..." : "Save Profile Details"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 8. SETTINGS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "settings" && (
          <div style={{ maxWidth: 600, display: "grid", gap: 20 }}>
            <div
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: 14,
                padding: 24,
              }}
            >
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>Appearance</h3>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Dark Theme</div>
                  <div style={{ fontSize: 12, color: colors.muted }}>
                    Toggle between clinical light mode and eye-friendly dark mode.
                  </div>
                </div>
                <button
                  onClick={onToggleTheme}
                  style={{
                    padding: "9px 18px",
                    borderRadius: 8,
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.cardSubtle,
                    color: colors.text,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {isDark ? "🌙 Dark" : "☀️ Light"}
                </button>
              </div>
            </div>

            <div
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: 14,
                padding: 24,
              }}
            >
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>Security</h3>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Password Reset</div>
                  <div style={{ fontSize: 12, color: colors.muted }}>
                    Send an email with a secure link to update your password.
                  </div>
                </div>
                <button
                  onClick={() => void handlePasswordReset()}
                  style={{
                    padding: "9px 18px",
                    borderRadius: 8,
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.cardSubtle,
                    color: colors.primary,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Reset Password
                </button>
              </div>
            </div>

            <div
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: 14,
                padding: 24,
              }}
            >
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>Account Session</h3>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Log Out</div>
                  <div style={{ fontSize: 12, color: colors.muted }}>
                    Safely log out of your current session.
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  style={{
                    padding: "9px 18px",
                    borderRadius: 8,
                    border: "none",
                    backgroundColor: colors.coralSubtle,
                    color: colors.coral,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
