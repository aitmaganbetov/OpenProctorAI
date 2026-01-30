// src/components/student/StudentDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Exam } from '../../services/api';
import api from '../../services/api';
import { ExamInterface } from './ExamInterface';

export const StudentDashboard: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [completedExams, setCompletedExams] = useState<string[]>([]);

  useEffect(() => {
    const loadExams = async () => {
      try {
        const examsData = await api.getExams();
        setExams(examsData);
        // Load completed exams from localStorage
        const saved = localStorage.getItem('completedExams');
        if (saved) setCompletedExams(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load exams:', error);
      } finally {
        setLoading(false);
      }
    };

    loadExams();
  }, []);

  if (selectedExam) {
    return (
      <ExamInterface
        exam={selectedExam}
        onComplete={(examId) => {
          setCompletedExams([...completedExams, examId]);
          localStorage.setItem('completedExams', JSON.stringify([...completedExams, examId]));
          setSelectedExam(null);
        }}
        onCancel={() => setSelectedExam(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Available Exams</h1>
          <p className="text-gray-400">Select an exam to begin. Make sure your environment is properly set up.</p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          </div>
        ) : exams.length === 0 ? (
          <div className="text-center py-12 bg-slate-800 rounded-xl border border-slate-700">
            <svg className="w-12 h-12 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-400 text-lg">No exams available at the moment</p>
            <p className="text-gray-500 text-sm mt-2">Check back later for new exams</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => {
              const isCompleted = completedExams.includes(exam.id);
              return (
                <div
                  key={exam.id}
                  className={`rounded-xl border transition-all ${
                    isCompleted
                      ? 'bg-slate-700 border-slate-600 opacity-75'
                      : 'bg-slate-800 border-slate-700 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-6 border-b border-slate-700">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-bold text-white flex-1">{exam.title}</h3>
                      {isCompleted && (
                        <span className="px-3 py-1 bg-green-900/20 text-green-400 text-xs font-medium rounded-full ml-2">
                          ✓ Completed
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">{exam.description}</p>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 space-y-4">
                    {/* Exam Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-700/50 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-1">Duration</p>
                        <p className="text-lg font-semibold text-white">{exam.duration_minutes} min</p>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-1">Questions</p>
                        <p className="text-lg font-semibold text-white">{exam.questions.length}</p>
                      </div>
                    </div>

                    {/* Points Info */}
                    <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
                      <p className="text-xs text-blue-300 mb-1">Total Points</p>
                      <p className="text-lg font-semibold text-blue-400">
                        {exam.questions.reduce((sum, q) => sum + (q.points || 0), 0)} pts
                      </p>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => setSelectedExam(exam)}
                      disabled={isCompleted}
                      className={`w-full py-3 font-medium rounded-lg transition-all ${
                        isCompleted
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                      }`}
                    >
                      {isCompleted ? 'Already Completed' : 'Start Exam'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Important Notice */}
        <div className="mt-12 bg-amber-900/20 border border-amber-700/50 rounded-xl p-6">
          <div className="flex gap-4">
            <svg className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" />
            </svg>
            <div>
              <h4 className="font-semibold text-amber-400 mb-1">Before You Start</h4>
              <ul className="text-amber-300/80 text-sm space-y-1">
                <li>✓ Ensure your webcam is working properly</li>
                <li>✓ Have a clear, well-lit environment</li>
                <li>✓ Close all unnecessary applications</li>
                <li>✓ Use Google Chrome or Firefox for best compatibility</li>
                <li>✓ You will not be able to switch tabs during the exam</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
