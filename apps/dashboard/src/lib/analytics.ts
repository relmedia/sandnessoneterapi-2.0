import {
  type AnalyticsData,
  type AnalyticsRange,
  type CityRow,
  type CountryRow,
  type DailyPoint,
  type KpiDatum,
  RANGE_LABELS,
  type RealtimePoint,
  type SourceRow,
  type TopPageRow,
  formatCount,
} from "@/lib/analytics-shared";
import { createClient } from "@/lib/supabase/server";

type SummaryRow = { pageviews: number; visitors: number; sessions: number; engaged_sessions: number };
type DailyRow = { day: string; pageviews: number; visitors: number };
type TopPageRpcRow = { path: string; views: number; visitors: number };
type ReferrerRow = { referrer: string | null; visitors: number; views: number };
type RealtimeRow = { minute: string; visitors: number };
type CountryRpcRow = { country: string; visitors: number; views: number };
type CityRpcRow = { city: string; country: string | null; visitors: number; views: number };

const countryNames = new Intl.DisplayNames(["nb"], { type: "region" });

function countryDisplayName(code: string): string {
  try {
    return countryNames.of(code) ?? code;
  } catch {
    return code;
  }
}

const EMPTY_SUMMARY: SummaryRow = { pageviews: 0, visitors: 0, sessions: 0, engaged_sessions: 0 };

const SEARCH_PATTERN = /google|bing|duckduckgo|ecosia|yahoo|qwant|startpage/i;
const SOCIAL_PATTERN =
  /facebook|instagram|linkedin|t\.co|twitter|x\.com|pinterest|tiktok|youtube|snapchat|reddit|threads/i;

function formatPercent(value: number): string {
  return `${(value * 100).toLocaleString("nb-NO", { maximumFractionDigits: 1 })} %`;
}

function relativeChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / previous;
}

function resolveRange(range: AnalyticsRange): { from: Date; to: Date; prevFrom: Date; prevTo: Date } {
  const to = new Date();
  let from: Date;

  if (range === "year-to-date") {
    from = new Date(to.getFullYear(), 0, 1);
  } else {
    const days = range === "last-7-days" ? 7 : range === "last-4-weeks" ? 28 : 91;
    from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  }

  const periodMs = to.getTime() - from.getTime();
  const prevTo = from;
  const prevFrom = new Date(from.getTime() - periodMs);

  return { from, to, prevFrom, prevTo };
}

function categorizeSources(referrers: ReferrerRow[]): SourceRow[] {
  const buckets = new Map<string, number>([
    ["Direkte", 0],
    ["Søk", 0],
    ["Sosiale medier", 0],
    ["Henvisning", 0],
  ]);

  for (const row of referrers) {
    let bucket = "Henvisning";
    if (row.referrer === null) bucket = "Direkte";
    else if (SEARCH_PATTERN.test(row.referrer)) bucket = "Søk";
    else if (SOCIAL_PATTERN.test(row.referrer)) bucket = "Sosiale medier";
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + row.visitors);
  }

  return [...buckets.entries()]
    .map(([source, visitors]) => ({ source, visitors }))
    .filter((row) => row.visitors > 0)
    .sort((a, b) => b.visitors - a.visitors);
}

function fillDailySeries(rows: DailyRow[], from: Date, to: Date): DailyPoint[] {
  const byDay = new Map(rows.map((row) => [row.day, row]));
  const points: DailyPoint[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());

  while (cursor <= to) {
    const iso = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    const row = byDay.get(iso);
    points.push({ date: iso, pageviews: row?.pageviews ?? 0, visitors: row?.visitors ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  return points;
}

function fillRealtimeSeries(rows: RealtimeRow[], windowMinutes: number): RealtimePoint[] {
  const byMinute = new Map(rows.map((row) => [new Date(row.minute).getTime(), row.visitors]));
  const points: RealtimePoint[] = [];
  const now = Date.now();

  for (let i = windowMinutes - 1; i >= 0; i--) {
    const stamp = new Date(now - i * 60_000);
    stamp.setSeconds(0, 0);
    const label = stamp.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
    points.push({ minute: label, visitors: byMinute.get(stamp.getTime()) ?? 0 });
  }

  return points;
}

export async function getAnalytics(range: AnalyticsRange): Promise<AnalyticsData> {
  const supabase = await createClient();
  const { from, to, prevFrom, prevTo } = resolveRange(range);
  const periodLabel = RANGE_LABELS[range];

  const REALTIME_WINDOW = 30;
  const realtimeFrom = new Date(Date.now() - REALTIME_WINDOW * 60_000);

  const [
    summaryRes,
    prevSummaryRes,
    dailyRes,
    topPagesRes,
    referrersRes,
    realtimeRes,
    realtimeSummaryRes,
    countriesRes,
    citiesRes,
    bookingsRes,
    prevBookingsRes,
  ] = await Promise.all([
    supabase.rpc("analytics_summary", { from_ts: from.toISOString(), to_ts: to.toISOString() }),
    supabase.rpc("analytics_summary", { from_ts: prevFrom.toISOString(), to_ts: prevTo.toISOString() }),
    supabase.rpc("analytics_daily", { from_ts: from.toISOString(), to_ts: to.toISOString() }),
    supabase.rpc("analytics_top_pages", { from_ts: from.toISOString(), to_ts: to.toISOString(), max_rows: 6 }),
    supabase.rpc("analytics_referrers", { from_ts: from.toISOString(), to_ts: to.toISOString() }),
    supabase.rpc("analytics_realtime", { window_minutes: REALTIME_WINDOW }),
    supabase.rpc("analytics_summary", { from_ts: realtimeFrom.toISOString(), to_ts: to.toISOString() }),
    supabase.rpc("analytics_countries", { from_ts: from.toISOString(), to_ts: to.toISOString(), max_rows: 6 }),
    supabase.rpc("analytics_cities", { from_ts: from.toISOString(), to_ts: to.toISOString(), max_rows: 6 }),
    supabase
      .from("booking_requests")
      .select("*", { count: "exact", head: true })
      .gte("created_at", from.toISOString())
      .lt("created_at", to.toISOString()),
    supabase
      .from("booking_requests")
      .select("*", { count: "exact", head: true })
      .gte("created_at", prevFrom.toISOString())
      .lt("created_at", prevTo.toISOString()),
  ]);

  const summary = ((summaryRes.data as SummaryRow[] | null)?.[0] ?? EMPTY_SUMMARY) as SummaryRow;
  const prevSummary = ((prevSummaryRes.data as SummaryRow[] | null)?.[0] ?? EMPTY_SUMMARY) as SummaryRow;
  const dailyRows = (dailyRes.data ?? []) as DailyRow[];
  const topPageRows = (topPagesRes.data ?? []) as TopPageRpcRow[];
  const referrerRows = (referrersRes.data ?? []) as ReferrerRow[];
  const realtimeRows = (realtimeRes.data ?? []) as RealtimeRow[];
  const realtimeSummary = ((realtimeSummaryRes.data as SummaryRow[] | null)?.[0] ?? EMPTY_SUMMARY) as SummaryRow;
  const countryRows = (countriesRes.data ?? []) as CountryRpcRow[];
  const cityRows = (citiesRes.data ?? []) as CityRpcRow[];

  const bookings = bookingsRes.count ?? 0;
  const prevBookings = prevBookingsRes.count ?? 0;

  const engagementRate = summary.sessions > 0 ? summary.engaged_sessions / summary.sessions : 0;
  const prevEngagementRate = prevSummary.sessions > 0 ? prevSummary.engaged_sessions / prevSummary.sessions : 0;
  const conversionRate = summary.sessions > 0 ? bookings / summary.sessions : 0;
  const prevConversionRate = prevSummary.sessions > 0 ? prevBookings / prevSummary.sessions : 0;

  const kpis: KpiDatum[] = [
    {
      title: "Unike besøkende",
      value: formatCount(summary.visitors),
      change: relativeChange(summary.visitors, prevSummary.visitors),
      previous: prevSummary.visitors > 0 ? formatCount(prevSummary.visitors) : null,
      periodLabel,
    },
    {
      title: "Økter",
      value: formatCount(summary.sessions),
      change: relativeChange(summary.sessions, prevSummary.sessions),
      previous: prevSummary.sessions > 0 ? formatCount(prevSummary.sessions) : null,
      periodLabel,
    },
    {
      title: "Sidevisninger",
      value: formatCount(summary.pageviews),
      change: relativeChange(summary.pageviews, prevSummary.pageviews),
      previous: prevSummary.pageviews > 0 ? formatCount(prevSummary.pageviews) : null,
      periodLabel,
    },
    {
      title: "Engasjement",
      value: formatPercent(engagementRate),
      change: relativeChange(engagementRate, prevEngagementRate),
      previous: prevEngagementRate > 0 ? formatPercent(prevEngagementRate) : null,
      periodLabel,
    },
    {
      title: "Bestillinger",
      value: String(bookings),
      change: relativeChange(bookings, prevBookings),
      previous: prevBookings > 0 ? `${prevBookings} (${formatPercent(prevConversionRate)})` : null,
      periodLabel: `${formatPercent(conversionRate)} av økter · ${periodLabel}`,
    },
  ];

  const topPages: TopPageRow[] = topPageRows.map((row) => ({
    path: row.path,
    views: row.views,
    visitors: row.visitors,
    share: summary.pageviews > 0 ? row.views / summary.pageviews : 0,
  }));

  const referrers: SourceRow[] = referrerRows
    .filter((row) => row.referrer !== null)
    .slice(0, 5)
    .map((row) => ({ source: row.referrer as string, visitors: row.visitors }));

  const countryVisitorsTotal = countryRows.reduce((sum, row) => sum + row.visitors, 0);
  const countries: CountryRow[] = countryRows.map((row) => ({
    code: row.country,
    name: countryDisplayName(row.country),
    visitors: row.visitors,
    share: countryVisitorsTotal > 0 ? row.visitors / countryVisitorsTotal : 0,
  }));

  const cities: CityRow[] = cityRows.map((row) => ({
    city: row.city,
    countryCode: row.country,
    visitors: row.visitors,
  }));

  return {
    kpis,
    daily: fillDailySeries(dailyRows, from, to),
    topPages,
    sources: categorizeSources(referrerRows),
    referrers,
    countries,
    cities,
    realtime: {
      points: fillRealtimeSeries(realtimeRows, REALTIME_WINDOW),
      visitors: realtimeSummary.visitors,
    },
    periodLabel,
  };
}
