'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartDataPoint {
  date: string;
  Inprogress: number;
  Completed: number;
}

interface SubmissionStatusChartProps {
  data: ChartDataPoint[];
}

export const SubmissionStatusChart = ({ data }: SubmissionStatusChartProps) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{
          top: 5,
          right: 0,
          left: -30, // Adjust to show Y-axis labels if needed
          bottom: 0,
        }}
      >
        <defs>
          <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorInprogress" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#facc15" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          fontSize={12}
          stroke="#9ca3af" // text-gray-400
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          fontSize={12}
          stroke="#9ca3af" // text-gray-400
          tickFormatter={(value) => `${value}`}
        />
        {/* <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /> */}
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '0.375rem',
            fontSize: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          }}
          itemStyle={{ color: '#374151' }} // text-gray-700
          labelStyle={{ fontWeight: 'bold', color: '#1f2937' }} // text-gray-800
        />
        <Area
          type="monotone"
          dataKey="Inprogress"
          stroke="#facc15" // yellow-400
          fillOpacity={1}
          fill="url(#colorInprogress)"
          strokeWidth={2}
          dot={{ stroke: '#facc15', strokeWidth: 2, r: 3, fill: 'white' }}
          activeDot={{ r: 5, strokeWidth: 2, fill: '#facc15' }}
        />
        <Area
          type="monotone"
          dataKey="Completed"
          stroke="#3b82f6" // blue-500
          fillOpacity={1}
          fill="url(#colorCompleted)"
          strokeWidth={2}
          dot={{ stroke: '#3b82f6', strokeWidth: 2, r: 3, fill: 'white' }}
          activeDot={{ r: 5, strokeWidth: 2, fill: '#3b82f6' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}; 