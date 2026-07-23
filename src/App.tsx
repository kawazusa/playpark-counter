import { useState, useEffect } from 'react';
import { KioskForm } from './components/KioskForm';
import { AdminPanel } from './components/AdminPanel';
import { 
  Settings, 
  Wifi, 
  WifiOff, 
  Leaf, 
  Users,
  Sparkles
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';

function App() {
  const [view, setView] = useState<'kiosk' | 'admin'>('kiosk');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pressTimer, setPressTimer] = useState<number | null>(null);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get total count of registered groups and people today
  const todayStats = useLiveQuery(async () => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todaysEntries = await db.visitorRecords
      .where('timestamp')
      .aboveOrEqual(startOfToday.getTime())
      .toArray() || [];
    
    const groups = todaysEntries.length;
    const people = todaysEntries.reduce((sum, r) => sum + r.headcount, 0);
    
    return { groups, people };
  });

  const todayGroups = todayStats?.groups || 0;
  const todayPeople = todayStats?.people || 0;

  // Long press handler on gear icon to bypass pin screen (or open admin panel directly)
  const handlePressStart = () => {
    const timer = window.setTimeout(() => {
      // Long press of 5 seconds opens the admin panel immediately without password
      setView('admin');
      alert("管理者用モード（長押しバイパス）に入りました。");
    }, 5000);
    setPressTimer(timer);
  };

  const handlePressEnd = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-brand-50 via-warm-50 to-sky-100 flex flex-col justify-between p-6 md:p-10 text-slate-800 selection:bg-brand-200">
      
      {/* Top Banner (Offline Status & Today's Stats) */}
      <header className="w-full max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        
        {/* Network Status Badge */}
        <div className="flex items-center gap-3">
          {isOnline ? (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-black bg-emerald-50 text-emerald-800 border border-emerald-100 shadow-sm">
              <Wifi className="w-4 h-4 text-emerald-600" />
              オンライン (動作中)
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-black bg-amber-50 text-amber-800 border border-amber-100 animate-pulse shadow-sm">
              <WifiOff className="w-4 h-4 text-amber-600" />
              オフライン (端末に保存されます)
            </span>
          )}
          
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-black bg-white/70 backdrop-blur-md text-slate-700 border border-white/40 shadow-sm">
            <Users className="w-4 h-4 text-brand-650" />
            今日の来場者: {todayPeople} 名 ({todayGroups} 組)
          </span>
        </div>

        {/* Title / Brand logo */}
        <div className="flex items-center gap-3 mt-3 sm:mt-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/25">
            <Leaf className="w-5 h-5 fill-white/10" />
          </div>
          <span className="font-black text-slate-750 tracking-tight text-xl">プレイパーク来場者カウンター</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center py-4 w-full">
        {view === 'kiosk' ? (
          <div className="w-full">
            {/* Visual Welcome Banner */}
            <div className="text-center mb-8 max-w-lg mx-auto">
              <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 to-brand-650 tracking-tight flex items-center justify-center gap-3">
                <Sparkles className="w-8 h-8 text-amber-550 fill-amber-550/10 animate-pulse" />
                あそび場 受付
              </h1>
              <p className="text-slate-500 text-lg md:text-xl font-bold mt-2.5">
                遊びにきてくれてありがとう！とうろくをお願いします。
              </p>
            </div>
            
            <KioskForm onSuccess={() => {}} />
          </div>
        ) : (
          <AdminPanel onClose={() => setView('kiosk')} />
        )}
      </main>

      {/* Footer Area with Hidden Settings Icon */}
      <footer className="w-full max-w-4xl mx-auto flex justify-between items-center mt-6 pt-4 border-t border-slate-200/50 text-xs font-semibold text-slate-400">
        <span>© 2026 Playpark Visitor Counter. All rights reserved.</span>
        
        {/* Tactile hidden button or gear icon */}
        <button
          onClick={() => setView(view === 'kiosk' ? 'admin' : 'kiosk')}
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          className="p-3 text-slate-300 hover:text-slate-500 active:scale-95 transition-all rounded-full hover:bg-slate-100 cursor-pointer focus:outline-none"
          title="管理者設定"
        >
          <Settings className="w-5 h-5" />
        </button>
      </footer>
    </div>
  );
}

export default App;
