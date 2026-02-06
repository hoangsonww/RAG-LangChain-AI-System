export type ChatRole = "user" | "assistant" | "system";

export interface ChatSource {
  source: string;
  score: number;
  preview: string;
}

export interface ApiTraceStep {
  tool?: string;
  status?: string;
  reason?: string;
  duration_ms?: number;
  [key: string]: unknown;
}

export interface ChatMetadata {
  cache_hit?: boolean;
  latency_ms?: number;
  timestamp?: string;
  api_chain_calls?: number;
}

export interface ChatResult {
  query: string;
  response: string;
  strategy: string;
  num_documents: number;
  sources: ChatSource[];
  api_data_keys: string[];
  api_chain_trace?: ApiTraceStep[];
  metadata?: ChatMetadata;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
  strategy?: string;
  sources?: ChatSource[];
  metadata?: ChatMetadata;
  apiChainTrace?: ApiTraceStep[];
}

export interface SessionMessagePair {
  timestamp: string;
  query: string;
  response: string;
  strategy: string;
}

export interface SessionData {
  created_at: string;
  messages: SessionMessagePair[];
}

export interface SessionSummary {
  session_id: string;
  created_at: string;
  message_count: number;
}

export interface ToolManifest {
  tools: string[];
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
}

export interface SystemInfo {
  app_name: string;
  api_version: string;
  environment: string;
  llm_model: string;
  embedding_model: string;
  rerank_model: string;
  max_query_chars: number;
  available_strategies: string[];
  backend_tools?: string[];
}

export interface HealthStatus {
  status: string;
  rag_engine_initialized: boolean;
  rag_engine_ready: boolean;
  backend_api_available: boolean;
  active_sessions: number;
  response_cache_size: number;
  request_id: string;
}
