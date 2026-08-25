"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { COUNTRY_OPTIONS, TOPIC_OPTIONS } from "@/lib/news-options";
import type { Category, CountryCode, DateRange, NewsAssistantResponse } from "@/types/news";

interface NewsAssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const PIPELINE = ["Parse question", "Search coverage", "Rank matches", "Ground answer"];

function formatPublishedAt(publishedAt: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Tunis"
  }).format(new Date(publishedAt));
}

function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function NewsAssistant({
  category,
  country,
  dateRange,
  initialQuery
}: {
  category: Category;
  country: CountryCode;
  dateRange: DateRange;
  initialQuery?: string;
}) {
  const [question, setQuestion] = useState(initialQuery ?? "");
  const [messages, setMessages] = useState<NewsAssistantMessage[]>([]);
  const [latestSources, setLatestSources] = useState<NewsAssistantResponse["articles"]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const categoryLabel = TOPIC_OPTIONS.find((option) => option.id === category)?.label ?? category;
  const countryLabel = COUNTRY_OPTIONS.find((option) => option.id === country)?.label ?? country;

  const starterPrompts = useMemo(
    () => [
      category === "ai" || category === "llm"
        ? "What is the latest AI and LLM news right now?"
        : `What is the latest ${categoryLabel.toLowerCase()} story right now?`,
      country === "global"
        ? `Find the most important story in ${categoryLabel.toLowerCase()} and explain why it matters.`
        : `What is happening in ${countryLabel} news right now?`,
      category === "ai" || category === "llm"
        ? "Give your view on the likely impact, risks, and winners or losers from this AI story."
        : category === "stocks"
          ? "What is the market impact and what signals should investors watch next?"
          : "Give me the details, context, and sources for the strongest match.",
      country === "cn" || country === "ru"
        ? `Explain regional context in ${countryLabel} and why this story matters globally.`
        : "Where is coverage still thin, and what questions should I ask next?"
    ],
    [category, categoryLabel, country, countryLabel]
  );

  const conversationHistory = messages.map((message) => ({
    role: message.role,
    content: message.content
  }));

  const submitQuestion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || loading) {
      return;
    }

    const userMessage: NewsAssistantMessage = {
      id: makeId(),
      role: "user",
      content: trimmedQuestion
    };

    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/news/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question: trimmedQuestion,
          history: conversationHistory,
          category,
          country,
          dateRange
        }),
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const payload = (await response.json()) as NewsAssistantResponse;
      setLatestSources(payload.articles);
      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: "assistant",
          content: payload.answer
        }
      ]);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Unknown assistant error";
      setError(message);
      setLatestSources([]);
      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: "assistant",
          content: "I could not search the latest coverage just now. Try narrowing the topic, company, person, or region."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit when initialQuery is provided
  useEffect(() => {
    if (initialQuery && !hasAutoSubmitted && messages.length === 0) {
      setHasAutoSubmitted(true);
      const timer = setTimeout(() => {
        formRef.current?.requestSubmit();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialQuery, hasAutoSubmitted, messages.length]);

  return (
    <section
      className={`animated-border relative mb-8 overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow-deep)] ${
        loading ? "active" : ""
      }`}
    >
      {/* header strip */}
      <div className="flex items-center gap-3 border-b border-line bg-surface-2 px-4 py-2.5 sm:px-5">
        <p className="t-micro text-faint">news assistant · live retrieval</p>
      </div>

      <div className="p-4 sm:p-6">
        <div className="rule">
          <span className="t-micro text-ember">ask the news</span>
        </div>
        <h2 className="t-h3 mt-3 font-display font-semibold text-ink">
          One question. A sourced answer.
        </h2>

        <form ref={formRef} onSubmit={submitQuestion} className="mt-5 grid gap-2.5 lg:grid-cols-[1fr_auto]">
          <label htmlFor="news-assistant-question" className="sr-only">
            Ask the news assistant
          </label>

          <textarea
            id="news-assistant-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            rows={2}
            placeholder="Ask for a specific story, person, company, or issue…"
            className="min-h-20 w-full resize-y rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm leading-relaxed text-ink placeholder:text-faint focus:border-ember focus:outline-none"
          />

          <button
            type="submit"
            disabled={loading || question.trim().length === 0}
            className="sheen inline-flex h-auto items-center justify-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition-colors duration-300 hover:bg-ember disabled:pointer-events-none disabled:opacity-40 lg:self-stretch"
          >
            {loading ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-paper/30 border-t-paper" />
                Distilling
              </>
            ) : (
              "Ask"
            )}
          </button>
        </form>

        <div className="scrollbar-none -mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {starterPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => setQuestion(prompt)}
              className="t-mono shrink-0 rounded-full border border-line px-3 py-1 text-muted transition hover:border-ember/50 hover:text-ink"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* conversation */}
        <div aria-live="polite" className="mt-5 space-y-3 border-t border-line pt-5">
          {messages.length === 0 && !loading ? (
            <div className="space-y-2.5">
              {PIPELINE.map((label, i) => (
                <div key={label} className="t-mono flex items-center gap-2.5 text-faint/70">
                  <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border border-line text-[8px]">
                    {i + 1}
                  </span>
                  {label}
                </div>
              ))}
              <p className="pt-1 text-[13px] leading-relaxed text-muted">
                Try a named person, a headline, a company, or a current event — the assistant searches current
                coverage and answers with the source attached.
              </p>
            </div>
          ) : null}

          {messages.map((message) =>
            message.role === "user" ? (
              <div
                key={message.id}
                className="ml-auto max-w-3xl rounded-lg border border-ember/30 bg-ember-soft/40 px-4 py-3 text-sm leading-relaxed text-ink"
              >
                <p className="t-micro mb-1 text-ember">you</p>
                {message.content}
              </div>
            ) : (
              <div key={message.id} className="mr-auto max-w-4xl rounded-lg border border-line bg-paper px-4 py-3.5">
                <p className="t-micro mb-2 flex items-center gap-1.5 text-teal">
                  <span className="h-1.5 w-1.5 rotate-45 bg-teal" /> distilled
                </p>
                <p className="t-body whitespace-pre-wrap text-ink-2">{message.content}</p>
              </div>
            )
          )}

          {loading ? (
            <div className="t-mono flex items-center gap-2 text-muted">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-line border-t-ember" />
              searching articles, grounding the answer…
            </div>
          ) : null}

          {error ? <p className="t-mono text-ember">{error}</p> : null}
        </div>

        {/* sources */}
        {latestSources.length > 0 ? (
          <div className="mt-5 border-t border-line pt-5">
            <div className="rule">
              <span className="t-micro text-faint">top sources · {latestSources.length} matches</span>
            </div>

            <div className="mt-4 grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
              {latestSources.map((source) => (
                <a
                  key={source.id}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="lift block rounded-lg border border-line bg-paper p-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[13px] font-semibold leading-snug text-ink">{source.title}</p>
                    <span className="t-mono shrink-0 text-teal">{source.relevance}%</span>
                  </div>
                  <p className="t-mono mt-2 text-faint">
                    {source.source} · {formatPublishedAt(source.publishedAt)}
                  </p>
                  <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-muted">{source.snippet}</p>
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
