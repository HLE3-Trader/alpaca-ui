import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { LoaderCircle, AlertCircle, CheckCircle, Minus } from 'lucide-react';
import { toast } from 'sonner';

interface ProposedTrade {
  symbol: string;
  side: string;
  qty: number;
  est_price?: number;
  confidence?: number;                 // 0..1 or 0..100
  horizon?: string;                    // optional
  signals?: Record<string, number>;    // optional
  reason?: string;
  [key: string]: any;
}

export function ProposedTrades() {
  const [proposals, setProposals] = useState<ProposedTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingSymbols, setSubmittingSymbols] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadProposedTrades();
  }, []);

  const loadProposedTrades = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.getProposedTrades();

      if (Array.isArray(response)) {
        setProposals(response);
      } else if (response?.proposals) {
        setProposals(response.proposals);
      } else if (response?.trades) {
        setProposals(response.trades);
      } else {
        setProposals([]);
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to load proposed trades';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Proposed trades fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Normalize confidence to 0..1
  const getConfidence = (p: ProposedTrade) => {
    if (p.confidence != null) {
      const c = Number(p.confidence);
      const normalized = c > 1 ? c / 100 : c; // accepts 0..100 or 0..1
      return Math.max(0, Math.min(1, normalized));
    }

    // Fallback: simple confidence based on action + sizing
    const side = String(p.side ?? '').toLowerCase();
    if (side === 'hold') return 0.40;
    if ((side === 'buy' || side === 'sell') && (p.qty ?? 0) > 0) return 0.65;
    return 0.50;
  };

  const handleApprove = async (proposal: ProposedTrade) => {
    const key = `${proposal.symbol}-${proposal.side}`;
    setSubmittingSymbols(prev => new Set(prev).add(key));

    try {
      await api.approveProposal({
        symbol: proposal.symbol,
        side: proposal.side,
        qty: proposal.qty,
        est_price: proposal.est_price ?? 0,
      });

      toast.success('Order submitted');

      Promise.all([
        api.getOrders().catch(err => console.error('Failed to refresh orders:', err)),
        api.getPositions().catch(err => console.error('Failed to refresh positions:', err)),
      ]);

      setProposals(prev =>
        prev.filter(p => !(p.symbol === proposal.symbol && p.side === proposal.side))
      );
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to approve trade';
      toast.error(errorMessage);
      console.error('Approve trade error:', error);
    } finally {
      setSubmittingSymbols(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const getSideBadgeColor = (side: string) => {
    const lowerSide = side.toLowerCase();
    if (lowerSide === 'buy') return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (lowerSide === 'sell') return 'bg-red-500/10 text-red-500 border-red-500/20';
    return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
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
          <h3 className="text-lg text-white">Failed to Load Proposals</h3>
          <p className="text-sm text-zinc-400 max-w-md">{error}</p>
        </div>
        <button
          onClick={loadProposedTrades}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl text-white">Proposed Trades</h2>
        <div className="text-sm text-zinc-400">
          {proposals.length} {proposals.length === 1 ? 'proposal' : 'proposals'}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        {proposals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
            <CheckCircle className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-lg mb-1">No Proposed Trades</p>
            <p className="text-sm">All caught up!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-800/50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs text-zinc-400">Symbol</th>
                  <th className="text-left px-4 py-3 text-xs text-zinc-400">Side</th>
                  <th className="text-right px-4 py-3 text-xs text-zinc-400">Qty</th>
                  <th className="text-right px-4 py-3 text-xs text-zinc-400">Est Price</th>
                  <th className="text-right px-4 py-3 text-xs text-zinc-400">Conf</th>
                  <th className="text-left px-4 py-3 text-xs text-zinc-400">Reason</th>
                  <th className="text-center px-4 py-3 text-xs text-zinc-400">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-800">
                {proposals.map((proposal, index) => {
                  const key = `${proposal.symbol}-${proposal.side}`;
                  const isSubmitting = submittingSymbols.has(key);
                  const isHold = proposal.side.toLowerCase() === 'hold';
                  const isBuyOrSell = ['buy', 'sell'].includes(proposal.side.toLowerCase());

                  const conf = getConfidence(proposal); // 0..1
                  const confPct = Math.round(conf * 100);

                  return (
                    <tr key={index} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3 text-white">{proposal.symbol}</td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs border rounded uppercase ${getSideBadgeColor(
                            proposal.side
                          )}`}
                        >
                          {proposal.side}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right text-zinc-300">
                        {Number(proposal.qty ?? 0).toLocaleString()}
                      </td>

                      <td className="px-4 py-3 text-right text-white">
                        {proposal.est_price != null
                          ? `$${Number(proposal.est_price).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`
                          : '—'}
                      </td>

                      {/* ✅ Confidence cell */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-zinc-300 text-sm tabular-nums">{confPct}%</span>
                          <div className="w-20 h-1 bg-zinc-800 rounded overflow-hidden">
                            <div className="h-1 bg-blue-500" style={{ width: `${confPct}%` }} />
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm text-zinc-400">
                        {proposal.reason || 'N/A'}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {isHold ? (
                          <div className="flex items-center justify-center gap-1 text-zinc-500 text-sm">
                            <Minus className="w-3 h-3" />
                            <span>No action</span>
                          </div>
                        ) : isBuyOrSell ? (
                          <button
                            onClick={() => handleApprove(proposal)}
                            disabled={isSubmitting}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white text-sm rounded transition-colors flex items-center gap-2 mx-auto disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? (
                              <>
                                <LoaderCircle className="w-3 h-3 animate-spin" />
                                <span>Submitting...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                <span>Approve</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="text-zinc-500 text-sm">Unknown</div>
                        )}
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
