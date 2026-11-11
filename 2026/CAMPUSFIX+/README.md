<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=32&duration=3000&pause=1000&color=6366F1&center=true&vCenter=true&width=600&lines=🏫+CampusFix%2B;Smart+Campus+Maintenance;Report.+Track.+Resolve." alt="Typing SVG" />

<br/>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-8.3.5-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-4.3.3-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/React_Router-7.18.5-CA4245?style=for-the-badge&logo=react-router&logoColor=white" />
  <img src="https://img.shields.io/badge/Recharts-3.10.1-22C55E?style=for-the-badge&logo=chartdotjs&logoColor=white" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Prototype-F59E0B?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-8B5CF6?style=for-the-badge" />
  <img src="https://img.shields.io/github/stars/MohammedFaizan10/CampusFix-?style=for-the-badge&color=FFD700" />
  <img src="https://img.shields.io/github/last-commit/MohammedFaizan10/CampusFix-?style=for-the-badge&color=10B981" />
</p>

<br/>

> **CampusFix+** is a full-stack campus infrastructure complaint management system designed to digitise, streamline, and intelligently manage facility maintenance across university campuses. Students submit issues, admins triage and assign, and maintenance staff resolve — all in one unified platform.

<br/>

[🚀 Live Demo](#-quick-start) · [📸 Screenshots](#-screenshots) · [🎭 Demo Accounts](#-demo-accounts) · [🗺️ Roadmap](#-future-modules--roadmap)

---

</div>

## 📋 Table of Contents

- [✨ What is CampusFix+?](#-what-is-campusfix)
- [🎯 The Problem We Solve](#-the-problem-we-solve)
- [🏗️ Architecture Overview](#️-architecture-overview)
- [👥 User Roles](#-user-roles)
- [🔄 Complaint Lifecycle](#-complaint-lifecycle)
- [⚡ Features](#-features)
- [🎭 Demo Accounts](#-demo-accounts)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [📁 Project Structure](#-project-structure)
- [🗺️ Future Modules & Roadmap](#️-future-modules--roadmap)
- [🤝 Contributing](#-contributing)

---

## ✨ What is CampusFix+?

CampusFix+ is a **role-based campus maintenance complaint portal** built as a research prototype for university environments. It provides a structured workflow for:

| 🎓 Students | 🛡️ Admins | 🔧 Staff |
|------------|-----------|---------|
| Submit detailed complaints with photo evidence | Triage, prioritize & assign tasks | Receive work orders with full context |
| 4-step guided submission form | Manage staff workforce & workload | Update progress in real time |
| Track resolution status in real time | Analytics & performance dashboards | Mark tasks as resolved |
| Verify resolution quality | Reject invalid complaints with reason | View full complaint history |
| View complaint history & reports | Export complaint data to CSV | Communication thread per task |

---

## 🎯 The Problem We Solve

```
❌  BEFORE CampusFix+              ✅  AFTER CampusFix+
─────────────────────────          ────────────────────────────
WhatsApp groups & notice boards    Structured digital submission
No tracking after submission       Real-time status tracking
Wrong department routing           Smart category-based assignment
No accountability                  Staff assignment + SLA tracking
Manual paper logs                  Analytics & reporting dashboards
Students in the dark               Push notifications at every step
```

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    CampusFix+ Frontend                  │
│                   React 19 + Vite 8                     │
├──────────────┬──────────────────┬───────────────────────┤
│  Public Pages│   Auth System    │   Protected Dashboards │
│  Landing     │  Login/Register  │  Student / Admin /    │
│  Features    │  Role-based JWT  │  Staff Role Views     │
│  Roadmap     │  Context API     │  Analytics & Reports  │
└──────────────┴──────────────────┴───────────────────────┘
         │                                    │
         ▼                                    ▼
  TailwindCSS v4             Recharts + Lucide Icons
  Design System              Data Visualisation Layer
         │                                    │
         └────────────────┬───────────────────┘
                          ▼
              React Router v7 (Client-Side)
              Protected Routes + Role Guards
                          │
                          ▼
           Mock Data Layer (Prototype Phase)
           ┌─ mockComplaints.js
           ├─ mockUsers.js
           └─ services/ (API-ready structure)
```

---

## 👥 User Roles

### 🎓 Student Portal
- Submit complaints via **4-step guided form** (Issue → Location → Evidence → Review)
- Upload photo evidence (up to 5 images)
- Track complaint lifecycle with real-time status timeline
- Comment thread with admin/staff
- Dashboard with charts showing complaint history

### 🛡️ Admin Portal
- **Full complaint queue** with filtering, sorting & bulk actions
- **Staff assignment panel** — assign complaints to specific maintenance staff
- **Internal notes** — private admin-only communication
- **Priority management** — set Critical / High / Medium / Low
- **User management** — create staff accounts
- **Analytics dashboard** — complaint trends, resolution rates, SLA heatmaps
- Reject complaints with structured reason

### 🔧 Staff Portal
- **My Tasks** — view all assigned work orders
- **Action console** — update progress, request help, mark resolved
- **Priority task alerts** — urgent complaints highlighted
- **History** — full resolved task archive
- Workload chart showing task distribution

---

## 🔄 Complaint Lifecycle

```
  STUDENT                    ADMIN                      STAFF
    │                          │                          │
    ▼                          │                          │
 SUBMITTED ──────────────► UNDER_REVIEW                  │
                               │                          │
                               ├─ Reject ──► REJECTED     │
                               │                          │
                               ▼                          │
                           ASSIGNED ──────────────────► (notified)
                                                          │
                                                          ▼
                                                     IN_PROGRESS
                                                          │
                                                          ▼
                                                       RESOLVED
                                                          │
  STUDENT                                                 │
    │ ◄──────────────────────────────────────────────────┘
    ▼
 VERIFIED ✅  or  REOPENED 🔄
```

**8 lifecycle states:** `SUBMITTED` → `UNDER_REVIEW` → `ASSIGNED` → `IN_PROGRESS` → `RESOLVED` → `VERIFIED` / `REOPENED` / `REJECTED`

---

## ⚡ Features

<details>
<summary><b>🏠 Public Landing Page</b></summary>

- Animated hero section with live stats
- Interactive features showcase
- How It Works walkthrough
- Tech stack diagram
- Research modules roadmap preview
- Demo accounts panel for quick login

</details>

<details>
<summary><b>📝 Smart Complaint Submission (4 Steps)</b></summary>

- **Step 1 — Issue:** Category selector (9 types), title, description, priority
- **Step 2 — Location:** Campus block, building, floor, room, landmark
- **Step 3 — Evidence:** Drag-and-drop image upload with preview gallery
- **Step 4 — Review:** Full summary before final submission
- Form state persisted across steps

</details>

<details>
<summary><b>📊 Analytics Dashboards</b></summary>

- Complaint volume by category (bar charts)
- Status distribution (pie/donut charts)
- Monthly trend lines (area charts)
- Staff workload comparison (bar charts)
- Priority distribution overview
- CSV export functionality

</details>

<details>
<summary><b>🎨 UI Design System</b></summary>

- 20+ reusable UI components
- Consistent color-coded status badges
- Priority badges (Critical/High/Medium/Low)
- Responsive sidebar + mobile drawer navigation
- Skeleton loading states
- Toast notification system
- Modal dialogs & confirmation flows

</details>

<details>
<summary><b>🔐 Auth & Security</b></summary>

- Role-based access control (Student / Admin / Staff)
- Protected routes with role guards
- Password strength meter on registration
- JWT-ready auth service structure
- Context API for auth state management

</details>

---

## 🎭 Demo Accounts

> Try the app instantly — no sign-up required. Use these credentials on the Login page.

| Role | Email | Password | Access |
|------|-------|----------|--------|
| 🎓 **Student** | `arjun.mehta@student.campusfix.edu` | `student123` | Submit & track complaints |
| 🎓 **Student** | `sneha.rao@student.campusfix.edu` | `student123` | Submit & track complaints |
| 🛡️ **Admin** | `vikram.anand@admin.campusfix.edu` | `admin123` | Full admin dashboard |
| 🔧 **Staff** | `ravi.shankar@staff.campusfix.edu` | `staff123` | Electrical dept tasks |
| 🔧 **Staff** | `idris.m@staff.campusfix.edu` | `staff123` | IT/Network tasks |

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **UI Framework** | React | 19.3.1 |
| **Build Tool** | Vite | 8.3.5 |
| **Styling** | Tailwind CSS | 4.3.3 |
| **Routing** | React Router DOM | 7.18.5 |
| **Charts** | Recharts | 3.10.1 |
| **Icons** | Lucide React | 1.63.0 |
| **HTTP Client** | Axios | 1.21.0 |
| **Fonts** | Fontsource Inter | 5.3.0 |
| **Linter** | Oxlint | 1.89.0 |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ 
- **npm** v9+

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/MohammedFaizan10/CampusFix-.git
cd CampusFix-/campusfix-plus

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The app will be live at **[http://localhost:5173](http://localhost:5173)** 🎉

### Available Scripts

```bash
npm run dev       # Start dev server with HMR
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # Run Oxlint linter
```

---

## 📁 Project Structure

```
campusfix-plus/
├── 📄 index.html
├── ⚙️  vite.config.js
├── 📦 package.json
└── src/
    ├── 🎨 App.jsx                    # Root app with router
    ├── 🎨 index.css                  # Global styles + Tailwind
    ├── 🧩 components/
    │   ├── common/                   # Shared utilities
    │   │   ├── NavIcon.jsx
    │   │   └── PasswordStrengthMeter.jsx
    │   ├── layout/                   # App shell components
    │   │   ├── DashboardLayout.jsx   # Main authenticated layout
    │   │   ├── Sidebar.jsx           # Desktop nav sidebar
    │   │   ├── Topbar.jsx            # Top navigation bar
    │   │   ├── MobileDrawer.jsx      # Mobile nav drawer
    │   │   ├── Navbar.jsx            # Public page navbar
    │   │   ├── Footer.jsx
    │   │   ├── NotificationDropdown.jsx
    │   │   └── UserMenu.jsx
    │   └── ui/                       # 20+ reusable UI components
    │       ├── Button.jsx, Input.jsx, Modal.jsx
    │       ├── Badge.jsx, StatusBadge.jsx, PriorityBadge.jsx
    │       ├── Table.jsx, Pagination.jsx, Tabs.jsx
    │       ├── StatCard.jsx, Card.jsx, Avatar.jsx
    │       ├── Toast.jsx, Skeleton.jsx, Tooltip.jsx
    │       └── EmptyState.jsx, ErrorState.jsx ...
    ├── 📋 constants/                 # App-wide enums & metadata
    │   ├── roles.js                  # STUDENT / ADMIN / STAFF
    │   ├── statuses.js               # 8 complaint lifecycle states
    │   ├── categories.js             # 9 complaint categories
    │   ├── priorities.js             # Critical/High/Medium/Low
    │   ├── campus.js                 # Buildings & locations
    │   └── navigation.js             # Sidebar nav config
    ├── 🔐 context/
    │   └── AuthContext.jsx           # Auth state + role management
    ├── 🎣 hooks/
    │   ├── useAuth.js                # Auth hook
    │   └── useToast.jsx              # Toast notification hook
    ├── 📊 data/
    │   ├── mockComplaints.js         # Prototype complaint data
    │   ├── mockUsers.js              # Demo user accounts
    │   └── modules.js                # Research module registry
    ├── 🌐 services/                  # API layer (production-ready structure)
    │   ├── apiClient.js              # Axios instance
    │   ├── authService.js            # Auth endpoints
    │   ├── complaintService.js       # Complaint CRUD
    │   ├── notificationService.js    # Notification endpoints
    │   └── userService.js            # User management
    ├── 🛤️  routes/
    │   ├── index.jsx                 # Route definitions
    │   ├── ProtectedRoute.jsx        # Auth guard
    │   └── RoleRoute.jsx             # Role-based guard
    ├── 🛠️  utils/
    │   ├── exportCsv.js              # CSV export utility
    │   └── sla.js                   # SLA calculation helpers
    └── 📄 pages/
        ├── public/                   # Landing, Login, Register, etc.
        ├── student/                  # Student dashboard, complaints, report
        │   └── components/
        │       ├── report/           # 4-step submission wizard
        │       └── detail/           # Complaint detail view
        ├── admin/                    # Admin dashboard, queue, analytics
        │   └── components/detail/    # Admin action panel
        ├── staff/                    # Staff tasks, dashboard, history
        │   └── components/detail/    # Staff action console
        ├── modules/                  # Research modules showcase
        └── system/                   # Design system explorer
```

---

## 🗺️ Future Modules & Roadmap

CampusFix+ is designed as an extensible research platform. The following AI/IoT modules are planned:

### 🤖 Intelligence Layer
| Module | Description | Phase |
|--------|-------------|-------|
| **AI Complaint Classification** | NLP (BERT) auto-categorisation of complaint text | Phase 1 |
| **Computer Vision Damage Classifier** | CNN (MobileNetV3) damage assessment from photos | Phase 1 |
| **Duplicate Complaint Detection** | Sentence-BERT semantic similarity to merge duplicates | Phase 1 |
| **Predictive Maintenance Forecasting** | Weibull survival analysis for failure prediction | Phase 2 |

### 🏗️ Infrastructure Layer
| Module | Description | Phase |
|--------|-------------|-------|
| **Indoor Campus Map** | SVG interactive floor plan picker | Phase 2 |
| **Smart IoT Monitoring** | ESP32 + LoRaWAN sensor mesh for water/bins/HVAC | Phase 2 |
| **Energy Management Dashboard** | Smart meter analytics + anomaly detection | Phase 3 |
| **Water Usage & Leak Monitoring** | Flow-meter telemetry + minimum-night-flow analysis | Phase 2 |

### 🤝 Community Layer
| Module | Description | Phase |
|--------|-------------|-------|
| **Campus Safety Reporting** | Anonymous safety incident channel | Phase 3 |
| **CampusConnect Forum** | Location-anchored student discussion board | Phase 3 |
| **Campus Events & Venue Booking** | Venue reservation + post-event damage reports | Phase 3 |
| **Lost & Found Registry** | TF-IDF item matching with claim workflow | Phase 3 |

### 📈 Insights Layer
| Module | Description | Phase |
|--------|-------------|-------|
| **Advanced Analytics & Reporting** | SLA heatmaps, root-cause clustering, PDF export | Phase 2 |
| **Knowledge Hub & Self-Service** | BM25 article search to deflect minor complaints | Phase 2 |
| **Sustainability & Green Campus Reports** | Carbon footprint tracking + accreditation reports | Phase 3 |
| **Digital Campus Twin** | 2D live map with IoT + complaint overlays | Phase 3+ |

---

## 🤝 Contributing

Contributions, suggestions, and feedback are welcome!

```bash
# Fork the repo, then:
git checkout -b feature/your-feature-name
git commit -m "feat: add your feature"
git push origin feature/your-feature-name
# Open a Pull Request 🎉
```

---

<div align="center">

**Built with ❤️ for smarter campuses**

<br/>

⭐ **Star this repo** if you find it useful — it helps others discover it!

<br/>

[![GitHub](https://img.shields.io/badge/GitHub-MohammedFaizan10-181717?style=for-the-badge&logo=github)](https://github.com/MohammedFaizan10/CampusFix-)

</div>

