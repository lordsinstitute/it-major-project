import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent, CSSProperties } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { supabase } from "../../lib/supabase";
import { logoutUser, resetPassword } from "../../lib/auth";
type Theme = "light" | "dark";

type ProfilePageProps = {
  theme?: Theme;
  onToggleTheme?: () => void;
};

type Profile = {
  id: number;
  supabase_uid: string;
  email: string;
  full_name: string;
  phone_number: string;
  role: string;
};

type Section =
  | "profile"
  | "consultations"
  | "records"
  | "prescriptions"
  | "security";

const API_URL = "http://127.0.0.1:8000/api";

async function getCroppedImage(
  imageSrc: string,
  cropPixels: Area
): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Unable to load the image."));
  });

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Your browser could not crop this image.");
  }

  canvas.width = 512;
  canvas.height = 512;

  context.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    512,
    512
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not create the cropped image."));
      },
      "image/jpeg",
      0.92
    );
  });
}

export default function ProfilePage({
  theme = "light",
  onToggleTheme,
}: ProfilePageProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [section, setSection] = useState<Section>("profile");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<Area | null>(null);
  const [cropOpen, setCropOpen] = useState(false);

  const onCropComplete = useCallback(
    (_area: Area, pixels: Area) => {
      setCroppedAreaPixels(pixels);
    },
    []
  );

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session?.access_token) {
          throw new Error("Please sign in again.");
        }

        const response = await fetch(`${API_URL}/profile/sync/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        });

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
            throw new Error(
                `Expected JSON from profile API, but received ${contentType || "unknown response"}. Check the Django API URL.`
  );
}
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Could not load your profile.");
        }

        if (active) {
          setProfile(result);
          setAvatarUrl(session.user.user_metadata?.avatar_url || "");
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load your profile."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  function handleImageSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setError("");
    setMessage("");

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Please choose an image smaller than 10 MB.");
      return;
    }

    const imageUrl = URL.createObjectURL(file);

    setSelectedImage(imageUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCropOpen(true);
  }

  function closeCropDialog() {
    if (uploading) return;

    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
    }

    setSelectedImage(null);
    setCroppedAreaPixels(null);
    setCropOpen(false);
  }

  async function uploadPhoto() {
    if (!selectedImage || !croppedAreaPixels || !profile) {
      setError("Please select and crop your photo first.");
      return;
    }

    setUploading(true);
    setError("");
    setMessage("");

    try {
      const croppedBlob = await getCroppedImage(
        selectedImage,
        croppedAreaPixels
      );

      const croppedFile = new File(
        [croppedBlob],
        `profile-${Date.now()}.jpg`,
        { type: "image/jpeg" }
      );

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("Please sign in again.");

      const path = `${user.id}/profile-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(path, croppedFile, {
          upsert: false,
          contentType: "image/jpeg",
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(path);

      // Add a cache-busting parameter so the browser refreshes the avatar.
      const newAvatarUrl = `${data.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: newAvatarUrl },
      });

      if (updateError) throw updateError;

      setAvatarUrl(newAvatarUrl);
      setMessage("Profile photo updated successfully.");

      URL.revokeObjectURL(selectedImage);
      setSelectedImage(null);
      setCroppedAreaPixels(null);
      setCropOpen(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not upload the photo."
      );
    } finally {
      setUploading(false);
    }
  }

  async function handlePasswordReset() {
    if (!profile?.email) return;

    setError("");
    setMessage("");

    try {
      await resetPassword(profile.email);
      setMessage("Password reset instructions have been sent to your email.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not send the reset email."
      );
    }
  }

  async function handleLogout() {
    try {
      await logoutUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed.");
    }
  }

  if (loading) {
    return (
      <main className={`profile-page ${theme}`} style={styles.center}>
        Loading your Mediqo profile...
      </main>
    );
  }

  if (!profile) {
    return (
      <main className={`profile-page ${theme}`} style={styles.center}>
        <p>{error || "Unable to load your profile."}</p>
        <button onClick={() => window.location.reload()}>Try again</button>
      </main>
    );
  }

  const navigation: { id: Section; label: string }[] = [
    { id: "profile", label: "My Profile" },
    { id: "consultations", label: "Consultations" },
    { id: "records", label: "Medical Records" },
    { id: "prescriptions", label: "Prescriptions" },
    { id: "security", label: "Security" },
  ];

  const emptySections: Record<
    "consultations" | "records" | "prescriptions",
    { title: string; description: string }
  > = {
    consultations: {
      title: "Your consultations",
      description:
        "Your upcoming appointments and previous consultations will appear here once appointment APIs are connected.",
    },
    records: {
      title: "Your medical records",
      description:
        "Medical reports and visit summaries will appear here when secure medical-record storage is implemented.",
    },
    prescriptions: {
      title: "Your prescriptions",
      description:
        "Prescriptions issued by your doctors will appear here once the prescription API is connected.",
    },
  };

  return (
    <main className={`profile-page ${theme}`}>
      <header className="profile-header">
        <div style={styles.brand}>
          <span style={styles.logo}>M</span>
          <span>
            Mediqo<span style={{ color: "#F28A69" }}>.</span>
          </span>
        </div>

        <div className="header-actions">
          {onToggleTheme && (
            <button
              type="button"
              className="theme-button"
              onClick={onToggleTheme}
            >
              {theme === "dark" ? "☀ Light mode" : "☾ Dark mode"}
            </button>
          )}

          <button style={styles.logout} onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <div className="profile-layout">
        <aside className="profile-sidebar">
          <p style={styles.muted}>YOUR ACCOUNT</p>

          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setSection(item.id);
                setMessage("");
                setError("");
              }}
              className={`nav-button ${
                section === item.id ? "active" : ""
              }`}
            >
              {item.label}
            </button>
          ))}
        </aside>

        <section className="profile-content">
          <p style={styles.eyebrow}>PATIENT DASHBOARD</p>

          <h1 style={styles.heading}>
            {navigation.find((item) => item.id === section)?.label}
          </h1>

          {error && <p style={styles.error}>{error}</p>}
          {message && <p style={styles.success}>{message}</p>}

          {section === "profile" && (
            <div className="profile-card">
              <div style={styles.photoRow}>
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    style={styles.avatar}
                  />
                ) : (
                  <div style={styles.avatarPlaceholder}>
                    {(profile.full_name || profile.email)
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                <div>
                  <h2 style={styles.name}>
                    {profile.full_name || "Mediqo Patient"}
                  </h2>
                  <p style={styles.muted}>{profile.role}</p>
                </div>
              </div>

              <input
                id="profile-photo-input"
                type="file"
                accept="image/*"
                hidden
                onChange={handleImageSelected}
              />

              <button
                type="button"
                style={styles.primaryButton}
                onClick={() =>
                  document.getElementById("profile-photo-input")?.click()
                }
                disabled={uploading}
              >
                Upload photo
              </button>

              <p style={styles.photoHint}>
                Choose an image, adjust the square crop, and save.
              </p>

              <hr style={styles.divider} />

              <div style={styles.field}>
                <span style={styles.muted}>Full name</span>
                <strong>{profile.full_name || "Not provided"}</strong>
              </div>

              <div style={styles.field}>
                <span style={styles.muted}>Email address</span>
                <strong>{profile.email}</strong>
              </div>

              <div style={styles.field}>
                <span style={styles.muted}>Phone number</span>
                <strong>{profile.phone_number || "Not provided"}</strong>
              </div>

              <div style={styles.field}>
                <span style={styles.muted}>Account role</span>
                <strong>{profile.role}</strong>
              </div>
            </div>
          )}

          {section === "security" && (
            <div className="profile-card">
              <h2 style={styles.subheading}>Password reset</h2>
              <p style={styles.description}>
                Receive a password reset link at {profile.email}.
              </p>

              <button
                style={styles.primaryButton}
                onClick={handlePasswordReset}
              >
                Send password reset email
              </button>
            </div>
          )}

          {(
            ["consultations", "records", "prescriptions"] as const
          ).includes(section as "consultations" | "records" | "prescriptions") &&
            section in emptySections && (
              <div className="profile-card">
                <h2 style={styles.subheading}>
                  {
                    emptySections[
                      section as "consultations" | "records" | "prescriptions"
                    ].title
                  }
                </h2>
                <p style={styles.description}>
                  {
                    emptySections[
                      section as "consultations" | "records" | "prescriptions"
                    ].description
                  }
                </p>
              </div>
            )}
        </section>
      </div>

      {cropOpen && selectedImage && (
        <div className="crop-overlay">
          <div
            className="crop-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="crop-dialog-title"
          >
            <h2 id="crop-dialog-title">Crop your profile photo</h2>
            <p style={styles.description}>
              Move the image and zoom until you are happy with the square crop.
            </p>

            <div className="crop-container">
              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <label className="zoom-control">
              Zoom
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
              />
            </label>

            {error && <p style={styles.error}>{error}</p>}

            <div className="crop-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={closeCropDialog}
                disabled={uploading}
              >
                Cancel
              </button>

              <button
                type="button"
                className="save-button"
                onClick={uploadPhoto}
                disabled={uploading || !croppedAreaPixels}
              >
                {uploading ? "Uploading..." : "Save crop"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .profile-page {
          --page-bg: #f5faf8;
          --card-bg: #ffffff;
          --text-color: #183b37;
          --muted-color: #71847f;
          --border-color: #e1ece8;
          --nav-color: #47635d;
          min-height: 100vh;
          background: var(--page-bg);
          color: var(--text-color);
          font-family: Inter, system-ui, sans-serif;
        }

        .profile-page.dark {
          --page-bg: #0e1b1a;
          --card-bg: #152624;
          --text-color: #f0f7f5;
          --muted-color: #b2c9c3;
          --border-color: #294440;
          --nav-color: #c0d6d0;
        }

        .profile-header {
          min-height: 76px;
          box-sizing: border-box;
          background: var(--card-bg);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 5%;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .theme-button {
          padding: 10px 14px;
          border: 1px solid var(--border-color);
          border-radius: 10px;
          background: var(--card-bg);
          color: var(--text-color);
          cursor: pointer;
        }

        .profile-layout {
          max-width: 1200px;
          margin: 0 auto;
          padding: 36px 24px;
          display: grid;
          grid-template-columns: 230px minmax(0, 1fr);
          gap: 28px;
        }

        .profile-sidebar {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 16px;
          align-self: start;
        }

        .nav-button {
          display: block;
          width: 100%;
          text-align: left;
          padding: 13px 12px;
          margin-top: 5px;
          border: none;
          border-radius: 9px;
          background: transparent;
          color: var(--nav-color);
          cursor: pointer;
          font-size: 14px;
        }

        .nav-button.active {
          background: #d9f5ed;
          color: #087e70;
          font-weight: 700;
        }

        .dark .nav-button.active {
          background: #20433d;
          color: #9ce5d5;
        }

        .profile-content { min-width: 0; }

        .profile-card {
          background: var(--card-bg);
          color: var(--text-color);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 26px;
          max-width: 760px;
        }

        .photo-hint {
          margin: 10px 0 0;
          font-size: 13px;
          color: var(--muted-color);
        }

        .crop-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: grid;
          place-items: center;
          padding: 18px;
          overflow-y: auto;
          background: rgba(0, 0, 0, 0.72);
        }

        .crop-dialog {
          width: min(100%, 460px);
          box-sizing: border-box;
          padding: 24px;
          border-radius: 20px;
          background: var(--card-bg);
          color: var(--text-color);
          box-shadow: 0 20px 70px rgba(0, 0, 0, 0.25);
        }

        .crop-dialog h2 { margin-top: 0; }

        .crop-container {
          position: relative;
          width: 100%;
          height: 320px;
          margin-top: 18px;
          overflow: hidden;
          border-radius: 12px;
          background: #101817;
        }

        .zoom-control {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 18px;
          font-size: 14px;
          font-weight: 600;
        }

        .zoom-control input { width: 100%; }

        .crop-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 22px;
        }

        .crop-actions button {
          padding: 11px 16px;
          border: 0;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 700;
        }

        .crop-actions button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .cancel-button {
          background: var(--page-bg);
          color: var(--text-color);
          border: 1px solid var(--border-color) !important;
        }

        .save-button {
          background: #087e70;
          color: white;
        }

        @media (max-width: 760px) {
          .profile-layout {
            grid-template-columns: 1fr;
            padding: 20px 14px;
          }

          .profile-sidebar {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
          }

          .profile-sidebar > p { width: 100%; }

          .nav-button {
            width: auto;
            flex: 1 1 auto;
          }

          .profile-header { padding: 14px; }

          .header-actions { gap: 6px; }

          .theme-button, .profile-header button {
            font-size: 12px;
            padding: 9px;
          }

          .profile-card { padding: 18px; }

          .crop-dialog { padding: 18px; }

          .crop-container { height: 280px; }
        }
      `}</style>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#F5FAF8",
    color: "#183B37",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  center: {
    minHeight: "100vh",
    display: "grid",
    placeContent: "center",
    gap: 12,
    padding: 24,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontWeight: 800,
    fontSize: 24,
  },
  logo: {
    display: "grid",
    placeItems: "center",
    width: 38,
    height: 38,
    background: "#DDF6EE",
    color: "#087E70",
    borderRadius: 12,
  },
  logout: {
    padding: "10px 16px",
    border: "1px solid var(--border-color, #D9E7E2)",
    borderRadius: 10,
    background: "var(--card-bg, #FFFFFF)",
    color: "var(--text-color, #183B37)",
    cursor: "pointer",
  },
  photoRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: "50%",
    background: "#DDF6EE",
    color: "#087E70",
    display: "grid",
    placeItems: "center",
    fontSize: 32,
    fontWeight: 800,
    flexShrink: 0,
  },
  name: { margin: 0, fontSize: 21 },
  muted: { color: "var(--muted-color, #71847F)", fontSize: 13 },
  eyebrow: {
    color: "#0D9488",
    fontSize: 12,
    letterSpacing: 1.4,
    fontWeight: 800,
  },
  heading: { fontSize: 30, margin: "8px 0 24px" },
  primaryButton: {
    background: "#087E70",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 10,
    padding: "12px 17px",
    cursor: "pointer",
    fontWeight: 700,
  },
  divider: {
    border: 0,
    borderTop: "1px solid var(--border-color, #E1ECE8)",
    margin: "24px 0",
  },
  field: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    padding: "15px 0",
    borderBottom: "1px solid var(--border-color, #EEF3F1)",
    flexWrap: "wrap",
  },
  subheading: { marginTop: 0 },
  description: {
    color: "var(--muted-color, #647873)",
    lineHeight: 1.7,
  },
  error: {
    color: "#B42318",
    background: "#FEECEB",
    padding: 12,
    borderRadius: 8,
  },
  success: {
    color: "#087E70",
    background: "#DDF6EE",
    padding: 12,
    borderRadius: 8,
  },
};
