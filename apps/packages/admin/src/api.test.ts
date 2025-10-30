import { describe, it, expect, vi } from 'vitest';
import { apiRequest, getProxies, getProviders, createProvider, getUsageStats } from './lib/api';
import type { Provider, Proxy, UsageData } from './types';

// Mock fetch
global.fetch = vi.fn() as any;

describe('API Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('apiRequest', () => {
    it('should make a successful GET request', async () => {
      const mockResponse = { items: [], total: 0 };
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiRequest('/v1/test');
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8080/v1/test', expect.objectContaining({
        headers: { 'Content-Type': 'application/json' },
      }));
      expect(result).toEqual(mockResponse);
    });

    it('should throw error on non-ok response', async () => {
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Bad Request', status: 400 }),
      });

      await expect(apiRequest('/v1/test')).rejects.toThrow('400: Bad Request');
    });
  });

  describe('getProxies', () => {
    it('should fetch proxies with default params', async () => {
      const mockResponse = { items: [{ id: '1', host: 'test' } as Proxy], total: 1, page: 1, limit: 10 };
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getProxies();
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/v1/proxies?page=1&limit=10'));
      expect(result).toEqual(mockResponse);
    });

    it('should include filters in query', async () => {
      await getProxies({ page: 2, limit: 20, pool: 'linkedin', providerId: 'prov1', bbox: '0,0,10,10' });
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/v1/proxies?page=2&limit=20&pool=linkedin&providerId=prov1&bbox=0,0,10,10'));
    });
  });

  describe('getProviders', () => {
    it('should fetch providers with search', async () => {
      const mockResponse = { items: [{ id: '1', name: 'test' } as Provider], total: 1, page: 1, limit: 10 };
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getProviders({ page: 1, limit: 10, search: 'IPRoyal' });
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/v1/providers?page=1&limit=10&search=IPRoyal'));
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createProvider', () => {
    it('should create provider with POST', async () => {
      const mockProvider = { name: 'test', type: 'api', config: {} };
      const mockResponse = { id: 'new', ...mockProvider };
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await createProvider(mockProvider);
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/v1/providers'), expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(mockProvider),
      }));
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getUsageStats', () => {
    it('should fetch usage stats', async () => {
      const mockData: UsageData[] = [{ date: '2025-10-01', responses: 100 }];
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await getUsageStats();
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/v1/usage/stats'));
      expect(result).toEqual(mockData);
    });
  });

  // Add more tests for updateProvider, deleteProvider, etc.
});