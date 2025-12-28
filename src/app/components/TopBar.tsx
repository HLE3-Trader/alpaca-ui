import { Bell, Search, User, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

type Regime = 'RISK_ON' | 'RISK_OFF' | 'UNKNOWN';

export function TopBar() {
  const [connected, setConnected] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // ✅ Regime state
  const [regime, setRegime] = useState<Regime>('UNKNOWN');
  const [regimeDetail, setRegimeDetail] = useState<string>('');

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ✅ Fetch regime on load + refresh every 60s
  useEffect(() => {
    let alive = true;

    const fetchRegime = async () => {
      try {
        // Expecting: { regime: "RISK_ON"|"RISK_OFF", detail?: string }
        const r: any = await api.getRegime();
        if (!alive) return;

        const value = String(r?.regime ?? 'UNKNOWN').toUpperCase();
        if (value === 'RISK_ON' || value === 'RISK_OFF') setRegime(value);
        else setRegime('UNKNOWN');

        setRegimeDetail(String(r?.detail ?? ''));
      } catch (e) {
        // If endpoint isn't ready or proxy route missing, don't crash UI
        if (!alive) return;
        setRegime('UNKNOWN');
        setRegimeDetail('');
      }
    };

    fetchRegime();
    const id = setInterval(fetchRegime, 60_000);

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const regimeIsOn = regime === 'RISK_ON';
  const regimeIsOff = regime === 'RISK_OFF';

  return (
    <div className="h-14 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4">
      {/* Left section */}
      <div className="flex items-center gap-4">
        {/* Paper Trading Pill */}
        <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
          <span className="text-xs text-amber-400">Paper Trading</span>
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-xs text-zinc-400">{connected ? 'Connected' : 'Disconnected'}</span>
        </div>

        {/* ✅ Market Regime Banner */}
        <div
          className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-full border ${
            regimeIsOn
              ? 'bg-green-500/10 border-green-500/20'
              : regimeIsOff
                ? 'bg-red-500/10 border-red-500/20'
                : 'bg-zinc-800/40 border-zinc-700/40'
          }`}
          title={regimeDetail || 'Market regime'}
        >
          {regimeIsOn ? (
            <ShieldCheck className="w-4 h-4 text-green-400" />
          ) : regimeIsOff ? (
            <ShieldAlert className="w-4 h-4 text-red-400" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-zinc-400" />
          )}

          <span
            className={`text-xs ${
              regimeIsOn ? 'text-green-400' : regimeIsOff ? 'text-red-400' : 'text-zinc-400'
            }`}
          >
            {regimeIsOn ? 'RISK ON' : regimeIsOff ? 'RISK OFF' : 'REGIME: —'}
          </span>

          {regimeDetail ? (
            <span className="text-[11px] text-zinc-500 hidden lg:block truncate max-w-[240px]">
              {regimeDetail}
            </span>
          ) : null}
        </div>

        {/* Market Status (leave as-is for now) */}
        <div className="text-xs text-zinc-400 hidden md:block">
          <span className="text-zinc-500">Market:</span>{' '}
          <span className="text-green-400">Open</span>
        </div>

        {/* Time */}
        <div className="text-xs text-zinc-400 hidden lg:block">
          {currentTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <button className="p-2 hover:bg-zinc-900 rounded transition-colors">
          <Search className="w-4 h-4 text-zinc-400" />
        </button>

        {/* Notifications */}
        <button className="p-2 hover:bg-zinc-900 rounded transition-colors relative">
          <Bell className="w-4 h-4 text-zinc-400" />
          <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></div>
        </button>

        {/* User */}
        <button className="flex items-center gap-2 pl-3 pr-2 py-1.5 hover:bg-zinc-900 rounded transition-colors">
          <span className="text-xs text-zinc-300 hidden sm:block">John Trader</span>
          <div className="w-7 h-7 bg-zinc-800 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-zinc-400" />
          </div>
        </button>
      </div>
    </div>
  );
}
