// src/components/student/ExamInterface.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Exam, Question } from '../../services/api';
import api from '../../services/api';
import { ProctoringSession } from '../ProctoringSession';

interface ExamInterfaceProps {
  exam: Exam;
  onComplete: (examId: string) => void;
  onCancel: () => void;
}

export const ExamInterface: React.FC<ExamInterfaceProps> = ({ exam, onComplete, onCancel }) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(exam.duration_minutes * 60);
  const [submitting, setSubmitting] = useState(false);
  const proctoringRef = useRef<HTMLDivElement>(null);

  // Start exam session
  useEffect(() => {
    const startSession = async () => {
      try {
        const session = await api.startExamSession(exam.id);
        setSessionId(session.id);
        setLoading(false);
      } catch (error) {
        console.error('Failed to start exam:', error);
        alert('Failed to start exam. Please try again.');
        onCancel();
      }
    };

    startSession();
  }, [exam.id, onCancel]);

  // Timer
  useEffect(() => {
    if (!sessionId) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = exam.questions[currentQuestionIndex];
  const isTimeRunningOut = timeRemaining < 300; // 5 minutes

  const handleAnswerChange = (answer: string) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: answer,
    });
  };

  const handleSubmit = useCallback(async () => {
    if (!sessionId) return;

    setSubmitting(true);
    try {
      await api.endExamSession(sessionId, answers);
      onComplete(exam.id);
    } catch (error) {
      console.error('Failed to submit exam:', error);
      alert('Failed to submit exam. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [sessionId, answers, exam.id, onComplete]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Starting exam...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col lg:flex-row">
      {/* Proctoring Section */}
      <div ref={proctoringRef} className="lg:w-1/3 bg-slate-800 border-r border-slate-700 flex flex-col">
        {sessionId && <ProctoringSession />}
      </div>

      {/* Exam Content Section */}
      <div className="flex-1 overflow-auto flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700 p-6 sticky top-0 z-40">
          <div className="flex justify-between items-start gap-6">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-1">{exam.title}</h1>
              <p className="text-gray-400 text-sm">Question {currentQuestionIndex + 1} of {exam.questions.length}</p>
            </div>

            {/* Timer */}
            <div
              className={`px-6 py-3 rounded-lg font-mono font-bold text-lg ${
                isTimeRunningOut
                  ? 'bg-red-900/30 text-red-400 border border-red-700'
                  : 'bg-slate-700 text-white'
              }`}
            >
              ⏱️ {formatTime(timeRemaining)}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 w-full bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-300"
              style={{
                width: `${((currentQuestionIndex + 1) / exam.questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Question Content */}
        <div className="flex-1 p-8">
          <div className="max-w-3xl mx-auto">
            {/* Question Text */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-6">{currentQuestion.text}</h2>

              {/* Question Type Badge */}
              <div className="inline-block px-3 py-1 bg-blue-900/20 text-blue-400 text-xs font-medium rounded-full mb-6">
                {currentQuestion.type === 'multiple_choice' && 'Multiple Choice'}
                {currentQuestion.type === 'short_answer' && 'Short Answer'}
                {currentQuestion.type === 'essay' && 'Essay'}
              </div>

              {/* Points Display */}
              <p className="text-gray-400 text-sm">
                Points: <span className="text-white font-semibold">{currentQuestion.points}</span>
              </p>
            </div>

            {/* Answer Options */}
            <div className="space-y-3 mb-8">
              {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
                <>
                  {currentQuestion.options.map((option, index) => (
                    <label
                      key={index}
                      className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all bg-slate-800 border-slate-700 hover:border-blue-500"
                      style={{
                        backgroundColor:
                          answers[currentQuestion.id] === option ? 'rgb(30 41 59 / 0.8)' : 'rgb(30 41 59)',
                        borderColor: answers[currentQuestion.id] === option ? '#3b82f6' : 'rgb(71 84 96)',
                      }}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={option}
                        checked={answers[currentQuestion.id] === option}
                        onChange={() => handleAnswerChange(option)}
                        className="w-5 h-5 cursor-pointer"
                      />
                      <span className="ml-4 text-white font-medium">{option}</span>
                    </label>
                  ))}
                </>
              )}

              {currentQuestion.type === 'short_answer' && (
                <input
                  type="text"
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="Type your answer..."
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              )}

              {currentQuestion.type === 'essay' && (
                <textarea
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="Type your essay answer..."
                  rows={6}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                />
              )}
            </div>
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="bg-slate-800 border-t border-slate-700 p-6">
          <div className="max-w-3xl mx-auto flex justify-between items-center">
            <button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-2 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            <div className="flex gap-2 flex-wrap justify-center">
              {exam.questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-10 h-10 rounded-lg font-medium transition-all ${
                    idx === currentQuestionIndex
                      ? 'bg-blue-500 text-white'
                      : answers[exam.questions[idx].id]
                      ? 'bg-green-900/30 text-green-400 border border-green-700'
                      : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            {currentQuestionIndex === exam.questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {submitting ? 'Submitting...' : 'Submit Exam'}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                className="px-6 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
