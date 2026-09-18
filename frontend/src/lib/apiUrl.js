const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

export const API_SERVER_URL = configuredApiUrl
  || (import.meta.env.DEV ? "http://localhost:3000" : "");

if (!API_SERVER_URL) {
  throw new Error("VITE_API_URL is not configured");
}

export const API_BASE_URL = `${API_SERVER_URL}/api`;
