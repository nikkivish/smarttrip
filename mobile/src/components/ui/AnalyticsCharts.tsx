export type BarDatum = { label: string; value: number; secondary?: number };
export type LineDatum = { label: string; value: number };
export type PieDatum = { label: string; value: number; color: string };

export function SingleBarChart(_props: { data: BarDatum[]; valueName?: string }) {
  return null;
}
export function BudgetBarChart(_props: { data: BarDatum[] }) { return null; }
export function LineChart(_props: { data: LineDatum[] }) { return null; }
export function DonutChart(_props: { data: PieDatum[] }) { return null; }
