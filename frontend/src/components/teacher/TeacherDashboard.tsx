// src/components/teacher/TeacherDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Exam, ExamSession } from '../../services/api';
import api from '../../services/api';
import { CreateExamForm } from './CreateExamForm';
import { SessionDetail } from './SessionDetail';

export const TeacherDashboard: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [selectedSession, setSelectedSession] = useState<ExamSession | null>(null);
  const [activeTab, setActiveTab] = useState<'exams' | 'results' | 'assignments'>('exams');
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const examsData = await api.getExams();
        setExams(examsData);
        // Load assignments
        try {
          const assignmentsData = await api.getAssignments();
          setAssignments(assignmentsData);
        } catch (err) {
          console.warn('Could not load assignments:', err);
        }
      } catch (error) {
        console.error('Failed to load exams:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCreateExam = async (examData: Partial<Exam>) => {
    try {
      await api.createExam(examData);
      // Refresh the exams list from server to reflect persisted data
      const examsData = await api.getExams();
      setExams(examsData);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create exam:', error);
    }
  };

  if (selectedSession) {
    return <SessionDetail session={selectedSession} onBack={() => setSelectedSession(null)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Teacher Dashboard</h1>
            <p className="text-gray-400">Manage your exams and monitor student sessions</p>
          </div>
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Exam
            </button>
          )}
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="mb-8">
            <CreateExamForm
              initialExam={editingExam || undefined}
              onSubmit={async (examData) => {
                if (editingExam) {
                  // update
                  await api.putExam(editingExam.id as any, examData);
                  const examsData = await api.getExams();
                  setExams(examsData);
                  setEditingExam(null);
                  setShowCreateForm(false);
                } else {
                  await handleCreateExam(examData);
                }
              }}
              onCancel={() => { setEditingExam(null); setShowCreateForm(false); }}
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('exams')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'exams'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17s4.5 10.747 10 10.747c5.5 0 10-4.998 10-10.747S17.5 6.253 12 6.253z" />
              </svg>
              My Exams ({exams.length})
            </span>
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'results'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Results
            </span>
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          </div>
        ) : activeTab === 'exams' ? (
          // Exams Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-slate-800 rounded-xl border border-slate-700">
                <p className="text-gray-400 mb-4">No exams created yet</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  Create your first exam →
                </button>
              </div>
            ) : (
              exams.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-blue-500 transition-all hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer group"
                >
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                    {exam.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">{exam.description}</p>
                  <div className="space-y-2 mb-4 text-sm text-gray-400">
                    <p>⏱️ Duration: {exam.duration_minutes} minutes</p>
                    <p>❓ Questions: {exam.questions.length}</p>
                    <p>📅 Created: {new Date(exam.created_at).toLocaleDateString()}</p>
                  </div>
                  <button className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors">
                    View Details
                  </button>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const email = prompt('Enter student email to assign this exam:');
                        if (!email) return;
                        try {
                          await api.assignExam(exam.id as any, { student_email: email });
                          alert('Assigned successfully');
                        } catch (err) {
                          console.error(err);
                          alert('Assign failed');
                        }
                      }}
                      className="px-3 py-2 bg-emerald-600 text-white rounded-md text-sm"
                    >
                      Assign
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingExam(exam);
                        setShowCreateForm(true);
                      }}
                      className="px-3 py-2 bg-yellow-600 text-white rounded-md text-sm"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'results' ? (
          // Results Table
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-700 border-b border-slate-600">
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Student</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Exam</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Score</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Violations</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Date</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-300">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                        No exam results yet
                      </td>
                    </tr>
                  ) : (
                    sessions.map((session) => (
                      <tr key={session.id} className="border-b border-slate-700 hover:bg-slate-700 transition-colors">
                        <td className="px-6 py-4 text-white">{session.student_id}</td>
                        <td className="px-6 py-4 text-white">{session.exam_id}</td>
                        <td className="px-6 py-4 text-white font-semibold">{session.score || '—'}%</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            session.violations.length === 0
                              ? 'bg-green-900/20 text-green-400'
                              : 'bg-red-900/20 text-red-400'
                          }`}>
                            {session.violations.length}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm">
                          {new Date(session.started_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => setSelectedSession(session)}
                            className="text-blue-400 hover:text-blue-300 font-medium"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // Assignments view
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Assignments</h3>
            {assignments.length === 0 ? (
              <div className="text-gray-400">No assignments yet</div>
            ) : (
              <div className="space-y-4">
                {assignments.map((a) => (
                  <div key={a.id} className="p-4 bg-slate-700 rounded-md flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">{a.exam_title || `Exam ${a.exam_id}`}</div>
                      <div className="text-sm text-gray-400">Student: {a.student_email || a.student_id}</div>
                      <div className="text-sm text-gray-400">Assigned: {a.assigned_at || '—'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          if (!confirm('Unassign this exam from student?')) return;
                          try {
                            await api.deleteAssignment(a.id);
                            const newList = await api.getAssignments();
                            setAssignments(newList);
                          } catch (err) {
                            console.error(err);
                            alert('Failed to unassign');
                          }
                        }}
                        className="px-3 py-2 bg-red-600 text-white rounded-md text-sm"
                      >
                        Unassign
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
