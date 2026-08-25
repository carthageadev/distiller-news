import Link from "next/link";
import { db } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { articles } from "@/db/schema";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  BoltIcon,
  CheckIcon,
  FlaskIcon,
  LayersIcon,
  ShieldIcon,
  SparkleIcon,
} from "@/components/icons";
import { TheCut } from "@/components/distill";
import { HeroDistill } from "@/components/hero-distill";
import { TopicPicker } from "@/components/topic-picker";
import { CountUp, LiveAskDemo, Reveal } from "@/components/motion";
import { timeAgo } from "@/lib/format";
import { count, desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const ASK = [
  { q: "What happened in AI this week?", label: "ai" },
  { q: "Latest on climate policy", label: "climate" },
  { q: "How are markets doing today?", label: "markets" },
  { q: "Biggest science breakthroughs", label: "science" },
];

function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`px-5 py-16 sm:px-6 sm:py-24 lg:py-28 ${className}`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return <p className="t-micro text-ember">{children}</p>;
}

function H2({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`t-h2 mt-3 font-display font-semibold text-ink ${className}`}>
      {children}
    </h2>
  );
}

function Lead({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`t-lead mt-4 text-muted ${className}`}>{children}</p>;
}

export default async function HomePage() {
  await ensureSeeded();

  const [stats] = await db
    .select({
      briefs: count(),
      topics: sql<number>`count(distinct ${articles.topic})`,
      regions: sql<number>`count(distinct ${articles.region})`,
    })
    .from(articles);

  const rows = await db.select().from(articles).orderBy(desc(articles.publishedAt)).limit(2);
  const cut = rows[0];
  const deep = rows[1] ?? rows[0];

  const topicCount = Number(stats?.topics ?? 15);
  const regionCount = Number(stats?.regions ?? 15);
  const briefCount = Number(stats?.briefs ?? 0);
  const intake = briefCount * 42;

  return (
    <div className="relative">
      {/* ══ HERO ══════════════════════════════════════════════ */}
      <section className="relative flex min-h-[calc(100svh-6.5rem)] flex-col justify-center overflow-hidden border-b border-line px-5 py-14 sm:px-6 sm:py-16">
        {/* the full spectrum, dissolved into the background */}
        <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-indigo/[0.05] blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-1/4 h-80 w-80 rounded-full bg-ember/[0.06] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-72 w-72 rounded-full bg-teal/[0.05] blur-3xl" />

        <div className="relative mx-auto w-full max-w-6xl">
          <div className="max-w-3xl">
            <div className="rule">
              <span className="t-micro text-ember">news intelligence</span>
            </div>

            <h1 className="t-hero mt-6 font-display font-semibold text-ink">
              Hundreds of articles in.
              <br />
              <span className="bg-gradient-to-r from-ember via-amber to-teal bg-clip-text text-transparent">
                Three bullets out.
              </span>
            </h1>

            <p className="t-lead mt-6 max-w-lg text-muted">
              Distiller reads the day&apos;s coverage, throws away{" "}
              <span className="font-semibold text-ink">95% of it</span>, and keeps
              only the part you needed — with the source still attached.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="sheen group inline-flex items-center gap-2 rounded-lg bg-ink px-6 py-3 text-sm font-semibold text-paper transition-colors duration-300 hover:bg-ember"
              >
                Start for free
                <ArrowRightIcon
                  width={15}
                  height={15}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
              <Link
                href="/feed"
                className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-6 py-3 text-sm font-semibold text-ink transition-colors duration-300 hover:border-ember hover:text-ember"
              >
                Browse the feed
              </Link>
            </div>
            <p className="t-mono mt-4 text-faint">
              7-day Pro trial · no card required
            </p>
          </div>

          {/* the distillation, in motion */}
          {cut && (
            <div className="mt-12 sm:mt-14">
              <HeroDistill
                topic={cut.topic}
                bullets={cut.bullets}
                insight={cut.keyInsight}
                source={cut.source}
                articleId={cut.id}
                intake={intake}
              />
            </div>
          )}
        </div>
      </section>

      {/* ══ THE THREE DROPS ═══════════════════════════════════ */}
      <Section className="bg-surface">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16">
          <Reveal>
            <Kicker>the brief</Kicker>
            <H2>Everything that matters. Nothing that doesn&apos;t.</H2>
            <Lead className="max-w-sm">
              Every brief is three bullets, one key insight, and a conclusion —
              traced back to the original reporting.
            </Lead>

            <ul className="mt-8 space-y-3.5">
              {[
                ["Three bullets", "The whole story, compressed"],
                ["One key insight", "The line you&apos;ll still recall next week"],
                ["Its source", "Named, linked, never fabricated"],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] bg-teal/12 text-teal">
                    <CheckIcon width={10} height={10} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-ink">{t}</span>
                    <span className="block text-[13px] text-faint">{d}</span>
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href="/feed"
              className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-ember"
            >
              <span className="underline-draw">See the live feed</span>
              <ArrowRightIcon
                width={14}
                height={14}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </Reveal>

          {cut && (
            <Reveal delay={120}>
              <article className="lift relative overflow-hidden rounded-xl border border-line bg-paper p-6 sm:p-8">
                

                <div className="flex flex-wrap items-center gap-2 t-mono">
                  <span className="rounded-[4px] bg-ember-soft px-2 py-0.5 text-ember">
                    {cut.topic}
                  </span>
                  <span className="text-faint">{cut.region}</span>
                  <span className="ml-auto text-faint">{timeAgo(cut.publishedAt)}</span>
                </div>

                <h3 className="t-h3 mt-4 font-display font-semibold leading-snug text-ink">
                  {cut.title}
                </h3>

                <ul className="mt-6 space-y-3.5">
                  {cut.bullets.map((b, i) => (
                    <li key={i} className="flex gap-3.5">
                      <span className="mt-[9px] h-2 w-2 shrink-0 rotate-45 bg-ember" />
                      <span className="t-body text-ink-2">{b}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 border-l-2 border-ember bg-ember-soft/40 px-4 py-3.5">
                  <p className="t-micro flex items-center gap-1.5 text-ember">
                    <BoltIcon width={9} height={9} /> key insight
                  </p>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">
                    {cut.keyInsight}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                  <a
                    href={cut.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="t-mono inline-flex items-center gap-1.5 text-muted transition-colors hover:text-ember"
                  >
                    {cut.source}
                    <ArrowUpRightIcon width={10} height={10} />
                  </a>
                  <Link
                    href={`/article/${cut.id}`}
                    className="group inline-flex items-center gap-2 text-sm font-semibold text-ink"
                  >
                    <span className="underline-draw">Read brief</span>
                    <ArrowRightIcon
                      width={13}
                      height={13}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </Link>
                </div>
              </article>
            </Reveal>
          )}
        </div>
      </Section>

      {/* ══ THE CUT ═══════════════════════════════════════════ */}
      <Section id="cut" className="border-y border-line">
        <Reveal className="max-w-2xl">
          <Kicker>the cut</Kicker>
          <H2>A distiller&apos;s real skill is knowing what to throw away.</H2>
          <Lead>
            The heads are volatile noise. The tails are heavy filler. Only the
            heart survives — and it&apos;s a small fraction of what went in.
          </Lead>
        </Reveal>

        {cut && (
          <Reveal delay={100}>
            <div className="mt-10">
              <TheCut
                bullets={cut.bullets}
                keyInsight={cut.keyInsight}
                source={cut.source}
                articleId={cut.id}
              />
            </div>
          </Reveal>
        )}
      </Section>

      {/* ══ PROOF ═════════════════════════════════════════════ */}
      <Section className="bg-surface">
        <Reveal className="max-w-2xl">
          <Kicker>proof</Kicker>
          <H2>Every bullet traces back to the article.</H2>
          <Lead>
            Nothing is invented. Each bullet is drawn from a retrieved passage of
            the original report, and the source travels with it.
          </Lead>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-3 sm:gap-5">
          {[
            {
              n: "01",
              t: "Fetch",
              d: "The original story is pulled from the wire.",
              Icon: FlaskIcon,
            },
            {
              n: "02",
              t: "Retrieve",
              d: "Passages are ranked against the question.",
              Icon: SparkleIcon,
            },
            {
              n: "03",
              t: "Ground",
              d: "Bullets are written only from what was found.",
              Icon: ShieldIcon,
            },
          ].map((s, i) => (
            <Reveal key={s.n} delay={i * 90}>
              <div className="group h-full border-t-2 border-line pt-5 transition-colors duration-400 hover:border-ember">
                <div className="flex items-center gap-3">
                  <span className="t-micro text-faint">{s.n}</span>
                  <s.Icon width={15} height={15} className="text-ember" />
                </div>
                <h3 className="t-h3 mt-3 font-display font-semibold text-ink">{s.t}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ══ DOUBLE DISTILLED ══════════════════════════════════ */}
      <Section className="border-y border-line">
        <Reveal className="max-w-2xl">
          <Kicker>double distilled</Kicker>
          <H2>Run it through twice.</H2>
          <Lead>
            Deep mode passes the same story through a second time — more context,
            more nuance, still no filler.
          </Lead>
        </Reveal>

        {deep && (
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <Reveal>
              <div className="flex h-full flex-col rounded-xl border border-line bg-surface p-6 sm:p-7">
                <div className="flex items-baseline justify-between">
                  <p className="t-mono text-faint">single pass</p>
                  <p className="t-mono text-faint">{deep.bullets.length} bullets</p>
                </div>
                <p className="t-h3 mt-3 font-display font-semibold text-ink">
                  The brief
                </p>
                <ul className="mt-5 flex-1 space-y-3">
                  {deep.bullets.map((b, i) => (
                    <li key={i} className="flex gap-3 text-[14px] leading-relaxed text-muted">
                      <span className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full bg-faint" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={110}>
              <div className="flex h-full flex-col rounded-xl border-2 border-brass/50 bg-brass-soft/30 p-6 sm:p-7">
                <div className="flex items-baseline justify-between">
                  <p className="t-mono text-brass">second pass · pro</p>
                  <p className="t-mono text-brass">{deep.deepBullets.length} bullets</p>
                </div>
                <p className="t-h3 mt-3 flex items-center gap-2 font-display font-semibold text-ink">
                  <LayersIcon width={16} height={16} className="text-brass" /> Deep
                  summary
                </p>
                <ul className="mt-5 flex-1 space-y-3">
                  {deep.deepBullets.map((b, i) => (
                    <li key={i} className="flex gap-3 text-[14px] leading-relaxed text-ink-2">
                      <span className="mt-[8px] h-1.5 w-1.5 shrink-0 rotate-45 bg-brass" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        )}
      </Section>

      {/* ══ LIVE ASK ══════════════════════════════════════════ */}
      <Section id="ask" className="bg-surface">
        <Reveal className="mx-auto max-w-xl text-center">
          <Kicker>ask the news</Kicker>
          <H2>One question. A sourced answer.</H2>
          <Lead className="mx-auto">
            Distiller searches today&apos;s coverage, finds the strongest match,
            and answers with the source attached.
          </Lead>
        </Reveal>

        <Reveal delay={100}>
          <div className="mx-auto mt-10 max-w-2xl">
            <LiveAskDemo suggestions={ASK} />
          </div>
        </Reveal>
      </Section>

      {/* ══ FRACTIONS — the interactive picker ════════════════ */}
      <Section>
        <Reveal className="max-w-2xl">
          <Kicker>fractions</Kicker>
          <H2>Tune the still to your slice of the world.</H2>
          <Lead>
            A mixture separates into fractions — each at its own temperature.
            We run {topicCount} of them across {regionCount} regions, from
            frontier AI to Tunisia&apos;s olive harvest. Pick a topic, spin the
            globe to a desk, and the feed re-tunes instantly.
          </Lead>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-10">
            <TopicPicker totalBriefs={briefCount} />
          </div>
        </Reveal>

        <Reveal delay={150}>
          <div className="mt-10 grid grid-cols-2 gap-6 border-t border-line pt-8 sm:grid-cols-4">
            {[
              [topicCount, "topics"],
              [regionCount, "regions"],
              [3, "bullets per brief"],
              [briefCount, "live briefs"],
            ].map(([n, l]) => (
              <div key={l as string}>
                <p className="font-display text-3xl font-semibold text-ink sm:text-4xl">
                  <CountUp value={n as number} />
                </p>
                <p className="t-micro mt-1 text-faint">{l as string}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* ══ PRICING — THE CUT ═════════════════════════════════ */}
      <Section id="pricing" className="border-t border-line bg-surface">
        <Reveal className="max-w-2xl text-center">
          <Kicker>pricing</Kicker>
          <H2>Two cuts. One choice.</H2>
          <p className="t-lead mx-auto mt-4 max-w-md text-muted">
            The raw feed, or the heart of it. Choose what you keep.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {/* THE TAILS — Free */}
          <Reveal>
            <div className="group relative h-full overflow-hidden rounded-2xl border border-line bg-paper p-8 transition-all duration-500 hover:border-faint/60">
              {/* muted, "uncut" visual treatment */}
              <div className="absolute inset-0 opacity-40 [background-image:repeating-linear-gradient(45deg,transparent,transparent_6px,var(--color-line)_6px,var(--color-line)_7px)]" />
              
              <div className="relative">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-faint/15 px-3 py-0.5 t-micro text-faint">uncut</span>
                </div>
                <h3 className="mt-5 font-display text-3xl font-semibold text-ink">The Tails</h3>
                <p className="mt-1 text-[15px] text-muted">Everything, unfiltered. You do the work.</p>

                <div className="mt-6 border-t border-line pt-6">
                  <p className="font-display text-5xl font-semibold text-ink tabular-nums">
                    $0<span className="text-2xl font-normal text-faint">/mo</span>
                  </p>
                </div>

                <ul className="mt-8 space-y-4 text-[14px]">
                  {[
                    "50 briefs per month",
                    "2 topics, 2 regions",
                    "Three-bullet summaries",
                    "Basic search & filters",
                  ].map((f, i) => (
                    <li key={i} className="flex items-start gap-3 text-ink-2">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-faint" />
                      {f}
                    </li>
                  ))}
                  {["Deep summaries", "Bookmarks", "RSS feed", "Unlimited access"].map((f, i) => (
                    <li key={`x-${i}`} className="flex items-start gap-3 text-faint/60 line-through">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-faint/40" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className="mt-9 block rounded-xl border border-line py-3 text-center text-sm font-semibold text-ink transition-all duration-300 group-hover:border-faint group-hover:bg-surface"
                >
                  Start with the raw feed
                </Link>
              </div>
            </div>
          </Reveal>

          {/* THE HEART — Pro */}
          <Reveal delay={80}>
            <div className="group relative h-full overflow-hidden rounded-2xl border-2 border-ember bg-gradient-to-br from-paper via-surface to-brass-soft/30 p-8 shadow-[var(--shadow-deep)] transition-all duration-500 hover:border-ember-2">
              {/* distilled visual treatment — three drops motif */}
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-ember/[0.06] blur-2xl transition-all duration-500 group-hover:bg-ember/[0.12]" />
              <div className="absolute -left-4 bottom-12 h-16 w-16 rounded-full bg-brass/[0.08] blur-xl" />

              <div className="relative">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-ember px-3 py-0.5 t-micro text-paper">the heart</span>
                  <span className="rounded-full bg-brass/20 px-2.5 py-0.5 t-micro text-brass">most kept</span>
                </div>
                <h3 className="mt-5 font-display text-3xl font-semibold text-ink">The Heart</h3>
                <p className="mt-1 text-[15px] text-muted">The only fraction that matters. Everything else, discarded.</p>

                <div className="mt-6 border-t border-line pt-6">
                  <p className="font-display text-5xl font-semibold text-ink tabular-nums">
                    $9<span className="text-2xl font-normal text-faint">/mo</span>
                  </p>
                  <p className="t-mono mt-1 text-faint">7-day free trial</p>
                </div>

                <ul className="mt-8 space-y-4 text-[14px]">
                  {[
                    "Unlimited briefs",
                    "All 15 topics, all 15 regions",
                    "Deep summary mode — the second pass",
                    "Bookmarks, RSS, daily briefing",
                    "Advanced filters & saved queries",
                  ].map((f, i) => (
                    <li key={i} className="flex items-start gap-3 text-ink-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rotate-45 bg-ember" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup?plan=pro"
                  className="sheen mt-9 block rounded-xl bg-gradient-to-r from-ember via-ember-2 to-brass py-3 text-center text-sm font-semibold text-paper shadow-lg transition-all duration-300 hover:brightness-105"
                >
                  Keep only what matters
                </Link>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal delay={160}>
          <p className="mt-8 text-center t-mono text-faint">
            Cancel anytime. No questions. The cut is yours to make.
          </p>
        </Reveal>
      </Section>

      {/* ══ CTA ═══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-t border-line px-5 py-20 sm:px-6 sm:py-28">
        <div className="pointer-events-none absolute -bottom-40 left-1/2 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-ember/[0.08] blur-3xl" />
        <div className="relative mx-auto max-w-2xl text-center">
          <Reveal>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-ink text-paper">
              <FlaskIcon width={20} height={20} />
            </span>
            <h2 className="t-h1 mt-7 font-display font-semibold text-ink">
              Stop skimming. Start distilling.
            </h2>
            <p className="t-lead mx-auto mt-4 max-w-sm text-muted">
              The world&apos;s news, three bullets. Free to start — no card, no
              catch.
            </p>
            <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="sheen group inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-6 py-3 text-sm font-semibold text-paper transition-colors duration-300 hover:bg-ember"
              >
                Get started free
                <ArrowRightIcon
                  width={15}
                  height={15}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
              <Link
                href="/feed"
                className="inline-flex items-center justify-center rounded-lg border border-line bg-surface px-6 py-3 text-sm font-semibold text-ink transition-colors duration-300 hover:border-ember hover:text-ember"
              >
                Browse feed
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
