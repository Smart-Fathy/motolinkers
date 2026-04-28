"use client";

import { useState, useTransition } from "react";
import { submitLead } from "./actions";

export default function ContactForm({ initialVehicle }: { initialVehicle?: string }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await submitLead(formData);
      if (res.ok) setDone(true);
      else setError(res.error ?? "Something went wrong.");
    });
  };

  if (done) {
    return (
      <div
        className="calc__shell"
        style={{ padding: "2.5rem", textAlign: "center" }}
      >
        <h3
          style={{
            fontFamily: "var(--ff-display)",
            fontSize: "1.8rem",
            color: "var(--volt)",
            margin: "0 0 .8rem",
            fontVariationSettings: '"opsz" 48, "SOFT" 50',
          }}
        >
          Thank you.
        </h3>
        <p style={{ color: "var(--bone)", opacity: 0.75, margin: 0 }}>
          A consultant will reach out within one business day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="calc__shell">
      <div className="field">
        <label htmlFor="lead-name">Your Name *</label>
        <input id="lead-name" name="name" type="text" required />
      </div>
      <div className="field">
        <label htmlFor="lead-email">Email</label>
        <input id="lead-email" name="email" type="email" />
      </div>
      <div className="field">
        <label htmlFor="lead-phone">Phone</label>
        <input id="lead-phone" name="phone" type="tel" />
      </div>
      <div className="field">
        <label htmlFor="lead-vehicle">Vehicle of interest</label>
        <input
          id="lead-vehicle"
          name="vehicle"
          type="text"
          defaultValue={initialVehicle ?? ""}
          placeholder="e.g. BYD Sealion 06 EV 605 PLUS"
        />
      </div>
      <div className="field">
        <label htmlFor="lead-message">Message</label>
        <textarea
          id="lead-message"
          name="message"
          rows={4}
          style={{
            width: "100%",
            padding: "1rem 1.1rem",
            borderRadius: 12,
            background: "rgba(238,232,220,.04)",
            border: "1px solid var(--line)",
            color: "var(--bone)",
            fontSize: "1rem",
            fontFamily: "var(--ff-sans)",
            resize: "vertical",
          }}
        />
      </div>
      {error && (
        <p
          style={{
            color: "var(--ember)",
            fontSize: ".88rem",
            marginTop: ".4rem",
          }}
        >
          {error}
        </p>
      )}
      <div
        className="calc__actions"
        style={{ justifyContent: "flex-end", marginTop: "1.5rem" }}
      >
        <button
          type="submit"
          className="btn btn--primary"
          disabled={pending}
          data-hover
        >
          {pending ? "Sending…" : "Send"}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </form>
  );
}
