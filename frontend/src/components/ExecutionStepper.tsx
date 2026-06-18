import React from 'react';

export interface IExecutionLog {
  status: string;
  message: string;
  timestamp: string;
}

interface ExecutionStepperProps {
  logs: IExecutionLog[];
  active: boolean;
}

export const ExecutionStepper: React.FC<ExecutionStepperProps> = ({ logs, active }) => {
  if (!active && logs.length === 0) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="h-6 w-6 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-xs font-bold animate-fade-in shrink-0">
            ✓
          </span>
        );
      case 'correcting':
        return (
          <span className="h-6 w-6 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xs font-bold animate-pulse shrink-0">
            ⚠️
          </span>
        );
      case 'failed':
        return (
          <span className="h-6 w-6 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center text-xs font-bold shrink-0">
            ✕
          </span>
        );
      default:
        // Loading state
        return (
          <span className="h-6 w-6 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </span>
        );
    }
  };

  const getLogStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-400 font-semibold';
      case 'correcting':
        return 'text-amber-400 font-semibold';
      case 'failed':
        return 'text-rose-400 font-semibold';
      default:
        return 'text-indigo-400 font-medium';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-950 border border-slate-900 rounded-3xl p-6 shadow-2xl space-y-4 font-mono select-none relative overflow-hidden">
      {/* Visual background gradient glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 via-transparent to-transparent pointer-events-none" />

      {/* Terminal Title Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-2">
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-full bg-rose-500/70" />
          <div className="h-3 w-3 rounded-full bg-amber-500/70" />
          <div className="h-3 w-3 rounded-full bg-emerald-500/70" />
        </div>
        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Analysis Engine Log</span>
      </div>

      {/* Steps List */}
      <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
        {logs.length === 0 ? (
          <div className="flex items-center space-x-3 text-xs text-slate-500">
            {getStatusIcon('running')}
            <span className="animate-pulse">Initializing engine...</span>
          </div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="flex items-start space-x-3 text-xs animate-slide-up">
              {getStatusIcon(log.status)}
              <div className="space-y-1 py-0.5">
                <span className={getLogStyle(log.status)}>{log.message}</span>
                <span className="text-[9px] text-slate-605 block mt-0.5 font-medium">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
export default ExecutionStepper;
