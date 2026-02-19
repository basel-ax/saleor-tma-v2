/**
 * GraphQL utility functions
 */

import type { GraphQLResponse, GraphQLError } from "../types";

/**
 * Makes a GraphQL request to the Saleor API
 */
export async function graphQLRequest<T = unknown>(
  url: string,
  query: string,
  variables: Record<string, unknown>,
  authHeader: string | null,
): Promise<T> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (authHeader) {
    headers.Authorization = authHeader;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `API request failed (${response.status}): ${
        errorText || response.statusText
      }`,
    );
  }

  const payload: GraphQLResponse<T> = await response.json();
  if (payload.errors?.length) {
    const errorMessages = payload.errors
      .map((err: GraphQLError) => err.message)
      .filter(Boolean);
    throw new Error(errorMessages.join(", ") || "GraphQL request failed");
  }

  if (!payload.data) {
    throw new Error("No data returned from GraphQL query");
  }

  return payload.data;
}
