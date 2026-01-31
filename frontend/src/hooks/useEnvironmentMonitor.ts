// src/hooks/useEnvironmentMonitor.ts
import { useEffect, useCallback, useRef } from 'react';

type ViolationCallback = (type: string, details?: string) => void;

interface MonitorOptions {
  requireFullscreen?: boolean;
  blockCopyPaste?: boolean;
  enabled?: boolean;
}

const DEFAULT_OPTIONS: Required<MonitorOptions> = {
  requireFullscreen: true,
  blockCopyPaste: true,
  enabled: true,
};

/**
 * Hook for monitoring user environment during exam.
 * Detects tab switches, focus loss, fullscreen exit, and clipboard access.
 */
export const useEnvironmentMonitor = (
  onViolation: ViolationCallback,
  options: MonitorOptions = {}
) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const callbackRef = useRef(onViolation);

  // Keep callback ref updated without re-subscribing to events
  useEffect(() => {
    callbackRef.current = onViolation;
  }, [onViolation]);

  // Tab visibility change handler
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      callbackRef.current('TAB_SWITCH', 'User switched browser tab');
    }
  }, []);

  // Window blur handler (Alt+Tab or overlay app)
  const handleWindowBlur = useCallback(() => {
    // Don't duplicate if document is hidden (visibility change fires first)
    if (!document.hidden) {
      callbackRef.current('FOCUS_LOSS', 'Window lost focus (overlay app or dual monitor)');
    }
  }, []);

  // Fullscreen change handler
  const handleFullscreenChange = useCallback(() => {
    if (!document.fullscreenElement) {
      callbackRef.current('FULLSCREEN_EXIT', 'User exited fullscreen mode');
    }
  }, []);

  // Clipboard event handler
  const handleClipboard = useCallback((e: ClipboardEvent) => {
    e.preventDefault();
    callbackRef.current('CLIPBOARD_ATTEMPT', `Attempted to ${e.type} content`);
  }, []);

  // Context menu blocker
  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
  }, []);

  // Subscribe to events
  useEffect(() => {
    if (!opts.enabled) return;

    // Visibility and focus
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    // Fullscreen
    if (opts.requireFullscreen) {
      document.addEventListener('fullscreenchange', handleFullscreenChange);
    }

    // Clipboard blocking
    if (opts.blockCopyPaste) {
      const clipboardHandler = handleClipboard as EventListener;
      document.addEventListener('copy', clipboardHandler);
      document.addEventListener('cut', clipboardHandler);
      document.addEventListener('paste', clipboardHandler);
      document.addEventListener('contextmenu', handleContextMenu);
    }

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      
      const clipboardHandler = handleClipboard as EventListener;
      document.removeEventListener('copy', clipboardHandler);
      document.removeEventListener('cut', clipboardHandler);
      document.removeEventListener('paste', clipboardHandler);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [opts.enabled, opts.requireFullscreen, opts.blockCopyPaste, handleVisibilityChange, handleWindowBlur, handleFullscreenChange, handleClipboard, handleContextMenu]);

  // Fullscreen helper
  const enterFullscreen = useCallback(async (): Promise<boolean> => {
    try {
      await document.documentElement.requestFullscreen();
      return true;
    } catch (error) {
      console.error('Fullscreen request denied:', error);
      return false;
    }
  }, []);

  const exitFullscreen = useCallback(async (): Promise<boolean> => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      return true;
    } catch (error) {
      console.error('Exit fullscreen failed:', error);
      return false;
    }
  }, []);

  return {
    enterFullscreen,
    exitFullscreen,
    isFullscreen: !!document.fullscreenElement,
  };
};