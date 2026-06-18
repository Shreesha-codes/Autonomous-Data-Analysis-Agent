import React, { useState } from 'react';

export interface IColumnProfile {
  name: string;
  dataType: 'string' | 'number' | 'boolean' | 'date';
  nullCount: number;
  nullRate: number;
  uniqueCount: number;
  stats?: {
    min: number;
    max: number;
    mean: number;
    median: number;
    outliersCount: number;
  };
  anomalies: string[];
}

export interface IDatasetProfile {
  rowCount: number;
  columnCount: number;
  columns: IColumnProfile[];
}

interface ProfileDashboardProps {
  profile: IDatasetProfile;
}

export const ProfileDashboard: React.FC<ProfileDashboardProps> = ({ profile }) => {
  const [expandedCols, setExpandedCols] = useState<Record<string, boolean>>({});

  const toggleExpand = (name: string) => {
    setExpandedCols((prev) => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const getCompletenessColor = (rate: number) => {
    const completeness = (1 - rate) * 100;
    if (completeness > 90) return 'bg-emerald-500';
    if (completeness > 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const totalAnomalies = profile.columns.reduce((acc, col) => acc + col.anomalies.length, 0);

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Rows</span>
            <h4 className="text-2xl font-bold text-white tracking-tight">{profile.rowCount.toLocaleString()}</h4>
          </div>
          <div className="p-3.5 rounded-xl bg-violet-600/10 text-violet-400 border border-violet-500/10">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Columns</span>
            <h4 className="text-2xl font-bold text-white tracking-tight">{profile.columnCount}</h4>
          </div>
          <div className="p-3.5 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/10">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Anomalies Detected</span>
            <h4 className={`text-2xl font-bold tracking-tight ${totalAnomalies > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {totalAnomalies}
            </h4>
          </div>
          <div className={`p-3.5 rounded-xl border ${totalAnomalies > 0 ? 'bg-amber-500/10 text-amber-400 border-amber-500/15 animate-pulse' : 'bg-slate-800/40 text-slate-500 border-slate-700/10'}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Columns Profile List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-md font-bold text-white tracking-tight">Dataset Schema & Profiling</h3>
          <span className="text-xs text-slate-500 font-medium">Click on any column to inspect statistics</span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {profile.columns.map((col) => {
            const isExpanded = !!expandedCols[col.name];
            const completeness = ((1 - col.nullRate) * 100).toFixed(1);

            return (
              <div key={col.name} className="transition-all duration-200 hover:bg-slate-900/40">
                {/* Accordion Trigger */}
                <div
                  onClick={() => toggleExpand(col.name)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-center space-x-3 shrink-0">
                    <span className="font-semibold text-sm text-white">{col.name}</span>
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-800 text-indigo-400 border border-slate-700">
                      {col.dataType}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400">
                    {/* Completeness Bar */}
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Completeness:</span>
                      <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getCompletenessColor(col.nullRate)}`}
                          style={{ width: `${completeness}%` }}
                        />
                      </div>
                      <span className="font-bold text-white">{completeness}%</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <span>Unique values:</span>
                      <span className="font-bold text-slate-200">{col.uniqueCount}</span>
                    </div>

                    {col.anomalies.length > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25 flex items-center space-x-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping mr-1" />
                        <span>{col.anomalies.length} Warns</span>
                      </span>
                    )}

                    <svg
                      className={`w-4 h-4 text-slate-500 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Accordion Content */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 bg-slate-950/40 border-t border-slate-850 text-slate-350 space-y-4">
                    {col.anomalies.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Potential Issues</span>
                        <div className="space-y-1.5">
                          {col.anomalies.map((anomaly, i) => (
                            <div key={i} className="flex items-start space-x-2 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-xs text-amber-300 font-medium leading-relaxed">
                              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <span>{anomaly}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {col.dataType === 'number' && col.stats ? (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Descriptive Statistics</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl">
                            <span className="text-[10px] text-slate-500 block font-semibold">Min</span>
                            <span className="text-sm font-bold text-slate-200 mt-1 block">{col.stats.min.toLocaleString()}</span>
                          </div>
                          <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl">
                            <span className="text-[10px] text-slate-500 block font-semibold">Max</span>
                            <span className="text-sm font-bold text-slate-200 mt-1 block">{col.stats.max.toLocaleString()}</span>
                          </div>
                          <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl">
                            <span className="text-[10px] text-slate-500 block font-semibold">Mean</span>
                            <span className="text-sm font-bold text-slate-200 mt-1 block">{col.stats.mean.toFixed(2)}</span>
                          </div>
                          <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl">
                            <span className="text-[10px] text-slate-500 block font-semibold">Median</span>
                            <span className="text-sm font-bold text-slate-200 mt-1 block">{col.stats.median.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 font-medium">
                        No stats summary available for {col.dataType} type fields.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
