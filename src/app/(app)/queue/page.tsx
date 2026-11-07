import { requireOrganisation } from "@/lib/org";
import { prisma } from "@/lib/prisma";
import { currentWeekRange, CHANNEL_LABEL, QUEUE_CHANNELS } from "@/lib/queue";
import { eligibleDrafts } from "@/lib/queue-server";
import { QueueItemCard } from "./queue-item-card";
import { AddToQueuePanel } from "./add-to-queue-panel";
import { ChannelProfilesPanel } from "./channel-profiles-panel";

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function QueuePage() {
  const organisation = await requireOrganisation();
  const { start, end } = currentWeekRange();

  const [items, projects, drafts] = await Promise.all([
    prisma.queueItem.findMany({
      where: { organisationId: organisation.id, scheduledFor: { gte: start, lt: end } },
      orderBy: { scheduledFor: "asc" },
      include: {
        project: { select: { id: true, name: true, url: true } },
        action: { select: { title: true, guide: true } },
        opportunity: { select: { title: true, reply: true } },
      },
    }),
    prisma.project.findMany({
      where: { organisationId: organisation.id },
      select: { id: true, name: true, url: true, channelProfiles: true },
      orderBy: { createdAt: "desc" },
    }),
    eligibleDrafts(organisation.id),
  ]);

  // Group by day, Monday first — only render days that actually have items.
  const days: { date: Date; items: typeof items }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dayItems = items.filter((it) => dateKey(it.scheduledFor) === dateKey(d));
    if (dayItems.length > 0) days.push({ date: d, items: dayItems });
  }

  const planned = items.filter((i) => i.status === "PLANNED").length;
  const posted = items.filter((i) => i.status === "POSTED").length;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-16">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          This Week
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {planned > 0 || posted > 0
            ? `${planned} planned · ${posted} posted, across every project`
            : "Nothing scheduled yet — add a drafted post below to get started."}
        </p>
      </header>

      <section className="flex flex-col gap-6">
        {days.length === 0 && (
          <p className="text-sm text-zinc-500">
            Nothing scheduled for this week yet.
          </p>
        )}
        {days.map(({ date, items: dayItems }) => (
          <div key={dateKey(date)}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
              {DAY_LABELS[(date.getDay() + 6) % 7]} · {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </h2>
            <ul className="flex flex-col gap-2">
              {dayItems.map((item) => {
                const title = item.action?.title ?? item.opportunity?.title ?? "";
                const draftText = item.action?.guide ?? item.opportunity?.reply ?? "";
                return (
                  <li key={item.id}>
                    <QueueItemCard
                      id={item.id}
                      projectName={item.project.name ?? item.project.url}
                      channel={item.channel}
                      title={title}
                      draftText={draftText}
                      status={item.status}
                      postedUrl={item.postedUrl}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>

      <AddToQueuePanel
        drafts={drafts}
        projectChannels={projects.map((p) => ({
          projectId: p.id,
          channels: QUEUE_CHANNELS.filter((c) =>
            p.channelProfiles.some((cp) => cp.channel === c && cp.active),
          ),
        }))}
        weekStart={start.toISOString()}
      />

      <ChannelProfilesPanel
        projects={projects.map((p) => ({
          id: p.id,
          name: p.name ?? p.url,
          profiles: QUEUE_CHANNELS.map((channel) => {
            const existing = p.channelProfiles.find((cp) => cp.channel === channel);
            return {
              channel,
              label: CHANNEL_LABEL[channel],
              active: existing?.active ?? false,
              maxPerWeek: existing?.maxPerWeek ?? 1,
            };
          }),
        }))}
      />
    </div>
  );
}
