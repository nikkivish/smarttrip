import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ScreenHeader } from '@/components/ScreenHeader';
import { BarRow } from '@/components/ui/BarRow';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
// The platform-specific .web/.native chart implementations are resolved by Expo at runtime.
import { BudgetBarChart, DonutChart, LineChart, SingleBarChart } from '@/components/ui/AnalyticsCharts';
import { useAnalytics } from '@/hooks/useAnalytics';
import {
  contentColumn,
  useGridCellWidth,
  useGridColumns,
  useHorizontalGutter,
} from '@/hooks/useResponsive';
import { colors, fontSize, fontWeight, spacing } from '@/theme';

const formatNumber = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString() : '—';

const formatDays = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value) ? `${formatNumber(value)} days` : '—';

const formatPercent = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value) ? `${formatNumber(value)}%` : '—';

export default function AnalyticsScreen() {
  const { data, isLoading, error, source, refresh } = useAnalytics();
  const [refreshing, setRefreshing] = useState(false);
  const gutter = useHorizontalGutter();
  const columns = useGridColumns(4);
  const cellWidth = useGridCellWidth(columns);

  const tripsOverview = data ? [
    { label: 'Trips', value: data.kpis.totalTrips },
    { label: 'Travellers', value: data.kpis.totalTravellers },
    { label: 'Itinerary days', value: data.kpis.itineraryDays },
    { label: 'Itinerary items', value: data.kpis.itineraryItems },
  ] : [];
  const destinationTrips = data?.destinations.map((item) => ({ label: item.destination, value: item.tripCount })) ?? [];
  const destinationDurations = data?.destinations.map((item) => ({ label: item.destination, value: item.averageTripDuration })) ?? [];
  const destinationSafety = data?.destinations.map((item) => ({ label: item.destination, value: item.averageSafetyScore ?? 0 })) ?? [];
  const travellerDistribution = data?.destinations.map((item, index) => ({
    label: item.destination,
    value: item.totalTravellers,
    color: ['#2E86F0', '#92C6FF', '#16A34A', '#FF9A3C', '#D97706'][index % 5],
  })) ?? [];
  const budgetComparison = data?.budgetAnalysis.map((item) => ({ label: item.title || item.destination, value: item.budget, secondary: item.plannedCost })) ?? [];
  const monthlyActivity = source === 'demo'
    ? [
        { label: 'May', value: 2 }, { label: 'Jun', value: 3 }, { label: 'Jul', value: 2 },
        { label: 'Aug', value: 4 }, { label: 'Sep', value: 3 }, { label: 'Oct', value: 5 },
      ]
    : data?.budgetAnalysis.slice(0, 6).map((item, index) => ({ label: `Trip ${index + 1}`, value: item.isOverBudget ? 1 : 0 })) ?? [];
  const totalBudget = data?.budgetAnalysis.reduce((sum, trip) => sum + trip.budget, 0) ?? 0;
  const totalPlanned = data?.kpis.totalPlannedCost ?? 0;
  const utilization = totalBudget > 0 ? Math.round(totalPlanned / totalBudget * 100) : 0;
  const riskDistribution = data?.destinations.reduce((acc, item) => {
    const score = item.averageSafetyScore ?? 0;
    if (score >= 80) acc.safe += 1;
    else if (score >= 65) acc.moderate += 1;
    else acc.risky += 1;
    return acc;
  }, { safe: 0, moderate: 0, risky: 0 }) ?? { safe: 0, moderate: 0, risky: 0 };

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Analytics" subtitle="A personal view of trips, spending and safety" />
      {isLoading && !data ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateText}>Loading analytics…</Text>
        </View>
      ) : data ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={contentColumn}
          contentContainerStyle={[styles.content, { paddingHorizontal: gutter }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {source === 'demo' ? (
            <View style={styles.demoBanner}>
              <Ionicons name="eye-outline" size={18} color={colors.primaryDark} />
              <Text style={styles.demoText}>Demo presentation data</Text>
              <Button label="Retry live data" size="sm" variant="outline" onPress={() => void refresh()} />
            </View>
          ) : null}

          {error && source === 'demo' ? (
            <Text style={styles.connectionNote}>Live API unavailable. Showing demo analytics for this presentation.</Text>
          ) : null}

          {data.kpis.totalTrips === 0 && data.safety.totalAlerts === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="analytics-outline" size={40} color={colors.primary} />
              <Text style={styles.sectionTitle}>No analytics yet</Text>
              <Text style={styles.bodyText}>Plan a trip or add safety activity to start seeing your insights.</Text>
            </Card>
          ) : null}

          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.kpiGrid}>
            {[
              ['Total Trips', formatNumber(data.kpis.totalTrips)],
              ['Total Users', formatNumber(data.kpis.totalUsers)],
              ['Total Travellers', formatNumber(data.kpis.totalTravellers)],
              ['Total Budget', formatNumber(data.budgetAnalysis.reduce((sum, trip) => sum + (trip.budget ?? 0), 0) || data.kpis.totalPlannedCost)],
              ['Total Planned Cost', formatNumber(data.kpis.totalPlannedCost)],
              ['Average Budget', formatNumber(data.kpis.averageTripBudget)],
              ['Average Trip Duration', formatDays(data.kpis.averageTripDuration)],
              ['Average Safety Score', formatNumber(data.kpis.averageSafetyScore)],
              ['Itinerary Items', formatNumber(data.kpis.itineraryItems)],
              ['Acknowledgement Rate', formatPercent(data.kpis.alertAcknowledgementRate)],
            ].map(([label, value]) => (
              <View key={label} style={[styles.kpiCell, { width: cellWidth }]}>
                <StatCard label={label} value={value} />
              </View>
            ))}
          </View>

          <View style={styles.chartGrid}>
            <Card style={styles.chartCard}><Text style={styles.cardTitle}>Trips Overview</Text><SingleBarChart data={tripsOverview} valueName="Count" /></Card>
            <Card style={styles.chartCard}><Text style={styles.cardTitle}>Trips by Destination</Text><SingleBarChart data={destinationTrips} valueName="Trips" /></Card>
            <Card style={styles.chartCard}><Text style={styles.cardTitle}>Budget vs Planned Cost</Text><BudgetBarChart data={budgetComparison} /></Card>
            <Card style={styles.chartCard}><Text style={styles.cardTitle}>Trip Duration</Text><SingleBarChart data={destinationDurations} valueName="Days" /></Card>
            <Card style={styles.chartCard}><Text style={styles.cardTitle}>Safety Score by Destination</Text><SingleBarChart data={destinationSafety} valueName="Safety score" /></Card>
            <Card style={styles.chartCard}><Text style={styles.cardTitle}>Traveller Distribution</Text><DonutChart data={travellerDistribution} /></Card>
            <Card style={styles.chartCard}><Text style={styles.cardTitle}>{source === 'demo' ? 'Monthly Trip Activity' : 'Recent Trip Activity'}</Text><LineChart data={monthlyActivity} /></Card>
          </View>

          {data.destinations.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Destinations</Text>
              <View style={styles.grid}>
                {data.destinations.map((destination) => (
                  <Card key={destination.destination} style={[styles.destinationCard, { width: cellWidth }]}>
                    <Text style={styles.cardTitle}>{destination.destination}</Text>
                    <Text style={styles.metric}>Trips: {formatNumber(destination.tripCount)}</Text>
                    <Text style={styles.metric}>Travellers: {formatNumber(destination.totalTravellers)}</Text>
                    <Text style={styles.metric}>Total budget: {formatNumber(destination.totalBudget)}</Text>
                    <Text style={styles.metric}>Average budget: {formatNumber(destination.averageBudget)}</Text>
                    <Text style={styles.metric}>Average duration: {formatDays(destination.averageTripDuration)}</Text>
                    <Text style={styles.metric}>Safety score: {formatNumber(destination.averageSafetyScore)}</Text>
                  </Card>
                ))}
              </View>
            </View>
          ) : null}

          {data.costByCategory.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cost by category</Text>
              <Card style={styles.chartCard}><Text style={styles.cardTitle}>Spending by Category</Text><SingleBarChart data={data.costByCategory.map((item) => ({ label: item.category, value: item.totalCost }))} valueName="Cost" /></Card>
              <Card style={styles.listCard}>
                {data.costByCategory.map((category) => (
                  <BarRow
                    key={category.category}
                    label={category.category}
                    valueLabel={`${formatNumber(category.itemCount)} items · ${formatNumber(category.totalCost)} · ${formatPercent(category.costSharePercentage)}`}
                    percentage={category.costSharePercentage}
                  />
                ))}
              </Card>
            </View>
          ) : null}

          {data.budgetAnalysis.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Budget analysis</Text>
              <View style={styles.grid}>
                {data.budgetAnalysis.map((trip) => (
                  <Card key={trip.tripId} style={[styles.budgetCard, trip.isOverBudget && styles.overBudget, { width: cellWidth }]}>
                    <Text style={styles.cardTitle}>{trip.title || trip.destination}</Text>
                    <Text style={styles.metric}>Budget: {trip.currency} {formatNumber(trip.budget)}</Text>
                    <Text style={styles.metric}>Planned: {trip.currency} {formatNumber(trip.plannedCost)}</Text>
                    <Text style={styles.metric}>Remaining: {trip.currency} {formatNumber(trip.remainingBudget)}</Text>
                    <Text style={styles.metric}>Utilization: {formatPercent(trip.utilizationPercentage)}</Text>
                    <Text style={[styles.status, trip.isOverBudget ? styles.statusDanger : styles.statusSuccess]}>
                      {trip.isOverBudget ? 'Over budget' : 'Within budget'}
                    </Text>
                  </Card>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Safety</Text>
            <View style={styles.chartGrid}>
              <Card style={styles.chartCard}><Text style={styles.cardTitle}>Safe / Moderate / Risky Destinations</Text><DonutChart data={[{ label: 'Safe', value: riskDistribution.safe, color: colors.success }, { label: 'Moderate', value: riskDistribution.moderate, color: colors.warning }, { label: 'Risky', value: riskDistribution.risky, color: colors.danger }]} /></Card>
              <Card style={styles.chartCard}><Text style={styles.cardTitle}>Safety Score Comparison</Text><SingleBarChart data={destinationSafety} valueName="Safety score" /></Card>
            </View>
            <View style={styles.safetyGrid}>
              <StatCard label="Total alerts" value={formatNumber(data.safety.totalAlerts)} />
              <StatCard label="SOS alerts" value={formatNumber(data.safety.sosAlerts)} />
              <StatCard label="Check-ins" value={formatNumber(data.safety.totalCheckIns)} />
              <StatCard label="Acknowledged" value={formatNumber(data.safety.acknowledged)} />
              <StatCard label="Unacknowledged" value={formatNumber(data.safety.unacknowledged)} />
              <StatCard label="Acknowledgement Rate" value={formatPercent(data.safety.acknowledgementRate)} />
            </View>
            {(data.safety.bySeverity.length > 0 || data.safety.byType.length > 0) ? (
              <View style={styles.distributionRow}>
                <Card style={styles.distributionCard}>
                  <Text style={styles.cardTitle}>Alert severity</Text>
                  {data.safety.bySeverity.map((item) => (
                    <Text key={item.severity} style={styles.metric}>{item.severity}: {formatNumber(item.count)}</Text>
                  ))}
                </Card>
                <Card style={styles.distributionCard}>
                  <Text style={styles.cardTitle}>Alert type</Text>
                  {data.safety.byType.map((item) => (
                    <Text key={item.type} style={styles.metric}>{item.type}: {formatNumber(item.count)}</Text>
                  ))}
                </Card>
              </View>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Spending</Text>
            <View style={styles.kpiGrid}>
              <View style={[styles.kpiCell, { width: cellWidth }]}><StatCard label="Total Budget" value={`INR ${formatNumber(totalBudget)}`} /></View>
              <View style={[styles.kpiCell, { width: cellWidth }]}><StatCard label="Total Planned Cost" value={`INR ${formatNumber(totalPlanned)}`} /></View>
              <View style={[styles.kpiCell, { width: cellWidth }]}><StatCard label="Average Trip Budget" value={`INR ${formatNumber(data.kpis.averageTripBudget)}`} /></View>
              <View style={[styles.kpiCell, { width: cellWidth }]}><StatCard label="Budget Utilization" value={formatPercent(utilization)} /></View>
            </View>
            <Card style={styles.chartCard}><Text style={styles.cardTitle}>Budget vs Actual / Planned Spending</Text><BudgetBarChart data={budgetComparison} /></Card>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Travel Insights</Text>
            <View style={styles.grid}>
              {data.destinations.length > 0 ? (() => {
                const mostVisited = [...data.destinations].sort((a, b) => b.tripCount - a.tripCount)[0];
                const highestBudget = [...data.destinations].sort((a, b) => (b.averageBudget ?? 0) - (a.averageBudget ?? 0))[0];
                const safest = [...data.destinations].sort((a, b) => (b.averageSafetyScore ?? 0) - (a.averageSafetyScore ?? 0))[0];
                return [
                  { title: 'Most visited', value: mostVisited?.destination ?? '—' },
                  { title: 'Highest average budget', value: highestBudget?.destination ?? '—' },
                  { title: 'Safest destination', value: safest?.destination ?? '—' },
                  { title: 'Average trip duration', value: formatDays(data.kpis.averageTripDuration) },
                  { title: 'Travellers', value: formatNumber(data.kpis.totalTravellers) },
                ].map((insight) => (
                  <Card key={insight.title} style={[styles.insightCard, { width: cellWidth }]}>
                    <Text style={styles.metric}>{insight.title}</Text>
                    <Text style={styles.cardTitle}>{insight.value}</Text>
                  </Card>
                ));
              })() : null}
            </View>
          </View>

          {data.insights.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Insights</Text>
              {data.insights.map((insight) => (
                <Card key={insight.id} style={[styles.insight, insight.level === 'warning' && styles.warningInsight]}>
                  <Ionicons
                    name={insight.level === 'warning' ? 'warning-outline' : insight.level === 'success' ? 'checkmark-circle-outline' : 'information-circle-outline'}
                    size={20}
                    color={insight.level === 'warning' ? colors.warning : insight.level === 'success' ? colors.success : colors.info}
                  />
                  <Text style={styles.bodyText}>{insight.message}</Text>
                </Card>
              ))}
            </View>
          ) : null}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { gap: spacing.lg, paddingBottom: spacing.xxl },
  centered: { alignItems: 'center', alignSelf: 'center', flex: 1, gap: spacing.md, justifyContent: 'center', maxWidth: 680, width: '100%' },
  stateTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  stateText: { color: colors.textSecondary, fontSize: fontSize.base, textAlign: 'center' },
  section: { gap: spacing.md },
  sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  kpiCell: {},
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  destinationCard: { gap: spacing.xs, minHeight: 168 },
  budgetCard: { gap: spacing.xs, minHeight: 158 },
  overBudget: { borderColor: colors.danger, borderWidth: 2 },
  cardTitle: { color: colors.text, fontSize: fontSize.base, fontWeight: fontWeight.bold },
  metric: { color: colors.textSecondary, fontSize: 13 },
  status: { fontSize: 13, fontWeight: fontWeight.bold, marginTop: spacing.xs },
  statusDanger: { color: colors.danger },
  statusSuccess: { color: colors.success },
  listCard: { gap: spacing.base },
  safetyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  distributionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  distributionCard: { flexBasis: 220, flexGrow: 1, gap: spacing.sm },
  insight: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm },
  warningInsight: { borderColor: colors.warning, borderWidth: 1 },
  bodyText: { color: colors.textSecondary, flex: 1, fontSize: fontSize.base, lineHeight: 22 },
  emptyCard: { alignItems: 'center', gap: spacing.sm, minHeight: 180, justifyContent: 'center' },
  chartGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  chartCard: { flexBasis: 320, flexGrow: 1, gap: spacing.sm, minHeight: 340 },
  demoBanner: { alignItems: 'center', backgroundColor: colors.primaryLight, borderColor: colors.primaryBorder, borderRadius: 8, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, padding: spacing.sm },
  demoText: { color: colors.primaryDark, flex: 1, fontSize: 13, fontWeight: fontWeight.semibold },
  connectionNote: { color: colors.textMuted, fontSize: 12 },
  insightCard: { gap: spacing.sm, minHeight: 112 },
});
