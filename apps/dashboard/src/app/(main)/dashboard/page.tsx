import { getAnalytics } from "@/lib/analytics";
import { formatCount, parseAnalyticsRange } from "@/lib/analytics-shared";
import { createClient } from "@/lib/supabase/server";

import { AnalyticsKpiStrip } from "./_components/analytics-kpi-strip";
import { AnalyticsToolbar } from "./_components/analytics-toolbar";
import { RealtimeVisitors } from "./_components/realtime-visitors";
import { TopLocations } from "./_components/top-locations";
import { TopPages } from "./_components/top-pages";
import { TopTrafficSources } from "./_components/top-traffic-sources";
import { TrafficChart } from "./_components/traffic-chart";

// Country flag classes (flag:XX) used by the geography card.
import "@/styles/flag-icons/flags.css";

export default async function Page({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range: rangeParam } = await searchParams;
  const range = parseAnalyticsRange(rangeParam);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName =
    (user?.user_metadata?.name as string | undefined) ?? user?.email?.split("@")[0] ?? "Bruker";

  const analytics = await getAnalytics(range);

  const sourcesChartData = analytics.sources.map((row) => ({
    source: row.source,
    visitors: row.visitors,
    label: formatCount(row.visitors),
  }));
  const referrersChartData = analytics.referrers.map((row) => ({
    source: row.source,
    visitors: row.visitors,
    label: formatCount(row.visitors),
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl tracking-tight">Hei, {displayName}</h1>
          <p className="text-muted-foreground text-sm">
            Følg trafikk, engasjement og bestillinger samlet på ett sted.
          </p>
        </div>

        <AnalyticsToolbar />
      </div>

      <AnalyticsKpiStrip kpis={analytics.kpis} />

      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <TrafficChart data={analytics.daily} />
        </div>
        <div className="xl:col-span-5">
          <RealtimeVisitors points={analytics.realtime.points} visitors={analytics.realtime.visitors} />
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <TopPages pages={analytics.topPages} />
        </div>
        <div className="xl:col-span-5 xl:col-start-8">
          <TopTrafficSources sources={sourcesChartData} referrers={referrersChartData} />
        </div>
      </div>

      <TopLocations countries={analytics.countries} cities={analytics.cities} />
    </div>
  );
}
