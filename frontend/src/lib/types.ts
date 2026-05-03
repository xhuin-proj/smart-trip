export type Place = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  budgetlevel: number | null;
  imageurl: string | null;
};

export type Budget = 'low' | 'medium' | 'high';
export type Interest = 'food' | 'nature' | 'shopping' | 'culture' | 'nightlife';
export type Pace = 'relaxed' | 'balanced' | 'packed';
export type TravelStyle = 'solo' | 'couple' | 'family' | 'friends';

type ItineraryPlace = {
	name: string;
	description: string;
	image: string;
};

export type ItineraryCardProps = {
	time: string;
	places: ItineraryPlace[];
};

export type SearchResult = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  image_url: string | null;
  budget_level: number | null;
  distance: number;
};