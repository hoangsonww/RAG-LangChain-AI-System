# Makefile for RAG-AI-System-Portfolio-Support

# ——————————————————————————————————————————————
# Configuration
# ——————————————————————————————————————————————
PYTHON         ?= python3
PIP            ?= pip3
VENV_DIR       ?= .venv
APP_ENTRY      ?= run.py
IMAGE_NAME     ?= ghcr.io/hoangsonww/rag-ai-system-portfolio-support
VERSION        ?= 1.0.0
REGISTRY       ?= ghcr.io
GITHUB_USER    ?= hoangsonww

# ——————————————————————————————————————————————
# Phony targets
# ——————————————————————————————————————————————
.PHONY: help venv install run docker-build docker-push all clean \
	deploy-aws deploy-oci deploy-aws-canary deploy-aws-bluegreen deploy-oci-canary deploy-oci-bluegreen \
	smoke-test

# ——————————————————————————————————————————————
# Default target
# ——————————————————————————————————————————————
help:
	@echo "Usage: make <target>"
	@echo
	@echo "Targets:"
	@echo "  help           Show this help"
	@echo "  venv           Create a Python virtualenv"
	@echo "  install        Install Python dependencies"
	@echo "  run            Run the Flask RAG API locally"
	@echo "  docker-build   Build the Docker image"
	@echo "  docker-push    Push the Docker image to GitHub Container Registry"
	@echo "  all            install -> docker-build -> docker-push"
	@echo "  clean          Remove caches and __pycache__"
	@echo "  deploy-aws     Apply rolling deployment on AWS overlay"
	@echo "  deploy-oci     Apply rolling deployment on OCI overlay"
	@echo "  deploy-aws-canary      Apply canary deployment overlay on AWS"
	@echo "  deploy-aws-bluegreen   Apply blue-green deployment overlay on AWS"
	@echo "  deploy-oci-canary      Apply canary deployment overlay on OCI"
	@echo "  deploy-oci-bluegreen   Apply blue-green deployment overlay on OCI"
	@echo "  smoke-test BASE_URL=<url>  Run production smoke checks"

# ——————————————————————————————————————————————
# Create & activate virtualenv
# ——————————————————————————————————————————————
venv:
	@echo "🛠  Creating virtualenv in $(VENV_DIR)..."
	$(PYTHON) -m venv $(VENV_DIR)
	@echo "✅ Virtualenv created. Activate it with:"
	@echo "    source $(VENV_DIR)/bin/activate"

# ——————————————————————————————————————————————
# Install Python dependencies
# ——————————————————————————————————————————————
install: venv
	@echo "🚀 Installing Python dependencies..."
	$(VENV_DIR)/bin/$(PIP) install --upgrade pip
	$(VENV_DIR)/bin/$(PIP) install -r requirements.txt
	@echo "✅ Dependencies installed."

# ——————————————————————————————————————————————
# Run the main script
# ——————————————————————————————————————————————
run: install
	@echo "▶️  Running $(APP_ENTRY)..."
	$(VENV_DIR)/bin/$(PYTHON) $(APP_ENTRY)

# ——————————————————————————————————————————————
# Build the Docker image
# ——————————————————————————————————————————————
docker-build:
	@echo "🛠  Building Docker image $(IMAGE_NAME):$(VERSION)..."
	docker build \
		--label org.opencontainers.image.description="RAG AI System for Portfolio Support – documents + API + FAISS + Ollama" \
		-t $(IMAGE_NAME):$(VERSION) .

# ——————————————————————————————————————————————
# Push the Docker image to GHCR
# ——————————————————————————————————————————————
docker-push: docker-build
ifndef GITHUB_TOKEN
	$(error GITHUB_TOKEN is undefined. export it to continue.)
endif
	@echo "🔐 Logging in to $(REGISTRY)..."
	echo "$(GITHUB_TOKEN)" | docker login $(REGISTRY) -u $(GITHUB_USER) --password-stdin
	@echo "🚀 Pushing image $(IMAGE_NAME):$(VERSION)..."
	docker push $(IMAGE_NAME):$(VERSION)
	@echo "✅ Image pushed."

# ——————————————————————————————————————————————
# Convenience: install, build & push
# ——————————————————————————————————————————————
all: install docker-push

# ——————————————————————————————————————————————
# Clean up caches and __pycache__
# ——————————————————————————————————————————————
clean:
	@echo "🧹 Cleaning up..."
	find . -type d -name "__pycache__" -exec rm -rf {} +
	rm -rf $(VENV_DIR)
	@echo "✅ Cleaned."

# ——————————————————————————————————————————————
# Kubernetes deployment helpers
# ——————————————————————————————————————————————
deploy-aws:
	./deploy/scripts/rollout.sh rolling aws apply

deploy-oci:
	./deploy/scripts/rollout.sh rolling oci apply

deploy-aws-canary:
	./deploy/scripts/rollout.sh canary aws apply

deploy-aws-bluegreen:
	./deploy/scripts/rollout.sh bluegreen aws apply

deploy-oci-canary:
	./deploy/scripts/rollout.sh canary oci apply

deploy-oci-bluegreen:
	./deploy/scripts/rollout.sh bluegreen oci apply

smoke-test:
ifndef BASE_URL
	$(error BASE_URL is undefined. Example: make smoke-test BASE_URL=https://rag.example.com)
endif
	./deploy/scripts/smoke-test.sh $(BASE_URL)
