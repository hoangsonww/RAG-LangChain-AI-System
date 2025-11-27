import React from 'react';
import { Box, Typography, Chip, Paper } from '@mui/material';
import { Article as ArticleIcon } from '@mui/icons-material';

interface Source {
  source: string;
  score: number;
  preview: string;
}

interface SourceCardProps {
  source: Source;
  index: number;
}

const SourceCard: React.FC<SourceCardProps> = ({ source, index }) => {
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'error';
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        bgcolor: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <ArticleIcon sx={{ fontSize: 16, mr: 1, opacity: 0.7 }} />
        <Typography variant="caption" sx={{ flex: 1, fontWeight: 'bold' }}>
          [{index + 1}] {source.source}
        </Typography>
        <Chip
          label={`${(source.score * 100).toFixed(0)}%`}
          size="small"
          color={getScoreColor(source.score)}
          sx={{ height: 18, fontSize: '0.65rem' }}
        />
      </Box>
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          opacity: 0.8,
          fontStyle: 'italic',
          fontSize: '0.7rem',
        }}
      >
        {source.preview}
      </Typography>
    </Paper>
  );
};

export default SourceCard;
