import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  IconButton,
  Typography,
  AppBar,
  Toolbar,
  Chip,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Send as SendIcon,
  Menu as MenuIcon,
  AutoAwesome as AIIcon,
  Settings as SettingsIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import Message from './Message';
import SourceCard from './SourceCard';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sources?: any[];
  strategy?: string;
}

interface Strategy {
  id: string;
  name: string;
  description: string;
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [sessionId, setSessionId] = useState<string>('');
  const [strategy, setStrategy] = useState('hybrid');
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize session
    createSession();

    // Load strategies
    loadStrategies();

    // Initialize WebSocket
    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
      showSnackbar('Connected to AI server');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
      showSnackbar('Disconnected from server');
    });

    socket.on('thinking', (data) => {
      setIsThinking(true);
      console.log('AI is thinking:', data.status);
    });

    socket.on('status', (data) => {
      console.log('Status:', data.message);
    });

    socket.on('response_chunk', (data) => {
      setCurrentResponse((prev) => prev + data.chunk);
    });

    socket.on('response_complete', (data) => {
      setIsThinking(false);
      setCurrentResponse('');

      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        type: 'assistant',
        content: data.response,
        timestamp: new Date(),
        sources: data.sources,
        strategy: data.strategy,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    });

    socket.on('error', (data) => {
      setIsThinking(false);
      setCurrentResponse('');
      showSnackbar('Error: ' + data.message);

      const errorMessage: ChatMessage = {
        id: uuidv4(),
        type: 'system',
        content: 'Error: ' + data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentResponse]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createSession = async () => {
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
      });
      const data = await response.json();
      setSessionId(data.session_id);
      console.log('Session created:', data.session_id);

      // Join session room via WebSocket
      if (socketRef.current) {
        socketRef.current.emit('join_session', {
          session_id: data.session_id,
        });
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const loadStrategies = async () => {
    try {
      const response = await fetch('/api/strategies');
      const data = await response.json();
      setStrategies(data.strategies);
    } catch (error) {
      console.error('Error loading strategies:', error);
    }
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || isThinking) return;

    const userMessage: ChatMessage = {
      id: uuidv4(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    // Send via WebSocket
    if (socketRef.current && isConnected) {
      socketRef.current.emit('chat_message', {
        query: inputValue,
        session_id: sessionId,
        strategy: strategy,
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        showSnackbar(`File uploaded: ${data.filename}`);
      } else {
        showSnackbar('Error uploading file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      showSnackbar('Error uploading file');
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const welcomeMessage = messages.length === 0 && !currentResponse;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* App Bar */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <AIIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Advanced RAG AI System
          </Typography>
          <Chip
            label={isConnected ? 'Connected' : 'Disconnected'}
            color={isConnected ? 'success' : 'error'}
            size="small"
            sx={{ mr: 2 }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Strategy</InputLabel>
            <Select
              value={strategy}
              label="Strategy"
              onChange={(e) => setStrategy(e.target.value)}
              sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
            >
              {strategies.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Toolbar>
      </AppBar>

      {/* Side Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 300, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Settings
          </Typography>
          <Divider sx={{ my: 2 }} />
          <List>
            <ListItem>
              <ListItemText
                primary="Session ID"
                secondary={sessionId.substring(0, 8) + '...'}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Messages"
                secondary={messages.length}
              />
            </ListItem>
          </List>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" gutterBottom>
            Strategies
          </Typography>
          {strategies.map((s) => (
            <Box key={s.id} sx={{ mb: 2, p: 1 }}>
              <Typography variant="body2" fontWeight="bold">
                {s.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {s.description}
              </Typography>
            </Box>
          ))}
        </Box>
      </Drawer>

      {/* Messages Container */}
      <Container
        maxWidth="lg"
        sx={{
          flex: 1,
          overflow: 'auto',
          py: 3,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {welcomeMessage && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              textAlign: 'center',
            }}
          >
            <AIIcon sx={{ fontSize: 64, mb: 2, color: 'primary.main' }} />
            <Typography variant="h4" gutterBottom>
              Welcome to Advanced RAG AI
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Ask me anything about PeakSpan MasterClasses, investments, or team members
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
              {strategies.map((s) => (
                <Chip
                  key={s.id}
                  label={s.name}
                  variant={strategy === s.id ? 'filled' : 'outlined'}
                  onClick={() => setStrategy(s.id)}
                />
              ))}
            </Box>
          </Box>
        )}

        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}

        {isThinking && currentResponse && (
          <Paper
            elevation={1}
            sx={{
              p: 2,
              mb: 2,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'primary.main',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AIIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle2" color="primary">
                AI Assistant (Streaming...)
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {currentResponse}
              <span className="blinking-cursor">|</span>
            </Typography>
          </Paper>
        )}

        {isThinking && !currentResponse && (
          <Paper elevation={1} sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
            <CircularProgress size={20} sx={{ mr: 2 }} />
            <Typography variant="body2" color="text.secondary">
              AI is thinking...
            </Typography>
          </Paper>
        )}

        <div ref={messagesEndRef} />
      </Container>

      {/* Input Area */}
      <Paper
        elevation={8}
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', gap: 1 }}>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              onChange={handleFileUpload}
              accept=".txt,.pdf,.docx,.md"
            />
            <IconButton
              onClick={() => fileInputRef.current?.click()}
              disabled={isThinking}
            >
              <UploadIcon />
            </IconButton>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Ask me anything..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isThinking || !isConnected}
              variant="outlined"
            />
            <IconButton
              color="primary"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isThinking || !isConnected}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Container>
      </Paper>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />

      <style>
        {`
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
          .blinking-cursor {
            animation: blink 1s infinite;
          }
        `}
      </style>
    </Box>
  );
};

export default ChatInterface;
