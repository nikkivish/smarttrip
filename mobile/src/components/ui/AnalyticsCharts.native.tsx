import { Text, View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { colors, spacing } from '@/theme';

export type BarDatum = { label: string; value: number; secondary?: number };
export type LineDatum = { label: string; value: number };
export type PieDatum = { label: string; value: number; color: string };

export function SingleBarChart({ data }: { data: BarDatum[]; valueName?: string }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  return <View style={styles.barChart}>{data.map((item) => (
    <View key={item.label} style={styles.barRow}>
      <Text style={styles.barLabel} numberOfLines={1}>{item.label}</Text>
      <View style={styles.track}><View style={[styles.barFill, { width: `${Math.max(4, item.value / max * 100)}%` }]} /></View>
      <Text style={styles.barValue}>{item.value}</Text>
    </View>
  ))}</View>;
}

export function BudgetBarChart({ data }: { data: BarDatum[] }) {
  const max = Math.max(...data.flatMap((item) => [item.value, item.secondary ?? 0]), 1);
  return <View style={styles.budgetChart}>{data.map((item) => (
    <View key={item.label} style={styles.budgetRow}>
      <Text style={styles.barLabel} numberOfLines={1}>{item.label}</Text>
      <View style={styles.legend}><View style={styles.budgetSwatch} /><Text style={styles.legendText}>Budget</Text></View>
      <View style={styles.track}><View style={[styles.budgetFill, { width: `${item.value / max * 100}%` }]} /></View>
      <View style={styles.legend}><View style={styles.plannedSwatch} /><Text style={styles.legendText}>Planned</Text></View>
      <View style={styles.track}><View style={[styles.barFill, { width: `${(item.secondary ?? 0) / max * 100}%` }]} /></View>
    </View>
  ))}</View>;
}

export function LineChart({ data }: { data: LineDatum[] }) {
  const width = 320;
  const height = 220;
  const max = Math.max(...data.map((item) => item.value), 1);
  const points = data.map((item, index) => {
    const x = data.length === 1 ? width / 2 : 20 + index * ((width - 40) / (data.length - 1));
    const y = height - 25 - item.value / max * (height - 55);
    return `${x},${y}`;
  }).join(' ');
  return <View style={styles.svgFrame}><Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
    {[0, 1, 2, 3].map((line) => <Line key={line} x1="20" x2={width - 20} y1={25 + line * 42} y2={25 + line * 42} stroke={colors.border} strokeWidth="1" />)}
    <Polyline points={points} fill="none" stroke={colors.primary} strokeWidth="3" />
    {data.map((item, index) => {
      const x = data.length === 1 ? width / 2 : 20 + index * ((width - 40) / (data.length - 1));
      const y = height - 25 - item.value / max * (height - 55);
      return <Circle key={item.label} cx={x} cy={y} r="5" fill={colors.surface} stroke={colors.primary} strokeWidth="2" />;
    })}
  </Svg></View>;
}

export function DonutChart({ data }: { data: PieDatum[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  return <View style={styles.donutWrap}>
    <Svg width="220" height="220" viewBox="0 0 220 220">
      {data.map((item, index) => {
        const share = item.value / total;
        const dash = share * 502.4;
        const previous = data.slice(0, index).reduce((sum, entry) => sum + entry.value / total * 502.4, 25);
        return <Circle key={item.label} cx="110" cy="110" r="80" fill="none" stroke={item.color} strokeWidth="28" strokeDasharray={`${dash} ${502.4 - dash}`} strokeDashoffset={-previous} />;
      })}
      <Circle cx="110" cy="110" r="58" fill={colors.surface} />
    </Svg>
    <View style={styles.legendList}>{data.map((item) => <View key={item.label} style={styles.legend}><View style={[styles.pieSwatch, { backgroundColor: item.color }]} /><Text style={styles.legendText}>{item.label}: {item.value}</Text></View>)}</View>
  </View>;
}

export function ChartFrame({ children }: { children: React.ReactNode; height?: number }) { return <View>{children}</View>; }

const styles = StyleSheet.create({
  barChart: { gap: spacing.sm }, barRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm }, barLabel: { color: colors.textSecondary, fontSize: 12, width: 88 }, barValue: { color: colors.text, fontSize: 12, width: 46, textAlign: 'right' }, track: { backgroundColor: colors.surfaceAlt, borderRadius: 999, flex: 1, height: 12, overflow: 'hidden' }, barFill: { backgroundColor: colors.primary, borderRadius: 999, height: '100%' },
  budgetChart: { gap: spacing.sm }, budgetRow: { gap: 4 }, budgetFill: { backgroundColor: '#92C6FF', borderRadius: 999, height: '100%' }, plannedSwatch: { backgroundColor: colors.primary, borderRadius: 999, height: 8, width: 8 }, budgetSwatch: { backgroundColor: '#92C6FF', borderRadius: 999, height: 8, width: 8 }, legend: { alignItems: 'center', flexDirection: 'row', gap: 6 }, legendText: { color: colors.textSecondary, fontSize: 12 },
  svgFrame: { width: '100%' }, donutWrap: { alignItems: 'center' }, legendList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' }, pieSwatch: { borderRadius: 999, height: 10, width: 10 },
});
