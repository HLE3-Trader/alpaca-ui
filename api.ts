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
    const list = Array.isArray(raw) ? raw : (raw.positions ?? []);
  
    const positions = list.map((p: any, i: number) => {
      const quantity = Number(p.quantity ?? p.qty ?? 0);
  
      const avgPrice = Number(
        p.avgPrice ??
        p.avg_price ??
        p.avg_entry_price ?? // Alpaca
        0
      );
  
      const currentPrice = Number(
        p.currentPrice ??
        p.current_price ?? // Alpaca
        0
      );
  
      const marketValue = Number(
        p.marketValue ??
        p.market_value ?? // Alpaca
        (quantity * currentPrice) ??
        0
      );
  
      const unrealizedPL = Number(
        p.unrealizedPL ??
        p.unrealized_pl ?? // Alpaca
        0
      );
  
      const unrealizedPLPercent =
        p.unrealizedPLPercent != null
          ? Number(p.unrealizedPLPercent)
          : p.unrealized_pl_percent != null
            ? Number(p.unrealized_pl_percent)
            : p.unrealized_plpc != null // Alpaca (decimal, e.g. -0.005 => -0.5%)
              ? Number(p.unrealized_plpc) * 100
              : avgPrice && quantity
                ? (unrealizedPL / (avgPrice * quantity)) * 100
                : 0;
  
      return {
        id: p.id ?? p.asset_id ?? `pos-${i}`,
        symbol: p.symbol ?? "",
        name: p.name ?? p.symbol ?? "",
        quantity,
        avgPrice,
        currentPrice,
        marketValue,
        unrealizedPL,
        unrealizedPLPercent,
      };
    });
  
    return { positions };
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

  getOrders: async () => {
    const raw = await apiRequest<any>('/orders');
    const list = Array.isArray(raw) ? raw : (raw.orders ?? []);
  
    const orders = list.map((o: any) => {
      const quantity = Number(o.quantity ?? o.qty ?? 0);
      const filled = Number(o.filled ?? o.filled_qty ?? 0);
  
      const type = String(o.type ?? o.order_type ?? '').toUpperCase();
      const side = String(o.side ?? '').toUpperCase();
  
      const rawStatus = String(o.status ?? '').toUpperCase();
  
      // Normalize Alpaca statuses → UI statuses
      const openLike = new Set(['NEW', 'ACCEPTED', 'PENDING_NEW', 'PARTIALLY_FILLED']);
      const status = openLike.has(rawStatus) ? 'OPEN' : rawStatus;
  
      const timestamp =
        o.filled_at ??
        o.submitted_at ??
        o.created_at ??
        new Date().toISOString();
  
      return {
        id: String(o.id),
        symbol: String(o.symbol),
        type: type || '—',
        side: side || '—',
        quantity,
        limitPrice: o.limit_price != null ? Number(o.limit_price) : undefined,
        stopPrice: o.stop_price != null ? Number(o.stop_price) : undefined,
        avgFillPrice: o.filled_avg_price != null ? Number(o.filled_avg_price) : undefined,
        status,
        filled,
        timestamp: String(timestamp),
      };
    });
  
    return { orders };
  },
  
  getOrdersWithStatus: async (statusFilter: 'all' | 'open' | 'closed' = 'all') => {
    const raw = await apiRequest<any>('/orders', { params: { status: statusFilter } });
    const list = Array.isArray(raw) ? raw : (raw.orders ?? []);
  
    const orders = list.map((o: any) => {
      const quantity = Number(o.quantity ?? o.qty ?? 0);
      const filled = Number(o.filled ?? o.filled_qty ?? 0);
  
      const type = String(o.type ?? o.order_type ?? '').toUpperCase();
      const side = String(o.side ?? '').toUpperCase();
  
      const rawStatus = String(o.status ?? '').toUpperCase();
      const openLike = new Set(['NEW', 'ACCEPTED', 'PENDING_NEW', 'PARTIALLY_FILLED']);
      const status = openLike.has(rawStatus) ? 'OPEN' : rawStatus;
  
      const timestamp =
        o.filled_at ??
        o.submitted_at ??
        o.created_at ??
        new Date().toISOString();
  
      return {
        id: String(o.id),
        symbol: String(o.symbol),
        type: type || '—',
        side: side || '—',
        quantity,
        limitPrice: o.limit_price != null ? Number(o.limit_price) : undefined,
        stopPrice: o.stop_price != null ? Number(o.stop_price) : undefined,
        avgFillPrice: o.filled_avg_price != null ? Number(o.filled_avg_price) : undefined,
        status,
        filled,
        timestamp: String(timestamp),
      };
    });
  
    return { orders };
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
