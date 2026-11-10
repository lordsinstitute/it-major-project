import { useEffect, useMemo, useState } from "react";


export type Doctor = {
  id: number;
  name: string;
  specialization: string;
  qualification: string;
  experience_years: number;
  consultation_fee: string;
  bio: string;
  organizations: {
    id: number;
    name: string;
    type: string;
    city: string;
    state: string;
  }[];
};

type Hospital = {
  id: number;
  name: string;
  type: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  departments: string[];
  doctor_count: number;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

type LandingPageProps = {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onOpenAuth: () => void;
  isLoggedIn: boolean;
  onOpenProfile: () => void;
  onBookDoctor: (doctor: Doctor) => void;
};

export default function LandingPage({
  theme,
  onToggleTheme,
  onOpenAuth,
  isLoggedIn,
  onOpenProfile,
  onBookDoctor,
}: LandingPageProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [directoryError, setDirectoryError] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [maxFeeFilter, setMaxFeeFilter] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDirectory() {
      setDirectoryLoading(true);
      setDirectoryError("");

      try {
        const [doctorsResponse, hospitalsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/public/doctors/`),
          fetch(`${API_BASE_URL}/api/public/hospitals/`),
        ]);

        if (!doctorsResponse.ok || !hospitalsResponse.ok) {
          throw new Error("Unable to load the public directory. Please try again.");
        }

        const [doctorData, hospitalData] = await Promise.all([
          doctorsResponse.json(),
          hospitalsResponse.json(),
        ]);

        if (!active) return;
        setDoctors(Array.isArray(doctorData.results) ? doctorData.results : []);
        setHospitals(Array.isArray(hospitalData.results) ? hospitalData.results : []);
      } catch (error) {
        if (!active) return;
        setDirectoryError(
          error instanceof Error
            ? error.message
            : "Something went wrong while loading the directory."
        );
      } finally {
        if (active) setDirectoryLoading(false);
      }
    }

    void loadDirectory();
    return () => {
      active = false;
    };
  }, []);

  const filteredDoctors = useMemo(() => {
    const search = doctorSearch.trim().toLowerCase();
    const city = cityFilter.trim().toLowerCase();
    const maxFee = maxFeeFilter === "" ? null : Number(maxFeeFilter);

    return doctors.filter((doctor) => {
      const matchesSearch =
        !search ||
        doctor.name.toLowerCase().includes(search) ||
        doctor.specialization.toLowerCase().includes(search) ||
        doctor.qualification.toLowerCase().includes(search);

      const matchesSpecialization =
        !specializationFilter ||
        doctor.specialization.toLowerCase() === specializationFilter.toLowerCase();

      const matchesCity =
        !city ||
        doctor.organizations.some((organization) =>
          organization.city.toLowerCase().includes(city)
        );

      const matchesFee =
        maxFee === null ||
        (Number.isFinite(maxFee) && Number(doctor.consultation_fee) <= maxFee);

      return matchesSearch && matchesSpecialization && matchesCity && matchesFee;
    });
  }, [doctors, doctorSearch, specializationFilter, cityFilter, maxFeeFilter]);

  const specializations = useMemo(
    () => Array.from(new Set(doctors.map((doctor) => doctor.specialization))).sort(),
    [doctors]
  );

  const filteredHospitals = useMemo(() => {
    const search = cityFilter.trim().toLowerCase();
    return hospitals.filter((hospital) => {
      const matchesCity = !search || hospital.city.toLowerCase().includes(search);
      return matchesCity;
    });
  }, [hospitals, cityFilter]);

  function scrollToSection(sectionId: string) {
    setMenuOpen(false);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className={`mediqo-app ${theme === "dark" ? "dark-mode" : "light-mode"}`}>
      <style>{`
        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system,
            BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: #173b3b;
          background: #ffffff;
        }

        button, a {
          font: inherit;
        }

        button {
          cursor: pointer;
        }

        .mediqo-app {
          min-height: 100vh;
          overflow: hidden;
          background: #fff;
        }

        .mediqo-container {
          width: min(1160px, calc(100% - 40px));
          margin: 0 auto;
        }

        .mediqo-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(255,255,255,.95);
          border-bottom: 1px solid #e6f0ed;
          backdrop-filter: blur(14px);
        }

        .mediqo-nav {
          min-height: 78px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .mediqo-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #153d3b;
          font-size: 25px;
          font-weight: 800;
          letter-spacing: -1px;
          border: 0;
          background: transparent;
        }

        .mediqo-logo {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: #087f75;
          color: white;
          font-size: 22px;
          font-weight: 800;
        }

        .mediqo-nav-links {
          display: flex;
          align-items: center;
          gap: 28px;
        }

        .mediqo-nav-links button {
          border: 0;
          background: transparent;
          color: #4f6967;
          font-size: 14px;
          font-weight: 600;
        }

        .mediqo-nav-links button:hover {
          color: #087f75;
        }

        .mediqo-nav-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mediqo-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 0;
          border-radius: 12px;
          padding: 13px 19px;
          background: #087f75;
          color: white;
          font-weight: 700;
          transition: transform .2s, background .2s;
        }

        .mediqo-btn:hover {
          background: #066a62;
          transform: translateY(-1px);
        }

        .mediqo-btn-light {
          background: #eaf7f3;
          color: #087f75;
        }

        .mediqo-btn-light:hover {
          background: #d9f0e9;
        }

        .mediqo-menu-button {
          display: none;
          border: 1px solid #dcece7;
          border-radius: 10px;
          padding: 9px 12px;
          background: white;
          color: #087f75;
          font-size: 20px;
        }

        .mediqo-hero {
          position: relative;
          padding: 80px 0 85px;
          background:
            radial-gradient(circle at 85% 20%, #d9f5ec 0, transparent 30%),
            linear-gradient(120deg, #f4fbf8 0%, #fff 65%);
        }

        .mediqo-hero-grid {
          display: grid;
          grid-template-columns: 1.05fr .95fr;
          align-items: center;
          gap: 55px;
        }

        .mediqo-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 13px;
          border: 1px solid #d2eee5;
          border-radius: 30px;
          background: #ecf9f4;
          color: #087f75;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .5px;
          text-transform: uppercase;
        }

        .mediqo-hero h1 {
          max-width: 620px;
          margin: 22px 0;
          color: #173b3b;
          font-size: clamp(42px, 5.4vw, 68px);
          line-height: 1.06;
          letter-spacing: -3px;
        }

        .mediqo-highlight {
          color: #087f75;
        }

        .mediqo-hero-description {
          max-width: 520px;
          color: #627a77;
          font-size: 17px;
          line-height: 1.8;
        }

        .mediqo-hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 30px;
        }

        .mediqo-trust {
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
          margin-top: 28px;
          color: #55716c;
          font-size: 13px;
          font-weight: 600;
        }

        .mediqo-trust span::before {
          content: "✓";
          margin-right: 7px;
          color: #087f75;
          font-weight: 900;
        }

        .mediqo-hero-art {
          position: relative;
          min-height: 410px;
          display: grid;
          place-items: center;
          border-radius: 35px;
          background: linear-gradient(145deg, #d8f2e9, #f7fcf9);
        }

        .mediqo-art-circle {
          width: min(290px, 70%);
          aspect-ratio: 1;
          display: grid;
          place-items: center;
          border: 15px solid rgba(255,255,255,.7);
          border-radius: 50%;
          background: linear-gradient(145deg, #087f75, #48b7a2);
          box-shadow: 0 25px 60px rgba(8,127,117,.2);
          color: white;
          font-size: 110px;
        }

        .mediqo-float-card {
          position: absolute;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 15px 18px;
          border: 1px solid #edf4f1;
          border-radius: 16px;
          background: white;
          box-shadow: 0 14px 40px rgba(25,72,62,.1);
          color: #244b46;
          font-size: 13px;
          font-weight: 700;
        }

        .mediqo-float-icon {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: #e7f8f1;
          font-size: 20px;
        }

        .mediqo-float-one {
          top: 42px;
          left: -22px;
        }

        .mediqo-float-two {
          right: -18px;
          bottom: 48px;
        }

        .mediqo-section {
          padding: 82px 0;
        }

        .mediqo-section-heading {
          max-width: 650px;
          margin: 0 auto 42px;
          text-align: center;
        }

        .mediqo-section-heading h2 {
          margin: 12px 0;
          color: #173b3b;
          font-size: clamp(30px, 4vw, 42px);
          letter-spacing: -1.5px;
        }

        .mediqo-section-heading p {
          color: #6b807c;
          font-size: 15px;
          line-height: 1.8;
        }

        .mediqo-service-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
        }

        .mediqo-service-card {
          padding: 27px;
          border: 1px solid #e6efec;
          border-radius: 20px;
          background: white;
          transition: transform .2s, box-shadow .2s;
        }

        .mediqo-service-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 45px rgba(22,71,62,.08);
        }

        .mediqo-service-icon {
          width: 54px;
          height: 54px;
          display: grid;
          place-items: center;
          margin-bottom: 20px;
          border-radius: 16px;
          background: #eaf8f2;
          font-size: 27px;
        }

        .mediqo-service-card h3 {
          margin: 0 0 10px;
          color: #204642;
          font-size: 19px;
        }

        .mediqo-service-card p {
          min-height: 68px;
          margin: 0 0 18px;
          color: #6c817d;
          font-size: 14px;
          line-height: 1.7;
        }

        .mediqo-text-link {
          border: 0;
          background: transparent;
          color: #087f75;
          font-weight: 800;
        }

        .mediqo-dark-section {
          padding: 75px 0;
          background: #123b38;
          color: white;
        }

        .mediqo-dark-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 55px;
        }

        .mediqo-dark-section h2 {
          margin: 14px 0;
          font-size: clamp(30px, 4vw, 43px);
          line-height: 1.2;
          letter-spacing: -1.5px;
        }

        .mediqo-dark-section p {
          color: #c3d9d3;
          line-height: 1.8;
        }

        .mediqo-dark-badge {
          color: #8ce0c6;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .mediqo-benefit-list {
          display: grid;
          gap: 14px;
          margin: 24px 0;
        }

        .mediqo-benefit {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          color: #e4f1ed;
          font-size: 14px;
          line-height: 1.7;
        }

        .mediqo-benefit span {
          color: #83e0c3;
          font-weight: 900;
        }

        .mediqo-steps-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 25px;
        }

        .mediqo-step {
          padding: 25px;
          border-radius: 18px;
          background: #f4faf7;
        }

        .mediqo-step-number {
          width: 43px;
          height: 43px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: #087f75;
          color: white;
          font-weight: 800;
        }

        .mediqo-step h3 {
          margin: 18px 0 8px;
          color: #204642;
        }

        .mediqo-step p {
          color: #6b807c;
          font-size: 14px;
          line-height: 1.7;
        }

        .mediqo-cta {
          padding: 65px 0;
          background: linear-gradient(120deg, #e4f7ef, #f8fcfa);
          text-align: center;
        }

        .mediqo-cta h2 {
          margin: 0 0 13px;
          color: #173b3b;
          font-size: clamp(28px, 4vw, 40px);
          letter-spacing: -1px;
        }

        .mediqo-cta p {
          margin: 0 auto 24px;
          color: #647d77;
          line-height: 1.7;
        }

        .mediqo-footer {
          padding: 35px 0;
          background: #0d2f2d;
          color: #d8e8e3;
        }

        .mediqo-footer-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .mediqo-footer p {
          margin: 8px 0 0;
          color: #a9c5bd;
          font-size: 13px;
        }

        .mediqo-footer-links {
          display: flex;
          gap: 20px;
        }

        .mediqo-footer-links button {
          border: 0;
          background: transparent;
          color: #d8e8e3;
          font-size: 13px;
        }

        @media (max-width: 850px) {
          .mediqo-nav-links {
            display: none;
          }

          .mediqo-menu-button {
            display: block;
          }

          .mediqo-mobile-menu {
            display: grid;
            gap: 12px;
            padding: 12px 0 20px;
          }

          .mediqo-mobile-menu button {
            padding: 10px 0;
            border: 0;
            background: transparent;
            color: #315b54;
            text-align: left;
            font-weight: 600;
          }

          .mediqo-hero-grid,
          .mediqo-dark-grid {
            grid-template-columns: 1fr;
          }

          .mediqo-hero {
            padding-top: 55px;
          }

          .mediqo-hero-art {
            min-height: 350px;
            margin: 0 10px;
          }

          .mediqo-service-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 560px) {
          .mediqo-container {
            width: min(100% - 28px, 1160px);
          }

          .mediqo-nav {
            min-height: 68px;
            gap: 10px;
          }

          .mediqo-brand {
            font-size: 22px;
          }

          .mediqo-logo {
            width: 35px;
            height: 35px;
          }

          .mediqo-nav-actions .mediqo-btn {
            padding: 10px 12px;
            font-size: 13px;
          }

          .mediqo-hero h1 {
            letter-spacing: -1.8px;
          }

          .mediqo-hero-description {
            font-size: 15px;
          }

          .mediqo-hero-art {
            min-height: 290px;
          }

          .mediqo-art-circle {
            font-size: 85px;
          }

          .mediqo-float-card {
            padding: 10px;
            font-size: 11px;
          }

          .mediqo-float-one {
            left: -6px;
          }

          .mediqo-float-two {
            right: -6px;
          }

          .mediqo-section {
            padding: 58px 0;
          }

          .mediqo-service-grid,
          .mediqo-steps-grid {
            grid-template-columns: 1fr;
          }

          .mediqo-service-card p {
            min-height: auto;
          }

          .mediqo-footer-inner {
            align-items: flex-start;
            flex-direction: column;
          }

          .mediqo-footer-links {
            flex-wrap: wrap;
          }
        }


        /* Light/dark theme controls */
        .mediqo-theme-toggle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 11px 14px;
          border: 1px solid #d8e9e5;
          border-radius: 12px;
          background: #ffffff;
          color: #24534d;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
          transition: background .2s, color .2s, border-color .2s;
        }
        .mediqo-theme-toggle:hover { background: #eaf7f3; border-color: #a8d9ca; }
        .mediqo-app.dark-mode { background: #101a1b; color: #e5efed; }
        .mediqo-app.dark-mode .mediqo-header { background: rgba(16,26,27,.96); border-bottom-color: #293c3c; }
        .mediqo-app.dark-mode .mediqo-brand,
        .mediqo-app.dark-mode .mediqo-hero h1,
        .mediqo-app.dark-mode .mediqo-section-heading h2,
        .mediqo-app.dark-mode .mediqo-service-card h3,
        .mediqo-app.dark-mode .mediqo-step h3,
        .mediqo-app.dark-mode .mediqo-cta h2 { color: #e8f5f1; }
        .mediqo-app.dark-mode .mediqo-nav-links button { color: #c0d5cf; }
        .mediqo-app.dark-mode .mediqo-nav-links button:hover { color: #79dbc1; }
        .mediqo-app.dark-mode .mediqo-hero { background: radial-gradient(circle at 85% 20%, rgba(29,112,95,.28), transparent 32%), linear-gradient(120deg,#142322 0%,#101a1b 70%); }
        .mediqo-app.dark-mode .mediqo-highlight { color: #76d9bd; }
        .mediqo-app.dark-mode .mediqo-hero-description,
        .mediqo-app.dark-mode .mediqo-section-heading p,
        .mediqo-app.dark-mode .mediqo-service-card p,
        .mediqo-app.dark-mode .mediqo-step p,
        .mediqo-app.dark-mode .mediqo-cta p { color: #aec3bd; }
        .mediqo-app.dark-mode .mediqo-eyebrow { background: #1b3833; border-color: #315b50; color: #91e4cb; }
        .mediqo-app.dark-mode .mediqo-hero-art { background: linear-gradient(145deg,#1c3934,#1b2828); }
        .mediqo-app.dark-mode .mediqo-float-card { background: #20302f; border-color: #354946; color: #e3f1ed; }
        .mediqo-app.dark-mode .mediqo-float-card span[style] { color: #b5cbc4 !important; }
        .mediqo-app.dark-mode .mediqo-float-icon,
        .mediqo-app.dark-mode .mediqo-service-icon { background: #24483f; }
        .mediqo-app.dark-mode .mediqo-section { background: #101a1b; }
        .mediqo-app.dark-mode .mediqo-service-card { background: #172524; border-color: #2a403d; }
        .mediqo-app.dark-mode .mediqo-dark-section { background: #0b2221; }
        .mediqo-app.dark-mode .mediqo-step { background: #172524; border: 1px solid #2a403d; }
        .mediqo-app.dark-mode .mediqo-cta { background: linear-gradient(120deg,#17332e,#142322); }
        .mediqo-app.dark-mode .mediqo-theme-toggle { background: #20302f; border-color: #3a514b; color: #e3f4ee; }
        .mediqo-app.dark-mode .mediqo-theme-toggle:hover { background: #29443e; }
        .mediqo-app.dark-mode .mediqo-btn-light { background: #233b36; color: #a6ead5; }
        .mediqo-app.dark-mode .mediqo-btn-light:hover { background: #2d4b44; }
        .mediqo-app.dark-mode .mediqo-menu-button { background: #20302f; color: #9ce5d0; border-color: #3a514b; }
        .mediqo-app.dark-mode .mediqo-mobile-menu { background: #101a1b; }
        .mediqo-app.dark-mode .mediqo-mobile-menu button { color: #c0d5cf; }
        .mediqo-app.dark-mode .mediqo-text-link { color: #83dfc3; }
        .mediqo-app.dark-mode .mediqo-footer { background: #081b1a; border-top: 1px solid #293c3c; }
        @media (max-width: 560px) {
          .mediqo-nav-actions { gap: 6px; }
          .mediqo-theme-toggle { padding: 9px 10px; font-size: 12px; }
        }


        /* Public doctor and hospital directory */
        .mediqo-directory { padding: 82px 0; background: #f7fbf9; }
        .mediqo-directory-controls { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 12px; margin-bottom: 28px; }
        .mediqo-directory-controls input, .mediqo-directory-controls select {
          width: 100%; min-width: 0; padding: 13px 14px; border: 1px solid #dcebe5;
          border-radius: 12px; background: #fff; color: #244b46; outline: none;
        }
        .mediqo-directory-controls input:focus, .mediqo-directory-controls select:focus {
          border-color: #087f75; box-shadow: 0 0 0 3px rgba(8,127,117,.1);
        }
        .mediqo-directory-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 18px; }
        .mediqo-directory-card { padding: 23px; border: 1px solid #e2eeea; border-radius: 18px; background: #fff; box-shadow: 0 8px 25px rgba(22,71,62,.04); }
        .mediqo-directory-card h3 { margin: 0 0 7px; color: #204642; font-size: 18px; }
        .mediqo-directory-card p { color: #6b807c; font-size: 13px; line-height: 1.65; margin: 7px 0; }
        .mediqo-directory-meta { display: flex; flex-wrap: wrap; gap: 8px; margin: 13px 0; }
        .mediqo-directory-tag { display: inline-block; padding: 6px 9px; border-radius: 20px; background: #eaf8f2; color: #087f75; font-size: 11px; font-weight: 700; }
        .mediqo-directory-card .mediqo-btn { width: 100%; margin-top: 12px; }
        .mediqo-directory-card .mediqo-secondary-action { width:100%; margin-top:10px; padding:10px 14px; border:1px solid #cfe5dc; border-radius:11px; background:transparent; color:#087f75; font-weight:700; }
        .mediqo-directory-modal-backdrop { position:fixed; inset:0; z-index:1000; display:grid; place-items:center; padding:20px; background:rgba(5,25,23,.65); }
        .mediqo-directory-modal { width:min(560px,100%); max-height:85vh; overflow:auto; padding:28px; border-radius:22px; background:#fff; color:#173b3b; box-shadow:0 25px 80px rgba(0,0,0,.25); }
        .mediqo-directory-modal h2 { margin:8px 0 12px; color:#173b3b; }
        .mediqo-directory-modal p { color:#607873; line-height:1.7; }
        .mediqo-directory-modal-header { display:flex; align-items:center; justify-content:space-between; gap:16px; }
        .mediqo-directory-modal-close { border:0; border-radius:10px; padding:8px 12px; background:#eaf7f3; color:#087f75; font-weight:800; }
        .mediqo-app.dark-mode .mediqo-directory-card .mediqo-secondary-action { color:#9ce5d0; border-color:#3a6258; }
        .mediqo-app.dark-mode .mediqo-directory-modal { background:#172524; color:#e3f1ed; }
        .mediqo-app.dark-mode .mediqo-directory-modal h2 { color:#e8f5f1; }
        .mediqo-app.dark-mode .mediqo-directory-modal p { color:#aec3bd; }
        .mediqo-app.dark-mode .mediqo-directory-modal-close { background:#29443e; color:#a6ead5; }
        .mediqo-directory-status { padding: 22px; border-radius: 14px; background: #fff; border: 1px solid #e2eeea; color: #55716c; text-align: center; }
        .mediqo-directory-subheading { margin: 54px 0 22px; display:flex; align-items:end; justify-content:space-between; gap:15px; }
        .mediqo-directory-subheading h3 { margin:0; color:#173b3b; font-size:25px; }
        .mediqo-app.dark-mode .mediqo-directory { background:#142120; }
        .mediqo-app.dark-mode .mediqo-directory-card, .mediqo-app.dark-mode .mediqo-directory-status { background:#172524; border-color:#2a403d; color:#d5e6df; }
        .mediqo-app.dark-mode .mediqo-directory-card h3, .mediqo-app.dark-mode .mediqo-directory-subheading h3 { color:#e8f5f1; }
        .mediqo-app.dark-mode .mediqo-directory-card p { color:#aec3bd; }
        .mediqo-app.dark-mode .mediqo-directory-controls input, .mediqo-app.dark-mode .mediqo-directory-controls select { background:#20302f; color:#e3f1ed; border-color:#3a514b; }
        @media(max-width:850px) { .mediqo-directory-controls { grid-template-columns:repeat(2,minmax(0,1fr)); } .mediqo-directory-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
        @media(max-width:560px) { .mediqo-directory-controls, .mediqo-directory-grid { grid-template-columns:1fr; } .mediqo-directory-subheading { align-items:flex-start; flex-direction:column; } }

        .mediqo-footer-main { align-items: flex-start; padding-bottom: 30px; flex-wrap: wrap; }
        .mediqo-footer-brand-column { max-width: 270px; }
        .mediqo-footer-brand { color: white; }
        .mediqo-footer-brand-column p, .mediqo-footer-preferences p { line-height: 1.8; }
        .mediqo-footer-column { display: flex; flex-direction: column; align-items: flex-start; gap: 13px; }
        .mediqo-footer-column h3 { color: white; font-size: 14px; margin: 5px 0 3px; }
        .mediqo-footer-column button:not(.mediqo-theme-toggle) { border: 0; background: transparent; color: #d8e8e3; font-size: 13px; padding: 0; text-align: left; }
        .mediqo-footer-column button:hover, .mediqo-footer-top:hover { color: #9ce5d0; }
        .mediqo-footer-preferences { max-width: 220px; }
        .mediqo-footer-bottom { border-top: 1px solid rgba(255,255,255,.14); padding-top: 22px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 15px; }
        .mediqo-footer-bottom p { margin: 0; font-size: 12px; }
        .mediqo-footer-disclaimer { max-width: 480px; line-height: 1.7; }
        .mediqo-footer-top { border: 0; background: transparent; color: #9ce5d0; font-size: 12px; font-weight: 700; }
        @media (max-width: 560px) { .mediqo-footer-main { align-items: flex-start; flex-direction: column; gap: 28px; } .mediqo-footer-bottom { align-items: flex-start; flex-direction: column; } }
      `}</style>

      <header className="mediqo-header">
        <div className="mediqo-container">
          <nav className="mediqo-nav">
            <button
              type="button"
              className="mediqo-brand"
              onClick={() => scrollToSection("home")}
              aria-label="Mediqo home"
            >
              <span className="mediqo-logo">M</span>
              <span>Mediqo</span>
            </button>

            <div className="mediqo-nav-links">
              <button onClick={() => scrollToSection("home")}>Home</button>
              <button onClick={() => scrollToSection("directory")}>Find Doctors</button>
              <button onClick={() => scrollToSection("hospitals-section")}>Hospitals & Clinics</button>
              <button onClick={() => scrollToSection("services")}>Specialties</button>
              <button onClick={() => scrollToSection("stories-section")}>Health Stories</button>
            </div>

            <div className="mediqo-nav-actions">
              <button
                type="button"
                className="mediqo-theme-toggle"
                onClick={onToggleTheme}
                aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              >
                {theme === "light" ? "🌙 Dark" : "☀️ Light"}
              </button>
              {isLoggedIn ? (
                <>
                  <button
                    type="button"
                    className="mediqo-btn mediqo-btn-light"
                    onClick={() => window.alert("Your notifications will appear here.")}
                    aria-label="Notifications"
                    title="Notifications"
                  >
                    🔔 Notifications
                  </button>
                  <button
                    type="button"
                    className="mediqo-btn"
                    onClick={onOpenProfile}
                    aria-label="Open your profile"
                  >
                    👤 My Profile
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="mediqo-btn mediqo-btn-light"
                  onClick={onOpenAuth}
                >
                  Log in / Sign up
                </button>
              )}

              <button
                type="button"
                className="mediqo-menu-button"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
              >
                {menuOpen ? "×" : "☰"}
              </button>
            </div>
          </nav>

          {menuOpen && (
            <div className="mediqo-mobile-menu">
              <button onClick={() => scrollToSection("home")}>Home</button>
              <button onClick={() => scrollToSection("services")}>Services</button>
              <button onClick={() => scrollToSection("directory")}>Find Care</button>
              <button onClick={() => scrollToSection("how-it-works")}>
                How it works
              </button>
              <button onClick={() => scrollToSection("about")}>About</button>
              {isLoggedIn ? (
                <>
                  <button onClick={onOpenProfile}>👤 My Profile</button>
                  <button onClick={() => window.alert("Your notifications will appear here.")}>🔔 Notifications</button>
                </>
              ) : (
                <button onClick={onOpenAuth}>Log in / Sign up</button>
              )}
            </div>
          )}
        </div>
      </header>

      <main>
        <section className="mediqo-hero" id="home">
          <div className="mediqo-container mediqo-hero-grid">
            <div>
              <span className="mediqo-eyebrow">
                <span>✦</span> Healthcare made simpler
              </span>

              <h1>
                Your health deserves
                <br />
                the <span className="mediqo-highlight">right care.</span>
              </h1>

              <p className="mediqo-hero-description">
                Mediqo connects you to certified doctors, accredited hospitals, and modern clinics for seamless in-person and home healthcare consultations.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr)) auto",
                  gap: 8,
                  backgroundColor: theme === "dark" ? "#182b2d" : "#ffffff",
                  padding: 8,
                  borderRadius: 14,
                  boxShadow: "0 10px 30px rgba(18, 59, 69, 0.12)",
                  marginTop: 20,
                  marginBottom: 20,
                }}
              >
                <input
                  type="text"
                  placeholder="Doctor name or condition..."
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                  style={{
                    padding: "10px 12px",
                    border: "1px solid #dcebe5",
                    borderRadius: 8,
                    fontSize: 13,
                    outline: "none",
                    background: theme === "dark" ? "#203538" : "#fdfefe",
                    color: theme === "dark" ? "#e5efed" : "#123B45",
                  }}
                />
                <select
                  value={specializationFilter}
                  onChange={(e) => setSpecializationFilter(e.target.value)}
                  style={{
                    padding: "10px 12px",
                    border: "1px solid #dcebe5",
                    borderRadius: 8,
                    fontSize: 13,
                    outline: "none",
                    background: theme === "dark" ? "#203538" : "#fdfefe",
                    color: theme === "dark" ? "#e5efed" : "#123B45",
                  }}
                >
                  <option value="">All Specialties</option>
                  {specializations.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="City or facility..."
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  style={{
                    padding: "10px 12px",
                    border: "1px solid #dcebe5",
                    borderRadius: 8,
                    fontSize: 13,
                    outline: "none",
                    background: theme === "dark" ? "#203538" : "#fdfefe",
                    color: theme === "dark" ? "#e5efed" : "#123B45",
                  }}
                />
                <button
                  type="button"
                  className="mediqo-btn"
                  onClick={() => scrollToSection("directory")}
                  style={{ whiteSpace: "nowrap" }}
                >
                  🔍 Search Doctors
                </button>
              </div>

              <div className="mediqo-hero-actions">
                <button type="button" className="mediqo-btn" onClick={() => scrollToSection("directory")}>
                  Find a doctor <span>→</span>
                </button>
                <button
                  type="button"
                  className="mediqo-btn mediqo-btn-light"
                  onClick={() => scrollToSection("services")}
                >
                  Explore services
                </button>
              </div>

              <div className="mediqo-trust">
                <span>Easy appointment booking</span>
                <span>Personalized healthcare</span>
              </div>
            </div>

            <div className="mediqo-hero-art" aria-label="Healthcare illustration">
              <div className="mediqo-art-circle">✚</div>

              <div className="mediqo-float-card mediqo-float-one">
                <span className="mediqo-float-icon">🩺</span>
                <span>
                  Trusted care
                  <br />
                  <span style={{ color: "#6c817d", fontWeight: 500 }}>
                    For your family
                  </span>
                </span>
              </div>

              <div className="mediqo-float-card mediqo-float-two">
                <span className="mediqo-float-icon">📅</span>
                <span>
                  Easy booking
                  <br />
                  <span style={{ color: "#6c817d", fontWeight: 500 }}>
                    At your convenience
                  </span>
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mediqo-section" id="services">
          <div className="mediqo-container">
            <div className="mediqo-section-heading">
              <span className="mediqo-eyebrow">Our services</span>
              <h2>Healthcare that fits your life</h2>
              <p>
                Access essential healthcare services through one convenient
                platform designed around your needs.
              </p>
            </div>

            <div className="mediqo-service-grid">
              <article className="mediqo-service-card">
                <div className="mediqo-service-icon">🩺</div>
                <h3>Find a doctor</h3>
                <p>
                  Explore doctors by specialization and choose a healthcare
                  professional who suits your needs.
                </p>
                <button className="mediqo-text-link" onClick={() => scrollToSection("directory")}>
                  Find doctors →
                </button>
              </article>

              <article className="mediqo-service-card">
                <div className="mediqo-service-icon">📅</div>
                <h3>Book appointments</h3>
                <p>
                  Request appointments and manage your upcoming visits in one
                  convenient place.
                </p>
                <button className="mediqo-text-link" onClick={onOpenAuth}>
                  Book now →
                </button>
              </article>

              <article className="mediqo-service-card">
                <div className="mediqo-service-icon">🏠</div>
                <h3>Home visits</h3>
                <p>
                  Request a home visit when you need healthcare support without
                  travelling to a clinic.
                </p>
                <button className="mediqo-text-link" onClick={onOpenAuth}>
                  Request a visit →
                </button>
              </article>

              <article className="mediqo-service-card">
                <div className="mediqo-service-icon">📋</div>
                <h3>Digital prescriptions</h3>
                <p>
                  Access prescriptions and healthcare information shared with
                  you by your doctor.
                </p>
                <button className="mediqo-text-link" onClick={onOpenAuth}>
                  View records →
                </button>
              </article>

              <article className="mediqo-service-card">
                <div className="mediqo-service-icon">🔔</div>
                <h3>Appointment reminders</h3>
                <p>
                  Keep track of your visits and stay informed about your
                  appointment schedule.
                </p>
                <button className="mediqo-text-link" onClick={onOpenAuth}>
                  Get started →
                </button>
              </article>

              <article className="mediqo-service-card">
                <div className="mediqo-service-icon">🏥</div>
                <h3>Clinic coordination</h3>
                <p>
                  Connect with participating clinics and healthcare providers
                  through one platform.
                </p>
                <button className="mediqo-text-link" onClick={onOpenAuth}>
                  Get started →
                </button>
              </article>
            </div>
          </div>
        </section>


        <section className="mediqo-directory" id="directory">
          <div className="mediqo-container">
            <div className="mediqo-section-heading">
              <span className="mediqo-eyebrow">Explore healthcare</span>
              <h2>Find doctors & hospitals</h2>
              <p>Explore verified healthcare professionals and approved hospitals or clinics. You can browse without creating an account.</p>
            </div>

            <div className="mediqo-directory-controls">
              <input
                type="search"
                value={doctorSearch}
                onChange={(event) => setDoctorSearch(event.target.value)}
                placeholder="Search doctor, speciality or qualification"
                aria-label="Search doctors"
              />
              <select
                value={specializationFilter}
                onChange={(event) => setSpecializationFilter(event.target.value)}
                aria-label="Filter by speciality"
              >
                <option value="">All specialities</option>
                {specializations.map((specialization) => (
                  <option key={specialization} value={specialization}>{specialization}</option>
                ))}
              </select>
              <input
                type="text"
                value={cityFilter}
                onChange={(event) => setCityFilter(event.target.value)}
                placeholder="Filter by city"
                aria-label="Filter by city"
              />
              <input
                type="number"
                min="0"
                value={maxFeeFilter}
                onChange={(event) => setMaxFeeFilter(event.target.value)}
                placeholder="Maximum fee (₹)"
                aria-label="Maximum consultation fee"
              />
            </div>

            {directoryLoading ? (
              <div className="mediqo-directory-status">Loading doctors and hospitals...</div>
            ) : directoryError ? (
              <div className="mediqo-directory-status" role="alert">
                {directoryError}
                <p>Check that Django is running and the frontend can access the backend API.</p>
              </div>
            ) : (
              <>
                <div className="mediqo-directory-subheading" id="hospitals-section">
                  <div>
                    <h3>Verified doctors</h3>
                    <p>{filteredDoctors.length} doctor{filteredDoctors.length === 1 ? "" : "s"} found</p>
                  </div>
                  {(doctorSearch || specializationFilter || cityFilter || maxFeeFilter) && (
                    <button
                      type="button"
                      className="mediqo-text-link"
                      onClick={() => {
                        setDoctorSearch("");
                        setSpecializationFilter("");
                        setCityFilter("");
                        setMaxFeeFilter("");
                      }}
                    >
                      Clear filters
                    </button>
                  )}
                </div>

                {filteredDoctors.length === 0 ? (
                  <div className="mediqo-directory-status">
                    No doctors match your filters. Try changing your search.
                  </div>
                ) : (
                  <div className="mediqo-directory-grid">
                    {filteredDoctors.map((doctor) => (
                      <article className="mediqo-directory-card" key={doctor.id}>
                        <div className="mediqo-directory-meta">
                          <span className="mediqo-directory-tag">✓ Verified</span>
                          <span className="mediqo-directory-tag">{doctor.specialization}</span>
                        </div>
                        <h3>Dr. {doctor.name.replace(/^Dr\.\s*/i, "")}</h3>
                        <p>{doctor.qualification}</p>
                        <p>{doctor.experience_years} years of experience</p>
                        <p>{doctor.organizations.map((organization) => `${organization.name} · ${organization.city}`).join(" | ") || "Organization details unavailable"}</p>
                        <strong>₹{Number(doctor.consultation_fee).toLocaleString("en-IN")} consultation fee</strong>
                        <button
                          type="button"
                          className="mediqo-secondary-action"
                          onClick={() => setSelectedDoctor(doctor)}
                        >
                          View doctor details
                        </button>
                        <button
                          type="button"
                          className="mediqo-btn"
                          onClick={() => {
                            if (!isLoggedIn) {
                              onOpenAuth();
                            } else {
                              onBookDoctor(doctor);
                            }
                          }}
                        >
                          Book appointment →
                        </button>
                      </article>
                    ))}
                  </div>
                )}

                <div className="mediqo-directory-subheading" id="hospitals-section">
                  <div>
                    <h3>Hospitals & clinics</h3>
                    <p>{filteredHospitals.length} healthcare organization{filteredHospitals.length === 1 ? "" : "s"} found</p>
                  </div>
                </div>

                {filteredHospitals.length === 0 ? (
                  <div className="mediqo-directory-status">No approved hospitals or clinics found for this city.</div>
                ) : (
                  <div className="mediqo-directory-grid">
                    {filteredHospitals.map((hospital) => (
                      <article className="mediqo-directory-card" key={hospital.id}>
                        <div className="mediqo-directory-meta">
                          <span className="mediqo-directory-tag">{hospital.type}</span>
                          <span className="mediqo-directory-tag">{hospital.doctor_count} doctors</span>
                        </div>
                        <h3>{hospital.name}</h3>
                        <p>{hospital.address}, {hospital.city}, {hospital.state} {hospital.postal_code}</p>
                        <p><strong>Departments:</strong> {hospital.departments.length ? hospital.departments.join(", ") : "Not listed"}</p>
                        <button type="button" className="mediqo-secondary-action" onClick={() => setSelectedHospital(hospital)}>View hospital details</button>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {(selectedDoctor || selectedHospital) && (
          <div
            className="mediqo-directory-modal-backdrop"
            role="presentation"
            onClick={() => { setSelectedDoctor(null); setSelectedHospital(null); }}
          >
            <section
              className="mediqo-directory-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="mediqo-directory-modal-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mediqo-directory-modal-header">
                <span className="mediqo-eyebrow">Mediqo directory</span>
                <button type="button" className="mediqo-directory-modal-close" onClick={() => { setSelectedDoctor(null); setSelectedHospital(null); }} aria-label="Close details">✕</button>
              </div>
              {selectedDoctor && (
                <>
                  <div className="mediqo-directory-meta"><span className="mediqo-directory-tag">✓ Verified doctor</span><span className="mediqo-directory-tag">{selectedDoctor.specialization}</span></div>
                  <h2 id="mediqo-directory-modal-title">Dr. {selectedDoctor.name.replace(/^Dr\.\s*/i, "")}</h2>
                  <p><strong>Qualification:</strong> {selectedDoctor.qualification}</p>
                  <p><strong>Experience:</strong> {selectedDoctor.experience_years} years</p>
                  <p><strong>Consultation fee:</strong> ₹{Number(selectedDoctor.consultation_fee).toLocaleString("en-IN")}</p>
                  <p>{selectedDoctor.bio || "Additional doctor information has not been provided."}</p>
                  <p><strong>Associated hospitals/clinics:</strong> {selectedDoctor.organizations.map((org) => `${org.name} (${org.city})`).join(", ") || "Not listed"}</p>
                  <button
                    type="button"
                    className="mediqo-btn"
                    onClick={() => {
                      const doctor = selectedDoctor;
                      setSelectedDoctor(null);

                      if (!isLoggedIn) {
                        onOpenAuth();
                      } else if (doctor) {
                        onBookDoctor(doctor);
                      }
                    }}
                  >
                    Book appointment →
                  </button>
                </>
              )}
              {selectedHospital && (
                <>
                  <div className="mediqo-directory-meta"><span className="mediqo-directory-tag">{selectedHospital.type}</span><span className="mediqo-directory-tag">{selectedHospital.doctor_count} doctors</span></div>
                  <h2 id="mediqo-directory-modal-title">{selectedHospital.name}</h2>
                  <p><strong>Address:</strong> {selectedHospital.address}, {selectedHospital.city}, {selectedHospital.state} {selectedHospital.postal_code}</p>
                  <p><strong>Departments:</strong> {selectedHospital.departments.length ? selectedHospital.departments.join(", ") : "Not listed"}</p>
                  <p><strong>Listed doctors:</strong> {selectedHospital.doctor_count}</p>
                </>
              )}
            </section>
          </div>
        )}

                {/* Health Stories & Awareness Campaigns Section */}
        <section className="mediqo-section" id="stories-section" style={{ borderTop: "1px solid #e2eeea" }}>
          <div className="mediqo-container">
            <div className="mediqo-section-heading">
              <span className="mediqo-eyebrow">Health Awareness & Insights</span>
              <h2>Healthcare Updates & Patient Stories</h2>
              <p>Stay informed with verified health guidance, hospital announcements, and patient recovery journeys.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
              <article style={{ padding: 24, borderRadius: 16, backgroundColor: theme === "dark" ? "#172524" : "#ffffff", border: "1px solid #e2eeea", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, backgroundColor: "#eaf8f2", color: "#20A69A" }}>CAMPAIGN</span>
                <h3 style={{ margin: "14px 0 8px", fontSize: 18 }}>Cardiac Health Awareness 2026</h3>
                <p style={{ fontSize: 13, color: "#6b807c", lineHeight: 1.6 }}>
                  Learn how early hypertension screening and preventive consultations dramatically reduce cardiovascular risk.
                </p>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#20A69A", marginTop: 12 }}>Metropolis General Hospital • Community Health</div>
              </article>

              <article style={{ padding: 24, borderRadius: 16, backgroundColor: theme === "dark" ? "#172524" : "#ffffff", border: "1px solid #e2eeea", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, backgroundColor: "#fff1ec", color: "#FF9B71" }}>FACILITY UPDATE</span>
                <h3 style={{ margin: "14px 0 8px", fontSize: 18 }}>24/7 Pediatrics Wing Expansion</h3>
                <p style={{ fontSize: 13, color: "#6b807c", lineHeight: 1.6 }}>
                  Saint Mary Health has added 12 new child care observation suites and expanded round-the-clock nursing care.
                </p>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#20A69A", marginTop: 12 }}>Saint Mary Health • Hospital Administration</div>
              </article>

              <article style={{ padding: 24, borderRadius: 16, backgroundColor: theme === "dark" ? "#172524" : "#ffffff", border: "1px solid #e2eeea", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, backgroundColor: "#eaf8f2", color: "#20A69A" }}>SUCCESS STORY</span>
                <h3 style={{ margin: "14px 0 8px", fontSize: 18 }}>&quot;Quick booking saved my recovery time&quot;</h3>
                <p style={{ fontSize: 13, color: "#6b807c", lineHeight: 1.6 }}>
                  &quot;Finding a verified cardiologist and booking within 2 minutes allowed me to get timely intervention and care.&quot;
                </p>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#6b807c", marginTop: 12 }}>- Verified Patient (Explicit Consent Documented)</div>
              </article>
            </div>
          </div>
        </section>

        <section className="mediqo-dark-section" id="about">
          <div className="mediqo-container mediqo-dark-grid">
            <div>
              <span className="mediqo-dark-badge">Care, without the hassle</span>
              <h2>Healthcare management, all in one place.</h2>
              <p>
                Mediqo helps patients and healthcare providers coordinate
                appointments and access relevant information more conveniently.
              </p>

              <div className="mediqo-benefit-list">
                <div className="mediqo-benefit">
                  <span>✓</span>
                  <div>Manage appointment requests in one place.</div>
                </div>
                <div className="mediqo-benefit">
                  <span>✓</span>
                  <div>Keep track of prescriptions and visit information.</div>
                </div>
                <div className="mediqo-benefit">
                  <span>✓</span>
                  <div>Connect patients with participating healthcare providers.</div>
                </div>
              </div>

              <button type="button" className="mediqo-btn" onClick={onOpenAuth}>
                Get started <span>→</span>
              </button>
            </div>

            <div>
              <div
                style={{
                  minHeight: 310,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 28,
                  background:
                    "linear-gradient(145deg, rgba(255,255,255,.1), rgba(137,222,195,.12))",
                  border: "1px solid rgba(255,255,255,.13)",
                  textAlign: "center",
                  padding: 30,
                }}
              >
                <div>
                  <div style={{ fontSize: 75, marginBottom: 15 }}>💚</div>
                  <h3 style={{ fontSize: 25, margin: "0 0 10px" }}>
                    Better organized care
                  </h3>
                  <p style={{ margin: 0 }}>
                    A simpler way to manage your healthcare journey.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mediqo-section" id="how-it-works">
          <div className="mediqo-container">
            <div className="mediqo-section-heading">
              <span className="mediqo-eyebrow">Simple process</span>
              <h2>Getting started is easy</h2>
              <p>
                Three simple steps to begin organizing your healthcare
                appointments with Mediqo.
              </p>
            </div>

            <div className="mediqo-steps-grid">
              <article className="mediqo-step">
                <div className="mediqo-step-number">01</div>
                <h3>Create your account</h3>
                <p>
                  Sign up with your name, phone number, email address, and
                  password.
                </p>
              </article>

              <article className="mediqo-step">
                <div className="mediqo-step-number">02</div>
                <h3>Choose your service</h3>
                <p>
                  Explore available healthcare services and select what you
                  need.
                </p>
              </article>

              <article className="mediqo-step">
                <div className="mediqo-step-number">03</div>
                <h3>Manage your care</h3>
                <p>
                  Access your account to manage appointments and relevant
                  healthcare information.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="mediqo-cta">
          <div className="mediqo-container">
            <h2>Make your healthcare journey simpler.</h2>
            <p>
              Get started with Mediqo and keep your healthcare information
              organized.
            </p>
            <button type="button" className="mediqo-btn" onClick={onOpenAuth}>
              Create your account <span>→</span>
            </button>
          </div>
        </section>
      </main>

      <footer className="mediqo-footer">
        <div className="mediqo-container">
          <div className="mediqo-footer-inner mediqo-footer-main">
            <div className="mediqo-footer-brand-column">
              <button type="button" className="mediqo-brand mediqo-footer-brand" onClick={() => scrollToSection("home")}>
                <span className="mediqo-logo" style={{ background: "#2b9d8f" }}>M</span>
                <span>Mediqo</span>
              </button>
              <p>Making healthcare simpler, more accessible, and easier to manage. Your healthcare journey, organized in one place.</p>
            </div>
            <div className="mediqo-footer-column">
              <h3>Explore</h3>
              <button onClick={() => scrollToSection("home")}>Home</button>
              <button onClick={() => scrollToSection("services")}>Our services</button>
              <button onClick={() => scrollToSection("how-it-works")}>How it works</button>
              <button onClick={() => scrollToSection("about")}>About Mediqo</button>
            </div>
            <div className="mediqo-footer-column">
              <h3>Patient resources</h3>
              <button onClick={onOpenAuth}>Create an account</button>
              <button onClick={onOpenAuth}>Sign in</button>
              <button onClick={isLoggedIn ? onOpenProfile : onOpenAuth}>Manage your profile</button>
            </div>
            <div className="mediqo-footer-column mediqo-footer-preferences">
              <h3>Display preferences</h3>
              <p>Choose the appearance that feels comfortable for you.</p>
              <button type="button" className="mediqo-theme-toggle" onClick={onToggleTheme}>
                {theme === "light" ? "🌙 Enable dark mode" : "☀️ Enable light mode"}
              </button>
            </div>
          </div>
          <div className="mediqo-footer-bottom">
            <p>© {new Date().getFullYear()} Mediqo. All rights reserved.</p>
            <p className="mediqo-footer-disclaimer">Mediqo supports healthcare coordination and appointment management. It does not replace professional medical advice, diagnosis, or emergency medical services.</p>
            <button className="mediqo-footer-top" onClick={() => scrollToSection("home")}>Back to top ↑</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
