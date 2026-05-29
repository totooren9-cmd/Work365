/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  Search, 
  Plus, 
  Trash2, 
  Bot, 
  LineChart, 
  TrendingUp, 
  Filter, 
  FileSpreadsheet, 
  Zap, 
  Send 
} from 'lucide-react';
import { ExpenseRecord, HeavyMachinery } from '../types';

interface ExpenseTrackerViewProps {
  expenses: ExpenseRecord[];
  machinery: HeavyMachinery[];
  onAddExpense: (exp: ExpenseRecord) => void;
  onDeleteExpense: (id: string) => void;
}

export default function ExpenseTrackerView({ expenses, machinery, onAddExpense, onDeleteExpense }: ExpenseTrackerViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // New expense form state
  const [formCategory, setFormCategory] = useState<'fuel' | 'repair' | 'spare_parts' | 'payroll' | 'purchase'>('repair');
  const [formDesc, setFormDesc] = useState('');
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formLoc, setFormLoc] = useState('ไซต์ก่อสร้างลำพูน ไฮเทค');
  const [formMach, setFormMach] = useState('');
  const [formRecorder, setFormRecorder] = useState('อาร์ต ผู้คุมบัญชีหลัก');

  // AI Cost Advisor Chat Emulator State
  const [aiChatInput, setAiChatInput] = useState('');
  const [aiChatResponses, setAiChatResponses] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { 
      sender: 'ai', 
      text: 'สวัสดีครับ! ผมคือ AI Cost Advisor 🤖 วิเคราะห์งบประมาณโครงการชลประทานเวิร์คกรุ๊ป ตรวจจับพบว่า ค่าใช้จ่ายซ่อมแซมกระบอกไฮดรอลิกของรถตักดิน EXC-CAT320-01 มีแนวโน้มสะสมสูงขึ้น 15% จากรอบอายุงาน PM แนะนำประเมินเปลี่ยนสเปคซีลแอร์เพื่อเซฟคอสประยุกต์' 
    }
  ]);

  // Sum categories
  const metrics = useMemo(() => {
    let total = expenses.reduce((sum, e) => sum + e.amount, 0);
    let fuelTotal = expenses.filter(e => e.category === 'fuel').reduce((sum, e) => sum + e.amount, 0);
    let repairTotal = expenses.filter(e => e.category === 'repair' || e.category === 'parts').reduce((sum, e) => sum + e.amount, 0);
    let payrollTotal = expenses.filter(e => e.category === 'labor').reduce((sum, e) => sum + e.amount, 0);

    return {
      total,
      fuelTotal,
      repairTotal,
      payrollTotal
    };
  }, [expenses]);

  // Filtered expenses list
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchSearch = e.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.siteLocation.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = categoryFilter === 'all' || e.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [expenses, searchTerm, categoryFilter]);

  // Form submission handler
  const handleAddNewExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDesc || formAmount <= 0) return;

    const newExp: ExpenseRecord = {
      id: `exp-${Math.floor(Math.random() * 900) + 100}`,
      date: new Date().toISOString().split('T')[0],
      category: formCategory,
      description: formDesc,
      amount: Number(formAmount),
      siteLocation: formLoc,
      recordedBy: formRecorder,
      machineryId: formMach || undefined
    };

    onAddExpense(newExp);
    
    // Reset fields
    setFormDesc('');
    setFormAmount(0);
    setFormMach('');
    setShowAddForm(false);
  };

  // AI Assistant Chat Simulator Engine
  const handleAiChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiChatInput) return;

    const userText = aiChatInput;
    const newHistory = [...aiChatResponses, { sender: 'user' as const, text: userText }];
    setAiChatResponses(newHistory);
    setAiChatInput('');

    // Generate simulated AI predictive answers
    setTimeout(() => {
      let reply = 'ขออภัยครับ ข้อมูลตัวเหนี่ยวนำรถกำลังคำนวณอยู่พยากรณ์';
      const promptLower = userText.toLowerCase();

      if (promptLower.includes('ลด') || promptLower.includes('ประหยัด')) {
        reply = '💡 [AI Cost Intelligence] เพื่อประหยัดงบเฉลี่ยสูงสุดใน 3 เดือนแรก: \n1. เปิดตารางตรวจสอบประวัติเติมน้ำมัน (แจ้งขอสิทธิ์ก่อนเติมจริง) ซึ่งจะยับยั้งการใช้น้ำมันเกินโควตาลงได้ 8-12%\n2. รีบซ่อมบำรุงตามมาตรวัดแชสซี (Hour-meter) หากล้อขยับเดินเกินรอบ PM แสนกิโลเมตร เพื่อเลี่ยงความชำรุดลามหม้อน้ำ.';
      } else if (promptLower.includes('ค่าใช้จ่าย') || promptLower.includes('รวม')) {
        reply = `📊 [AI Live Cost Summary] ขณะนี้โครงการมีค่าใช้จ่ายรวม ฿${metrics.total.toLocaleString()} บาท แบ่งเป็นค่าน้ำมันเชื้อเพลิงสะสม ฿${metrics.fuelTotal.toLocaleString()} (คิดเป็น ${((metrics.fuelTotal / metrics.total) * 100).toFixed(1)}% ของงบทั้งหมด) แผนกบัญชีแนะนำประคองเครดิตน้ำมันกับปั๊มพันธมิตรลำพูนร่วม`;
      } else if (promptLower.includes('ซ่อม') || promptLower.includes('อะไหล่')) {
        reply = `🛠️ [Predictive Maintenance Audit] ตรวจพบอัตรางานด่วนซ่อมเครื่องจักรฉุกเฉินหนาแน่นช่วงสัปดาห์นี้ เฉลี่ย 1.5 เคสซ่อมต่อวัน อสังหาริมทรัพย์ที่รับงบมากที่สุดคือ ฝาครอบสายพานรถบดลมแอลอีดี คัดเลือกซื้อชิ้นส่วนราคาส่งจากคลังพัสดุสะสม`;
      } else {
        reply = `🤖 [FlowWork Brain AI] ได้รับคำถามเกี่ยวกับระบบบริหารงบ CMMS เรียบร้อยแล้ว ขณะนี้จากการติดตามตัวเลขเครื่องจักรหนัก ${machinery.length} คัน ตรวจวัดเกณฑ์งบประมาณรายวันอยู่ในสัดส่วนดีเยี่ยม (ปลอดภัยต่ำกว่ากรอบควบคุมงบประมาณค่าเสียงานชลประทาน 14%)`;
      }

      setAiChatResponses(p => [...p, { sender: 'ai' as const, text: reply }]);
    }, 1300);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="expense-track-main">
      {/* 1. Left Costs Sheets (8 Columns) */}
      <div className="lg:col-span-8 bg-stone-50/40 border border-stone-200 rounded-2xl p-5 shadow-sm backdrop-blur-md flex flex-col justify-between">
        <div>
          {/* Header Row KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-b border-stone-200 pb-5">
            <div className="bg-white p-3 rounded-xl border border-slate-900">
              <span className="text-[9px] text-slate-450 font-bold block mb-0.5">งบจ่ายสะสมโครงการ</span>
              <span className="text-sm font-mono text-orange-600 font-extrabold">฿{metrics.total.toLocaleString()}</span>
              <span className="text-[8px] text-slate-500 block leading-tight mt-0.5">รวมทุกหมวดหมู่ภาษี</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-900">
              <span className="text-[9px] text-slate-450 font-bold block mb-0.5">ต้นทุนน้ำมันเชื้อเพลิง</span>
              <span className="text-sm font-mono text-teal-600 font-extrabold">฿{metrics.fuelTotal.toLocaleString()}</span>
              <span className="text-[8px] text-slate-500 block leading-tight mt-0.5">จากบิลเติมจริงเสร็จสิ้น</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-900">
              <span className="text-[9px] text-slate-450 font-bold block mb-0.5">ส่วนซ่อม / พัสดุแสตมป์</span>
              <span className="text-sm font-mono text-cyan-400 font-extrabold">฿{metrics.repairTotal.toLocaleString()}</span>
              <span className="text-[8px] text-slate-500 block leading-tight mt-0.5">สเปคอะไหล่ & ซีลช็อป</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-900">
              <span className="text-[9px] text-slate-450 font-bold block mb-0.5">บุคลากร / เบี้ยขยัน</span>
              <span className="text-sm font-mono text-emerald-600 font-extrabold">฿{metrics.payrollTotal.toLocaleString()}</span>
              <span className="text-[8px] text-slate-500 block leading-tight mt-0.5">ลงกะทำงานล่วงเวลาสะสม</span>
            </div>
          </div>

          {/* Table list controls */}
          <div className="flex flex-col md:flex-row gap-2.5 justify-between items-center mt-4">
            <div className="flex items-center gap-2 w-full md:w-auto">
              {/* Category filter pills */}
              <div className="flex bg-white p-1 rounded-xl border border-slate-900 overflow-x-auto select-none">
                {([
                  { id: 'all', label: 'ทั้งหมด' },
                  { id: 'fuel', label: '⛽ น้ำมัน' },
                  { id: 'repair', label: '🛠️ งานซ่อม' },
                  { id: 'spare_parts', label: '📦 อะไหล่' },
                  { id: 'payroll', label: '👤 เลเวลงาน' }
                ] as const).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setCategoryFilter(tab.id)}
                    className={`px-2.5 py-1 rounded text-[9px] font-bold transition-all shrink-0 ${
                      categoryFilter === tab.id
                        ? 'bg-orange-500 text-white shadow'
                        : 'text-stone-500 hover:text-slate-250'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={() => window.print()}
                className="p-1 px-3 bg-white hover:bg-stone-50 text-stone-600 border border-stone-200 rounded-xl text-[10px] font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                ส่งออก Excel / PDF
              </button>

              <button
                onClick={() => setShowAddForm(true)}
                className="bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-xl text-[10px] font-bold text-white shadow transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                เพิ่มบันทึกรายจ่าย
              </button>
            </div>
          </div>

          {/* Sheets List table */}
          <div className="mt-4">
            {showAddForm ? (
              /* Add expense form */
              <form onSubmit={handleAddNewExpense} className="space-y-4 bg-white/50 p-5 rounded-2xl border border-stone-200">
                <h3 className="text-xs font-bold text-orange-600 uppercase tracking-wider">💰 เพิ่มบันทึกสถิติงบฝากจ่าย</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">คำอธิบายรายจ่าย</label>
                    <input
                      type="text"
                      className="w-full bg-stone-50 border border-slate-755 rounded-xl px-4 py-2 text-stone-800 outline-none text-xs focus:border-orange-500"
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      placeholder="เช่น ซื้อไดชาร์จไฟรถบดล้อยาง GD511 หรือ เช็คระยะแบคโฮ 2,000 ชม"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">หมวดหมู่รายจ่าย</label>
                    <select
                      className="w-full bg-stone-50 border border-slate-755 rounded-xl px-3 py-2 text-stone-700 text-xs"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                    >
                      <option value="fuel">น้ำมันเชื้อเพลิงค่าน้ำ (Fuel)</option>
                      <option value="repair">ซ่อมเครื่องจักรวิศวกรรม (Repair Work)</option>
                      <option value="spare_parts">พัสดุและจัดหาอะไหล่ (Spare Parts)</option>
                      <option value="payroll">เงินเดือนวิศวกร / เบี้ยเลี้ยง (Payroll)</option>
                      <option value="purchase">จัดซื้อจัดจ้างเครื่องยนต์ใหม่ (Equipment Asset Capital)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">จำนวนงบจ่ายจริง (บาท)</label>
                    <input
                      type="number"
                      className="w-full bg-stone-50 border border-slate-755 rounded-xl px-4 py-2 text-stone-800 outline-none text-xs"
                      value={formAmount}
                      onChange={(e) => setFormAmount(Number(e.target.value))}
                      placeholder="เช่น 3500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">หน้างานที่เกิดรายจ่าย</label>
                    <input
                      type="text"
                      className="w-full bg-stone-50 border border-slate-755 rounded-xl px-4 py-2 text-stone-700 outline-none text-xs"
                      value={formLoc}
                      onChange={(e) => setFormLoc(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">เชื่อมโยงรถคันใด (ถ้ามี)</label>
                    <select
                      className="w-full bg-stone-50 border border-slate-755 rounded-xl px-3 py-2 text-stone-700 text-xs"
                      value={formMach}
                      onChange={(e) => setFormMach(e.target.value)}
                    >
                      <option value="">-- ไม่เชื่อมโยงเฉพาะเจาะจง --</option>
                      {machinery.map(m => (
                        <option key={m.id} value={m.id}>{m.code} - {m.model}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="bg-stone-50 hover:bg-stone-50 text-stone-500 hover:text-stone-700 px-4 py-2 rounded-xl text-xs font-semibold"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow"
                  >
                    บันทึกงบทันทีกระทบยอด
                  </button>
                </div>
              </form>
            ) : (
              /* Grid sheets records table */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-2.5">วันที่</th>
                      <th className="py-2.5">หมวดหมู่</th>
                      <th className="py-2.5">รายการความประสงค์การใช้</th>
                      <th className="py-2.5 text-right">ยอดเงินจ่ายจริง (฿)</th>
                      <th className="py-2.5 text-center">ค่ายสังกัด</th>
                      <th className="py-2.5 text-right">การกระทำ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="text-slate-250 hover:bg-stone-50/40">
                        <td className="py-3 font-mono font-bold">{exp.date}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            exp.category === 'fuel' ? 'bg-teal-500/10 text-teal-300' :
                            exp.category === 'repair' ? 'bg-cyan-500/10 text-cyan-300' :
                            exp.category === 'spare_parts' ? 'bg-amber-500/10 text-amber-300' :
                            exp.category === 'payroll' ? 'bg-emerald-500/10 text-emerald-300' :
                            'bg-violet-500/10 text-violet-300'
                          }`}>
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3 font-medium max-w-[200px] truncate" title={exp.description}>
                          {exp.description}
                        </td>
                        <td className="py-3 text-right font-mono font-black text-stone-800">
                          {exp.amount.toLocaleString()}
                        </td>
                        <td className="py-3 text-center text-[10px] text-stone-500 truncate max-w-[100px]" title={exp.siteLocation}>
                          {exp.siteLocation}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => onDeleteExpense(exp.id)}
                            className="p-1 hover:bg-rose-500/15 text-slate-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="ลบรายการนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic status footer */}
        <div className="bg-white/40 border-t border-stone-200 mt-4 pt-3 text-[11px] text-slate-455 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10px] text-stone-500">
            <LineChart className="w-4 h-4 text-orange-600 shrink-0" />
            ตัววิเคราะห์ค่าเฉลี่ยใช้กลยุทธ์ประหยัดคุ้มทุนสกัดปราบการคอร์รัปชันยอดบิดน้ำมันโครงการเรียบร้อย
          </span>
          <span className="font-mono text-slate-405">Budget Checked 360</span>
        </div>
      </div>

      {/* 2. Right Interactive AI Cost Assistant Advisor (4 Columns) */}
      <div className="lg:col-span-4 bg-stone-50/40 border border-stone-200 rounded-2xl p-5 shadow-sm backdrop-blur-md flex flex-col justify-between">
        <div className="space-y-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="border-b border-stone-200 pb-2 flex items-center gap-2">
              <Bot className="w-4 h-4 text-orange-600" />
              <h3 className="text-xs uppercase font-bold text-stone-500 tracking-wider">AI Cost Predictive Advisor</h3>
            </div>

            {/* Smart chatbot simulated interface scrolling */}
            <div className="space-y-3.5 max-h-[300px] overflow-y-auto mt-3.5 pr-1 text-xs">
              {aiChatResponses.map((msg, i) => (
                <div 
                  key={i} 
                  className={`p-3 rounded-2xl leading-relaxed ${
                    msg.sender === 'ai' 
                      ? 'bg-white border border-stone-200/80 text-stone-700' 
                      : 'bg-orange-500/10 text-orange-300 border border-orange-500/20 text-right self-end'
                  }`}
                >
                  <span className="block text-[8px] font-bold uppercase mb-0.5 text-slate-450 tracking-wider">
                    {msg.sender === 'ai' ? '🤖 FlowWork Predictive Brain' : '👤 อาร์ต ผู้คุมงบ'}
                  </span>
                  <p className="whitespace-pre-line text-[11px] leading-relaxed select-text">{msg.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* User query interactive input */}
          <form onSubmit={handleAiChatSubmit} className="flex gap-1.5 pt-3 border-t border-stone-200 mt-4">
            <input
              type="text"
              className="flex-1 bg-white border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-700 outline-none focus:border-orange-500"
              placeholder="ถาม AI เช่น: 'วิธีประหยัดงบ', 'วิเคราะห์ค่าน้ำมัน'..."
              value={aiChatInput}
              onChange={(e) => setAiChatInput(e.target.value)}
            />
            <button 
              type="submit" 
              className="p-2 bg-orange-500 hover:bg-orange-600 rounded-xl text-white transition-all cursor-pointer shadow shadow-orange-500/20"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
