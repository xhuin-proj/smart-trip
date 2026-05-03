"""
Rule-based intent parser.

Extracts structured intent signals from a natural-language query:
  - categories / subcategories to filter on
  - budget level (1 cheap, 2 mid, 3 expensive)
  - whether the user wants outdoor / indoor places
"""

import re
from dataclasses import dataclass, field

# ---------------------------------------------------------------------------
# Keyword maps
# ---------------------------------------------------------------------------


# Map keywords directly to DB categories
KEYWORD_TO_CATEGORY: dict[str, str] = {
    # Food & Drink
    "restaurant": "restaurant",
    "restaurants": "restaurant",
    "eatery": "restaurant",
    "eateries": "restaurant",
    "dining": "restaurant",
    "diner": "restaurant",
    "diners": "restaurant",
    "dinner": "restaurant",
    "lunch": "restaurant",
    "breakfast": "restaurant",
    "brunch": "restaurant",
    "bistro": "restaurant",
    "bistros": "restaurant",
    "brasserie": "restaurant",
    "supper": "restaurant",
    "tze char": "restaurant",
    "zi char": "restaurant",
    "hawker": "food_court",
    "hawker centre": "food_court",
    "hawker center": "food_court",
    "hawker stall": "food_court",
    "food court": "food_court",
    "food centre": "food_court",
    "food center": "food_court",
    "food stall": "food_court",
    "food stalls": "food_court",
    "kopitiam": "cafe",
    "cafe": "cafe",
    "cafes": "cafe",
    "café": "cafe",
    "cafés": "cafe",
    "coffee": "cafe",
    "coffee shop": "cafe",
    "coffee shops": "cafe",
    "tea house": "cafe",
    "teahouse": "cafe",
    "bakery": "cafe",
    "bakeries": "cafe",
    "patisserie": "cafe",
    "dessert shop": "cafe",
    "bubble tea": "cafe",
    "fast food": "fast_food",
    "fast-food": "fast_food",
    "takeaway": "fast_food",
    "takeout": "fast_food",
    "burger": "fast_food",
    "burgers": "fast_food",
    "pizza": "fast_food",
    "fried chicken": "fast_food",
    "drive-through": "fast_food",
    "drive through": "fast_food",
    "food chain": "fast_food",
    "bar": "bar",
    "bars": "bar",
    "wine bar": "bar",
    "cocktail bar": "bar",
    "rooftop bar": "bar",
    "taproom": "bar",
    "brewery": "bar",
    "breweries": "bar",
    "lounge": "bar",
    "pub": "pub",
    "pubs": "pub",
    "gastropub": "pub",
    "nightclub": "nightclub",
    "nightclubs": "nightclub",
    "club": "nightclub",
    "clubs": "nightclub",
    "nightlife": "nightclub",
    "disco": "nightclub",
    # Museums & Attractions
    "museum": "museum",
    "museums": "museum",
    "heritage": "museum",
    "heritage site": "museum",
    "historical site": "museum",
    "history": "museum",
    "exhibition": "museum",
    "exhibit": "museum",
    "gallery": "gallery",
    "galleries": "gallery",
    "art gallery": "gallery",
    "art museum": "gallery",
    "artwork": "artwork",
    "artworks": "artwork",
    "sculpture": "artwork",
    "sculptures": "artwork",
    "mural": "artwork",
    "murals": "artwork",
    "installation": "artwork",
    "public art": "artwork",
    "statue": "artwork",
    "statues": "artwork",
    "monument": "attraction",
    "monuments": "attraction",
    "memorial": "attraction",
    "memorials": "attraction",
    "landmark": "attraction",
    "landmarks": "attraction",
    "attraction": "attraction",
    "attractions": "attraction",
    "sightseeing": "attraction",
    "tourist spot": "attraction",
    "tourist spots": "attraction",
    "zoo": "attraction",
    "zoos": "attraction",
    "aquarium": "attraction",
    "aquariums": "attraction",
    "theme park": "attraction",
    "theme parks": "attraction",
    "amusement park": "attraction",
    "water park": "attraction",
    "wildlife park": "attraction",
    "bird park": "attraction",
    "safari": "attraction",
    "viewpoint": "viewpoint",
    "viewpoints": "viewpoint",
    "lookout": "viewpoint",
    "observation deck": "viewpoint",
    "scenic point": "viewpoint",
    "panorama": "viewpoint",
    "skyline": "viewpoint",
    # Arts & Entertainment
    "cinema": "cinema",
    "cinemas": "cinema",
    "movie": "cinema",
    "movies": "cinema",
    "film": "cinema",
    "theatre": "theatre",
    "theater": "theatre",
    "theatres": "theatre",
    "theaters": "theatre",
    "performance": "theatre",
    "concert hall": "theatre",
    "playhouse": "theatre",
    "arts centre": "arts_centre",
    "arts center": "arts_centre",
    "arts hub": "arts_centre",
    "cultural centre": "arts_centre",
    "cultural center": "arts_centre",
    "performing arts": "arts_centre",
    "casino": "casino",
    "casinos": "casino",
    "gaming": "casino",
    "fountain": "fountain",
    "fountains": "fountain",
    "water feature": "fountain",
    # Sports & Fitness
    "sports centre": "sports_centre",
    "sports center": "sports_centre",
    "sports complex": "sports_centre",
    "sports hall": "sports_centre",
    "stadium": "sports_centre",
    "gym": "sports_centre",
    "fitness": "sports_centre",
    "fitness centre": "sports_centre",
    "fitness center": "sports_centre",
    "swimming pool": "sports_centre",
    "swimming": "sports_centre",
    "pool": "sports_centre",
    "bowling": "sports_centre",
    "bowling alley": "sports_centre",
    "ice rink": "sports_centre",
    "skating": "sports_centre",
    "rock climbing": "sports_centre",
    "climbing": "sports_centre",
    "golf": "sports_centre",
    "driving range": "sports_centre",
    "tennis": "sports_centre",
    "badminton": "sports_centre",
    # Community & Recreation
    "community centre": "community_centre",
    "community center": "community_centre",
    "recreation centre": "community_centre",
    "recreation center": "community_centre",
    "cc": "community_centre",
    "playground": "playground",
    "playgrounds": "playground",
    "play area": "playground",
    "play ground": "playground",
    "kids play": "playground",
    "children play": "playground",
    "park": "playground",
    "parks": "playground",
}


BUDGET_CHEAP_KEYWORDS = [
    "cheap",
    "budget",
    "affordable",
    "inexpensive",
    "free",
    "low cost",
    "hawker",
    "kopitiam",
]
BUDGET_EXPENSIVE_KEYWORDS = [
    "luxury",
    "fine dining",
    "upscale",
    "expensive",
    "high-end",
    "premium",
    "michelin",
    "rooftop",
]

OUTDOOR_KEYWORDS = [
    "outdoor",
    "outside",
    "open air",
    "fresh air",
    "nature",
    "park",
    "beach",
]
INDOOR_KEYWORDS = ["indoor", "inside", "air-conditioned", "air conditioned", "covered"]


# ---------------------------------------------------------------------------
# Result dataclass
# ---------------------------------------------------------------------------


@dataclass
class ParsedIntent:
    categories: list[str] = field(default_factory=list)
    subcategories: list[str] = field(default_factory=list)
    budget_level: int | None = (
        None  # 1 = cheap, 2 = mid, 3 = expensive 4 = very expensive
    )
    outdoor: bool | None = None  # True = outdoor, False = indoor, None = no preference


# ---------------------------------------------------------------------------
# Parser
# ---------------------------------------------------------------------------


def parse_intent(query: str) -> ParsedIntent:
    """Return a ParsedIntent extracted from *query* using keyword rules."""
    q = query.lower()
    intent = ParsedIntent()

    # --- categories ---
    found_categories = set()
    for keyword, db_category in KEYWORD_TO_CATEGORY.items():
        if _match(q, keyword):
            found_categories.add(db_category)
    intent.categories = list(found_categories)

    # --- budget ---
    if any(_match(q, kw) for kw in BUDGET_CHEAP_KEYWORDS):
        intent.budget_level = 1
    elif any(_match(q, kw) for kw in BUDGET_EXPENSIVE_KEYWORDS):
        intent.budget_level = 3

    # --- outdoor / indoor ---
    is_outdoor = any(_match(q, kw) for kw in OUTDOOR_KEYWORDS)
    is_indoor = any(_match(q, kw) for kw in INDOOR_KEYWORDS)
    if is_outdoor and not is_indoor:
        intent.outdoor = True
    elif is_indoor and not is_outdoor:
        intent.outdoor = False

    return intent


def _match(text: str, keyword: str) -> bool:
    """Whole-word (or whole-phrase) case-insensitive match."""
    pattern = r"(?<!\w)" + re.escape(keyword) + r"(?!\w)"
    return bool(re.search(pattern, text))
