/**
 * React Query hooks for all data entities
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../data/api';

// ── Query key factories ──
export const queryKeys = {
  banks: {
    all: ['banks'],
    detail: (key) => ['banks', key],
    qualification: (key) => ['banks', key, 'qualification'],
    cx: (key) => ['banks', key, 'cx'],
    competition: (key) => ['banks', key, 'competition'],
    valueSelling: (key) => ['banks', key, 'value-selling'],
    sources: (key) => ['banks', key, 'sources'],
    relationship: (key) => ['banks', key, 'relationship'],
    aiAnalyses: (key) => ['banks', key, 'ai-analyses'],
    landingZones: (key) => ['banks', key, 'landing-zones'],
    discoveryStoryline: (key) => ['banks', key, 'discovery-storyline'],
  },
  markets: {
    all: ['markets'],
    detail: (key) => ['markets', key],
    banks: (key) => ['markets', key, 'banks'],
  },
  countries: {
    all: ['countries'],
    detail: (name) => ['countries', name],
    banks: (name) => ['countries', name, 'banks'],
  },
  stats: ['stats'],
  search: (q) => ['search', q],
};

// ── Bank hooks ──
export function useBanks() {
  return useQuery({
    queryKey: queryKeys.banks.all,
    queryFn: api.fetchBanks,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBank(key) {
  return useQuery({
    queryKey: queryKeys.banks.detail(key),
    queryFn: () => api.fetchBank(key),
    enabled: !!key,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAiAnalysis(key) {
  return useQuery({
    queryKey: queryKeys.banks.aiAnalyses(key),
    queryFn: () => api.fetchBankAiAnalyses(key),
    enabled: !!key,
    staleTime: 10 * 60 * 1000,  // 10 min — AI analysis doesn't change often
    retry: false,                // Don't retry if no analyses exist yet
  });
}

export function useLandingZoneMatrix(key) {
  return useQuery({
    queryKey: queryKeys.banks.landingZones(key),
    queryFn: () => api.fetchLandingZoneMatrix(key),
    enabled: !!key,
    staleTime: 30 * 60 * 1000,  // 30 min — heavy analysis, cache longer
    retry: false,
  });
}

export function useDiscoveryStoryline(key) {
  return useQuery({
    queryKey: queryKeys.banks.discoveryStoryline(key),
    queryFn: () => api.fetchDiscoveryStoryline(key),
    enabled: !!key,
    staleTime: 30 * 60 * 1000,  // 30 min — storyline is expensive to generate
    retry: false,
  });
}

// ── Mutation hooks ──
export function useCreateBank() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createBank,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.banks.all });
      qc.invalidateQueries({ queryKey: queryKeys.stats });
    },
  });
}

export function useUpdateBank(key) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.updateBank(key, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.banks.detail(key) });
      qc.invalidateQueries({ queryKey: queryKeys.banks.all });
    },
  });
}

export function useDeleteBank(key) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.deleteBank(key),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.banks.all });
      qc.invalidateQueries({ queryKey: queryKeys.stats });
    },
  });
}

// ── Market hooks ──
export function useMarkets() {
  return useQuery({
    queryKey: queryKeys.markets.all,
    queryFn: api.fetchMarkets,
    staleTime: 10 * 60 * 1000,
  });
}

export function useMarket(key) {
  return useQuery({
    queryKey: queryKeys.markets.detail(key),
    queryFn: () => api.fetchMarket(key),
    enabled: !!key,
    staleTime: 10 * 60 * 1000,
  });
}

export function useMarketBanks(key) {
  return useQuery({
    queryKey: queryKeys.markets.banks(key),
    queryFn: () => api.fetchMarketBanks(key),
    enabled: !!key,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Country hooks ──
export function useCountries() {
  return useQuery({
    queryKey: queryKeys.countries.all,
    queryFn: api.fetchCountries,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCountry(name) {
  return useQuery({
    queryKey: queryKeys.countries.detail(name),
    queryFn: () => api.fetchCountry(name),
    enabled: !!name,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCountryBanks(name) {
  return useQuery({
    queryKey: queryKeys.countries.banks(name),
    queryFn: () => api.fetchCountryBanks(name),
    enabled: !!name,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Stats & Signals ──
export function useStats() {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: api.fetchStats,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSignals(limit = 8) {
  return useQuery({
    queryKey: ['signals', limit],
    queryFn: () => api.fetchSignals(limit),
    staleTime: 2 * 60 * 1000,
  });
}

// ── Search ──
export function useSearchQuery(query) {
  return useQuery({
    queryKey: queryKeys.search(query),
    queryFn: () => api.searchAll(query),
    enabled: query?.length >= 2,
    staleTime: 30 * 1000,
  });
}
