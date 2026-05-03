"use client"
import Navbar from "@/components/Navbar";
import { Button } from "@mui/material"
import { Send, Plane, Loader2 } from "lucide-react"
import React, { useState } from "react";
import { postItinerary } from "@/lib/api";
import ItineraryCard from "@/components/ItineraryCard";

export async function fetchItinerary(data: any) {
  const response = await postItinerary(data);
  if (response.error) {
    throw new Error("Failed to fetch itinerary");
  }
  return response;
}

export default function ItineraryPage() {
  const [input, setInput] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await fetchItinerary({ query: input })
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4">
          <div className="flex items-center justify-center rounded-lg bg-primary p-2">
            <Plane className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">AI Itinerary Builder</h1>
            <p className="text-sm text-muted-foreground">Plan your perfect trip</p>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me about your trip plans..."
              className="flex-1 rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-4"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
              <span className="sr-only">Send message</span>
            </Button>
          </form>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {(() => {
            let itineraryArr = null;
            if (result && result.itinerary) {
              if (Array.isArray(result.itinerary)) {
                itineraryArr = result.itinerary;
              } else if (typeof result.itinerary === "string") {
                // Try to extract JSON from the string
                try {
                  // Find the first '{' and last '}' to extract the JSON block
                  const start = result.itinerary.indexOf('{');
                  const end = result.itinerary.lastIndexOf('}');
                  if (start !== -1 && end !== -1) {
                    const jsonStr = result.itinerary.substring(start, end + 1);
                    const parsed = JSON.parse(jsonStr);
                    if (parsed && Array.isArray(parsed.itinerary)) {
                      itineraryArr = parsed.itinerary;
                    }
                  }
                } catch (e) {
                  // ignore parse errors
                }
              }
            }
            if (itineraryArr) {
              return (
                <div className="flex flex-col gap-4">
                  {itineraryArr.map((day: any, idx: number) => (
                    <div key={idx}>
                      {day.day && (
                        <h2 className="text-xl font-bold mb-2">Day {day.day}</h2>
                      )}
                      {Array.isArray(day.sections) && day.sections.map((section: any, sectionIdx: number) => (
                        <ItineraryCard
                          key={sectionIdx}
                          time={section.time}
                          places={
                            Array.isArray(section.places)
                              ? section.places.map((place: any) => ({
                                  name: place.name,
                                  description: place.description,
                                  image: place.image,
                                }))
                              : []
                          }
                        />
                      ))}
                    </div>
                  ))}
                </div>
              );
            } else if (result) {
              return (
                <>
                  <pre className="bg-yellow-50 text-xs text-yellow-900 rounded p-2 mb-2 overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>
                  <div className="text-red-500">Itinerary data is not in the expected format.</div>
                </>
              );
            } else {
              return null;
            }
          })()}
        </div>
      </main>
    </div>
  )
}
