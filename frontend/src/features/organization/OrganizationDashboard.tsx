
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

import DoctorManagement from "./DoctorManagement";
import AvailabilityManagement from "./AvailabilityManagement";
import NurseManagement from "./NurseManagement";
import AppointmentManagement from "./AppointmentManagement";

type Theme = "light" | "dark";

interface Props {
  theme: Theme;
  onToggleTheme: () => void;
  onLogout: () => void;
  organizationId: number;
}

interface Organization {
  id: number;
  name: string;
  type: string;
  email: string;
  phone_number: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  verification_status: string;
}

interface Statistics {
  total_departments: number;
  total_doctors: number;
  total_nurses: number;
  total_appointments: number;
  pending_appointments: number;
  confirmed_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  rejected_appointments: number;
}

interface DashboardData {
  organization: Organization;
  statistics: Statistics;
}

interface Department {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}

const API_URL = "http://127.0.0.1:8000/api";

const navigation = [
  { id: "overview", label: "Overview", icon: "▦" },
  { id: "departments", label: "Departments", icon: "▤" },
  { id: "doctors", label: "Doctors", icon: "⚕" },
  { id: "nurses", label: "Nurses", icon: "♙" },
  { id: "appointments", label: "Appointments", icon: "▣" },
  { id: "availability", label: "Availability", icon: "◷" },
  { id: "settings", label: "Organization Settings", icon: "⚙" },
];

export default function OrganizationDashboard({
  theme,
  onToggleTheme,
  onLogout,
  organizationId,
}: Props) {
  const [activeSection, setActiveSection] = useState("overview");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Department states
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentLoading, setDepartmentLoading] = useState(false);
  const [departmentError, setDepartmentError] = useState("");
  const [departmentMessage, setDepartmentMessage] = useState("");

  const [showDepartmentForm, setShowDepartmentForm] = useState(false);
  const [editingDepartmentId, setEditingDepartmentId] = useState<number | null>(null);
  const [departmentName, setDepartmentName] = useState("");
  const [departmentDescription, setDepartmentDescription] = useState("");
  const [savingDepartment, setSavingDepartment] = useState(false);

  const isDark = theme === "dark";

  const colors = {
    background: isDark ? "#101b1b" : "#f4f9f8",
    sidebar: isDark ? "#172725" : "#ffffff",
    card: isDark ? "#1b302d" : "#ffffff",
    border: isDark ? "#304642" : "#e1ece9",
    text: isDark ? "#edf8f5" : "#183b36",
    muted: isDark ? "#a5bcb6" : "#718782",
    primary: "#087f75",
    active: isDark ? "#23443e" : "#e3f4ef",
  };

  const getAccessToken = async () => {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session?.access_token) {
      throw new Error("Your session has expired. Please log in again.");
    }

    return data.session.access_token;
  };

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = await getAccessToken();

      const response = await fetch(
        `${API_URL}/organization/${organizationId}/dashboard/`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to load organization dashboard."
        );
      }

      setDashboard(result as DashboardData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading the dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const loadDepartments = useCallback(async () => {
    setDepartmentLoading(true);
    setDepartmentError("");

    try {
      const token = await getAccessToken();

      const response = await fetch(
        `${API_URL}/organization/${organizationId}/departments/`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to load departments.");
      }

      setDepartments(result.departments || []);
    } catch (err) {
      setDepartmentError(
        err instanceof Error ? err.message : "Unable to load departments."
      );
    } finally {
      setDepartmentLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (activeSection === "departments") {
      void loadDepartments();
    }
  }, [activeSection, loadDepartments]);

  const resetDepartmentForm = () => {
    setShowDepartmentForm(false);
    setEditingDepartmentId(null);
    setDepartmentName("");
    setDepartmentDescription("");
  };

  const startEditingDepartment = (department: Department) => {
    setEditingDepartmentId(department.id);
    setDepartmentName(department.name);
    setDepartmentDescription(department.description);
    setShowDepartmentForm(true);
    setDepartmentError("");
    setDepartmentMessage("");
  };

  const saveDepartment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!departmentName.trim()) {
      setDepartmentError("Department name is required.");
      return;
    }

    setSavingDepartment(true);
    setDepartmentError("");
    setDepartmentMessage("");

    try {
      const token = await getAccessToken();
      const isEditing = editingDepartmentId !== null;

      const url = isEditing
        ? `${API_URL}/organization/${organizationId}/departments/${editingDepartmentId}/`
        : `${API_URL}/organization/${organizationId}/departments/`;

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: departmentName.trim(),
          description: departmentDescription.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || result.message || "Unable to save department."
        );
      }

      resetDepartmentForm();
      setDepartmentMessage(
        isEditing
          ? "Department updated successfully."
          : "Department created successfully."
      );

      await Promise.all([loadDepartments(), loadDashboard()]);
    } catch (err) {
      setDepartmentError(
        err instanceof Error ? err.message : "Unable to save department."
      );
    } finally {
      setSavingDepartment(false);
    }
  };

  const toggleDepartmentStatus = async (department: Department) => {
    const action = department.is_active ? "deactivate" : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${department.name}?`
    );

    if (!confirmed) return;

    setDepartmentError("");
    setDepartmentMessage("");

    try {
      const token = await getAccessToken();

      const response = await fetch(
        `${API_URL}/organization/${organizationId}/departments/${department.id}/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_active: !department.is_active,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || result.message || "Unable to update department."
        );
      }

      setDepartmentMessage(
        `Department ${action}d successfully.`
      );

      await Promise.all([loadDepartments(), loadDashboard()]);
    } catch (err) {
      setDepartmentError(
        err instanceof Error ? err.message : "Unable to update department."
      );
    }
  };

  const stats = dashboard?.statistics;

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        background: colors.background,
        color: colors.text,
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: 245,
          flexShrink: 0,
          background: colors.sidebar,
          borderRight: `1px solid ${colors.border}`,
          padding: "25px 15px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 11,
            alignItems: "center",
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 43,
              height: 43,
              borderRadius: 12,
              background: colors.primary,
              color: "white",
              display: "grid",
              placeItems: "center",
              fontSize: 23,
              fontWeight: 800,
            }}
          >
            M
          </div>
          <div>
            <strong style={{ fontSize: 21 }}>Mediqo</strong>
            <div style={{ fontSize: 11, color: colors.muted }}>
              Organization Portal
            </div>
          </div>
        </div>

        <p
          style={{
            fontSize: 10,
            letterSpacing: 1.3,
            color: colors.muted,
            fontWeight: 700,
          }}
        >
          MANAGEMENT
        </p>

        <nav style={{ display: "grid", gap: 7 }}>
          {navigation.map((item) => {
            const active = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  padding: "12px 13px",
                  border: "none",
                  borderRadius: 9,
                  background: active ? colors.active : "transparent",
                  color: active ? colors.primary : colors.text,
                  fontWeight: active ? 700 : 500,
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                <span style={{ fontSize: 19, width: 22 }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div
          style={{
            marginTop: 40,
            borderTop: `1px solid ${colors.border}`,
            paddingTop: 20,
          }}
        >
          <button
            onClick={onLogout}
            style={{
              width: "100%",
              padding: 12,
              border: "none",
              borderRadius: 9,
              background: "#fff0ef",
              color: "#bd3c35",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            ↪ Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <section style={{ flex: 1, minWidth: 0 }}>
        <header
          style={{
            minHeight: 76,
            padding: "15px 30px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 15,
            flexWrap: "wrap",
            background: colors.sidebar,
            borderBottom: `1px solid ${colors.border}`,
            boxSizing: "border-box",
          }}
        >
          <div>
            <strong>Organization Dashboard</strong>
            <div style={{ color: colors.muted, fontSize: 12, marginTop: 5 }}>
              Manage your hospital operations
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => {
                if (activeSection === "departments") {
                  void loadDepartments();
                } else {
                  void loadDashboard();
                }
              }}
              disabled={loading || departmentLoading}
              style={headerButton(colors)}
            >
              ↻ Refresh
            </button>
            <button onClick={onToggleTheme} style={headerButton(colors)}>
              {isDark ? "☀ Light" : "☾ Dark"}
            </button>
          </div>
        </header>

        <div
          style={{
            padding: "32px 30px",
            maxWidth: 1250,
            margin: "auto",
          }}
        >
          {error && (
            <div style={messageStyle}>
              {error}
              <button
                onClick={() => void loadDashboard()}
                style={{ marginLeft: 12 }}
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div
              style={{
                padding: 60,
                textAlign: "center",
                color: colors.muted,
              }}
            >
              Loading organization dashboard...
            </div>
          ) : dashboard && activeSection === "overview" ? (
            <>
              <div style={{ marginBottom: 28 }}>
                <p
                  style={{
                    color: colors.primary,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 1.5,
                  }}
                >
                  ORGANIZATION OVERVIEW
                </p>
                <h1 style={{ margin: "8px 0", fontSize: 30 }}>
                  Welcome to {dashboard.organization.name}
                </h1>
                <p style={{ color: colors.muted }}>
                  Here's what's happening at your organization.
                </p>
              </div>

              <div
                style={{
                  background: colors.card,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 15,
                  padding: 23,
                  marginBottom: 25,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 15,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <span style={{ color: colors.muted, fontSize: 12 }}>
                      ORGANIZATION
                    </span>
                    <h2 style={{ margin: "8px 0" }}>
                      {dashboard.organization.name}
                    </h2>
                    <span style={{ color: colors.muted, fontSize: 13 }}>
                      {dashboard.organization.type} ·{" "}
                      {dashboard.organization.city},{" "}
                      {dashboard.organization.state}
                    </span>
                  </div>
                  <span
                    style={{
                      height: "fit-content",
                      background: "#e1f7e9",
                      color: "#187744",
                      padding: "8px 13px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    ✓ {dashboard.organization.verification_status}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 25,
                    flexWrap: "wrap",
                    marginTop: 20,
                    color: colors.muted,
                    fontSize: 13,
                  }}
                >
                  <span>✉ {dashboard.organization.email}</span>
                  <span>☎ {dashboard.organization.phone_number}</span>
                  <span>⌖ {dashboard.organization.address}</span>
                </div>
              </div>

              <h2 style={{ fontSize: 19, marginBottom: 17 }}>
                Hospital Statistics
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                  gap: 16,
                }}
              >
                {[
                  { label: "Departments", value: stats?.total_departments, icon: "▤" },
                  { label: "Doctors", value: stats?.total_doctors, icon: "⚕" },
                  { label: "Nurses", value: stats?.total_nurses, icon: "♙" },
                  { label: "Appointments", value: stats?.total_appointments, icon: "▣" },
                  { label: "Pending", value: stats?.pending_appointments, icon: "◷" },
                  { label: "Confirmed", value: stats?.confirmed_appointments, icon: "✓" },
                  { label: "Completed", value: stats?.completed_appointments, icon: "☑" },
                  { label: "Cancelled", value: stats?.cancelled_appointments, icon: "×" },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      background: colors.card,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 13,
                      padding: 21,
                    }}
                  >
                    <div style={{ color: colors.primary, fontSize: 24 }}>
                      {item.icon}
                    </div>
                    <div
                      style={{
                        fontSize: 29,
                        fontWeight: 800,
                        margin: "12px 0 5px",
                      }}
                    >
                      {item.value ?? 0}
                    </div>
                    <div style={{ color: colors.muted, fontSize: 13 }}>
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: 25,
                  background: colors.card,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 13,
                  padding: 22,
                }}
              >
                <h3 style={{ marginTop: 0 }}>Quick Information</h3>
                <p style={{ color: colors.muted, fontSize: 14 }}>
                  Rejected appointments: {stats?.rejected_appointments ?? 0}
                </p>
                <p style={{ color: colors.muted, fontSize: 14 }}>
                  Postal code: {dashboard.organization.postal_code}
                </p>
              </div>
            </>
          ) : activeSection === "departments" ? (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 15,
                  marginBottom: 25,
                }}
              >
                <div>
                  <p
                    style={{
                      color: colors.primary,
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: 1.5,
                    }}
                  >
                    ORGANIZATION MANAGEMENT
                  </p>
                  <h1 style={{ margin: "8px 0", fontSize: 28 }}>
                    Departments
                  </h1>
                  <p style={{ color: colors.muted, margin: 0 }}>
                    Create and manage your hospital departments.
                  </p>
                </div>

                <button
                  onClick={() => {
                    resetDepartmentForm();
                    setDepartmentError("");
                    setDepartmentMessage("");
                    setShowDepartmentForm(true);
                  }}
                  style={primaryButton}
                >
                  + Add Department
                </button>
              </div>

              {departmentMessage && (
                <div
                  style={{
                    ...messageStyle,
                    background: "#e5f7ed",
                    color: "#187744",
                  }}
                >
                  {departmentMessage}
                </div>
              )}

              {departmentError && (
                <div style={messageStyle}>{departmentError}</div>
              )}

              {showDepartmentForm && (
                <form
                  onSubmit={saveDepartment}
                  style={{
                    background: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 14,
                    padding: 24,
                    marginBottom: 25,
                  }}
                >
                  <h2 style={{ marginTop: 0, fontSize: 19 }}>
                    {editingDepartmentId ? "Edit Department" : "Add Department"}
                  </h2>

                  <label style={fieldLabel(colors)}>Department Name *</label>
                  <input
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value)}
                    placeholder="e.g. Cardiology"
                    maxLength={120}
                    required
                    style={fieldInput(colors)}
                  />

                  <label style={fieldLabel(colors)}>Description</label>
                  <textarea
                    value={departmentDescription}
                    onChange={(e) => setDepartmentDescription(e.target.value)}
                    placeholder="Describe the department..."
                    rows={3}
                    style={{
                      ...fieldInput(colors),
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />

                  <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                    <button
                      type="submit"
                      disabled={savingDepartment}
                      style={primaryButton}
                    >
                      {savingDepartment
                        ? "Saving..."
                        : editingDepartmentId
                        ? "Save Changes"
                        : "Create Department"}
                    </button>

                    <button
                      type="button"
                      onClick={resetDepartmentForm}
                      style={headerButton(colors)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 15,
                }}
              >
                <h2 style={{ fontSize: 18, margin: 0 }}>
                  All Departments ({departments.length})
                </h2>
                <span style={{ color: colors.muted, fontSize: 12 }}>
                  Active: {departments.filter((d) => d.is_active).length}
                </span>
              </div>

              {departmentLoading ? (
                <div
                  style={{
                    background: colors.card,
                    borderRadius: 13,
                    padding: 45,
                    textAlign: "center",
                    color: colors.muted,
                  }}
                >
                  Loading departments...
                </div>
              ) : departments.length === 0 ? (
                <div
                  style={{
                    background: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 14,
                    padding: 45,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 38 }}>▤</div>
                  <h3>No departments yet</h3>
                  <p style={{ color: colors.muted }}>
                    Add your first department to get started.
                  </p>
                  <button
                    onClick={() => setShowDepartmentForm(true)}
                    style={primaryButton}
                  >
                    + Add First Department
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: 16,
                  }}
                >
                  {departments.map((department) => (
                    <div
                      key={department.id}
                      style={{
                        background: colors.card,
                        border: `1px solid ${colors.border}`,
                        borderRadius: 14,
                        padding: 21,
                        opacity: department.is_active ? 1 : 0.75,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          alignItems: "center",
                        }}
                      >
                        <h3 style={{ margin: 0, fontSize: 18 }}>
                          {department.name}
                        </h3>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "6px 9px",
                            borderRadius: 20,
                            background: department.is_active
                              ? "#e1f7e9"
                              : "#f1eeee",
                            color: department.is_active ? "#187744" : "#777777",
                          }}
                        >
                          {department.is_active ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>

                      <p
                        style={{
                          color: colors.muted,
                          fontSize: 13,
                          lineHeight: 1.6,
                          minHeight: 42,
                          margin: "14px 0 20px",
                        }}
                      >
                        {department.description || "No description provided."}
                      </p>

                      <div
                        style={{
                          display: "flex",
                          gap: 9,
                          flexWrap: "wrap",
                          borderTop: `1px solid ${colors.border}`,
                          paddingTop: 15,
                        }}
                      >
                        <button
                          onClick={() => startEditingDepartment(department)}
                          style={smallButton(colors)}
                        >
                          ✎ Edit
                        </button>

                        <button
                          onClick={() => void toggleDepartmentStatus(department)}
                          style={{
                            ...smallButton(colors),
                            color: department.is_active ? "#bd3c35" : "#187744",
                          }}
                        >
                          {department.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : activeSection === "doctors" ? (
            <DoctorManagement
              organizationId={organizationId}
              colors={colors}
            />
          ) : activeSection === "availability" ? (
            <AvailabilityManagement
              organizationId={organizationId}
              colors={colors}
            />
          ) : activeSection === "nurses" ? (
            <NurseManagement
              organizationId={organizationId}
              colors={colors}
            />
          ) : activeSection === "appointments" ? (
            <AppointmentManagement
              organizationId={organizationId}
              colors={colors}
            />
          ) : (
            <div
              style={{
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: 15,
                padding: 45,
                textAlign: "center",
                marginTop: 30,
              }}
            >
              <div style={{ fontSize: 40, color: colors.primary }}>✦</div>
              <h2>
                {navigation.find((item) => item.id === activeSection)?.label}
              </h2>
              <p style={{ color: colors.muted, lineHeight: 1.7 }}>
                This module is planned for the next development phase.
                Its backend APIs and management features are not implemented yet.
              </p>
              <button
                onClick={() => setActiveSection("overview")}
                style={{
                  ...headerButton(colors),
                  background: colors.primary,
                  color: "white",
                  borderColor: colors.primary,
                }}
              >
                Back to Overview
              </button>
            </div>
          )}
        </div>
      </section>

      <style>{`
        @media (max-width: 760px) {
          main > aside {
            width: 75px !important;
            padding: 15px 7px !important;
          }
          main > aside nav button {
            justify-content: center;
            font-size: 0 !important;
          }
          main > aside nav button span {
            font-size: 20px !important;
          }
          main > aside > div:first-child {
            justify-content: center;
          }
          main > aside > div:first-child > div:last-child {
            display: none;
          }
          main > aside > p {
            font-size: 8px !important;
          }
          main > aside > div:last-child button {
            font-size: 0;
          }
          main > aside > div:last-child button::first-letter {
            font-size: 18px;
          }
        }
      `}</style>
    </main>
  );
}

function headerButton(colors: {
  border: string;
  sidebar: string;
  text: string;
}) {
  return {
    padding: "10px 14px",
    border: `1px solid ${colors.border}`,
    borderRadius: 9,
    background: colors.sidebar,
    color: colors.text,
    cursor: "pointer",
    fontWeight: 600,
  } as const;
}

const primaryButton: React.CSSProperties = {
  padding: "11px 17px",
  border: "none",
  borderRadius: 9,
  background: "#087f75",
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: 700,
};

function fieldLabel(colors: { muted: string }): React.CSSProperties {
  return {
    display: "block",
    fontSize: 13,
    fontWeight: 700,
    color: colors.muted,
    margin: "15px 0 7px",
  };
}

function fieldInput(colors: {
  card: string;
  border: string;
  text: string;
}): React.CSSProperties {
  return {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 13px",
    border: `1px solid ${colors.border}`,
    borderRadius: 9,
    background: colors.card,
    color: colors.text,
    fontSize: 14,
    outline: "none",
  };
}

function smallButton(colors: {
  border: string;
  sidebar: string;
  text: string;
}): React.CSSProperties {
  return {
    padding: "8px 11px",
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    background: colors.sidebar,
    color: colors.text,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
  };
}

const messageStyle: React.CSSProperties = {
  padding: 14,
  background: "#fff0ef",
  color: "#b42318",
  borderRadius: 9,
  marginBottom: 20,
};
