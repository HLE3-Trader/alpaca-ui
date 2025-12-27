import { useState, useEffect, useMemo } from 'react';
import { api } from '../../lib/api';
import { LoaderCircle, TrendingUp, TrendingDown, Search, ArrowUpDown, ArrowUp, ArrowDown, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Position {
  id?: string;
  symbol: string;
  name?: string;
  quantity: number;
  qty?: number;
  avgPrice: number;
  avg_price?: number;
  currentPrice?: number;
  current_price?: number;
  marketValue: number;
  market_value?: number;
  unrealizedPL: number;
  unrealized_pl?: number;
  unrealizedPLPercent?: number;
  unrealized_pl_percent?: number;
}

type SortField = 'symbol' | 'quantity' | 'avgPrice' | 'marketValue' | 'unrealizedPL' | 'unrealizedPLPercent';
type SortDirection = 'asc' | 'desc' | null;

export function Positions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  useEffect(() => {
    loadPositions();
  }, []);

  const loadPositions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.getPositions();
      
      // Normalize the data to handle both camelCase and snake_case
      let positionData: Position[] = [];
      if (Array.isArray(response)) {
        positionData = response;
      } else if (response?.positions) {
        positionData = response.positions;
      } else {
        positionData = [];
      }

      // Normalize field names
  const normalizedPositions = positionData.map((pos: any, index: number) => {
    const quantity = Number(pos.quantity ?? pos.qty ?? 0);
  
    const avgPrice = Number(
      pos.avgPrice ??
        pos.avg_price ??
        pos.avg_entry_price ??   // ✅ Alpaca
        0
    );
  
    const currentPrice = Number(
      pos.currentPrice ??
        pos.current_price ??     // ✅ Alpaca
        0
    );
  
    const marketValue = Number(
      pos.marketValue ??
        pos.market_value ??      // ✅ Alpaca
        (quantity * currentPrice) ??
        0
    );
  
    const unrealizedPL = Number(
      pos.unrealizedPL ??
        pos.unrealized_pl ??     // ✅ Alpaca
        0
    );
  
    // Alpaca gives unrealized_plpc as a decimal string (e.g. "-0.0050" => -0.50%)
    const unrealizedPLPercent =
      pos.unrealizedPLPercent != null
        ? Number(pos.unrealizedPLPercent)
        : pos.unrealized_pl_percent != null
          ? Number(pos.unrealized_pl_percent)
          : pos.unrealized_plpc != null       // ✅ Alpaca
            ? Number(pos.unrealized_plpc) * 100
            : avgPrice && quantity
              ? (unrealizedPL / (avgPrice * quantity)) * 100
              : 0;
  
    return {
      id: pos.id || `pos-${index}`,
      symbol: pos.symbol || '',
      name: pos.name || '',
      quantity,
      avgPrice,
      currentPrice,
      marketValue,
      unrealizedPL,
      unrealizedPLPercent,
    };
  });

      setPositions(normalizedPositions);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load positions';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Positions fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="w-3 h-3 text-blue-500" />;
    }
    if (sortDirection === 'desc') {
      return <ArrowDown className="w-3 h-3 text-blue-500" />;
    }
    return <ArrowUpDown className="w-3 h-3 opacity-40" />;
  };

  // Filter and sort positions
  const filteredAndSortedPositions = useMemo(() => {
    let result = [...positions];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(pos => 
        pos.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      result.sort((a, b) => {
        let aVal: number | string = 0;
        let bVal: number | string = 0;

        switch (sortField) {
          case 'symbol':
            aVal = a.symbol;
            bVal = b.symbol;
            break;
          case 'quantity':
            aVal = a.quantity;
            bVal = b.quantity;
            break;
          case 'avgPrice':
            aVal = a.avgPrice;
            bVal = b.avgPrice;
            break;
          case 'marketValue':
            aVal = a.marketValue;
            bVal = b.marketValue;
            break;
          case 'unrealizedPL':
            aVal = a.unrealizedPL;
            bVal = b.unrealizedPL;
            break;
          case 'unrealizedPLPercent':
            aVal = a.unrealizedPLPercent || 0;
            bVal = b.unrealizedPLPercent || 0;
            break;
        }

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDirection === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        return sortDirection === 'asc' 
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      });
    }

    return result;
  }, [positions, searchTerm, sortField, sortDirection]);

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
          <h3 className="text-lg text-white">Failed to Load Positions</h3>
          <p className="text-sm text-zinc-400 max-w-md">{error}</p>
        </div>
        <button
          onClick={loadPositions}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl text-white">Positions</h2>
          <p className="text-sm text-zinc-400 mt-1">
            {filteredAndSortedPositions.length} {filteredAndSortedPositions.length === 1 ? 'position' : 'positions'}
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </div>

        {/* Search box */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Filter by symbol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        {filteredAndSortedPositions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
            {searchTerm ? (
              <>
                <Search className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-lg mb-1">No Matches Found</p>
                <p className="text-sm">Try a different search term</p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                >
                  Clear Search
                </button>
              </>
            ) : (
              <>
                <TrendingUp className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-lg mb-1">No Positions</p>
                <p className="text-sm">Your portfolio is empty</p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-800/50">
                <tr>
                  <th 
                    onClick={() => handleSort('symbol')}
                    className="text-left px-4 py-3 text-xs text-zinc-400 cursor-pointer hover:bg-zinc-800/80 transition-colors select-none"
                  >
                    <div className="flex items-center gap-2">
                      <span>Symbol</span>
                      {getSortIcon('symbol')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('quantity')}
                    className="text-right px-4 py-3 text-xs text-zinc-400 cursor-pointer hover:bg-zinc-800/80 transition-colors select-none"
                  >
                    <div className="flex items-center justify-end gap-2">
                      <span>Qty</span>
                      {getSortIcon('quantity')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('avgPrice')}
                    className="text-right px-4 py-3 text-xs text-zinc-400 cursor-pointer hover:bg-zinc-800/80 transition-colors select-none"
                  >
                    <div className="flex items-center justify-end gap-2">
                      <span>Avg Entry Price</span>
                      {getSortIcon('avgPrice')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('marketValue')}
                    className="text-right px-4 py-3 text-xs text-zinc-400 cursor-pointer hover:bg-zinc-800/80 transition-colors select-none"
                  >
                    <div className="flex items-center justify-end gap-2">
                      <span>Market Value</span>
                      {getSortIcon('marketValue')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('unrealizedPL')}
                    className="text-right px-4 py-3 text-xs text-zinc-400 cursor-pointer hover:bg-zinc-800/80 transition-colors select-none"
                  >
                    <div className="flex items-center justify-end gap-2">
                      <span>Unrealized P/L</span>
                      {getSortIcon('unrealizedPL')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('unrealizedPLPercent')}
                    className="text-right px-4 py-3 text-xs text-zinc-400 cursor-pointer hover:bg-zinc-800/80 transition-colors select-none"
                  >
                    <div className="flex items-center justify-end gap-2">
                      <span>Unrealized P/L %</span>
                      {getSortIcon('unrealizedPLPercent')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredAndSortedPositions.map((position) => {
                  const isPLPositive = position.unrealizedPL >= 0;

                  return (
                    <tr 
                      key={position.id} 
                      className="hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{position.symbol}</span>
                          {isPLPositive ? (
                            <TrendingUp className="w-3 h-3 text-green-500" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-red-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-300">
                        {position.quantity.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-300">
                        ${position.avgPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right text-white">
                        ${position.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${isPLPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {isPLPositive ? '+' : ''}${position.unrealizedPL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${isPLPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {isPLPositive ? '+' : ''}{position.unrealizedPLPercent?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
