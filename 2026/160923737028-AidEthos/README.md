# AidEthos — Major Project Build

Hybrid volunteer–NGO matching with TF-IDF + Sentence-Transformers (`all-MiniLM-L6-v2`), task location/map links, task date/time, volunteer availability indicators, and a more transparent NGO credibility score.

## Features
- Keeps the existing HTML/CSS visual design and existing SQLite database (`aidethos.db`).
- Hybrid skill similarity: `0.4 × TF-IDF cosine + 0.6 × MiniLM cosine`; urgency is kept separate and controls crisis ordering, not the match percentage.
- Task location and optional Google Maps link; if no link is entered, a Google Maps search link is generated from the task location.
- Task start/end date and time fields.
- Volunteer status: Available, Busy, or Unavailable. Only Available volunteers appear in NGO crisis matching.
- NGO credibility combines verification status, rating evidence, completed tasks, posted crises, and volunteer activity. New NGOs start at a neutral 5/10; IDs do not influence the score.
- Existing database is migrated additively on startup; existing records are not intentionally dropped or reset.

## Run on Windows (PowerShell)
1. Extract this folder and open it in VS Code.
2. Install Python 3.11 (recommended) or 3.10. Avoid including a copied `venv` from another machine.
3. In terminal, from the `AidEthos-Updated` folder:

```powershell
py -3.11 -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

4. Keep that terminal running. In a second terminal:

```powershell
cd frontend
python -m http.server 5500
```

5. Open `http://localhost:5500` in your browser. API docs: `http://127.0.0.1:8000/docs`.

## First model run
The first semantic-matching request downloads `all-MiniLM-L6-v2` from Hugging Face and may take a few minutes. After that, it is cached locally. If the model cannot load (for example, no internet on first run), the API logs a warning and temporarily falls back to TF-IDF matching rather than crashing.

## Demo account
The existing database is retained. If the original database contains the bundled demo account, use the same credentials from the mini-project. New seed data is only created when the database has no NGO records.

## Database note
Startup adds the new fields (`availability_status`, task schedule, map URL, NGO verification/rating/activity fields) to the existing SQLite schema where missing. Make a copy of `aidethos.db` before running if it contains data you cannot replace.
