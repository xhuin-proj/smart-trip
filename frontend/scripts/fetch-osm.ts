// Minimal OSM element type for filtering
type OsmElement = {
  tags?: { [key: string]: string };
};

import axios from "axios";
import fs from "fs/promises";
import path from "path";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const commonsHeaders = {
  "User-Agent": "SmartTripBot/0.1 (student project; contact: your-email@example.com)",
};

async function searchCommonsImage(query: string) {
  const url = "https://commons.wikimedia.org/w/api.php";
  const response = await axios.get(url, {
    params: {
      action: "query",
      generator: "search",
      gsrsearch: query,
      gsrnamespace: 6,
      gsrlimit: 5,
      prop: "imageinfo",
      iiprop: "url",
      format: "json",
      origin: "*",
    },
    headers: commonsHeaders,
    timeout: 15000,
  });
  const pages = response.data?.query?.pages;
  if (!pages) return null;
  const firstPage = Object.values(pages)[0] as any;
  return firstPage?.imageinfo?.[0]?.url || null;
}

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

const cityQueries = [
  {
    city: "Singapore",
    country: "Singapore",
    query: `
[out:json][timeout:60];
area["name"="Singapore"]["boundary"="administrative"]->.searchArea;

(
  // Food & Nightlife
  node["amenity"~"cafe|restaurant|bar|fast_food|food_court|pub|nightclub"](area.searchArea);
  way["amenity"~"cafe|restaurant|bar|fast_food|food_court|pub|nightclub"](area.searchArea);
  relation["amenity"~"cafe|restaurant|bar|fast_food|food_court|pub|nightclub"](area.searchArea);

  // Museums & Landmarks
  node["tourism"~"museum|attraction|gallery|zoo|aquarium|theme_park|viewpoint|artwork|monument|memorial"](area.searchArea);
  way["tourism"~"museum|attraction|gallery|zoo|aquarium|theme_park|viewpoint|artwork|monument|memorial"](area.searchArea);
  relation["tourism"~"museum|attraction|gallery|zoo|aquarium|theme_park|viewpoint|artwork|monument|memorial"](area.searchArea);

  // Parks, Nature, Beaches
  node["leisure"~"park|nature_reserve|garden|beach|playground|sports_centre|stadium|water_park|swimming_pool|recreation_ground"](area.searchArea);
  way["leisure"~"park|nature_reserve|garden|beach|playground|sports_centre|stadium|water_park|swimming_pool|recreation_ground"](area.searchArea);
  relation["leisure"~"park|nature_reserve|garden|beach|playground|sports_centre|stadium|water_park|swimming_pool|recreation_ground"](area.searchArea);

  // Activity places
  node["amenity"~"cinema|theatre|arts_centre|casino|ice_rink|bowling_alley|sports_hall|community_centre|fountain"](area.searchArea);
  way["amenity"~"cinema|theatre|arts_centre|casino|ice_rink|bowling_alley|sports_hall|community_centre|fountain"](area.searchArea);
  relation["amenity"~"cinema|theatre|arts_centre|casino|ice_rink|bowling_alley|sports_hall|community_centre|fountain"](area.searchArea);
);

out center tags;
    `,
  },
];

async function main() {
  const outputDir = path.join(process.cwd(), "data", "osm");
  await fs.mkdir(outputDir, { recursive: true });

  for (const cityQuery of cityQueries) {
    console.log(`Fetching ${cityQuery.city}...`);

    const response = await axios.post(OVERPASS_URL, cityQuery.query, {
      headers: {
        "Content-Type": "text/plain",
        "Accept": "*/*",
        "User-Agent": "SmartTripBot/0.1 (student project; contact: youremail@example.com)"
      },
      timeout: 180000,
    });


    // Filter only places with a valid name
    const elements: OsmElement[] = response.data.elements || [];
    const placesWithName = elements.filter(
      (el: OsmElement) => typeof el.tags?.name === "string" && el.tags?.name.trim().length > 0
    );

    // Score for popularity: brand, website, phone, wikidata, wikipedia, address, opening_hours, cuisine, stars, operator, description
    function popularityScore(el: OsmElement): number {
      if (!el.tags) return 0;
      let score = 0;
      if (el.tags?.brand) score += 4;
      if (el.tags?.website) score += 3;
      if (el.tags?.phone) score += 1;
      if (el.tags?.wikidata) score += 3;
      if (el.tags?.wikipedia) score += 3;
      if (el.tags?.["addr:city"] || el.tags?.["addr:street"] || el.tags?.["addr:housenumber"]) score += 1;
      if (el.tags?.opening_hours) score += 1;
      if (el.tags?.cuisine) score += 1;
      if (el.tags?.stars) score += 2;
      if (el.tags?.operator) score += 1;
      if (el.tags?.description) score += 1;
      // Bonus for well-known Singapore places (hardcoded)
      const wellKnown = [
        "Marina Bay Sands", "Gardens by the Bay", "Sentosa", "Universal Studios Singapore", "Singapore Zoo", "Night Safari", "Jewel Changi", "Orchard Road", "Clarke Quay", "Esplanade", "Merlion", "ArtScience Museum", "Singapore Flyer", "Botanic Gardens", "East Coast Park", "Chinatown", "Little India", "Bugis", "Haw Par Villa", "S.E.A. Aquarium", "River Safari", "Science Centre", "National Gallery", "National Museum", "Fort Canning", "Mount Faber", "Pulau Ubin", "Lau Pa Sat", "Maxwell Food Centre", "Newton Food Centre", "Raffles Hotel", "ION Orchard", "VivoCity", "IMM", "Jurong Bird Park", "Wild Wild Wet", "Adventure Cove", "Siloso Beach", "Palawan Beach", "Tanjong Beach", "Singapore Sports Hub", "Kallang Wave Mall", "Marina Barrage", "Southern Ridges", "MacRitchie Reservoir", "Bukit Timah Nature Reserve", "Labrador Park", "Punggol Waterway Park", "Joo Chiat", "Katong", "Dempsey Hill", "Haji Lane", "Arab Street", "Sri Mariamman Temple", "Thian Hock Keng Temple", "Sultan Mosque", "St Andrew's Cathedral", "Sri Veeramakaliamman Temple"
      ];
      if (el.tags?.name && wellKnown.some((n) => el.tags?.name.includes(n))) score += 10;
      return score;
    }

    // Sort by popularity score, descending
    const sorted = placesWithName.sort((a, b) => popularityScore(b) - popularityScore(a));
    // Remove duplicates by name (case-insensitive, trimmed)
    const seenNames = new Set();
    const uniqueByName = [];
    for (const el of sorted) {
      const name = el.tags?.name?.trim().toLowerCase();
      if (name && !seenNames.has(name)) {
        seenNames.add(name);
        uniqueByName.push(el);
      }
    }

    // Group by category
    const categories = [
      "Food & Nightlife",
      "Museum & Landmark",
      "Park & Nature",
      "Activity",
      "Other"
    ] as const;


    type Category = typeof categories[number];
    const grouped: Record<Category, typeof uniqueByName> = {
      "Food & Nightlife": [],
      "Museum & Landmark": [],
      "Park & Nature": [],
      "Activity": [],
      "Other": []
    };
    for (const el of uniqueByName) {
      const cat = mapCategory(el.tags || {}) as Category;
      if (categories.includes(cat)) grouped[cat].push(el);
      else grouped["Other"].push(el);
    }    
    
    // Pick a balanced mix (e.g., 12 food, 12 museum, 12 park, 7 activity, 7 other)
    const mixCounts = {
      "Food & Nightlife": 12,
      "Museum & Landmark": 12,
      "Park & Nature": 12,
      "Activity": 7,
      "Other": 7
    };
    let top50: typeof uniqueByName = [];
    for (const cat of categories) {
      top50 = top50.concat(grouped[cat].slice(0, mixCounts[cat]));
    }
    // If less than 50, fill with remaining from all categories
    if (top50.length < 50) {
      const leftovers = uniqueByName.filter(el => !top50.includes(el));
      top50 = top50.concat(leftovers.slice(0, 50 - top50.length));
    }
    // If more than 50, trim
    top50 = top50.slice(0, 50);

    // Map to only required fields
    function mapCategory(tags: { [key: string]: string }): string {
      if (tags["amenity"]) {
        if (/(cafe|restaurant|bar|fast_food|food_court|pub|nightclub)/.test(tags["amenity"])) return "Food & Nightlife";
        if (/(cinema|theatre|arts_centre|casino|ice_rink|bowling_alley|sports_hall|community_centre|fountain)/.test(tags["amenity"])) return "Activity";
      }
      if (tags["tourism"]) {
        if (/(museum|attraction|gallery|zoo|aquarium|theme_park|viewpoint|artwork|monument|memorial)/.test(tags["tourism"])) return "Museum & Landmark";
      }
      if (tags["leisure"]) {
        if (/(park|nature_reserve|garden|beach|playground|sports_centre|stadium|water_park|swimming_pool|recreation_ground)/.test(tags["leisure"])) return "Park & Nature";
      }
      return "Other";
    }

    function mapBudgetLevel(tags: { [key: string]: string }): number | null {
      if (tags["stars"]) {
        const stars = parseInt(tags["stars"]);
        if (stars >= 5) return 4; // luxury
        if (stars === 4) return 3; // high
        if (stars === 3) return 2; // medium
        if (stars <= 2) return 1; // low
      }
      if (tags["price"] || tags["fee"]) {
        const val = (tags["price"] || tags["fee"]).toLowerCase();
        if (["yes", "$", "low", "1"].includes(val)) return 1;
        if (["$$", "medium", "2"].includes(val)) return 2;
        if (["$$$", "high", "3"].includes(val)) return 3;
        if (["$$$$", "luxury", "4"].includes(val)) return 4;
      }
      return null;
    }


    async function fetchWikimediaDescription(tags: { [key: string]: string }, name?: string, category?: string): Promise<string | null> {
      // Try 'name + Singapore' first, then 'name', do not use category
      if (name) {
        const searchVariants = [`${name} Singapore`, name];
        for (const searchQuery of searchVariants) {
          try {
            console.log(`[Wikipedia] Searching for: ${searchQuery}`);
            // Use MediaWiki search API for better fuzzy matching
            const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&srlimit=1&format=json&origin=*`;
            const searchResp = await axios.get(searchUrl, {
              timeout: 10000,
              headers: { 'User-Agent': 'smarttrip-bot/1.0 (contact: your@email.com)' }
            });
            const results = searchResp.data;
            if (results && results.query && results.query.search && results.query.search.length > 0) {
              const pageTitle = results.query.search[0].title;
              console.log(`[Wikipedia] Found page: ${pageTitle}`);
              // Resolve redirects and fetch summary for the found page
              const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;
              const summaryResp = await axios.get(summaryUrl, {
                timeout: 10000,
                headers: { 'User-Agent': 'smarttrip-bot/1.0 (contact: your@email.com)' }
              });
              if (summaryResp.data && summaryResp.data.extract) {
                console.log(`[Wikipedia] Summary: ${summaryResp.data.extract.substring(0, 120)}...`);
                return summaryResp.data.extract;
              } else {
                console.log(`[Wikipedia] No summary found for page: ${pageTitle}`);
              }
            } else {
              console.log(`[Wikipedia] No page found for: ${searchQuery}`);
            }
          } catch (e) {
            console.log(`[Wikipedia] Error searching for: ${searchQuery}`);
          }
        }
      }
      // Try Wikipedia tag if present (fallback)
      if (tags["wikipedia"]) {
        const [lang, ...titleParts] = tags["wikipedia"].split(":");
        const title = titleParts.join(":");
        if (lang && title) {
          try {
            const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
            const resp = await axios.get(url, { timeout: 10000 });
            if (resp.data && resp.data.extract) {
              return resp.data.extract;
            }
          } catch (e) {
            // ignore
          }
        }
      }
      // Try wikidata tag via Wikidata API (fallback)
      if (tags["wikidata"]) {
        try {
          const url = `https://www.wikidata.org/wiki/Special:EntityData/${tags["wikidata"]}.json`;
          const resp = await axios.get(url, { timeout: 10000 });
          const entity = resp.data.entities?.[tags["wikidata"]];
          // Prefer English description, fallback to label
          if (entity && entity.descriptions && entity.descriptions.en) {
            return entity.descriptions.en.value;
          }
          if (entity && entity.labels && entity.labels.en) {
            return entity.labels.en.value;
          }
        } catch (e) {
          // ignore
        }
      }
      return null;
    }

    async function mapImageUrl(tags: { [key: string]: string }): Promise<string | null> {
      if (tags["image"]) return tags["image"];
      if (tags["wikimedia_commons"]) {
        const filename = tags["wikimedia_commons"].replace(/ /g, "_");
        const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=600`;
        console.log(`[Image] Using wikimedia_commons for ${tags["name"]}: ${url}`);
        return url;
      }
      if (tags["name"]) {
        // Try a relaxed set of search variants: name + Singapore, name, name without special chars, first word, all lowercase
        const originalName = tags["name"];
        const variants = [
          `${originalName} Singapore`,
          originalName,
          originalName.replace(/[^\w\s]/g, ""),
          originalName.split(" ")[0],
          originalName.toLowerCase(),
        ];
        const tried = new Set();
        for (const searchQuery of variants) {
          if (!searchQuery || tried.has(searchQuery)) continue;
          tried.add(searchQuery);
          try {
            const imageUrl = await searchCommonsImage(searchQuery);
            if (imageUrl) {
              console.log(`[Image] Found Commons image for ${searchQuery}: ${imageUrl}`);
              // Be polite to the API
              await sleep(300);
              return imageUrl;
            } else {
              console.log(`[Image] No Commons image for ${searchQuery}`);
            }
          } catch (e) {
            console.log(`[Image] Error fetching Commons image for ${searchQuery}:`, e);
          }
        }
      }
      console.log(`[Image] No image found for ${tags["name"]}`);
      return null;
    }
    async function mapPlace(el: OsmElement): Promise<any> {
      const tags = el.tags || {};
      // Try OSM tags in order of preference
      let description =
        tags.description ||
        tags.short_description ||
        tags.note ||
        tags.about ||
        null;
      // Try Wikimedia if still missing
      if (!description) {
        description = await fetchWikimediaDescription(tags, tags.name, mapCategory(tags));
      }
      // Fallback: generate a simple description
      if (!description) {
        const cat = mapCategory(tags);
        if (tags.name && cat && cat !== "Other") {
          description = `A ${cat.toLowerCase()} called ${tags.name} in Singapore.`;
        } else if (tags.name) {
          description = `A place called ${tags.name} in Singapore.`;
        } else {
          description = `A place in Singapore.`;
        }
      }
      return {
        name: tags.name || null,
        description,
        category: mapCategory(tags),
        budgetlevel: mapBudgetLevel(tags), // now number|null
        imageurl: await mapImageUrl(tags),
      };
    }

    // Map all places with Wikimedia description fallback
    const mappedPlaces = [];
    for (const el of top50) {
      mappedPlaces.push(await mapPlace(el));
    }

    const newPlacesPath = path.join(process.cwd(), "data", "new-places.json");
    await fs.writeFile(newPlacesPath, JSON.stringify(mappedPlaces, null, 2), "utf-8");
    console.log(`Saved top ${mappedPlaces.length} unique-name popular places to ${newPlacesPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});