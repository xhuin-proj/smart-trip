"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Route } from "next";
import { postSignup, postLogin } from "@/lib/api";


export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await postSignup(form);
    setLoading(false);

    if (!res.ok) {
      setError(res.detail || "Signup failed");
      return; // Prevent further execution and redirect
    }
    // Sign in automatically after account creation
    const result = await postLogin({ username: form.username, password: form.password });

    if (result?.error) {
      setError("Account created but sign in failed. Please log in.");
      router.push("/login" as Route);
      return;
    }
    
    try {
      const token = result.access_token;
      // Try to decode JWT expiry (exp) if possible
      let expires = '';
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload.exp) {
          // exp is in seconds since epoch
          const date = new Date(payload.exp * 1000);
          expires = "; expires=" + date.toUTCString();
        }
      }
      document.cookie = `token=${token}${expires}; path=/`;
    } catch (e) {
      // fallback: set session cookie
      document.cookie = `token=${result.access_token}; path=/`;
    }
    router.push("/onboarding" as Route);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border p-6 space-y-4"
      >
        <h1 className="text-2xl font-bold">Create account</h1>

        <input
          className="w-full rounded-lg border p-3"
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />

        <input
          className="w-full rounded-lg border p-3"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black text-white p-3"
        >
          {loading ? "Creating account..." : "Sign up"}
        </button>
        <h2>Already have an account? <a href="/login" className="text-blue-600">Log in</a></h2>
      </form>
    </main>
  );
}