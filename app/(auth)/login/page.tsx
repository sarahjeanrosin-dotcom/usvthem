"use client";

import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFormError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setFormError("Invalid email or password.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-blue-ice">
      <div className="w-full max-w-sm rounded-2xl bg-white px-8 py-10 shadow-lg">
        <div className="mb-8 flex justify-center">
          <Image
            src="/genea-logo.svg"
            alt="Genea"
            width={160}
            height={29}
            priority
          />
        </div>

        <h1 className="mb-1 text-center text-xl font-semibold text-brand-navy">
          Battle Card Generator
        </h1>
        <p className="mb-8 text-center text-sm text-gray-text">
          Sign in to generate competitive battle cards
        </p>

        {(error || formError) && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-600">
            {formError || "Sign-in failed. Please try again."}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            placeholder="you@getgenea.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-navy px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-blue disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          Access restricted to Genea team members
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
