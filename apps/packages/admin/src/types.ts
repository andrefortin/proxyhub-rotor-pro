export interface Provider {
  id: string;
  name: string;
  type: string;
  active: boolean;
  config: any;
  logoUrl?: string;
  createdAt: Date;
}

export interface Proxy {
  id: string;
  host: string;
  port: number;
  score: number;
  pool?: string;
  providerId?: string;
  country?: string;
  city?: string;
  // Add more fields as needed
}

export interface UsageData {
  date: string;
  responses: number;
}

export interface ResponseCodeData {
  name: string;
  value: number;
}