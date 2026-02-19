/**
 * Custom hook for GraphQL requests
 */

import { useCallback, useMemo } from "react";
import { useRawInitData } from "@tma.js/sdk-react";
import { graphQLRequest } from "../utils/graphql";
import { getAppConfig } from "../utils";

/**
 * Hook for making GraphQL requests with authentication
 */
export function useGraphQL() {
  const rawInitData = useRawInitData();
  const config = useMemo(() => getAppConfig(), []);

  const authHeader = useMemo(
    () => (rawInitData ? `tma ${rawInitData}` : null),
    [rawInitData],
  );

  const request = useCallback(
    async <T = unknown>(
      query: string,
      variables: Record<string, unknown> = {},
    ): Promise<T> => {
      return graphQLRequest<T>(
        config.saleorApiUrl,
        query,
        variables,
        authHeader,
      );
    },
    [config.saleorApiUrl, authHeader],
  );

  return { request, config };
}
