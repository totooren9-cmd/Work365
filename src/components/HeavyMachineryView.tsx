/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  Printer, 
  User, 
  Clock, 
  Hash, 
  Wrench,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  QrCode
} from 'lucide-react';
import { HeavyMachinery, MachineryType } from '../types';

interface HeavyMachineryViewProps {
  machinery: HeavyMachinery[];
  onAddMachinery: (mach: HeavyMachinery) => void;
  onUpdateMachinery: (mach: HeavyMachinery) => void;
}

export default function HeavyMachineryView({ machinery, onAddMachinery, onUpdateMachinery }: HeavyMachineryViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'under_repair' | 'maintenance_due'>('all');
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(machinery[0]?.id || null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add Machinery Form states
  const [formCode, setFormCode] = useState('');
  const [formType, setFormType] = useState<MachineryType>('backhoe');
  const [formBrand, setFormBrand] = useState('Caterpillar');
  const [formModel, setFormModel] = useState('');
  const [formPlate, setFormPlate] = useState('');
  const [formSerial, setFormSerial] = useState('');
  const [formHour, setFormHour] = useState(0);
  const [formRespName, setFormRespName] = useState('ช่างยศศักดิ์ เหลืองทอง');

  // Selected Machine details computed
  const selectedMachine = useMemo(() => {
    return machinery.find(m => m.id === selectedMachineId) || null;
  }, [machinery, selectedMachineId]);

  // Filtered machinery elements
  const filteredMachinery = useMemo(() => {
    return machinery.filter(m => {
      const matchSearch = m.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.brand.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.model.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [machinery, searchTerm, statusFilter]);

  // Form submit handler
  const handleCreateMachine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode || !formModel) return;

    const newMach: HeavyMachinery = {
      id: `mach-${Math.floor(Math.random() * 90) + 10}`,
      code: formCode.toUpperCase(),
      type: formType,
      brand: formBrand,
      model: formModel,
      plateNumber: formPlate,
      serialNumber: formSerial || `SN-${Math.floor(Math.random() * 900000) + 100000}`,
      hourMeter: Number(formHour),
      status: 'active',
      responsibleName: formRespName,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${formCode.toUpperCase()}`
    };

    onAddMachinery(newMach);
    setSelectedMachineId(newMach.id);
    setShowAddForm(false);

    // Reset fields
    setFormCode('');
    setFormModel('');
    setFormPlate('');
    setFormSerial('');
    setFormHour(0);
  };

  const handleStatusUpdate = (status: 'active' | 'under_repair' | 'maintenance_due' | 'inactive') => {
    if (!selectedMachine) return;
    onUpdateMachinery({
      ...selectedMachine,
      status
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="machinery-view-grid">
      {/* 1. Left Machinery Catalog Cards Panel (8 Columns) */}
      <div className="lg:col-span-8 bg-stone-50/40 border border-stone-200 rounded-2xl p-5 shadow-sm backdrop-blur-md flex flex-col justify-between">
        <div>
          {/* Main Controls Panel Bar Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-500/10 text-orange-600 rounded-xl">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-display font-medium text-stone-800">สารบบทะเบียนเครื่องจักรหนัก (Fleet Registry)</h2>
                <p className="text-xs text-stone-500">ข้อมูลรถเคลื่อนย้าย, รถตักดิน, โม่ปะปา, และประวัติตลับเมตรทั้งหมดในไซต์งาน</p>
              </div>
            </div>

            <button
              onClick={() => setShowAddForm(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              จดทะเบียนเครื่องจักรใหม่
            </button>
          </div>

          {/* Catalog Layout Form & List */}
          <div className="mt-4">
            {showAddForm ? (
              /* Add new machine catalog form */
              <form onSubmit={handleCreateMachine} className="space-y-4 bg-white/50 p-5 rounded-2xl border border-stone-200">
                <h3 className="text-xs font-bold text-orange-600 uppercase tracking-wider">🚜 ลงทะเบียนและออกรหัสสำหรับบด/ตักชุดใหม่</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">รหัสรันเครื่องเบื้องต้น (Asset ID Code)</label>
                    <input
                      type="text"
                      className="w-full bg-stone-50 border border-slate-750 rounded-xl px-4 py-2 text-stone-700 outline-none text-xs focus:border-orange-500"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      placeholder="เช่น EXC-VOL300-02"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">ประเภทเครื่องจักรหนัก</label>
                    <select
                      className="w-full bg-stone-50 border border-slate-750 rounded-xl px-3 py-2 text-stone-700 outline-none text-xs"
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as MachineryType)}
                    >
                      <option value="backhoe">รถแบคโฮ (Excavator)</option>
                      <option value="grader">รถเกรดดิน (Motor Grader)</option>
                      <option value="roller">รถบดถนน (Roller Soil Compactor)</option>
                      <option value="tenwheeler">รถสิบล้อกองถม (Dump Truck)</option>
                      <option value="watertruck">รถจ่ายน้ำพืชสวน (Water Sprinkler Truck)</option>
                      <option value="crane">รถเครนบูมพับ (Boom Mobile Crane)</option>
                      <option value="loader">รถตักล้อยาง (Wheel Loader)</option>
                      <option value="forklift">รถโฟล์คลิฟท์โกดัง (Forklift Truck)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">ยี่ห้อ (Brand)</label>
                    <input
                      type="text"
                      className="w-full bg-stone-50 border border-slate-750 rounded-xl px-3 py-2 text-stone-700 outline-none text-xs"
                      value={formBrand}
                      onChange={(e) => setFormBrand(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">รุ่นคันเดี่ยว (Model)</label>
                    <input
                      type="text"
                      className="w-full bg-stone-50 border border-slate-750 rounded-xl px-3 py-2 text-stone-700 outline-none text-xs"
                      value={formModel}
                      onChange={(e) => setFormModel(e.target.value)}
                      placeholder="เช่น CAT 320D หรือ GD511"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">ป้ายทะเบียน / จังหวัด</label>
                    <input
                      type="text"
                      className="w-full bg-stone-50 border border-slate-750 rounded-xl px-3 py-2 text-stone-700 outline-none text-xs"
                      value={formPlate}
                      onChange={(e) => setFormPlate(e.target.value)}
                      placeholder="เช่น 83-1204 ลำพูน"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">หมายเลขแชสซี (S/N)</label>
                    <input
                      type="text"
                      className="w-full bg-stone-50 border border-slate-750 rounded-xl px-3 py-2 text-slate-205 outline-none text-xs"
                      value={formSerial}
                      onChange={(e) => setFormSerial(e.target.value)}
                      placeholder="เช่น SN8900129B"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">มิเตอร์ชม.สะสมเริ่มต้น</label>
                    <input
                      type="number"
                      className="w-full bg-stone-50 border border-slate-750 rounded-xl px-3 py-2 text-stone-700 outline-none text-xs"
                      value={formHour}
                      onChange={(e) => setFormHour(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">พนักงานขับประคอง/บำรุง</label>
                    <input
                      type="text"
                      className="w-full bg-stone-50 border border-slate-750 rounded-xl px-3 py-2 text-stone-700 outline-none text-xs"
                      value={formRespName}
                      onChange={(e) => setFormRespName(e.target.value)}
                    />
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
                    ลงทะเบียนเครื่องจักร
                  </button>
                </div>
              </form>
            ) : (
              /* Machinery List Grid Layout */
              <div className="space-y-4">
                {/* Search Bar / Filter Tabs */}
                <div className="flex flex-col md:flex-row gap-2 border-b border-stone-200 pb-3">
                  <div className="relative flex-1 bg-white rounded-xl border border-stone-200">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      className="w-full bg-transparent pl-9 pr-4 py-2 text-xs text-slate-205 outline-none"
                      placeholder="ค้นหารหัสรถ ยี่ห้อ รุ่นสเปก..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-1 overflow-x-auto select-none">
                    {([
                      { id: 'all', label: 'ทั้งหมด' },
                      { id: 'active', label: '🟢 พร้อมกุย' },
                      { id: 'under_repair', label: '🔴 ซ่อมแซม' },
                      { id: 'maintenance_due', label: '🟡 เลยกำหนด PM' }
                    ] as const).map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setStatusFilter(tab.id)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all shrink-0 border ${
                          statusFilter === tab.id
                            ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                            : 'bg-stone-50/45 text-stone-500 border-stone-200 hover:text-stone-700'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid layout cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[290px] overflow-y-auto pr-1">
                  {filteredMachinery.map((m) => (
                    <div 
                      key={m.id} 
                      onClick={() => setSelectedMachineId(m.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                        m.id === selectedMachineId
                          ? 'bg-orange-500/10 border-orange-500/50 shadow-md scale-[1.01]'
                          : 'bg-white/40 border-stone-200 hover:bg-stone-50/60'
                      }`}
                    >
                      {/* Heavy Icon display background decoration */}
                      <div className={`p-3 rounded-2xl shrink-0 ${
                        m.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' :
                        m.status === 'under_repair' ? 'bg-rose-500/10 text-rose-600' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        <QrCode className="w-5 h-5" />
                      </div>

                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-stone-700 truncate">{m.code}</h4>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                            m.status === 'active' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                            m.status === 'under_repair' ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' :
                            'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          }`}>
                            {m.status === 'active' ? 'พร้อมกุย' : m.status === 'under_repair' ? 'ซ่อมพัง' : 'เลย PM'}
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-500 font-medium truncate">{m.brand} {m.model} | {m.plateNumber}</p>
                        
                        <div className="flex items-center justify-between text-[9px] pt-1.5 text-slate-500 font-semibold border-t border-slate-900/40">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-orange-600 shrink-0" />
                            {m.hourMeter.toLocaleString()} ชม.
                          </span>
                          <span className="truncate">ผู้ดูแล: {m.responsibleName.split(' ')[1] || m.responsibleName}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic status footer */}
        <div className="bg-white/40 border-t border-stone-200 mt-4 pt-3 text-[11px] text-slate-455 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10px] text-stone-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 animate-pulse" />
            ข้อมูลล้อขับตั้งระบบและชั่วโมงเครื่องยนต์ทั้งหมดได้รับการขยายพิกัดความคุมอย่างดี
          </span>
          <span className="font-mono text-slate-450">CMMS QR Verified 360</span>
        </div>
      </div>

      {/* 2. Right Selected Asset Details & QR Sticker Printing Layout (4 Columns) */}
      <div className="lg:col-span-4 bg-stone-50/40 border border-stone-200 rounded-2xl p-5 shadow-sm backdrop-blur-md flex flex-col justify-between">
        {selectedMachine ? (
          <div className="space-y-4 flex flex-col justify-between h-full">
            <div className="space-y-4">
              <div className="border-b border-stone-200 pb-2">
                <span className="text-[9px] text-slate-500 font-mono font-bold uppercase">ID: {selectedMachine.id}</span>
                <h3 className="text-sm font-semibold text-slate-205">{selectedMachine.code} ข้อมูลจำเพาะ</h3>
              </div>

              {/* QR Code Sticker Container Preview */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-slate-900 flex flex-col items-center justify-center text-center space-y-2 max-w-[210px] mx-auto shadow-md">
                <span className="text-[9px] font-sans font-extrabold uppercase tracking-widest text-[#0d1527] leading-none mb-1">FLOWWORK AUTOMATION</span>
                <img 
                  src={selectedMachine.qrCodeUrl} 
                  alt="Asset QR Tag" 
                  className="w-28 h-28 border border-slate-100 object-contain" 
                  referrerPolicy="no-referrer"
                />
                <div>
                  <p className="text-[10px] font-mono leading-none tracking-tight font-black">{selectedMachine.code}</p>
                  <p className="text-[8px] font-sans text-slate-500 font-bold leading-normal mt-0.5">S/N: {selectedMachine.serialNumber}</p>
                </div>
              </div>

              {/* Attribute detail records */}
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between items-center bg-white/40 p-2 rounded-lg">
                  <span className="text-slate-450">ยี่ห้อ / รุ่นเครื่องยนต์:</span>
                  <span className="font-bold text-stone-700">{selectedMachine.brand} - {selectedMachine.model}</span>
                </div>
                <div className="flex justify-between items-center bg-white/40 p-2 rounded-lg">
                  <span className="text-slate-450">หมายเลขซีเรียล (S/N):</span>
                  <span className="font-mono text-orange-600 font-semibold">{selectedMachine.serialNumber}</span>
                </div>
                <div className="flex justify-between items-center bg-white/40 p-2 rounded-lg">
                  <span className="text-slate-450">ชม. สัญญาการทำงานหลัก:</span>
                  <span className="font-mono text-emerald-600 font-bold">{selectedMachine.hourMeter.toLocaleString()} ชั่วโมง</span>
                </div>
                <div className="flex justify-between items-center bg-white/40 p-2 rounded-lg">
                  <span className="text-slate-450">ผู้ดูแลรับจัดหาเครื่องจักร:</span>
                  <span className="text-stone-700">{selectedMachine.responsibleName}</span>
                </div>
              </div>

              {/* Action Buttons to adjust state */}
              <div className="space-y-2 pt-1">
                <label className="block text-[10px] uppercase font-bold text-stone-500">เปลี่ยนสถานะเครื่องจักร</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['active', 'under_repair', 'maintenance_due'] as const).map(st => {
                    const label = st === 'active' ? '🟢 พร้อมใช้' : st === 'under_repair' ? '🔴 ซ่อมใหญ่' : '🟡 รอบ PM';
                    const activeVal = selectedMachine.status === st;
                    return (
                      <button
                        key={st}
                        onClick={() => handleStatusUpdate(st)}
                        className={`py-1.5 rounded text-[10px] font-bold tracking-tight border ${
                          activeVal 
                            ? 'bg-orange-500 text-white border-orange-500/80 shadow' 
                            : 'bg-white text-stone-700 border-slate-900 hover:text-stone-700'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-2.5 bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-4"
            >
              <Printer className="w-4 h-4 text-orange-500" />
              Print Asset QR-Tag Label (A4 / Sticker)
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic text-center my-auto">ไม่มีการเลือกเครื่องจักรหนัก</p>
        )}
      </div>
    </div>
  );
}
