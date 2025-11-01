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
  username?: string;
  password?: string;
  protocol?: string;
  pool?: string;
  providerId?: string;
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  asn?: string;
  org?: string;
  lastChecked?: string;
  failedCount: number;
  score: number;
  tags?: string[];
  meta?: any;
  disabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsageData {
  date: string;
  responses: number;
}

export interface ResponseCodeData {
  name: string;
  value: number;
}