"use client";

import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    setSubmitted(true);
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

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-600">
            Sign-in failed. Please try again.
          </p>
        )}

        {submitted ? (
          <div className="rounded-lg bg-brand-blue-ice px-4 py-5 text-center">
            <p className="text-sm font-medium text-brand-navy">Check your email</p>
            <p className="mt-1 text-sm text-gray-text">
              We sent a sign-in link to <strong>{email}</strong>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="you@getgenea.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-navy px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-blue disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2"
            >
              {loading ? "Sending…" : "Send sign-in link"}
            </button>
          </form>
        )}

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
