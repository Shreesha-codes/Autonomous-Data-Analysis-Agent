import React, { useState } from 'react';
import { useSessions } from '../context/SessionContext';

export const Sidebar: React.FC = () => {
  const { sessions, activeSession, createSession, fetchSessionById, loading } = useSessions();
  const [creating, setCreating] = useState(false);

  const handleNewSession = async () => {
    if (creating) return;
    setCreating(true);
    const newId = `session_${Date.now()}`;
    await createSession(newId, []);
    setCreating(false);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <aside className="w-80 h-screen bg-slate-900 border-r border-slate-800 flex flex-col text-slate-100 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3 bg-slate-950/40">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            DataMind AI
          </h1>
          <span className="text-xs text-indigo-400 font-semibold tracking-wider uppercase">Analytics Hub</span>
        </div>
      </div>

      {/* Action Button */}
      <div className="p-4">
        <button
          onClick={handleNewSession}
          disabled={loading || creating}
          className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:from-violet-700 active:to-indigo-700 rounded-xl font-medium text-sm flex items-center justify-center space-x-2 transition-all duration-200 shadow-md shadow-violet-900/30 hover:shadow-violet-600/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Analysis Session</span>
        </button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Recent Sessions ({sessions.length})
        </div>

        {sessions.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">
            No analysis sessions yet
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = activeSession?.sessionId === session.sessionId;
            return (
              <button
                key={session.sessionId}
                onClick={() => fetchSessionById(session.sessionId)}
                className={`w-full text-left p-3.5 rounded-xl transition-all duration-200 group flex flex-col space-y-1.5 ${
                  isActive
                    ? 'bg-violet-600/10 border border-violet-500/20 text-white shadow-inner'
                    : 'border border-transparent hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-sm truncate max-w-[160px] group-hover:text-indigo-400 transition-colors">
                    {session.sessionId}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {session.interactions.length} runs
                  </span>
                </div>
                <div className="flex items-center text-xs text-slate-500 space-x-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="truncate max-w-[190px]">
                    {session.filesUploaded?.[0]?.fileName || 'No files'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-600 group-hover:text-slate-500 transition-colors pt-1">
                  {formatDate(session.createdAt)}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/20 flex items-center justify-between text-xs text-slate-500">
        <span>Status: Connected</span>
        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>
    </aside>
  );
};
