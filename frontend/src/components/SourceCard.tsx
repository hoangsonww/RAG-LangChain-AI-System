import { Box, Chip, Link, Paper, Typography } from "@mui/material";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import type { ChatSource } from "../types/chat";

interface SourceCardProps {
  source: ChatSource;
  index: number;
}

const SourceCard = ({ source, index }: SourceCardProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "success";
    if (score >= 0.6) return "warning";
    return "default";
  };

  const scoreLabel =
    source.score >= 0.8 ? "High" : source.score >= 0.6 ? "Medium" : "Low";
  const isLink =
    source.source.startsWith("http://") || source.source.startsWith("https://");

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        borderRadius: 2,
        borderColor: "var(--outline)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.78), rgba(255,255,255,0.94))",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 0.75,
          flexWrap: "wrap",
        }}
      >
        {isLink ? (
          <LanguageRoundedIcon
            sx={{ fontSize: 18, color: "var(--brand-blue)" }}
          />
        ) : (
          <DescriptionOutlinedIcon
            sx={{ fontSize: 18, color: "var(--brand-blue)" }}
          />
        )}
        {isLink ? (
          <Link
            href={source.source}
            target="_blank"
            rel="noreferrer"
            underline="hover"
            sx={{
              fontSize: "0.875rem",
              fontWeight: 700,
              flexGrow: 1,
              minWidth: 0,
            }}
          >
            [{index + 1}] {source.source}
          </Link>
        ) : (
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, flexGrow: 1, minWidth: 0 }}
          >
            [{index + 1}] {source.source}
          </Typography>
        )}
        <Chip
          size="small"
          label={`${Math.round(source.score * 100)}%`}
          color={getScoreColor(source.score)}
          sx={{ fontWeight: 600 }}
        />
        <Chip
          size="small"
          label={scoreLabel}
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      </Box>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ lineHeight: 1.5, whiteSpace: "pre-wrap" }}
      >
        {source.preview}
      </Typography>
    </Paper>
  );
};

export default SourceCard;
