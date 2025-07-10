# ─────────────────────────────────────────────────────────────
# 1. Base image: slim, security-patched Python 3.11
# ─────────────────────────────────────────────────────────────
FROM python:3.11-slim

# ─────────────────────────────────────────────────────────────
# 2. OS-level build tools that C-extension wheels sometimes need
#    (gcc, g++, make). Remove if you're sure all wheels exist.
# ─────────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc g++ \
    && rm -rf /var/lib/apt/lists/*

# ─────────────────────────────────────────────────────────────
# 3. Work inside /app
# ─────────────────────────────────────────────────────────────
WORKDIR /app

# ─────────────────────────────────────────────────────────────
# 4. Copy & install Python dependencies
# ─────────────────────────────────────────────────────────────
COPY requirements.txt .
RUN pip install --upgrade pip setuptools wheel \
    && pip install -r requirements.txt

# ─────────────────────────────────────────────────────────────
# 5. Copy the rest of the backend source code
# ─────────────────────────────────────────────────────────────
COPY . .

# ─────────────────────────────────────────────────────────────
# 6. Expose port (not strictly required; Render sets $PORT)
# ─────────────────────────────────────────────────────────────
EXPOSE 8000

# ─────────────────────────────────────────────────────────────
# 7. Start Gunicorn with Flask app factory pattern support
#    - Added --workers 1 for stability on free tier
#    - Added --timeout 120 for longer request handling
#    - Use app:app since we have app = create_app() in app.py
# ─────────────────────────────────────────────────────────────
CMD ["python", "app.py"]