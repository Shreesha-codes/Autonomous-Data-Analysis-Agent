import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export interface IChartData {
  chartType: 'bar' | 'line' | 'scatter' | 'heatmap' | 'distribution';
  chartTitle: string;
  xAxisLabel: string;
  yAxisLabel: string;
  data?: any[];
}

interface VisualizerProps {
  config: IChartData;
}

export const Visualizer: React.FC<VisualizerProps> = ({ config }) => {
  const { chartType, chartTitle, xAxisLabel, yAxisLabel, data = [] } = config;

  if (data.length === 0) {
    return (
      <div className="h-64 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 text-xs">
        <svg className="w-8 h-8 mb-2 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span>No raw data available for visualization</span>
      </div>
    );
  }

  // Pre-process data for scatter charts (ensure coordinates are numeric)
  const chartData = chartType === 'scatter'
    ? data.map((item: any) => ({
        ...item,
        [xAxisLabel]: parseFloat(item[xAxisLabel]) || item[xAxisLabel],
        [yAxisLabel]: parseFloat(item[yAxisLabel]) || item[yAxisLabel]
      }))
    : data;

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey={xAxisLabel} stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} labelStyle={{ color: '#fff' }} />
            <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
            <Line type="monotone" dataKey={yAxisLabel} stroke="#6366f1" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ strokeWidth: 1.5, r: 3 }} />
          </LineChart>
        );
      case 'scatter':
        return (
          <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis type="number" dataKey={xAxisLabel} name={xAxisLabel} stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis type="number" dataKey={yAxisLabel} name={yAxisLabel} stroke="#64748b" fontSize={11} tickLine={false} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} />
            <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
            <Scatter name={`${yAxisLabel} vs ${xAxisLabel}`} data={chartData} fill="#f43f5e" />
          </ScatterChart>
        );
      case 'bar':
      case 'heatmap': // Fallback to Bar for presentation
      case 'distribution':
      default:
        return (
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey={xAxisLabel} stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} labelStyle={{ color: '#fff' }} />
            <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
            <Bar dataKey={yAxisLabel} fill="url(#colorUv)" radius={[4, 4, 0, 0]} maxBarSize={45} />
            <defs>
              <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.85}/>
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.25}/>
              </linearGradient>
            </defs>
          </BarChart>
        );
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white tracking-tight">{chartTitle}</h4>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700 uppercase tracking-wider">
          {chartType} chart
        </span>
      </div>
      
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      <div className="text-[10px] text-slate-500 flex justify-between border-t border-slate-800/60 pt-3 px-1">
        <span>X: {xAxisLabel}</span>
        <span>Y: {yAxisLabel}</span>
      </div>
    </div>
  );
};
