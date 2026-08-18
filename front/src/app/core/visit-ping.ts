import { API_BASE_URL } from './api-config';

/**
 * Fire-and-forget visit ping, relayed server-side to Discord — see
 * DiscordErrorHandler for the sibling pattern this follows. Runs once per
 * page load.
 */
function isRealDomain(): boolean {
  const host = window.location.hostname;
  return host === 'jose-hernandez.dev' || host.endsWith('.jose-hernandez.dev');
}

export function sendVisitPing(): void {
  if (!isRealDomain()) return;

  fetch(`${API_BASE_URL}/visit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      site: 'pixlite',
      url: window.location.href,
    }),
  }).catch(() => {});
}
