const TOKEN_KEY = "smartbridge_auth_token";
const USER_KEY = "smartbridge_user_info";

export function saveSession(token: string, user: any) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getSessionToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getSessionUser(): any | null {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

// Global fetch helper that automatically attaches safety Bearer headers
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getSessionToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  // Set JSON content-type if not files upload
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}
