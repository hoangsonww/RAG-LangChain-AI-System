import React, { type ErrorInfo, type ReactNode } from "react";
import { Alert, Box, Button, Paper, Typography } from "@mui/material";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Unhandled frontend error", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <Box
        sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2 }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            border: "1px solid var(--outline)",
            maxWidth: 640,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Frontend runtime error
          </Typography>
          <Alert severity="error" sx={{ mb: 2 }}>
            {this.state.message ?? "The interface hit an unexpected error."}
          </Alert>
          <Button variant="contained" onClick={this.handleReload}>
            Reload application
          </Button>
        </Paper>
      </Box>
    );
  }
}

export default AppErrorBoundary;
