import React from 'react';
import { ExamSession, Violation } from '../../services/api';

interface SessionDetailProps {
  session: ExamSession;
  onBack: () => void;
}

export const SessionDetail: React.FC<SessionDetailProps> = ({ session, onBack }) => {
  const sessionStartTime = new Date(session.started_at);
  const sessionEndTime = session.ended_at ? new Date(session.ended_at) : null;
  const duration = sessionEndTime
    ? Math.round((sessionEndTime.getTime() - sessionStartTime.getTime()) / 1000 / 60)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="text-blue-400 hover:text-blue-300 font-medium mb-6 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Results
        </button>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <p className="text-gray-400 text-sm mb-1">Student</p>
              <p className="text-2xl font-bold text-white">{session.student_id}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Score</p>
              <p className="text-2xl font-bold text-white">{session.score || 0}%</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Status</p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  session.status === 'completed'
                    ? 'bg-green-900/20 text-green-400'
                    : session.status === 'failed'
                    ? 'bg-red-900/20 text-red-400'
                    : 'bg-blue-900/20 text-blue-400'
                }`}
              >
                {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-700/50 rounded-lg">
            <div>
              <p className="text-gray-400 text-xs mb-1">Start Time</p>
              <p className="text-white font-mono text-sm">{sessionStartTime.toLocaleTimeString()}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">End Time</p>
              <p className="text-white font-mono text-sm">
                {sessionEndTime ? sessionEndTime.toLocaleTimeString() : '—'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Duration</p>
              <p className="text-white font-mono text-sm">{duration} minutes</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Violations</p>
              <p className="text-white font-mono text-sm font-bold">{session.violations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4v2m0 0v2m0-6V7a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Detected Violations ({session.violations.length})
          </h2>

          {session.violations.length === 0 ? (
            <div className="text-center py-8 bg-slate-700/50 rounded-lg">
              <p className="text-green-400 font-medium">✓ No violations detected</p>
              <p className="text-gray-400 text-sm mt-1">This student passed proctoring checks</p>
            </div>
          ) : (
            <div className="space-y-3">
              {session.violations.map((violation) => (
                <ViolationCard key={violation.id} violation={violation} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ViolationCard: React.FC<{ violation: Violation }> = ({ violation }) => {
  const timeStr = new Date(violation.timestamp).toLocaleTimeString();
  const severityColor =
    violation.severity === 'hard' ? 'bg-red-900/20 text-red-400' : 'bg-amber-900/20 text-amber-400';

  const violationIcons: Record<string, string> = {
    FACE_MISSING: '👤',
    MULTIPLE_FACES: '👥',
    FOCUS_LOSS: '👀',
    CLIPBOARD_ATTEMPT: '📋',
    PHONE_DETECTED: '📱',
    WINDOW_SWITCH: '🪟',
  };

  return (
    <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 hover:border-slate-500 transition-all">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{violationIcons[violation.type] || '⚠️'}</span>
            <div>
              <h3 className="font-semibold text-white">{violation.type.replace(/_/g, ' ')}</h3>
              <p className="text-xs text-gray-400">{timeStr}</p>
            </div>
          </div>
          <p className="text-sm text-gray-300">{violation.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${severityColor}`}>
            {violation.severity === 'hard' ? '🔴 Critical' : '🟡 Warning'}
          </span>
          {violation.video_url && (
            <a
              href={violation.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 font-medium text-sm"
            >
              View Video
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
