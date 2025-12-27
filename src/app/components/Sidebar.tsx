import { LayoutDashboard, TrendingUp, FileText, Settings, ChartLine, Wallet, Lightbulb } from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'proposals', label: 'Proposed Trades', icon: Lightbulb },
    { id: 'positions', label: 'Positions', icon: Wallet },
    { id: 'orders', label: 'Orders', icon: FileText },
    { id: 'watchlist', label: 'Watch List', icon: TrendingUp },
    { id: 'analytics', label: 'Analytics', icon: ChartLine },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-60 bg-zinc-950 border-r border-zinc-800 flex flex-col">
      {/* Logo */}
      <div className="h-14 px-4 flex items-center border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded flex items-center justify-center">
            <ChartLine className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-white">TradeDesk</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded transition-colors mb-1
                ${isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800">
        <div className="text-xs text-zinc-500">
          <div className="flex justify-between mb-1">
            <span>Total Value</span>
            <span className="text-zinc-300">$135,482.50</span>
          </div>
          <div className="flex justify-between">
            <span>Cash</span>
            <span className="text-zinc-300">$56,520.75</span>
          </div>
        </div>
      </div>
    </div>
  );
}