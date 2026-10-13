/**
 * src/services/tagService.ts
 *
 * Service für den Abruf aller verfügbaren Tags.
 * Kommuniziert mit dem Backend Endpunkt `/tags`.
 * Authentifizierung ist nicht erforderlich.
 */

class TagService {
    private apiUrl = import.meta.env.VITE_API_URL;

    /**
     * Liest den Response Body sicher als JSON aus.
     * Gibt ein leeres Objekt zurück wenn der Body leer ist,
     * und `{ message: text }` bei ungültigem JSON.
     *
     * @param response Der HTTP Response
     */
    private async parseJsonSafe(response: Response): Promise<any> {
        const text = await response.text();
        if (!text) return {};
        try {
            return JSON.parse(text);
        } catch {
            return { message: text };
        }
    }

    /**
     * Gibt alle im System vorhandenen Tags zurück.
     * Auth nicht erforderlich.
     * GET /tags
     *
     * @returns Array aller Tag Strings
     */
    async getTags(): Promise<string[]> {
        const response = await fetch(`${this.apiUrl}/tags`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            const error = await this.parseJsonSafe(response);
            throw new Error(error.message || 'Failed to fetch tags');
        }

        const data = await response.json();
        return data.tags;
    }
}

export const tagService = new TagService();
