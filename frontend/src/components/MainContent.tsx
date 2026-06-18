import React, { useState } from 'react';
import { useSessions } from '../context/SessionContext';

export const MainContent: React.FC = () => {
  const { activeSession, addInteraction, loading } = useSessions();
  const [question, setQuestion] = useState('');
  const [running, setRunning] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !activeSession || running) return;

    setRunning(true);
    // Mock interaction generator
    const code = `import pandas as pd\nimport matplotlib.pyplot as plt\n\n# Load dataset\ndf = pd.read_csv("dataset.csv")\nprint(df.describe())\n\n# Plot configuration\nplt.figure(figsize=(10, 6))\nplt.title("Data distribution for ${question}")\nplt.show()`;
    
    const executionResult = {
      status: "success",
      rowsProcessed: 1250,
      columns: ["id", "timestamp", "metric_value", "category"],
      summary: {
        mean: 42.87,
        std: 15.42,
        min: 1.0,
        max: 99.0
      }
    };

    const chartData = {
      type: "bar",
      labels: ["Q1", "Q2", "Q3", "Q4"],
      datasets: [
        {
          label: "Performance Metrics",
          data: [12, 19, 3, 5],
          backgroundColor: "rgba(99, 102, 241, 0.5)"
        }
      ]
    };

    const narrative = {
      summary: `Analyzed dataset for query "${question}". The metric values show a standard normal distribution with a peak mean value around 42.87.`,
      insights: [
        "A strong concentration of activity is observed in Q2 (19 points).",
        "Performance variability remains within normal bounds.",
        "Q3 shows a significant drop-off, recommending investigation."
      ]
    };

    await addInteraction(activeSession.sessionId, {
      question,
      generatedCode: code,
      executionResult,
      chartData,
      narrative
    });

    setQuestion('');
    setRunning(false);
  };

  if (!activeSession) {
    return (
      <main className="flex-1 h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-8">
        <div className="max-w-md text-center space-y-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">Select or Start a Session</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Create a new data analysis workspace or select an existing session from the history sidebar to begin querying your datasets.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 h-screen bg-slate-950 flex flex-col text-slate-100 overflow-hidden">
      {/* Session Header */}
      <div className="p-6 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-xl font-bold text-white tracking-tight">{activeSession.sessionId}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active Workspace
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1.5 flex items-center space-x-2">
            <span>Uploaded Files:</span>
            {activeSession.filesUploaded.map((f, i) => (
              <span key={i} className="font-semibold text-slate-400">
                {f.fileName} ({(f.fileSize / 1024).toFixed(0)} KB)
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Interactions list */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {activeSession.interactions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-400">Ask a question about the dataset to generate analysis code and charts.</p>
              <p className="text-xs text-slate-600 mt-1">Example: "Find the average metrics grouped by category and plot it."</p>
            </div>
          </div>
        ) : (
          activeSession.interactions.map((interaction, idx) => (
            <div key={idx} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-6 shadow-xl backdrop-blur-sm">
              {/* Question Header */}
              <div className="flex items-start space-x-3">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm shrink-0">
                  Q
                </div>
                <div className="space-y-1">
                  <h3 className="text-md font-bold text-white leading-tight">{interaction.question}</h3>
                  <span className="text-[10px] text-slate-500">{new Date(interaction.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Code section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-2">
                  <span>Generated Python Code</span>
                  <button 
                    onClick={() => navigator.clipboard.writeText(interaction.generatedCode)}
                    className="hover:text-indigo-400 transition-colors flex items-center space-x-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto text-xs text-emerald-400 font-mono leading-relaxed">
                  <code>{interaction.generatedCode}</code>
                </pre>
              </div>

              {/* Grid for Results & Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Narrative insights */}
                <div className="space-y-3 p-5 bg-slate-950/40 rounded-xl border border-slate-800/60">
                  <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Analysis Narrative</h4>
                  <p className="text-sm text-slate-300 leading-relaxed font-medium">
                    {interaction.narrative?.summary}
                  </p>
                  <ul className="space-y-2 pt-2 border-t border-slate-800/60">
                    {interaction.narrative?.insights.map((insight: string, i: number) => (
                      <li key={i} className="text-xs text-slate-400 flex items-start space-x-2">
                        <span className="text-indigo-500 mt-0.5">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Chart Mockup */}
                <div className="space-y-3 p-5 bg-slate-950/40 rounded-xl border border-slate-800/60 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">Generated Visualization</h4>
                    <div className="h-32 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/5 to-indigo-500/5 pointer-events-none" />
                      {/* Drawing a simple pure CSS chart bar representation */}
                      <div className="flex items-end space-x-6 h-20 w-4/5 justify-center">
                        <div className="w-6 bg-gradient-to-t from-violet-600 to-indigo-500 rounded-t-sm h-[40%] animate-pulse" />
                        <div className="w-6 bg-gradient-to-t from-violet-600 to-indigo-500 rounded-t-sm h-[75%] animate-pulse" />
                        <div className="w-6 bg-gradient-to-t from-violet-600 to-indigo-500 rounded-t-sm h-[15%] animate-pulse" />
                        <div className="w-6 bg-gradient-to-t from-violet-600 to-indigo-500 rounded-t-sm h-[25%] animate-pulse" />
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 flex justify-between px-1">
                    <span>Chart: {interaction.chartData?.type}</span>
                    <span>Dataset size: {interaction.executionResult?.rowsProcessed} rows</span>
                  </div>
                </div>
              </div>

              {/* JSON execution response snippet */}
              <details className="group border border-slate-800/60 rounded-xl bg-slate-950/20">
                <summary className="p-3 text-xs font-semibold text-slate-400 cursor-pointer select-none hover:text-white flex items-center justify-between">
                  <span>Show Execution Outputs JSON</span>
                  <svg className="w-4 h-4 transform group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="p-4 border-t border-slate-800/60 font-mono text-[10px] text-slate-300 bg-slate-950 overflow-x-auto">
                  <pre>{JSON.stringify(interaction.executionResult, null, 2)}</pre>
                </div>
              </details>
            </div>
          ))
        )}
      </div>

      {/* Input box */}
      <div className="p-6 border-t border-slate-800 bg-slate-900/20">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your question about dataset (e.g. 'Plot average score over time')"
            disabled={loading || running}
            className="w-full pl-6 pr-16 py-4 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!question.trim() || loading || running}
            className="absolute right-3 p-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </form>
      </div>
    </main>
  );
};
