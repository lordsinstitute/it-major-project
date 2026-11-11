# Mia — AI receptionist. Runs the Twilio transport for real phone calls.
FROM python:3.12-slim

WORKDIR /app

# Installed in stages on purpose. A single `pip install -r requirements.txt` produces one
# ~900 MB layer, and `docker push` cannot resume *within* a layer — on a flaky uplink a drop
# at 90% restarts the whole thing, which is exactly what happened twice. Four medium layers
# each retry independently, so progress is never lost wholesale.
#
# Versions are pinned to what the full resolve produced, so the final requirements install
# finds them already satisfied instead of downgrading and re-fetching them.
# The three heavy installs come BEFORE requirements.txt is copied in, deliberately. Docker
# invalidates every layer after a changed file, so copying requirements.txt first meant any
# edit to it rebuilt and re-uploaded all ~900 MB. Pinned here, these layers only change when
# this Dockerfile does, and a requirements edit re-uploads just the last ~255 MB.

# ~206 MB — the JIT compiler behind resampy's audio resampling.
RUN pip install --no-cache-dir llvmlite==0.49.0 numba==0.67.0

# ~130 MB — runs the Silero voice-detection model. sympy is its dependency.
RUN pip install --no-cache-dir onnxruntime==1.24.4 sympy==1.14.0

# ~264 MB — only needed by the local browser test, never on a phone call. Kept so the
# webrtc transport still works locally; drop this line to slim the image for production.
RUN pip install --no-cache-dir opencv-python-headless==4.14.0.94 av==17.1.0

# Everything else. Pinned versions above are already satisfied, so this only adds the rest.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY bot.py .

# --proxy is the public hostname Twilio is told to connect back to. It is what makes the
# generated TwiML point at the right wss:// URL, so it must match the real domain exactly
# or calls connect to nothing — while the app still looks perfectly healthy.
#
# Azure assigns the FQDN only once the container app exists, so the very first deploy cannot
# know it. The placeholder default keeps that first boot healthy instead of crashing on an
# empty --proxy; the real value is set straight afterwards, which restarts the revision:
#   az containerapp update -n mia -g mia-rg --set-env-vars PUBLIC_DOMAIN=<fqdn>
#
# Bare hostname only — no https://, no trailing slash.
# Shell form (not exec form) so both variables actually expand.
CMD ["sh", "-c", "python bot.py -t twilio --host 0.0.0.0 --port ${PORT:-8080} --proxy ${PUBLIC_DOMAIN:-domain-not-set.invalid}"]
