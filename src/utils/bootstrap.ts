/**
 * Telegram Mini App SDK bootstrap utilities
 */

import {
  init,
  themeParams,
  miniApp,
  viewport,
  backButton,
  mainButton,
} from "@tma.js/sdk-react";

/**
 * Initializes the Telegram Mini App SDK with proper error handling
 * Based on best practices from tma-llms-txt guide
 */
export function bootstrapTelegramSDK(): void {
  // Initialize SDK with custom styles support
  try {
    init({ acceptCustomStyles: true });
  } catch (error) {
    console.warn("Telegram SDK init failed, continuing in web mode.", error);
  }

  // Mount and bind theme parameters
  try {
    themeParams.mount();
    themeParams.bindCssVars();
  } catch (error) {
    console.warn("Theme params unavailable.", error);
  }

  // Mount mini app and signal readiness
  try {
    miniApp.mount();
    miniApp.ready();
  } catch (error) {
    console.warn("Mini app mount failed.", error);
  }

  // Expand viewport for better UX
  try {
    viewport.mount();
    viewport.expand();
  } catch (error) {
    console.warn("Viewport not available.", error);
  }

  // Mount UI buttons (they will be shown/hidden as needed)
  try {
    backButton.mount();
    mainButton.mount();
  } catch (error) {
    console.warn("Buttons unavailable.", error);
  }
}
