import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import theme from "../config/boda.theme.json";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource/alegreya/latin-500.css";
import "@fontsource/alegreya/latin-ext-500.css";
import "./styles/tokens.css";
import "./styles.css";

document.documentElement.dataset.season = theme.activeSeason;

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");

createRoot(root).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);
