import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import ChatInterface from "./components/ChatInterface";
import AppErrorBoundary from "./components/AppErrorBoundary";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0b5fff",
      dark: "#0547c2",
      light: "#4b87ff",
    },
    secondary: {
      main: "#ea6f1f",
      light: "#f39849",
      dark: "#b14f12",
    },
    background: {
      default: "#f5f8ff",
      paper: "#ffffff",
    },
    text: {
      primary: "#12203a",
      secondary: "#435371",
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: [
      '"IBM Plex Sans"',
      '"Avenir Next"',
      '"Segoe UI"',
      "system-ui",
      "sans-serif",
    ].join(","),
    h6: {
      fontWeight: 700,
    },
    subtitle1: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ":root": {
          colorScheme: "light",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 10,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 14,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
  },
});

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppErrorBoundary>
        <ChatInterface />
      </AppErrorBoundary>
    </ThemeProvider>
  );
};

export default App;
