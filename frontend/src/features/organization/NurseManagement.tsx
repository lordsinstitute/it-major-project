import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const API_URL = "http://127.0.0.1:8000/api";

interface Nurse {
  id: number;
  user_id: number;
  name: string;
  email: string;
  phone_number: string;
  qualification: string;
  license_number: string;
  experience_years: number;
  is_verified: boolean;
  is_active: boolean;
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

export default function NurseManagement({ organizationId, colors }: Props) {
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [qualification, setQualification] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [experienceYears, setExperienceYears] = useState("3");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const getSessionToken = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || "";
  }, []);

  const loadNurses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = await getSessionToken();
      const res = await fetch(`${API_URL}/organization/${organizationId}/nurses/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load nurses.");
      setNurses(data.nurses || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading nurses.");
    } finally {
      setLoading(false);
    }
  }, [organizationId, getSessionToken]);

  useEffect(() => {
    void loadNurses();
  }, [loadNurses]);

  async function handleAddNurse(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const token = await getSessionToken();
      const res = await fetch(`${API_URL}/organization/${organizationId}/nurses/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          phone_number: phone.trim(),
          qualification: qualification.trim(),
          license_number: licenseNumber.trim(),
          experience_years: Number(experienceYears),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add nurse.");

      setShowAddModal(false);
      setFullName("");
      setEmail("");
      setPhone("");
      setQualification("");
      setLicenseNumber("");
      setExperienceYears("3");
      await loadNurses();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to add nurse.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(nurseId: number) {
    try {
      const token = await getSessionToken();
      const res = await fetch(
        `${API_URL}/organization/${organizationId}/nurses/${nurseId}/status/`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Status update failed.");
      }
      await loadNurses();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Status update failed.");
    }
  }

  return (
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
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
            Nursing Staff Management ({nurses.length})
          </h2>
          <p style={{ fontSize: 13, color: colors.muted, margin: "4px 0 0" }}>
            Add, assign, and verify registered clinical nurses in your healthcare facility.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: "10px 18px",
            backgroundColor: colors.primary,
            color: "#ffffff",
            border: "none",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          + Add Nurse
        </button>
      </div>

      {error && (
        <div style={{ padding: 14, backgroundColor: "#fee2e2", color: "#991b1b", borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 30, textAlign: "center", color: colors.muted }}>
          Loading nursing staff...
        </div>
      ) : nurses.length === 0 ? (
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
          No registered nurses added yet. Click &quot;+ Add Nurse&quot; to provision nursing staff.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {nurses.map((nurse) => (
            <div
              key={nurse.id}
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
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontWeight: 800, fontSize: 16 }}>{nurse.name}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 6,
                      backgroundColor: nurse.is_verified ? "#dcfce7" : "#fef3c7",
                      color: nurse.is_verified ? "#15803d" : "#b45309",
                    }}
                  >
                    {nurse.is_verified ? "✓ Verified License" : "Pending Verification"}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 6,
                      backgroundColor: nurse.is_active ? colors.active : "#f3f4f6",
                      color: nurse.is_active ? colors.primary : colors.muted,
                    }}
                  >
                    {nurse.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div style={{ fontSize: 13, color: colors.muted, marginTop: 6 }}>
                  {nurse.qualification} • License: {nurse.license_number} • {nurse.experience_years} years exp.
                </div>
                <div style={{ fontSize: 12, color: colors.muted, marginTop: 3 }}>
                  Email: {nurse.email} • Phone: {nurse.phone_number || "Not provided"}
                </div>
              </div>

              <button
                onClick={() => toggleStatus(nurse.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  backgroundColor: nurse.is_active ? "#fff1f2" : "#f0fdf4",
                  color: nurse.is_active ? "#be123c" : "#15803d",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {nurse.is_active ? "Deactivate" : "Activate"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Nurse Modal */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.55)",
            display: "grid",
            placeItems: "center",
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            style={{
              width: "min(480px, 100%)",
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 28,
              border: `1px solid ${colors.border}`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Provision Registered Nurse</h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer", color: colors.muted }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNurse} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Full Name</label>
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${colors.border}`, boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Official Email</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. s.jenkins@hospital.org"
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${colors.border}`, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Phone Number</label>
                  <input
                    required
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 555-0192"
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${colors.border}`, boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Experience (Years)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${colors.border}`, boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Nursing License Number</label>
                <input
                  required
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g. RN-LIC-88219"
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${colors.border}`, boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Qualification / Degree</label>
                <input
                  required
                  type="text"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="e.g. B.Sc. Nursing, Critical Care Certified"
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${colors.border}`, boxSizing: "border-box" }}
                />
              </div>

              {formError && (
                <div style={{ color: "#b91c1c", fontSize: 13, fontWeight: 600 }}>{formError}</div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: "10px 16px", borderRadius: 8, border: `1px solid ${colors.border}`, background: "none", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
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
                  {submitting ? "Adding..." : "Add Nurse"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
