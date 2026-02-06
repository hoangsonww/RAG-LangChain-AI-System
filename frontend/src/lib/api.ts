import axios, { AxiosError } from "axios";
import type {
  ChatResult,
  HealthStatus,
  SessionData,
  SessionSummary,
  Strategy,
  SystemInfo,
  ToolManifest,
} from "../types/chat";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const API_GATEWAY_TOKEN = import.meta.env.VITE_API_GATEWAY_TOKEN;

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  if (!config.headers["X-Request-ID"]) {
    config.headers["X-Request-ID"] = crypto.randomUUID();
  }
  if (API_GATEWAY_TOKEN && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${API_GATEWAY_TOKEN}`;
  }
  return config;
});

export class ApiRequestError extends Error {
  status?: number;
  requestId?: string;

  constructor(
    message: string,
    options?: { status?: number; requestId?: string },
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = options?.status;
    this.requestId = options?.requestId;
  }
}

const toError = (error: unknown): ApiRequestError => {
  const axiosError = error as AxiosError<{ error?: string }>;
  const message =
    axiosError.response?.data?.error ??
    axiosError.message ??
    "Unexpected API error";
  const requestId = axiosError.response?.headers?.["x-request-id"] as
    | string
    | undefined;
  return new ApiRequestError(message, {
    status: axiosError.response?.status,
    requestId,
  });
};

export async function createSession(): Promise<string> {
  try {
    const { data } = await client.post<{
      success: boolean;
      session_id: string;
    }>("/api/session");
    return data.session_id;
  } catch (error) {
    throw toError(error);
  }
}

export async function sendChatMessage(input: {
  query: string;
  strategy: string;
  sessionId?: string;
}): Promise<ChatResult> {
  try {
    const { data } = await client.post<{
      success: boolean;
      result: ChatResult;
    }>("/api/chat", {
      query: input.query,
      strategy: input.strategy,
      session_id: input.sessionId,
    });
    return data.result;
  } catch (error) {
    throw toError(error);
  }
}

export async function fetchStrategies(): Promise<Strategy[]> {
  try {
    const { data } = await client.get<{
      success: boolean;
      strategies: Strategy[];
    }>("/api/strategies");
    return data.strategies;
  } catch (error) {
    throw toError(error);
  }
}

export async function uploadDocument(
  file: File,
): Promise<{ message: string; filename: string; added_chunks: number }> {
  const form = new FormData();
  form.append("file", file);

  try {
    const { data } = await client.post("/api/upload", form, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return {
      message: data.message,
      filename: data.filename,
      added_chunks: data.added_chunks,
    };
  } catch (error) {
    throw toError(error);
  }
}

export async function fetchHealth(): Promise<HealthStatus> {
  try {
    const { data } = await client.get<HealthStatus>("/health");
    return data;
  } catch (error) {
    throw toError(error);
  }
}

export async function fetchSystemInfo(): Promise<SystemInfo> {
  try {
    const { data } = await client.get<{ success: boolean } & SystemInfo>(
      "/api/system/info",
    );
    return {
      app_name: data.app_name,
      api_version: data.api_version,
      environment: data.environment,
      llm_model: data.llm_model,
      embedding_model: data.embedding_model,
      rerank_model: data.rerank_model,
      max_query_chars: data.max_query_chars,
      available_strategies: data.available_strategies,
      backend_tools: data.backend_tools,
    };
  } catch (error) {
    throw toError(error);
  }
}

export async function fetchTools(): Promise<ToolManifest> {
  try {
    const { data } = await client.get<{ success: boolean; tools: string[] }>(
      "/api/tools",
    );
    return { tools: data.tools };
  } catch (error) {
    throw toError(error);
  }
}

export async function listSessions(): Promise<SessionSummary[]> {
  try {
    const { data } = await client.get<{
      success: boolean;
      sessions: SessionSummary[];
    }>("/api/sessions");
    return data.sessions;
  } catch (error) {
    throw toError(error);
  }
}

export async function fetchSession(sessionId: string): Promise<SessionData> {
  try {
    const { data } = await client.get<{
      success: boolean;
      session_id: string;
      session: SessionData;
    }>(`/api/session/${sessionId}`);
    return data.session;
  } catch (error) {
    throw toError(error);
  }
}

export async function removeSession(sessionId: string): Promise<void> {
  try {
    await client.delete(`/api/session/${sessionId}`);
  } catch (error) {
    throw toError(error);
  }
}
