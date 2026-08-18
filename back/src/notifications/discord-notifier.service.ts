import { Injectable, Logger } from '@nestjs/common';

interface DiscordErrorReport {
  message: string;
  url?: string;
  method?: string;
  statusCode?: number;
  stack?: string;
  source?: 'backend' | 'frontend';
}

interface DiscordVisitReport {
  site: string;
  url?: string;
  referer?: string;
}

const SITE_DISPLAY_NAMES: Record<string, string> = {
  pixlite: 'PixLite',
  markconverted: 'MarkConvert',
  portfolio: 'Portfolio',
};

@Injectable()
export class DiscordNotifierService {
  private readonly logger = new Logger(DiscordNotifierService.name);
  private readonly webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  private readonly timeoutMs = 5000;

  isConfigured(): boolean {
    return Boolean(this.webhookUrl);
  }

  /**
   * Best-effort report to Discord — never throws. A Discord outage or a
   * misconfigured webhook must never break the actual request being handled.
   */
  async notifyError(report: DiscordErrorReport): Promise<void> {
    if (!this.webhookUrl) return;

    const fields = [
      { name: 'Error', value: truncate(report.message, 1024), inline: false },
      { name: 'URL', value: truncate(report.url ?? 'N/D', 1024), inline: false },
      { name: 'Método', value: report.method ?? 'N/D', inline: true },
      { name: 'Status', value: String(report.statusCode ?? 'N/D'), inline: true },
      { name: 'Origen', value: report.source ?? 'backend', inline: true },
      { name: 'Fecha y hora', value: `${new Date().toISOString()}`, inline: true },
    ];

    if (report.stack) {
      fields.push({ name: 'Stack', value: '```' + truncate(report.stack, 1000) + '```', inline: false });
    }

    await this.post({
      username: 'Pixlite',
      embeds: [{ title: '🚨 Error no controlado — Pixlite', color: 0xe74c3c, fields }],
    });
  }

  /**
   * Best-effort visit ping — same never-throws contract as notifyError.
   * `report.site` distinguishes which property triggered it (pixlite,
   * markconverted, portfolio, ...) since this same backend relays visits
   * for the whole personal-projects group.
   */
  async notifyVisit(report: DiscordVisitReport): Promise<void> {
    if (!this.webhookUrl) return;

    const fields = [
      { name: 'Sitio', value: report.site, inline: true },
      { name: 'Fecha y hora', value: `${new Date().toISOString()}`, inline: true },
      { name: 'URL', value: truncate(report.url ?? 'N/D', 1024), inline: false },
      { name: 'Referer', value: truncate(report.referer || 'directo', 1024), inline: false },
    ];

    await this.post({
      username: SITE_DISPLAY_NAMES[report.site] ?? report.site,
      embeds: [{ title: `👀 Visita — ${report.site}`, color: 0x2ecc71, fields }],
    });
  }

  private async post(body: unknown): Promise<void> {
    if (!this.webhookUrl) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      this.logger.warn(`No se pudo enviar la notificación a Discord: ${(err as Error).message}`);
    } finally {
      clearTimeout(timeout);
    }
  }
}

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}
