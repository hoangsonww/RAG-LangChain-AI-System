import React from 'react';
import { Box, Paper, Typography, Chip, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import {
  Person as UserIcon,
  AutoAwesome as AIIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import SourceCard from './SourceCard';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sources?: any[];
  strategy?: string;
}

interface MessageProps {
  message: ChatMessage;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.type === 'user';
  const isSystem = message.type === 'system';

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 2,
      }}
    >
      <Paper
        elevation={isUser ? 3 : 1}
        sx={{
          p: 2,
          maxWidth: '80%',
          bgcolor: isUser
            ? 'primary.main'
            : isSystem
            ? 'warning.dark'
            : 'background.paper',
          color: isUser || isSystem ? 'white' : 'text.primary',
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {isUser ? (
            <UserIcon sx={{ mr: 1, fontSize: 20 }} />
          ) : isSystem ? (
            <InfoIcon sx={{ mr: 1, fontSize: 20 }} />
          ) : (
            <AIIcon sx={{ mr: 1, fontSize: 20, color: 'primary.main' }} />
          )}
          <Typography variant="subtitle2" fontWeight="bold">
            {isUser ? 'You' : isSystem ? 'System' : 'AI Assistant'}
          </Typography>
          {message.strategy && (
            <Chip
              label={message.strategy}
              size="small"
              sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
            />
          )}
          <Typography
            variant="caption"
            sx={{ ml: 'auto', opacity: 0.7 }}
          >
            {message.timestamp.toLocaleTimeString()}
          </Typography>
        </Box>

        {/* Content */}
        <Box>
          {isUser || isSystem ? (
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {message.content}
            </Typography>
          ) : (
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </Box>

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <Accordion
            sx={{
              mt: 2,
              bgcolor: 'rgba(0,0,0,0.2)',
              color: 'inherit',
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">
                Sources ({message.sources.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {message.sources.map((source, index) => (
                  <SourceCard key={index} source={source} index={index} />
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}
      </Paper>
    </Box>
  );
};

export default Message;
