"use client";

import { useState, useTransition } from "react";
import PlaceCard from "@/components/PlaceCard";
import { postSearch } from "@/lib/api";
import type { SearchResult } from "@/lib/types";



export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setError(null);
    startTransition(async () => {
      const res = await postSearch({query, limit: 10, use_intent_filter: true });

      if (res?.error) {
        setError("Search failed. Please try again.");
        return;
      }

      setResults(res.results);
    });
  }

  return (
    <div className="mt-8">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. romantic rooftop dinner with skyline views"
          className="flex-1 rounded-xl border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isPending || !query.trim()}
          className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "Searching…" : "Search"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      {results !== null && (
        <div className="mt-6">
          <p className="text-sm text-gray-500 mb-4">
            {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
          </p>
          {results.length === 0 ? (
            <p className="text-gray-500">No matching places found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map((place) => (
                <PlaceCard
                  key={`search-${place.id}`}
                  place={{
                    ...place,
                    imageurl: place.image_url,
                    budgetlevel: place.budget_level,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
