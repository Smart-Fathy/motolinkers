"use client";

import { useEffect, useRef, useState } from "react";

// MotoAgent floating chat widget. Bottom-right pill button on every
// public page; clicking expands a 380×580 panel with a streaming chat.
// Locale toggle (EN ↔ AR) flips RTL on the panel body.

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AgentSettings {
  is_enabled: boolean;
  greeting_en: string;
  greeting_ar: string;
}

const STR = {
  en: {
    title: "MotoAgent",
    placeholder: "Ask about importing your next EV…",
    send: "Send",
    open: "Chat with MotoAgent",
    close: "Close chat",
    locale: "EN",
    altLocale: "العربية",
    error: "Sorry, something went wrong. Please try again.",
    rateLimitMin: "You're sending messages too quickly. Please wait a few seconds.",
    rateLimitDay: "You've reached today's message limit. Try again tomorrow.",
    typing: "MotoAgent is typing…",
  },
  ar: {
    title: "MotoAgent",
    placeholder: "اسأل عن استيراد سيارتك الكهربائية القادمة…",
    send: "إرسال",
    open: "تحدث مع MotoAgent",
    close: "إغلاق المحادثة",
    locale: "العربية",
    altLocale: "EN",
    error: "عذراً، حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    rateLimitMin: "أنت ترسل الرسائل بسرعة كبيرة. يرجى الانتظار بضع ثوانٍ.",
    rateLimitDay: "لقد وصلت إلى حد الرسائل اليومي. حاول مرة أخرى غداً.",
    typing: "MotoAgent يكتب…",
  },
} as const;

const LOCALE_STORAGE_KEY = "mlk_motoagent_locale";

export default function MotoAgentWidget({
  settings,
}: {
  settings: AgentSettings | null;
}) {
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState<"en" | "ar">("en");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Restore locale + show greeting on first open.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (stored === "ar" || stored === "en") setLocale(stored);
    } catch {
      // localStorage unavailable — fall through with default
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    if (messages.length === 0 && settings) {
      const greeting = locale === "ar" ? settings.greeting_ar : settings.greeting_en;
      setMessages([{ role: "assistant", content: greeting }]);
    }
    // Focus input when the panel opens.
    inputRef.current?.focus();
  }, [open, settings, locale, messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  function setLocaleAndPersist(next: "en" | "ar") {
    setLocale(next);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // ignore
    }
    // Reset the conversation when the user explicitly changes locale —
    // a fresh greeting + new convo id makes the experience cleaner.
    setMessages([]);
    conversationIdRef.current = null;
    setError(null);
  }

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;
    setError(null);
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);
    setStreaming(true);

    try {
      const res = await fetch("/api/motoagent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversationIdRef.current,
          locale,
          message: text,
        }),
      });
      if (!res.ok) {
        const code = (await res.json().catch(() => ({}))) as { error?: string };
        let msg = STR[locale].error;
        if (code.error === "rate-limit-minute") msg = STR[locale].rateLimitMin;
        else if (code.error === "rate-limit-day") msg = STR[locale].rateLimitDay;
        setError(msg);
        // Drop the empty assistant placeholder we optimistically added.
        setMessages((m) => m.slice(0, -1));
        setStreaming(false);
        return;
      }
      const newConvoId = res.headers.get("X-Conversation-Id");
      if (newConvoId) conversationIdRef.current = newConvoId;
      const reader = res.body?.getReader();
      if (!reader) {
        setError(STR[locale].error);
        setStreaming(false);
        return;
      }
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;
        // Append to the in-flight assistant message (the last one).
        setMessages((m) => {
          if (m.length === 0) return m;
          const last = m[m.length - 1];
          if (last.role !== "assistant") return m;
          const updated = m.slice(0, -1);
          updated.push({ role: "assistant", content: last.content + chunk });
          return updated;
        });
      }
    } catch (e) {
      console.error("[motoagent] send error:", e);
      setError(STR[locale].error);
      setMessages((m) => m.slice(0, -1));
    } finally {
      setStreaming(false);
    }
  }

  if (!settings || !settings.is_enabled) return null;

  const t = STR[locale];
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        zIndex: 90,
      }}
    >
      {open ? (
        <section
          dir={dir}
          aria-label={t.title}
          style={{
            width: "min(380px, calc(100vw - 2rem))",
            height: "min(580px, calc(100dvh - 4rem))",
            background: "var(--ink-2)",
            border: "1px solid var(--line-strong)",
            borderRadius: 16,
            boxShadow: "0 30px 60px rgba(0,0,0,.45)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <header
            style={{
              padding: ".9rem 1rem",
              borderBottom: "1px solid var(--line)",
              display: "flex",
              alignItems: "center",
              gap: ".6rem",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--volt), rgba(232,208,140,.5))",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--ink)",
                fontFamily: "var(--ff-mono)",
                fontSize: ".72rem",
                fontWeight: 700,
              }}
            >
              ML
            </div>
            <strong style={{ color: "var(--bone)", fontSize: ".95rem" }}>{t.title}</strong>
            <span style={{ flex: 1 }} />
            <button
              type="button"
              onClick={() => setLocaleAndPersist(locale === "en" ? "ar" : "en")}
              style={{
                fontFamily: "var(--ff-mono)",
                fontSize: ".7rem",
                letterSpacing: ".1em",
                background: "transparent",
                color: "var(--bone)",
                border: "1px solid var(--line)",
                padding: ".3rem .6rem",
                borderRadius: 999,
                cursor: "pointer",
              }}
              title={t.altLocale}
            >
              {t.altLocale}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t.close}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "transparent",
                color: "var(--bone)",
                border: "1px solid var(--line)",
                cursor: "pointer",
                fontSize: "1.1rem",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </header>

          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflow: "auto",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: ".7rem",
            }}
          >
            {messages.map((m, i) => (
              <Bubble key={i} role={m.role} content={m.content} />
            ))}
            {streaming && messages[messages.length - 1]?.content === "" && (
              <p
                style={{
                  color: "var(--stone)",
                  fontSize: ".82rem",
                  fontStyle: "italic",
                  margin: 0,
                }}
              >
                {t.typing}
              </p>
            )}
            {error && (
              <p
                role="alert"
                style={{
                  color: "#e87b7b",
                  fontSize: ".85rem",
                  margin: ".4rem 0 0",
                  background: "rgba(232,123,123,.08)",
                  border: "1px solid rgba(232,123,123,.3)",
                  padding: ".5rem .7rem",
                  borderRadius: 8,
                }}
              >
                {error}
              </p>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            style={{
              borderTop: "1px solid var(--line)",
              padding: ".7rem",
              display: "flex",
              gap: ".5rem",
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder={t.placeholder}
              rows={1}
              dir={dir}
              style={{
                flex: 1,
                resize: "none",
                background: "var(--ink)",
                color: "var(--bone)",
                border: "1px solid var(--line)",
                borderRadius: 10,
                padding: ".55rem .7rem",
                fontSize: ".92rem",
                fontFamily: "var(--ff-sans)",
                minHeight: 38,
                maxHeight: 120,
              }}
              disabled={streaming}
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              style={{
                background: "var(--volt)",
                color: "var(--ink)",
                border: "1px solid var(--volt)",
                borderRadius: 10,
                padding: "0 .9rem",
                fontFamily: "var(--ff-mono)",
                fontSize: ".74rem",
                letterSpacing: ".1em",
                textTransform: "uppercase",
                cursor: streaming || !input.trim() ? "not-allowed" : "pointer",
                opacity: streaming || !input.trim() ? 0.5 : 1,
              }}
            >
              {t.send}
            </button>
          </form>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t.open}
          style={{
            background: "var(--volt)",
            color: "var(--ink)",
            border: "none",
            borderRadius: 999,
            padding: "0.85rem 1.2rem",
            fontFamily: "var(--ff-mono)",
            fontSize: ".78rem",
            letterSpacing: ".1em",
            textTransform: "uppercase",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: ".5rem",
            boxShadow: "0 14px 30px rgba(232,208,140,.25)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 12c0 4.4-4 8-9 8a9.6 9.6 0 0 1-3-.5L4 21l1.5-4.5A8.4 8.4 0 0 1 3 12c0-4.4 4-8 9-8s9 3.6 9 8z" />
          </svg>
          MotoAgent
        </button>
      )}
    </div>
  );
}

function Bubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  return (
    <div
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: "85%",
        background: isUser ? "rgba(232,208,140,.14)" : "var(--ink)",
        border: `1px solid ${isUser ? "rgba(232,208,140,.32)" : "var(--line)"}`,
        color: "var(--bone)",
        borderRadius: 12,
        padding: ".55rem .8rem",
        fontSize: ".93rem",
        lineHeight: 1.5,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      {content}
    </div>
  );
}
