"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // Lazy-create the Supabase client on submit so module-level prerender
    // doesn't crash when build-time env vars are missing.
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setError(signInError.message);
      return;
    }
    startTransition(() => {
      router.push("/admin");
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="adm-login__card">
      <h1 className="adm-login__title">
        Admin <em>sign in</em>
      </h1>
      <div className="adm__field">
        <label className="adm__label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          className="adm__input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="adm__field">
        <label className="adm__label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          className="adm__input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <div className="adm__error">{error}</div>}
      <button type="submit" className="adm__btn adm__btn--primary" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
