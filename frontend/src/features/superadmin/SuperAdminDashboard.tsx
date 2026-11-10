
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

interface OrganizationApplication {
  id: number;
  organization_name: string;
  organization_type: string;
  registration_number: string;
  organization_email: string;
  organization_phone: string;
  address_line: string;
  city: string;
  state: string;
  postal_code: string;
  admin_full_name: string;
  admin_email: string;
  admin_phone: string;
  verification_document_url: string;
  status: ApplicationStatus;
  rejection_reason: string;
  created_at: string;
}

interface Props {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onLogout: () => void;
}

const API_URL = "http://127.0.0.1:8000/api";

export default function SuperAdminDashboard({
  theme,
  onToggleTheme,
  onLogout,
}: Props) {
  const [activeTab, setActiveTab] =
    useState<ApplicationStatus>("PENDING");

  const [applications, setApplications] = useState<
    OrganizationApplication[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rejectionReasons, setRejectionReasons] = useState<
    Record<number, string>
  >({});

  const isDark = theme === "dark";

  const getAccessToken = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session?.access_token) {
      throw new Error("Your session has expired. Please log in again.");
    }

    return data.session.access_token;
  }, []);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = await getAccessToken();

      const response = await fetch(
        `${API_URL}/superadmin/organizations/?status=${activeTab}`,
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
          result.error || "Unable to load organization applications."
        );
      }

      setApplications(result.applications || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading applications."
      );
    } finally {
      setLoading(false);
    }
  }, [activeTab, getAccessToken]);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  async function reviewApplication(
    applicationId: number,
    action: "APPROVE" | "REJECT"
  ) {
    setError("");
    setSuccess("");

    const rejectionReason = rejectionReasons[applicationId]?.trim() || "";

    if (action === "REJECT" && !rejectionReason) {
      setError("Please enter a rejection reason before rejecting.");
      return;
    }

    const confirmed = window.confirm(
      action === "APPROVE"
        ? "Are you sure you want to approve this organization?"
        : "Are you sure you want to reject this organization?"
    );

    if (!confirmed) return;

    setActionLoading(applicationId);

    try {
      const token = await getAccessToken();

      const response = await fetch(
        `${API_URL}/superadmin/organizations/${applicationId}/review/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action,
            rejection_reason: rejectionReason,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Application review failed.");
      }

      setSuccess(result.message || "Application updated successfully.");

      await loadApplications();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to review this application."
      );
    } finally {
      setActionLoading(null);
    }
  }

  const pendingCount =
    activeTab === "PENDING" ? applications.length : undefined;

  return (
    <main className={`superadmin-page ${isDark ? "dark" : "light"}`}>
      <header className="superadmin-header">
        <div className="superadmin-brand">
          <div className="superadmin-logo">M</div>
          <div>
            <h2>Mediqo</h2>
            <span>Platform Administration</span>
          </div>
        </div>

        <div className="superadmin-header-actions">
          <button className="theme-button" onClick={onToggleTheme}>
            {isDark ? "☀️ Light" : "🌙 Dark"}
          </button>

          <button className="logout-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <section className="superadmin-main">
        <div className="superadmin-heading">
          <div>
            <p className="eyebrow">PLATFORM CONTROL CENTER</p>
            <h1>Super Admin Dashboard</h1>
            <p className="subtitle">
              Review and manage hospital and clinic registration
              applications.
            </p>
          </div>

          <button
            className="refresh-button"
            onClick={() => void loadApplications()}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </div>

        <div className="superadmin-stats">
          <div className="stat-card">
            <span>Current applications</span>
            <strong>{pendingCount ?? applications.length}</strong>
            <small>{activeTab.toLowerCase()} applications</small>
          </div>

          <div className="stat-card">
            <span>Current filter</span>
            <strong>{activeTab}</strong>
            <small>Application status</small>
          </div>
        </div>

        <section className="applications-section">
          <div className="section-heading">
            <div>
              <h2>Organization Applications</h2>
              <p>Review submitted hospital and clinic details.</p>
            </div>
          </div>

          <div className="application-tabs">
            {(["PENDING", "APPROVED", "REJECTED"] as const).map(
              (status) => (
                <button
                  key={status}
                  className={
                    activeTab === status ? "tab active" : "tab"
                  }
                  onClick={() => {
                    setActiveTab(status);
                    setSuccess("");
                    setError("");
                  }}
                >
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </button>
              )
            )}
          </div>

          {error && <div className="message error">{error}</div>}
          {success && <div className="message success">{success}</div>}

          {loading ? (
            <div className="empty-state">Loading applications...</div>
          ) : applications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No {activeTab.toLowerCase()} applications</h3>
              <p>
                Applications with this status will appear here.
              </p>
            </div>
          ) : (
            <div className="application-list">
              {applications.map((application) => (
                <article
                  className="application-card"
                  key={application.id}
                >
                  <div className="application-top">
                    <div>
                      <span className="application-type">
                        {application.organization_type}
                      </span>
                      <h3>{application.organization_name}</h3>
                      <p>
                        Application #{application.id} ·{" "}
                        {application.registration_number}
                      </p>
                    </div>

                    <span
                      className={`status-badge ${application.status.toLowerCase()}`}
                    >
                      {application.status}
                    </span>
                  </div>

                  <div className="application-details">
                    <div>
                      <span>Organization email</span>
                      <strong>{application.organization_email}</strong>
                    </div>

                    <div>
                      <span>Phone</span>
                      <strong>{application.organization_phone}</strong>
                    </div>

                    <div>
                      <span>Location</span>
                      <strong>
                        {application.city}, {application.state} -{" "}
                        {application.postal_code}
                      </strong>
                    </div>

                    <div>
                      <span>Address</span>
                      <strong>{application.address_line}</strong>
                    </div>

                    <div>
                      <span>Admin name</span>
                      <strong>{application.admin_full_name}</strong>
                    </div>

                    <div>
                      <span>Admin email</span>
                      <strong>{application.admin_email}</strong>
                    </div>

                    <div>
                      <span>Admin phone</span>
                      <strong>{application.admin_phone}</strong>
                    </div>

                    <div>
                      <span>Submitted</span>
                      <strong>
                        {new Date(application.created_at).toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  {application.verification_document_url && (
                    <a
                      className="document-link"
                      href={application.verification_document_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View verification document ↗
                    </a>
                  )}

                  {application.rejection_reason && (
                    <div className="rejection-note">
                      <strong>Rejection reason:</strong>{" "}
                      {application.rejection_reason}
                    </div>
                  )}

                  {application.status === "PENDING" && (
                    <div className="application-actions">
                      <div className="reject-field">
                        <input
                          type="text"
                          placeholder="Reason for rejection (required to reject)"
                          value={rejectionReasons[application.id] || ""}
                          onChange={(event) =>
                            setRejectionReasons((previous) => ({
                              ...previous,
                              [application.id]: event.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="action-buttons">
                        <button
                          className="approve-button"
                          disabled={actionLoading === application.id}
                          onClick={() =>
                            void reviewApplication(
                              application.id,
                              "APPROVE"
                            )
                          }
                        >
                          {actionLoading === application.id
                            ? "Processing..."
                            : "✓ Approve"}
                        </button>

                        <button
                          className="reject-button"
                          disabled={actionLoading === application.id}
                          onClick={() =>
                            void reviewApplication(
                              application.id,
                              "REJECT"
                            )
                          }
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      <style>{`
        .superadmin-page {
          min-height: 100vh;
          font-family: Arial, sans-serif;
          background: ${isDark ? "#101b1b" : "#f5faf9"};
          color: ${isDark ? "#edf8f6" : "#183b38"};
          transition: background 0.2s, color 0.2s;
        }

        .superadmin-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 6%;
          background: ${isDark ? "#172625" : "#ffffff"};
          border-bottom: 1px solid ${isDark ? "#2b403e" : "#e0ece9"};
        }

        .superadmin-brand,
        .superadmin-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .superadmin-logo {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #087f75;
          color: white;
          font-size: 22px;
          font-weight: 800;
        }

        .superadmin-brand h2 {
          margin: 0 0 4px;
          color: #087f75;
        }

        .superadmin-brand span {
          font-size: 12px;
          opacity: 0.7;
        }

        .superadmin-header button,
        .refresh-button {
          border: 1px solid ${isDark ? "#38514e" : "#d8e9e5"};
          border-radius: 9px;
          padding: 10px 15px;
          background: ${isDark ? "#203432" : "#ffffff"};
          color: inherit;
          cursor: pointer;
        }

        .superadmin-header .logout-button {
          background: #087f75;
          color: white;
          border-color: #087f75;
        }

        .superadmin-main {
          max-width: 1180px;
          margin: 0 auto;
          padding: 42px 24px 70px;
        }

        .superadmin-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 28px;
        }

        .eyebrow {
          color: #0a9386;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .superadmin-heading h1 {
          margin: 8px 0;
          font-size: clamp(26px, 4vw, 36px);
        }

        .subtitle,
        .section-heading p {
          opacity: 0.7;
          line-height: 1.5;
        }

        .superadmin-stats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
          margin-bottom: 38px;
        }

        .stat-card,
        .application-card {
          background: ${isDark ? "#1a2b29" : "#ffffff"};
          border: 1px solid ${isDark ? "#2b403e" : "#e0ece9"};
          border-radius: 15px;
        }

        .stat-card {
          padding: 22px;
        }

        .stat-card span,
        .stat-card small {
          display: block;
          opacity: 0.7;
        }

        .stat-card strong {
          display: block;
          margin: 12px 0 5px;
          font-size: 26px;
          color: #0a9386;
        }

        .applications-section {
          margin-top: 25px;
        }

        .section-heading h2 {
          margin-bottom: 5px;
        }

        .application-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin: 22px 0;
        }

        .tab {
          padding: 10px 18px;
          border: 1px solid ${isDark ? "#38514e" : "#d8e9e5"};
          border-radius: 9px;
          background: transparent;
          color: inherit;
          cursor: pointer;
        }

        .tab.active {
          background: #087f75;
          color: white;
          border-color: #087f75;
        }

        .application-list {
          display: grid;
          gap: 18px;
        }

        .application-card {
          padding: 24px;
        }

        .application-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
          padding-bottom: 18px;
          border-bottom: 1px solid ${isDark ? "#304542" : "#e7efed"};
        }

        .application-type {
          color: #0a9386;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .application-top h3 {
          margin: 8px 0 5px;
          font-size: 21px;
        }

        .application-top p {
          margin: 0;
          opacity: 0.65;
          font-size: 13px;
        }

        .status-badge {
          padding: 7px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 800;
        }

        .status-badge.pending {
          background: #fff3d6;
          color: #916000;
        }

        .status-badge.approved {
          background: #dff7e8;
          color: #167443;
        }

        .status-badge.rejected {
          background: #ffe5e5;
          color: #b42318;
        }

        .application-details {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
          padding: 22px 0;
        }

        .application-details span,
        .application-details strong {
          display: block;
          overflow-wrap: anywhere;
        }

        .application-details span {
          margin-bottom: 6px;
          font-size: 12px;
          opacity: 0.6;
        }

        .application-details strong {
          font-size: 14px;
          font-weight: 600;
        }

        .document-link {
          display: inline-block;
          margin-bottom: 15px;
          color: #0a9386;
          font-weight: 600;
        }

        .rejection-note {
          padding: 12px;
          border-radius: 9px;
          background: ${isDark ? "#382626" : "#fff0f0"};
          margin: 12px 0;
          font-size: 13px;
        }

        .application-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-top: 18px;
          border-top: 1px solid ${isDark ? "#304542" : "#e7efed"};
        }

        .reject-field input {
          width: 100%;
          box-sizing: border-box;
          padding: 12px;
          border: 1px solid ${isDark ? "#38514e" : "#d8e9e5"};
          border-radius: 9px;
          background: ${isDark ? "#142321" : "#fbfefd"};
          color: inherit;
          outline-color: #087f75;
        }

        .action-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .action-buttons button {
          padding: 11px 18px;
          border: none;
          border-radius: 9px;
          color: white;
          font-weight: 700;
          cursor: pointer;
        }

        .action-buttons button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .approve-button {
          background: #087f75;
        }

        .reject-button {
          background: #c43d3d;
        }

        .message {
          padding: 13px 16px;
          border-radius: 9px;
          margin: 15px 0;
          font-size: 14px;
        }

        .message.error {
          background: ${isDark ? "#3b2525" : "#fff0f0"};
          color: ${isDark ? "#ffbaba" : "#b42318"};
        }

        .message.success {
          background: ${isDark ? "#1d3a30" : "#e8f8ee"};
          color: ${isDark ? "#a8efc2" : "#167443"};
        }

        .empty-state {
          padding: 55px 20px;
          text-align: center;
          border: 1px dashed ${isDark ? "#38514e" : "#cbded9"};
          border-radius: 14px;
          opacity: 0.8;
        }

        .empty-icon {
          font-size: 32px;
        }

        @media (max-width: 650px) {
          .superadmin-header {
            padding: 15px;
          }

          .superadmin-header-actions {
            gap: 6px;
          }

          .superadmin-header button {
            padding: 9px;
            font-size: 12px;
          }

          .superadmin-main {
            padding: 28px 15px 50px;
          }

          .superadmin-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .superadmin-stats {
            grid-template-columns: 1fr;
          }

          .application-details {
            grid-template-columns: 1fr;
          }

          .application-card {
            padding: 17px;
          }
        }
      `}</style>
    </main>
  );
}
