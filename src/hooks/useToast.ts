/**
 * Custom hook for toast notifications
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { ToastState } from "../types";

/**
 * Hook for managing toast notifications
 */
export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    message: "",
    visible: false,
  });
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = useCallback((message: string, duration = 2800) => {
    setToast({ message, visible: true });
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, duration);
  }, []);

  return { toast, showToast };
}
