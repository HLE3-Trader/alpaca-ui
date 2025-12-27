import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { LoaderCircle, FileText, X } from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: string;
  symbol: string;
  type: string;
  side: string;
  quantity: number;
  limitPrice?: number;
  stopPrice?: number;
  avgFillPrice?: number;
  status: string;
  filled: number;
  timestamp: string;
}

export function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data: any = await api.getOrders();
      setOrders(data.orders);
      toast.success('Orders loaded');
    } catch (error) {
      toast.error('Failed to load orders');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = (orderId: string) => {
    toast.success(`Order ${orderId} cancelled`);
    // In real app, would call API here
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoaderCircle className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
        <FileText className="w-12 h-12 mb-3 opacity-20" />
        <p>No orders found</p>
        <p className="text-sm mt-1">You have no active or recent orders</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="text-left py-2 px-3 text-zinc-400 font-medium">Order ID</th>
            <th className="text-left py-2 px-3 text-zinc-400 font-medium">Symbol</th>
            <th className="text-left py-2 px-3 text-zinc-400 font-medium">Type</th>
            <th className="text-left py-2 px-3 text-zinc-400 font-medium">Side</th>
            <th className="text-right py-2 px-3 text-zinc-400 font-medium">Qty</th>
            <th className="text-right py-2 px-3 text-zinc-400 font-medium hidden lg:table-cell">Price</th>
            <th className="text-left py-2 px-3 text-zinc-400 font-medium">Status</th>
            <th className="text-right py-2 px-3 text-zinc-400 font-medium hidden md:table-cell">Filled</th>
            <th className="text-right py-2 px-3 text-zinc-400 font-medium hidden xl:table-cell">Time</th>
            <th className="text-right py-2 px-3 text-zinc-400 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const isBuy = order.side === 'BUY';
            const isFilled = order.status === 'FILLED';
            
            return (
              <tr
                key={order.id}
                className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors"
              >
                <td className="py-2.5 px-3 text-zinc-400 font-mono text-xs">
                  #{order.id}
                </td>
                <td className="py-2.5 px-3 text-white">
                  {order.symbol}
                </td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-300">
                    {order.type}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      isBuy
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    {order.side}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right text-zinc-300">
                  {order.quantity}
                </td>
                <td className="py-2.5 px-3 text-right text-zinc-300 hidden lg:table-cell">
                  {order.limitPrice && `$${order.limitPrice.toFixed(2)}`}
                  {order.stopPrice && `$${order.stopPrice.toFixed(2)}`}
                  {order.avgFillPrice && `$${order.avgFillPrice.toFixed(2)}`}
                  {!order.limitPrice && !order.stopPrice && !order.avgFillPrice && '—'}
                </td>
                <td className="py-2.5 px-3">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      isFilled
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right text-zinc-400 hidden md:table-cell">
                  {order.filled}/{order.quantity}
                </td>
                <td className="py-2.5 px-3 text-right text-zinc-400 text-xs hidden xl:table-cell">
                  {new Date(order.timestamp).toLocaleTimeString()}
                </td>
                <td className="py-2.5 px-3 text-right">
                  {order.status === 'OPEN' && (
                    <button
                      onClick={() => cancelOrder(order.id)}
                      className="p-1 hover:bg-red-500/10 rounded transition-colors"
                      title="Cancel order"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}