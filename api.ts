// Path B: UI talks ONLY to the secure Vercel proxy (no secrets in browser)
const API_BASE =
  (import.meta.env.VITE_API_BASE || 'https://alpaca-proxy-flame.vercel.app/api') + '/';
interface ApiOptions extends RequestInit {
  params?: Record<string, string>;
}

async function apiRequest<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

  // Build URL with query parameters
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = new URL(cleanEndpoint, API_BASE);
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
    const raw = await apiRequest<any>('/positions');
    const positions = Array.isArray(raw) ? raw : (raw.positions ?? []);
  
    const normalized = positions.map((p: any) => {
      const qty = Number(p.qty ?? p.quantity ?? 0);
      const avgPrice = Number(p.avg_entry_price ?? p.avgPrice ?? 0);
      const currentPrice = Number(p.current_price ?? p.currentPrice ?? 0);
      const marketValue = Number(p.market_value ?? p.marketValue ?? (qty * currentPrice));
      const unrealizedPL = Number(p.unrealized_pl ?? p.unrealizedPL ?? 0);
      const unrealizedPLPercent = Number(p.unrealized_plpc ?? p.unrealizedPLPercent ?? 0) * 100;
  
      return {
        ...p,
        // Common UI-friendly aliases:
        quantity: qty,
        avgPrice,
        currentPrice,
        marketValue,
        unrealizedPL,
        unrealizedPLPercent,
        // Keep canonical Alpaca-ish fields too:
        qty: String(p.qty ?? qty),
        avg_entry_price: String(p.avg_entry_price ?? avgPrice),
        current_price: String(p.current_price ?? currentPrice),
        market_value: String(p.market_value ?? marketValue),
        unrealized_pl: String(p.unrealized_pl ?? unrealizedPL),
        unrealized_plpc: String(p.unrealized_plpc ?? (unrealizedPLPercent / 100)),
      };
    });
  
    return { positions: normalized };
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
