// Path B: UI talks ONLY to the secure Vercel proxy (no secrets in browser)
const API_BASE =
  (import.meta.env.VITE_API_BASE || 'https://alpaca-proxy-flame.vercel.app/api') + '/';

interface ApiOptions extends RequestInit {
  params?: Record<string, string>;
}

async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = new URL(cleanEndpoint, API_BASE);

  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
  }

  const headers = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  const response = await fetch(url.toString(), { ...fetchOptions, headers });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  getAccount: async () => apiRequest<any>('/account'),

  getPositions: async () => {
    const raw = await apiRequest<any>('/positions');
    const list = Array.isArray(raw) ? raw : (raw.positions ?? []);

    const positions = list.map((p: any, i: number) => {
      const quantity = Number(p.quantity ?? p.qty ?? 0);
      const avgPrice = Number(p.avgPrice ?? p.avg_price ?? p.avg_entry_price ?? 0);
      const currentPrice = Number(p.currentPrice ?? p.current_price ?? 0);
      const marketValue = Number(p.marketValue ?? p.market_value ?? (quantity * currentPrice) ?? 0);
      const unrealizedPL = Number(p.unrealizedPL ?? p.unrealized_pl ?? 0);

      const unrealizedPLPercent =
        p.unrealizedPLPercent != null
          ? Number(p.unrealizedPLPercent)
          : p.unrealized_pl_percent != null
            ? Number(p.unrealized_pl_percent)
            : p.unrealized_plpc != null
              ? Number(p.unrealized_plpc) * 100
              : avgPrice && quantity
                ? (unrealizedPL / (avgPrice * quantity)) * 100
                : 0;

      return {
        id: p.id ?? p.asset_id ?? `pos-${i}`,
        symbol: p.symbol ?? '',
        name: p.name ?? p.symbol ?? '',
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

  getOrders: async () => {
    const raw = await apiRequest<any>('/orders');
    const list = Array.isArray(raw) ? raw : (raw.orders ?? []);

    const orders = list.map((o: any) => {
      const quantity = Number(o.quantity ?? o.qty ?? 0);
      const filled = Number(o.filled ?? o.filled_qty ?? 0);

      const type = String(o.type ?? o.order_type ?? '').toUpperCase();
      const side = String(o.side ?? '').toUpperCase();

      const rawStatus = String(o.status ?? '').toUpperCase();
      const openLike = new Set(['NEW', 'ACCEPTED', 'PENDING_NEW', 'PARTIALLY_FILLED']);
      const status = openLike.has(rawStatus) ? 'OPEN' : rawStatus;

      const timestamp = o.filled_at ?? o.submitted_at ?? o.created_at ?? new Date().toISOString();

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

  getOrdersWithStatus: async (status: 'all' | 'open' | 'closed' = 'all') => {
    const raw = await apiRequest<any>('/orders', { params: { status } });
    const list = Array.isArray(raw) ? raw : (raw.orders ?? []);

    const orders = list.map((o: any) => {
      const quantity = Number(o.quantity ?? o.qty ?? 0);
      const filled = Number(o.filled ?? o.filled_qty ?? 0);

      const type = String(o.type ?? o.order_type ?? '').toUpperCase();
      const side = String(o.side ?? '').toUpperCase();

      const rawStatus = String(o.status ?? '').toUpperCase();
      const openLike = new Set(['NEW', 'ACCEPTED', 'PENDING_NEW', 'PARTIALLY_FILLED']);
      const statusNorm = openLike.has(rawStatus) ? 'OPEN' : rawStatus;

      const timestamp = o.filled_at ?? o.submitted_at ?? o.created_at ?? new Date().toISOString();

      return {
        id: String(o.id),
        symbol: String(o.symbol),
        type: type || '—',
        side: side || '—',
        quantity,
        limitPrice: o.limit_price != null ? Number(o.limit_price) : undefined,
        stopPrice: o.stop_price != null ? Number(o.stop_price) : undefined,
        avgFillPrice: o.filled_avg_price != null ? Number(o.filled_avg_price) : undefined,
        status: statusNorm,
        filled,
        timestamp: String(timestamp),
      };
    });

    return { orders };
  },

  getProposedTrades: async () => {
    const raw = await apiRequest<any>('/proposed-trades');
    const list = Array.isArray(raw) ? raw : (raw?.proposals ?? []);
  
    const proposals = list.map((p: any) => ({
      symbol: String(p.symbol ?? ''),
      side: String(p.side ?? '').toLowerCase(), // buy | sell | hold
      qty: Number(p.qty ?? 0),
      est_price: p.est_price != null ? Number(p.est_price) : undefined,
      reason: String(p.reason ?? ''),
    }));
  
    return { proposals };
  },

  approveProposal: async (data: { symbol: string; side: string; qty: number; est_price: number }) =>
    apiRequest<any>('/approve', { method: 'POST', body: JSON.stringify(data) }),

  getWatchList: async () => apiRequest<any>('/watchlist'),

  getRisk: async () => apiRequest<any>('/risk'),
};
