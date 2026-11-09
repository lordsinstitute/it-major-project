"""Hybrid lexical + semantic volunteer matching; urgency is intentionally separate."""
from __future__ import annotations
from datetime import date, datetime
from typing import List
import logging
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

log = logging.getLogger(__name__)
SEMANTIC_WEIGHT = 0.60
LEXICAL_WEIGHT = 0.40
_model = None
_model_attempted = False

def _get_model():
    global _model, _model_attempted
    if not _model_attempted:
        _model_attempted = True
        try:
            from sentence_transformers import SentenceTransformer
            _model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        except Exception as exc:
            log.exception("SentenceTransformer unavailable; using lexical-only fallback: %s", exc)
            _model = None
    return _model

def _urgency_score(level: int, deadline) -> float:
    level_s = (max(1, min(10, int(level or 1))) - 1) / 9.0
    if not deadline: prox = 0.0
    else:
        if isinstance(deadline, str):
            try: deadline = date.fromisoformat(deadline[:10])
            except ValueError: deadline = None
        if not deadline: prox = 0.0
        else:
            days = (deadline - datetime.utcnow().date()).days
            prox = 1.0 if days <= 0 else (0.0 if days >= 30 else 1.0 - days / 30)
    return round(0.6 * level_s + 0.4 * prox, 6)

def _skills_text(value: str) -> str:
    return " ".join(t.strip().lower().replace("_", " ") for t in (value or "").split(",") if t.strip())

def _crisis_text(c) -> str:
    return f"{_skills_text(c.required_skills)}. {c.title or ''}. {c.description or ''}"

def _hybrid_scores(texts_a: list[str], texts_b: list[str]) -> list[float]:
    corpus = texts_a + texts_b
    try:
        vec = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
        mat = vec.fit_transform(corpus)
        lex = cosine_similarity(mat[:len(texts_a)], mat[len(texts_a):])
    except ValueError:
        lex = [[0.0 for _ in texts_b] for _ in texts_a]
    model = _get_model()
    if model is None:
        return [float(x) for x in lex[0]] if len(texts_a) == 1 else [float(lex[i][i]) for i in range(len(texts_a))]
    try:
        emb = model.encode(corpus, normalize_embeddings=True, convert_to_numpy=True, show_progress_bar=False)
        sem = cosine_similarity(emb[:len(texts_a)], emb[len(texts_a):])
        if len(texts_a) == 1:
            return [max(0.0, min(1.0, LEXICAL_WEIGHT * float(lex[0][j]) + SEMANTIC_WEIGHT * max(0.0, float(sem[0][j])))) for j in range(len(texts_b))]
        return [max(0.0, min(1.0, LEXICAL_WEIGHT * float(lex[i][i]) + SEMANTIC_WEIGHT * max(0.0, float(sem[i][i])))) for i in range(min(len(texts_a), len(texts_b)))]
    except Exception:
        log.exception("Semantic scoring failed; using TF-IDF fallback")
        return [float(x) for x in lex[0]] if len(texts_a)==1 else [float(lex[i][i]) for i in range(len(texts_a))]

def calculate_credibility(ngo, crisis_count: int, volunteer_count: int) -> float:
    """Transparent 0–10 score from verification, feedback, and demonstrated activity."""
    verified_points = 2.0 if getattr(ngo, "is_verified", False) else 0.0
    rating = float(getattr(ngo, "average_rating", 0) or 0)
    rating_points = (rating / 5.0) * 4.0 if rating > 0 else 0.0
    rating_confidence = min(1.0, (getattr(ngo, "rating_count", 0) or 0) / 5.0)
    rating_points *= rating_confidence
    activity_points = min(2.0, max(0, crisis_count) * 0.25 + max(0, volunteer_count) * 0.05)
    completed_points = min(2.0, max(0, getattr(ngo, "completed_tasks", 0) or 0) * 0.2)
    # New NGOs receive a neutral baseline; no arbitrary points from IDs.
    return round(min(10.0, 5.0 + verified_points + rating_points + activity_points + completed_points), 1)

def _crisis_dict(c, score: float) -> dict:
    return {"id":c.id,"ngo_id":c.ngo_id,"ngo_name":c.ngo_name,"ngo_location":getattr(c,"ngo_location",None),"title":c.title,"crisis_type":c.crisis_type,"description":c.description,"required_skills":c.required_skills,"urgency_level":c.urgency_level,"location":c.location,"location_url":getattr(c,"location_url",None),"deadline":str(c.deadline) if c.deadline else None,"task_start":str(c.task_start) if getattr(c,"task_start",None) else None,"task_end":str(c.task_end) if getattr(c,"task_end",None) else None,"contact_phone":c.contact_phone,"contact_email":c.contact_email,"is_active":c.is_active,"created_at":str(c.created_at),"match_score":round(score,4),"urgency_score":_urgency_score(c.urgency_level,c.deadline),"credibility_score":getattr(c,"credibility_score",5.0),"volunteer_count":getattr(c,"volunteer_count",None)}
def _vol_dict(v, score: float) -> dict:
    return {"id":v.id,"name":v.name,"phone":v.phone,"email":v.email,"location":v.location,"skills":v.skills,"availability_status":getattr(v,"availability_status","Available"),"availability_notes":getattr(v,"availability_notes",None),"crisis_id":v.crisis_id,"created_at":str(v.created_at),"match_score":round(score,4)}
def match_volunteer_to_crises(volunteer_skills: str, crises: List, availability_status="Available") -> List[dict]:
    eligible=[c for c in crises if getattr(c,"is_active",True)]
    if not eligible: return []
    text=_skills_text(volunteer_skills)
    scores=_hybrid_scores([text],[_crisis_text(c) for c in eligible])
    results=[_crisis_dict(c,scores[i]) for i,c in enumerate(eligible)]
    # Urgency controls order only; it is not blended into match percentage.
    results.sort(key=lambda x:(x["urgency_score"],x["match_score"]),reverse=True)
    return results
def match_crisis_to_volunteers(crisis, volunteers: List) -> List[dict]:
    eligible=[v for v in volunteers if (getattr(v,"availability_status","Available") or "Available").lower()=="available"]
    if not eligible: return []
    scores=_hybrid_scores([_crisis_text(crisis)],[_skills_text(v.skills) for v in eligible])
    results=[_vol_dict(v,scores[i]) for i,v in enumerate(eligible)]
    results.sort(key=lambda x:x["match_score"],reverse=True)
    return results
