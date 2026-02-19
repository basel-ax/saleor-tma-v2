import React from "react";
import ReactDOM from "react-dom/client";
import { bootstrapTelegramSDK } from "./utils/bootstrap";
import { ErrorBoundary } from "./components/ErrorBoundary";
import App from "./App";
import "./styles/app.css";

// Bootstrap Telegram SDK before rendering
bootstrapTelegramSDK();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
