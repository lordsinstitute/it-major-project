"""
KisanSathi AI Engine
Rule-based AI models for:
  - Crop Disease Detection  (deterministic – same image → same result)
  - Crop Yield Prediction
  - Fertilizer Recommendation

NOTE: Disease prediction is intentionally deterministic.
      No random calls are used anywhere in the prediction path.
      Replace predict_disease() with an actual CNN model when ready;
      the shared function signature must be kept identical.
"""
import hashlib

# ────────────────────────────────────────────────
# Disease Detection
# ────────────────────────────────────────────────

# Fixed, alphabetically-sorted disease lists (order must never change).
DISEASES = {
    'cotton': [
        'Alternaria Blight',
        'Bacterial Blight',
        'Cotton Leaf Curl Virus',
        'Root Rot',
    ],
    'default': [
        'Bacterial Leaf Spot',
        'Fungal Infection',
        'Nutrient Deficiency',
        'Viral Disease',
    ],
    'maize': [
        'Corn Smut',
        'Grey Leaf Spot',
        'Northern Leaf Blight',
        'Stalk Rot',
    ],
    'rice': [
        'Bacterial Leaf Blight',
        'Brown Spot',
        'Rice Blast',
        'Sheath Rot',
    ],
    'tomato': [
        'Early Blight',
        'Fusarium Wilt',
        'Late Blight',
        'Leaf Mold',
    ],
    'wheat': [
        'Leaf Blight',
        'Powdery Mildew',
        'Septoria Leaf Blotch',
        'Wheat Rust',
    ],
}

PESTICIDES = {
    'Alternaria Blight':         'Mancozeb 75% WP @ 2.5g/L | Iprodione 50% WP @ 2g/L',
    'Bacterial Blight':          'Copper Oxychloride 50% WP @ 3g/L | Streptocycline 100ppm',
    'Bacterial Leaf Blight':     'Copper Hydroxide 53.8% @ 2g/L | Streptomycin + Copper Oxychloride',
    'Bacterial Leaf Spot':       'Copper Hydroxide 53.8% @ 2g/L | Streptomycin sulphate 90% SP',
    'Brown Spot':                'Mancozeb 75% WP @ 2.5g/L | Iprobenfos 48% EC @ 2ml/L',
    'Corn Smut':                 'Remove infected plants | Thiram 75% WP seed treatment',
    'Cotton Leaf Curl Virus':    'Imidacloprid 17.8% SL @ 0.25ml/L to control whitefly vectors',
    'Early Blight':              'Chlorothalonil 75% WP @ 2g/L | Mancozeb 75% WP @ 2.5g/L',
    'Fusarium Wilt':             'Soil solarization | Carbendazim 50% WP @ 2g/L | Use resistant varieties',
    'Fungal Infection':          'Mancozeb 75% WP @ 2.5g/L | Copper Oxychloride 50% WP @ 3g/L',
    'Grey Leaf Spot':            'Trifloxystrobin 25% + Tebuconazole 50% WG @ 0.5g/L',
    'Late Blight':               'Cymoxanil 8% + Mancozeb 64% WP @ 3g/L | Metalaxyl + Mancozeb',
    'Leaf Blight':               'Copper Oxychloride 50% WP @ 3g/L | Mancozeb 75% WP @ 2.5g/L',
    'Leaf Mold':                 'Chlorothalonil 75% WP @ 2g/L | Improve ventilation',
    'Northern Leaf Blight':      'Mancozeb 75% WP @ 2.5g/L | Propiconazole 25% EC @ 1ml/L',
    'Nutrient Deficiency':       'Conduct soil test. Apply balanced NPK fertilizers as recommended.',
    'Powdery Mildew':            'Sulphur 80% WP @ 3g/L | Hexaconazole 5% EC @ 2ml/L',
    'Rice Blast':                'Tricyclazole 75% WP @ 0.6g/L | Isoprothiolane 40% EC @ 1.5ml/L',
    'Root Rot':                  'Improve drainage | Carbendazim 50% WP @ 2g/L soil drench',
    'Septoria Leaf Blotch':      'Tebuconazole 25.9% EC @ 1ml/L | Propiconazole 25% EC @ 1ml/L',
    'Sheath Rot':                'Propiconazole 25% EC @ 1ml/L | Validamycin 3% L @ 2ml/L',
    'Stalk Rot':                 'Carbendazim 50% WP @ 2g/L | Improve drainage',
    'Viral Disease':             'No direct cure. Control insect vectors. Remove infected plants.',
    'Wheat Rust':                'Propiconazole 25% EC @ 0.1% | Mancozeb 75% WP @ 0.25%',
}

# Minimum SHA-256 nibbles needed to pick from a list of 4 (2 bits → 1 hex char).
# Using 8 hex chars (32 bits) for stability; more than enough.
_HASH_NIBBLES = 8
_LOW_CONFIDENCE_THRESHOLD = 0.30   # placeholder – real model returns float probabilities


def _image_hash(image_file) -> str:
    """
    Return a stable hex digest for the uploaded image file.

    Works with:
      - Django InMemoryUploadedFile / TemporaryUploadedFile (file-like objects)
      - Plain file paths (str)
      - Raw bytes
    """
    h = hashlib.sha256()
    if isinstance(image_file, (str, bytes)):
        data = open(image_file, 'rb').read() if isinstance(image_file, str) else image_file
        h.update(data)
    else:
        # Django upload: seek to start, read, seek back so Django can still save it.
        try:
            image_file.seek(0)
        except Exception:
            pass
        h.update(image_file.read())
        try:
            image_file.seek(0)
        except Exception:
            pass
    return h.hexdigest()


# ──────────────────────────────────────────────────────────────
# SHARED prediction function – used by BOTH Farmer and Expert.
# ──────────────────────────────────────────────────────────────
def predict_disease(image_file=None, crop_type='default'):
    """
    Predict crop disease from an image.

    This is the **single shared function** called by both the Farmer
    disease-detection view and the Expert AI-verification view.
    It is 100 % deterministic: the same image always returns the same result.

    Parameters
    ----------
    image_file : file-like object, file path (str), or None
        The uploaded image.  If None, returns the low-confidence fallback.
    crop_type  : str
        One of: 'wheat', 'rice', 'maize', 'cotton', 'tomato', 'default'.

    Returns
    -------
    dict with keys:
        disease    (str)   – disease name (or fallback label)
        confidence (float) – value in [0.0, 1.0]
        is_low_conf(bool)  – True when confidence < threshold
    """
    if image_file is None:
        return {
            'disease':     'Unknown / Low Confidence',
            'confidence':  0.0,
            'is_low_conf': True,
        }

    # ── Deterministic index selection via image content hash ──────────────
    hex_digest = _image_hash(image_file)

    # Convert first 8 hex chars → integer, then modulo list length.
    disease_list = DISEASES.get(crop_type.lower(), DISEASES['default'])
    index = int(hex_digest[:_HASH_NIBBLES], 16) % len(disease_list)

    # ── Deterministic mock-confidence from next 4 hex chars ───────────────
    # Range: maps hex 0000–ffff (0–65535) → 0.50–0.99
    raw_conf_int = int(hex_digest[_HASH_NIBBLES:_HASH_NIBBLES + 4], 16)
    confidence = 0.50 + (raw_conf_int / 65535.0) * 0.49   # always ≥ 0.50

    # ── Low-confidence guard ──────────────────────────────────────────────
    if confidence < _LOW_CONFIDENCE_THRESHOLD:
        return {
            'disease':     'Unknown / Low Confidence',
            'confidence':  round(confidence, 4),
            'is_low_conf': True,
        }

    return {
        'disease':     disease_list[index],
        'confidence':  round(confidence, 4),
        'is_low_conf': False,
    }


def suggest_pesticide(disease_name):
    """Suggest pesticide/treatment for a detected disease."""
    return PESTICIDES.get(
        disease_name,
        'Consult your local agricultural expert for specific treatment.'
    )


# ────────────────────────────────────────────────
# Yield Prediction
# ────────────────────────────────────────────────

YIELD_BASE = {
    'wheat':     25,
    'rice':      20,
    'paddy':     20,
    'maize':     30,
    'corn':      30,
    'cotton':    10,
    'sugarcane': 400,
    'soybean':   12,
    'groundnut': 8,
    'sunflower': 6,
    'tomato':    80,
    'onion':     60,
    'potato':    80,
    'chilli':    5,
    'turmeric':  50,
}

WEATHER_MULTIPLIER = {
    'excellent': 1.30,
    'good':      1.10,
    'average':   1.00,
    'poor':      0.75,
    'drought':   0.50,
    'flood':     0.40,
}


def predict_yield(crop, area_acres, weather_condition='average'):
    """
    Predict crop yield (deterministic – no random variation).
    Returns (predicted_quintals, unit_string).
    """
    crop_lower = crop.lower().strip()
    base_yield = YIELD_BASE.get(crop_lower, 15)
    multiplier = WEATHER_MULTIPLIER.get(weather_condition.lower(), 1.0)
    predicted = round(base_yield * float(area_acres) * multiplier, 2)
    return predicted, 'quintals'


# ────────────────────────────────────────────────
# Fertilizer Recommendation
# ────────────────────────────────────────────────

FERTILIZER_RULES = {
    ('sandy', 'wheat'):   'Urea @ 120 kg/acre + DAP @ 50 kg/acre + MOP @ 25 kg/acre',
    ('clay',  'wheat'):   'Urea @ 100 kg/acre + SSP @ 100 kg/acre + MOP @ 20 kg/acre',
    ('loamy', 'wheat'):   'Urea @ 110 kg/acre + DAP @ 45 kg/acre + MOP @ 20 kg/acre',
    ('sandy', 'rice'):    'Urea @ 100 kg/acre + DAP @ 40 kg/acre + Zinc Sulphate @ 10 kg/acre',
    ('clay',  'rice'):    'Urea @ 90 kg/acre + SSP @ 80 kg/acre + MOP @ 25 kg/acre',
    ('loamy', 'rice'):    'Urea @ 100 kg/acre + DAP @ 45 kg/acre + MOP @ 20 kg/acre',
    ('sandy', 'cotton'):  'Urea @ 80 kg/acre + DAP @ 30 kg/acre + MOP @ 30 kg/acre',
    ('loamy', 'cotton'):  'Urea @ 70 kg/acre + DAP @ 35 kg/acre + MOP @ 25 kg/acre',
    ('sandy', 'maize'):   'Urea @ 130 kg/acre + DAP @ 50 kg/acre + MOP @ 30 kg/acre',
    ('loamy', 'maize'):   'Urea @ 120 kg/acre + DAP @ 45 kg/acre + MOP @ 25 kg/acre',
}

WEATHER_FERTILIZER_NOTE = {
    'dry':    ' | Increase irrigation before fertilizer application.',
    'humid':  ' | Split urea application to reduce nitrogen losses.',
    'rainy':  ' | Use slow-release fertilizers. Avoid fertilization just before heavy rain.',
    'normal': '',
}

SOIL_CROP_DEFAULT = (
    'Urea @ 100 kg/acre + DAP @ 40 kg/acre + MOP @ 20 kg/acre (General recommendation)'
)


def recommend_fertilizer(crop, soil_type, weather_condition):
    """Recommend fertilizer based on crop, soil type, and weather (rule-based, deterministic)."""
    key = (soil_type.lower(), crop.lower())
    fertilizer = FERTILIZER_RULES.get(key, SOIL_CROP_DEFAULT)
    note = WEATHER_FERTILIZER_NOTE.get(weather_condition.lower(), '')
    return fertilizer + note
