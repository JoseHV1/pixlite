import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Minimal .env loader — avoids pulling in the `dotenv` package for a single
 * variable. Never overrides a variable already set in the real environment
 * (Docker/Compose/host), same precedence dotenv itself uses.
 */
const envPath = join(process.cwd(), '.env');

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed
      .slice(eqIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '');

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
