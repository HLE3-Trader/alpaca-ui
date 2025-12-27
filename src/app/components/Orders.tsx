import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { LoaderCircle, AlertCircle, FileText, X } from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: string;
  symbol: string;
  side: string;
  type: string;
  quantity: number;
  qty?: number;
  filled: number;
  filled_qty?: number;
  status: string;
  created_at?: string;
  timestamp?: string;
  limitPrice?: number;
  limit_price?: number;
  stopPrice?: number;
  stop_price?: number;
  avgFillPrice?: number;
  avg_fill_price?: number;
  [key: string]: any;
}

type StatusFilter = 'all' | 'open' | 'closed';

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    loadOrders(statusFilter);
  }, [statusFilter]);

  const loadOrders = async (status: StatusFilter) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.getOrdersWithStatus(status);
      
      // Handle response - could be array or object with orders property
      let orderData: Order[] = [];
      if (Array.isArray(response)) {
        orderData = response;
      } else if (response?.orders) {
        orderData = response.orders;
      } else {
        orderData = [];
      }

      setOrders(orderData);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load orders';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Orders fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (order: Order) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    // Wait for animation before clearing selection
    setTimeout(() => setSelectedOrder(null), 300);
  };

  const getSideBadgeColor = (side: string) => {
    const lowerSide = side.toLowerCase();
    if (lowerSide === 'buy') return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (lowerSide === 'sell') return 'bg-red-500/10 text-red-500 border-red-500/20';
    return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
  };

  const getStatusBadgeColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'filled') return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (lowerStatus === 'open') return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    if (lowerStatus === 'cancelled' || lowerStatus === 'rejected') return 'bg-red-500/10 text-red-500 border-red-500/20';
    if (lowerStatus === 'partial') return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getFilledQty = (order: Order) => {
    return order.filled ?? order.filled_qty ?? 0;
  };

  const getQuantity = (order: Order) => {
    return order.quantity ?? order.qty ?? 0;
  };

  const getCreatedTime = (order: Order) => {
    return order.created_at ?? order.timestamp ?? '';
  };

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
          <h3 className="text-lg text-white">Failed to Load Orders</h3>
          <p className="text-sm text-zinc-400 max-w-md">{error}</p>
        </div>
        <button
          onClick={() => loadOrders(statusFilter)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header with filter chips */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl text-white">Orders</h2>
            <p className="text-sm text-zinc-400 mt-1">
              {orders.length} {orders.length === 1 ? 'order' : 'orders'}
            </p>
          </div>

          {/* Filter chips */}
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('open')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                statusFilter === 'open'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              }`}
            >
              Open
            </button>
            <button
              onClick={() => setStatusFilter('closed')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                statusFilter === 'closed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              }`}
            >
              Closed
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
              <FileText className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-lg mb-1">No Orders</p>
              <p className="text-sm">
                {statusFilter === 'open' && 'No open orders found'}
                {statusFilter === 'closed' && 'No closed orders found'}
                {statusFilter === 'all' && 'No orders found'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-800/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs text-zinc-400">Created Time</th>
                    <th className="text-left px-4 py-3 text-xs text-zinc-400">Symbol</th>
                    <th className="text-left px-4 py-3 text-xs text-zinc-400">Side</th>
                    <th className="text-right px-4 py-3 text-xs text-zinc-400">Qty</th>
                    <th className="text-right px-4 py-3 text-xs text-zinc-400">Filled Qty</th>
                    <th className="text-left px-4 py-3 text-xs text-zinc-400">Type</th>
                    <th className="text-left px-4 py-3 text-xs text-zinc-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {orders.map((order) => {
                    const filledQty = getFilledQty(order);
                    const totalQty = getQuantity(order);
                    const createdTime = getCreatedTime(order);

                    return (
                      <tr
                        key={order.id}
                        onClick={() => handleRowClick(order)}
                        className="hover:bg-zinc-800/50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3 text-sm text-zinc-300">
                          {formatTimestamp(createdTime)}
                        </td>
                        <td className="px-4 py-3 text-white font-medium">
                          {order.symbol}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs border rounded uppercase ${getSideBadgeColor(order.side)}`}>
                            {order.side}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-zinc-300">
                          {totalQty.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-zinc-300">
                          {filledQty.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-300 uppercase">
                          {order.type}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs border rounded uppercase ${getStatusBadgeColor(order.status)}`}>
                            {order.status}
                          </span>
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

      {/* Detail Drawer */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 z-40 transition-opacity"
            onClick={closeDrawer}
          />

          {/* Drawer */}
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-zinc-900 border-l border-zinc-800 z-50 overflow-auto">
            {/* Header */}
            <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg text-white">Order Details</h3>
                <p className="text-sm text-zinc-400 mt-1">
                  Order ID: {selectedOrder?.id}
                </p>
              </div>
              <button
                onClick={closeDrawer}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-4">
                {/* Summary */}
                <div className="bg-zinc-800/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Symbol</span>
                    <span className="text-white font-medium">{selectedOrder?.symbol}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Side</span>
                    <span className={`inline-flex px-2 py-1 text-xs border rounded uppercase ${getSideBadgeColor(selectedOrder?.side || '')}`}>
                      {selectedOrder?.side}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Type</span>
                    <span className="text-white uppercase">{selectedOrder?.type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Status</span>
                    <span className={`inline-flex px-2 py-1 text-xs border rounded uppercase ${getStatusBadgeColor(selectedOrder?.status || '')}`}>
                      {selectedOrder?.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Quantity</span>
                    <span className="text-white">{getQuantity(selectedOrder!)?.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Filled</span>
                    <span className="text-white">{getFilledQty(selectedOrder!)?.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Created</span>
                    <span className="text-white">{formatTimestamp(getCreatedTime(selectedOrder!))}</span>
                  </div>
                </div>

                {/* Raw JSON */}
                <div>
                  <h4 className="text-sm text-zinc-400 mb-2">Raw Order JSON</h4>
                  <div className="bg-black/50 rounded-lg p-4 overflow-auto">
                    <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap">
                      {JSON.stringify(selectedOrder, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
