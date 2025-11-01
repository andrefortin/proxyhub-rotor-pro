import type { Provider, Proxy, UsageData } from "../types";

export type { Provider, Proxy };

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

interface PaginationResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

interface ApiError {
  message: string;
  status: number;
}


export interface CreateProxy {
  host: string;
  port: number;
  username?: string;
  password?: string;
  protocol?: string;
  pool?: string;
  providerId?: string;
  tags?: string[];
  meta?: any;
  disabled?: boolean;
}

export interface UpdateProxy {
  pool?: string;
  providerId?: string;
  tags?: string[];
  meta?: any;
  disabled?: boolean;
}

export interface Lease {
  leaseId: string;
  proxy: string; // http://user:pass@host:port
  protocol: string;
  expiresAt: string;
  meta: {
    providerId?: string;
    score: number;
    country?: string;
    sticky: boolean;
  };
}

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const fullUrl = `${API_BASE}${url}`;
  
  // Don't set Content-Type for FormData - let browser handle it
  const headers: Record<string, string> = {};
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  
  const response = await fetch(fullUrl, {
    headers: {
      ...headers,
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error: ApiError = await response
      .json()
      .catch(() => ({ message: "Network error", status: response.status }));
    throw new Error(`${error.status}: ${error.message}`);
  }

  return response.json();
}

export async function getProxies(
  params: {
    page?: number;
    limit?: number;
    pool?: string;
    providerId?: string;
    bbox?: string; // minLon,minLat,maxLon,maxLat
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<PaginationResponse<Proxy>> {
  const query = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
    ...(params.pool && { pool: params.pool }),
    ...(params.providerId && { providerId: params.providerId }),
    ...(params.bbox && { bbox: params.bbox }),
    ...(params.search && { search: params.search }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.sortOrder && { sortOrder: params.sortOrder }),
  });
  return apiRequest(`/v1/proxies?${query}`);
}

export async function getProviders(
  params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}
): Promise<PaginationResponse<Provider>> {
  const query = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
    ...(params.search && { search: params.search }),
  });
  return apiRequest(`/v1/providers?${query}`);
}

export async function createProvider(
  provider: Omit<Provider, "id" | "createdAt">
): Promise<Provider> {
  return apiRequest("/v1/provider", {
    method: "POST",
    body: JSON.stringify(provider),
  });
}

export async function getProvider(id: string): Promise<Provider> {
  return apiRequest(`/v1/provider/${id}`, {
    method: "GET",
  });
}

export async function updateProvider(
  id: string,
  provider: Partial<Provider>
): Promise<Provider> {
  return apiRequest(`/v1/provider/${id}`, {
    method: "PATCH",
    body: JSON.stringify(provider),
  });
}

export async function deleteProvider(id: string): Promise<void> {
  await apiRequest(`/v1/provider/${id}`, {
    method: "DELETE",
  });
}

export async function getProxiesCount(): Promise<{ count: number }> {
  return apiRequest("/v1/proxies/count");
}

export async function getProxiesStats(): Promise<{ avgScore: number }> {
  return apiRequest("/v1/proxies/stats");
}

export async function getPoolsStats(): Promise<{ total: number }> {
  return apiRequest("/v1/pools/stats");
}

export async function getUsageSummary(): Promise<{ total: number }> {
  return apiRequest("/v1/usage/summary");
}

export async function getUsageStats(): Promise<UsageData[]> {
  return apiRequest("/v1/usage/stats");
}

export async function createProxy(proxy: CreateProxy): Promise<Proxy> {
  return apiRequest("/v1/proxy", {
    method: "POST",
    body: JSON.stringify(proxy),
  });
}

export async function getProxy(id: string): Promise<Proxy> {
  return apiRequest(`/v1/proxy/${id}`, {
    method: "GET",
  });
}

export async function updateProxy(
  id: string,
  proxy: UpdateProxy
): Promise<Proxy> {
  return apiRequest(`/v1/proxy/${id}`, {
    method: "PATCH",
    body: JSON.stringify(proxy),
  });
}

export async function deleteProxy(id: string): Promise<void> {
  await apiRequest(`/v1/proxy/${id}`, {
    method: "DELETE",
  });
}

export async function testProxy(id: string): Promise<{
  success: boolean;
  httpStatus?: number;
  latencyMs?: number;
  error?: string;
  body?: string;
  host?: string;
  port?: number;
  testUrl?: string;
}> {
  return apiRequest(`/v1/proxy/${id}/test`, {
    method: "GET",
  });
}

export async function issueLease(params: {
  project: string;
  pool?: string;
  sticky?: boolean;
  country?: string;
  proxy?: Proxy;
}): Promise<Lease | { error: string }> {
  const query = new URLSearchParams({
    project: params.project,
    ...(params.pool && { pool: params.pool }),
    ...(params.sticky !== undefined && { sticky: params.sticky.toString() }),
    ...(params.country && { country: params.country }),
  });
  return apiRequest(`/v1/proxy?${query}`);
}

export async function importProxies(params: {
  proxies: any[];
  pool?: string;
  providerId?: string;
}): Promise<{ imported: number; skipped: number }> {
  const formData = new FormData();
  if (params.pool) formData.append('pool', params.pool);
  if (params.providerId) formData.append('providerId', params.providerId);
  formData.append('proxies', JSON.stringify(params.proxies));

  return apiRequest('/v1/proxies/import', {
    method: 'POST',
    body: formData,
  });
}

// Add more as needed for other endpoints
