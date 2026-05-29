/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Calendar, 
  Wrench, 
  Package, 
  Fuel, 
  Coins, 
  UserCheck, 
  MessageSquare, 
  Database,
  Menu,
  X,
  Sparkles,
  LayoutDashboard,
  Clock,
  Briefcase
} from 'lucide-react';

// Import Views
import DashboardView from './components/DashboardView';
import { sendLineTaskNotification, sendLineRepairNotification } from './utils/lineNotify';
import WorkScheduleView from './components/WorkScheduleView';
import RepairView from './components/RepairView';
import InventoryView from './components/InventoryView';
import HeavyMachineryView from './components/HeavyMachineryView';
import RefuelView from './components/RefuelView';
import ExpenseTrackerView from './components/ExpenseTrackerView';
import AttendanceView from './components/AttendanceView';
import LineFlexBuilder from './components/LineFlexBuilder';
import DatabaseSchemaView from './components/DatabaseSchemaView';
import QrScannerModal from './components/QrScannerModal';

// Import Initial Data and Types
import { 
  INITIAL_MACHINERY, 
  INITIAL_TASKS, 
  INITIAL_STOCK, 
  INITIAL_ISSUANCES, 
  INITIAL_ATTENDANCE_LOGS, 
  INITIAL_REPAIRS, 
  INITIAL_REFUELS, 
  INITIAL_EXPENSES 
} from './mockData';

import { 
  HeavyMachinery, 
  WorkScheduleTask, 
  StockItem, 
  InventoryIssuance, 
  AttendanceLog, 
  RepairRequest, 
  RefuelStatus, 
  ExpenseRecord 
} from './types';
import { syncManager } from './syncManager';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, Cloud, CloudOff, RefreshCw } from 'lucide-react';

export default function App() {
  // Theme state (yellow, blue, green, white - soft premium tones)
  const [theme, setTheme] = useState<'yellow' | 'blue' | 'green' | 'white'>(() => {
    const saved = localStorage.getItem('flowwork-theme');
    return (['yellow', 'blue', 'green', 'white'].includes(saved as string) ? saved : 'yellow') as 'yellow' | 'blue' | 'green' | 'white';
  });

  const changeTheme = (newTheme: 'yellow' | 'blue' | 'green' | 'white') => {
    setTheme(newTheme);
    localStorage.setItem('flowwork-theme', newTheme);
  };

  // Modern soft-toned dynamic styles definitions for whole page frame
  const themeStyles = {
    yellow: {
      rootBg: "bg-[#fffdf2] text-stone-800",
      topbarBg: "bg-[#fffefaa6] backdrop-blur-xl border-amber-200/50 shadow-[0_4px_24px_-8px_rgba(251,191,36,0.15)] text-stone-900",
      sidebarBg: "bg-[#fffefaa6] backdrop-blur-md border-amber-200/40",
      mainBg: "bg-[#fcfbf9]/60",
      sidebarHeader: "text-amber-700/70 border-amber-200/30",
      navActive: "bg-gradient-to-tr from-amber-400 to-yellow-300 text-stone-900 border-amber-300 shadow-[0_4px_16px_-4px_rgba(251,191,36,0.4)]",
      navInactive: "text-stone-500 hover:text-stone-800 border-transparent hover:bg-amber-100/40 hover:border-amber-200/50",
      clockBg: "bg-white/80 backdrop-blur-md border border-amber-200/60 text-amber-800 shadow-sm",
      glow1: "bg-amber-300/15",
      glow2: "bg-yellow-100/30",
    },
    blue: {
      rootBg: "bg-[#f4f7fb] text-slate-800",
      topbarBg: "bg-white/90 backdrop-blur-xl border-sky-100/80 shadow-sm text-slate-800",
      sidebarBg: "bg-[#e5eff8]/70 border-sky-200/50",
      mainBg: "bg-white/40",
      sidebarHeader: "text-slate-500 border-sky-200/30",
      navActive: "bg-sky-500 text-white border-sky-500 shadow-sm",
      navInactive: "text-slate-650 hover:text-slate-900 border-transparent hover:bg-sky-100/50 hover:border-sky-200/40",
      clockBg: "bg-sky-50 border border-sky-150 text-sky-700",
      glow1: "bg-sky-400/15",
      glow2: "bg-[#f4f7fb]/0",
    },
    green: {
      rootBg: "bg-[#edf6f0] text-stone-800",
      topbarBg: "bg-white/90 backdrop-blur-xl border-emerald-100/80 shadow-sm text-stone-800",
      sidebarBg: "bg-[#e2ede5]/70 border-emerald-200/50",
      mainBg: "bg-white/40",
      sidebarHeader: "text-stone-500 border-emerald-200/30",
      navActive: "bg-emerald-600 text-white border-emerald-600 shadow-sm",
      navInactive: "text-stone-650 hover:text-stone-900 border-transparent hover:bg-emerald-100/50 hover:border-emerald-200/40",
      clockBg: "bg-emerald-50 border border-emerald-150 text-emerald-700",
      glow1: "bg-emerald-400/15",
      glow2: "bg-[#edf6f0]/0",
    },
    white: {
      rootBg: "bg-[#faf9f5] text-stone-900",
      topbarBg: "bg-white backdrop-blur-xl border-b border-stone-200 shadow-sm text-stone-950",
      sidebarBg: "bg-[#f1efe9]/75 border-stone-200/80",
      mainBg: "bg-white/35",
      sidebarHeader: "text-stone-550 border-stone-200/40",
      navActive: "bg-stone-800 text-white border-stone-800 shadow-sm",
      navInactive: "text-stone-650 hover:text-stone-950 border-transparent hover:bg-stone-100/80 hover:border-stone-200/60",
      clockBg: "bg-stone-100 border border-stone-200/60 text-stone-700",
      glow1: "bg-amber-100/30",
      glow2: "bg-stone-100/30",
    }
  };

  const currentStyle = themeStyles[theme];

  // Navigation active tab
  const [activeTab, setActiveTab] = useState('dashboard');
  const [autoOpenScheduleAddForm, setAutoOpenScheduleAddForm] = useState(false);
  const [autoOpenRepairAddForm, setAutoOpenRepairAddForm] = useState(false);

  const handleNavigate = (tab: string) => {
    if (tab === 'shd' || tab === 'schedule-add' || tab === 'schedule') {
      setActiveTab('schedule');
      setAutoOpenScheduleAddForm(tab !== 'schedule'); // Auto-open only if coming from card/button shortcuts
      setAutoOpenRepairAddForm(false);
    } else if (tab === 'rep' || tab === 'repair-add' || tab === 'repairs') {
      setActiveTab('repairs');
      setAutoOpenRepairAddForm(tab !== 'repairs'); // Auto-open only if coming from card/button shortcuts
      setAutoOpenScheduleAddForm(false);
    } else {
      // Map other dashboard routes
      const mappedTab = 
        tab === 'exp' ? 'expenses' :
        tab === 'inv' ? 'inventory' :
        tab === 'mac' ? 'machinery' : tab;
      setActiveTab(mappedTab);
      setAutoOpenScheduleAddForm(false);
      setAutoOpenRepairAddForm(false);
    }
  };

  // Core global shared list state
  const [machinery, setMachinery] = useState<HeavyMachinery[]>(INITIAL_MACHINERY);
  const [tasks, setTasks] = useState<WorkScheduleTask[]>(INITIAL_TASKS);
  const [stocks, setStocks] = useState<StockItem[]>(INITIAL_STOCK);
  const [issuances, setIssuances] = useState<InventoryIssuance[]>(INITIAL_ISSUANCES);
  const [attendances, setAttendances] = useState<AttendanceLog[]>(INITIAL_ATTENDANCE_LOGS);
  const [repairs, setRepairs] = useState<RepairRequest[]>(INITIAL_REPAIRS);
  const [refuels, setRefuels] = useState<RefuelStatus[]>(INITIAL_REFUELS);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(INITIAL_EXPENSES);

  // Clock state
  const [time, setTime] = useState(new Date());
  
  // Sync Status state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueueSize, setSyncQueueSize] = useState(0);

  // QR Scanner mode
  const [showQrScanner, setShowQrScanner] = useState(false);

  // Drag to scroll for mobile nav menu
  const mobileNavRef = useRef<HTMLElement>(null);
  const [isDraggingNav, setIsDraggingNav] = useState(false);
  const [navStartX, setNavStartX] = useState(0);
  const [navScrollLeft, setNavScrollLeft] = useState(0);

  const [hasDraggedNav, setHasDraggedNav] = useState(false);

  const startDraggingNav = (e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
    setIsDraggingNav(true);
    setHasDraggedNav(false);
    if (!mobileNavRef.current) return;
    const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
    setNavStartX(pageX - mobileNavRef.current.offsetLeft);
    setNavScrollLeft(mobileNavRef.current.scrollLeft);
  };

  const stopDraggingNav = () => {
    setIsDraggingNav(false);
    // Note: hasDraggedNav is reset on next mousedown
  };

  const onDragNav = (e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
    if (!isDraggingNav || !mobileNavRef.current) return;
    const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
    const x = pageX - mobileNavRef.current.offsetLeft;
    const walk = (x - navStartX) * 1.5; // Drag speed multiplier
    
    if (Math.abs(walk) > 5) {
      setHasDraggedNav(true);
    }
    
    mobileNavRef.current.scrollLeft = navScrollLeft - walk;
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const unsubSync = syncManager.subscribe((size) => setSyncQueueSize(size));

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubSync();
    };
  }, []);

  // Sync state helpers
  const handleAddTask = (task: WorkScheduleTask) => {
    setTasks(prev => [task, ...prev]);
    // Send automated LINE notification
    sendLineTaskNotification(task, machinery).catch(err => {
      console.error("Error sending automatic LINE alert for task:", err);
    });
  };

  const handleUpdateTask = (updatedTask: WorkScheduleTask) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleAddStock = (item: StockItem) => {
    setStocks(prev => [item, ...prev]);
  };

  const handleAddIssuance = (issue: InventoryIssuance) => {
    setIssuances(prev => [issue, ...prev]);
  };

  const handleUpdateIssuance = (updatedIssue: InventoryIssuance) => {
    setIssuances(prev => prev.map(i => i.id === updatedIssue.id ? updatedIssue : i));
  };

  const handleUpdateStockQty = (id: string, newQty: number) => {
    setStocks(prev => prev.map(s => s.id === id ? { ...s, quantity: newQty } : s));
  };

  const handleAddMachinery = (mach: HeavyMachinery) => {
    setMachinery(prev => [mach, ...prev]);
  };

  const handleUpdateMachinery = (updatedMach: HeavyMachinery) => {
    setMachinery(prev => prev.map(m => m.id === updatedMach.id ? updatedMach : m));
  };

  const handleAddRepair = (rep: RepairRequest) => {
    setRepairs(prev => [rep, ...prev]);
    // Set machinery status under repair instantly
    setMachinery(prev => prev.map(m => m.id === rep.machineryId ? { ...m, status: 'under_repair' } : m));
    // Send automated LINE notification
    sendLineRepairNotification(rep, machinery).catch(err => {
      console.error("Error sending automatic LINE alert for repair:", err);
    });
  };

  const handleUpdateRepair = (updatedRep: RepairRequest) => {
    setRepairs(prev => prev.map(r => r.id === updatedRep.id ? updatedRep : r));
    // If completed transition machinery back
    if (updatedRep.status === 'completed') {
      setMachinery(prev => prev.map(m => m.id === updatedRep.machineryId ? { ...m, status: 'active' } : m));
    }
  };

  const handleDeleteRepair = (id: string) => {
    setRepairs(prev => prev.filter(r => r.id !== id));
  };

  const handleAddRefuel = (ref: RefuelStatus) => {
    setRefuels(prev => [ref, ...prev]);
  };

  const handleUpdateRefuel = (updatedRef: RefuelStatus) => {
    setRefuels(prev => prev.map(r => r.id === updatedRef.id ? updatedRef : r));
  };

  const handleAddExpense = (exp: ExpenseRecord) => {
    setExpenses(prev => [exp, ...prev]);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const handleAddAttendance = (log: AttendanceLog) => {
    setAttendances(prev => [log, ...prev]);
  };

  const handleUpdateAttendance = (updatedLog: AttendanceLog) => {
    setAttendances(prev => prev.map(a => a.id === updatedLog.id ? updatedLog : a));
  };

  // Nav items definition
  const sidebarNavItems = [
    { id: 'dashboard', label: 'Dashboard ข้อมูลหลัก', icon: LayoutDashboard },
    { id: 'schedule', label: 'ปฏิทินแผนงานช่าง', icon: Briefcase },
    { id: 'repairs', label: 'แจ้งซ่อมเครื่องยนต์', icon: Wrench },
    { id: 'inventory', label: 'คลังอะไหล่และสเปค', icon: Package },
    { id: 'machinery', label: 'สารบัตเครื่องจักร', icon: Building2 },
    { id: 'refuels', label: 'ขอรับเติมน้ำมัน', icon: Fuel },
    { id: 'expenses', label: 'บัญชีงบ & AI Advisor', icon: Coins },
    { id: 'attendance', label: 'ลงเวลากล้อง GPS', icon: UserCheck },
    { id: 'line', label: 'จำลอง LINE FLEX', icon: MessageSquare },
    { id: 'supabase', label: 'Database SQL', icon: Database },
  ];

  return (
    <div className={`min-h-screen ${currentStyle.rootBg} flex flex-col font-sans relative antialiased select-none transition-colors duration-300`} id="flowwork-app-root">
      
      {/* Background radial highlight glow decoration to promote modern premium bento look of SaaS platforms */}
      <div className={`absolute top-0 left-1/4 w-[500px] h-[500px] ${currentStyle.glow1} rounded-full blur-[120px] pointer-events-none transition-colors duration-300`}></div>
      <div className={`absolute bottom-10 right-1/4 w-[600px] h-[600px] ${currentStyle.glow2} rounded-full blur-[140px] pointer-events-none transition-colors duration-300`}></div>

      {/* 1. Brand Topbar */}
      <header className={`${currentStyle.topbarBg} sticky top-0 z-50 px-5 py-3.5 flex items-center justify-between transition-colors duration-300 md:rounded-b-2xl`} id="app-topbar">
        <div className="flex items-center gap-3">

          {/* Logo visual styled with premium soft identity */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-tr from-amber-400 to-yellow-200 rounded-xl flex items-center justify-center font-black text-amber-900 text-base shadow-[0_4px_12px_-2px_rgba(251,191,36,0.5)] border border-amber-100">
              FW
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-display font-bold text-sm tracking-tight text-stone-800">FlowWork CMMS</span>
                <span className="bg-amber-500 text-[9px] px-1.5 py-0.5 rounded-md font-bold text-stone-900 shadow-sm">360</span>
              </div>
              <span className="text-[10px] text-stone-500 font-medium tracking-wide">Enterprise Premium Platform</span>
            </div>
          </div>
        </div>

        {/* Real-time Clock display and theme picker bar */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Sync Status Badge */}
          <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wide transition-colors ${isOnline ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
            {isOnline ? (
               syncQueueSize > 0 ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5" />
            ) : <CloudOff className="w-3.5 h-3.5" />}
            <span>
              {isOnline 
                ? (syncQueueSize > 0 ? `Syncing (${syncQueueSize})...` : 'Online') 
                : `Offline (${syncQueueSize} pending)`}
            </span>
          </div>

          {/* QR Scanner Tool */}
          <button 
            onClick={() => setShowQrScanner(!showQrScanner)}
            className={`p-1.5 rounded-xl border transition-all ${showQrScanner ? 'bg-stone-800 text-white border-stone-800 shadow-md' : 'bg-white/60 text-stone-600 border-stone-200 hover:bg-stone-100'}`}
            title="สแกน QR Code หน้างาน"
          >
            <QrCode className="w-4 h-4" />
          </button>

          {/* 4 Multi-Color Template Selector */}
          <div className="flex items-center gap-1.5 bg-white/50 p-1.5 rounded-xl border border-black/5 shadow-sm" id="theme-selector-badge">
            <span className="hidden lg:inline text-[10px] uppercase font-bold tracking-wider px-1 text-stone-500">
              Premium Tones:
            </span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => changeTheme('yellow')} 
                className={`w-5 h-5 rounded-full bg-gradient-to-tr from-amber-200 to-yellow-100 hover:scale-110 active:scale-95 transition-all ring-2 shadow-sm ${theme === 'yellow' ? 'ring-amber-400 ring-offset-1 ring-offset-[#fffdf2]' : 'ring-transparent opacity-80'}`} 
                title="พรีเมียมเหลืองอ่อน (Premium Yellow)" 
              />
              <button 
                onClick={() => changeTheme('blue')} 
                className={`w-5 h-5 rounded-full bg-sky-300 hover:scale-110 active:scale-95 transition-all ring-2 shadow-sm ${theme === 'blue' ? 'ring-sky-500 ring-offset-1 ring-offset-[#f4f7fb]' : 'ring-transparent opacity-80'}`} 
                title="ธีมฟ้าพาสเทล (Soft Blue)" 
              />
              <button 
                onClick={() => changeTheme('green')} 
                className={`w-5 h-5 rounded-full bg-emerald-300 hover:scale-110 active:scale-95 transition-all ring-2 shadow-sm ${theme === 'green' ? 'ring-emerald-500 ring-offset-1 ring-offset-[#edf6f0]' : 'ring-transparent opacity-80'}`} 
                title="ธีมเขียวพาสเทล (Soft Green)" 
              />
              <button 
                onClick={() => changeTheme('white')} 
                className={`w-5 h-5 rounded-full bg-[#f4f2ee] border border-stone-300 hover:scale-110 active:scale-95 transition-all ring-2 shadow-sm ${theme === 'white' ? 'ring-stone-600 ring-offset-1 ring-offset-[#faf9f5]' : 'ring-transparent opacity-85'}`} 
                title="ธีมขาวมินิมอล (Soft White)" 
              />
            </div>
          </div>

          <div className={`hidden sm:flex items-center gap-3 ${currentStyle.clockBg} px-4 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md transition-colors duration-300`}>
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-mono font-bold tracking-tight">
              {time.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} น.
            </span>
            <span className="opacity-30">|</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {time.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </header>

      {/* 2. Main Frame body */}
      <div className="flex-1 flex" id="main-frame-panel">
        
        {/* Sidebar Nav (Permanent Desktop sidebar) */}
        <nav className={`w-64 ${currentStyle.sidebarBg} border-r hidden md:flex flex-col p-4 space-y-1 z-20 transition-all duration-300 rounded-r-3xl my-2`} id="desktop-sidebar-nav">
          <div className={`pb-3 px-2 text-[10px] uppercase font-bold tracking-widest ${currentStyle.sidebarHeader} border-b mb-3 flex items-center gap-1.5`}>
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>Premium Modules</span>
          </div>

          <div className="space-y-1 overflow-y-auto pr-1 flex-1">
            {sidebarNavItems.map(item => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all border cursor-pointer ${
                    active ? currentStyle.navActive : currentStyle.navInactive
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0`} />
                  {item.label}
                </button>
              );
            })}
          </div>
          
          <div className="pt-4 border-t border-black/5 mt-auto text-[10px] text-stone-400 text-center font-bold tracking-wide">
             FlowWork 360 • PREMIUM {theme.toUpperCase()}
          </div>
        </nav>

        {/* 3. Outer View Controller Container and Page Content Panel */}
        <main className={`flex-1 p-4 pb-24 md:pb-6 md:p-6 lg:p-7 overflow-y-auto ${currentStyle.mainBg} relative`} id="main-view-outlet">
          
          {activeTab === 'dashboard' && (
            <DashboardView 
              machinery={machinery} 
              expenses={expenses} 
              refuels={refuels} 
              stocks={stocks} 
              tasksCount={tasks.length} 
              onNavigate={handleNavigate}
            />
          )}

          {activeTab === 'schedule' && (
            <WorkScheduleView
              theme={theme}
              tasks={tasks}
              machinery={machinery}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              initialShowAddForm={autoOpenScheduleAddForm}
              onCloseAddForm={() => {
                setAutoOpenScheduleAddForm(false);
              }}
            />
          )}

          {activeTab === 'repairs' && (
            <RepairView
              repairs={repairs}
              machinery={machinery}
              onAddRepair={handleAddRepair}
              onUpdateRepair={handleUpdateRepair}
              onDeleteRepair={handleDeleteRepair}
              initialShowAddForm={autoOpenRepairAddForm}
              onCloseAddForm={() => {
                setAutoOpenRepairAddForm(false);
              }}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              stocks={stocks}
              issuances={issuances}
              onAddStock={handleAddStock}
              onAddIssuance={handleAddIssuance}
              onUpdateIssuance={handleUpdateIssuance}
              onUpdateStockQty={handleUpdateStockQty}
            />
          )}

          {activeTab === 'machinery' && (
            <HeavyMachineryView
              machinery={machinery}
              onAddMachinery={handleAddMachinery}
              onUpdateMachinery={handleUpdateMachinery}
            />
          )}

          {activeTab === 'refuels' && (
            <RefuelView
              refuels={refuels}
              machinery={machinery}
              onAddRefuel={handleAddRefuel}
              onUpdateRefuel={handleUpdateRefuel}
              onAddExpense={handleAddExpense}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpenseTrackerView
              expenses={expenses}
              machinery={machinery}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceView
              attendances={attendances}
              onAddAttendance={handleAddAttendance}
              onUpdateAttendance={handleUpdateAttendance}
            />
          )}

          {activeTab === 'line' && (
            <LineFlexBuilder />
          )}

          {activeTab === 'supabase' && (
            <DatabaseSchemaView />
          )}

        </main>
        
        {/* Mobile Filter / Nav Bottom Bar */}
        {/* MOBILE SLIDE NAVIGATION MENU (Smooth scrolling & Responsive) */}
        <nav 
          ref={mobileNavRef}
          onMouseDown={startDraggingNav}
          onMouseLeave={stopDraggingNav}
          onMouseUp={stopDraggingNav}
          onMouseMove={onDragNav}
          onTouchStart={startDraggingNav}
          onTouchEnd={stopDraggingNav}
          onTouchMove={onDragNav}
          className={`md:hidden fixed bottom-0 left-0 right-0 h-[72px] pb-1 ${currentStyle.topbarBg} flex items-center px-4 overflow-x-auto gap-3 z-50 hide-scrollbar rounded-t-[28px] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] transition-colors duration-300 scroll-smooth select-none`}
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
        >
          {sidebarNavItems.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            
            // Dynamic theme class mapping for active mobile nav item
            let mobileActiveThemeClasses = "";
            let mobileInactiveThemeClasses = "text-stone-500 hover:text-stone-700";
            let indicatorColor = "";
            
            if (theme === 'yellow') {
              mobileActiveThemeClasses = "bg-gradient-to-tr from-amber-200 to-yellow-100 text-amber-800 shadow-sm border border-amber-200/60";
              indicatorColor = "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]";
            } else if (theme === 'blue') {
              mobileActiveThemeClasses = "bg-gradient-to-tr from-sky-200 to-blue-100 text-sky-800 shadow-sm border border-sky-200/60";
              indicatorColor = "bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.6)]";
            } else if (theme === 'green') {
              mobileActiveThemeClasses = "bg-gradient-to-tr from-emerald-200 to-green-100 text-emerald-800 shadow-sm border border-emerald-200/60";
              indicatorColor = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]";
            } else if (theme === 'white') {
              mobileActiveThemeClasses = "bg-stone-800 text-white shadow-sm border border-stone-800";
              indicatorColor = "bg-stone-800 shadow-[0_0_8px_rgba(28,25,23,0.6)]";
            }

            return (
              <button
                key={item.id}
                onClick={(e) => {
                  if (hasDraggedNav) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                  handleNavigate(item.id);
                }}
                className={`shrink-0 flex flex-col items-center justify-center min-w-[50px] h-[54px] transition-all duration-300 relative mt-1 cursor-pointer ${
                  active ? "font-bold scale-105" : mobileInactiveThemeClasses
                }`}
              >
                {active && (
                   <span className={`absolute -top-1 w-[16px] h-[3px] rounded-full ${indicatorColor}`}></span>
                )}
                <div className={`p-1.5 rounded-2xl mb-0.5 flex items-center justify-center pointer-events-none ${active ? mobileActiveThemeClasses : 'bg-transparent text-stone-400'}`}>
                  <Icon className={`w-4 h-4`} />
                </div>
                <span className={`text-[8px] sm:text-[9px] truncate max-w-[48px] sm:max-w-full tracking-wider pointer-events-none ${active ? (theme === 'white' ? 'text-stone-800' : mobileActiveThemeClasses.split(' ')[2]) : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {showQrScanner && (
        <QrScannerModal 
          onClose={() => setShowQrScanner(false)} 
          onScan={(code) => console.log("Scanned:", code)} 
          machineries={machinery} 
        />
      )}
    </div>
  );
}
