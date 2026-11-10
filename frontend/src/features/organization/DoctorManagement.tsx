
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const API_URL = "http://127.0.0.1:8000/api";

interface Doctor {
  id: number;
  user_id: number;
  name: string;
  email: string;
  phone_number: string;
  specialization: string;
  qualification: string;
  license_number: string;
  experience_years: number;
  consultation_fee: string;
  bio: string;
  is_verified: boolean;
  is_active: boolean;
  departments: { id: number; name: string }[];
}

interface Department {
  id: number;
  name: string;
  is_active: boolean;
}

interface ActivationLinkResponse {
  message: string;
  doctor_id: number;
  email: string;
  activation_link: string;
  activation_instructions: string;
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

const emptyForm = {
  full_name: "",
  email: "",
  phone_number: "",
  specialization: "",
  qualification: "",
  license_number: "",
  experience_years: "0",
  consultation_fee: "0",
  bio: "",
  department_ids: [] as number[],
};

export default function DoctorManagement({
  organizationId,
  colors,
}: Props) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  // Activation links are kept only in component state and are not persisted.
  const [activationLinks, setActivationLinks] = useState<Record<number, string>>({});
  const [activationLoadingId, setActivationLoadingId] = useState<number | null>(null);
  const [copyingDoctorId, setCopyingDoctorId] = useState<number | null>(null);

  const getToken = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) {
      throw new Error("Session expired. Please log in again.");
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
      const [doctorResult, departmentResult] = await Promise.all([
        api(`/organization/${organizationId}/doctors/`),
        api(`/organization/${organizationId}/departments/`),
      ]);
      setDoctors(doctorResult.doctors || []);
      setDepartments(
        (departmentResult.departments || []).filter(
          (d: Department) => d.is_active
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load data.");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const updateField = (field: string, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const toggleDepartment = (id: number) => {
    setForm((previous) => ({
      ...previous,
      department_ids: previous.department_ids.includes(id)
        ? previous.department_ids.filter((item) => item !== id)
        : [...previous.department_ids, id],
    }));
  };

  const saveDoctor = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (editingId === null) {
        if (form.department_ids.length === 0) {
          throw new Error("Assign at least one department.");
        }

        const result = await api(`/organization/${organizationId}/doctors/`, {
          method: "POST",
          body: JSON.stringify({
            full_name: form.full_name,
            email: form.email,
            phone_number: form.phone_number,
            specialization: form.specialization,
            qualification: form.qualification,
            license_number: form.license_number,
            experience_years: Number(form.experience_years),
            consultation_fee: form.consultation_fee,
            bio: form.bio,
            department_ids: form.department_ids,
          }),
        });

        // The activation link is deliberately not displayed in the UI.
        if (result.activation_link) {
          setMessage(
            "Doctor created. Retrieve the activation link securely from the backend response and share it privately."
          );
        } else {
          setMessage(result.message || "Doctor added successfully.");
        }
      } else {
        await api(
          `/organization/${organizationId}/doctors/${editingId}/`,
          {
            method: "PATCH",
            body: JSON.stringify({
              full_name: form.full_name,
              phone_number: form.phone_number,
              specialization: form.specialization,
              qualification: form.qualification,
              license_number: form.license_number,
              experience_years: Number(form.experience_years),
              consultation_fee: form.consultation_fee,
              bio: form.bio,
            }),
          }
        );

        setMessage("Doctor profile updated successfully.");

        const original = doctors.find((d) => d.id === editingId);
        const oldIds = (original?.departments || []).map((d) => d.id);
        const newIds = form.department_ids;

        if (
          oldIds.length !== newIds.length ||
          oldIds.some((id) => !newIds.includes(id))
        ) {
          await api(
            `/organization/${organizationId}/doctors/${editingId}/departments/`,
            {
              method: "POST",
              body: JSON.stringify({ department_ids: newIds }),
            }
          );

          for (const oldId of oldIds) {
            if (!newIds.includes(oldId)) {
              await api(
                `/organization/${organizationId}/doctors/${editingId}/departments/${oldId}/`,
                { method: "DELETE" }
              );
            }
          }
        }
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save doctor.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (doctor: Doctor) => {
    setEditingId(doctor.id);
    setForm({
      full_name: doctor.name,
      email: doctor.email,
      phone_number: doctor.phone_number,
      specialization: doctor.specialization,
      qualification: doctor.qualification,
      license_number: doctor.license_number,
      experience_years: String(doctor.experience_years),
      consultation_fee: String(doctor.consultation_fee),
      bio: doctor.bio || "",
      department_ids: doctor.departments.map((d) => d.id),
    });
    setShowForm(true);
    setError("");
    setMessage("");
  };

  const toggleStatus = async (doctor: Doctor) => {
    const action = doctor.is_active ? "deactivate" : "reactivate";
    if (!window.confirm(`Are you sure you want to ${action} ${doctor.name}?`)) {
      return;
    }

    setError("");
    setMessage("");
    try {
      await api(
        `/organization/${organizationId}/doctors/${doctor.id}/status/`,
        {
          method: "PATCH",
          body: JSON.stringify({ is_active: !doctor.is_active }),
        }
      );
      setMessage(`Doctor ${action}d successfully.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update doctor.");
    }
  };

  const generateActivationLink = async (doctor: Doctor) => {
    setError("");
    setMessage("");
    setActivationLoadingId(doctor.id);

    try {
      const result = (await api(
        `/organization/${organizationId}/doctors/${doctor.id}/activation-link/`,
        { method: "POST" }
      )) as ActivationLinkResponse;

      if (!result.activation_link) {
        throw new Error("The server did not return an activation link.");
      }

      setActivationLinks((previous) => ({
        ...previous,
        [doctor.id]: result.activation_link,
      }));
      setMessage(`A fresh activation link was generated for ${doctor.name}. Share it privately.`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate the doctor's activation link."
      );
    } finally {
      setActivationLoadingId(null);
    }
  };

  const copyActivationLink = async (doctor: Doctor) => {
    const link = activationLinks[doctor.id];
    if (!link) return;

    setError("");
    setMessage("");

    try {
      await navigator.clipboard.writeText(link);
      setMessage(`Activation link for ${doctor.name} copied. Share it privately.`);
    } catch {
      setError(
        "Clipboard access was blocked by your browser. Select and copy the activation link manually."
      );
    }
  };

  const filtered = doctors.filter((doctor) =>
    `${doctor.name} ${doctor.email} ${doctor.specialization}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    marginTop: 6,
    marginBottom: 14,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    background: colors.card,
    color: colors.text,
    fontSize: 14,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 700,
    color: colors.muted,
  };

  const buttonStyle: React.CSSProperties = {
    padding: "10px 14px",
    border: "none",
    borderRadius: 8,
    background: colors.primary,
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
  };

  return (
    <section>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 15,
          marginBottom: 22,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>Doctor Management</h1>
          <p style={{ color: colors.muted }}>
            Manage doctors, profiles and department assignments.
          </p>
        </div>
        <button
          style={buttonStyle}
          onClick={() => {
            resetForm();
            setShowForm(true);
            setError("");
            setMessage("");
          }}
        >
          + Add Doctor
        </button>
      </div>

      {message && (
        <div
          style={{
            padding: 13,
            borderRadius: 8,
            background: "#e5f7ed",
            color: "#187744",
            marginBottom: 16,
          }}
        >
          {message}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: 13,
            borderRadius: 8,
            background: "#fff0ef",
            color: "#b42318",
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={saveDoctor}
          style={{
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: 13,
            padding: 22,
            marginBottom: 24,
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            {editingId ? "Edit Doctor" : "Add New Doctor"}
          </h2>

          {(
            [
              ["full_name", "Full Name", true],
              ["email", "Email Address", editingId === null],
              ["phone_number", "Phone Number", true],
              ["specialization", "Specialization", true],
              ["qualification", "Qualification", true],
              ["license_number", "Medical License Number", true],
              ["experience_years", "Experience (Years)", true],
              ["consultation_fee", "Consultation Fee", true],
            ] as [keyof typeof emptyForm, string, boolean][]
          ).map(([field, label, required]) => (
            <label key={field} style={labelStyle}>
              {label}
              <input
                style={inputStyle}
                type={
                  field === "email"
                    ? "email"
                    : field === "experience_years" ||
                      field === "consultation_fee"
                    ? "number"
                    : "text"
                }
                min={
                  field === "experience_years" ||
                  field === "consultation_fee"
                    ? 0
                    : undefined
                }
                step={field === "consultation_fee" ? "0.01" : "1"}
                required={required}
                disabled={field === "email" && editingId !== null}
                value={String(form[field])}
                onChange={(e) => updateField(field, e.target.value)}
              />
            </label>
          ))}

          <label style={labelStyle}>
            Professional Bio
            <textarea
              style={{ ...inputStyle, resize: "vertical" }}
              rows={3}
              value={form.bio}
              onChange={(e) => updateField("bio", e.target.value)}
            />
          </label>

          <div style={{ margin: "10px 0 18px" }}>
            <strong>Department Assignments</strong>
            {departments.length === 0 ? (
              <p style={{ color: colors.muted }}>
                Create an active department before assigning doctors.
              </p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 12 }}>
                {departments.map((department) => (
                  <label
                    key={department.id}
                    style={{
                      display: "flex",
                      gap: 7,
                      alignItems: "center",
                      padding: "9px 12px",
                      border: `1px solid ${colors.border}`,
                      borderRadius: 8,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.department_ids.includes(department.id)}
                      onChange={() => toggleDepartment(department.id)}
                    />
                    {department.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button disabled={saving} type="submit" style={buttonStyle}>
              {saving ? "Saving..." : editingId ? "Save Changes" : "Create Doctor"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              style={{
                ...buttonStyle,
                background: colors.sidebar,
                color: colors.text,
                border: `1px solid ${colors.border}`,
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <input
        placeholder="Search doctors by name, email or specialization..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={inputStyle}
      />

      {loading ? (
        <p style={{ color: colors.muted }}>Loading doctors...</p>
      ) : filtered.length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
          }}
        >
          <h3>No doctors found</h3>
          <p style={{ color: colors.muted }}>
            Add your first doctor or change your search.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
            gap: 16,
          }}
        >
          {filtered.map((doctor) => (
            <article
              key={doctor.id}
              style={{
                padding: 20,
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: 13,
                opacity: doctor.is_active ? 1 : 0.7,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <h3 style={{ margin: 0 }}>{doctor.name}</h3>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: doctor.is_active ? "#187744" : "#bd3c35",
                  }}
                >
                  {doctor.is_active ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>

              <p style={{ color: colors.primary, fontWeight: 700 }}>
                {doctor.specialization}
              </p>
              <p style={{ color: colors.muted, fontSize: 13 }}>
                {doctor.qualification}
              </p>
              <p style={{ fontSize: 13 }}>{doctor.email}</p>
              <p style={{ fontSize: 13 }}>{doctor.phone_number}</p>
              <p style={{ fontSize: 13 }}>
                Experience: {doctor.experience_years} years
              </p>
              <p style={{ fontSize: 13 }}>
                Consultation fee: ₹{doctor.consultation_fee}
              </p>
              <div style={{ margin: "12px 0", display: "flex", flexWrap: "wrap", gap: 6 }}>
                {doctor.departments.map((department) => (
                  <span
                    key={department.id}
                    style={{
                      padding: "5px 8px",
                      background: colors.active,
                      color: colors.primary,
                      borderRadius: 15,
                      fontSize: 11,
                    }}
                  >
                    {department.name}
                  </span>
                ))}
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  style={buttonStyle}
                  onClick={() => startEdit(doctor)}
                >
                  Edit
                </button>
                <button
                  style={{
                    ...buttonStyle,
                    background: doctor.is_active ? "#bd3c35" : "#187744",
                  }}
                  onClick={() => void toggleStatus(doctor)}
                >
                  {doctor.is_active ? "Deactivate" : "Reactivate"}
                </button>
                <button
                  style={{
                    ...buttonStyle,
                    background: "#315f91",
                    opacity: activationLoadingId === doctor.id ? 0.7 : 1,
                  }}
                  disabled={activationLoadingId !== null}
                  onClick={() => void generateActivationLink(doctor)}
                >
                  {activationLoadingId === doctor.id
                    ? "Generating..."
                    : "Generate Activation Link"}
                </button>
              </div>

              {activationLinks[doctor.id] && (
                <div
                  style={{
                    marginTop: 15,
                    padding: 12,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 9,
                    background: colors.sidebar,
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      color: colors.muted,
                      fontSize: 12,
                      fontWeight: 700,
                      marginBottom: 7,
                    }}
                  >
                    Fresh activation link — share privately
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={activationLinks[doctor.id]}
                    onFocus={(event) => event.currentTarget.select()}
                    style={{
                      ...inputStyle,
                      marginBottom: 9,
                      fontSize: 12,
                    }}
                    aria-label={`Activation link for ${doctor.name}`}
                  />
                  <button
                    type="button"
                    style={{
                      ...buttonStyle,
                      background: "#187744",
                    }}
                    disabled={copyingDoctorId === doctor.id}
                    onClick={async () => {
                      setCopyingDoctorId(doctor.id);
                      try {
                        await copyActivationLink(doctor);
                      } finally {
                        setCopyingDoctorId(null);
                      }
                    }}
                  >
                    {copyingDoctorId === doctor.id ? "Copying..." : "Copy Link"}
                  </button>
                  <p style={{ color: colors.muted, fontSize: 11, marginBottom: 0 }}>
                    This is a sensitive, time-limited recovery link. Share it only with this doctor.
                  </p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
