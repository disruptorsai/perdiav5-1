import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Clock, Users, DollarSign, Info } from 'lucide-react';

const data = [
  {
    name: 'SegPro',
    costLow: 160000,
    costHigh: 320000,
    costActual: 4000,
    timeLow: 13,
    timeHigh: 26,
    timeActual: 2,
    fteLow: 3,
    fteHigh: 5,
    fteActual: 1,
  },
  {
    name: 'Disruptors Hub',
    costLow: 325000,
    costHigh: 590000,
    costActual: 24000,
    timeLow: 17,
    timeHigh: 26,
    timeActual: 12,
    fteLow: 6,
    fteHigh: 10,
    fteActual: 1,
  },
  {
    name: 'Perdia AI',
    costLow: 500000,
    costHigh: 1000000,
    costActual: 4000,
    timeLow: 26,
    timeHigh: 39,
    timeActual: 3,
    fteLow: 5,
    fteHigh: 9,
    fteActual: 1,
  },
];

const CustomTooltip = ({ active, payload, label, mode }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-slate-200 shadow-xl rounded-lg text-sm z-50">
        <p className="font-bold text-slate-800 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="font-medium">
            {entry.name}: {
              mode === 'cost' ? `$${entry.value.toLocaleString()}` :
              mode === 'time' ? `${entry.value} Weeks` :
              mode === 'fte' ? `${entry.value} People` : entry.value
            }
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function CostChart() {
  const [mode, setMode] = useState('cost');

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 mt-6">

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setMode('cost')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            mode === 'cost' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <DollarSign size={16} /> Cost Analysis
        </button>
        <button
          onClick={() => setMode('time')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            mode === 'time' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Clock size={16} /> Time to Build
        </button>
        <button
          onClick={() => setMode('fte')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            mode === 'fte' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Users size={16} /> Team Size (FTE)
        </button>
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            barGap={2}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{fill: '#475569', fontSize: 12}} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(value) => {
                if (mode === 'cost') return `$${value/1000}k`;
                if (mode === 'time') return `${value}w`;
                return value;
              }}
              tick={{fill: '#475569', fontSize: 12}}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip mode={mode} />} cursor={{fill: '#f8fafc'}} />
            <Legend />

            {mode === 'cost' && (
              <>
                <Bar dataKey="costLow" name="Agency Low Est." fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="costHigh" name="Agency High Est." fill="#475569" radius={[4, 4, 0, 0]} />
                <Bar dataKey="costActual" name="My Cost" fill="#10b981" radius={[4, 4, 0, 0]} />
              </>
            )}

            {mode === 'time' && (
              <>
                <Bar dataKey="timeLow" name="Agency Low Est. (Weeks)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="timeHigh" name="Agency High Est. (Weeks)" fill="#475569" radius={[4, 4, 0, 0]} />
                <Bar dataKey="timeActual" name="My Time (Weeks)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </>
            )}

            {mode === 'fte' && (
              <>
                <Bar dataKey="fteLow" name="Agency Min Team" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="fteHigh" name="Agency Max Team" fill="#475569" radius={[4, 4, 0, 0]} />
                <Bar dataKey="fteActual" name="My Team Size" fill="#10b981" radius={[4, 4, 0, 0]} />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-100 text-sm text-amber-900 flex items-start gap-3">
        <Info className="shrink-0 mt-0.5" size={18} />
        <div>
          <p className="font-bold mb-1">Context on Workload:</p>
          <p className="leading-relaxed">
            During the development of these projects (SegPro, Disruptors Hub, Perdia), I was simultaneously managing 3-5 other active tasks/projects at any given time. The "My Time" metrics represent delivery speed despite this divided focus.
          </p>
          {mode === 'fte' && (
             <p className="mt-2 text-xs text-amber-800 pt-2 border-t border-amber-200">
               * <strong>FTE (Full-Time Equivalent):</strong> A unit that indicates the workload of an employed person. An FTE of 1.0 is equivalent to a full-time worker. Agencies require 5-10 FTEs (full-time specialists) to deliver what I delivered as 1 FTE.
             </p>
          )}
        </div>
      </div>
    </div>
  );
}
