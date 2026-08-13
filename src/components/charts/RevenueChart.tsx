import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { formatRupiah } from '../../lib/utils/formatCurrency';

interface RevenueChartProps {
  data: {
    period: string;
    pemasukan: number;
    pengeluaran: number;
  }[];
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPemasukan" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorPengeluaran" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
          <XAxis dataKey="period" stroke="#94A3B8" fontSize={11} tickLine={false} />
          <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0F172A',
              borderColor: '#334155',
              borderRadius: '12px',
              color: '#F8FAFC',
              fontSize: '12px',
            }}
            formatter={(value: any) => [formatRupiah(Number(value) || 0), '']}
          />
          <Area
            type="monotone"
            dataKey="pemasukan"
            name="Pemasukan Kas"
            stroke="#10B981"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorPemasukan)"
          />
          <Area
            type="monotone"
            dataKey="pengeluaran"
            name="Pengeluaran Kas"
            stroke="#EF4444"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorPengeluaran)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
