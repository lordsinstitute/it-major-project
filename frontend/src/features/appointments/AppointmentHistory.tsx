import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import AppointmentDetails, { type AppointmentDetailData } from "./AppointmentDetails";

const API_URL = "http://127.0.0.1:8000/api";

interface AppointmentHistoryProps {
  onBookNew?: () => void;
  colors: {
    bg: string;
    card: string;
    cardSubtle: string;
    border: string;
    text: string;
    muted: string;
    primary: string;
    coral: string;
    coralSubtle: string;
    mint: string;
    mintText: string;
  };
}

export default function AppointmentHistory({
  onBookNew,
  colors,
}: AppointmentHistoryProps) {
  const [appointments, setAppointments] = useState<AppointmentDetailData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentDetailData | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(
    null
  );

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error || !session?.access_token) {
        throw new Error("Please log in to view appointments.");
      }

      const res = await fetch(`${API_URL}/patient/appointments/`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load appointments.");
      setAppointments(data.appointments || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error fetching appointments.";
      setMessage({ text: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  const handleCancelAppointment = async (appointmentId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this appointment? This action cannot be undone."
    );
    if (!confirmed) return;

    setCancellingId(appointmentId);
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error || !session?.access_token) {
        throw new Error("Session expired. Please log in again.");
      }

      const res = await fetch(
        `${API_URL}/patient/appointments/${appointmentId}/cancel/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not cancel appointment.");

      setMessage({ text: "Appointment cancelled successfully.", type: "success" });
      setSelectedAppointment(null);
      await loadAppointments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cancellation failed.";
      setMessage({ text: msg, type: "error" });
    } finally {
      setCancellingId(null);
    }
  };

  const filteredAppointments = appointments.filter((app) => {
    const matchesFilter =
      activeFilter === "ALL" ||
      (activeFilter === "UPCOMING" &&
        ["PENDING", "CONFIRMED"].includes(app.status)) ||
      app.status === activeFilter;

    const docName = app.doctor?.name || "";
    const orgName = app.organization?.name || "";
    const matchesSearch =
      searchQuery.trim() === "" ||
      docName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      orgName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.appointment_date.includes(searchQuery.trim());

    return matchesFilter && matchesSearch;
  });

  return (
    <div>
      {/* Toast Alert */}
      {message && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: 8,
            backgroundColor: message.type === "success" ? colors.mint : colors.coralSubtle,
            color: message.type === "success" ? colors.mintText : colors.coral,
            marginBottom: 20,
            fontSize: 14,
            fontWeight: 600,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Controls Bar */}
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
          {["ALL", "UPCOMING", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  backgroundColor:
                    activeFilter === tab ? colors.primary : colors.card,
                  color: activeFilter === tab ? "#ffffff" : colors.text,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {tab}
              </button>
            )
          )}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <input
            type="text"
            placeholder="Search doctor, hospital, or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "9px 14px",
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.card,
              color: colors.text,
              fontSize: 13,
              width: 250,
              outline: "none",
            }}
          />

          {onBookNew && (
            <button
              onClick={onBookNew}
              style={{
                padding: "9px 18px",
                borderRadius: 8,
                border: "none",
                backgroundColor: colors.primary,
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              + Book New Visit
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding: 48, textAlign: "center", color: colors.muted }}>
          Loading your appointments...
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div
          style={{
            padding: 56,
            textAlign: "center",
            backgroundColor: colors.card,
            borderRadius: 14,
            border: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
          <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>No Appointments Found</h3>
          <p style={{ color: colors.muted, fontSize: 13, margin: "0 0 20px" }}>
            {activeFilter === "ALL"
              ? "You haven't scheduled any doctor appointments yet."
              : `No appointments with status "${activeFilter}".`}
          </p>
          {onBookNew && (
            <button
              onClick={onBookNew}
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
              Find a Doctor & Book
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {filteredAppointments.map((app) => (
            <div
              key={app.id}
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: 14,
                padding: "20px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <strong style={{ fontSize: 16 }}>{app.doctor.name}</strong>
                  <span style={{ fontSize: 13, color: colors.muted }}>
                    ({app.doctor.specialization})
                  </span>
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
                    {app.visit_type === "HOME" ? "🏠 Home Visit" : "🏥 In-Clinic"}
                  </span>
                </div>

                <div style={{ fontSize: 13, color: colors.muted, display: "grid", gap: 3 }}>
                  <div>
                    📅 <strong>{app.appointment_date}</strong> &nbsp;|&nbsp; 🕒 {app.start_time} - {app.end_time} &nbsp;|&nbsp; 🏥 {app.organization.name}
                  </div>
                  <div>
                    Reason: <em>{app.reason_for_visit}</em> &nbsp;|&nbsp; Fee: ₹{app.doctor.consultation_fee}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setSelectedAppointment(app)}
                  style={{
                    padding: "9px 16px",
                    borderRadius: 8,
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.cardSubtle,
                    color: colors.text,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  View Details
                </button>

                {(app.status === "PENDING" || app.status === "CONFIRMED") && (
                  <button
                    disabled={cancellingId === app.id}
                    onClick={() => handleCancelAppointment(app.id)}
                    style={{
                      padding: "9px 16px",
                      borderRadius: 8,
                      border: `1px solid ${colors.border}`,
                      backgroundColor: "transparent",
                      color: colors.coral,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {cancellingId === app.id ? "Cancelling..." : "Cancel"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedAppointment && (
        <AppointmentDetails
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onCancel={handleCancelAppointment}
          cancelling={cancellingId === selectedAppointment.id}
          colors={colors}
        />
      )}
    </div>
  );
}
