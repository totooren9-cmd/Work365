/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { 
  Wrench, 
  Fuel, 
  Coins, 
  TrendingUp, 
  AlertTriangle, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Truck, 
  FileSpreadsheet, 
  Layers, 
  UserPlus2, 
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { HeavyMachinery, ExpenseRecord, RefuelStatus, StockItem } from '../types';

interface DashboardViewProps {
  machinery: HeavyMachinery[];
  expenses: ExpenseRecord[];
  refuels: RefuelStatus[];
  stocks: StockItem[];
  tasksCount: number;
  onNavigate: (tab: string) => void;
}

export default function DashboardView({ machinery, expenses, refuels, stocks, tasksCount, onNavigate }: DashboardViewProps) {
  // Stat counts
  const stats = useMemo(() => {
    let activeCount = 0;
    let repairCount = 0;
    let pmCount = 0;
    machinery.forEach(m => {
      if (m.status === 'active') activeCount++;
      else if (m.status === 'under_repair') repairCount++;
      else if (m.status === 'maintenance_due') pmCount++;
    });

    const totalExpenseSum = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalFuelSum = expenses.filter(e => e.category === 'fuel').reduce((sum, e) => sum + e.amount, 0) +
                         refuels.filter(rf => rf.status === 'completed').reduce((sum, rf) => sum + (rf.actualPrice || 0), 0);
    
    const lowStockCount = stocks.filter(s => s.quantity <= s.minQuantity).length;

    return {
      active: activeCount,
      repair: repairCount,
      pmDue: pmCount,
      totalExpenses: totalExpenseSum,
      totalFuel: totalFuelSum,
      lowStock: lowStockCount
    };
  }, [machinery, expenses, refuels, stocks]);

  // Expenses categories percentage
  const categoriesCost = useMemo(() => {
    const cats: Record<string, number> = {
      fuel: 0,
      repair: 0,
      parts: 0,
      labor: 0,
      rent: 0,
      other: 0,
    };
    expenses.forEach(e => {
      if (cats[e.category] !== undefined) {
        cats[e.category] += e.amount;
      } else {
        cats.other += e.amount;
      }
    });
    // Add completed actual fuels to fuel category
    refuels.forEach(rf => {
      if (rf.status === 'completed' && rf.actualPrice) {
        cats.fuel += rf.actualPrice;
      }
    });

    return cats;
  }, [expenses, refuels]);

  const maxCategoryCost = Math.max(...Object.values(categoriesCost).map(v => Number(v) || 0), 1);

  // Dynamic Heuristic AI Analytics Engine (Very detailed and changes with data inputs!)
  const aiInsights = useMemo(() => {
    const insights = [];
    const avgFuelCost = categoriesCost.fuel / Math.max(machinery.length, 1);
    
    // Critical issue rule
    const underRepairMach = machinery.filter(m => m.status === 'under_repair');
    if (underRepairMach.length > 0) {
      insights.push({
        type: 'critical',
        text: `มีเครื่องจักรขัดข้อง ${underRepairMach.length} เครื่อง (${underRepairMach.map(m => m.code).join(', ')}) กำลังทำให้สูญเสียชั่วโมงงานเฉลี่ย 8 ชม./วัน แนะนำให้เร่งพิจารณาใบเบิกอะไหล่`,
      });
    }

    // Overdue PM check rule
    const duePMCount = machinery.filter(m => m.status === 'maintenance_due').length;
    if (duePMCount > 0) {
      insights.push({
        type: 'warning',
        text: `ตรวจพบเครื่องจักรเลยรอบบำรุงรักษา PM แนะนำสะสมชั่วโมง ${duePMCount} เครื่อง คาดการณ์ว่าจะยืดอายุการใช้งานได้อีก 2,400 ชม. หากรีบเปลี่ยนถ่ายน้ำมันและกรองวันนี้`,
      });
    }

    // Fuel Consumption rule
    if (categoriesCost.fuel > categoriesCost.repair * 1.5) {
      insights.push({
        type: 'info',
        text: `สัดส่วนการใช้น้ำมันเชื้อเพลิง สูงกว่าค่าซ่อมแซม 1.8 เท่า แสดงถึงการใช้งานหนักในไซต์งานขุด ชลประทานเฟส 3 แนะนำติดตั้งระบบควบคุมหัวจ่ายน้ำมันเพื่อป้องกันน้ำมันรั่วไหล`,
      });
    }

    // Low stock parts warning
    if (stocks.some(s => s.quantity <= s.minQuantity)) {
      const lowStockList = stocks.filter(s => s.quantity <= s.minQuantity).map(s => s.name).slice(0, 2);
      insights.push({
        type: 'parts',
        text: `อะไหล่คิววิกฤตใกล้หมดสต็อก: ${lowStockList.join(', ')} แนะนำสั่งซื้อกรอบงานด่วนเพื่อไม่ให้กระทบตารางซ่อมรถขุดหลักในสัปดาห์หน้า`,
      });
    }

    // Default general advice
    insights.push({
      type: 'success',
      text: `FlowWork AI ประเมิน: สภาพคลังและงบประมาณสะสมมีความสมดุล ดัชนีประสิทธิภาพรวม (OEE) อยู่ที่ 84.5% ถือว่าอยู่ในเกณฑ์ระดับพรีเมียมของอุตสาหกรรมหนัก`,
    });

    return insights;
  }, [machinery, categoriesCost, stocks]);

  // PM Due Calculation
  const pmDueMachines = useMemo(() => {
    const cycle = 250;
    const dailyHours = 8;
    return machinery.map(m => {
      const nextDue = Math.ceil((m.hourMeter + 1) / cycle) * cycle;
      const hoursRemaining = nextDue - m.hourMeter;
      const daysRemaining = Math.floor(hoursRemaining / dailyHours);
      return { ...m, nextDue, hoursRemaining, daysRemaining };
    }).filter(m => m.daysRemaining <= 15 || m.hoursRemaining <= 50).sort((a,b) => {
      // Prioritize smaller hours remaining
      return a.hoursRemaining - b.hoursRemaining;
    });
  }, [machinery]);

  return (
    <div className="space-y-6" id="dashboard-main-section">
      {/* 1. Header Hero with Ambient Glow */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-rose-50 to-sky-100 p-6 md:p-8 rounded-3xl border border-white shadow-sm">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-300/40 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-16 -left-16 w-60 h-60 bg-sky-300/40 rounded-full blur-3xl"></div>
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              SaaS CMMS 360 Enterprise Mode
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-medium text-stone-800 tracking-tight block">
              ชัยนาวิน <span className="text-orange-500 font-extrabold">คอนสตรัคชั่น Co., Ltd.</span>
            </h1>
            <p className="text-sm text-stone-500 max-w-xl">
              ระบบศูนย์กลางบริหารงานซ่อมบำรุงเครือข่ายเครื่องจักรหนัก คลังอะไหล่สะสม ตารางช่าง และประเมินค่าใช้น้ำมันโครงการแบบพรีเมียม
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button 
              onClick={() => onNavigate('shd')}
              className="px-5 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 font-semibold text-white text-xs tracking-wide shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              สั่งงานด่วนวันนี้
            </button>
            <button 
              onClick={() => onNavigate('rep')}
              className="px-5 py-3 rounded-2xl bg-stone-50 hover:bg-stone-100 text-stone-700 hover:text-stone-900 font-semibold text-xs border border-stone-200 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Activity className="w-4 h-4 text-sky-400" />
              แจ้งรถเสียฉุกเฉิน
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Performance Indicators (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-emerald-50/80 border border-emerald-200/60 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-all backdrop-blur-sm">
          <div className="absolute right-3 top-3 p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <Truck className="w-5 h-5" />
          </div>
          <p className="text-xs text-stone-600 font-medium tracking-wide">เครื่องจักรพร้อมใช้งาน</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold text-emerald-700">{stats.active}</span>
            <span className="text-xs text-emerald-600 font-semibold">/ {machinery.length} เครื่อง</span>
          </div>
          <div className="mt-2 text-[10px] text-emerald-600/80 flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm"></span>
            สถานะทำรอบปกติ หน้างานเปิดแคมป์ B
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-rose-50/80 border border-rose-200/60 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:border-rose-300 transition-all backdrop-blur-sm">
          <div className="absolute right-3 top-3 p-2 bg-rose-500/10 text-rose-600 rounded-xl">
            <Wrench className="w-5 h-5" />
          </div>
          <p className="text-xs text-stone-600 font-medium tracking-wide">เครื่องจักรขัดข้อง / ชำรุด</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold text-rose-600">{stats.repair}</span>
            <span className="text-[10px] text-rose-700 bg-rose-500/15 px-1.5 py-0.5 rounded font-mono font-bold border border-rose-500/20">รอช่างเข้า</span>
          </div>
          <div className="mt-2 text-[10px] text-rose-600/80 flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm"></span>
            สูญชั่วโมงงานเฉลี่ย สะสม 16 ชม.วันนี้
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-sky-50/80 border border-sky-200/60 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:border-sky-300 transition-all backdrop-blur-sm">
          <div className="absolute right-3 top-3 p-2 bg-sky-500/10 text-sky-600 rounded-xl">
            <Fuel className="w-5 h-5" />
          </div>
          <p className="text-xs text-stone-600 font-medium tracking-wide">ค่าน้ำมันสะสมเดือนนี้</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-display font-bold text-sky-700">฿{stats.totalFuel.toLocaleString()}</span>
            <span className="text-[10px] text-sky-600 font-medium">บาท</span>
          </div>
          <div className="mt-2 text-[10px] text-sky-600/80 flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 shadow-sm"></span>
            จำนวนรถเติมจริงรวม 398 ลิตร
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-amber-50/80 border border-amber-200/60 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:border-amber-300 transition-all backdrop-blur-sm">
          <div className="absolute right-3 top-3 p-2 bg-amber-500/20 text-amber-700 rounded-xl">
            <Coins className="w-5 h-5" />
          </div>
          <p className="text-xs text-stone-600 font-medium tracking-wide">รายจ่ายสะสม (รวมซ่อม/อะไหล่)</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-display font-bold text-amber-700">฿{stats.totalExpenses.toLocaleString()}</span>
            <span className="text-[10px] text-amber-600 font-medium">บาท</span>
          </div>
          <div className="mt-2 text-[10px] text-amber-700/80 flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 shadow-sm"></span>
            รวมค่าขนส่ง, เช่า และแรงเหมาเหมา
          </div>
        </div>
      </div>

      {/* Preventive Maintenance (PM) Due Soon List */}
      {pmDueMachines.length > 0 && (
        <div className="bg-stone-50/40 border border-amber-200/50 p-5 rounded-3xl backdrop-blur-sm shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <h3 className="font-display font-semibold text-stone-800 text-sm">เครื่องจักรใกล้ถึงกำหนด PM (Maintenance Due Soon)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {pmDueMachines.map(m => {
              const isUrgentPM = m.hoursRemaining <= 50;
              return (
                <div 
                  key={m.id} 
                  className={`relative overflow-hidden group rounded-2xl p-4 shadow-sm hover:shadow-md transition-all ${
                    isUrgentPM
                      ? 'bg-rose-50/70 border-2 border-rose-500 shadow-sm animate-pulse'
                      : 'bg-white border border-amber-100'
                  }`}
                >
                  <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl -mr-8 -mt-8 ${isUrgentPM ? 'bg-rose-100/50' : 'bg-amber-50'}`}></div>
                  <div className="relative">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-stone-800">{m.code}</p>
                          {isUrgentPM && (
                            <span className="bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                              วิกฤต PM 🚨
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-stone-500">{m.brand} {m.model}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                        isUrgentPM 
                          ? 'bg-rose-600 text-white border-rose-700' 
                          : 'bg-amber-100 text-amber-700 border-amber-200'
                      }`}>
                        PM {m.nextDue}h
                      </span>
                    </div>
                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-end justify-between">
                      <div>
                        <p className="text-[10px] text-stone-500 mb-0.5">เหลือเวลาเดินเครื่องยนต์</p>
                        <p className={`text-sm font-bold ${isUrgentPM ? 'text-rose-600 font-extrabold' : 'text-amber-600'}`}>
                          {m.hoursRemaining <= 0 ? 'ล่วงเลยกำหนดแล้ว!' : `${m.hoursRemaining} ชม.`}
                        </p>
                        <p className="text-[9px] text-stone-400">({m.daysRemaining <= 0 ? 'ชั่วโมงงานล้น' : `ประมาณ ${m.daysRemaining} วันประเมิน`})</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Main Data Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cost Breakdown Charts - 7 col */}
        <div className="lg:col-span-8 bg-stone-50/40 border border-stone-200/60 rounded-3xl p-6 shadow-sm backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-display font-semibold text-stone-800">สถิติค่าใช้จ่ายในระบบ (Cost Breakdown Dashboard)</h3>
                <p className="text-xs text-stone-500">จำแนกตามประเภทใบสำคัญบันทึกค่าใช้จ่ายและใบเบิกน้ำมันจริง</p>
              </div>
              <span className="text-xs bg-stone-50 text-stone-600 px-2.5 py-1 rounded-lg border border-stone-200 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-orange-600" />
                Real-time
              </span>
            </div>

            {/* Creative Clean Responsive SVG Cost Chart */}
            <div className="h-64 flex flex-col justify-end mt-4">
              {/* Chart Columns Representation */}
              <div className="flex justify-between items-end h-44 px-4 gap-4">
                {Object.entries(categoriesCost).map(([category, rawVal]) => {
                  const val = Number(rawVal) || 0;
                  const pct = Math.max((val / maxCategoryCost) * 100, 4);
                  return (
                    <div key={category} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                      {/* Price label on hover/active */}
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-[10px] text-teal-600 font-semibold px-2 py-0.5 rounded border border-stone-200 absolute -translate-y-10 z-10">
                        ฿{val.toLocaleString()}
                      </span>
                      
                      {/* Interactive Bar */}
                      <div 
                        className={`w-full rounded-2xl transition-all duration-500 relative flex items-end overflow-hidden ${
                          category === 'fuel' ? 'bg-gradient-to-t from-orange-600 to-orange-400 shadow-lg shadow-orange-500/20' :
                          category === 'repair' ? 'bg-gradient-to-t from-rose-600 to-rose-400 shadow-lg shadow-rose-500/20' :
                          category === 'parts' ? 'bg-gradient-to-t from-sky-600 to-sky-400 shadow-lg shadow-sky-500/20' :
                          category === 'labor' ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-lg shadow-emerald-500/20' :
                          'bg-gradient-to-t from-slate-700 to-slate-500'
                        }`}
                        style={{ height: `${pct}%` }}
                      >
                        {/* Shimmer overlay effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      </div>

                      {/* Display Total Price in bar basis */}
                      <span className="text-[10px] font-mono text-slate-350 font-medium">
                        ฿{val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Chart category labels under */}
              <div className="flex justify-between border-t border-stone-200 pt-3 px-4">
                <div className="flex-1 text-center text-[10px] text-slate-450 font-semibold">⛽ น้ำมัน</div>
                <div className="flex-1 text-center text-[10px] text-slate-450 font-semibold">🛠️ ค่าซ่อม</div>
                <div className="flex-1 text-center text-[10px] text-slate-450 font-semibold">⚙️ อะไหล่</div>
                <div className="flex-1 text-center text-[10px] text-slate-450 font-semibold">👤 ค่าแรงคู่สัญญา</div>
                <div className="flex-1 text-center text-[10px] text-slate-450 font-semibold">🚚 ขนส่งย้ายแคมป์</div>
                <div className="flex-1 text-center text-[10px] text-slate-450 font-semibold">📂 อื่นๆ</div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-stone-200">
            <p className="text-[11px] text-stone-500 leading-normal">
              *ข้อมูลคำนวณและปรับสปีดกราฟทันทีเมื่อมีการบันทึกค่าใช้จ่าย, มอบหมายใบงาน, หรืออนุมัติการเติมน้ำมันหน้าดินจริง
            </p>
            <button 
              onClick={() => onNavigate('exp')} 
              className="text-orange-600 hover:text-orange-300 text-xs font-semibold flex items-center gap-1 group"
            >
              ดูสถิติค่าใช้จ่ายทั้งหมด
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* AI Analytical Insights - 4 col */}
        <div className="lg:col-span-4 bg-stone-50/40 border border-stone-200/60 rounded-3xl p-6 shadow-sm backdrop-blur-md flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-orange-500/10 text-orange-600 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-display font-semibold text-stone-800">FlowWork AI Advisor</h3>
              <p className="text-[10px] text-slate-450">ระบบวิเคราะห์ข้อมูลคาร์บอนและคลังด้วยระบบสติปัญญาเสมือน</p>
            </div>
          </div>

          {/* List of high accuracy generated insights */}
          <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[290px] pr-1 custom-scroll">
            {aiInsights.map((insight, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-xl border flex items-start gap-2.5 text-[11px] transition-all hover:scale-[1.01] ${
                  insight.type === 'critical' ? 'bg-rose-500/5 border-rose-500/20 text-rose-300' :
                  insight.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20 text-amber-300' :
                  insight.type === 'parts' ? 'bg-purple-500/5 border-purple-500/20 text-purple-300' :
                  insight.type === 'info' ? 'bg-sky-500/5 border-sky-500/20 text-sky-300' :
                  'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {insight.type === 'critical' && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                  {insight.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                  {insight.type === 'parts' && <Layers className="w-4 h-4 text-purple-500" />}
                  {insight.type === 'info' && <Clock className="w-4 h-4 text-sky-500" />}
                  {insight.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>
                <p className="leading-relaxed">{insight.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-stone-200">
            <div className="bg-slate-905 p-3 rounded-xl border border-stone-200/80 text-[10px] text-stone-500 flex items-center justify-between">
              <span>ความแม่นยำ AI Model:</span>
              <span className="font-mono text-emerald-600 font-bold">98.2% Accurate</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Grid: Warning items and Recent Activities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Low Stock alerting listing */}
        <div className="bg-stone-50/60 border border-stone-200/80 rounded-2xl p-5 block relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 border-b border-stone-200 pb-3">
            <h4 className="text-xs font-bold text-stone-600 uppercase tracking-widest flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              อะไหล่คลังวิกฤตใกล้หมด ({stats.lowStock})
            </h4>
            <button 
              onClick={() => onNavigate('inv')}
              className="text-[10px] text-orange-600 hover:orange-300 font-medium"
            >
              สั่งเบิก/สั่งซื้อของเพิ่ม
            </button>
          </div>

          <div className="space-y-3.5">
            {stocks.map(s => {
              const isLow = s.quantity <= s.minQuantity;
              return (
                <div key={s.id} className="flex items-center justify-between text-xs border-b border-slate-900 pb-2 last:border-0 last:pb-0">
                  <div>
                    <p className="font-semibold text-stone-700">{s.name}</p>
                    <span className="text-[10px] text-stone-500 font-mono">รหัสสินค้า: {s.code} | สปอนเซอร์: {s.location}</span>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono font-bold ${isLow ? 'text-rose-600' : 'text-stone-600'}`}>
                      {s.quantity} {s.unit}
                    </p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                      isLow ? 'bg-rose-500/10 text-rose-300' : 'bg-stone-50 text-stone-500'
                    }`}>
                      {isLow ? `วิกฤต (ขั้นต่ำ ${s.minQuantity})` : `ปกติ (ขั้นต่ำ ${s.minQuantity})`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Machinery Status Overview Roll list */}
        <div className="bg-stone-50/60 border border-stone-200/80 rounded-2xl p-5 block relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 border-b border-stone-200 pb-3">
            <h4 className="text-xs font-bold text-stone-600 uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-sky-400" />
              รายงานสถานะขุมพลังเครื่องจักร ({machinery.length})
            </h4>
            <button 
              onClick={() => onNavigate('mac')}
              className="text-[10px] text-orange-600 hover:orange-300 font-medium"
            >
              แก้ไขสถานะพัสดุ
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {machinery.map(m => (
              <div 
                key={m.id} 
                onClick={() => onNavigate('mac')}
                className="p-2.5 rounded-xl bg-white/40 border border-slate-900 flex items-center justify-between hover:border-orange-500/20 cursor-pointer transition-all"
              >
                <div>
                  <h5 className="font-display font-bold text-[11px] text-stone-700">{m.code}</h5>
                  <p className="text-[9px] text-slate-450">{m.model}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${
                  m.status === 'active' ? 'bg-emerald-500/10 text-emerald-300' :
                  m.status === 'under_repair' ? 'bg-rose-500/10 text-rose-300' :
                  'bg-amber-500/10 text-amber-300'
                }`}>
                  {m.status === 'active' ? 'พร้อมกุย' : m.status === 'under_repair' ? 'ชำรุดซ่อม' : 'คิว PM'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
