import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const API_URL = "http://127.0.0.1:8000/api";

type Theme = "light" | "dark";

interface DoctorDashboardProps {
  theme: Theme;
  onToggleTheme: () => void;
  onLogout: () => void;
  doctorName?: string;
}

type Tab =
  | "overview"
  | "appointments"
  | "availability"
  | "patients"
  | "prescriptions"
  | "records"
  | "profile"
  | "settings";

interface DoctorStats {
  total_appointments: number;
  today_appointments: number;
  pending_appointments: number;
  completed_appointments: number;
  upcoming_consultations: number;
  availability_status: boolean;
}

interface AppointmentItem {
  id: number;
  patient_id?: number;
  patient?: {
    id: number;
    name: string;
    age: number;
    gender: string;
    phone: string;
  };
  patient_name?: string;
  patient_age?: number;
  patient_gender?: string;
  patient_phone?: string;
  organization?: {
    id: number;
    name: string;
    type: string;
  };
  organization_name?: string;
  organization_id?: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  visit_type: "HOSPITAL" | "HOME";
  existing_conditions?: string;
  reason_for_visit?: string;
  home_address?: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "REJECTED";
  created_at?: string;
}

interface OrganizationOption {
  id: number;
  name: string;
  type: string;
  city: string;
  state: string;
  address?: string;
}

interface AvailabilitySchedule {
  id: number;
  organization_id: number;
  organization_name: string;
  weekday: number;
  weekday_name: string;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_active: boolean;
}

interface PatientRecord {
  patient_id: number;
  name: string;
  age: number;
  gender: string;
  phone: string;
  existing_conditions: string;
  total_visits: number;
  last_visit_date: string;
  last_visit_status: string;
  appointments: {
    id: number;
    date: string;
    time: string;
    visit_type: string;
    status: string;
    reason: string;
    organization_name: string;
  }[];
}

interface DoctorProfileData {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  phone_number: string;
  specialization: string;
  qualification: string;
  license_number: string;
  experience_years: number;
  consultation_fee: string;
  bio: string;
  is_verified: boolean;
  assigned_organizations: {
    id: number;
    name: string;
    type: string;
    city: string;
    state: string;
  }[];
  assigned_departments: {
    id: number;
    name: string;
    organization_id: number;
    organization_name: string;
  }[];
}

interface PrescriptionItem {
  id: string;
  appointment_id?: number;
  patient_name: string;
  patient_age: string;
  date: string;
  medicines: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[];
  notes: string;
}

function getTodayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const initialPrescriptions: PrescriptionItem[] = [
  {
    id: "RX-101",
    patient_name: "John Doe",
    patient_age: "42",
    date: "2026-11-09",
    medicines: [
      {
        name: "Atorvastatin",
        dosage: "20mg",
        frequency: "Once daily at bedtime",
        duration: "30 days",
        instructions: "Take after dinner with water",
      },
      {
        name: "Aspirin",
        dosage: "75mg",
        frequency: "Once daily after food",
        duration: "30 days",
        instructions: "Do not take on an empty stomach",
      },
    ],
    notes: "Follow up in 4 weeks with fresh lipid profile.",
  },
];

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function DoctorDashboard({
  theme,
  onToggleTheme,
  onLogout,
  doctorName = "Doctor",
}: DoctorDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [token, setToken] = useState<string>("");

  // Overview State
  const [stats, setStats] = useState<DoctorStats | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<AppointmentItem[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(true);

  // Appointments State
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [appointmentFilter, setAppointmentFilter] = useState<string>("ALL");
  const [appointmentSearch, setAppointmentSearch] = useState<string>("");
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentItem | null>(null);
  const [actionProcessing, setActionProcessing] = useState<number | null>(null);

  // Availability State
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [schedules, setSchedules] = useState<AvailabilitySchedule[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<AvailabilitySchedule | null>(null);
  const [shiftForm, setShiftForm] = useState({
    weekday: 0,
    start_time: "09:00",
    end_time: "13:00",
    slot_duration_minutes: 15,
  });
  const [shiftError, setShiftError] = useState("");
  const [shiftSaving, setShiftSaving] = useState(false);

  // Patients State
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);

  // Prescriptions State
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>(initialPrescriptions);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [newRxPatient, setNewRxPatient] = useState("");
  const [newRxAge, setNewRxAge] = useState("");
  const [newRxNotes, setNewRxNotes] = useState("");
  const [newRxMeds, setNewRxMeds] = useState([
    { name: "", dosage: "", frequency: "Twice daily", duration: "5 days", instructions: "" },
  ]);

  // Profile State
  const [profile, setProfile] = useState<DoctorProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    phone_number: "",
    specialization: "",
    experience_years: 0,
    consultation_fee: "500",
    bio: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);

  // Generic notifications
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(""), 4500);
  }

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

  // Get authentication session token
  const getAccessToken = useCallback(async () => {
    if (token) return token;
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) {
      throw new Error("Authentication session missing. Please log in again.");
    }
    setToken(data.session.access_token);
    return data.session.access_token;
  }, [token]);

  // Load Overview Data
  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const currentToken = await getAccessToken();
      const res = await fetch(`${API_URL}/doctor/overview/`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load overview");
      setStats(data.stats);
      setTodayAppointments(data.today_appointments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setOverviewLoading(false);
    }
  }, [getAccessToken]);

  // Load Doctor Appointments
  const loadAppointments = useCallback(async () => {
    setAppointmentsLoading(true);
    try {
      const currentToken = await getAccessToken();
      const res = await fetch(`${API_URL}/doctor/appointments/`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load appointments");
      setAppointments(data.appointments || []);
    } catch (err) {
      console.error(err);
      showToast("Unable to fetch appointment list.", "error");
    } finally {
      setAppointmentsLoading(false);
    }
  }, [getAccessToken]);

  // Load Organizations where Doctor is member
  const loadOrganizations = useCallback(async () => {
    try {
      const currentToken = await getAccessToken();
      const res = await fetch(`${API_URL}/doctor/organizations/`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      const data = await res.json();
      if (res.ok && data.organizations?.length > 0) {
        setOrganizations(data.organizations);
        if (!selectedOrgId) {
          setSelectedOrgId(data.organizations[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [getAccessToken, selectedOrgId]);

  // Load Availability Schedules
  const loadSchedules = useCallback(async () => {
    if (!selectedOrgId) return;
    setAvailabilityLoading(true);
    try {
      const currentToken = await getAccessToken();
      const res = await fetch(
        `${API_URL}/doctor/availability/?organization_id=${selectedOrgId}`,
        {
          headers: { Authorization: `Bearer ${currentToken}` },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load schedules");
      setSchedules(data.schedules || []);
    } catch (err) {
      console.error(err);
      showToast("Could not retrieve availability schedules.", "error");
    } finally {
      setAvailabilityLoading(false);
    }
  }, [getAccessToken, selectedOrgId]);

  // Load Patients
  const loadPatients = useCallback(async () => {
    setPatientsLoading(true);
    try {
      const currentToken = await getAccessToken();
      const res = await fetch(`${API_URL}/doctor/patients/`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load patients");
      setPatients(data.patients || []);
    } catch (err) {
      console.error(err);
      showToast("Could not load patient list.", "error");
    } finally {
      setPatientsLoading(false);
    }
  }, [getAccessToken]);

  // Load Profile
  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const currentToken = await getAccessToken();
      const res = await fetch(`${API_URL}/doctor/profile/`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load profile");
      setProfile(data);
      setProfileForm({
        full_name: data.full_name || "",
        phone_number: data.phone_number || "",
        specialization: data.specialization || "",
        experience_years: data.experience_years || 0,
        consultation_fee: data.consultation_fee || "500",
        bio: data.bio || "",
      });
    } catch (err) {
      console.error(err);
      showToast("Could not load doctor profile.", "error");
    } finally {
      setProfileLoading(false);
    }
  }, [getAccessToken]);

  const loadPrescriptions = useCallback(async () => {
    try {
      const token = await getAccessToken();
      const res = await fetch(`${API_URL}/doctor/prescriptions/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.prescriptions && data.prescriptions.length > 0) {
        const loaded: PrescriptionItem[] = data.prescriptions.map((p: { id: number; patient_name: string; prescribed_date: string; medicines: any[]; diagnosis: string; instructions: string }) => ({
          id: `RX-${p.id}`,
          patient_name: p.patient_name,
          patient_age: "N/A",
          date: p.prescribed_date,
          medicines: p.medicines || [],
          notes: p.diagnosis || p.instructions || "",
        }));
        setPrescriptions(loaded);
      }
    } catch {
      // Keep existing
    }
  }, [getAccessToken]);

  // Trigger loads on tab switch
  useEffect(() => {
    if (activeTab === "overview") {
      void loadOverview();
    } else if (activeTab === "appointments") {
      void loadAppointments();
    } else if (activeTab === "availability") {
      void loadOrganizations();
    } else if (activeTab === "patients") {
      void loadPatients();
    } else if (activeTab === "prescriptions") {
      void loadPrescriptions();
    } else if (activeTab === "profile") {
      void loadProfile();
    }
  }, [activeTab, loadOverview, loadAppointments, loadOrganizations, loadPatients, loadPrescriptions, loadProfile]);

  useEffect(() => {
    if (activeTab === "availability" && selectedOrgId) {
      void loadSchedules();
    }
  }, [activeTab, selectedOrgId, loadSchedules]);

  // Handle Appointment Decision (Accept, Reject, Complete, Cancel)
  async function handleAppointmentDecision(
    appointmentId: number,
    action: "ACCEPT" | "REJECT" | "COMPLETE" | "CANCEL"
  ) {
    setActionProcessing(appointmentId);
    try {
      const currentToken = await getAccessToken();
      const res = await fetch(
        `${API_URL}/doctor/appointments/${appointmentId}/decision/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentToken}`,
          },
          body: JSON.stringify({ action }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      showToast(data.message || "Appointment updated successfully.");
      await loadAppointments();
      if (activeTab === "overview") await loadOverview();
      if (selectedAppointment && selectedAppointment.id === appointmentId) {
        setSelectedAppointment((prev) =>
          prev ? { ...prev, status: data.appointment.status } : null
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error updating appointment";
      showToast(message, "error");
    } finally {
      setActionProcessing(null);
    }
  }

  // Handle Availability Save (Create or Edit)
  async function handleSaveShift() {
    if (!selectedOrgId) {
      setShiftError("Please select an organization first.");
      return;
    }
    setShiftSaving(true);
    setShiftError("");

    try {
      const currentToken = await getAccessToken();
      const isEditing = !!editingSchedule;
      const url = isEditing
        ? `${API_URL}/doctor/availability/${editingSchedule.id}/`
        : `${API_URL}/doctor/availability/`;
      const method = isEditing ? "PATCH" : "POST";

      const payload = {
        organization_id: selectedOrgId,
        weekday: Number(shiftForm.weekday),
        start_time: shiftForm.start_time,
        end_time: shiftForm.end_time,
        slot_duration_minutes: Number(shiftForm.slot_duration_minutes),
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to save schedule shift.");

      showToast(
        isEditing
          ? "Shift updated successfully."
          : "New working shift added successfully."
      );
      setShowShiftModal(false);
      setEditingSchedule(null);
      await loadSchedules();
      if (stats) void loadOverview();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving shift";
      setShiftError(msg);
    } finally {
      setShiftSaving(false);
    }
  }

  // Handle Shift Deactivation
  async function handleDeleteShift(scheduleId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to remove this shift? Note: Any existing confirmed patient appointments on this date will remain safe and active."
    );
    if (!confirmed) return;

    try {
      const currentToken = await getAccessToken();
      const res = await fetch(`${API_URL}/doctor/availability/${scheduleId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to delete schedule");
      showToast(data.message || "Shift removed.");
      await loadSchedules();
      if (stats) void loadOverview();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove shift";
      showToast(msg, "error");
    }
  }

  // Handle Save Profile
  async function handleSaveProfile() {
    setProfileSaving(true);
    try {
      const currentToken = await getAccessToken();
      const res = await fetch(`${API_URL}/doctor/profile/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          full_name: profileForm.full_name,
          phone_number: profileForm.phone_number,
          experience_years: profileForm.experience_years,
          consultation_fee: profileForm.consultation_fee,
          bio: profileForm.bio,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      showToast("Profile details updated successfully.");
      setProfileEditing(false);
      await loadProfile();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile";
      showToast(msg, "error");
    } finally {
      setProfileSaving(false);
    }
  }

  // Handle Create Prescription
  function handleSavePrescription() {
    if (!newRxPatient.trim()) {
      alert("Please provide the patient name.");
      return;
    }
    const validMeds = newRxMeds.filter((m) => m.name.trim() !== "");
    if (validMeds.length === 0) {
      alert("Please specify at least one medication.");
      return;
    }

    void (async () => {
      try {
        const token = await getAccessToken();
        const res = await fetch(`${API_URL}/doctor/prescriptions/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            patient_name: newRxPatient.trim(),
            diagnosis: newRxNotes.trim() || "Consultation Assessment",
            medicines: validMeds,
            instructions: newRxNotes.trim(),
          }),
        });
        const data = await res.json();
        const rxId = data.prescription?.id ? `RX-${data.prescription.id}` : `RX-${Math.floor(1000 + Math.random() * 9000)}`;
        const newEntry: PrescriptionItem = {
          id: rxId,
          patient_name: newRxPatient.trim(),
          patient_age: newRxAge.trim() || "N/A",
          date: getTodayDateString(),
          medicines: validMeds,
          notes: newRxNotes.trim(),
        };
        setPrescriptions((prev) => [newEntry, ...prev]);
        showToast(`Prescription ${newEntry.id} issued and saved.`);
        setShowPrescriptionModal(false);
        setNewRxPatient("");
        setNewRxAge("");
        setNewRxNotes("");
        setNewRxMeds([
          { name: "", dosage: "", frequency: "Twice daily", duration: "5 days", instructions: "" },
        ]);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to save prescription";
        showToast(msg, "error");
      }
    })();
  }

  // Filtered Appointments
  const filteredAppointments = appointments.filter((app) => {
    const matchesFilter =
      appointmentFilter === "ALL" || app.status === appointmentFilter;
    const patName = app.patient?.name || app.patient_name || "";
    const matchesSearch =
      appointmentSearch.trim() === "" ||
      patName.toLowerCase().includes(appointmentSearch.toLowerCase()) ||
      app.appointment_date.includes(appointmentSearch.trim());
    return matchesFilter && matchesSearch;
  });

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
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            backgroundColor: toastType === "success" ? colors.primary : colors.coral,
            color: "#ffffff",
            padding: "14px 22px",
            borderRadius: 10,
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            fontWeight: 600,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 10,
            animation: "fadeIn 0.2s ease-in-out",
          }}
        >
          <span>{toastType === "success" ? "✓" : "⚠"}</span>
          <span>{toastMessage}</span>
        </div>
      )}

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
          {/* Logo & Brand */}
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
                Doctor Portal
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { id: "overview", label: "Overview", icon: "⊞" },
              { id: "appointments", label: "My Appointments", icon: "📅" },
              { id: "availability", label: "My Availability", icon: "🕒" },
              { id: "patients", label: "My Patients", icon: "👥" },
              { id: "prescriptions", label: "Prescriptions", icon: "📋" },
              { id: "records", label: "Patient Records", icon: "📂" },
              { id: "profile", label: "Doctor Profile", icon: "👤" },
              { id: "settings", label: "Settings", icon: "⚙" },
            ].map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as Tab)}
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
          </nav>
        </div>

        {/* Footer Actions: Theme Toggle & Logout */}
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
              transition: "opacity 0.15s ease",
            }}
          >
            <span>⎋</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "32px 40px",
          maxHeight: "100vh",
          boxSizing: "border-box",
        }}
      >
        {/* Top Header Bar */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 28,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 800,
                margin: 0,
                letterSpacing: -0.5,
              }}
            >
              {activeTab === "overview" && `Welcome, Dr. ${doctorName}`}
              {activeTab === "appointments" && "Consultation Appointments"}
              {activeTab === "availability" && "Weekly Availability & Shifts"}
              {activeTab === "patients" && "My Patient Records"}
              {activeTab === "prescriptions" && "Prescription Manager"}
              {activeTab === "records" && "Clinical Records & Notes"}
              {activeTab === "profile" && "Professional Profile"}
              {activeTab === "settings" && "Account & Practice Settings"}
            </h1>
            <p style={{ color: colors.muted, margin: "6px 0 0", fontSize: 14 }}>
              {activeTab === "overview" &&
                "Here is an overview of your consultations, schedules, and active bookings."}
              {activeTab === "appointments" &&
                "Review pending patient bookings, accept consultations, and update appointment outcomes."}
              {activeTab === "availability" &&
                "Configure your recurring working hours and multiple shifts per day for each hospital."}
              {activeTab === "patients" &&
                "Review patients who have consulted with you and inspect their appointment history."}
              {activeTab === "prescriptions" &&
                "Create and issue medical prescriptions linked to patient consultations."}
              {activeTab === "records" &&
                "Review past clinical observations, visit reasons, and existing health conditions."}
              {activeTab === "profile" &&
                "Manage your consultation fee, clinical experience, bio, and review verification status."}
              {activeTab === "settings" &&
                "Customize your dashboard theme, practice defaults, and preferences."}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 20,
                backgroundColor: colors.mint,
                color: colors.mintText,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              ● Verified Doctor
            </span>
          </div>
        </header>

        {/* ------------------------------------------------------------------ */}
        {/* 1. OVERVIEW SECTION */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "overview" && (
          <div>
            {overviewLoading ? (
              <div style={{ padding: 40, textAlign: "center", color: colors.muted }}>
                Loading overview statistics...
              </div>
            ) : (
              <>
                {/* Stats Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                    gap: 18,
                    marginBottom: 32,
                  }}
                >
                  {[
                    {
                      label: "Today's Appointments",
                      value: stats?.today_appointments ?? 0,
                      color: colors.primary,
                      badge: "Today",
                    },
                    {
                      label: "Pending Requests",
                      value: stats?.pending_appointments ?? 0,
                      color: colors.coral,
                      badge: "Action Required",
                    },
                    {
                      label: "Upcoming Consultations",
                      value: stats?.upcoming_consultations ?? 0,
                      color: "#2563eb",
                      badge: "Confirmed",
                    },
                    {
                      label: "Completed Visits",
                      value: stats?.completed_appointments ?? 0,
                      color: "#16a34a",
                      badge: "Total",
                    },
                    {
                      label: "Total Consultations",
                      value: stats?.total_appointments ?? 0,
                      color: colors.text,
                      badge: "Lifetime",
                    },
                  ].map((card, i) => (
                    <div
                      key={i}
                      style={{
                        backgroundColor: colors.card,
                        border: `1px solid ${colors.border}`,
                        borderRadius: 14,
                        padding: 22,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 12,
                        }}
                      >
                        <span style={{ fontSize: 13, color: colors.muted, fontWeight: 600 }}>
                          {card.label}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: 6,
                            backgroundColor: colors.mint,
                            color: colors.mintText,
                          }}
                        >
                          {card.badge}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 32,
                          fontWeight: 800,
                          color: card.color,
                        }}
                      >
                        {card.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Shortcuts */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 20,
                    marginBottom: 32,
                  }}
                >
                  <div
                    style={{
                      backgroundColor: colors.card,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 14,
                      padding: 22,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700 }}>
                        Manage Working Schedules
                      </h3>
                      <p style={{ margin: 0, fontSize: 13, color: colors.muted }}>
                        Configure consultation shifts, weekday working hours, and slot intervals.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("availability")}
                      style={{
                        padding: "10px 18px",
                        backgroundColor: colors.primary,
                        color: "#ffffff",
                        border: "none",
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      My Availability →
                    </button>
                  </div>

                  <div
                    style={{
                      backgroundColor: colors.card,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 14,
                      padding: 22,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700 }}>
                        Review Pending Bookings
                      </h3>
                      <p style={{ margin: 0, fontSize: 13, color: colors.muted }}>
                        {stats?.pending_appointments || 0} patient appointment requests awaiting your confirmation.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setAppointmentFilter("PENDING");
                        setActiveTab("appointments");
                      }}
                      style={{
                        padding: "10px 18px",
                        backgroundColor: colors.coral,
                        color: "#ffffff",
                        border: "none",
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      Review Requests →
                    </button>
                  </div>
                </div>

                {/* Today's Appointments Section */}
                <div
                  style={{
                    backgroundColor: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 14,
                    padding: 24,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 18,
                    }}
                  >
                    <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                      Today's Consultations ({todayAppointments.length})
                    </h2>
                    <button
                      onClick={() => setActiveTab("appointments")}
                      style={{
                        background: "none",
                        border: "none",
                        color: colors.primary,
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      View All Appointments →
                    </button>
                  </div>

                  {todayAppointments.length === 0 ? (
                    <div
                      style={{
                        padding: "36px 20px",
                        textAlign: "center",
                        color: colors.muted,
                        backgroundColor: colors.cardSubtle,
                        borderRadius: 10,
                      }}
                    >
                      No appointments scheduled for today.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {todayAppointments.map((app) => (
                        <div
                          key={app.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "16px 20px",
                            backgroundColor: colors.cardSubtle,
                            border: `1px solid ${colors.border}`,
                            borderRadius: 10,
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                              {app.patient_name}
                            </div>
                            <div style={{ fontSize: 13, color: colors.muted }}>
                              🕒 {app.start_time} – {app.end_time} &nbsp;·&nbsp;
                              🏥 {app.visit_type === "HOSPITAL" ? "Hospital Visit" : "Home Visit"} &nbsp;·&nbsp;
                              Reason: {app.reason_for_visit || "General Consultation"}
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span
                              style={{
                                padding: "6px 12px",
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 700,
                                backgroundColor:
                                  app.status === "CONFIRMED"
                                    ? colors.mint
                                    : app.status === "PENDING"
                                    ? colors.coralSubtle
                                    : colors.card,
                                color:
                                  app.status === "CONFIRMED"
                                    ? colors.mintText
                                    : app.status === "PENDING"
                                    ? colors.coral
                                    : colors.muted,
                              }}
                            >
                              {app.status}
                            </span>
                            <button
                              onClick={() => {
                                setSelectedAppointment(app);
                                setActiveTab("appointments");
                              }}
                              style={{
                                padding: "8px 14px",
                                backgroundColor: colors.card,
                                border: `1px solid ${colors.border}`,
                                borderRadius: 6,
                                color: colors.text,
                                fontWeight: 600,
                                fontSize: 12,
                                cursor: "pointer",
                              }}
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* 2. MY APPOINTMENTS SECTION */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "appointments" && (
          <div>
            {/* Filter and Search Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 16,
                marginBottom: 24,
              }}
            >
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "REJECTED"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setAppointmentFilter(status)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      border: `1px solid ${colors.border}`,
                      backgroundColor:
                        appointmentFilter === status ? colors.primary : colors.card,
                      color:
                        appointmentFilter === status ? "#ffffff" : colors.text,
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Search patient or date..."
                value={appointmentSearch}
                onChange={(e) => setAppointmentSearch(e.target.value)}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.card,
                  color: colors.text,
                  fontSize: 13,
                  width: 260,
                  outline: "none",
                }}
              />
            </div>

            {/* Appointments List */}
            {appointmentsLoading ? (
              <div style={{ padding: 40, textAlign: "center", color: colors.muted }}>
                Loading appointments...
              </div>
            ) : filteredAppointments.length === 0 ? (
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
                No appointments found matching this criteria.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {filteredAppointments.map((app) => {
                  const patName = app.patient?.name || app.patient_name || "Patient";
                  const patPhone = app.patient?.phone || app.patient_phone || "N/A";
                  const orgName = app.organization?.name || app.organization_name || "Hospital";

                  return (
                    <div
                      key={app.id}
                      style={{
                        backgroundColor: colors.card,
                        border: `1px solid ${colors.border}`,
                        borderRadius: 12,
                        padding: "20px 24px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 16,
                      }}
                    >
                      <div style={{ flex: "1 1 320px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                          <span style={{ fontWeight: 800, fontSize: 16 }}>{patName}</span>
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              backgroundColor:
                                app.status === "CONFIRMED"
                                  ? colors.mint
                                  : app.status === "PENDING"
                                  ? colors.coralSubtle
                                  : app.status === "COMPLETED"
                                  ? "#e0f2fe"
                                  : colors.cardSubtle,
                              color:
                                app.status === "CONFIRMED"
                                  ? colors.mintText
                                  : app.status === "PENDING"
                                  ? colors.coral
                                  : app.status === "COMPLETED"
                                  ? "#0369a1"
                                  : colors.muted,
                            }}
                          >
                            {app.status}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              padding: "4px 8px",
                              borderRadius: 6,
                              backgroundColor: colors.cardSubtle,
                              color: colors.muted,
                              fontWeight: 600,
                            }}
                          >
                            {app.visit_type === "HOME" ? "🏠 Home Visit" : "🏥 Hospital Visit"}
                          </span>
                        </div>

                        <div style={{ fontSize: 13, color: colors.muted, display: "grid", gap: 3 }}>
                          <div>
                            📅 <strong>{app.appointment_date}</strong> &nbsp;|&nbsp; 🕒 {app.start_time} - {app.end_time} &nbsp;|&nbsp; 🏥 {orgName}
                          </div>
                          <div>
                            📞 {patPhone} &nbsp;|&nbsp; Reason: <em>{app.reason_for_visit || "General checkup"}</em>
                          </div>
                          {app.visit_type === "HOME" && app.home_address && (
                            <div>📍 Address: {app.home_address}</div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <button
                          onClick={() => setSelectedAppointment(app)}
                          style={{
                            padding: "9px 16px",
                            borderRadius: 8,
                            border: `1px solid ${colors.border}`,
                            backgroundColor: colors.cardSubtle,
                            color: colors.text,
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                        >
                          View Details
                        </button>

                        {app.status === "PENDING" && (
                          <>
                            <button
                              disabled={actionProcessing === app.id}
                              onClick={() => handleAppointmentDecision(app.id, "ACCEPT")}
                              style={{
                                padding: "9px 16px",
                                borderRadius: 8,
                                border: "none",
                                backgroundColor: colors.primary,
                                color: "#ffffff",
                                fontWeight: 700,
                                fontSize: 13,
                                cursor: "pointer",
                              }}
                            >
                              Accept
                            </button>
                            <button
                              disabled={actionProcessing === app.id}
                              onClick={() => handleAppointmentDecision(app.id, "REJECT")}
                              style={{
                                padding: "9px 16px",
                                borderRadius: 8,
                                border: "none",
                                backgroundColor: colors.coralSubtle,
                                color: colors.coral,
                                fontWeight: 700,
                                fontSize: 13,
                                cursor: "pointer",
                              }}
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {app.status === "CONFIRMED" && (
                          <>
                            <button
                              disabled={actionProcessing === app.id}
                              onClick={() => handleAppointmentDecision(app.id, "COMPLETE")}
                              style={{
                                padding: "9px 16px",
                                borderRadius: 8,
                                border: "none",
                                backgroundColor: "#16a34a",
                                color: "#ffffff",
                                fontWeight: 700,
                                fontSize: 13,
                                cursor: "pointer",
                              }}
                            >
                              Mark Completed
                            </button>
                            <button
                              disabled={actionProcessing === app.id}
                              onClick={() => handleAppointmentDecision(app.id, "CANCEL")}
                              style={{
                                padding: "9px 16px",
                                borderRadius: 8,
                                border: `1px solid ${colors.border}`,
                                backgroundColor: "transparent",
                                color: colors.coral,
                                fontWeight: 600,
                                fontSize: 13,
                                cursor: "pointer",
                              }}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Appointment Details Modal */}
            {selectedAppointment && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.6)",
                  display: "grid",
                  placeItems: "center",
                  zIndex: 999,
                  padding: 20,
                }}
              >
                <div
                  style={{
                    backgroundColor: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 16,
                    padding: 28,
                    width: "100%",
                    maxWidth: 540,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 20,
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                      Consultation Details #{selectedAppointment.id}
                    </h3>
                    <button
                      onClick={() => setSelectedAppointment(null)}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: 20,
                        cursor: "pointer",
                        color: colors.muted,
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ display: "grid", gap: 14, fontSize: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: colors.muted }}>Patient Name:</span>
                      <strong>
                        {selectedAppointment.patient?.name || selectedAppointment.patient_name}
                      </strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: colors.muted }}>Patient Age / Gender:</span>
                      <span>
                        {(selectedAppointment.patient?.age || selectedAppointment.patient_age) ?? "N/A"} yrs /{" "}
                        {selectedAppointment.patient?.gender || selectedAppointment.patient_gender || "N/A"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: colors.muted }}>Contact Phone:</span>
                      <span>{selectedAppointment.patient?.phone || selectedAppointment.patient_phone || "N/A"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: colors.muted }}>Date & Time:</span>
                      <span>
                        {selectedAppointment.appointment_date} ({selectedAppointment.start_time} -{" "}
                        {selectedAppointment.end_time})
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: colors.muted }}>Hospital / Clinic:</span>
                      <span>{selectedAppointment.organization?.name || selectedAppointment.organization_name}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: colors.muted }}>Visit Type:</span>
                      <strong>{selectedAppointment.visit_type === "HOME" ? "Home Visit" : "Hospital Visit"}</strong>
                    </div>

                    {selectedAppointment.home_address && (
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: colors.muted }}>Home Address:</span>
                        <span>{selectedAppointment.home_address}</span>
                      </div>
                    )}

                    <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 12 }}>
                      <div style={{ color: colors.muted, marginBottom: 4 }}>Reason for Consultation:</div>
                      <div style={{ padding: 12, backgroundColor: colors.cardSubtle, borderRadius: 8 }}>
                        {selectedAppointment.reason_for_visit || "General Checkup"}
                      </div>
                    </div>

                    {selectedAppointment.existing_conditions && (
                      <div>
                        <div style={{ color: colors.muted, marginBottom: 4 }}>Existing Medical Conditions:</div>
                        <div style={{ padding: 12, backgroundColor: colors.cardSubtle, borderRadius: 8 }}>
                          {selectedAppointment.existing_conditions}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <button
                      onClick={() => setSelectedAppointment(null)}
                      style={{
                        padding: "10px 18px",
                        borderRadius: 8,
                        border: `1px solid ${colors.border}`,
                        backgroundColor: colors.cardSubtle,
                        color: colors.text,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* 3. MY AVAILABILITY SECTION (HIGH PRIORITY) */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "availability" && (
          <div>
            {/* Organization Selector */}
            <div
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: 14,
                padding: "20px 24px",
                marginBottom: 24,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 700,
                    color: colors.muted,
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Select Hospital / Organization
                </label>
                {organizations.length === 0 ? (
                  <span style={{ color: colors.muted, fontSize: 14 }}>
                    No assigned organizations found for this doctor account.
                  </span>
                ) : (
                  <select
                    value={selectedOrgId ?? ""}
                    onChange={(e) => setSelectedOrgId(Number(e.target.value))}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 8,
                      border: `1px solid ${colors.border}`,
                      backgroundColor: colors.cardSubtle,
                      color: colors.text,
                      fontSize: 14,
                      fontWeight: 700,
                      outline: "none",
                      minWidth: 280,
                    }}
                  >
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name} ({org.city})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <button
                onClick={() => {
                  setEditingSchedule(null);
                  setShiftForm({
                    weekday: 0,
                    start_time: "09:00",
                    end_time: "13:00",
                    slot_duration_minutes: 15,
                  });
                  setShiftError("");
                  setShowShiftModal(true);
                }}
                disabled={!selectedOrgId}
                style={{
                  padding: "12px 22px",
                  borderRadius: 8,
                  border: "none",
                  backgroundColor: colors.primary,
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: selectedOrgId ? "pointer" : "not-allowed",
                  boxShadow: "0 4px 12px rgba(8, 127, 117, 0.25)",
                }}
              >
                + Add Working Shift
              </button>
            </div>

            {/* Availability Explanatory Banner */}
            <div
              style={{
                padding: "14px 18px",
                borderRadius: 10,
                backgroundColor: colors.mint,
                color: colors.mintText,
                fontSize: 13,
                marginBottom: 24,
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              <span>ℹ</span>
              <span>
                <strong>Multiple Shifts Supported:</strong> You can add multiple working intervals per day
                (e.g., Morning 09:00 AM – 01:00 PM and Evening 04:00 PM – 08:00 PM). Schedule updates automatically
                preserve all existing confirmed appointments.
              </span>
            </div>

            {/* Weekdays Schedule Cards */}
            {availabilityLoading ? (
              <div style={{ padding: 40, textAlign: "center", color: colors.muted }}>
                Loading working schedules...
              </div>
            ) : (
              <div style={{ display: "grid", gap: 16 }}>
                {WEEKDAYS.map((dayName, dayIndex) => {
                  const daySchedules = schedules.filter(
                    (s) => s.weekday === dayIndex && s.is_active
                  );

                  return (
                    <div
                      key={dayIndex}
                      style={{
                        backgroundColor: colors.card,
                        border: `1px solid ${colors.border}`,
                        borderRadius: 12,
                        padding: "18px 24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 16,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 160 }}>
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            backgroundColor:
                              daySchedules.length > 0 ? colors.primary : colors.muted,
                          }}
                        />
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 700 }}>{dayName}</div>
                          <div style={{ fontSize: 12, color: colors.muted }}>
                            {daySchedules.length === 0
                              ? "Day Off"
                              : `${daySchedules.length} Active Shift${daySchedules.length > 1 ? "s" : ""}`}
                          </div>
                        </div>
                      </div>

                      {/* Shifts for this day */}
                      <div
                        style={{
                          display: "flex",
                          flex: 1,
                          gap: 12,
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        {daySchedules.length === 0 ? (
                          <span style={{ fontSize: 13, color: colors.muted, fontStyle: "italic" }}>
                            No working hours scheduled for {dayName}.
                          </span>
                        ) : (
                          daySchedules.map((shift) => (
                            <div
                              key={shift.id}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "8px 14px",
                                borderRadius: 8,
                                backgroundColor: colors.cardSubtle,
                                border: `1px solid ${colors.border}`,
                              }}
                            >
                              <div>
                                <strong style={{ fontSize: 13 }}>
                                  🕒 {shift.start_time} – {shift.end_time}
                                </strong>
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: colors.muted,
                                    marginLeft: 8,
                                  }}
                                >
                                  ({shift.slot_duration_minutes} min slots)
                                </span>
                              </div>

                              <button
                                onClick={() => {
                                  setEditingSchedule(shift);
                                  setShiftForm({
                                    weekday: shift.weekday,
                                    start_time: shift.start_time,
                                    end_time: shift.end_time,
                                    slot_duration_minutes: shift.slot_duration_minutes,
                                  });
                                  setShiftError("");
                                  setShowShiftModal(true);
                                }}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: colors.primary,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  padding: 0,
                                }}
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => handleDeleteShift(shift.id)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: colors.coral,
                                  fontSize: 13,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  padding: 0,
                                }}
                                title="Deactivate shift"
                              >
                                ✕
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setEditingSchedule(null);
                          setShiftForm({
                            weekday: dayIndex,
                            start_time: "09:00",
                            end_time: "13:00",
                            slot_duration_minutes: 15,
                          });
                          setShiftError("");
                          setShowShiftModal(true);
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
                        + Add Shift
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add / Edit Shift Modal */}
            {showShiftModal && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.6)",
                  display: "grid",
                  placeItems: "center",
                  zIndex: 999,
                  padding: 20,
                }}
              >
                <div
                  style={{
                    backgroundColor: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 16,
                    padding: 28,
                    width: "100%",
                    maxWidth: 480,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 20,
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                      {editingSchedule ? "Edit Working Shift" : "Add Working Shift"}
                    </h3>
                    <button
                      onClick={() => setShowShiftModal(false)}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: 20,
                        cursor: "pointer",
                        color: colors.muted,
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  {shiftError && (
                    <div
                      style={{
                        padding: "10px 14px",
                        backgroundColor: colors.coralSubtle,
                        color: colors.coral,
                        borderRadius: 8,
                        fontSize: 13,
                        marginBottom: 16,
                        fontWeight: 600,
                      }}
                    >
                      {shiftError}
                    </div>
                  )}

                  <div style={{ display: "grid", gap: 14 }}>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: 12,
                          fontWeight: 700,
                          color: colors.muted,
                          marginBottom: 6,
                        }}
                      >
                        Day of Week
                      </label>
                      <select
                        value={shiftForm.weekday}
                        onChange={(e) =>
                          setShiftForm((prev) => ({
                            ...prev,
                            weekday: Number(e.target.value),
                          }))
                        }
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: 8,
                          border: `1px solid ${colors.border}`,
                          backgroundColor: colors.cardSubtle,
                          color: colors.text,
                          fontSize: 14,
                        }}
                      >
                        {WEEKDAYS.map((name, i) => (
                          <option key={i} value={i}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: 12,
                            fontWeight: 700,
                            color: colors.muted,
                            marginBottom: 6,
                          }}
                        >
                          Shift Start Time
                        </label>
                        <input
                          type="time"
                          value={shiftForm.start_time}
                          onChange={(e) =>
                            setShiftForm((prev) => ({
                              ...prev,
                              start_time: e.target.value,
                            }))
                          }
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 8,
                            border: `1px solid ${colors.border}`,
                            backgroundColor: colors.cardSubtle,
                            color: colors.text,
                            fontSize: 14,
                            boxSizing: "border-box",
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: 12,
                            fontWeight: 700,
                            color: colors.muted,
                            marginBottom: 6,
                          }}
                        >
                          Shift End Time
                        </label>
                        <input
                          type="time"
                          value={shiftForm.end_time}
                          onChange={(e) =>
                            setShiftForm((prev) => ({
                              ...prev,
                              end_time: e.target.value,
                            }))
                          }
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 8,
                            border: `1px solid ${colors.border}`,
                            backgroundColor: colors.cardSubtle,
                            color: colors.text,
                            fontSize: 14,
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: 12,
                          fontWeight: 700,
                          color: colors.muted,
                          marginBottom: 6,
                        }}
                      >
                        Consultation Slot Duration
                      </label>
                      <select
                        value={shiftForm.slot_duration_minutes}
                        onChange={(e) =>
                          setShiftForm((prev) => ({
                            ...prev,
                            slot_duration_minutes: Number(e.target.value),
                          }))
                        }
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: 8,
                          border: `1px solid ${colors.border}`,
                          backgroundColor: colors.cardSubtle,
                          color: colors.text,
                          fontSize: 14,
                        }}
                      >
                        <option value={15}>15 Minutes (Default)</option>
                        <option value={30}>30 Minutes</option>
                        <option value={60}>60 Minutes (1 Hour)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <button
                      onClick={() => setShowShiftModal(false)}
                      style={{
                        padding: "10px 18px",
                        borderRadius: 8,
                        border: `1px solid ${colors.border}`,
                        backgroundColor: colors.cardSubtle,
                        color: colors.text,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      disabled={shiftSaving}
                      onClick={() => void handleSaveShift()}
                      style={{
                        padding: "10px 22px",
                        borderRadius: 8,
                        border: "none",
                        backgroundColor: colors.primary,
                        color: "#ffffff",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {shiftSaving ? "Saving..." : editingSchedule ? "Update Shift" : "Save Shift"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* 4. MY PATIENTS SECTION */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "patients" && (
          <div>
            {patientsLoading ? (
              <div style={{ padding: 40, textAlign: "center", color: colors.muted }}>
                Loading patient directory...
              </div>
            ) : patients.length === 0 ? (
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
                No patient consultations recorded yet. Patients will appear here once appointments are booked.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {patients.map((pat) => (
                  <div
                    key={pat.patient_id}
                    style={{
                      backgroundColor: colors.card,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 12,
                      padding: "20px 24px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 16,
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <strong style={{ fontSize: 16 }}>{pat.name}</strong>
                        <span
                          style={{
                            fontSize: 12,
                            padding: "3px 8px",
                            borderRadius: 6,
                            backgroundColor: colors.mint,
                            color: colors.mintText,
                            fontWeight: 700,
                          }}
                        >
                          {pat.total_visits} Visit{pat.total_visits > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: colors.muted }}>
                        Age: {pat.age || "N/A"} &nbsp;|&nbsp; Gender: {pat.gender || "N/A"} &nbsp;|&nbsp;
                        Phone: {pat.phone} &nbsp;|&nbsp; Last Visit: {pat.last_visit_date}
                      </div>
                      {pat.existing_conditions && (
                        <div style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                          Existing Conditions: <em>{pat.existing_conditions}</em>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedPatient(pat)}
                      style={{
                        padding: "9px 18px",
                        borderRadius: 8,
                        border: `1px solid ${colors.border}`,
                        backgroundColor: colors.cardSubtle,
                        color: colors.text,
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      View Visit History ({pat.appointments.length})
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Patient Visit History Modal */}
            {selectedPatient && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.6)",
                  display: "grid",
                  placeItems: "center",
                  zIndex: 999,
                  padding: 20,
                }}
              >
                <div
                  style={{
                    backgroundColor: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 16,
                    padding: 28,
                    width: "100%",
                    maxWidth: 580,
                    maxHeight: "85vh",
                    overflowY: "auto",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 20,
                    }}
                  >
                    <div>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                        {selectedPatient.name}
                      </h3>
                      <div style={{ fontSize: 13, color: colors.muted }}>
                        {selectedPatient.gender} · {selectedPatient.age} yrs · 📞 {selectedPatient.phone}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedPatient(null)}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: 20,
                        cursor: "pointer",
                        color: colors.muted,
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  <h4 style={{ fontSize: 14, margin: "16px 0 10px" }}>Consultation History</h4>
                  <div style={{ display: "grid", gap: 10 }}>
                    {selectedPatient.appointments.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          padding: 14,
                          borderRadius: 8,
                          backgroundColor: colors.cardSubtle,
                          border: `1px solid ${colors.border}`,
                          fontSize: 13,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <strong>
                            📅 {item.date} at {item.time}
                          </strong>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: 11,
                              color: item.status === "COMPLETED" ? "#16a34a" : colors.muted,
                            }}
                          >
                            {item.status}
                          </span>
                        </div>
                        <div style={{ color: colors.muted }}>
                          🏥 {item.organization_name} ({item.visit_type})
                        </div>
                        <div style={{ marginTop: 4 }}>
                          Reason: <em>{item.reason}</em>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 24, textAlign: "right" }}>
                    <button
                      onClick={() => setSelectedPatient(null)}
                      style={{
                        padding: "10px 20px",
                        borderRadius: 8,
                        border: "none",
                        backgroundColor: colors.primary,
                        color: "#ffffff",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* 5. PRESCRIPTIONS SECTION */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "prescriptions" && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                  Medical Prescriptions ({prescriptions.length})
                </h2>
                <p style={{ fontSize: 13, color: colors.muted, margin: "4px 0 0" }}>
                  Issue structured prescriptions with medication dosages, durations, and clinical notes.
                </p>
              </div>

              <button
                onClick={() => setShowPrescriptionModal(true)}
                style={{
                  padding: "11px 20px",
                  borderRadius: 8,
                  border: "none",
                  backgroundColor: colors.primary,
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                + New Prescription
              </button>
            </div>

            {/* Prescriptions List */}
            <div style={{ display: "grid", gap: 16 }}>
              {prescriptions.map((rx) => (
                <div
                  key={rx.id}
                  style={{
                    backgroundColor: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 14,
                    padding: 24,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: `1px solid ${colors.border}`,
                      paddingBottom: 14,
                      marginBottom: 16,
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: 16 }}>{rx.patient_name}</strong>
                      <span style={{ fontSize: 13, color: colors.muted, marginLeft: 10 }}>
                        Age: {rx.patient_age} yrs · Date: {rx.date}
                      </span>
                    </div>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: 6,
                        backgroundColor: colors.mint,
                        color: colors.mintText,
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      {rx.id}
                    </span>
                  </div>

                  {/* Medicines Table */}
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 14 }}>
                    <thead>
                      <tr style={{ textAlign: "left", color: colors.muted, borderBottom: `1px solid ${colors.border}` }}>
                        <th style={{ padding: "6px 0" }}>Medicine</th>
                        <th style={{ padding: "6px 0" }}>Dosage</th>
                        <th style={{ padding: "6px 0" }}>Frequency</th>
                        <th style={{ padding: "6px 0" }}>Duration</th>
                        <th style={{ padding: "6px 0" }}>Instructions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rx.medicines.map((med, idx) => (
                        <tr key={idx} style={{ borderBottom: `1px solid ${colors.border}` }}>
                          <td style={{ padding: "10px 0", fontWeight: 700 }}>{med.name}</td>
                          <td style={{ padding: "10px 0" }}>{med.dosage}</td>
                          <td style={{ padding: "10px 0" }}>{med.frequency}</td>
                          <td style={{ padding: "10px 0" }}>{med.duration}</td>
                          <td style={{ padding: "10px 0", color: colors.muted }}>{med.instructions || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {rx.notes && (
                    <div style={{ fontSize: 13, color: colors.muted }}>
                      <strong>Advice / Clinical Instructions:</strong> {rx.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Create Prescription Modal */}
            {showPrescriptionModal && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.6)",
                  display: "grid",
                  placeItems: "center",
                  zIndex: 999,
                  padding: 20,
                }}
              >
                <div
                  style={{
                    backgroundColor: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 16,
                    padding: 28,
                    width: "100%",
                    maxWidth: 620,
                    maxHeight: "90vh",
                    overflowY: "auto",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 20,
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                      Write New Prescription
                    </h3>
                    <button
                      onClick={() => setShowPrescriptionModal(false)}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: 20,
                        cursor: "pointer",
                        color: colors.muted,
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ display: "grid", gap: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: colors.muted, marginBottom: 4 }}>
                          Patient Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. John Doe"
                          value={newRxPatient}
                          onChange={(e) => setNewRxPatient(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
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
                          Age
                        </label>
                        <input
                          type="number"
                          placeholder="Years"
                          value={newRxAge}
                          onChange={(e) => setNewRxAge(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 8,
                            border: `1px solid ${colors.border}`,
                            backgroundColor: colors.cardSubtle,
                            color: colors.text,
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                    </div>

                    <h4 style={{ margin: "10px 0 4px", fontSize: 14 }}>Medications</h4>

                    {newRxMeds.map((med, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: 14,
                          borderRadius: 8,
                          backgroundColor: colors.cardSubtle,
                          border: `1px solid ${colors.border}`,
                          display: "grid",
                          gap: 10,
                        }}
                      >
                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
                          <input
                            type="text"
                            placeholder="Medicine Name (e.g. Paracetamol)"
                            value={med.name}
                            onChange={(e) => {
                              const updated = [...newRxMeds];
                              updated[idx].name = e.target.value;
                              setNewRxMeds(updated);
                            }}
                            style={{
                              padding: "8px 10px",
                              borderRadius: 6,
                              border: `1px solid ${colors.border}`,
                              backgroundColor: colors.card,
                              color: colors.text,
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Dosage (500mg)"
                            value={med.dosage}
                            onChange={(e) => {
                              const updated = [...newRxMeds];
                              updated[idx].dosage = e.target.value;
                              setNewRxMeds(updated);
                            }}
                            style={{
                              padding: "8px 10px",
                              borderRadius: 6,
                              border: `1px solid ${colors.border}`,
                              backgroundColor: colors.card,
                              color: colors.text,
                            }}
                          />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <input
                            type="text"
                            placeholder="Frequency (Twice daily)"
                            value={med.frequency}
                            onChange={(e) => {
                              const updated = [...newRxMeds];
                              updated[idx].frequency = e.target.value;
                              setNewRxMeds(updated);
                            }}
                            style={{
                              padding: "8px 10px",
                              borderRadius: 6,
                              border: `1px solid ${colors.border}`,
                              backgroundColor: colors.card,
                              color: colors.text,
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Duration (5 days)"
                            value={med.duration}
                            onChange={(e) => {
                              const updated = [...newRxMeds];
                              updated[idx].duration = e.target.value;
                              setNewRxMeds(updated);
                            }}
                            style={{
                              padding: "8px 10px",
                              borderRadius: 6,
                              border: `1px solid ${colors.border}`,
                              backgroundColor: colors.card,
                              color: colors.text,
                            }}
                          />
                        </div>

                        <input
                          type="text"
                          placeholder="Special instructions (e.g. take after meals)"
                          value={med.instructions}
                          onChange={(e) => {
                            const updated = [...newRxMeds];
                            updated[idx].instructions = e.target.value;
                            setNewRxMeds(updated);
                          }}
                          style={{
                            padding: "8px 10px",
                            borderRadius: 6,
                            border: `1px solid ${colors.border}`,
                            backgroundColor: colors.card,
                            color: colors.text,
                          }}
                        />
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() =>
                        setNewRxMeds((prev) => [
                          ...prev,
                          { name: "", dosage: "", frequency: "Twice daily", duration: "5 days", instructions: "" },
                        ])
                      }
                      style={{
                        padding: "8px 14px",
                        borderRadius: 6,
                        border: `1px dashed ${colors.border}`,
                        backgroundColor: "transparent",
                        color: colors.primary,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      + Add Another Medicine
                    </button>

                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: colors.muted, marginBottom: 4 }}>
                        Clinical Instructions / Advice
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Diet recommendations, follow-up advice, warnings..."
                        value={newRxNotes}
                        onChange={(e) => setNewRxNotes(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: 8,
                          border: `1px solid ${colors.border}`,
                          backgroundColor: colors.cardSubtle,
                          color: colors.text,
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <button
                      onClick={() => setShowPrescriptionModal(false)}
                      style={{
                        padding: "10px 18px",
                        borderRadius: 8,
                        border: `1px solid ${colors.border}`,
                        backgroundColor: colors.cardSubtle,
                        color: colors.text,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSavePrescription}
                      style={{
                        padding: "10px 22px",
                        borderRadius: 8,
                        border: "none",
                        backgroundColor: colors.primary,
                        color: "#ffffff",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Generate Prescription
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* 6. PATIENT RECORDS SECTION */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "records" && (
          <div>
            <div
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: 14,
                padding: 24,
                marginBottom: 24,
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>
                Patient Medical Records & Clinical Observations
              </h2>
              <p style={{ color: colors.muted, fontSize: 13, margin: 0 }}>
                Comprehensive medical histories gathered during patient appointments and consultations.
              </p>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              {appointments
                .filter((a) => a.reason_for_visit || a.existing_conditions)
                .map((record) => (
                  <div
                    key={record.id}
                    style={{
                      backgroundColor: colors.card,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 12,
                      padding: 20,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <strong>
                        {record.patient?.name || record.patient_name} · Appointment #{record.id}
                      </strong>
                      <span style={{ fontSize: 12, color: colors.muted }}>
                        Date: {record.appointment_date} ({record.start_time})
                      </span>
                    </div>

                    <div style={{ display: "grid", gap: 8, fontSize: 13 }}>
                      <div>
                        <strong style={{ color: colors.muted }}>Chief Complaint / Visit Reason:</strong>
                        <div style={{ marginTop: 2, padding: "8px 12px", backgroundColor: colors.cardSubtle, borderRadius: 6 }}>
                          {record.reason_for_visit}
                        </div>
                      </div>

                      {record.existing_conditions && (
                        <div>
                          <strong style={{ color: colors.muted }}>Known Pre-existing Conditions:</strong>
                          <div style={{ marginTop: 2, padding: "8px 12px", backgroundColor: colors.cardSubtle, borderRadius: 6 }}>
                            {record.existing_conditions}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* 7. DOCTOR PROFILE SECTION */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "profile" && (
          <div>
            {profileLoading ? (
              <div style={{ padding: 40, textAlign: "center", color: colors.muted }}>
                Loading doctor profile...
              </div>
            ) : (
              <div style={{ display: "grid", gap: 24, maxWidth: 780 }}>
                {/* Profile Card */}
                <div
                  style={{
                    backgroundColor: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 14,
                    padding: 28,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 24,
                    }}
                  >
                    <div>
                      <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
                        {profile?.full_name || `Dr. ${doctorName}`}
                      </h2>
                      <div style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
                        {profile?.specialization} · {profile?.qualification}
                      </div>
                    </div>

                    {!profileEditing ? (
                      <button
                        onClick={() => setProfileEditing(true)}
                        style={{
                          padding: "9px 18px",
                          borderRadius: 8,
                          border: `1px solid ${colors.border}`,
                          backgroundColor: colors.cardSubtle,
                          color: colors.primary,
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        Edit Profile
                      </button>
                    ) : (
                      <div style={{ display: "flex", gap: 10 }}>
                        <button
                          onClick={() => setProfileEditing(false)}
                          style={{
                            padding: "9px 16px",
                            borderRadius: 8,
                            border: `1px solid ${colors.border}`,
                            backgroundColor: "transparent",
                            color: colors.muted,
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          disabled={profileSaving}
                          onClick={() => void handleSaveProfile()}
                          style={{
                            padding: "9px 20px",
                            borderRadius: 8,
                            border: "none",
                            backgroundColor: colors.primary,
                            color: "#ffffff",
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                        >
                          {profileSaving ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Profile Fields */}
                  <div style={{ display: "grid", gap: 18, fontSize: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: colors.muted, marginBottom: 4 }}>
                          Full Name
                        </label>
                        {profileEditing ? (
                          <input
                            type="text"
                            value={profileForm.full_name}
                            onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                            style={{
                              width: "100%",
                              padding: "9px 12px",
                              borderRadius: 8,
                              border: `1px solid ${colors.border}`,
                              backgroundColor: colors.cardSubtle,
                              color: colors.text,
                              boxSizing: "border-box",
                            }}
                          />
                        ) : (
                          <div>{profile?.full_name}</div>
                        )}
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: colors.muted, marginBottom: 4 }}>
                          Phone Number
                        </label>
                        {profileEditing ? (
                          <input
                            type="text"
                            value={profileForm.phone_number}
                            onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
                            style={{
                              width: "100%",
                              padding: "9px 12px",
                              borderRadius: 8,
                              border: `1px solid ${colors.border}`,
                              backgroundColor: colors.cardSubtle,
                              color: colors.text,
                              boxSizing: "border-box",
                            }}
                          />
                        ) : (
                          <div>{profile?.phone_number || "Not provided"}</div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: colors.muted, marginBottom: 4 }}>
                          Consultation Fee (₹ / $)
                        </label>
                        {profileEditing ? (
                          <input
                            type="number"
                            value={profileForm.consultation_fee}
                            onChange={(e) => setProfileForm({ ...profileForm, consultation_fee: e.target.value })}
                            style={{
                              width: "100%",
                              padding: "9px 12px",
                              borderRadius: 8,
                              border: `1px solid ${colors.border}`,
                              backgroundColor: colors.cardSubtle,
                              color: colors.text,
                              boxSizing: "border-box",
                            }}
                          />
                        ) : (
                          <div>₹ {profile?.consultation_fee}</div>
                        )}
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: colors.muted, marginBottom: 4 }}>
                          Experience (Years)
                        </label>
                        {profileEditing ? (
                          <input
                            type="number"
                            value={profileForm.experience_years}
                            onChange={(e) => setProfileForm({ ...profileForm, experience_years: Number(e.target.value) })}
                            style={{
                              width: "100%",
                              padding: "9px 12px",
                              borderRadius: 8,
                              border: `1px solid ${colors.border}`,
                              backgroundColor: colors.cardSubtle,
                              color: colors.text,
                              boxSizing: "border-box",
                            }}
                          />
                        ) : (
                          <div>{profile?.experience_years} Years</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: colors.muted, marginBottom: 4 }}>
                        Doctor Bio / About
                      </label>
                      {profileEditing ? (
                        <textarea
                          rows={3}
                          value={profileForm.bio}
                          onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "9px 12px",
                            borderRadius: 8,
                            border: `1px solid ${colors.border}`,
                            backgroundColor: colors.cardSubtle,
                            color: colors.text,
                            boxSizing: "border-box",
                          }}
                        />
                      ) : (
                        <div>{profile?.bio || "No bio description provided."}</div>
                      )}
                    </div>

                    {/* Non-editable License verification */}
                    <div
                      style={{
                        padding: 16,
                        borderRadius: 10,
                        backgroundColor: colors.cardSubtle,
                        border: `1px solid ${colors.border}`,
                        marginTop: 10,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: colors.muted, textTransform: "uppercase" }}>
                            Medical License Number (Verified)
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 800, marginTop: 4 }}>
                            {profile?.license_number}
                          </div>
                        </div>
                        <span
                          style={{
                            padding: "6px 12px",
                            borderRadius: 20,
                            backgroundColor: colors.mint,
                            color: colors.mintText,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          ✓ Official License
                        </span>
                      </div>
                      <p style={{ margin: "8px 0 0", fontSize: 12, color: colors.muted }}>
                        Official medical license verification is permanently administered by accredited hospital authorities.
                      </p>
                    </div>

                    {/* Assigned Organizations & Departments */}
                    <div style={{ marginTop: 10 }}>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: colors.muted, marginBottom: 8 }}>
                        Assigned Organizations & Hospital Departments
                      </label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {profile?.assigned_organizations.map((org) => (
                          <span
                            key={org.id}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 6,
                              backgroundColor: colors.cardSubtle,
                              border: `1px solid ${colors.border}`,
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            🏥 {org.name} ({org.city})
                          </span>
                        ))}
                        {profile?.assigned_departments.map((dept) => (
                          <span
                            key={dept.id}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 6,
                              backgroundColor: colors.cardSubtle,
                              border: `1px solid ${colors.border}`,
                              fontSize: 12,
                              color: colors.primary,
                              fontWeight: 600,
                            }}
                          >
                            ⚕ {dept.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* 8. SETTINGS SECTION */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "settings" && (
          <div style={{ maxWidth: 600 }}>
            <div
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: 14,
                padding: 24,
                marginBottom: 20,
              }}
            >
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>
                Appearance & Theme
              </h3>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Dark Mode</div>
                  <div style={{ fontSize: 12, color: colors.muted }}>
                    Switch between clinical light mode and eye-comfort dark theme.
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
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>
                Account Session
              </h3>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Doctor Sign Out</div>
                  <div style={{ fontSize: 12, color: colors.muted }}>
                    Safely terminate your current authenticated session.
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
