/**
 * src/services/authService.ts
 *
 * Service für alle Authentifizierungs und nutzerbezogenen API Aufrufe,
 * die keinen Pinia Store benötigen (z. B. Login, Registrierung).
 * Wird vom `authStore` genutzt und enthält keine reaktiven Abhängigkeiten.
 */

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Extrahiert eine lesbare Fehlermeldung aus einer API Fehlerantwort.
 * Unterstützt das RealWorld Fehlerformat `{ errors: { body: string[] } }`
 * sowie einfache String-Antworten und Zod Issue-Arrays.
 *
 * @param data Geparste JSON Antwort des Backends
 * @returns Lesbare Fehlermeldung als String
 */
function extractErrorMessage(data: any): string {
  let source = data?.message ?? data?.issues ?? data?.errors ?? data;

  if (typeof source === 'string') {
    try {
      const parsed = JSON.parse(source);
      source = parsed;
    } catch { }
  }

  if (source && typeof source === 'object' && Array.isArray(source.body)) {
    return source.body.join(', ');
  }

  if (source && typeof source === 'object' && typeof source.body === 'string') {
    return source.body;
  }

  if (Array.isArray(source) && source.length > 0 && source[0]?.message) {
    return source.map((issue: any) => issue.message).join(', ');
  }

  if (typeof source === 'string') return source;

  return 'Request failed';
}

/**
 * Sendet einen nicht authentifizierten POST Request an die API.
 * Wirft einen Fehler mit lesbarer Meldung, wenn der Response nicht OK ist.
 *
 * @param url Relativer API-Pfad (z. B. `/users/login`)
 * @param body Request Body als Objekt
 * @returns Geparste JSON Antwort
 */
async function request(url: string, body: object) {
  const response = await fetch(`${API_URL}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  let data: any = {};

  try {
    data = await response.json();
  } catch { }

  if (!response.ok) {
    throw new Error(extractErrorMessage(data));
  }

  return data;
}

/**
 * Sendet einen authentifizierten Request an die API.
 * Das JWT Token wird im `Authorization: Token` Header übermittelt.
 * Wirft einen Fehler mit lesbarer Meldung, wenn der Response nicht OK ist.
 *
 * @param url Relativer API-Pfad (z. B. `/user`)
 * @param token JWT Token des eingeloggten Nutzers
 * @param method HTTP Methode (Standard: `GET`)
 * @param body Optionaler Request Body als Objekt
 * @returns Geparste JSON Antwort
 */
async function authorizedRequest(
  url: string,
  token: string,
  method: string = 'GET',
  body?: object,
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Token ${token}`,
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${url}`, options);

  let data: any = {};

  try {
    data = await response.json();
  } catch { }

  if (!response.ok) {
    throw new Error(extractErrorMessage(data));
  }

  return data;
}

export const authService = {
  /**
   * Registriert einen neuen Nutzer.
   * POST /users, Body: { user: { email, username, password } }
   */
  register(email: string, username: string, password: string) {
    return request('/users', { user: { email, username, password } });
  },

  /**
   * Meldet einen Nutzer an und gibt Token sowie Nutzerdaten zurück.
   * POST /users/login, Body: { user: { email, password } }
   */
  login(email: string, password: string) {
    return request('/users/login', { user: { email, password } });
  },

  /**
   * Gibt die aktuellen Nutzerdaten des eingeloggten Nutzers zurück.
   * GET /user, Auth erforderlich
   *
   * @param token JWT Token des eingeloggten Nutzers
   */
  getMe(token: string) {
    return authorizedRequest('/user', token, 'GET');
  },

  /**
   * Lädt ein Profilbild als Base64 String hoch.
   * POST /users/profile-image, Auth erforderlich
   *
   * @param base64Data Base64 kodiertes Bild inklusive Data URL-Präfix
   * @param token JWT Token des eingeloggten Nutzers
   */
  uploadProfileImage(base64Data: string, token: string) {
    return authorizedRequest('/users/profile-image', token, 'POST', {
      imageData: base64Data,
    });
  },

  /**
   * Gibt das Profil des eingeloggten Nutzers zurück.
   * GET /user, Auth erforderlich
   *
   * @param token JWT Token des eingeloggten Nutzers
   */
  getProfile(token: string) {
    return authorizedRequest('/user', token, 'GET');
  },
};
