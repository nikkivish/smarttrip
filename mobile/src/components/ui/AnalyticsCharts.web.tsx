import { ReactNode } from 'react';
import {
  Bar,
  BarChart as RechartsBar,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart as RechartsLine,
  Pie,
  PieChart as RechartsPie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type BarDatum = { label: string; value: number; secondary?: number };
export type LineDatum = { label: string; value: number };
export type PieDatum = { label: string; value: number; color: string };

export function ChartFrame({ children, height = 280 }: { children: ReactNode; height?: number }) {
  return <div style={{ width: '100%', height }}>{children}</div>;
}

export function SingleBarChart({ data, valueName = 'Value' }: { data: BarDatum[]; valueName?: string }) {
  return (
    <ChartFrame>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBar data={data.map((item) => ({ name: item.label, [valueName]: item.value }))} margin={{ top: 8, right: 8, left: -12, bottom: 8 }}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#64748B', fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey={valueName} fill="#2E86F0" radius={[6, 6, 0, 0]} />
        </RechartsBar>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function BudgetBarChart({ data }: { data: BarDatum[] }) {
  const chartData = data.map((item) => ({ name: item.label, Budget: item.value, 'Planned cost': item.secondary ?? 0 }));
  return (
    <ChartFrame>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBar data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 8 }}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#64748B', fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="Budget" fill="#92C6FF" radius={[6, 6, 0, 0]} />
          <Bar dataKey="Planned cost" fill="#2E86F0" radius={[6, 6, 0, 0]} />
        </RechartsBar>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function LineChart({ data }: { data: LineDatum[] }) {
  return (
    <ChartFrame>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLine data={data.map((item) => ({ name: item.label, Trips: item.value }))} margin={{ top: 8, right: 12, left: -12, bottom: 8 }}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: '#64748B', fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="Trips" stroke="#2E86F0" strokeWidth={3} dot={{ r: 4, fill: '#FFFFFF', strokeWidth: 2 }} activeDot={{ r: 6 }} />
        </RechartsLine>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function DonutChart({ data }: { data: PieDatum[] }) {
  const chartData = data.map((item) => ({ name: item.label, value: item.value, fill: item.color }));
  return (
    <ChartFrame height={300}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPie>
          <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={2}>
            {chartData.map((item) => <Cell key={item.name} fill={item.fill} />)}
          </Pie>
          <Tooltip />
          <Legend />
        </RechartsPie>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
