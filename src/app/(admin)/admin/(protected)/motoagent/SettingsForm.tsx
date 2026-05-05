"use client";

import { useState, useTransition } from "react";
import { updateMotoagentSettings } from "./actions";

interface Settings {
  is_enabled: boolean;
  model: string;
  temperature: number;
  max_output_tokens: number;
  system_prompt_extra: string;
  greeting_en: string;
  greeting_ar: string;
  daily_message_cap_per_session: number;
  per_minute_cap_per_session: number;
}

// Curated Workers AI model IDs that work well for Arabic + English
// chat. Larger = better quality, slower. Admin can also paste a
// custom ID by switching the select to "Custom" and typing.
const MODEL_PRESETS: { value: string; label: string }[] = [
  { value: "@cf/meta/llama-3.3-70b-instruct-fp8-fast", label: "Llama 3.3 70B (recommended)" },
  { value: "@cf/meta/llama-3.1-8b-instruct", label: "Llama 3.1 8B (faster, less nuance)" },
  { value: "@cf/google/gemma-3-12b-it", label: "Gemma 3 12B" },
  { value: "@cf/qwen/qwen2.5-coder-32b-instruct", label: "Qwen 2.5 32B" },
];

export default function SettingsForm({ initial }: { initial: Settings }) {
  const [isEnabled, setIsEnabled] = useState(initial.is_enabled);
  const [temperature, setTemperature] = useState(initial.temperature);
  const [maxTokens, setMaxTokens] = useState(initial.max_output_tokens);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const fd = new FormData(e.currentTarget);
    fd.set("temperature", String(temperature));
    fd.set("max_output_tokens", String(maxTokens));
    startTransition(async () => {
      const res = await updateMotoagentSettings(fd);
      if (!res.ok) setError(res.error);
      else setSuccess(true);
    });
  }

  return (
    <form className="adm__form" onSubmit={onSubmit}>
      <div className="adm__field adm__field--full">
        <label className="adm__checkbox">
          <input
            type="checkbox"
            name="is_enabled"
            checked={isEnabled}
            onChange={(e) => setIsEnabled(e.target.checked)}
          />
          <span>Show MotoAgent on the public site</span>
        </label>
      </div>

      <div className="adm__field">
        <label className="adm__label" htmlFor="model">Model</label>
        <select
          id="model"
          name="model"
          className="adm__input"
          defaultValue={initial.model}
        >
          {MODEL_PRESETS.find((m) => m.value === initial.model) ? null : (
            <option value={initial.model}>{initial.model} (custom)</option>
          )}
          {MODEL_PRESETS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <p style={{ margin: ".4rem 0 0", fontSize: ".78rem", color: "var(--stone)" }}>
          Cloudflare Workers AI model ID. Llama 3.3 70B is the best quality
          default; switch to 8B if latency matters more than nuance.
        </p>
      </div>

      <div className="adm__field">
        <label className="adm__label" htmlFor="temperature">
          Temperature ({temperature.toFixed(2)})
        </label>
        <input
          id="temperature"
          type="range"
          min={0}
          max={1.2}
          step={0.05}
          value={temperature}
          onChange={(e) => setTemperature(Number(e.target.value))}
          className="adm__input"
        />
      </div>

      <div className="adm__field">
        <label className="adm__label" htmlFor="max_output_tokens">
          Max output tokens ({maxTokens})
        </label>
        <input
          id="max_output_tokens"
          type="range"
          min={128}
          max={2048}
          step={32}
          value={maxTokens}
          onChange={(e) => setMaxTokens(Number(e.target.value))}
          className="adm__input"
        />
      </div>

      <div className="adm__field adm__field--full">
        <label className="adm__label" htmlFor="greeting_en">Greeting · English</label>
        <input
          id="greeting_en"
          name="greeting_en"
          type="text"
          className="adm__input"
          defaultValue={initial.greeting_en}
        />
      </div>

      <div className="adm__field adm__field--full">
        <label className="adm__label" htmlFor="greeting_ar">Greeting · Arabic</label>
        <input
          id="greeting_ar"
          name="greeting_ar"
          type="text"
          className="adm__input"
          defaultValue={initial.greeting_ar}
          dir="rtl"
        />
      </div>

      <div className="adm__field adm__field--full">
        <label className="adm__label" htmlFor="system_prompt_extra">
          System prompt extras
        </label>
        <textarea
          id="system_prompt_extra"
          name="system_prompt_extra"
          rows={5}
          className="adm__input"
          defaultValue={initial.system_prompt_extra}
          placeholder="Operator notes appended to the auto-built knowledge base. Use this for seasonal promos, current shipping delays, or specific brand pushes."
        />
      </div>

      <div className="adm__field">
        <label className="adm__label" htmlFor="per_minute_cap_per_session">Per-minute cap</label>
        <input
          id="per_minute_cap_per_session"
          name="per_minute_cap_per_session"
          type="number"
          min={1}
          max={1000}
          className="adm__input"
          defaultValue={initial.per_minute_cap_per_session}
        />
      </div>

      <div className="adm__field">
        <label className="adm__label" htmlFor="daily_message_cap_per_session">Daily cap</label>
        <input
          id="daily_message_cap_per_session"
          name="daily_message_cap_per_session"
          type="number"
          min={1}
          max={10000}
          className="adm__input"
          defaultValue={initial.daily_message_cap_per_session}
        />
      </div>

      {error && <div className="adm__error adm__field--full">{error}</div>}
      {success && (
        <div
          className="adm__field--full"
          style={{
            padding: ".75rem 1rem",
            borderRadius: 10,
            background: "rgba(201,168,76,.10)",
            border: "1px solid rgba(201,168,76,.3)",
            color: "var(--volt)",
            fontSize: ".9rem",
          }}
        >
          Saved.
        </div>
      )}

      <div className="adm__form-actions">
        <button type="submit" className="adm__btn adm__btn--primary" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}
