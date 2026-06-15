const API_URL = import.meta.env.VITE_API_URL;

export async function fetchLibraryHours() {
  const response = await fetch(`${API_URL}/library/hours`);

  if (!response.ok) {
    throw new Error(`Failed to fetch library hours: ${response.status}`);
  }

  return response.json();
}