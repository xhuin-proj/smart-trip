export function mapCategory(tags: Record<string, string>): {
  category: string;
  subcategory: string | null;
} {
  if (tags.tourism === "museum") return { category: "museum", subcategory: "museum" };
  if (tags.amenity === "cafe") return { category: "food", subcategory: "cafe" };
  if (tags.amenity === "restaurant") return { category: "food", subcategory: "restaurant" };
  if (tags.amenity === "bar") return { category: "nightlife", subcategory: "bar" };
  if (tags.leisure === "park" || tags.leisure === "garden") {
    return { category: "nature", subcategory: tags.leisure };
  }
  if (tags.shop) return { category: "shopping", subcategory: tags.shop };
  if (tags.tourism) return { category: "attraction", subcategory: tags.tourism };

  return { category: "other", subcategory: null };
}