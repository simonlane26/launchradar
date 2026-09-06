import { IconFlask } from "@tabler/icons-react";
import { ComingSoon } from "../coming-soon";

export default function ExperimentsPage() {
  return (
    <ComingSoon
      icon={IconFlask}
      feature="Experiments"
      phase={7}
      blurb="Run channel and content hypotheses ('founder stories vs. product demos'), track results over a set window, and let the agent reallocate effort toward what actually converts."
    />
  );
}
