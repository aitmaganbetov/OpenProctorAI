// src/hooks/useExtension.ts
import { useState, useEffect, useCallback, useMemo } from 'react';

interface ExtensionViolation {
  type: string;
  details?: string;
  timestamp: number;
}

type ViolationHandler = (violation: ExtensionViolation) => void;

const EXTENSION_CHECK_MESSAGE = 'CHECK_EXTENSION_INSTALLED';
const EXTENSION_PONG_MESSAGE = 'EXTENSION_PONG';
const EXTENSION_VIOLATION_MESSAGE = 'EXTENSION_VIOLATION';

/**
 * Hook for communicating with browser proctoring extension.
 * Detects extension installation and receives violation events.
 */
export const useExtension = (onViolation?: ViolationHandler) => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check for extension
    window.postMessage({ type: EXTENSION_CHECK_MESSAGE }, '*');

    // Timeout for extension response
    const timeout = setTimeout(() => {
      setIsChecking(false);
    }, 2000);

    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from the same window
      if (event.source !== window) return;

      const { type, payload } = event.data || {};

      if (type === EXTENSION_PONG_MESSAGE) {
        setIsInstalled(true);
        setIsChecking(false);
        clearTimeout(timeout);
      }

      if (type === EXTENSION_VIOLATION_MESSAGE && onViolation) {
        console.warn('Extension detected violation:', payload);
        onViolation({
          type: payload?.type || 'UNKNOWN',
          details: payload?.details,
          timestamp: Date.now(),
        });
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeout);
    };
  }, [onViolation]);

  // Send message to extension
  const sendToExtension = useCallback((action: string, data?: unknown) => {
    if (!isInstalled) return false;

    window.postMessage(
      {
        type: 'PROCTORING_ACTION',
        action,
        data,
      },
      '*'
    );
    return true;
  }, [isInstalled]);

  return useMemo(
    () => ({
      isInstalled,
      isChecking,
      sendToExtension,
    }),
    [isInstalled, isChecking, sendToExtension]
  );
};