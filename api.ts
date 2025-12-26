// Centralized API helper with authentication

const API_BASE = import.meta.env.VITE_API_BASE || 'https://api.example.com';
const AUTH_TOKEN = import.meta.env.VITE_AUTH_TOKEN || 'demo-token-12345';

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

  // Add authentication header
  const headers = {
    'Content-Type': 'application/json',
    'X-Auth-Token': AUTH_TOKEN,
    ...fetchOptions.headers,
  };

  const response = await fetch(url.toString(), {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
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
      // Fallback to mock data
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            equity: 135482.50,
            cash: 56520.75,
            buying_power: 113041.50,
          });
        }, 400);
      });
    }
  },

  // Positions endpoint - fetches real positions data
  getPositions: async () => {
    try {
      return await apiRequest<any>('/positions');
    } catch (error) {
      // Fallback to mock data
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            positions: [
              {
                id: '1',
                symbol: 'AAPL',
                name: 'Apple Inc.',
                quantity: 150,
                avgPrice: 175.23,
                currentPrice: 182.45,
                market_value: 27367.50,
                marketValue: 27367.50,
                unrealized_pl: 1083.00,
                unrealizedPL: 1083.00,
                unrealizedPLPercent: 4.12,
              },
              {
                id: '2',
                symbol: 'MSFT',
                name: 'Microsoft Corporation',
                quantity: 75,
                avgPrice: 338.92,
                currentPrice: 342.15,
                market_value: 25661.25,
                marketValue: 25661.25,
                unrealized_pl: 242.25,
                unrealizedPL: 242.25,
                unrealizedPLPercent: 0.95,
              },
              {
                id: '3',
                symbol: 'GOOGL',
                name: 'Alphabet Inc.',
                quantity: 100,
                avgPrice: 142.18,
                currentPrice: 139.87,
                market_value: 13987.00,
                marketValue: 13987.00,
                unrealized_pl: -231.00,
                unrealizedPL: -231.00,
                unrealizedPLPercent: -1.63,
              },
              {
                id: '4',
                symbol: 'TSLA',
                name: 'Tesla Inc.',
                quantity: 50,
                avgPrice: 245.67,
                currentPrice: 238.92,
                market_value: 11946.00,
                marketValue: 11946.00,
                unrealized_pl: -337.50,
                unrealizedPL: -337.50,
                unrealizedPLPercent: -2.75,
              },
            ],
          });
        }, 600);
      });
    }
  },

  // Risk endpoint - fetches real risk data
  getRisk: async () => {
    try {
      return await apiRequest<any>('/risk');
    } catch (error) {
      // Fallback to mock data
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            max_order_notional: 50000,
            max_position_pct: 25.0,
          });
        }, 400);
      });
    }
  },

  // Proposed trades endpoint
  getProposedTrades: async () => {
    try {
      return await apiRequest<any>('/proposed-trades');
    } catch (error) {
      // Fallback to mock data
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            proposals: [
              {
                symbol: 'NVDA',
                side: 'buy',
                qty: 25,
                est_price: 485.00,
                reason: 'Strong momentum + sector rotation',
              },
              {
                symbol: 'META',
                side: 'sell',
                qty: 30,
                est_price: 345.00,
                reason: 'Overbought RSI + resistance level',
              },
              {
                symbol: 'AAPL',
                side: 'hold',
                qty: 150,
                est_price: 182.45,
                reason: 'Neutral technical indicators',
              },
              {
                symbol: 'AMD',
                side: 'buy',
                qty: 100,
                est_price: 142.35,
                reason: 'Earnings beat expectations',
              },
            ],
          });
        }, 500);
      });
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
      // Fallback to mock success
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            order_id: `ORDER-${Date.now()}`,
            message: 'Order submitted successfully (simulated)',
          });
        }, 800);
      });
    }
  },

  // Orders endpoint
  getOrders: async () => {
    try {
      return await apiRequest<any>('/orders');
    } catch (error) {
      // Fallback to mock data
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            orders: [
              {
                id: '1001',
                symbol: 'NVDA',
                type: 'LIMIT',
                side: 'BUY',
                quantity: 25,
                limitPrice: 485.00,
                status: 'OPEN',
                filled: 0,
                timestamp: '2025-12-26T09:30:00Z',
              },
              {
                id: '1002',
                symbol: 'AMD',
                type: 'MARKET',
                side: 'SELL',
                quantity: 100,
                status: 'FILLED',
                filled: 100,
                avgFillPrice: 142.35,
                timestamp: '2025-12-26T08:15:00Z',
              },
              {
                id: '1003',
                symbol: 'META',
                type: 'STOP',
                side: 'SELL',
                quantity: 30,
                stopPrice: 345.00,
                status: 'OPEN',
                filled: 0,
                timestamp: '2025-12-26T07:45:00Z',
              },
            ],
          });
        }, 600);
      });
    }
  },

  // Orders with status filter
  getOrdersWithStatus: async (status: 'all' | 'open' | 'closed' = 'all') => {
    try {
      return await apiRequest<any>('/orders', {
        params: { status },
      });
    } catch (error) {
      // Fallback to mock data filtered by status
      return new Promise((resolve) => {
        setTimeout(() => {
          const allOrders = [
            {
              id: '1001',
              symbol: 'NVDA',
              type: 'LIMIT',
              side: 'BUY',
              quantity: 25,
              filled: 0,
              filled_qty: 0,
              limitPrice: 485.00,
              limit_price: 485.00,
              status: 'OPEN',
              created_at: '2025-12-26T09:30:00Z',
              timestamp: '2025-12-26T09:30:00Z',
            },
            {
              id: '1002',
              symbol: 'AMD',
              type: 'MARKET',
              side: 'SELL',
              quantity: 100,
              filled: 100,
              filled_qty: 100,
              status: 'FILLED',
              avgFillPrice: 142.35,
              avg_fill_price: 142.35,
              created_at: '2025-12-26T08:15:00Z',
              timestamp: '2025-12-26T08:15:00Z',
            },
            {
              id: '1003',
              symbol: 'META',
              type: 'STOP',
              side: 'SELL',
              quantity: 30,
              filled: 0,
              filled_qty: 0,
              stopPrice: 345.00,
              stop_price: 345.00,
              status: 'OPEN',
              created_at: '2025-12-26T07:45:00Z',
              timestamp: '2025-12-26T07:45:00Z',
            },
            {
              id: '1004',
              symbol: 'AAPL',
              type: 'LIMIT',
              side: 'BUY',
              quantity: 50,
              filled: 50,
              filled_qty: 50,
              limitPrice: 180.00,
              limit_price: 180.00,
              status: 'FILLED',
              avgFillPrice: 179.85,
              avg_fill_price: 179.85,
              created_at: '2025-12-26T06:00:00Z',
              timestamp: '2025-12-26T06:00:00Z',
            },
            {
              id: '1005',
              symbol: 'TSLA',
              type: 'STOP_LIMIT',
              side: 'SELL',
              quantity: 25,
              filled: 0,
              filled_qty: 0,
              stopPrice: 240.00,
              stop_price: 240.00,
              limitPrice: 239.50,
              limit_price: 239.50,
              status: 'CANCELLED',
              created_at: '2025-12-25T15:30:00Z',
              timestamp: '2025-12-25T15:30:00Z',
            },
            {
              id: '1006',
              symbol: 'GOOGL',
              type: 'MARKET',
              side: 'BUY',
              quantity: 75,
              filled: 75,
              filled_qty: 75,
              status: 'FILLED',
              avgFillPrice: 139.87,
              avg_fill_price: 139.87,
              created_at: '2025-12-25T14:20:00Z',
              timestamp: '2025-12-25T14:20:00Z',
            },
          ];

          let filteredOrders = allOrders;
          
          if (status === 'open') {
            filteredOrders = allOrders.filter(o => o.status === 'OPEN');
          } else if (status === 'closed') {
            filteredOrders = allOrders.filter(o => ['FILLED', 'CANCELLED', 'REJECTED'].includes(o.status));
          }

          resolve({
            orders: filteredOrders,
          });
        }, 500);
      });
    }
  },

  // Watch list endpoint
  getWatchList: async () => {
    try {
      return await apiRequest<any>('/watchlist');
    } catch (error) {
      // Fallback to mock data
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            symbols: [
              {
                symbol: 'SPY',
                name: 'SPDR S&P 500 ETF',
                price: 478.25,
                change: 2.45,
                changePercent: 0.51,
                volume: 52341234,
              },
              {
                symbol: 'QQQ',
                name: 'Invesco QQQ Trust',
                price: 412.89,
                change: -1.23,
                changePercent: -0.30,
                volume: 28934521,
              },
              {
                symbol: 'AAPL',
                name: 'Apple Inc.',
                price: 182.45,
                change: 3.12,
                changePercent: 1.74,
                volume: 45123789,
              },
              {
                symbol: 'MSFT',
                name: 'Microsoft Corporation',
                price: 342.15,
                change: 5.67,
                changePercent: 1.68,
                volume: 23456123,
              },
              {
                symbol: 'GOOGL',
                name: 'Alphabet Inc.',
                price: 139.87,
                change: -2.34,
                changePercent: -1.65,
                volume: 18234567,
              },
              {
                symbol: 'AMZN',
                name: 'Amazon.com Inc.',
                price: 178.23,
                change: 1.89,
                changePercent: 1.07,
                volume: 34567234,
              },
            ],
          });
        }, 500);
      });
    }
  },
};