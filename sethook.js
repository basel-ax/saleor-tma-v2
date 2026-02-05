"use strict";

if (typeof fetch !== "function") {
  console.error(
    "Global fetch API is not available. Please use Node.js 18 or newer.",
  );
  process.exit(1);
}

const { TELEGRAM_BOT_TOKEN, REMOTE_PATH } = process.env;

if (!TELEGRAM_BOT_TOKEN) {
  console.error("Missing TELEGRAM_BOT_TOKEN environment variable.");
  process.exit(1);
}

if (!REMOTE_PATH) {
  console.error("Missing REMOTE_PATH environment variable.");
  process.exit(1);
}

const trimmedBase = REMOTE_PATH.endsWith("/")
  ? REMOTE_PATH.slice(0, -1)
  : REMOTE_PATH;
const webhookUrl = `${trimmedBase}/telegram`;
const endpoint = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`;

async function main() {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: webhookUrl,
      drop_pending_updates: true,
    }),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (_error) {
    // ignore JSON parse errors; handled below
  }

  if (!response.ok) {
    console.error(
      `Telegram API responded with HTTP ${response.status} ${response.statusText}`,
    );
    if (payload) {
      console.error(JSON.stringify(payload, null, 2));
    }
    process.exit(1);
  }

  if (!payload?.ok) {
    console.error("Webhook set failed!");
    if (payload) {
      console.error(JSON.stringify(payload, null, 2));
    }
    process.exit(1);
  }

  console.log(webhookUrl);
  console.log("Webhook set successfully!");
}

main().catch((error) => {
  console.error("Unexpected error while setting webhook.");
  console.error(error);
  process.exit(1);
});
