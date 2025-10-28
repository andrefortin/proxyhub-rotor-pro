import { Injectable } from '@nestjs/common';
import axios from 'axios';

const discord = process.env.DISCORD_WEBHOOK_URL || '';
const tgToken = process.env.TELEGRAM_BOT_TOKEN || '';
const tgChat = process.env.TELEGRAM_CHAT_ID || '';
const adminWebhook = process.env.ADMIN_GENERIC_WEBHOOK || '';

@Injectable()
export class NotifyService {
  async discord(content: string) { if (!discord) return; await axios.post(discord, { content }); }
  async telegram(text: string) { if (!tgToken || !tgChat) return; await axios.get(`https://api.telegram.org/bot${tgToken}/sendMessage`, { params: { chat_id: tgChat, text } }); }
  async http(event: string, payload: any) { if (!adminWebhook) return; await axios.post(adminWebhook, { event, payload, time: new Date().toISOString() }); }
  async broadcast(event: string, payload: any) {
    const text = `Event: ${event}\nPayload: ${JSON.stringify(payload).slice(0,1500)}`;
    await Promise.allSettled([ this.discord(text), this.telegram(text), this.http(event, payload) ]);
  }
}
