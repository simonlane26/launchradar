import { IconChartLine } from "@tabler/icons-react";
import { ComingSoon } from "../coming-soon";

export default function AnalyticsPage() {
  return (
    <ComingSoon
      icon={IconChartLine}
      feature="Analytics"
      phase={7}
      blurb="Traffic, signups and paid conversions per channel, with cost-per-acquisition attribution — the data behind the 'stop doing X, do more Y' recommendations."
    />
  );
}
