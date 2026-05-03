"use client";

import { useState } from "react";
import { postLogin } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Route } from "next";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await postLogin({ username, password });
    // Set token as cookie for middleware
    if (result && result.access_token) {
      try {
        const token = result.access_token;
        let expires = '';
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.exp) {
            const date = new Date(payload.exp * 1000);
            expires = "; expires=" + date.toUTCString();
          }
        }
        document.cookie = `token=${token}${expires}; path=/`;
      } catch (e) {
        document.cookie = `token=${result.access_token}; path=/`;
      }
    }
  
    setLoading(false);

    if (result?.error) {
      setError("Invalid username or password");
      return;
    }

    router.push("/dashboard" as Route);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border p-6 space-y-4"
      >
        <h1 className="text-2xl font-bold">Log in</h1>

        <input
          className="w-full rounded-lg border p-3"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          className="w-full rounded-lg border p-3"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black text-white p-3"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
        <h2>Don't have an account? <a href="/signup" className="text-blue-600">Sign up</a></h2>
      </form>
    </main>
  );
}