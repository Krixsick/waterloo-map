const API_URL = import.meta.env.VITE_API_URL;

export async function fetchCampusFood() {
  const response = await fetch(`${API_URL}/food/campus`);

  if (!response.ok) {
    throw new Error(`Failed to fetch food data: ${response.status}`);
  }

  return response.json();
}