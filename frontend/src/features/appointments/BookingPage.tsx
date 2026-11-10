import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { Doctor } from "../../LandingPage";
import "./BookingPage.css";

type Theme = "light" | "dark";
type VisitType = "HOSPITAL" | "HOME";

type AvailableSlot = {
  start_time: string;
  end_time: string;
  status: "AVAILABLE" | "BOOKED" | "PAST";
  is_available: boolean;
};
type BookingPageProps = {
  doctor: Doctor;
  theme: Theme;
  onToggleTheme: () => void;
  onBack: () => void;
  onBookingSuccess: () => void;
};

const API_URL = "http://127.0.0.1:8000/api";

function getTodayLocalDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTime(value: string) {
  const [hourText, minute] = value.split(":");
  const hour = Number(hourText);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${suffix}`;
}

export default function BookingPage({
  doctor,
  theme,
  onToggleTheme,
  onBack,
  onBookingSuccess,
}: BookingPageProps) {
  const organizations = doctor.organizations || [];

  const [organizationId, setOrganizationId] = useState(
    organizations.length === 1 ? String(organizations[0].id) : ""
  );
  const [appointmentDate, setAppointmentDate] = useState("");
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [visitType, setVisitType] = useState<VisitType>("HOSPITAL");

  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [reason, setReason] = useState("");
  const [existingConditions, setExistingConditions] = useState("");
  const [homeAddress, setHomeAddress] = useState("");

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedOrganization = useMemo(
    () => organizations.find((org) => String(org.id) === organizationId),
    [organizations, organizationId]
  );

  useEffect(() => {
    setSlots([]);
    setSelectedSlot("");
    setError("");
    setSuccess("");

    if (!organizationId || !appointmentDate) return;

    let active = true;

    async function loadSlots() {
      setLoadingSlots(true);
      try {
        const params = new URLSearchParams({
          doctor_id: String(doctor.id),
          organization_id: organizationId,
          date: appointmentDate,
        });

        const response = await fetch(
          `${API_URL}/public/availability/?${params.toString()}`
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Could not load appointment slots.");
        }

        if (active) {
          setSlots(Array.isArray(result.slots) ? result.slots : []);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Could not load appointment slots."
          );
        }
      } finally {
        if (active) setLoadingSlots(false);
      }
    }

    void loadSlots();

    return () => {
      active = false;
    };
  }, [doctor.id, organizationId, appointmentDate]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!organizationId) {
      setError("Please select a hospital or clinic.");
      return;
    }
    if (!appointmentDate || !selectedSlot) {
      setError("Please select an appointment date and time.");
      return;
    }
    if (visitType === "HOME" && !homeAddress.trim()) {
      setError("Please enter the complete home visit address.");
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session?.access_token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const response = await fetch(`${API_URL}/appointments/book/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctor_id: doctor.id,
          organization_id: Number(organizationId),
          appointment_date: appointmentDate,
          start_time: selectedSlot,
          visit_type: visitType,
          patient_name: patientName.trim(),
          patient_age: Number(patientAge),
          patient_gender: patientGender,
          patient_phone: patientPhone.trim(),
          reason_for_visit: reason.trim(),
          existing_conditions: existingConditions.trim(),
          home_address: visitType === "HOME" ? homeAddress.trim() : "",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setSelectedSlot("");
          throw new Error(
            "Sorry! This slot has just been booked. Please select another time."
          );
        }
        throw new Error(result.error || "Could not submit your appointment.");
      }

      setSuccess("Your appointment request has been submitted and is pending doctor approval.");
      window.setTimeout(() => onBookingSuccess(), 1400);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={`booking-page ${theme}`}>
      <header className="booking-header">
        <button type="button" className="booking-back" onClick={onBack}>
          ← Back
        </button>
        <button type="button" className="booking-brand" onClick={onBack}>
          <span className="booking-logo">M</span>
          <span>Mediqo<span className="booking-period">.</span></span>
        </button>
        <button type="button" className="booking-theme" onClick={onToggleTheme}>
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
      </header>

      <div className="booking-container">
        <div className="booking-heading">
          <span className="booking-eyebrow">YOUR HEALTHCARE JOURNEY</span>
          <h1>Book an appointment</h1>
          <p>Choose your preferred hospital, date and available time.</p>
        </div>

        <section className="booking-doctor-card">
          <div className="booking-doctor-avatar">
            {doctor.name?.trim().charAt(0).toUpperCase() || "D"}
          </div>
          <div className="booking-doctor-info">
            <span className="booking-label">APPOINTMENT WITH</span>
            <h2>{doctor.name}</h2>
            <p>{doctor.specialization} · {doctor.qualification}</p>
            <p>{doctor.experience_years} years experience</p>
          </div>
          <div className="booking-fee">
            <span>Consultation fee</span>
            <strong>₹{doctor.consultation_fee}</strong>
          </div>
        </section>

        {organizations.length === 0 ? (
          <div className="booking-alert error">
            This doctor is not currently linked to an approved hospital or clinic, so an appointment cannot be booked.
          </div>
        ) : (
          <form className="booking-form" onSubmit={handleSubmit}>
            <section className="booking-section">
              <div className="booking-section-title">
                <span>01</span>
                <div>
                  <h2>Choose your healthcare provider</h2>
                  <p>Select the hospital or clinic for your appointment.</p>
                </div>
              </div>

              <label className="booking-field">
                <span>Hospital / Clinic <b>*</b></span>
                <select
                  value={organizationId}
                  onChange={(event) => setOrganizationId(event.target.value)}
                  required
                >
                  <option value="">Select a hospital or clinic</option>
                  {organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name} — {organization.city}, {organization.state}
                    </option>
                  ))}
                </select>
              </label>

              {selectedOrganization && (
                <div className="booking-provider-note">
                  <span>📍</span>
                  <div>
                    <strong>{selectedOrganization.name}</strong>
                    <small>{selectedOrganization.city}, {selectedOrganization.state}</small>
                  </div>
                </div>
              )}
            </section>

            <section className="booking-section">
              <div className="booking-section-title">
                <span>02</span>
                <div>
                  <h2>Select date and time</h2>
                  <p>Choose an available appointment slot.</p>
                </div>
              </div>

              <label className="booking-field booking-date-field">
                <span>Appointment date <b>*</b></span>
                <input
                  type="date"
                  min={getTodayLocalDate()}
                  value={appointmentDate}
                  onChange={(event) => {
                    setAppointmentDate(event.target.value);
                    setSelectedSlot("");
                  }}
                  required
                />
              </label>

              {appointmentDate && organizationId && (
                <div className="booking-slots-area">
                  <div className="booking-slots-heading">
                    <strong>Available time slots</strong>
                    {loadingSlots && <span>Loading slots...</span>}
                  </div>

                  {!loadingSlots && slots.length === 0 && (
                    <p className="booking-empty-slots">
                      No slots are scheduled for this date. Please try another date.
                    </p>
                  )}

                  {slots.length > 0 && (
                    <div className="booking-slot-legend" aria-label="Slot status legend">
                      <span><i className="available-dot" /> Available</span>
                      <span><i className="booked-dot" /> Booked</span>
                      <span><i className="past-dot" /> Past</span>
                    </div>
                  )}

                  <div className="booking-slot-grid">
                    {slots.map((slot) => (
                      <button
                        key={`${slot.start_time}-${slot.end_time}`}
                        type="button"
                        disabled={!slot.is_available}
                        aria-label={`${formatTime(slot.start_time)} to ${formatTime(slot.end_time)} — ${slot.status.toLowerCase()}`}
                        className={`booking-slot ${slot.status.toLowerCase()} ${
                          selectedSlot === slot.start_time ? "selected" : ""
                        }`}
                        onClick={() => setSelectedSlot(slot.start_time)}
                      >
                        <span>{formatTime(slot.start_time)}</span>
                        <small>{slot.status === "AVAILABLE" ? "Available" : slot.status === "BOOKED" ? "Booked" : "Past"}</small>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="booking-section">
              <div className="booking-section-title">
                <span>03</span>
                <div>
                  <h2>Visit preference</h2>
                  <p>Where would you like to meet the doctor?</p>
                </div>
              </div>

              <div className="booking-visit-options">
                <button
                  type="button"
                  className={`booking-visit-option ${visitType === "HOSPITAL" ? "selected" : ""}`}
                  onClick={() => setVisitType("HOSPITAL")}
                >
                  <span className="booking-visit-icon">🏥</span>
                  <span><strong>Hospital visit</strong><small>Visit the selected provider</small></span>
                  <span className="booking-radio">{visitType === "HOSPITAL" ? "●" : "○"}</span>
                </button>
                <button
                  type="button"
                  className={`booking-visit-option ${visitType === "HOME" ? "selected" : ""}`}
                  onClick={() => setVisitType("HOME")}
                >
                  <span className="booking-visit-icon">🏠</span>
                  <span><strong>Home visit</strong><small>Request a doctor at your address</small></span>
                  <span className="booking-radio">{visitType === "HOME" ? "●" : "○"}</span>
                </button>
              </div>

              {visitType === "HOME" && (
                <label className="booking-field booking-home-address">
                  <span>Complete home address <b>*</b></span>
                  <textarea
                    rows={3}
                    value={homeAddress}
                    onChange={(event) => setHomeAddress(event.target.value)}
                    placeholder="House/flat number, street, area, city, PIN code"
                    required
                  />
                </label>
              )}
            </section>

            <section className="booking-section">
              <div className="booking-section-title">
                <span>04</span>
                <div>
                  <h2>Patient information</h2>
                  <p>Enter the details of the person receiving care.</p>
                </div>
              </div>

              <div className="booking-fields-grid">
                <label className="booking-field">
                  <span>Full name <b>*</b></span>
                  <input value={patientName} onChange={(event) => setPatientName(event.target.value)} placeholder="Patient's full name" required />
                </label>
                <label className="booking-field">
                  <span>Age <b>*</b></span>
                  <input type="number" min="1" max="120" value={patientAge} onChange={(event) => setPatientAge(event.target.value)} placeholder="Age" required />
                </label>
                <label className="booking-field">
                  <span>Gender <b>*</b></span>
                  <select value={patientGender} onChange={(event) => setPatientGender(event.target.value)} required>
                    <option value="">Select gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>
                <label className="booking-field">
                  <span>Phone number <b>*</b></span>
                  <input type="tel" value={patientPhone} onChange={(event) => setPatientPhone(event.target.value)} placeholder="Contact number" pattern="[0-9+() -]{7,20}" required />
                </label>
              </div>

              <label className="booking-field booking-full-field">
                <span>Reason for visit <b>*</b></span>
                <textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Briefly describe why you want to consult the doctor" required />
              </label>

              <label className="booking-field booking-full-field">
                <span>Existing medical conditions <small>(optional)</small></span>
                <textarea rows={2} value={existingConditions} onChange={(event) => setExistingConditions(event.target.value)} placeholder="Mention any existing conditions, allergies or relevant history" />
              </label>
            </section>

            {error && <div className="booking-alert error" role="alert">{error}</div>}
            {success && <div className="booking-alert success" role="status">{success}</div>}

            <div className="booking-submit-row">
              <p>Your request will remain pending until the doctor responds.</p>
              <button
                type="submit"
                className="booking-submit"
                disabled={submitting || loadingSlots || !selectedSlot}
              >
                {submitting ? "Submitting..." : "Confirm appointment request →"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
