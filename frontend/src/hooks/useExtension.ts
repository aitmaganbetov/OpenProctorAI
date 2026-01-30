// src/hooks/useExtension.ts
import { useState, useEffect } from 'react';

export const useExtension = () => {
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Пинг расширения
    window.postMessage({ type: "CHECK_EXTENSION_INSTALLED" }, "*");

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "EXTENSION_PONG") {
        setIsInstalled(true);
      }
      if (event.data.type === "EXTENSION_VIOLATION") {
        // Вызываем наш стандартный хендлер нарушений
        console.error("Extension detected violation:", event.data.payload);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return { isInstalled };
};