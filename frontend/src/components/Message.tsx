import { Box, Chip, Divider, Paper, Typography } from "@mui/material";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import ReactMarkdown from "react-markdown";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

import type { ChatMessage } from "../types/chat";
import SourceCard from "./SourceCard";

SyntaxHighlighter.registerLanguage("tsx", tsx);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("javascript", javascript);
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("bash", bash);

interface MessageProps {
  message: ChatMessage;
  compact?: boolean;
}

const Message = ({ message, compact = false }: MessageProps) => {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  const title = isUser ? "You" : isSystem ? "System" : "RAG Assistant";

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: isUser ? 720 : 920,
          p: compact ? 1.5 : 2,
          borderRadius: 3,
          border: "1px solid",
          borderColor: isUser ? "rgba(11, 95, 255, 0.28)" : "var(--outline)",
          background: isUser
            ? "linear-gradient(145deg, rgba(11,95,255,0.12), rgba(11,95,255,0.04))"
            : isSystem
              ? "linear-gradient(145deg, rgba(243, 152, 73, 0.20), rgba(243,152,73,0.08))"
              : "rgba(255,255,255,0.78)",
          backdropFilter: "blur(4px)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 1,
            flexWrap: "wrap",
          }}
        >
          {isUser ? (
            <PersonRoundedIcon sx={{ color: "var(--brand-blue)" }} />
          ) : isSystem ? (
            <InfoOutlinedIcon sx={{ color: "var(--brand-orange)" }} />
          ) : (
            <SmartToyRoundedIcon sx={{ color: "var(--brand-blue)" }} />
          )}
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          {message.strategy && (
            <Chip
              label={message.strategy}
              size="small"
              variant="outlined"
              sx={{ borderRadius: 1.5 }}
            />
          )}
          {message.metadata?.cache_hit && (
            <Chip
              size="small"
              icon={
                <AutorenewRoundedIcon sx={{ fontSize: "0.8rem !important" }} />
              }
              label="Cache hit"
              variant="outlined"
              sx={{ borderRadius: 1.5 }}
            />
          )}
          {message.metadata?.api_chain_calls ? (
            <Chip
              size="small"
              icon={<HubRoundedIcon sx={{ fontSize: "0.8rem !important" }} />}
              label={`${message.metadata.api_chain_calls} tool calls`}
              variant="outlined"
              sx={{ borderRadius: 1.5 }}
            />
          ) : null}
          {message.metadata?.latency_ms ? (
            <Chip
              size="small"
              icon={<BoltRoundedIcon sx={{ fontSize: "0.8rem !important" }} />}
              label={`${message.metadata.latency_ms} ms`}
              variant="outlined"
              sx={{ borderRadius: 1.5 }}
            />
          ) : null}
          <Typography
            variant="caption"
            sx={{ ml: "auto", color: "text.secondary" }}
          >
            {new Date(message.timestamp).toLocaleTimeString()}
          </Typography>
        </Box>

        {isUser || isSystem ? (
          <Typography
            variant="body1"
            sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}
          >
            {message.content}
          </Typography>
        ) : (
          <Box
            sx={{
              "& p": { lineHeight: 1.7, mb: 1.2 },
              "& ul, & ol": { pl: 2.5 },
              "& pre": {
                my: 1.5,
                borderRadius: 2,
                border: "1px solid var(--outline)",
              },
            }}
          >
            <ReactMarkdown
              components={{
                a: ({ ...props }) => (
                  <a {...props} target="_blank" rel="noreferrer" />
                ),
                code: ({ className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || "");
                  const codeText = String(children).replace(/\n$/, "");
                  if (!match) {
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }

                  return (
                    <SyntaxHighlighter
                      language={match[1]}
                      style={oneLight}
                      PreTag="div"
                      customStyle={{
                        margin: 0,
                        padding: "0.85rem",
                        borderRadius: 10,
                        fontSize: "0.86rem",
                      }}
                    >
                      {codeText}
                    </SyntaxHighlighter>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </Box>
        )}

        {message.sources && message.sources.length > 0 && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ display: "grid", gap: 1 }}>
              {message.sources
                .slice(0, compact ? 2 : message.sources.length)
                .map((source, index) => (
                  <SourceCard
                    key={`${source.source}-${index}`}
                    source={source}
                    index={index}
                  />
                ))}
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default Message;
