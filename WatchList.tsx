import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { LoaderCircle, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface Symbol {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

export function WatchList() {
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWatchList();
  }, []);

  const loadWatchList = async () => {
    try {
      setLoading(true);
      const data: any = await api.getWatchList();
      setSymbols(data.symbols);
      toast.success('Watch list updated');
    } catch (error) {
      toast.error('Failed to load watch list');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoaderCircle className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (symbols.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
        <Eye className="w-12 h-12 mb-3 opacity-20" />
        <p>No symbols in watch list</p>
        <p className="text-sm mt-1">Add symbols to track market data</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="text-left py-2 px-3 text-zinc-400 font-medium">Symbol</th>
            <th className="text-left py-2 px-3 text-zinc-400 font-medium hidden md:table-cell">Name</th>
            <th className="text-right py-2 px-3 text-zinc-400 font-medium">Price</th>
            <th className="text-right py-2 px-3 text-zinc-400 font-medium">Change</th>
            <th className="text-right py-2 px-3 text-zinc-400 font-medium">Change %</th>
            <th className="text-right py-2 px-3 text-zinc-400 font-medium hidden lg:table-cell">Volume</th>
          </tr>
        </thead>
        <tbody>
          {symbols.map((symbol) => {
            const isPositive = symbol.change >= 0;
            
            return (
              <tr
                key={symbol.symbol}
                className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors cursor-pointer"
              >
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <span className="text-white">{symbol.symbol}</span>
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500" />
                    )}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-zinc-400 hidden md:table-cell max-w-xs truncate">
                  {symbol.name}
                </td>
                <td className="py-2.5 px-3 text-right text-white">
                  ${symbol.price.toFixed(2)}
                </td>
                <td className={`py-2.5 px-3 text-right ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositive ? '+' : ''}{symbol.change.toFixed(2)}
                </td>
                <td className={`py-2.5 px-3 text-right ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositive ? '+' : ''}{symbol.changePercent.toFixed(2)}%
                </td>
                <td className="py-2.5 px-3 text-right text-zinc-400 hidden lg:table-cell">
                  {(symbol.volume / 1000000).toFixed(2)}M
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}