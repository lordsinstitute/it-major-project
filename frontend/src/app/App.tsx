
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import AuthPage from "../features/auth/AuthPage";
import PatientDashboard from "../features/patient/PatientDashboard";
import BookingPage from "../features/appointments/BookingPage";
import SuperAdminDashboard from "../features/superadmin/SuperAdminDashboard";
import OrganizationDashboard from "../features/organization/OrganizationDashboard";
import DoctorDashboard from "../features/doctors/DoctorDashboard";
import NurseDashboard from "../features/nurse/NurseDashboard";
import LandingPage, { type Doctor } from "../LandingPage";
import "../App.css";

type AuthStatus = "loading" | "signed-out" | "signed-in";
type Theme = "light" | "dark";
type Page = "home" | "auth" | "profile" | "booking";

type UserRole =
  | "SUPER_ADMIN"
  | "ORGANIZATION_ADMIN"
  | "DOCTOR"
  | "NURSE"
  | "PATIENT";

interface BackendProfile {
  id: number;
  email: string;
  full_name?: string;
  role: UserRole;
  phone_number?: string;
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return localStorage.getItem("mediqo-theme") === "dark"
        ? "dark"
        : "light";
    } catch {
      return "light";
    }
  });

  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [page, setPage] = useState<Page>("home");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const [userProfile, setUserProfile] = useState<BackendProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [pageAfterLogin, setPageAfterLogin] = useState<"home" | "booking">(
    "home"
  );

  function toggleTheme() {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);

    try {
      localStorage.setItem("mediqo-theme", nextTheme);
    } catch {
      // Theme remains active for this session.
    }
  }

  async function fetchBackendProfile(accessToken: string) {
    setProfileLoading(true);
    setProfileError("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/profile/sync/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to load your Mediqo profile."
        );
      }

      if (!result.role) {
        throw new Error("Your account role was not returned by the backend.");
      }

      setUserProfile(result as BackendProfile);
      setProfileError("");

      return result as BackendProfile;
    } catch (error) {
      setUserProfile(null);

      setProfileError(
        error instanceof Error
          ? error.message
          : "Profile synchronization failed."
      );

      return null;
    } finally {
      setProfileLoading(false);
    }
  }

  function handleBookDoctor(doctor: Doctor) {
    setSelectedDoctor(doctor);

    if (authStatus === "signed-in" && userProfile?.role === "PATIENT") {
      setPage("booking");
      return;
    }

    if (authStatus === "signed-out") {
      setPageAfterLogin("booking");
      setPage("auth");
    }
  }

  useEffect(() => {
    let mounted = true;

    async function initializeSession() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error || !data.session) {
          setAuthStatus("signed-out");
          setUserProfile(null);
          return;
        }

        setAuthStatus("signed-in");

        const profile = await fetchBackendProfile(
          data.session.access_token
        );

        if (!mounted) return;

        if (profile) {
          setPage((currentPage) =>
            currentPage === "auth" ? pageAfterLogin : currentPage
          );
        }
      } catch {
        if (mounted) {
          setAuthStatus("signed-out");
          setUserProfile(null);
        }
      }
    }

    void initializeSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (!session) {
        setAuthStatus("signed-out");
        setUserProfile(null);
        setProfileError("");
        setProfileLoading(false);
        setPage("home");
        setSelectedDoctor(null);
        setPageAfterLogin("home");
        return;
      }

      setAuthStatus("signed-in");

      if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        void fetchBackendProfile(session.access_token).then((profile) => {
          if (!mounted || !profile) return;

          setPage((currentPage) =>
            currentPage === "auth" ? pageAfterLogin : currentPage
          );
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [pageAfterLogin]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUserProfile(null);
    setSelectedDoctor(null);
    setPage("home");
  }

  // Initial loading.
  if (authStatus === "loading") {
    return (
      <main className="mediqo-loading">
        Loading Mediqo...
        <style>{`
          .mediqo-loading {
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: #f5fbf9;
            color: #087f75;
            font-family: Arial, sans-serif;
            font-size: 18px;
            font-weight: 600;
          }
        `}</style>
      </main>
    );
  }

  // Verify backend role before showing a private dashboard.
  if (authStatus === "signed-in" && profileLoading && !userProfile) {
    return (
      <main className="mediqo-loading">
        Verifying your account...
      </main>
    );
  }

  // Account verification error.
  if (authStatus === "signed-in" && !userProfile) {
    return (
      <main className="mediqo-role-error">
        <h2>Unable to load your account</h2>

        <p>
          {profileError || "Your account role could not be verified."}
        </p>

        <button onClick={() => void handleLogout()}>
          Logout
        </button>

        <style>{`
          .mediqo-role-error {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 24px;
            text-align: center;
            font-family: Arial, sans-serif;
          }

          .mediqo-role-error button {
            padding: 11px 22px;
            border: none;
            border-radius: 9px;
            background: #087f75;
            color: white;
            cursor: pointer;
          }
        `}</style>
      </main>
    );
  }

  // SUPER ADMIN DASHBOARD.
  if (
    authStatus === "signed-in" &&
    userProfile?.role === "SUPER_ADMIN"
  ) {
    return (
      <SuperAdminDashboard
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
      />
    );
  }

  // ORGANIZATION ADMIN DASHBOARD.
  if (
    authStatus === "signed-in" &&
    userProfile?.role === "ORGANIZATION_ADMIN"
  ) {
    return (
      <OrganizationDashboard
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
        organizationId={2}
      />
    );
  }

  // DOCTOR DASHBOARD.
  if (
    authStatus === "signed-in" &&
    userProfile?.role === "DOCTOR"
  ) {
    return (
      <DoctorDashboard
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
        doctorName={userProfile.full_name || userProfile.email}
      />
    );
  }

  // NURSE DASHBOARD.
  if (
    authStatus === "signed-in" &&
    userProfile?.role === "NURSE"
  ) {
    return (
      <NurseDashboard
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
        nurseName={userProfile.full_name || userProfile.email}
      />
    );
  }

  // PATIENT DASHBOARD / PORTAL.
  if (
    page === "profile" &&
    authStatus === "signed-in" &&
    userProfile?.role === "PATIENT"
  ) {
    return (
      <PatientDashboard
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
        patientName={userProfile.full_name || userProfile.email}
        onBackToHome={() => setPage("home")}
      />
    );
  }

  // PATIENT APPOINTMENT BOOKING.
  if (
    page === "booking" &&
    authStatus === "signed-in" &&
    userProfile?.role === "PATIENT" &&
    selectedDoctor
  ) {
    return (
      <BookingPage
        doctor={selectedDoctor}
        theme={theme}
        onToggleTheme={toggleTheme}
        onBack={() => setPage("home")}
        onBookingSuccess={() => setPage("profile")}
      />
    );
  }

  // LOGIN AND PATIENT SIGNUP.
  if (page === "auth") {
    return (
      <div
        className={
          theme === "dark" ? "auth-theme-dark" : "auth-theme-light"
        }
      >
        <button
          type="button"
          className="mediqo-back-button"
          onClick={() => {
            setPage("home");
            setPageAfterLogin("home");
            setSelectedDoctor(null);
          }}
          aria-label="Back to homepage"
        >
          ← Back to Home
        </button>

        <AuthPage theme={theme} />
      </div>
    );
  }

  // PUBLIC HOMEPAGE AND PATIENT HOMEPAGE.
  return (
    <LandingPage
      theme={theme}
      onToggleTheme={toggleTheme}
      isLoggedIn={authStatus === "signed-in"}
      onOpenAuth={() => {
        setPageAfterLogin("home");
        setPage("auth");
      }}
      onOpenProfile={() => {
        if (
          authStatus === "signed-in" &&
          userProfile?.role === "PATIENT"
        ) {
          setPage("profile");
        } else if (authStatus === "signed-out") {
          setPageAfterLogin("home");
          setPage("auth");
        }
      }}
      onBookDoctor={handleBookDoctor}
    />
  );
}
