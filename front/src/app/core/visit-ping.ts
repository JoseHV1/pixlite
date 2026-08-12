import { API_BASE_URL } from './api-config';

/**
 * Fire-and-forget visit ping, relayed server-side to Discord — see
 * DiscordErrorHandler for the sibling pattern this follows. Runs once per
 * page load.
 */
export function sendVisitPing(): void {
  fetch(`${API_BASE_URL}/visit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      site: 'pixlite',
      url: window.location.href,
    }),
  }).catch(() => {});
}
