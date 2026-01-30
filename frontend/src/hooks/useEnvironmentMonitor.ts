// src/hooks/useEnvironmentMonitor.ts
import { useEffect, useCallback } from 'react';

type ViolationCallback = (type: string, details?: string) => void;

interface MonitorOptions {
  requireFullscreen?: boolean;
  blockCopyPaste?: boolean;
}

export const useEnvironmentMonitor = (
  onViolation: ViolationCallback, 
  options: MonitorOptions = { requireFullscreen: true, blockCopyPaste: true }
) => {

  // 1. Детекция переключения вкладки (Visibility API)
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      onViolation("TAB_SWITCH", "User switched browser tab");
    }
  }, [onViolation]);

  // 2. Детекция потери фокуса окна (Alt+Tab или открытие другого окна)
  const handleWindowBlur = useCallback(() => {
    // Не считаем нарушением, если документ скрыт (т.к. сработает handleVisibilityChange)
    // Это нужно, чтобы не дублировать события
    if (!document.hidden) {
      onViolation("FOCUS_LOSS", "Window lost focus (overlay app or dual monitor)");
    }
  }, [onViolation]);

  // 3. Контроль полного экрана
  const handleFullscreenChange = useCallback(() => {
    if (options.requireFullscreen && !document.fullscreenElement) {
       onViolation("FULLSCREEN_EXIT", "User exited fullscreen mode");
    }
  }, [onViolation, options.requireFullscreen]);

  // 4. Блокировка и логирование копипаста
  const handleCopyPaste = useCallback((e: ClipboardEvent) => {
    if (options.blockCopyPaste) {
      e.preventDefault();
      // Определяем тип действия (copy, cut, paste)
      onViolation("CLIPBOARD_ATTEMPT", `Attempted to ${e.type} content`);
    }
  }, [onViolation, options.blockCopyPaste]);

  // 5. Защита от контекстного меню (Right Click)
  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
  }, []);

  useEffect(() => {
    // Подписываемся на события
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    
    if (options.requireFullscreen) {
      document.addEventListener("fullscreenchange", handleFullscreenChange);
    }
    
    if (options.blockCopyPaste) {
      document.addEventListener("copy", handleCopyPaste as any);
      document.addEventListener("cut", handleCopyPaste as any);
      document.addEventListener("paste", handleCopyPaste as any);
      document.addEventListener("contextmenu", handleContextMenu);
    }

    return () => {
      // Чистим за собой
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("copy", handleCopyPaste as any);
      document.removeEventListener("cut", handleCopyPaste as any);
      document.removeEventListener("paste", handleCopyPaste as any);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [handleVisibilityChange, handleWindowBlur, handleFullscreenChange, handleCopyPaste, handleContextMenu, options]);

  // Хелпер для принудительного входа в Fullscreen
  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch (e) {
      console.error("Fullscreen denied", e);
    }
  };

  return { enterFullscreen };
};