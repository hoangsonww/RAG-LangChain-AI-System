import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import LanRoundedIcon from "@mui/icons-material/LanRounded";
import { io, type Socket } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";

import {
  ApiRequestError,
  createSession,
  fetchHealth,
  fetchSession,
  fetchStrategies,
  fetchSystemInfo,
  fetchTools,
  listSessions,
  removeSession,
  sendChatMessage,
  uploadDocument,
} from "../lib/api";
import type {
  ApiTraceStep,
  ChatMessage,
  ChatResult,
  HealthStatus,
  SessionData,
  SessionSummary,
  Strategy,
  SystemInfo,
} from "../types/chat";
import Message from "./Message";

type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "info" | "warning" | "error";
};

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;
const STORAGE_KEYS = {
  strategy: "rag.ui.strategy",
  websocket: "rag.ui.websocket",
  session: "rag.ui.session",
};

const QUICK_PROMPTS = [
  "Summarize current investment opportunities and associated risks.",
  "Which sectors are showing the strongest momentum in our data?",
  "Give me a concise portfolio health update with supporting evidence.",
  "What backend data should I scrape next to improve recommendation quality?",
];

const initialSnackbar: SnackbarState = {
  open: false,
  message: "",
  severity: "info",
};

const buildSystemMessage = (content?: string): ChatMessage => ({
  id: uuidv4(),
  role: "system",
  content:
    content ??
    "Production RAG assistant is ready. Select a session, choose retrieval strategy, and ask for source-backed insights.",
  timestamp: new Date().toISOString(),
});

const formatApiError = (error: unknown): string => {
  if (error instanceof ApiRequestError) {
    return error.requestId
      ? `${error.message} (request: ${error.requestId})`
      : error.message;
  }
  return error instanceof Error ? error.message : "Unexpected error";
};

const hydrateMessagesFromSession = (session: SessionData): ChatMessage[] => {
  const hydrated: ChatMessage[] = [
    buildSystemMessage("Loaded session history from server."),
  ];

  session.messages.forEach((entry) => {
    hydrated.push({
      id: uuidv4(),
      role: "user",
      content: entry.query,
      timestamp: entry.timestamp,
    });
    hydrated.push({
      id: uuidv4(),
      role: "assistant",
      content: entry.response,
      timestamp: entry.timestamp,
      strategy: entry.strategy,
    });
  });

  return hydrated;
};

const sortSessions = (items: SessionSummary[]): SessionSummary[] =>
  [...items].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

const DEFAULT_STRATEGIES: Strategy[] = [
  {
    id: "semantic",
    name: "Semantic",
    description: "Pure vector similarity search using embeddings",
  },
  {
    id: "hybrid",
    name: "Hybrid",
    description: "Combines semantic and keyword-based (BM25) search",
  },
  {
    id: "multi_query",
    name: "Multi Query",
    description: "Generates query variations for comprehensive retrieval",
  },
  {
    id: "decomposed",
    name: "Decomposed",
    description: "Breaks complex queries into simpler sub-queries",
  },
];

const STARTUP_TIMEOUT_MS = 8000;
const SIDEBAR_CARD_RADIUS = 2;

const withTimeout = async <T,>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(`Timed out after ${timeoutMs} ms`));
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      });
  });
};

const readStorage = (key: string): string | null => {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(key);
};

const writeStorage = (key: string, value: string): void => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(key, value);
};

const ChatInterface = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    buildSystemMessage(),
  ]);
  const [inputValue, setInputValue] = useState("");
  const [streamBuffer, setStreamBuffer] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoadingSession, setIsLoadingSession] = useState(false);

  const [sessionId, setSessionId] = useState(
    readStorage(STORAGE_KEYS.session) ?? "",
  );
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [strategy, setStrategy] = useState(
    readStorage(STORAGE_KEYS.strategy) ?? "hybrid",
  );

  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [backendTools, setBackendTools] = useState<string[]>([]);

  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [useWebsocket, setUseWebsocket] = useState(
    readStorage(STORAGE_KEYS.websocket) !== "false",
  );
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>(initialSnackbar);
  const [degradedNotice, setDegradedNotice] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const sessionIdRef = useRef<string>(sessionId);
  const activeSocketSessionRef = useRef<string>("");
  const hasAnnouncedSocketRef = useRef(false);
  const hasWarnedSocketFallbackRef = useRef(false);
  const hasWarnedApiAvailabilityRef = useRef(false);

  const notify = useCallback(
    (message: string, severity: SnackbarState["severity"]) => {
      setSnackbar({ open: true, message, severity });
    },
    [],
  );

  const loadSession = useCallback(
    async (targetSessionId: string, showToast = true) => {
      if (!targetSessionId) {
        return;
      }

      try {
        setIsLoadingSession(true);
        const session = await fetchSession(targetSessionId);
        setSessionId(targetSessionId);
        writeStorage(STORAGE_KEYS.session, targetSessionId);

        if (session.messages.length === 0) {
          setMessages([
            buildSystemMessage("New session active. Start chatting."),
          ]);
        } else {
          setMessages(hydrateMessagesFromSession(session));
        }

        if (showToast) {
          notify("Session loaded", "success");
        }
      } catch (error) {
        notify(formatApiError(error), "error");
      } finally {
        setIsLoadingSession(false);
      }
    },
    [notify],
  );

  const refreshHealth = useCallback(
    async (showToast = false) => {
      try {
        const status = await fetchHealth();
        setHealth(status);
        if (status.backend_api_available) {
          setDegradedNotice("");
          hasWarnedApiAvailabilityRef.current = false;
        } else {
          setDegradedNotice(
            "Backend API is unreachable. UI remains available, but live data features may fail.",
          );
          if (!hasWarnedApiAvailabilityRef.current) {
            notify(
              "Backend API is unreachable. UI will continue in degraded mode.",
              "warning",
            );
            hasWarnedApiAvailabilityRef.current = true;
          }
        }
        if (showToast) {
          notify("Health status refreshed", "info");
        }
      } catch (error) {
        setDegradedNotice(
          "Backend API is unreachable. UI remains available, but live data features may fail.",
        );
        if (!hasWarnedApiAvailabilityRef.current || showToast) {
          notify(
            "Backend API is unreachable. UI will continue in degraded mode.",
            "warning",
          );
          hasWarnedApiAvailabilityRef.current = true;
        }
        if (showToast) {
          notify(formatApiError(error), "error");
        }
      }
    },
    [notify],
  );

  const refreshSessions = useCallback(async () => {
    try {
      const sessionItems = await listSessions();
      setSessions(sortSessions(sessionItems));
    } catch (error) {
      setDegradedNotice(
        "Unable to refresh sessions right now. Backend connectivity may be down.",
      );
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamBuffer]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.strategy, strategy);
  }, [strategy]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.websocket, String(useWebsocket));
  }, [useWebsocket]);

  useEffect(() => {
    if (sessionId) {
      writeStorage(STORAGE_KEYS.session, sessionId);
    }
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      notify("Network restored", "success");
    };
    const handleOffline = () => {
      setIsOnline(false);
      notify(
        "You are offline. Requests will fail until connection returns.",
        "warning",
      );
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [notify]);

  useEffect(() => {
    if (!useWebsocket || !isOnline) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setIsSocketConnected(false);
      return;
    }

    const socket = io(SOCKET_URL, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      timeout: 10000,
      reconnection: false,
      reconnectionAttempts: 0,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsSocketConnected(true);
      if (sessionIdRef.current) {
        socket.emit("join_session", { session_id: sessionIdRef.current });
        activeSocketSessionRef.current = sessionIdRef.current;
      }
      if (!hasAnnouncedSocketRef.current) {
        notify("Real-time channel connected", "success");
        hasAnnouncedSocketRef.current = true;
      }
    });

    socket.on("disconnect", () => {
      setIsSocketConnected(false);
    });

    socket.on("connect_error", () => {
      setIsSocketConnected(false);
      setUseWebsocket(false);
      setDegradedNotice(
        "Realtime channel is unavailable. Falling back to REST mode.",
      );
      if (!hasWarnedSocketFallbackRef.current) {
        notify("Socket unavailable. Using REST transport.", "warning");
        hasWarnedSocketFallbackRef.current = true;
      }
      socket.disconnect();
    });

    socket.on("response_chunk", (data: { chunk: string }) => {
      setStreamBuffer((prev) => prev + data.chunk);
    });

    socket.on(
      "response_complete",
      (data: {
        response: string;
        strategy?: string;
        sources?: ChatResult["sources"];
        metadata?: ChatResult["metadata"];
        api_chain_trace?: ApiTraceStep[];
      }) => {
        setIsResponding(false);
        setStreamBuffer("");

        setMessages((prev) => [
          ...prev,
          {
            id: uuidv4(),
            role: "assistant",
            content: data.response,
            timestamp: new Date().toISOString(),
            strategy: data.strategy,
            sources: data.sources,
            metadata: data.metadata,
            apiChainTrace: data.api_chain_trace ?? [],
          },
        ]);
        void refreshSessions();
      },
    );

    socket.on("error", (data: { message?: string }) => {
      setIsResponding(false);
      setStreamBuffer("");
      setUseWebsocket(false);
      setDegradedNotice(
        "Realtime channel failed. Switched to REST mode automatically.",
      );
      notify(
        data.message || "Unknown socket error. Switched to REST.",
        "error",
      );
      socket.disconnect();
    });

    return () => {
      socket.disconnect();
    };
  }, [isOnline, notify, refreshSessions, useWebsocket]);

  useEffect(() => {
    if (!sessionId || !socketRef.current?.connected) {
      return;
    }

    const socket = socketRef.current;
    if (
      activeSocketSessionRef.current &&
      activeSocketSessionRef.current !== sessionId
    ) {
      socket.emit("leave_session", {
        session_id: activeSocketSessionRef.current,
      });
    }

    socket.emit("join_session", { session_id: sessionId });
    activeSocketSessionRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      setIsInitializing(true);
      try {
        const [
          strategiesResult,
          healthResult,
          systemInfoResult,
          toolsResult,
          sessionsResult,
        ] = await Promise.allSettled([
          withTimeout(fetchStrategies(), STARTUP_TIMEOUT_MS),
          withTimeout(fetchHealth(), STARTUP_TIMEOUT_MS),
          withTimeout(fetchSystemInfo(), STARTUP_TIMEOUT_MS),
          withTimeout(fetchTools(), STARTUP_TIMEOUT_MS),
          withTimeout(listSessions(), STARTUP_TIMEOUT_MS),
        ]);

        if (!isMounted) {
          return;
        }

        const loadedStrategies =
          strategiesResult.status === "fulfilled"
            ? strategiesResult.value
            : DEFAULT_STRATEGIES;
        setStrategies(loadedStrategies);

        if (healthResult.status === "fulfilled") {
          setHealth(healthResult.value);
          if (healthResult.value.backend_api_available) {
            setDegradedNotice("");
          }
        }
        if (systemInfoResult.status === "fulfilled") {
          setSystemInfo(systemInfoResult.value);
        }
        if (toolsResult.status === "fulfilled") {
          setBackendTools(toolsResult.value.tools);
        }

        const sorted =
          sessionsResult.status === "fulfilled"
            ? sortSessions(sessionsResult.value)
            : [];
        setSessions(sorted);

        const preferredStrategy =
          readStorage(STORAGE_KEYS.strategy) ?? "hybrid";
        const strategyExists = loadedStrategies.some(
          (item) => item.id === preferredStrategy,
        );
        if (!strategyExists && loadedStrategies.length > 0) {
          setStrategy(loadedStrategies[0].id);
        }

        const persistedSessionId = readStorage(STORAGE_KEYS.session);
        const availableSessionId =
          persistedSessionId &&
          sorted.some((item) => item.session_id === persistedSessionId)
            ? persistedSessionId
            : "";

        if (availableSessionId) {
          await loadSession(availableSessionId, false);
        } else {
          try {
            const newSessionId = await withTimeout(
              createSession(),
              STARTUP_TIMEOUT_MS,
            );
            if (!isMounted) {
              return;
            }
            setSessionId(newSessionId);
            setMessages([
              buildSystemMessage(
                "New session created. Ask your first question.",
              ),
            ]);
            await refreshSessions();
          } catch {
            setMessages([
              buildSystemMessage(
                "Backend is currently unavailable. UI is loaded in read-only/degraded mode. Use Refresh Health to retry connectivity.",
              ),
            ]);
            setDegradedNotice(
              "Backend API is unreachable. UI remains available, but chat/session actions will fail until services recover.",
            );
          }
        }

        const failedBootstrap =
          strategiesResult.status === "rejected" ||
          healthResult.status === "rejected" ||
          systemInfoResult.status === "rejected" ||
          toolsResult.status === "rejected" ||
          sessionsResult.status === "rejected";

        if (failedBootstrap && !hasWarnedApiAvailabilityRef.current) {
          notify(
            "Some backend services are unavailable. Interface is running in degraded mode.",
            "warning",
          );
          hasWarnedApiAvailabilityRef.current = true;
          setDegradedNotice(
            (previous) =>
              previous ||
              "Some backend services are unavailable. Core UI is still operational.",
          );
        }
      } catch (error) {
        notify(formatApiError(error), "error");
        setMessages([
          buildSystemMessage(
            "System initialized with partial data. Retry with Refresh Health.",
          ),
        ]);
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    void initialize();

    return () => {
      isMounted = false;
    };
  }, [loadSession, notify, refreshSessions]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void refreshHealth();
    }, 30000);

    return () => {
      window.clearInterval(timer);
    };
  }, [refreshHealth]);

  const sendViaRest = useCallback(
    async (query: string) => {
      const result = await sendChatMessage({ query, strategy, sessionId });

      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: "assistant",
          content: result.response,
          timestamp: new Date().toISOString(),
          strategy: result.strategy,
          sources: result.sources,
          metadata: result.metadata,
          apiChainTrace: result.api_chain_trace ?? [],
        },
      ]);
    },
    [sessionId, strategy],
  );

  const handleSend = async () => {
    const query = inputValue.trim();
    if (!query || isResponding || isInitializing || isLoadingSession) {
      return;
    }

    if (!sessionId) {
      notify("Session not ready yet. Please wait a moment.", "warning");
      return;
    }

    setInputValue("");
    setIsResponding(true);

    setMessages((prev) => [
      ...prev,
      {
        id: uuidv4(),
        role: "user",
        content: query,
        timestamp: new Date().toISOString(),
      },
    ]);

    const shouldUseSocket =
      isOnline && useWebsocket && isSocketConnected && socketRef.current;

    try {
      if (shouldUseSocket) {
        socketRef.current?.emit("chat_message", {
          query,
          session_id: sessionId,
          strategy,
        });
      } else {
        await sendViaRest(query);
        setIsResponding(false);
      }
      await refreshSessions();
    } catch (error) {
      setIsResponding(false);
      setStreamBuffer("");
      notify(formatApiError(error), "error");
      setDegradedNotice(
        "Request failed. Backend API may be unavailable. Please retry after services recover.",
      );
    }
  };

  const handleRefreshHealth = async () => {
    await refreshHealth(true);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const result = await uploadDocument(file);
      notify(
        `${result.filename} indexed (${result.added_chunks} chunks)`,
        "success",
      );
    } catch (error) {
      notify(formatApiError(error), "error");
    } finally {
      event.target.value = "";
    }
  };

  const handleCreateSession = async () => {
    try {
      setIsLoadingSession(true);
      const newSessionId = await createSession();
      setSessionId(newSessionId);
      setMessages([
        buildSystemMessage("New session created. Start a fresh conversation."),
      ]);
      setStreamBuffer("");
      setInputValue("");
      await refreshSessions();
      notify("New session created", "success");
    } catch (error) {
      notify(formatApiError(error), "error");
    } finally {
      setIsLoadingSession(false);
    }
  };

  const handleDeleteSession = async (targetSessionId: string) => {
    const confirmed = window.confirm(
      "Delete this session and its server-side history?",
    );
    if (!confirmed) {
      return;
    }

    try {
      await removeSession(targetSessionId);
      notify("Session deleted", "info");

      if (targetSessionId === sessionId) {
        const replacementSessionId = await createSession();
        setSessionId(replacementSessionId);
        setMessages([
          buildSystemMessage("Current session deleted. New session started."),
        ]);
      }

      await refreshSessions();
    } catch (error) {
      notify(formatApiError(error), "error");
    }
  };

  const handleCopyLatestResponse = async () => {
    const latestAssistant = [...messages]
      .reverse()
      .find((message) => message.role === "assistant");
    if (!latestAssistant?.content) {
      notify("No assistant response available to copy", "warning");
      return;
    }

    try {
      await navigator.clipboard.writeText(latestAssistant.content);
      notify("Latest response copied to clipboard", "success");
    } catch (error) {
      notify(formatApiError(error), "error");
    }
  };

  const latestAssistantMessage = useMemo(
    () =>
      [...messages].reverse().find((message) => message.role === "assistant"),
    [messages],
  );

  const latestTrace = useMemo<ApiTraceStep[]>(
    () =>
      [...messages]
        .reverse()
        .find(
          (message) =>
            message.role === "assistant" && message.apiChainTrace?.length,
        )?.apiChainTrace ?? [],
    [messages],
  );

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        height: { xs: "auto", lg: "100dvh" },
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
        overflowY: { xs: "auto", lg: "hidden" },
      }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        color="transparent"
        sx={{ backdropFilter: "blur(8px)" }}
      >
        <Toolbar
          sx={{
            gap: { xs: 1, md: 1.5 },
            py: { xs: 0.75, md: 0 },
            flexWrap: { xs: "wrap", md: "nowrap" },
            borderBottom: "1px solid",
            borderColor: "var(--outline)",
          }}
        >
          <IconButton onClick={() => setDrawerOpen(true)}>
            <MenuRoundedIcon />
          </IconButton>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AutoAwesomeRoundedIcon sx={{ color: "var(--brand-blue)" }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                letterSpacing: 0.2,
                fontSize: { xs: 17, md: 20 },
              }}
            >
              RAG Portfolio Copilot
            </Typography>
          </Box>

          <Box
            sx={{
              ml: "auto",
              width: { xs: "100%", md: "auto" },
              display: "flex",
              alignItems: "center",
              justifyContent: { xs: "flex-start", md: "flex-end" },
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Chip
              size="small"
              icon={<HubRoundedIcon />}
              label={isSocketConnected ? "Realtime On" : "Realtime Off"}
              color={isSocketConnected ? "success" : "default"}
              variant="outlined"
              sx={{ px: 0.75, py: 0.2 }}
            />
            <Chip
              size="small"
              icon={<LanRoundedIcon />}
              label={isOnline ? "Online" : "Offline"}
              color={isOnline ? "success" : "warning"}
              variant="outlined"
              sx={{ px: 0.75, py: 0.2 }}
            />
            <Chip
              size="small"
              icon={<BoltRoundedIcon />}
              label={useWebsocket ? "WebSocket" : "REST"}
              variant="outlined"
              onClick={() => setUseWebsocket((prev) => !prev)}
            />
            <Tooltip title="Create a new chat session">
              <IconButton onClick={() => void handleCreateSession()}>
                <AddRoundedIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Copy latest assistant response">
              <IconButton onClick={() => void handleCopyLatestResponse()}>
                <ContentCopyRoundedIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh health status">
              <IconButton onClick={() => void handleRefreshHealth()}>
                <RefreshRoundedIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Container
        maxWidth="xl"
        sx={{
          py: 2,
          flexGrow: 1,
          minHeight: { xs: "auto", lg: 0 },
          display: "flex",
          flexDirection: "column",
          gap: 2,
          overflow: { xs: "visible", lg: "hidden" },
        }}
      >
        {degradedNotice ? (
          <Alert severity="warning" variant="outlined">
            {degradedNotice}
          </Alert>
        ) : null}
        <Box
          sx={{
            flexGrow: 1,
            minHeight: { xs: "auto", lg: 0 },
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(0, 2fr) minmax(340px, 1fr)",
            },
            gap: 2,
            overflow: { xs: "visible", lg: "hidden" },
          }}
        >
          <Paper
            elevation={0}
            sx={{
              borderRadius: 4,
              border: "1px solid var(--outline)",
              backgroundColor: "rgba(255,255,255,0.72)",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                px: 2.5,
                py: 1.5,
                borderBottom: "1px solid",
                borderColor: "var(--outline)",
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.25}
                alignItems={{ md: "center" }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Chat Workspace
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flexWrap: "wrap",
                  }}
                >
                  <Chip
                    label={`Session ${sessionId ? sessionId.slice(0, 8) : "..."}`}
                    size="small"
                  />
                  <Chip
                    label={`${messages.length} messages`}
                    size="small"
                    variant="outlined"
                  />
                  {health?.rag_engine_ready ? (
                    <Chip
                      label="Engine Ready"
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  ) : (
                    <Chip
                      label="Engine Warming"
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Stack>

              <Box
                sx={{
                  mt: 1.25,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                  alignItems: "stretch",
                }}
              >
                {QUICK_PROMPTS.map((prompt) => (
                  <Chip
                    key={prompt}
                    label={prompt}
                    size="small"
                    variant="outlined"
                    onClick={() => setInputValue(prompt)}
                    sx={{
                      width: { xs: "100%", md: "auto" },
                      maxWidth: { xs: "100%", md: 380 },
                      height: "auto",
                      borderRadius: 1.5,
                      justifyContent: "flex-start",
                      borderColor: "rgba(11,95,255,0.3)",
                      backgroundColor: "rgba(11,95,255,0.04)",
                      transition: "all 160ms ease",
                      "& .MuiChip-label": {
                        display: "block",
                        whiteSpace: "normal",
                        lineHeight: 1.3,
                        paddingTop: 0.65,
                        paddingBottom: 0.65,
                      },
                      "&:hover": {
                        backgroundColor: "rgba(11,95,255,0.1)",
                        borderColor: "rgba(11,95,255,0.6)",
                        transform: "translateY(-1px)",
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Box
              sx={{
                flexGrow: 1,
                overflowY: "auto",
                p: 2.5,
                display: "grid",
                gap: 1.5,
              }}
            >
              {isInitializing ? (
                <Box sx={{ py: 8, textAlign: "center" }}>
                  <CircularProgress size={34} />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1.5 }}
                  >
                    Initializing production workspace...
                  </Typography>
                </Box>
              ) : (
                messages.map((message) => (
                  <Message key={message.id} message={message} />
                ))
              )}

              {isResponding && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    border: "1px solid var(--outline)",
                    backgroundColor: "rgba(255,255,255,0.82)",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 1, fontWeight: 700 }}
                  >
                    Assistant is responding...
                  </Typography>
                  {streamBuffer ? (
                    <Typography
                      variant="body1"
                      sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}
                    >
                      {streamBuffer}
                      <Box
                        component="span"
                        className="blinking-cursor"
                        sx={{ ml: 0.5 }}
                      >
                        |
                      </Box>
                    </Typography>
                  ) : (
                    <LinearProgress sx={{ borderRadius: 999 }} />
                  )}
                </Paper>
              )}

              {isLoadingSession && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    border: "1px dashed var(--outline)",
                    borderRadius: 2.5,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Loading session history...
                  </Typography>
                </Paper>
              )}
              <div ref={messagesEndRef} />
            </Box>
          </Paper>

          <Stack
            spacing={2}
            sx={{
              minHeight: 0,
              overflowY: { xs: "visible", lg: "auto" },
              pr: { lg: 0.5 },
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: SIDEBAR_CARD_RADIUS,
                border: "1px solid var(--outline)",
                backgroundColor: "rgba(255,255,255,0.76)",
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Retrieval Strategy
              </Typography>
              <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                <InputLabel>Strategy</InputLabel>
                <Select
                  label="Strategy"
                  value={strategy}
                  onChange={(event) => setStrategy(event.target.value)}
                  disabled={isInitializing}
                >
                  {strategies.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="body2" color="text.secondary">
                {strategies.find((item) => item.id === strategy)?.description}
              </Typography>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: SIDEBAR_CARD_RADIUS,
                border: "1px solid var(--outline)",
                backgroundColor: "rgba(255,255,255,0.76)",
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Latest Citations
              </Typography>
              {latestAssistantMessage?.sources &&
              latestAssistantMessage.sources.length > 0 ? (
                <Stack spacing={1}>
                  {latestAssistantMessage.sources
                    .slice(0, 4)
                    .map((source, index) => (
                      <Typography
                        key={`${source.source}-${index}`}
                        variant="body2"
                        color="text.secondary"
                      >
                        {index + 1}. {source.source} (
                        {Math.round(source.score * 100)}%)
                      </Typography>
                    ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Citations will appear after assistant responses.
                </Typography>
              )}
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: SIDEBAR_CARD_RADIUS,
                border: "1px solid var(--outline)",
                backgroundColor: "rgba(255,255,255,0.76)",
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Agentic API Chain
              </Typography>
              {latestTrace.length > 0 ? (
                <Stack spacing={0.75}>
                  {latestTrace.slice(0, 8).map((item, index) => {
                    const tool = String(item.tool ?? "unknown");
                    const status = String(item.status ?? "unknown");
                    const reason = String(item.reason ?? "");
                    const duration = item.duration_ms
                      ? ` | ${item.duration_ms} ms`
                      : "";
                    return (
                      <Typography
                        key={`${tool}-${index}`}
                        variant="body2"
                        color="text.secondary"
                      >
                        {index + 1}. {tool} {"->"} {status}
                        {reason ? ` (${reason})` : ""}
                        {duration}
                      </Typography>
                    );
                  })}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Agentic tool execution trace will appear here.
                </Typography>
              )}
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: SIDEBAR_CARD_RADIUS,
                border: "1px solid var(--outline)",
                backgroundColor: "rgba(255,255,255,0.76)",
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Runtime Snapshot
              </Typography>
              <Stack spacing={0.75}>
                <Typography variant="body2" color="text.secondary">
                  Model: {systemInfo?.llm_model ?? "..."}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Embedder: {systemInfo?.embedding_model ?? "..."}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  API Version: {systemInfo?.api_version ?? "..."}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Backend API:{" "}
                  {health?.backend_api_available ? "Reachable" : "Unavailable"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Sessions: {health?.active_sessions ?? 0}
                </Typography>
              </Stack>
            </Paper>
          </Stack>
        </Box>
      </Container>

      <Paper
        elevation={0}
        sx={{
          borderTop: "1px solid var(--outline)",
          backgroundColor: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(6px)",
        }}
      >
        <Container maxWidth="xl" sx={{ py: 1.5 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1}
            alignItems={{ md: "center" }}
          >
            <input
              ref={fileInputRef}
              type="file"
              hidden
              onChange={handleUpload}
              accept=".txt,.md,.pdf,.docx"
            />
            <Tooltip title="Upload and index document">
              <Button
                variant="outlined"
                startIcon={<UploadFileRoundedIcon />}
                onClick={() => fileInputRef.current?.click()}
              >
                Upload
              </Button>
            </Tooltip>
            <TextField
              fullWidth
              multiline
              maxRows={5}
              placeholder="Ask a portfolio question, request analysis, or cite source-backed insights..."
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleInputKeyDown}
              disabled={isResponding || isInitializing}
            />
            <Button
              variant="contained"
              endIcon={<SendRoundedIcon />}
              onClick={() => void handleSend()}
              disabled={!inputValue.trim() || isResponding || isInitializing}
              sx={{ minWidth: { xs: "100%", md: 140 } }}
            >
              Send
            </Button>
          </Stack>
        </Container>
      </Paper>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 360, p: 2.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Platform Controls
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Session management, transport control, and backend tool visibility.
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1.2}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={() => void handleCreateSession()}
            >
              New Session
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<InsightsRoundedIcon />}
              onClick={() => void handleRefreshHealth()}
            >
              Refresh Health
            </Button>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
            Sessions
          </Typography>
          <List
            dense
            sx={{
              maxHeight: 220,
              overflowY: "auto",
              border: "1px solid var(--outline)",
              borderRadius: 2,
            }}
          >
            {sessions.length === 0 && (
              <Box sx={{ p: 1.5 }}>
                <Typography variant="body2" color="text.secondary">
                  No sessions available.
                </Typography>
              </Box>
            )}
            {sessions.map((item) => (
              <ListItemButton
                key={item.session_id}
                selected={item.session_id === sessionId}
                onClick={() => void loadSession(item.session_id)}
              >
                <ListItemText
                  primary={`${item.session_id.slice(0, 8)} (${item.message_count})`}
                  secondary={new Date(item.created_at).toLocaleString()}
                />
                <IconButton
                  size="small"
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleDeleteSession(item.session_id);
                  }}
                >
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              </ListItemButton>
            ))}
          </List>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
            Backend Tools ({backendTools.length})
          </Typography>
          <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
            {backendTools.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No tools advertised by backend.
              </Typography>
            ) : (
              backendTools.map((toolName) => (
                <Chip
                  key={toolName}
                  size="small"
                  icon={<StorageRoundedIcon />}
                  label={toolName}
                  variant="outlined"
                />
              ))
            )}
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
            API Endpoints
          </Typography>
          <Stack spacing={0.75}>
            <Typography variant="body2" color="text.secondary">
              POST /api/chat
            </Typography>
            <Typography variant="body2" color="text.secondary">
              POST /api/chat/completions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              GET /api/system/info
            </Typography>
            <Typography variant="body2" color="text.secondary">
              GET /api/tools
            </Typography>
            <Typography variant="body2" color="text.secondary">
              GET /api/sessions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              GET /openapi.json
            </Typography>
          </Stack>
        </Box>
      </Drawer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ChatInterface;
