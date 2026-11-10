# Mediqo — Modern Healthcare Management & Appointment Platform

Mediqo is a multi-tenant healthcare platform connecting Patients, Doctors, Nurses, Hospitals, Clinics, and Platform Administrators. It provides streamlined doctor discovery, facility exploration, verified appointment booking with race-condition prevention, clinical nurse stations, digital prescription issuance, and complete organization management.

---

## 🌟 Key Features

- **Public Healthcare Portal**:
  - Multi-criteria doctor and specialty search (Name, Specialization, Hospital, City, Fee).
  - Hospital and clinical department discovery.
  - Doctor public profile with credentials, verified licenses, hospital affiliations, and direct booking.
  - Health awareness campaigns and facility updates.

- **Patient Portal**:
  - Live health dashboard with upcoming visits and statistics.
  - 9-step appointment booking flow with real-time slot calculation.
  - Appointment history with status tabs (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`).
  - Secure patient appointment cancellation.
  - Digital prescription viewer with medication dosage instructions.
  - Profile and contact management.

- **Doctor Dashboard**:
  - Overview of daily consultations and statistics.
  - Appointment decision workflows (Accept, Reject, Complete).
  - Multi-shift weekly availability management per organization and branch.
  - Patient records and consultation histories.
  - Digital prescription generation with diagnosis and medication items.

- **Nurse Station Dashboard**:
  - Department assignments and daily patient queues.
  - Care task management with vital signs triage recording (BP, Pulse, Temperature, SpO2).
  - Weekly shift roster tracking.
  - Clinical observation and handover notes.

- **Organization Admin Portal**:
  - Branch and department management.
  - Doctor provisioning, department assignments, and status controls.
  - Registered nurse provisioning and license verification tracking.
  - Facility-wide appointment monitoring.
  - Availability schedule coordination.

- **Super Admin Platform Governance**:
  - Review and approve/reject hospital and clinic applications.
  - Doctor and nurse credential verification toggles.
  - Platform-wide statistics and user management.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Lucide Icons
- **Backend**: Python 3.12, Django 5.x, Django REST Framework
- **Authentication**: Supabase Auth (JWT Bearer Token verification)
- **Database**: PostgreSQL (Supabase Hosted)
- **Design System**: Custom centralized healthcare design tokens with Light and Dark theme modes

---

## 📁 Repository Structure

```
mediQO/
├── backend/
│   ├── config/              # Django project settings & WSGI/ASGI
│   ├── core/                # Core application (models, views, serializers, urls, tests)
│   ├── manage.py
│   ├── requirements.txt     # Python backend dependencies
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/             # Application entry and routing
│   │   ├── features/        # Feature modules (auth, patient, doctors, nurse, organization, superadmin, appointments)
│   │   ├── lib/             # Supabase client and auth helpers
│   │   ├── styles/          # Design system tokens and themes
│   │   ├── LandingPage.tsx  # Public landing page
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── .env.example
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (v3.10+)
- [Supabase](https://supabase.com/) Account & Project

---

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your PostgreSQL database credentials and Supabase keys

# Run database migrations
python manage.py migrate

# Start the Django development server
python manage.py runserver 8000
```

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY

# Start Vite dev server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🧪 Testing

### Run Backend Automated Tests
```bash
cd backend
python manage.py test core --keepdb
```

### Build Frontend Production Assets
```bash
cd frontend
npm run build
```
