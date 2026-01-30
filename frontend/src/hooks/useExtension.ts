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
# app/models/models.py (Дополнение)

class ExamSession(Base):
    __tablename__ = "exam_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    # ... поля пользователя и экзамена ...
    
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    
    # Итоговый статус после анализа
    status = Column(String(20), default="in_progress") # in_progress, finished, reviewed
    
    # Результат работы AI
    ai_risk_score = Column(Integer, default=0) # 0 (Чисто) - 100 (Списывал)
    ai_verdict_text = Column(Text, nullable=True) # Объяснение: "Студент часто смотрел влево..."
    
    # Связь с нарушениями
    violations = relationship("Violation", back_populates="session")

class Violation(Base):
    __tablename__ = "violations"
    
    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey("exam_sessions.id"))
    
    type = Column(String(50)) # GAZE_AWAY, TAB_SWITCH, FACE_MISSING
    timestamp = Column(DateTime)
    duration = Column(Float, default=0.0) # Сколько длилось нарушение (сек)
    
    # Ссылка на видео-доказательство в MinIO (для апелляции)
    video_url = Column(String(255), nullable=True)