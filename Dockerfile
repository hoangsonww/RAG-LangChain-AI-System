FROM python:3.10-slim

LABEL org.opencontainers.image.source="https://github.com/hoangsonww/RAG-LangChain-AI-System"
LABEL org.opencontainers.image.description="Production container for the RAG AI Portfolio Support service"

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Runtime/system deps needed by some Python packages and health probes.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy only what the RAG service needs at runtime.
COPY rag_system ./rag_system
COPY run.py ./run.py
COPY backend/documents ./backend/documents

RUN mkdir -p logs chroma_db uploads \
    && useradd --create-home --shell /usr/sbin/nologin appuser \
    && chown -R appuser:appuser /app

USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=5 \
  CMD curl -fsS http://127.0.0.1:5000/health || exit 1

CMD ["gunicorn", "-k", "eventlet", "-w", "1", "-b", "0.0.0.0:5000", "rag_system.server:app"]
