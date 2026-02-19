/**
 * Utility functions for the Saleor Telegram Mini App
 */

/**
 * Strips HTML tags from a string and returns plain text
 */
export function stripHtml(value: string): string {
  if (!value) return "";
  const doc = new DOMParser().parseFromString(value, "text/html");
  return doc.body.textContent || "";
}

/**
 * Truncates text to a maximum length with ellipsis
 */
export function truncateText(value: string, maxLength: number): string {
  if (!value) return "";
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}…`;
}

/**
 * Formats a monetary amount with currency symbol
 */
export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      currencyDisplay: "symbol",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency || ""}`.trim();
  }
}

/**
 * Builds a pseudo-email from Telegram user data for Saleor checkout
 */
export function buildPseudoEmail(
  userData: { id?: number; username?: string } | null,
): string {
  if (!userData) {
    return `guest+${Date.now()}@telegram.local`;
  }
  if (userData.username) {
    return `${userData.username}@telegram.local`;
  }
  const safeId = userData.id
    ? String(userData.id).replace(/\D+/g, "")
    : Date.now();
  return `user${safeId}@telegram.local`;
}

/**
 * Validates environment variables and returns configuration
 */
export function getAppConfig(): {
  saleorApiUrl: string;
  saleorChannel: string;
  saleorDocsUrl: string;
} {
  const saleorApiUrl =
    import.meta.env.VITE_SALEOR_API_URL ||
    "https://demo.saleor.io/graphql/";
  const saleorChannel =
    import.meta.env.VITE_SALEOR_CHANNEL || "default-channel";
  const saleorDocsUrl =
    import.meta.env.VITE_SALEOR_DOCS_URL || "https://docs.saleor.io";

  // Validate URL format
  try {
    new URL(saleorApiUrl);
  } catch {
    console.warn(
      `Invalid VITE_SALEOR_API_URL: ${saleorApiUrl}. Using default.`,
    );
  }

  return {
    saleorApiUrl,
    saleorChannel,
    saleorDocsUrl,
  };
}
