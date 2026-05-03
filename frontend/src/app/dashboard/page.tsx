"use client";
import { useEffect, useState } from "react";
import PlaceCard from "@/components/PlaceCard";
import SearchBar from "@/components/SearchBar";
import Navbar from "@/components/Navbar";
import { getRecommendedPlaces } from "@/lib/api";
import { Place } from "@/lib/types";
import Cookies from 'js-cookie';


export default function DashboardPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const take = 10;

  useEffect(() => {
    loadPlaces();
  }, []);

  async function loadPlaces() {
    setLoading(true);
    const token = Cookies.get('token');
    const data = await getRecommendedPlaces(skip, take, token);
    setPlaces((prev) => {
      const merged = [
        ...prev,
        ...data.map((place: Place) => ({
          ...place,
          description: place.description ?? null,
          category: place.category ?? null,
          budgetlevel: place.budgetlevel ?? null,
          imageurl: place.imageurl ?? null,
        })),
      ];
      // Deduplicate by id
      return Array.from(new Map(merged.map(p => [p.id, p])).values());
    });
    setSkip((prev) => prev + take);
    if (data.length < take) setHasMore(false);
    setLoading(false);
  }

  return (
    <>
      <Navbar />
      <main className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
          </div>
        </div>

        <section className="mt-8">
          <h2 className="text-lg font-semibold mb-2">Search</h2>
          <SearchBar />
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold mb-4">
            Places {" "}
            <span className="text-gray-400 font-normal text-sm">
              ({places.length})
            </span>
          </h2>
          {places.length === 0 && !loading ? (
            <p className="text-gray-500">No places found in the database.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {places.map((place) => (
                  <PlaceCard key={place.id} place={place} />
                ))}
              </div>
              {hasMore && (
                <div className="flex justify-center mt-6">
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                    onClick={loadPlaces}
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </>
  );
}