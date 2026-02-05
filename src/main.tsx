import React from "react";
import ReactDOM from "react-dom/client";
import {
  init,
  themeParams,
  miniApp,
  viewport,
  backButton,
  mainButton,
} from "@tma.js/sdk-react";

import App from "./App";
import "./styles/app.css";

function bootstrap() {
  try {
    init({ acceptCustomStyles: true });
  } catch (error) {
    console.warn("Telegram SDK init failed, continuing in web mode.", error);
  }

  try {
    themeParams.mount();
    themeParams.bindCssVars();
  } catch (error) {
    console.warn("Theme params unavailable.", error);
  }

  try {
    miniApp.mount();
    miniApp.ready();
  } catch (error) {
    console.warn("Mini app mount failed.", error);
  }

  try {
    viewport.mount();
    viewport.expand();
  } catch (error) {
    console.warn("Viewport not available.", error);
  }

  try {
    backButton.mount();
    mainButton.mount();
  } catch (error) {
    console.warn("Buttons unavailable.", error);
  }
}

bootstrap();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
