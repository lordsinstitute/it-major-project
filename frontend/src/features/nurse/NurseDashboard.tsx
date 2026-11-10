import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { getThemeColors, type ThemeMode } from "../../styles/theme";

const API_URL = "http://127.0.0.1:8000/api";

interface NurseDashboardProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  onLogout: () => void;
  nurseName?: string;
}

type NurseTab =
  | "overview"
  | "assignments"
  | "schedule"
  | "patient-care"
  | "notes"
  | "notifications"
  | "profile"
  | "settings";

interface NurseInfo {
  id: number;
  name: string;
  email: string;
  qualification: string;
  license_number: string;
  experience_years: number;
  is_verified: boolean;
  phone_number?: string;
  organizations?: string[];
}

interface NurseStats {
  total_assigned_tasks: number;
  pending_tasks: number;
  completed_today: number;
  active_patients_today: number;
}

interface CareTaskItem {
  id: number;
  appointment_id?: number;
  patient_name: string;
  task_description: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  organization_name: string;
  department_name: string;
  vitals?: {
    bp?: string;
    pulse?: string;
    temp?: string;
    spo2?: string;
  };
  notes?: string;
  assigned_to_me?: boolean;
  created_at: string;
}

interface TodayPatientItem {
  id: number;
  patient_name: string;
  patient_gender: string;
  patient_age: number;
  time: string;
  doctor_name: string;
  reason: string;
  status: string;
}

interface ShiftItem {
  weekday: number;
  day: string;
  shift: string;
  organization_name: string;
  department: string;
  status: string;
}

export default function NurseDashboard({
  theme,
  onToggleTheme,
  onLogout,
  nurseName = "Nurse",
}: NurseDashboardProps) {
  const [activeTab, setActiveTab] = useState<NurseTab>("overview");
  const colors = getThemeColors(theme);

  // Overview Data
  const [nurse, setNurse] = useState<NurseInfo | null>(null);
  const [stats, setStats] = useState<NurseStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<CareTaskItem[]>([]);
  const [todayPatients, setTodayPatients] = useState<TodayPatientItem[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(true);

  // Assignments Data
  const [assignments, setAssignments] = useState<CareTaskItem[]>([]);
  const [assignmentFilter, setAssignmentFilter] = useState("ALL");
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  // Schedule Data
  const [shifts, setShifts] = useState<ShiftItem[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Task Update Modal
  const [selectedTask, setSelectedTask] = useState<CareTaskItem | null>(null);
  const [updateStatus, setUpdateStatus] = useState<"PENDING" | "IN_PROGRESS" | "COMPLETED">("IN_PROGRESS");
  const [updateBp, setUpdateBp] = useState("");
  const [updatePulse, setUpdatePulse] = useState("");
  const [updateTemp, setUpdateTemp] = useState("");
  const [updateSpo2, setUpdateSpo2] = useState("");
  const [updateNote, setUpdateNote] = useState("");
  const [updatingTask, setUpdatingTask] = useState(false);
  const [taskMessage, setTaskMessage] = useState("");

  // Profile Edit Data
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    qualification: "",
    experience_years: 0,
    phone_number: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  // Helper to fetch with token
  const fetchWithToken = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        ...options.headers,
      };

      const res = await fetch(`${API_URL}${path}`, { ...options, headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      return data;
    },
    []
  );

  // Load Overview
  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const data = await fetchWithToken("/nurse/overview/");
      setNurse(data.nurse);
      setStats(data.stats);
      setRecentTasks(data.recent_tasks || []);
      setTodayPatients(data.today_patients || []);
    } catch (err) {
      console.error("Failed to load nurse overview:", err);
    } finally {
      setOverviewLoading(false);
    }
  }, [fetchWithToken]);

  // Load Assignments
  const loadAssignments = useCallback(async () => {
    setAssignmentsLoading(true);
    try {
      const query = assignmentFilter !== "ALL" ? `?status=${assignmentFilter}` : "";
      const data = await fetchWithToken(`/nurse/assignments/${query}`);
      setAssignments(data.assignments || []);
    } catch (err) {
      console.error("Failed to load nurse assignments:", err);
    } finally {
      setAssignmentsLoading(false);
    }
  }, [fetchWithToken, assignmentFilter]);

  // Load Schedule
  const loadSchedule = useCallback(async () => {
    setScheduleLoading(true);
    try {
      const data = await fetchWithToken("/nurse/schedule/");
      setShifts(data.schedule || []);
    } catch (err) {
      console.error("Failed to load schedule:", err);
    } finally {
      setScheduleLoading(false);
    }
  }, [fetchWithToken]);

  // Load Profile
  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const data = await fetchWithToken("/nurse/profile/");
      setNurse(data);
      setProfileForm({
        qualification: data.qualification || "",
        experience_years: data.experience_years || 0,
        phone_number: data.phone_number || "",
      });
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setProfileLoading(false);
    }
  }, [fetchWithToken]);

  // Tab switch effect
  useEffect(() => {
    if (activeTab === "overview") void loadOverview();
    else if (activeTab === "assignments" || activeTab === "patient-care") void loadAssignments();
    else if (activeTab === "schedule") void loadSchedule();
    else if (activeTab === "profile") void loadProfile();
  }, [activeTab, loadOverview, loadAssignments, loadSchedule, loadProfile]);

  // Save Care Task
  async function handleSaveTask() {
    if (!selectedTask) return;
    setUpdatingTask(true);
    setTaskMessage("");
    try {
      const vitalsPayload: Record<string, string> = {};
      if (updateBp) vitalsPayload.bp = updateBp;
      if (updatePulse) vitalsPayload.pulse = updatePulse;
      if (updateTemp) vitalsPayload.temp = updateTemp;
      if (updateSpo2) vitalsPayload.spo2 = updateSpo2;

      await fetchWithToken(`/nurse/tasks/${selectedTask.id}/update/`, {
        method: "POST",
        body: JSON.stringify({
          status: updateStatus,
          vitals: vitalsPayload,
          notes: updateNote,
        }),
      });

      setTaskMessage("Care task updated successfully!");
      setTimeout(() => {
        setSelectedTask(null);
        setTaskMessage("");
        void loadAssignments();
        void loadOverview();
      }, 900);
    } catch (err) {
      setTaskMessage(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdatingTask(false);
    }
  }

  // Save Profile
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg("");
    try {
      await fetchWithToken("/nurse/profile/", {
        method: "PATCH",
        body: JSON.stringify(profileForm),
      });
      setProfileMsg("Profile updated successfully!");
      void loadProfile();
    } catch (err) {
      setProfileMsg(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setProfileSaving(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: colors.bg,
        color: colors.text,
        fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: 260,
          flexShrink: 0,
          backgroundColor: colors.sidebarBg,
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
                background: `linear-gradient(135deg, ${colors.aqua}, #123B45)`,
                color: "#ffffff",
                display: "grid",
                placeItems: "center",
                fontSize: 22,
                fontWeight: 800,
                boxShadow: "0 4px 12px rgba(32, 166, 154, 0.25)",
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
                  fontWeight: 700,
                  color: colors.aqua,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                }}
              >
                Nursing Station
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { id: "overview", label: "Overview", icon: "⊞" },
              { id: "assignments", label: "My Assignments", icon: "📋" },
              { id: "schedule", label: "Work Schedule", icon: "📅" },
              { id: "patient-care", label: "Patient Care", icon: "🩺" },
              { id: "notes", label: "Care Notes", icon: "📝" },
              { id: "notifications", label: "Notifications", icon: "🔔" },
              { id: "profile", label: "My Profile", icon: "👤" },
              { id: "settings", label: "Settings", icon: "⚙" },
            ].map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as NurseTab)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    width: "100%",
                    padding: "12px 14px",
                    border: "none",
                    borderRadius: 10,
                    backgroundColor: active ? colors.primarySubtle : "transparent",
                    color: active ? colors.aqua : colors.text,
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

        {/* Theme & Logout */}
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
              backgroundColor: colors.surfaceSubtle,
              color: colors.text,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <span>Theme</span>
            <span>{colors.isDark ? "🌙 Dark" : "☀️ Light"}</span>
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
              {activeTab === "overview" && `Welcome, Nurse ${nurseName}`}
              {activeTab === "assignments" && "Nursing Care Assignments"}
              {activeTab === "schedule" && "Weekly Shift Schedule"}
              {activeTab === "patient-care" && "Active Patient Care Queue"}
              {activeTab === "notes" && "Clinical Care Handover Notes"}
              {activeTab === "notifications" && "Clinical Task Notifications"}
              {activeTab === "profile" && "Nurse Professional Profile"}
              {activeTab === "settings" && "Station Settings"}
            </h1>
            <p style={{ color: colors.textMuted, margin: "6px 0 0", fontSize: 14 }}>
              {activeTab === "overview" && "Review assigned care tasks, scheduled patient visits, and vital triage."}
              {activeTab === "assignments" && "Manage vital recordings, patient assessments, and triage status."}
              {activeTab === "schedule" && "Track scheduled duty shifts, department assignments, and coverage."}
              {activeTab === "patient-care" && "Authorized patient appointments for triage and clinical care support."}
              {activeTab === "notes" && "Patient vital recordings and nursing handover records."}
              {activeTab === "notifications" && "Important schedule updates and clinical care alerts."}
              {activeTab === "profile" && "Manage qualifications, clinical credentials, and contact info."}
              {activeTab === "settings" && "Configure interface appearance and security preferences."}
            </p>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 20,
                backgroundColor: colors.primarySubtle,
                color: colors.aqua,
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              ● On Duty
            </span>
          </div>
        </header>

        {/* 1. OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div>
            {overviewLoading ? (
              <div style={{ padding: 40, textAlign: "center", color: colors.textMuted }}>
                Loading nursing station data...
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
                    { label: "My Assigned Tasks", value: stats?.total_assigned_tasks ?? 0, color: colors.aqua },
                    { label: "Pending Tasks", value: stats?.pending_tasks ?? 0, color: colors.coral },
                    { label: "Completed Today", value: stats?.completed_today ?? 0, color: colors.success },
                    { label: "Today's Patient Queue", value: stats?.active_patients_today ?? 0, color: colors.text },
                  ].map((card, i) => (
                    <div
                      key={i}
                      style={{
                        backgroundColor: colors.surface,
                        border: `1px solid ${colors.border}`,
                        borderRadius: 14,
                        padding: 22,
                        boxShadow: colors.shadow,
                      }}
                    >
                      <div style={{ fontSize: 13, color: colors.textMuted, fontWeight: 600, marginBottom: 8 }}>
                        {card.label}
                      </div>
                      <div style={{ fontSize: 32, fontWeight: 800, color: card.color }}>
                        {card.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Two Columns: Recent Tasks & Today's Patients */}
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24 }}>
                  {/* Care Tasks */}
                  <div
                    style={{
                      backgroundColor: colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 14,
                      padding: 24,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Active Care Tasks</h2>
                      <button
                        onClick={() => setActiveTab("assignments")}
                        style={{ border: "none", background: "none", color: colors.aqua, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                      >
                        View All →
                      </button>
                    </div>

                    {recentTasks.length === 0 ? (
                      <p style={{ color: colors.textMuted, fontSize: 14 }}>No active tasks at the moment.</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {recentTasks.map((t) => (
                          <div
                            key={t.id}
                            style={{
                              padding: 14,
                              borderRadius: 10,
                              backgroundColor: colors.surfaceSubtle,
                              border: `1px solid ${colors.borderSubtle}`,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14 }}>{t.patient_name}</div>
                              <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
                                {t.task_description} • <span style={{ color: colors.aqua }}>{t.department_name}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedTask(t);
                                setUpdateStatus(t.status);
                                setUpdateBp(t.vitals?.bp || "");
                                setUpdatePulse(t.vitals?.pulse || "");
                                setUpdateTemp(t.vitals?.temp || "");
                                setUpdateSpo2(t.vitals?.spo2 || "");
                              }}
                              style={{
                                padding: "6px 14px",
                                backgroundColor: colors.aqua,
                                color: "#ffffff",
                                border: "none",
                                borderRadius: 8,
                                fontWeight: 700,
                                fontSize: 12,
                                cursor: "pointer",
                              }}
                            >
                              Update Vitals
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Today's Patients */}
                  <div
                    style={{
                      backgroundColor: colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 14,
                      padding: 24,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Today's Scheduled Patients</h2>
                      <button
                        onClick={() => setActiveTab("patient-care")}
                        style={{ border: "none", background: "none", color: colors.aqua, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                      >
                        Queue →
                      </button>
                    </div>

                    {todayPatients.length === 0 ? (
                      <p style={{ color: colors.textMuted, fontSize: 14 }}>No scheduled patient arrivals today.</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {todayPatients.map((p) => (
                          <div
                            key={p.id}
                            style={{
                              padding: 12,
                              borderRadius: 10,
                              backgroundColor: colors.surfaceSubtle,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 13 }}>{p.patient_name} ({p.patient_age}y, {p.patient_gender})</div>
                              <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 3 }}>
                                Time: {p.time} • Dr. {p.doctor_name}
                              </div>
                            </div>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: "4px 8px",
                                borderRadius: 6,
                                backgroundColor: p.status === "CONFIRMED" ? colors.primarySubtle : colors.coralSubtle,
                                color: p.status === "CONFIRMED" ? colors.aqua : colors.coral,
                              }}
                            >
                              {p.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* 2. ASSIGNMENTS & PATIENT CARE TAB */}
        {(activeTab === "assignments" || activeTab === "patient-care") && (
          <div>
            {/* Filter pills */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              {["ALL", "PENDING", "IN_PROGRESS", "COMPLETED"].map((f) => (
                <button
                  key={f}
                  onClick={() => setAssignmentFilter(f)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 20,
                    border: `1px solid ${assignmentFilter === f ? colors.aqua : colors.border}`,
                    backgroundColor: assignmentFilter === f ? colors.primarySubtle : colors.surface,
                    color: assignmentFilter === f ? colors.aqua : colors.text,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {f.replace("_", " ")}
                </button>
              ))}
            </div>

            {assignmentsLoading ? (
              <div style={{ padding: 40, textAlign: "center", color: colors.textMuted }}>
                Loading assignments...
              </div>
            ) : assignments.length === 0 ? (
              <div
                style={{
                  padding: 40,
                  textAlign: "center",
                  backgroundColor: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 14,
                  color: colors.textMuted,
                }}
              >
                No assignments found for this filter.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {assignments.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      padding: 20,
                      borderRadius: 14,
                      backgroundColor: colors.surface,
                      border: `1px solid ${colors.border}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      boxShadow: colors.shadow,
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontWeight: 800, fontSize: 16 }}>{t.patient_name}</span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: 6,
                            backgroundColor:
                              t.status === "COMPLETED"
                                ? "#dcfce7"
                                : t.status === "IN_PROGRESS"
                                ? colors.primarySubtle
                                : colors.coralSubtle,
                            color:
                              t.status === "COMPLETED"
                                ? "#15803d"
                                : t.status === "IN_PROGRESS"
                                ? colors.aqua
                                : colors.coral,
                          }}
                        >
                          {t.status.replace("_", " ")}
                        </span>
                      </div>
                      <div style={{ fontSize: 14, color: colors.textMuted, marginBottom: 8 }}>
                        {t.task_description} • {t.organization_name} ({t.department_name})
                      </div>

                      {/* Vitals summary if recorded */}
                      {t.vitals && Object.keys(t.vitals).length > 0 && (
                        <div style={{ display: "flex", gap: 14, fontSize: 12, marginTop: 8 }}>
                          {t.vitals.bp && <span><strong>BP:</strong> {t.vitals.bp} mmHg</span>}
                          {t.vitals.pulse && <span><strong>Pulse:</strong> {t.vitals.pulse} bpm</span>}
                          {t.vitals.temp && <span><strong>Temp:</strong> {t.vitals.temp} °F</span>}
                          {t.vitals.spo2 && <span><strong>SpO2:</strong> {t.vitals.spo2} %</span>}
                        </div>
                      )}

                      {t.notes && (
                        <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 6, fontStyle: "italic" }}>
                          Notes: {t.notes}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setSelectedTask(t);
                        setUpdateStatus(t.status);
                        setUpdateBp(t.vitals?.bp || "");
                        setUpdatePulse(t.vitals?.pulse || "");
                        setUpdateTemp(t.vitals?.temp || "");
                        setUpdateSpo2(t.vitals?.spo2 || "");
                      }}
                      style={{
                        padding: "9px 18px",
                        backgroundColor: colors.aqua,
                        color: "#ffffff",
                        border: "none",
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      Record Vitals & Care
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. SCHEDULE TAB */}
        {activeTab === "schedule" && (
          <div
            style={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 14,
              padding: 24,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 18 }}>Weekly Nursing Duty Roster</h2>
            {scheduleLoading ? (
              <p style={{ color: colors.textMuted }}>Loading duty schedule...</p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {shifts.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: 16,
                      borderRadius: 10,
                      backgroundColor: colors.surfaceSubtle,
                      border: `1px solid ${colors.borderSubtle}`,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15 }}>{s.day}</div>
                      <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
                        {s.organization_name} • {s.department}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: colors.aqua }}>{s.shift}</div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 6,
                          backgroundColor: s.status === "Scheduled" ? colors.primarySubtle : colors.surface,
                          color: s.status === "Scheduled" ? colors.aqua : colors.textMuted,
                        }}
                      >
                        {s.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. CARE NOTES TAB */}
        {activeTab === "notes" && (
          <div
            style={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 14,
              padding: 24,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Clinical Observations & Handover</h2>
            <p style={{ color: colors.textMuted, fontSize: 14, marginBottom: 20 }}>
              Recent nursing notes recorded during vitals checks and patient intake assessments.
            </p>
            {recentTasks.filter((t) => t.notes).length === 0 ? (
              <p style={{ color: colors.textMuted, fontSize: 14 }}>No notes recorded in recent care tasks.</p>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {recentTasks
                  .filter((t) => t.notes)
                  .map((t) => (
                    <div
                      key={t.id}
                      style={{
                        padding: 16,
                        borderRadius: 10,
                        backgroundColor: colors.surfaceSubtle,
                        border: `1px solid ${colors.borderSubtle}`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>Patient: {t.patient_name}</span>
                        <span style={{ fontSize: 12, color: colors.textMuted }}>{t.created_at}</span>
                      </div>
                      <div style={{ fontSize: 13, color: colors.text }}>{t.notes}</div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* 5. NOTIFICATIONS TAB */}
        {activeTab === "notifications" && (
          <div
            style={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 14,
              padding: 24,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Clinical Notifications</h2>
            <div style={{ display: "grid", gap: 12 }}>
              <div
                style={{
                  padding: 16,
                  borderRadius: 10,
                  backgroundColor: colors.primarySubtle,
                  border: `1px solid ${colors.aqua}`,
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 14, color: colors.aqua }}>✓ Duty Shift Active</div>
                <div style={{ fontSize: 13, color: colors.text, marginTop: 4 }}>
                  You are currently clocked in for clinical care duties. Department coverage is verified.
                </div>
              </div>
              <div
                style={{
                  padding: 16,
                  borderRadius: 10,
                  backgroundColor: colors.surfaceSubtle,
                  border: `1px solid ${colors.borderSubtle}`,
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 14 }}>Upcoming Vitals Review</div>
                <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
                  Routine morning triage vitals are scheduled for all confirmed in-clinic appointments.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. PROFILE TAB */}
        {activeTab === "profile" && (
          <div
            style={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 14,
              padding: 28,
              maxWidth: 620,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>Nurse Credentials & Info</h2>

            {profileLoading ? (
              <p style={{ color: colors.textMuted }}>Loading profile...</p>
            ) : (
              <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Full Name</label>
                  <input
                    type="text"
                    disabled
                    value={nurse?.name || ""}
                    style={{
                      width: "100%",
                      padding: 12,
                      borderRadius: 8,
                      border: `1px solid ${colors.border}`,
                      backgroundColor: colors.surfaceSubtle,
                      color: colors.textMuted,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>License Number</label>
                  <input
                    type="text"
                    disabled
                    value={nurse?.license_number || ""}
                    style={{
                      width: "100%",
                      padding: 12,
                      borderRadius: 8,
                      border: `1px solid ${colors.border}`,
                      backgroundColor: colors.surfaceSubtle,
                      color: colors.textMuted,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Qualification</label>
                  <input
                    type="text"
                    value={profileForm.qualification}
                    onChange={(e) => setProfileForm({ ...profileForm, qualification: e.target.value })}
                    placeholder="e.g. B.Sc Nursing, Registered Nurse (RN)"
                    style={{
                      width: "100%",
                      padding: 12,
                      borderRadius: 8,
                      border: `1px solid ${colors.border}`,
                      backgroundColor: colors.inputBg,
                      color: colors.text,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Experience (Years)</label>
                  <input
                    type="number"
                    value={profileForm.experience_years}
                    onChange={(e) => setProfileForm({ ...profileForm, experience_years: Number(e.target.value) })}
                    style={{
                      width: "100%",
                      padding: 12,
                      borderRadius: 8,
                      border: `1px solid ${colors.border}`,
                      backgroundColor: colors.inputBg,
                      color: colors.text,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Phone Number</label>
                  <input
                    type="text"
                    value={profileForm.phone_number}
                    onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
                    style={{
                      width: "100%",
                      padding: 12,
                      borderRadius: 8,
                      border: `1px solid ${colors.border}`,
                      backgroundColor: colors.inputBg,
                      color: colors.text,
                    }}
                  />
                </div>

                {profileMsg && (
                  <div style={{ color: colors.aqua, fontWeight: 700, fontSize: 13 }}>{profileMsg}</div>
                )}

                <button
                  type="submit"
                  disabled={profileSaving}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: colors.aqua,
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 700,
                    cursor: "pointer",
                    alignSelf: "flex-start",
                  }}
                >
                  {profileSaving ? "Saving..." : "Save Profile"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* 7. SETTINGS TAB */}
        {activeTab === "settings" && (
          <div
            style={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 14,
              padding: 24,
              maxWidth: 580,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Station Settings</h2>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: `1px solid ${colors.border}` }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Appearance Theme</div>
                <div style={{ fontSize: 12, color: colors.textMuted }}>Toggle dark or light theme</div>
              </div>
              <button
                onClick={onToggleTheme}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.surfaceSubtle,
                  color: colors.text,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {colors.isDark ? "🌙 Dark Mode" : "☀️ Light Mode"}
              </button>
            </div>
            <div style={{ padding: "14px 0" }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Role & Permissions</div>
              <div style={{ fontSize: 12, color: colors.textMuted, lineHeight: 1.6 }}>
                Nurse accounts have clinical access to assigned department patients, triage vitals, and care notes. Issuing prescriptions and doctor availability adjustments are restricted by platform policy.
              </div>
            </div>
          </div>
        )}

        {/* Task Update Modal */}
        {selectedTask && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              display: "grid",
              placeItems: "center",
              zIndex: 1000,
              padding: 20,
            }}
          >
            <div
              style={{
                width: "min(520px, 100%)",
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 28,
                border: `1px solid ${colors.border}`,
                boxShadow: colors.shadow,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Record Vitals & Care Update</h3>
                <button
                  onClick={() => setSelectedTask(null)}
                  style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer", color: colors.textMuted }}
                >
                  ✕
                </button>
              </div>

              <div style={{ marginBottom: 16, fontSize: 14, color: colors.textMuted }}>
                Patient: <strong style={{ color: colors.text }}>{selectedTask.patient_name}</strong> • Task: {selectedTask.task_description}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Blood Pressure (mmHg)</label>
                  <input
                    type="text"
                    value={updateBp}
                    onChange={(e) => setUpdateBp(e.target.value)}
                    placeholder="e.g. 120/80"
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.text }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Pulse (bpm)</label>
                  <input
                    type="text"
                    value={updatePulse}
                    onChange={(e) => setUpdatePulse(e.target.value)}
                    placeholder="e.g. 74"
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.text }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Body Temp (°F)</label>
                  <input
                    type="text"
                    value={updateTemp}
                    onChange={(e) => setUpdateTemp(e.target.value)}
                    placeholder="e.g. 98.6"
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.text }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>SpO2 (%)</label>
                  <input
                    type="text"
                    value={updateSpo2}
                    onChange={(e) => setUpdateSpo2(e.target.value)}
                    placeholder="e.g. 99"
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.text }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Task Status</label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value as "PENDING" | "IN_PROGRESS" | "COMPLETED")}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.text }}
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Nursing Handover Notes</label>
                <textarea
                  rows={3}
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  placeholder="Record patient condition, triage observations, or administration details..."
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.text, resize: "vertical" }}
                />
              </div>

              {taskMessage && (
                <div style={{ marginBottom: 14, color: colors.aqua, fontWeight: 700, fontSize: 13 }}>
                  {taskMessage}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  style={{ padding: "10px 18px", border: `1px solid ${colors.border}`, backgroundColor: "transparent", color: colors.text, borderRadius: 8, fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={updatingTask}
                  onClick={handleSaveTask}
                  style={{ padding: "10px 20px", border: "none", backgroundColor: colors.aqua, color: "#ffffff", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
                >
                  {updatingTask ? "Saving..." : "Save Record"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
