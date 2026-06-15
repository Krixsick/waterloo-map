const API_URL = import.meta.env.VITE_API_URL;

export async function fetchGymInfo() {
  const response = await fetch(`${API_URL}/gym`);

  if (!response.ok) {
    throw new Error(`Failed to fetch gym info: ${response.status}`);
  }

  return response.json();
}