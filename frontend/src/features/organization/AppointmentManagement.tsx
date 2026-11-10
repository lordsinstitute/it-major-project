import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const API_URL = "http://127.0.0.1:8000/api";

interface Appointment {
  id: number;
  patient_name: string;
  patient_phone: string;
  patient_age: number;
  patient_gender: string;
  doctor_name: string;
  doctor_specialization: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  visit_type: string;
  reason_for_visit: string;
  status: string;
}

interface Props {
  organizationId: number;
  colors: {
    card: string;
    border: string;
    text: string;
    muted: string;
    primary: string;
    sidebar: string;
    active: string;
  };
}

export default function AppointmentManagement({ organizationId, colors }: Props) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const getSessionToken = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || "";
  }, []);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getSessionToken();
      const res = await fetch(
        `${API_URL}/organization/${organizationId}/appointments/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load appointments.");
      setAppointments(data.appointments || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading appointments.");
    } finally {
      setLoading(false);
    }
  }, [organizationId, getSessionToken]);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  const filteredAppointments = appointments.filter((app) => {
    const matchesStatus = statusFilter === "ALL" || app.status === statusFilter;
    const matchesSearch =
      search.trim() === "" ||
      app.patient_name.toLowerCase().includes(search.toLowerCase()) ||
      app.doctor_name.toLowerCase().includes(search.toLowerCase()) ||
      app.appointment_date.includes(search.trim());
    return matchesStatus && matchesSearch;
  });

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
            Facility Appointments ({appointments.length})
          </h2>
          <p style={{ fontSize: 13, color: colors.muted, margin: "4px 0 0" }}>
            Monitor and coordinate scheduled patient consultations and visits across departments.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          {["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: "8px 14px",
                borderRadius: 20,
                border: `1px solid ${statusFilter === st ? colors.primary : colors.border}`,
                backgroundColor: statusFilter === st ? colors.active : colors.card,
                color: statusFilter === st ? colors.primary : colors.text,
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {st}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by patient, doctor, date..."
          style={{
            marginLeft: "auto",
            padding: "9px 14px",
            borderRadius: 8,
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.card,
            color: colors.text,
            fontSize: 13,
            minWidth: 240,
          }}
        />
      </div>

      {error && (
        <div style={{ padding: 14, backgroundColor: "#fee2e2", color: "#991b1b", borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 30, textAlign: "center", color: colors.muted }}>
          Loading facility appointments...
        </div>
      ) : filteredAppointments.length === 0 ? (
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
          No appointments found matching your filters.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {filteredAppointments.map((app) => (
            <div
              key={app.id}
              style={{
                padding: 20,
                borderRadius: 12,
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: 16 }}>{app.patient_name}</span>
                  <span style={{ fontSize: 13, color: colors.muted }}>
                    ({app.patient_age} yrs, {app.patient_gender})
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 6,
                      backgroundColor:
                        app.status === "CONFIRMED"
                          ? "#dcfce7"
                          : app.status === "PENDING"
                          ? "#fef3c7"
                          : "#f3f4f6",
                      color:
                        app.status === "CONFIRMED"
                          ? "#15803d"
                          : app.status === "PENDING"
                          ? "#b45309"
                          : colors.muted,
                    }}
                  >
                    {app.status}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 6,
                      backgroundColor: colors.active,
                      color: colors.primary,
                    }}
                  >
                    {app.visit_type === "HOME" ? "🏠 Home Visit" : "🏥 Hospital Visit"}
                  </span>
                </div>

                <div style={{ fontSize: 13, color: colors.text, marginBottom: 4 }}>
                  Consulting: <strong>Dr. {app.doctor_name}</strong> ({app.doctor_specialization})
                </div>

                <div style={{ fontSize: 12, color: colors.muted }}>
                  Date: <strong>{app.appointment_date}</strong> at <strong>{app.start_time} - {app.end_time}</strong> • Phone: {app.patient_phone}
                </div>

                {app.reason_for_visit && (
                  <div style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                    Reason: <em>{app.reason_for_visit}</em>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
