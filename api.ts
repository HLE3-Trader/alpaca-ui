// Path B: UI talks ONLY to the secure Vercel proxy (no secrets in browser)
const API_BASE = import.meta.env.VITE_API_BASE || 'https://alpaca-proxy-flame.vercel.app/api';
interface ApiOptions extends RequestInit {
  params?: Record<string, string>;
}

async function apiRequest<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

  // Build URL with query parameters
  const url = new URL(endpoint, API_BASE);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

// No auth header in the browser (proxy handles auth server-side)
const headers = {
  'Content-Type': 'application/json',
  ...fetchOptions.headers,
};

  const response = await fetch(url.toString(), {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `API Error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// API methods
export const api = {
  // Account endpoint - fetches real account data
  getAccount: async () => {
    try {
      return await apiRequest<any>('/account');
    } catch (error) {
      throw error;
    }
  },
  // Positions endpoint - fetches real positions data
  getPositions: async () => {
    const data = await apiRequest<any>('/positions');
    return Array.isArray(data) ? { positions: data } : data;
  },

  // Risk endpoint - fetches real risk data
  getRisk: async () => {
    try {
      return await apiRequest<any>('/risk');
    } catch (error) {
      throw error;
    }
  },

  // Proposed trades endpoint
  getProposedTrades: async () => {
    try {
      return await apiRequest<any>('/proposed-trades');
    } catch (error) {
      throw error;
    }
  },

  // Approve a proposed trade
  approveProposal: async (data: { symbol: string; side: string; qty: number; est_price: number }) => {
    try {
      return await apiRequest<any>('/approve', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      throw error;
    }
  },

  // Orders endpoint
  getOrders: async () => {
    const data = await apiRequest<any>('/orders');
    return Array.isArray(data) ? { orders: data } : data;
  },

  // Orders with status filter
  getOrdersWithStatus: async (status: 'all' | 'open' | 'closed' = 'all') => {
    const data = await apiRequest<any>('/orders', { params: { status } });
    return Array.isArray(data) ? { orders: data } : data;
  },

  // Watch list endpoint
  getWatchList: async () => {
    try {
      return await apiRequest<any>('/watchlist');
    } catch (error) {
      throw error;
    }
  },
};
