import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { LoaderCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

interface Position {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
}

export function PositionsTable() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPositions();
  }, []);

  const loadPositions = async () => {
    try {
      setLoading(true);
      const data: any = await api.getPositions();
      setPositions(data.positions);
      toast.success('Positions loaded');
    } catch (error) {
      toast.error('Failed to load positions');
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

  if (positions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
        <TrendingUp className="w-12 h-12 mb-3 opacity-20" />
        <p>No positions found</p>
        <p className="text-sm mt-1">Your portfolio is empty</p>
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
            <th className="text-right py-2 px-3 text-zinc-400 font-medium">Qty</th>
            <th className="text-right py-2 px-3 text-zinc-400 font-medium">Avg Price</th>
            <th className="text-right py-2 px-3 text-zinc-400 font-medium">Current</th>
            <th className="text-right py-2 px-3 text-zinc-400 font-medium hidden lg:table-cell">Market Value</th>
            <th className="text-right py-2 px-3 text-zinc-400 font-medium">P&L</th>
            <th className="text-right py-2 px-3 text-zinc-400 font-medium">P&L %</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((position) => {
            const isPositive = position.unrealizedPL >= 0;
            
            return (
              <tr
                key={position.id}
                className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors"
              >
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <span className="text-white">{position.symbol}</span>
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500" />
                    )}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-zinc-400 hidden md:table-cell max-w-xs truncate">
                  {position.name}
                </td>
                <td className="py-2.5 px-3 text-right text-zinc-300">
                  {position.quantity.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right text-zinc-300">
                  ${position.avgPrice.toFixed(2)}
                </td>
                <td className="py-2.5 px-3 text-right text-white">
                  ${position.currentPrice.toFixed(2)}
                </td>
                <td className="py-2.5 px-3 text-right text-zinc-300 hidden lg:table-cell">
                  ${position.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className={`py-2.5 px-3 text-right ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositive ? '+' : ''}${position.unrealizedPL.toFixed(2)}
                </td>
                <td className={`py-2.5 px-3 text-right ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositive ? '+' : ''}{position.unrealizedPLPercent.toFixed(2)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}