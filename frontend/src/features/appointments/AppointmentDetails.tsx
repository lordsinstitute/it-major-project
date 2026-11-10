export interface AppointmentDetailData {
  id: number;
  doctor: {
    id: number;
    name: string;
    specialization: string;
    qualification?: string;
    consultation_fee: string;
  };
  organization: {
    id: number;
    name: string;
    type: string;
    city: string;
    address: string;
  };
  appointment_date: string;
  start_time: string;
  end_time: string;
  visit_type: "HOSPITAL" | "HOME";
  patient_name: string;
  patient_age: number;
  patient_gender: string;
  patient_phone: string;
  reason_for_visit: string;
  existing_conditions?: string;
  home_address?: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "REJECTED";
  created_at?: string;
}

interface AppointmentDetailsProps {
  appointment: AppointmentDetailData | null;
  onClose: () => void;
  onCancel?: (appointmentId: number) => void;
  cancelling?: boolean;
  colors: {
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

export default function AppointmentDetails({
  appointment,
  onClose,
  onCancel,
  cancelling = false,
  colors,
}: AppointmentDetailsProps) {
  if (!appointment) return null;

  const canCancel =
    appointment.status === "PENDING" || appointment.status === "CONFIRMED";

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.65)",
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
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
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            borderBottom: `1px solid ${colors.border}`,
            paddingBottom: 14,
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
              Appointment #{appointment.id}
            </h3>
            <span style={{ fontSize: 12, color: colors.muted }}>
              Booked with {appointment.doctor.name}
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 22,
              cursor: "pointer",
              color: colors.muted,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: "grid", gap: 14, fontSize: 14 }}>
          {/* Status Badge */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: colors.muted }}>Status:</span>
            <span
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 800,
                backgroundColor:
                  appointment.status === "CONFIRMED"
                    ? colors.mint
                    : appointment.status === "PENDING"
                    ? colors.coralSubtle
                    : appointment.status === "COMPLETED"
                    ? "#e0f2fe"
                    : colors.cardSubtle,
                color:
                  appointment.status === "CONFIRMED"
                    ? colors.mintText
                    : appointment.status === "PENDING"
                    ? colors.coral
                    : appointment.status === "COMPLETED"
                    ? "#0369a1"
                    : colors.muted,
              }}
            >
              ● {appointment.status}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: colors.muted }}>Doctor:</span>
            <strong>{appointment.doctor.name} ({appointment.doctor.specialization})</strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: colors.muted }}>Hospital / Clinic:</span>
            <span>
              {appointment.organization.name} · {appointment.organization.city}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: colors.muted }}>Date & Time:</span>
            <strong>
              📅 {appointment.appointment_date} ({appointment.start_time} - {appointment.end_time})
            </strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: colors.muted }}>Consultation Type:</span>
            <span>
              {appointment.visit_type === "HOME" ? "🏠 Home Visit" : "🏥 In-Clinic Visit"}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: colors.muted }}>Consultation Fee:</span>
            <strong>₹ {appointment.doctor.consultation_fee}</strong>
          </div>

          {appointment.visit_type === "HOME" && appointment.home_address && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: colors.muted }}>Home Address:</span>
              <span>{appointment.home_address}</span>
            </div>
          )}

          <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 12 }}>
            <div style={{ color: colors.muted, marginBottom: 4 }}>Reason for Consultation:</div>
            <div style={{ padding: 12, backgroundColor: colors.cardSubtle, borderRadius: 8 }}>
              {appointment.reason_for_visit}
            </div>
          </div>

          {appointment.existing_conditions && (
            <div>
              <div style={{ color: colors.muted, marginBottom: 4 }}>Medical History / Notes:</div>
              <div style={{ padding: 12, backgroundColor: colors.cardSubtle, borderRadius: 8 }}>
                {appointment.existing_conditions}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            marginTop: 26,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: `1px solid ${colors.border}`,
            paddingTop: 16,
          }}
        >
          {canCancel && onCancel ? (
            <button
              disabled={cancelling}
              onClick={() => onCancel(appointment.id)}
              style={{
                padding: "10px 18px",
                borderRadius: 8,
                border: `1px solid ${colors.coral}`,
                backgroundColor: colors.coralSubtle,
                color: colors.coral,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {cancelling ? "Cancelling..." : "Cancel Appointment"}
            </button>
          ) : (
            <span style={{ fontSize: 12, color: colors.muted }}>
              {appointment.status === "COMPLETED"
                ? "This consultation was completed."
                : "Appointment is closed."}
            </span>
          )}

          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.cardSubtle,
              color: colors.text,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
