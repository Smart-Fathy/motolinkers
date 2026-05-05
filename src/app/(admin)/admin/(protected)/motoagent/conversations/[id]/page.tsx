import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DeleteConversationButton from "./DeleteConversationButton";

export const metadata = { title: "Conversation — MotoLinkers Admin" };
export const dynamic = "force-dynamic";

interface Convo {
  id: string;
  session_id: string;
  locale: "en" | "ar";
  country: string | null;
  message_count: number;
  transcript: { role: string; content: string; ts?: string }[] | null;
  started_at: string;
  last_message_at: string;
}

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export default async function ConversationDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("motoagent_conversations")
    .select(
      "id, session_id, locale, country, message_count, transcript, started_at, last_message_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !data) notFound();
  const convo = data as unknown as Convo;
  const transcript = Array.isArray(convo.transcript) ? convo.transcript : [];

  return (
    <>
      <div className="adm__page-head">
        <div>
          <p style={{ margin: 0, fontSize: ".82rem" }}>
            <Link href="/admin/motoagent/conversations" style={{ color: "var(--volt)" }}>
              ← All conversations
            </Link>
          </p>
          <h1 className="adm__h1">Conversation</h1>
          <p className="adm__sub">
            {convo.locale.toUpperCase()} · {convo.country ?? "—"} · started{" "}
            {fmtDate(convo.started_at)} · {convo.message_count} messages
          </p>
        </div>
        <DeleteConversationButton id={convo.id} />
      </div>

      <div
        dir={convo.locale === "ar" ? "rtl" : "ltr"}
        style={{
          background: "var(--ink-2)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: ".7rem",
          marginTop: "1rem",
        }}
      >
        {transcript.length === 0 ? (
          <p style={{ color: "var(--stone)", fontSize: ".9rem", margin: 0 }}>
            (empty transcript)
          </p>
        ) : (
          transcript.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
                background: m.role === "user" ? "rgba(232,208,140,.12)" : "var(--ink)",
                border: `1px solid ${m.role === "user" ? "rgba(232,208,140,.32)" : "var(--line)"}`,
                color: "var(--bone)",
                borderRadius: 12,
                padding: ".55rem .8rem",
                fontSize: ".93rem",
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--ff-mono)",
                  fontSize: ".68rem",
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  color: "var(--stone)",
                  marginBottom: ".25rem",
                }}
              >
                {m.role}
                {m.ts && ` · ${fmtDate(m.ts)}`}
              </div>
              {m.content}
            </div>
          ))
        )}
      </div>
    </>
  );
}
