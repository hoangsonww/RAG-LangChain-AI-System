# Quick Start Guide - Advanced RAG AI System

Get up and running in minutes with this comprehensive quick start guide.

## Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **Docker & Docker Compose** (for containerized deployment)
- **MongoDB** (if running backend locally)
- **Ollama** with llama2 model (for LLM)

## Quick Start Options

### Option 1: Docker Compose (Recommended) ⚡

The fastest way to get everything running:

```bash
# Clone the repository
git clone https://github.com/hoangsonww/RAG-AI-System-Portfolio-Support.git
cd RAG-AI-System-Portfolio-Support

# Start all services with Docker Compose
docker-compose up -d

# Wait for services to initialize (~2 minutes)
# Then open your browser
```

**Access the application:**
- **Frontend**: http://localhost:3000
- **Flask API**: http://localhost:5000
- **Express Backend**: http://localhost:3456/docs
- **MongoDB**: localhost:27017

```bash
# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Option 2: Local Development Setup 🛠️

For development and testing:

#### Step 1: Install Ollama and LLM

```bash
# Install Ollama (macOS/Linux)
curl https://ollama.ai/install.sh | sh

# Start Ollama
ollama serve &

# Pull the llama2 model
ollama pull llama2

# Verify installation
ollama list
```

#### Step 2: Setup Backend (Express)

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
MONGO_URI=mongodb://localhost:27017/rag_db
PORT=3456
EOF

# Start MongoDB (if not using Docker)
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod

# Start the backend
npm start
```

The Express API will be available at http://localhost:3456

#### Step 3: Setup RAG Application (Python)

```bash
# Navigate to project root
cd ..

# Create virtual environment
python -m venv venv

# Activate virtual environment
# macOS/Linux:
source venv/bin/activate
# Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the Flask application
python app.py
```

The Flask API will be available at http://localhost:5000

#### Step 4: Setup Frontend (React)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The React app will be available at http://localhost:3000

## Quick Test

### Test 1: Check Health

```bash
# Test Flask API
curl http://localhost:5000/health

# Test Express API
curl http://localhost:3456/ping \
  -H "Authorization: Bearer token"
```

### Test 2: Send a Chat Message

```bash
# Create a session
SESSION_ID=$(curl -s -X POST http://localhost:5000/api/session | jq -r '.session_id')

# Send a message
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the main topics in PeakSpan MasterClasses?",
    "session_id": "'$SESSION_ID'",
    "strategy": "hybrid"
  }' | jq
```

### Test 3: Run Demo Script

```bash
# Run the comprehensive demo
python demo.py

# Select option 0 to run all demos
# Or select specific demos (1-7)
```

## Usage Examples

### Web Interface

1. **Open http://localhost:3000**
2. **Select a strategy** from the dropdown (Hybrid is recommended)
3. **Type your question** in the input field
4. **Press Enter or click Send**
5. **Watch the streaming response**

Example queries to try:
```
- What are PeakSpan MasterClasses about?
- Tell me about Scott Varner
- What investment strategies does PeakSpan use?
- How do they help companies scale?
- What are the key leadership topics covered?
```

### Python API

```python
from advanced_rag_engine import AdvancedRAGEngine, RAGConfig, RetrievalStrategy

# Initialize
engine = AdvancedRAGEngine(RAGConfig())
engine.initialize_from_api()

# Query with hybrid search
result = engine.query(
    "What are the four fundamental failures of leadership teams?",
    strategy=RetrievalStrategy.HYBRID
)

print(f"Response: {result['response']}")
print(f"\nSources: {len(result['sources'])}")
for source in result['sources']:
    print(f"  - {source['source']}: {source['score']:.2f}")
```

### REST API

```bash
# Using curl
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Your question here",
    "strategy": "hybrid"
  }'

# Using httpie (if installed)
http POST http://localhost:5000/api/chat \
  query="Your question here" \
  strategy="hybrid"
```

### WebSocket (JavaScript)

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

socket.on('connect', () => {
  socket.emit('chat_message', {
    query: 'What are PeakSpan MasterClasses?',
    strategy: 'hybrid'
  });
});

socket.on('response_chunk', (data) => {
  process.stdout.write(data.chunk); // Streaming!
});

socket.on('response_complete', (data) => {
  console.log('\n\nSources:', data.sources);
});
```

## Configuration

### Customize RAG Settings

Edit `advanced_rag_engine.py`:

```python
@dataclass
class RAGConfig:
    # Model Configuration
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    llm_model: str = "llama2"  # Change to your preferred model
    rerank_model: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"

    # Chunking Configuration
    chunk_size: int = 1000  # Adjust for your documents
    chunk_overlap: int = 200

    # Retrieval Configuration
    top_k: int = 5  # Number of documents to retrieve
    enable_reranking: bool = True
    enable_hybrid_search: bool = True
```

### Change API Endpoint

Edit the API base URL in `advanced_rag_engine.py`:

```python
api_base_url: str = "https://rag-langchain-ai-system.onrender.com"
# Or use local backend:
# api_base_url: str = "http://localhost:3456"
```

## Troubleshooting

### Issue: Ollama not found

```bash
# Make sure Ollama is installed and running
ollama serve

# Check if model is available
ollama list

# Pull model if needed
ollama pull llama2
```

### Issue: MongoDB connection failed

```bash
# Start MongoDB
# macOS:
brew services start mongodb-community

# Linux:
sudo systemctl start mongod

# Verify connection
mongosh
```

### Issue: Port already in use

```bash
# Find process using port
lsof -i :5000  # or :3000, :3456

# Kill process
kill -9 <PID>

# Or change port in configuration
```

### Issue: Frontend can't connect to backend

```bash
# Check if all services are running
curl http://localhost:5000/health
curl http://localhost:3456/ping -H "Authorization: Bearer token"

# Check CORS settings in app.py
# Make sure your frontend origin is allowed
```

### Issue: ChromaDB initialization error

```bash
# Remove existing database
rm -rf chroma_db/

# Restart the application
python app.py
```

## Next Steps

1. **Explore all retrieval strategies** in the web interface
2. **Run the demo script** to see all features: `python demo.py`
3. **Upload your own documents** using the upload feature
4. **Check the comprehensive documentation** in `ENHANCED_FEATURES.md`
5. **Review the code** to understand the implementation

## Production Deployment

For production deployment:

1. **Use environment variables** for sensitive configuration
2. **Enable authentication** for API endpoints
3. **Set up Redis** for caching
4. **Configure reverse proxy** (nginx) for better performance
5. **Enable HTTPS** for secure communication
6. **Monitor logs** and set up alerting
7. **Scale with Kubernetes** if needed

See `docker-compose.yml` for a production-ready setup template.

## Support & Resources

- **Documentation**: See `ENHANCED_FEATURES.md`
- **Architecture**: See `ARCHITECTURE.md`
- **Demo**: Run `python demo.py`
- **Issues**: Report at GitHub repository
- **Author**: David Nguyen

## Key Features Checklist

After setup, you should be able to:

- ✅ Chat with AI using the web interface
- ✅ Switch between different retrieval strategies
- ✅ See streaming responses in real-time
- ✅ View source citations with relevance scores
- ✅ Upload and process documents
- ✅ Maintain conversation context
- ✅ Access REST and WebSocket APIs
- ✅ View comprehensive API documentation

Enjoy exploring the Advanced RAG AI System! 🚀
