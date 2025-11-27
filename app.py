"""
Enhanced Flask Application with WebSocket Support for Streaming RAG Responses

Features:
- Real-time streaming responses via WebSocket
- Session management with conversation history
- Document upload and processing
- Advanced RAG with multiple retrieval strategies
- Comprehensive API endpoints
- CORS support for frontend integration

Author: David Nguyen
Date: 2025-11-26
"""

import os
import json
import uuid
from datetime import datetime
from typing import Dict, Any, List
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
from werkzeug.utils import secure_filename
from loguru import logger

from advanced_rag_engine import AdvancedRAGEngine, RAGConfig, RetrievalStrategy

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'

# Enable CORS
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://localhost:5000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Initialize SocketIO
socketio = SocketIO(
    app,
    cors_allowed_origins=["http://localhost:3000", "http://localhost:5000"],
    async_mode='threading'
)

# Configure logging
logger.add("logs/flask_app.log", rotation="500 MB", retention="10 days", level="INFO")

# Global RAG engine instance
rag_engine = None

# Session storage (in production, use Redis or a database)
sessions: Dict[str, Dict[str, Any]] = {}

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs('logs', exist_ok=True)


def initialize_rag_engine():
    """Initialize the RAG engine"""
    global rag_engine

    if rag_engine is None:
        logger.info("Initializing RAG Engine...")
        config = RAGConfig()
        rag_engine = AdvancedRAGEngine(config)
        rag_engine.initialize_from_api()
        logger.info("✓ RAG Engine initialized successfully")

    return rag_engine


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "rag_engine_initialized": rag_engine is not None
    })


@app.route('/api/chat', methods=['POST'])
def chat():
    """
    REST endpoint for chat (non-streaming)
    """
    try:
        data = request.get_json()
        query = data.get('query', '').strip()
        session_id = data.get('session_id')
        strategy = data.get('strategy', 'hybrid')

        if not query:
            return jsonify({"error": "Query is required"}), 400

        # Initialize RAG engine if needed
        engine = initialize_rag_engine()

        # Map strategy string to enum
        strategy_map = {
            'semantic': RetrievalStrategy.SEMANTIC,
            'hybrid': RetrievalStrategy.HYBRID,
            'multi_query': RetrievalStrategy.MULTI_QUERY,
            'decomposed': RetrievalStrategy.DECOMPOSED
        }
        retrieval_strategy = strategy_map.get(strategy, RetrievalStrategy.HYBRID)

        # Process query
        result = engine.query(query, strategy=retrieval_strategy)

        # Store in session if session_id provided
        if session_id:
            if session_id not in sessions:
                sessions[session_id] = {
                    'created_at': datetime.utcnow().isoformat(),
                    'messages': []
                }
            sessions[session_id]['messages'].append({
                'timestamp': datetime.utcnow().isoformat(),
                'query': query,
                'response': result['response'],
                'strategy': strategy
            })

        logger.info(f"Chat request processed: {query[:50]}...")

        return jsonify({
            "success": True,
            "session_id": session_id,
            "result": result
        })

    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/session', methods=['POST'])
def create_session():
    """Create a new chat session"""
    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        'created_at': datetime.utcnow().isoformat(),
        'messages': []
    }

    logger.info(f"Created new session: {session_id}")

    return jsonify({
        "success": True,
        "session_id": session_id,
        "created_at": sessions[session_id]['created_at']
    })


@app.route('/api/session/<session_id>', methods=['GET'])
def get_session(session_id):
    """Get session history"""
    if session_id not in sessions:
        return jsonify({"error": "Session not found"}), 404

    return jsonify({
        "success": True,
        "session_id": session_id,
        "session": sessions[session_id]
    })


@app.route('/api/session/<session_id>', methods=['DELETE'])
def delete_session(session_id):
    """Delete a session"""
    if session_id in sessions:
        del sessions[session_id]
        logger.info(f"Deleted session: {session_id}")

    return jsonify({"success": True})


@app.route('/api/sessions', methods=['GET'])
def list_sessions():
    """List all active sessions"""
    session_list = [
        {
            "session_id": sid,
            "created_at": data['created_at'],
            "message_count": len(data['messages'])
        }
        for sid, data in sessions.items()
    ]

    return jsonify({
        "success": True,
        "sessions": session_list,
        "total": len(session_list)
    })


@app.route('/api/upload', methods=['POST'])
def upload_document():
    """
    Upload and process documents
    """
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files['file']

        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400

        # Check file extension
        allowed_extensions = {'txt', 'pdf', 'docx', 'md'}
        if '.' not in file.filename or \
           file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
            return jsonify({
                "error": f"File type not allowed. Allowed: {allowed_extensions}"
            }), 400

        # Save file
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        logger.info(f"File uploaded: {filename}")

        # TODO: Process and add to vector store
        # For now, just acknowledge upload

        return jsonify({
            "success": True,
            "filename": filename,
            "message": "File uploaded successfully. Processing..."
        })

    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/strategies', methods=['GET'])
def get_strategies():
    """Get available retrieval strategies"""
    return jsonify({
        "success": True,
        "strategies": [
            {
                "id": "semantic",
                "name": "Semantic Search",
                "description": "Pure vector similarity search using embeddings"
            },
            {
                "id": "hybrid",
                "name": "Hybrid Search",
                "description": "Combines semantic and keyword-based (BM25) search"
            },
            {
                "id": "multi_query",
                "name": "Multi-Query",
                "description": "Generates query variations for comprehensive retrieval"
            },
            {
                "id": "decomposed",
                "name": "Query Decomposition",
                "description": "Breaks complex queries into simpler sub-queries"
            }
        ]
    })


# WebSocket Events

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    logger.info(f"Client connected: {request.sid}")
    emit('connected', {'status': 'Connected to RAG server'})


@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    logger.info(f"Client disconnected: {request.sid}")


@socketio.on('join_session')
def handle_join_session(data):
    """Join a chat session room"""
    session_id = data.get('session_id')
    if session_id:
        join_room(session_id)
        logger.info(f"Client {request.sid} joined session {session_id}")
        emit('joined_session', {'session_id': session_id})


@socketio.on('leave_session')
def handle_leave_session(data):
    """Leave a chat session room"""
    session_id = data.get('session_id')
    if session_id:
        leave_room(session_id)
        logger.info(f"Client {request.sid} left session {session_id}")
        emit('left_session', {'session_id': session_id})


@socketio.on('chat_message')
def handle_chat_message(data):
    """
    Handle streaming chat message via WebSocket
    """
    try:
        query = data.get('query', '').strip()
        session_id = data.get('session_id')
        strategy = data.get('strategy', 'hybrid')

        if not query:
            emit('error', {'message': 'Query is required'})
            return

        logger.info(f"WebSocket chat: {query[:50]}...")

        # Initialize RAG engine if needed
        engine = initialize_rag_engine()

        # Emit thinking status
        emit('thinking', {'status': 'Processing your query...'})

        # Map strategy
        strategy_map = {
            'semantic': RetrievalStrategy.SEMANTIC,
            'hybrid': RetrievalStrategy.HYBRID,
            'multi_query': RetrievalStrategy.MULTI_QUERY,
            'decomposed': RetrievalStrategy.DECOMPOSED
        }
        retrieval_strategy = strategy_map.get(strategy, RetrievalStrategy.HYBRID)

        # Emit retrieval status
        emit('status', {'message': f'Retrieving documents using {strategy} strategy...'})

        # Process query
        result = engine.query(query, strategy=retrieval_strategy)

        # Emit response in chunks (simulate streaming)
        response_text = result['response']
        chunk_size = 50

        for i in range(0, len(response_text), chunk_size):
            chunk = response_text[i:i+chunk_size]
            emit('response_chunk', {'chunk': chunk})
            socketio.sleep(0.05)  # Small delay for streaming effect

        # Emit completion
        emit('response_complete', {
            'query': query,
            'response': result['response'],
            'sources': result['sources'],
            'strategy': strategy,
            'num_documents': result['num_documents']
        })

        # Store in session
        if session_id:
            if session_id not in sessions:
                sessions[session_id] = {
                    'created_at': datetime.utcnow().isoformat(),
                    'messages': []
                }
            sessions[session_id]['messages'].append({
                'timestamp': datetime.utcnow().isoformat(),
                'query': query,
                'response': result['response'],
                'strategy': strategy
            })

        logger.info(f"✓ WebSocket chat processed successfully")

    except Exception as e:
        logger.error(f"Error in WebSocket chat: {e}")
        emit('error', {'message': str(e)})


@socketio.on('get_history')
def handle_get_history(data):
    """Get chat history for a session"""
    session_id = data.get('session_id')

    if not session_id or session_id not in sessions:
        emit('error', {'message': 'Session not found'})
        return

    emit('history', {
        'session_id': session_id,
        'messages': sessions[session_id]['messages']
    })


if __name__ == '__main__':
    # Initialize RAG engine on startup
    print("\n" + "="*80)
    print("Enhanced RAG Flask Application with WebSocket Support")
    print("="*80 + "\n")

    initialize_rag_engine()

    print("\n" + "="*80)
    print("Server Starting...")
    print("="*80 + "\n")
    print("REST API: http://localhost:5000")
    print("WebSocket: ws://localhost:5000")
    print("\nAvailable Endpoints:")
    print("  - POST   /api/chat          - Send chat message (REST)")
    print("  - POST   /api/session       - Create new session")
    print("  - GET    /api/session/<id>  - Get session history")
    print("  - DELETE /api/session/<id>  - Delete session")
    print("  - GET    /api/sessions      - List all sessions")
    print("  - POST   /api/upload        - Upload document")
    print("  - GET    /api/strategies    - Get retrieval strategies")
    print("  - GET    /health            - Health check")
    print("\nWebSocket Events:")
    print("  - connect         - Client connection")
    print("  - chat_message    - Send chat message (streaming)")
    print("  - join_session    - Join session room")
    print("  - get_history     - Get session history")
    print("\n" + "="*80 + "\n")

    # Run with SocketIO
    socketio.run(
        app,
        host='0.0.0.0',
        port=5000,
        debug=True,
        allow_unsafe_werkzeug=True
    )
