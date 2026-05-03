// Onboarding API
export async function postOnboarding(data: any, token?: string) {
  const res = await fetch("http://localhost:8000/onboarding", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

// Itinerary API
export async function postItinerary(data: any, token?: string) {
  const res = await fetch("http://localhost:8000/itinerary", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
    return res.json();

}

  // Places API
export async function getRecommendedPlaces(skip: number = 0, take: number = 10, token?: string) {
  const params = new URLSearchParams({ skip: skip.toString(), take: take.toString() });
  const res = await fetch(`http://localhost:8000/recommend?${params.toString()}`, {
    headers: {
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    },
  });
  return res.json();
}

// Search API
export async function postSearch(data: any, token?: string) {
  const res = await fetch("http://localhost:8000/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",   
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

// Users API
export async function postSignup(data: any) {
  const res = await fetch("http://localhost:8000/api/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  return { ok: res.ok, ...json };
}

export async function postLogin(data: { username: string; password: string }) {
  const params = new URLSearchParams();
  params.append("username", data.username);
  params.append("password", data.password);

  const res = await fetch("http://localhost:8000/api/auth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  return res.json();
}

