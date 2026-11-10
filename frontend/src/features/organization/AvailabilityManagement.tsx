import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const API_URL = "http://127.0.0.1:8000/api";

type ThemeColors = {
  card: string;
  border: string;
  text: string;
  muted: string;
  primary: string;
  sidebar: string;
  active: string;
};

interface Props {
  organizationId: number;
  colors: ThemeColors;
}

interface Doctor {
  id: number;
  name: string;
  specialization: string;
  is_verified: boolean;
  is_active: boolean;
}

interface AvailabilitySchedule {
  id: number;
  doctor_id: number;
  doctor_name: string;
  weekday: number;
  weekday_name: string;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_active: boolean;
}

interface ScheduleForm {
  doctor_id: string;
  weekday: string;
  start_time: string;
  end_time: string;
  slot_duration_minutes: string;
}

const weekdays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const emptyForm: ScheduleForm = {
  doctor_id: "",
  weekday: "0",
  start_time: "09:00",
  end_time: "13:00",
  slot_duration_minutes: "15",
};

export default function AvailabilityManagement({
  organizationId,
  colors,
}: Props) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [schedules, setSchedules] = useState<AvailabilitySchedule[]>([]);
  const [form, setForm] = useState<ScheduleForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const getToken = async () => {
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !data.session?.access_token) {
      throw new Error("Your session has expired. Please log in again.");
    }
    return data.session.access_token;
  };

  const api = async (path: string, options: RequestInit = {}) => {
    const token = await getToken();
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || result.message || "Request failed.");
    }
    return result;
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [doctorResult, availabilityResult] = await Promise.all([
        api(`/organization/${organizationId}/doctors/`),
        api(`/organization/${organizationId}/availability/`),
      ]);

      setDoctors(
        (doctorResult.doctors || []).filter(
          (doctor: Doctor) => doctor.is_verified && doctor.is_active
        )
      );
      setSchedules(availabilityResult.schedules || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load availability."
      );
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const updateForm = (field: keyof ScheduleForm, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const resetForm = () => {
    setForm({
      ...emptyForm,
      doctor_id: doctors[0] ? String(doctors[0].id) : "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const openNewForm = () => {
    setForm({
      ...emptyForm,
      doctor_id: doctors[0] ? String(doctors[0].id) : "",
    });
    setEditingId(null);
    setError("");
    setMessage("");
    setShowForm(true);
  };

  const startEdit = (schedule: AvailabilitySchedule) => {
    setEditingId(schedule.id);
    setForm({
      doctor_id: String(schedule.doctor_id),
      weekday: String(schedule.weekday),
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      slot_duration_minutes: String(schedule.slot_duration_minutes),
    });
    setError("");
    setMessage("");
    setShowForm(true);
  };

  const saveSchedule = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.doctor_id) {
      setError("Select a verified and active doctor.");
      return;
    }
    if (form.end_time <= form.start_time) {
      setError("End time must be later than start time.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        doctor_id: Number(form.doctor_id),
        weekday: Number(form.weekday),
        start_time: form.start_time,
        end_time: form.end_time,
        slot_duration_minutes: Number(form.slot_duration_minutes),
      };

      const path = editingId === null
        ? `/organization/${organizationId}/availability/`
        : `/organization/${organizationId}/availability/${editingId}/`;

      await api(path, {
        method: editingId === null ? "POST" : "PATCH",
        body: JSON.stringify(payload),
      });

      setMessage(
        editingId === null
          ? "Availability schedule created successfully."
          : "Availability schedule updated successfully."
      );
      setShowForm(false);
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save availability."
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleSchedule = async (schedule: AvailabilitySchedule) => {
    const action = schedule.is_active ? "deactivate" : "activate";
    if (
      !window.confirm(
        `Are you sure you want to ${action} ${schedule.weekday_name} availability for ${schedule.doctor_name}?`
      )
    ) {
      return;
    }

    setError("");
    setMessage("");
    try {
      await api(
        `/organization/${organizationId}/availability/${schedule.id}/`,
        {
          method: "PATCH",
          body: JSON.stringify({ is_active: !schedule.is_active }),
        }
      );
      setMessage(`Availability schedule ${action}d successfully.`);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update availability."
      );
    }
  };

  const deactivateSchedule = async (schedule: AvailabilitySchedule) => {
    if (
      !window.confirm(
        `Deactivate this ${schedule.weekday_name} schedule for ${schedule.doctor_name}?`
      )
    ) {
      return;
    }

    setError("");
    setMessage("");
    try {
      await api(
        `/organization/${organizationId}/availability/${schedule.id}/`,
        { method: "DELETE" }
      );
      setMessage("Availability schedule deactivated successfully.");
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to deactivate schedule."
      );
    }
  };

  const activeCount = schedules.filter((schedule) => schedule.is_active).length;

  const labelStyle: React.CSSProperties = {
    display: "block",
    color: colors.muted,
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 7,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    border: `1px solid ${colors.border}`,
    borderRadius: 9,
    background: colors.card,
    color: colors.text,
    fontSize: 14,
  };

  const secondaryButton: React.CSSProperties = {
    padding: "9px 12px",
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    background: colors.sidebar,
    color: colors.text,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 12,
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 15,
          marginBottom: 24,
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
            Doctor Availability
          </h1>
          <p style={{ color: colors.muted, margin: 0 }}>
            Set weekly working hours and consultation slot durations.
          </p>
        </div>
        <div style={{ display: "flex", gap: 9 }}>
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            style={secondaryButton}
          >
            ↻ Refresh
          </button>
          <button
            type="button"
            onClick={openNewForm}
            disabled={doctors.length === 0}
            style={{
              ...secondaryButton,
              background: colors.primary,
              color: "#ffffff",
              borderColor: colors.primary,
              opacity: doctors.length === 0 ? 0.55 : 1,
            }}
          >
            + Add Schedule
          </button>
        </div>
      </div>

      {message && (
        <div
          style={{
            padding: 13,
            borderRadius: 9,
            marginBottom: 16,
            background: "#e5f7ed",
            color: "#187744",
          }}
        >
          {message}
        </div>
      )}
      {error && (
        <div
          style={{
            padding: 13,
            borderRadius: 9,
            marginBottom: 16,
            background: "#fff0ef",
            color: "#b42318",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 13,
          marginBottom: 22,
        }}
      >
        {[
          { label: "Total schedules", value: schedules.length },
          { label: "Active schedules", value: activeCount },
          { label: "Verified active doctors", value: doctors.length },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              background: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              padding: 18,
            }}
          >
            <div style={{ color: colors.muted, fontSize: 12 }}>{item.label}</div>
            <div style={{ fontSize: 27, fontWeight: 800, marginTop: 8 }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <form
          onSubmit={saveSchedule}
          style={{
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: 14,
            padding: 22,
            marginBottom: 22,
          }}
        >
          <h2 style={{ margin: "0 0 17px", fontSize: 19 }}>
            {editingId === null ? "Add Availability Schedule" : "Edit Availability"}
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: 15,
            }}
          >
            <div>
              <label style={labelStyle}>Doctor *</label>
              <select
                value={form.doctor_id}
                onChange={(event) => updateForm("doctor_id", event.target.value)}
                required
                disabled={editingId !== null}
                style={inputStyle}
              >
                <option value="">Select doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name} — {doctor.specialization}
                  </option>
                ))}
                {editingId !== null &&
                  !doctors.some((doctor) => doctor.id === Number(form.doctor_id)) && (
                    <option value={form.doctor_id}>
                      {schedules.find((item) => item.id === editingId)?.doctor_name ||
                        "Selected doctor"}
                    </option>
                  )}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Weekday *</label>
              <select
                value={form.weekday}
                onChange={(event) => updateForm("weekday", event.target.value)}
                style={inputStyle}
              >
                {weekdays.map((day, index) => (
                  <option key={day} value={index}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Start time *</label>
              <input
                type="time"
                value={form.start_time}
                onChange={(event) => updateForm("start_time", event.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>End time *</label>
              <input
                type="time"
                value={form.end_time}
                onChange={(event) => updateForm("end_time", event.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Consultation duration *</label>
              <select
                value={form.slot_duration_minutes}
                onChange={(event) =>
                  updateForm("slot_duration_minutes", event.target.value)
                }
                style={inputStyle}
              >
                <option value="15">15 minutes (Default)</option>
                <option value="30">30 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>
          </div>

          <p style={{ color: colors.muted, fontSize: 12, margin: "12px 0 0" }}>
            The default consultation duration is 15 minutes. The selected duration
            determines how many patient booking slots are generated.
          </p>

          <div style={{ display: "flex", gap: 10, marginTop: 19 }}>
            <button
              type="submit"
              disabled={saving || doctors.length === 0}
              style={{
                ...secondaryButton,
                background: colors.primary,
                color: "#ffffff",
                borderColor: colors.primary,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Saving..." : editingId === null ? "Create Schedule" : "Save Changes"}
            </button>
            <button type="button" onClick={resetForm} style={secondaryButton}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div
          style={{
            background: colors.card,
            borderRadius: 13,
            padding: 40,
            textAlign: "center",
            color: colors.muted,
          }}
        >
          Loading availability schedules...
        </div>
      ) : doctors.length === 0 ? (
        <div
          style={{
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: 13,
            padding: 35,
            textAlign: "center",
          }}
        >
          <h3>No verified active doctors found</h3>
          <p style={{ color: colors.muted }}>
            Add and verify a doctor in the Doctors section before configuring availability.
          </p>
        </div>
      ) : schedules.length === 0 ? (
        <div
          style={{
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: 13,
            padding: 35,
            textAlign: "center",
          }}
        >
          <h3>No availability schedules yet</h3>
          <p style={{ color: colors.muted }}>
            Add a weekly schedule so patients can see appointment slots.
          </p>
          <button onClick={openNewForm} style={secondaryButton}>
            + Add First Schedule
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
            gap: 14,
          }}
        >
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              style={{
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: 13,
                padding: 19,
                opacity: schedule.is_active ? 1 : 0.72,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 12, color: colors.muted }}>
                  {schedule.weekday_name}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "5px 8px",
                    borderRadius: 20,
                    background: schedule.is_active ? "#e1f7e9" : "#f1eeee",
                    color: schedule.is_active ? "#187744" : "#777777",
                  }}
                >
                  {schedule.is_active ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
              <h3 style={{ margin: "12px 0 5px", fontSize: 17 }}>
                {schedule.doctor_name}
              </h3>
              <div style={{ fontSize: 20, fontWeight: 800, marginTop: 12 }}>
                {schedule.start_time} – {schedule.end_time}
              </div>
              <p style={{ color: colors.muted, fontSize: 13, margin: "7px 0 16px" }}>
                {schedule.slot_duration_minutes}-minute consultations
              </p>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  borderTop: `1px solid ${colors.border}`,
                  paddingTop: 14,
                }}
              >
                <button onClick={() => startEdit(schedule)} style={secondaryButton}>
                  ✎ Edit
                </button>
                <button
                  onClick={() => void toggleSchedule(schedule)}
                  style={{
                    ...secondaryButton,
                    color: schedule.is_active ? "#bd3c35" : "#187744",
                  }}
                >
                  {schedule.is_active ? "Deactivate" : "Activate"}
                </button>
                {schedule.is_active && (
                  <button
                    onClick={() => void deactivateSchedule(schedule)}
                    style={{ ...secondaryButton, color: "#bd3c35" }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
