import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { LoaderCircle, TrendingUp, Wallet, DollarSign, Activity, RefreshCw, AlertCircle, BarChart3, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface AccountData {
  equity?: number;
  cash?: number;
  buying_power?: number;
  [key: string]: any;
}

interface Position {
  symbol: string;
  quantity?: number;
  qty?: number;
  market_value?: number;
  marketValue?: number;
  unrealized_pl?: number;
  unrealizedPL?: number;
  [key: string]: any;
}

interface RiskData {
  max_order_notional?: number;
  max_position_pct?: number;
  maxOrderNotional?: number;
  maxPositionPct?: number;
  [key: string]: any;
}

export function Dashboard() {
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [riskData, setRiskData] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async (isAutoRefresh = false) => {
    try {
      if (isAutoRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch all three endpoints in parallel
      const [accountResponse, positionsResponse, riskResponse] = await Promise.all([
        api.getAccount(),
        api.getPositions(),
        api.getRisk(),
      ]);

      setAccountData(accountResponse);
      
      // Handle positions - could be array or object with positions property
      if (Array.isArray(positionsResponse)) {
        setPositions(positionsResponse);
      } else if (positionsResponse?.positions) {
        setPositions(positionsResponse.positions);
      } else {
        setPositions([]);
      }

      setRiskData(riskResponse);

      if (isAutoRefresh) {
        toast.success('Dashboard refreshed');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load dashboard data';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  // Calculate derived values
  const equity = accountData?.equity ?? 0;
  const cash = accountData?.cash ?? 0;
  const buyingPower = accountData?.buying_power ?? accountData?.buyingPower ?? 0;
  const numPositions = positions.length;
  const maxOrderNotional = riskData?.max_order_notional ?? riskData?.maxOrderNotional ?? 0;
  const maxPositionPct = riskData?.max_position_pct ?? riskData?.maxPositionPct ?? 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoaderCircle className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg text-white">Failed to Load Dashboard</h3>
          <p className="text-sm text-zinc-400 max-w-md">{error}</p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl text-white">Account Dashboard</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* KPI Tiles - Dense Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Equity */}
        <div className="bg-zinc-900 border border-zinc-800 rounded p-3">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-blue-500" />
            <p className="text-xs text-zinc-400">Equity</p>
          </div>
          <p className="text-lg text-white">
            ${equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Cash */}
        <div className="bg-zinc-900 border border-zinc-800 rounded p-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-green-500" />
            <p className="text-xs text-zinc-400">Cash</p>
          </div>
          <p className="text-lg text-white">
            ${cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Buying Power */}
        <div className="bg-zinc-900 border border-zinc-800 rounded p-3">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-purple-500" />
            <p className="text-xs text-zinc-400">Buying Power</p>
          </div>
          <p className="text-lg text-white">
            ${buyingPower.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Number of Positions */}
        <div className="bg-zinc-900 border border-zinc-800 rounded p-3">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-cyan-500" />
            <p className="text-xs text-zinc-400">#Positions</p>
          </div>
          <p className="text-lg text-white">{numPositions}</p>
        </div>

        {/* Max Order Notional */}
        <div className="bg-zinc-900 border border-zinc-800 rounded p-3">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-orange-500" />
            <p className="text-xs text-zinc-400">Max Order $</p>
          </div>
          <p className="text-lg text-white">
            ${maxOrderNotional.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>

        {/* Max Position % */}
        <div className="bg-zinc-900 border border-zinc-800 rounded p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <p className="text-xs text-zinc-400">Max Position %</p>
          </div>
          <p className="text-lg text-white">
            {maxPositionPct.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Positions Summary Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800">
          <h3 className="text-white">Positions Summary</h3>
        </div>
        
        {positions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
            <BarChart3 className="w-10 h-10 mb-2 opacity-20" />
            <p className="text-sm">No positions</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-800/50">
                <tr>
                  <th className="text-left px-4 py-2 text-xs text-zinc-400">Symbol</th>
                  <th className="text-right px-4 py-2 text-xs text-zinc-400">Qty</th>
                  <th className="text-right px-4 py-2 text-xs text-zinc-400">Market Value</th>
                  <th className="text-right px-4 py-2 text-xs text-zinc-400">Unrealized P/L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {positions.map((position, index) => {
                  const qty = position.quantity ?? position.qty ?? 0;
                  const marketValue = position.market_value ?? position.marketValue ?? 0;
                  const unrealizedPL = position.unrealized_pl ?? position.unrealizedPL ?? null;
                  const isPLPositive = unrealizedPL !== null ? unrealizedPL >= 0 : null;

                  return (
                    <tr key={position.symbol || index} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-2 text-white">{position.symbol}</td>
                      <td className="px-4 py-2 text-right text-zinc-300">{qty.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right text-white">
                        ${marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className={`px-4 py-2 text-right ${
                        unrealizedPL === null 
                          ? 'text-zinc-500' 
                          : isPLPositive 
                            ? 'text-green-500' 
                            : 'text-red-500'
                      }`}>
                        {unrealizedPL !== null 
                          ? `${isPLPositive ? '+' : ''}$${unrealizedPL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : 'N/A'
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Auto-refresh Info */}
      <div className="text-xs text-zinc-500 text-center">
        Auto-refreshes every 30 seconds
      </div>
    </div>
  );
}
