// theme.ts
import { createTheme } from "@mui/material/styles";

const brand = {
  purple: {
    main: "#4A148C",   // deep purple
    dark: "#2E0854",
    light: "#7B2CBF",
  },
  cyan: {
    main: "#26C6DA",   // cyan accent
    dark: "#0097A7",
    light: "#4DD0E1",
  },
};

// ---------- LIGHT THEME ----------
export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: brand.purple.main, dark: brand.purple.dark, light: brand.purple.light },
    secondary: { main: brand.cyan.main, dark: brand.cyan.dark, light: brand.cyan.light },

    background: {
      default: "#F7F8FC",
      paper: "#FFFFFF",
    },

    text: {
      primary: "#151A2D",
      secondary: "#4A5568",
    },

    divider: "#E6E8F0",

    // Semantic colors (transit-friendly)
    success: { main: "#2E7D32" },
    warning: { main: "#F59E0B" },
    error: { main: "#D32F2F" },
    info: { main: brand.cyan.light },
  },

  shape: { borderRadius: 14 },

  typography: {
    fontFamily: [
      "Inter",
      "system-ui",
      "-apple-system",
      "Segoe UI",
      "Roboto",
      "Helvetica",
      "Arial",
      "sans-serif",
    ].join(","),
    button: { textTransform: "none", fontWeight: 600 },
    h6: { fontWeight: 700 },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#F7F8FC",
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: "none",
        },
      },
    },

    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
          color: "#151A2D",
          borderBottom: "1px solid #E6E8F0",
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingInline: 16,
          paddingBlock: 10,
        },
        containedPrimary: {
          boxShadow: "none",
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 999, fontWeight: 600 },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          border: "1px solid #EEF0F6",
          boxShadow: "0 10px 30px rgba(18, 18, 40, 0.06)",
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          backgroundColor: "#F1F3FA",
        },
        notchedOutline: { borderColor: "transparent" },
        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: brand.cyan.main,
          borderWidth: 2,
        },
      },
    },

    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          borderTop: "1px solid #E6E8F0",
          backgroundColor: "#FFFFFF",
        },
      },
    },
  },
});

// ---------- DARK THEME ----------
export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: brand.purple.light, dark: brand.purple.main, light: "#9F6BFF" },
    secondary: { main: brand.cyan.main, dark: brand.cyan.dark, light: brand.cyan.light },

    background: {
      default: "#0B1020", // deep navy-purple
      paper: "#12162A",   // elevated surface
    },

    text: {
      primary: "#E9EAF2",
      secondary: "#B7BCD1",
    },

    divider: "#242B46",

    success: { main: "#4CAF50" },
    warning: { main: "#FBBF24" },
    error: { main: "#EF5350" },
    info: { main: brand.cyan.light },
  },

  shape: { borderRadius: 14 },

  typography: {
    fontFamily: [
      "Inter",
      "system-ui",
      "-apple-system",
      "Segoe UI",
      "Roboto",
      "Helvetica",
      "Arial",
      "sans-serif",
    ].join(","),
    button: { textTransform: "none", fontWeight: 600 },
    h6: { fontWeight: 700 },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: "#0B1020" },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: "none",
          border: "1px solid rgba(123, 44, 191, 0.12)", // subtle purple edge
        },
      },
    },

    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: "rgba(18, 22, 42, 0.85)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid #242B46",
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingInline: 16,
          paddingBlock: 10,
        },
        containedPrimary: {
          boxShadow: "0 10px 30px rgba(74, 20, 140, 0.35)",
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          boxShadow: "0 18px 50px rgba(0, 0, 0, 0.35)",
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          backgroundColor: "rgba(255, 255, 255, 0.04)",
        },
        notchedOutline: { borderColor: "rgba(255, 255, 255, 0.10)" },
        "&:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: "rgba(38, 198, 218, 0.35)",
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: brand.cyan.main,
          borderWidth: 2,
        },
      },
    },

    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          borderTop: "1px solid #242B46",
          backgroundColor: "rgba(18, 22, 42, 0.92)",
          backdropFilter: "blur(10px)",
        },
      },
    },
  },
});
