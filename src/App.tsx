import { useState } from 'react';
import { Toaster } from './components/ui/sonner';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Dashboard } from './components/Dashboard';
import { Positions } from './components/Positions';
import { Orders } from './components/Orders';
import { WatchList } from './components/WatchList';
import { ProposedTrades } from './components/ProposedTrades';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'proposals':
        return <ProposedTrades />;
      case 'positions':
        return <Positions />;
      case 'orders':
        return <Orders />;
      case 'watchlist':
        return (
          <div>
            <h2 className="text-xl text-white mb-4">Watch List</h2>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <WatchList />
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center text-zinc-500">
              <p className="text-lg mb-2">Analytics</p>
              <p className="text-sm">Coming soon...</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center text-zinc-500">
              <p className="text-lg mb-2">Settings</p>
              <p className="text-sm">Coming soon...</p>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="h-screen w-screen bg-black flex flex-col overflow-hidden">
      {/* Top Bar */}
      <TopBar />

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar activeView={activeView} onViewChange={setActiveView} />

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-zinc-950 p-6">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Toast notifications */}
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}
