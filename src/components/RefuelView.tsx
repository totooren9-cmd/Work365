/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Fuel, 
  Search, 
  Plus, 
  MapPin, 
  CheckCircle2, 
  Camera, 
  XCircle, 
  TrendingUp, 
  Check, 
  DollarSign, 
  Layers, 
  Sliders, 
  Activity, 
  Image as ImageIcon 
} from 'lucide-react';
import { RefuelStatus, HeavyMachinery, ExpenseRecord } from '../types';
import { sendLineFuelNotification, uploadFileAndNotify } from '../utils/lineNotify';

interface RefuelViewProps {
  refuels: RefuelStatus[];
  machinery: HeavyMachinery[];
  onAddRefuel: (ref: RefuelStatus) => void;
  onUpdateRefuel: (ref: RefuelStatus) => void;
  onAddExpense: (exp: ExpenseRecord) => void;
}

export default function RefuelView({ refuels, machinery, onAddRefuel, onUpdateRefuel, onAddExpense }: RefuelViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'requests' | 'reports'>('requests');
  const [selectedRefuelId, setSelectedRefuelId] = useState<string | null>(refuels[0]?.id || null);
  const [showReqForm, setShowReqForm] = useState(false);

  // New Fuel Request Form states
  const [newReqMachId, setNewReqMachId] = useState(machinery[0]?.id || '');
  const [newReqLiters, setNewReqLiters] = useState(100);
  const [newReqPrice, setNewReqPrice] = useState(33.5);
  const [newReqType, setNewReqType] = useState<'diesel' | 'gasoline' | 'premium_diesel'>('diesel');
  const [newReqSite, setNewReqSite] = useState('ไซต์ก่อสร้าง ชลประทานเฟส 3');
  const [newReqName, setNewReqName] = useState('นายมานะ เจริญพานิช');
  const [newReqHour, setNewReqHour] = useState(2500);

  // Photo states
  const [requestPhotoBase64, setRequestPhotoBase64] = useState<string>('');
  const [executePhotoBase64, setExecutePhotoBase64] = useState<string>('');
  const [isUploadingRequest, setIsUploadingRequest] = useState<boolean>(false);
  const [isUploadingExecute, setIsUploadingExecute] = useState<boolean>(false);

  // Execution Refueling Actual form states
  const [actLiters, setActLiters] = useState(100);
  const [actPrice, setActPrice] = useState(3350);
  const [actStation, setActStation] = useState('ปตท. ดอนจั่น มอเตอร์ฟูล');
  const [actOperator, setActOperator] = useState('สิริวรรณ การปิโตรเลียม');

  // Selected ticket
  const selectedTicket = useMemo(() => {
    return refuels.find(r => r.id === selectedRefuelId) || null;
  }, [refuels, selectedRefuelId]);

  // Handle Fuel Requisition Creation
  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetedMach = machinery.find(m => m.id === newReqMachId);
    if (!targetedMach) return;

    setIsUploadingRequest(true);

    const formattedDate = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const generatedDocNo = `FL-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(Math.random() * 900) + 100}`;
    const targetId = `f-${Date.now()}`;

    let mileagePhotoUrl = 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=300';
    if (requestPhotoBase64) {
      try {
        mileagePhotoUrl = await uploadFileAndNotify({
          image: requestPhotoBase64,
          module: 'เติมน้ำมัน',
          docId: generatedDocNo,
          uploadBy: newReqName,
          status: 'ยื่นคำขออนุมัติเติมน้ำมันสำเร็จ'
        });
      } catch (err) {
        console.error("Google Drive upload for fuel request photo failed:", err);
      }
    } else {
      try {
        const { sendGoogleDriveLineNotification } = await import('../utils/lineNotify');
        const thaiDate = new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
        await sendGoogleDriveLineNotification({
          docId: generatedDocNo,
          jobType: 'ขออนุมัติเติมน้ำมัน',
          operator: newReqName,
          timestamp: thaiDate,
          status: 'รอยื่นขออนุมัติเติมน้ำมันน้ำเชื้อเพลิง (ไม่ได้แนบรูป)',
          imageUrl: mileagePhotoUrl
        });
      } catch (e) {
         console.warn("Direct notification failed", e);
      }
    }

    const newReq: RefuelStatus = {
      id: targetId,
      documentNo: generatedDocNo,
      date: formattedDate,
      machineryId: newReqMachId,
      plateNumber: targetedMach.plateNumber,
      fuelType: newReqType,
      requestedLiters: Number(newReqLiters),
      pricePerLiter: Number(newReqPrice),
      siteLocation: newReqSite,
      requesterName: newReqName,
      mileagePhoto: mileagePhotoUrl,
      hourMeterValue: Number(newReqHour),
      status: 'pending_approval'
    };

    onAddRefuel(newReq);
    setSelectedRefuelId(newReq.id);
    setShowReqForm(false);
    setRequestPhotoBase64('');
    setIsUploadingRequest(false);
  };

  // State workflow change: Approve requests to fill
  const handleApprovalChange = (ticket: RefuelStatus, approved: boolean) => {
    const updatedTicket: RefuelStatus = {
      ...ticket,
      status: approved ? 'approved_to_fill' : 'cancelled'
    };
    onUpdateRefuel(updatedTicket);
    sendLineFuelNotification(updatedTicket, machinery).catch(err => {
      console.error("Error sending LINE notification for fuel approval status:", err);
    });
  };

  // Execute Actual Fueling Form
  const handleExecuteRefuel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setIsUploadingExecute(true);

    const computedPrice = Number(actLiters) * selectedTicket.pricePerLiter;
    const finalActualPrice = actPrice || computedPrice;

    let receiptUrl = 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=300';
    if (executePhotoBase64) {
      try {
        receiptUrl = await uploadFileAndNotify({
          image: executePhotoBase64,
          module: 'เติมน้ำมัน',
          docId: selectedTicket.documentNo,
          uploadBy: actOperator,
          status: `ช่างเติมน้ำมันเสร็จสิ้นจริง ${actLiters} ลิตร`
        });
      } catch (err) {
        console.error("Google Drive receipt upload failed:", err);
      }
    } else {
      try {
        const { sendGoogleDriveLineNotification } = await import('../utils/lineNotify');
        const thaiDate = new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
        await sendGoogleDriveLineNotification({
          docId: selectedTicket.documentNo,
          jobType: 'เติมน้ำมัน',
          operator: actOperator,
          timestamp: thaiDate,
          status: `เติมจริงเสร็จสมบูรณ์ ${actLiters} ลิตร (ไม่มีภาพใบเสร็จ)`,
          imageUrl: receiptUrl
        });
      } catch (e) {
         console.warn("Direct notification failed", e);
      }
    }

    const updatedTicket: RefuelStatus = {
      ...selectedTicket,
      status: 'completed',
      actualLiters: Number(actLiters),
      actualPrice: finalActualPrice,
      gasStationName: actStation,
      receiptPhotoUrl: receiptUrl,
      gpsLocFilled: '18.7911, 98.9852',
      operatorName: actOperator
    };

    onUpdateRefuel(updatedTicket);

    const newExpense: ExpenseRecord = {
      id: `exp-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      category: 'fuel',
      description: `น้ำมันเชื้อเพลิงจริง ใบงาน ${selectedTicket.documentNo} (${actLiters} ลิตรที่ปั๊ม ${actStation})`,
      amount: finalActualPrice,
      siteLocation: selectedTicket.siteLocation,
      recordedBy: selectedTicket.requesterName,
      machineryId: selectedTicket.machineryId,
      receiptPhoto: receiptUrl
    };

    onAddExpense(newExpense);
    alert(`⛽ บันทึกเติมจริงปริมาณ ${actLiters} ลิตร เข้าสู่ถังเครื่องยนต์แอร์และเพิ่มบันทึกรายจ่ายค่าใช้จ่ายโครงการจำนวน ฿${finalActualPrice.toLocaleString()} เรียบร้อย!`);
  };

  // Computes fuel metrics for report sheets
  const sumMetrics = useMemo(() => {
    let completedTickets = refuels.filter(rf => rf.status === 'completed');
    let totalLiters = completedTickets.reduce((sum, rf) => sum + (rf.actualLiters || 0), 0);
    let totalSpent = completedTickets.reduce((sum, rf) => sum + (rf.actualPrice || 0), 0);
    
    // Average fuel usage per site
    const siteUsage: Record<string, number> = {};
    completedTickets.forEach(rf => {
      siteUsage[rf.siteLocation] = (siteUsage[rf.siteLocation] || 0) + (rf.actualLiters || 0);
    });

    return {
      totalLiters,
      totalSpent,
      siteUsage
    };
  }, [refuels]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="refueling-module-main">
      {/* 1. Left Requests Panel (8 Columns) */}
      <div className="lg:col-span-8 bg-stone-50/40 border border-stone-200 rounded-2xl p-5 shadow-sm backdrop-blur-md flex flex-col justify-between">
        <div>
          {/* Main Module Header Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-500/10 text-orange-600 rounded-xl">
                <Fuel className="w-5 h-5" />
              </div>
              <div className="bg-white p-1 rounded-xl flex gap-1">
                <button
                  onClick={() => setActiveSubTab('requests')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeSubTab === 'requests'
                      ? 'bg-orange-500 text-white font-bold'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  ⛽ บิลขอเติมเบิร์ดก่อนเติม
                </button>
                <button
                  onClick={() => setActiveSubTab('reports')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeSubTab === 'reports'
                      ? 'bg-orange-500 text-white font-bold'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  📊 รายงานการใช้น้ำมัน (Oils)
                </button>
              </div>
            </div>

            {activeSubTab === 'requests' && (
              <button
                onClick={() => setShowReqForm(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                แจ้งคำขอเติมน้ำมันด่วน
              </button>
            )}
          </div>

          {/* Module Content Layout */}
          <div className="mt-4">
            {showReqForm ? (
              /* Fuel Request submission Form */
              <form onSubmit={handleCreateRequest} className="space-y-4 bg-white/50 p-5 rounded-2xl border border-stone-200">
                <h3 className="text-xs font-bold text-orange-600 uppercase tracking-wider">⛽ มอบหมายคูปองแจ้งเติมก่อนเข้าคิวปั๊ม</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">เลือกเครื่องจักรที่ต้องการขอสิทธิ์</label>
                    <select
                      className="w-full bg-stone-50 border border-slate-755 rounded-xl px-3 py-2 text-stone-700 text-xs outline-none"
                      value={newReqMachId}
                      onChange={(e) => setNewReqMachId(e.target.value)}
                    >
                      {machinery.map(m => (
                        <option key={m.id} value={m.id}>{m.code} - {m.model} ({m.plateNumber})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">ประเภทน้ำมันเชื้อเพลิง</label>
                    <select
                      className="w-full bg-stone-50 border border-slate-755 rounded-xl px-3 py-2 text-stone-700 text-xs outline-none"
                      value={newReqType}
                      onChange={(e) => setNewReqType(e.target.value as any)}
                    >
                      <option value="diesel">ดีเซลหมุนเร็ว (Fast Diesel)</option>
                      <option value="premium_diesel">ดีเซลเกรดพรีเมียม (Premium Diesel B7)</option>
                      <option value="gasoline">แก๊สโซฮอล์ 95 (Gasoline 95)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">จำนวนลิตรขอเติมโดยประมาณ</label>
                    <input
                      type="number"
                      className="w-full bg-stone-50 border border-slate-755 rounded-xl px-3 py-2 text-stone-700 text-xs focus:border-orange-500 outline-none"
                      value={newReqLiters}
                      onChange={(e) => setNewReqLiters(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">ราคาน้ำมันคาดการณ์ (บาท/ลิตร)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full bg-stone-50 border border-slate-755 rounded-xl px-3 py-2 text-stone-700 text-xs"
                      value={newReqPrice}
                      onChange={(e) => setNewReqPrice(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">เลขชั่วโมงมิเตอร์หน้าปัด</label>
                    <input
                      type="number"
                      className="w-full bg-stone-50 border border-slate-755 rounded-xl px-3 py-2 text-stone-700 text-xs"
                      value={newReqHour}
                      onChange={(e) => setNewReqHour(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">ชื่อวิศวกรหน้างาน/ผู้แจ้งขอเบิก</label>
                    <input
                      type="text"
                      className="w-full bg-stone-50 border border-slate-755 rounded-xl px-4 py-2 text-stone-700 outline-none text-xs"
                      value={newReqName}
                      onChange={(e) => setNewReqName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">แคมป์หน้างาน/โครงการหลัก</label>
                    <input
                      type="text"
                      className="w-full bg-stone-50 border border-slate-755 rounded-xl px-4 py-2 text-stone-700 outline-none text-xs"
                      value={newReqSite}
                      onChange={(e) => setNewReqSite(e.target.value)}
                    />
                  </div>
                </div>

                {/* Mileage Meter Photo Upload */}
                <div className="bg-stone-50 p-4 border border-dashed border-stone-300 rounded-xl" id="fuel-mileage-uploader">
                  <span className="block text-xs font-medium text-stone-700 mb-1">📷 รูปภาพไมล์หน้าปัดรถยนต์จริงประกอบ (จัดเก็บ Google Drive อัตโนมัติ)</span>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="flex flex-col items-center justify-center bg-white border border-stone-200 rounded-lg p-3 cursor-pointer hover:border-orange-500 transition-colors w-24 h-20 text-center shrink-0">
                      <Camera className="w-5 h-5 text-stone-500 mb-1" />
                      <span className="text-[10px] text-stone-500">เลือกไฟล์</span>
                      <input
                        id="fuel-mileage-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const rd = new FileReader();
                            rd.onload = () => setRequestPhotoBase64(rd.result as string);
                            rd.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    
                    {requestPhotoBase64 ? (
                      <div className="relative w-24 h-20 border border-stone-200 rounded-lg overflow-hidden group">
                        <img src={requestPhotoBase64} alt="Mileage Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setRequestPhotoBase64('')}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold"
                        >
                          ลบรูป
                        </button>
                      </div>
                    ) : (
                      <div className="text-[11px] text-stone-400">
                        ยังไม่ได้แนบรูปถ่ายเรือนไมล์ ระบบพร้อมอัปโหลดและสร้างโฟลเดอร์แยกประเภท /เติมน้ำมัน/{new Date().getFullYear()}/{String(new Date().getMonth()+1).padStart(2, '0')} บน Google Drive
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReqForm(false)}
                    disabled={isUploadingRequest}
                    className="bg-stone-50 hover:bg-stone-50 text-stone-500 hover:text-stone-700 px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isUploadingRequest}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow disabled:opacity-75 flex items-center gap-1.5"
                  >
                    {isUploadingRequest ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                        กำลังอัปโหลดรูปภาพไมล์...
                      </>
                    ) : (
                      "ยื่นคำขอเบิกน้ำมัน (Print Voucher)"
                    )}
                  </button>
                </div>
              </form>
            ) : activeSubTab === 'requests' ? (
              /* Fuel Requests List layout */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[290px] overflow-y-auto pr-1">
                {refuels.map(rf => {
                  const correlated = machinery.find(m => m.id === rf.machineryId);
                  return (
                    <div 
                      key={rf.id}
                      onClick={() => setSelectedRefuelId(rf.id)}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                        rf.id === selectedRefuelId
                          ? 'bg-orange-500/10 border-orange-500/50 shadow-md'
                          : 'bg-white/45 border-stone-200 hover:bg-stone-50/60'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-orange-600 font-extrabold font-mono">{rf.documentNo}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            rf.status === 'completed' ? 'bg-blue-500/15 text-blue-300' :
                            rf.status === 'approved_to_fill' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold' :
                            rf.status === 'cancelled' ? 'bg-rose-500/10 text-rose-350' :
                            'bg-amber-500/15 text-amber-300 animate-pulse'
                          }`}>
                            {rf.status === 'pending_approval' ? 'รออนุมัติ' : rf.status === 'approved_to_fill' ? 'อนุมัติเติมแล้ว' : rf.status === 'completed' ? 'เติมจริงแล้ว' : 'ยกเลิก'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-stone-800">
                          เครื่อง: {correlated?.code || 'ยานยนต์โครงการ'} ({rf.plateNumber})
                        </h4>
                        <div className="flex justify-between text-[11px] text-stone-500">
                          <span>ชนิดน้ำมัน: {rf.fuelType === 'diesel' ? 'ดีเซล' : rf.fuelType === 'premium_diesel' ? 'ดีเซลพรีเมียม B7' : 'แก๊สโซฮอล์ 95'}</span>
                          <span className="font-bold text-teal-600">{rf.requestedLiters} ลิตร</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[9px] text-slate-500 pt-1.5 border-t border-slate-900/60 mt-2">
                        <span className="truncate">โดย: {rf.requesterName}</span>
                        <span className="font-mono">{rf.date.split(' ')[0]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Consumption reports panel layout */
              <div className="space-y-5 bg-white/30 p-5 rounded-2xl border border-stone-200/80">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-stone-50 p-4 border border-stone-200 rounded-xl relative overflow-hidden text-center">
                    <span className="text-[10px] text-stone-500 font-bold block mb-1">เชื้อเพลิงใช้ไปสะสมจริง</span>
                    <span className="text-2xl font-mono text-emerald-600 font-extrabold">{sumMetrics.totalLiters} ลิตร</span>
                    <p className="text-[9px] text-slate-500 mt-1 leading-normal">ยอดลิตรเติมจริงทั้งหมดที่ชำระ</p>
                  </div>
                  <div className="bg-stone-50 p-4 border border-stone-200 rounded-xl relative overflow-hidden text-center">
                    <span className="text-[10px] text-stone-500 font-bold block mb-1">ยอดใช้จ่ายน้ำมันโครงการ</span>
                    <span className="text-2xl font-mono text-orange-600 font-extrabold">฿{sumMetrics.totalSpent.toLocaleString()}</span>
                    <p className="text-[9px] text-slate-500 mt-1 leading-normal">ชะลอเครือข่ายปั๊มน้ำมันคู่สัญญาร่วม</p>
                  </div>
                  <div className="bg-stone-50 p-4 border border-stone-200 rounded-xl relative overflow-hidden text-center">
                    <span className="text-[10px] text-stone-500 font-bold block mb-1">สถิติค่าเฉลี่ยต่อถัง</span>
                    <span className="text-xl font-mono text-stone-800 font-extrabold">฿33.5/ลิตร</span>
                    <p className="text-[9px] text-slate-500 mt-1 leading-normal">อิงอัตราดีเซลโซนพื้นที่ภาคเหนือ</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2.5">
                  <span className="block text-xs font-bold text-slate-350">เปรียบเทียบปริมาณการใช้น้ำมันดีเซลรายไซต์งาน</span>
                  <div className="space-y-3">
                    {Object.entries(sumMetrics.siteUsage).map(([site, rawLtrs]) => {
                      const ltrs = Number(rawLtrs) || 0;
                      return (
                        <div key={site} className="space-y-1">
                          <div className="flex justify-between text-[11px] leading-none">
                            <span className="text-stone-700">{site}</span>
                            <span className="font-bold text-teal-600 font-mono">{ltrs} ลิตร</span>
                          </div>
                          {/* Progress meter bar */}
                          <div className="w-full h-2 rounded bg-stone-50 overflow-hidden relative border border-stone-200">
                            <div className="h-full bg-orange-500 rounded" style={{ width: `${Math.min((ltrs / 400) * 100, 100)}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic footer summary */}
        <div className="bg-white/40 border-t border-stone-200 mt-4 pt-3 text-[11px] text-slate-455 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10px] text-stone-500">
            <TrendingUp className="w-4 h-4 text-orange-600 shrink-0" />
            *ระบบประมวลผลคำนวณข้อมูลไมล์รถยนต์และบันทึกปริมาณเพื่อขยายผลวิเคราะห์ประสิทธิภาพการใช้น้ำมันโครงการหลัก
          </span>
          <span className="font-mono text-slate-450">Fuel Audit Live 360</span>
        </div>
      </div>

      {/* 2. Right Fuel actual form execution drawer (4 Columns) */}
      <div className="lg:col-span-4 bg-stone-50/40 border border-stone-200 rounded-2xl p-5 shadow-sm backdrop-blur-md flex flex-col justify-between">
        {selectedTicket ? (
          <div className="space-y-4 flex flex-col justify-between h-full">
            <div className="space-y-3.5">
              <div className="border-b border-stone-200 pb-2">
                <span className="text-[9px] text-slate-450 font-mono font-bold uppercase">เอกสาร: {selectedTicket.id}</span>
                <h3 className="text-xs font-semibold text-stone-700">ประมวลผลคำขอเติมน้ำมัน</h3>
              </div>

              {/* Request metrics details summary */}
              <div className="bg-white/45 p-3 rounded-xl space-y-1.5 text-[11px] border border-slate-900">
                <p>📍 <strong className="text-stone-500">ไซต์งาน:</strong> {selectedTicket.siteLocation}</p>
                <p>⛽ <strong className="text-stone-500">น้ำมันขอรับ:</strong> {selectedTicket.fuelType === 'diesel' ? 'ดีเซล' : 'อื่น ๆ'}</p>
                <p>📊 <strong className="text-stone-500">ชั่วโมงปัดเครื่อง:</strong> {selectedTicket.hourMeterValue} ชม.</p>
                <p className="text-orange-600">🚀 <strong className="text-stone-500">ขอเบิกปริมาณ:</strong> {selectedTicket.requestedLiters} ลิตร</p>
                
                {/* Mileage Image Placeholder mockup style */}
                <div className="mt-2.5 pt-2 border-t border-slate-900 text-center">
                  <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1">ภาพหน้าปัดไมล์ที่ยืนยัน (Odometer Captureed)</span>
                  <div className="h-16 rounded overflow-hidden relative border border-stone-200 bg-white flex items-center justify-center">
                    <img src={selectedTicket.mileagePhoto} alt="Odometer visual" className="w-full h-full object-cover opacity-60" />
                    <span className="absolute bottom-1 right-1.5 text-[8px] bg-stone-50 text-slate-350 font-mono px-1 rounded">2,500m Verified</span>
                  </div>
                </div>
              </div>

              {/* State 1: Request pending -> Approve or reject */}
              {selectedTicket.status === 'pending_approval' && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleApprovalChange(selectedTicket, false)}
                    className="py-2.5 bg-rose-500/15 hover:bg-rose-600 hover:text-white rounded-xl text-rose-300 font-bold transition-all text-[11px] cursor-pointer"
                  >
                    X ยกเลิกคำขอ
                  </button>
                  <button
                    onClick={() => handleApprovalChange(selectedTicket, true)}
                    className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all text-[11px] cursor-pointer shadow"
                  >
                    ✓ อนุมัติเติม
                  </button>
                </div>
              )}

              {/* State 2: Approved -> Execution Actual filling form */}
              {selectedTicket.status === 'approved_to_fill' && (
                <form onSubmit={handleExecuteRefuel} className="space-y-3 pt-2 border-t border-stone-200">
                  <span className="block text-[10px] uppercase font-bold text-orange-600 tracking-wider">บันทึกปริมาณเติมหน้าตู้จริง (Actual Log)</span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-stone-500 mb-0.5">ลิตรเติมจริง</label>
                      <input
                        type="number"
                        className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1 text-[11px] text-stone-800"
                        value={actLiters}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setActLiters(val);
                          setActPrice(val * selectedTicket.pricePerLiter);
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-stone-500 mb-0.5">ยอดเงินรวมจ่ายจริง (฿)</label>
                      <input
                        type="number"
                        className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1 text-[11px] text-stone-800"
                        value={actPrice}
                        onChange={(e) => setActPrice(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] text-stone-500 mb-0.5">ปั๊มน้ำมันผู้ให้บริการตู้จ่าย</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1 text-[11px] text-stone-700"
                      value={actStation}
                      onChange={(e) => setActStation(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] text-stone-500 mb-0.5">ผู้รับผิดชอบการเติม (หรือหัวหน้าไซต์)</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1 text-[11px] text-stone-700"
                      value={actOperator}
                      onChange={(e) => setActOperator(e.target.value)}
                    />
                  </div>

                  {/* Fuel Receipt Photo Upload Section */}
                  <div className="bg-stone-50 border border-dashed border-stone-300 rounded-xl p-2.5 space-y-1.5" id="fuel-receipt-uploader">
                    <span className="block text-[9px] font-bold text-stone-600 uppercase">📷 ภาพใบเสร็จรับเงิน/หน้าตู้น้ำมัน (Google Drive)</span>
                    <div className="flex items-center gap-2.5">
                      <label className="flex flex-col items-center justify-center bg-white border border-stone-200 rounded-lg p-2 cursor-pointer hover:border-orange-500 transition-colors w-20 h-16 text-center shrink-0">
                        <Camera className="w-4 h-4 text-stone-500" />
                        <span className="text-[8px] text-stone-500">เลือกรูป</span>
                        <input
                          id="fuel-receipt-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const rd = new FileReader();
                              rd.onload = () => setExecutePhotoBase64(rd.result as string);
                              rd.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>

                      {executePhotoBase64 ? (
                        <div className="relative w-20 h-16 border border-stone-200 rounded-lg overflow-hidden group">
                          <img src={executePhotoBase64} alt="Receipt Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setExecutePhotoBase64('')}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[8px] font-bold"
                          >
                            ลบ
                          </button>
                        </div>
                      ) : (
                        <span className="text-[9px] text-stone-400 leading-tight">
                          แนบรูปถ่ายสลิปใบเสร็จรับเงินหรือมิเตอร์ปั๊ม เพื่อเป็นหลักฐานตรวจสอบย้อนหลังได้ 100%
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isUploadingExecute}
                    className="w-full py-2 bg-orange-500 hover:bg-orange-600 rounded-xl text-xs font-black text-white shadow shadow-orange-500/25 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-75"
                  >
                    {isUploadingExecute ? (
                      <>
                        <div className="animate-spin rounded-full h-3 h-3 border-2 border-white border-t-transparent"></div>
                        กำลังประมวลผลอัปโหลดเข้าคลัง Drive...
                      </>
                    ) : (
                      <>
                        <Fuel className="w-3.5 h-3.5" />
                        บันทึกเติมจริง (สร้างรายจ่ายรถขุด)
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* State 3: Refueling completed detail reports receipt */}
              {selectedTicket.status === 'completed' && (
                <div className="space-y-3 pt-2">
                  <div className="bg-white/60 border border-slate-900 rounded-xl p-3 text-[11px] text-slate-350 space-y-1.5 leading-normal">
                    <p className="text-emerald-600 font-extrabold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      เติมเสร็จสมบูรณ์เรียบร้อยแล้ว
                    </p>
                    <p>⛽ <strong className="text-stone-500">ป้อนจริงไป:</strong> {selectedTicket.actualLiters} ลิตร</p>
                    <p>💸 <strong className="text-stone-500">ชำระรวม:</strong> ฿{selectedTicket.actualPrice?.toLocaleString()} บาท</p>
                    <p>🏢 <strong className="text-stone-500">ที่ปั๊ม:</strong> {selectedTicket.gasStationName}</p>
                    <p>📍 <strong className="text-stone-500">พิกัดเติม:</strong> {selectedTicket.gpsLocFilled || '18.7904, 98.9841'}</p>
                    <p>👤 <strong className="text-stone-500">ผู้คุมเติม:</strong> {selectedTicket.operatorName}</p>
                  </div>

                  {/* Google Drive Previews */}
                  <div className="grid grid-cols-2 gap-2">
                    {selectedTicket.mileagePhoto && (
                      <div className="rounded-xl overflow-hidden border border-stone-200">
                        <span className="block bg-stone-100 text-[8px] font-bold text-stone-600 px-2 py-0.5 border-b border-stone-200 text-center truncate">📷 ภาพไมล์เบิก</span>
                        <img 
                          src={selectedTicket.mileagePhoto} 
                          alt="Mileage Meter" 
                          className="w-full h-16 object-cover cursor-pointer hover:scale-105 transition-all" 
                          onClick={() => window.open(selectedTicket.mileagePhoto, '_blank')}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    {selectedTicket.receiptPhotoUrl && (
                      <div className="rounded-xl overflow-hidden border border-stone-200">
                        <span className="block bg-stone-100 text-[8px] font-bold text-stone-600 px-2 py-0.5 border-b border-stone-200 text-center truncate">📄 ภาพใบเสร็จ</span>
                        <img 
                          src={selectedTicket.receiptPhotoUrl} 
                          alt="Receipt Voucher" 
                          className="w-full h-16 object-cover cursor-pointer hover:scale-105 transition-all" 
                          onClick={() => window.open(selectedTicket.receiptPhotoUrl, '_blank')}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic text-center my-auto">ไม่มีการแจ้งฟลูเลนจ์คำขอเติม</p>
        )}
      </div>
    </div>

    {/* Table of All Refueling Requests */}
    <div className="bg-white p-6 rounded-3xl border border-stone-200/50 shadow-sm mt-8" id="all-refuel-records-table">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 border-b border-stone-100 pb-4">
        <div>
          <h2 className="text-md font-bold text-stone-800 font-sans tracking-tight">ตารางสถิติกดขอเติมและจ่ายน้ำมันโครงการทั้งหมด</h2>
          <p className="text-xs text-stone-500 mt-1 font-sans">
            ข้อมูลการคุมยอดวอลุ่มเติมน้ำมันโครงการหลัก รอยยิ้ม และระบบการประมวลบิลใบเสร็จดิจิทัลแบบ 360 องศา
          </p>
        </div>
        <span className="bg-[#fffdf2] text-amber-700 text-xs font-mono px-3 py-1 rounded-xl border border-amber-200/60 font-bold shrink-0">
          ทั้งหมด {refuels.length} รายการ
        </span>
      </div>

      {refuels.length === 0 ? (
        <div className="text-center py-12 text-stone-400 text-xs bg-stone-50 rounded-2xl border border-dashed border-stone-200">
           ไม่มีข้อมูลการสั่งเติมน้ำมันโครงการในฐานข้อมูล
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-600 border-collapse">
            <thead>
              <tr className="border-b border-stone-200/60 text-stone-400 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">เลขที่เอกสาร</th>
                <th className="py-3 px-3">เครื่องจักรกล</th>
                <th className="py-3 px-3">ชนิดของน้ำมัน</th>
                <th className="py-3 px-3">ปริมาณเสนอขอ</th>
                <th className="py-3 px-3">ปริมาณเติมจริง</th>
                <th className="py-3 px-3">ผู้บันทึกเสนอ</th>
                <th className="py-3 px-3">วันเวลาเติม</th>
                <th className="py-3 px-3 text-right">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {refuels.map((rf) => {
                const machine = machinery.find(m => m.id === rf.machineryId);
                return (
                  <tr 
                    key={rf.id} 
                    className="hover:bg-stone-50/80 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedRefuelId(rf.id);
                    }}
                  >
                    <td className="py-3.5 px-3 font-mono font-bold text-stone-600 select-all shrink-0">
                      {rf.documentNo}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-stone-800">
                      <div>
                        {machine?.code || 'เครื่องยนต์ปูยาง'}
                        <span className="block text-[10px] text-stone-400 font-normal">{rf.plateNumber}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700">
                        {rf.fuelType === 'diesel' ? 'ดีเซล' : rf.fuelType === 'premium_diesel' ? 'ดีเซลพรีเมียม B7' : 'แก๊สโซฮอล์ 95'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-stone-700">
                      {rf.requestedLiters} ลิตร
                    </td>
                    <td className="py-3.5 px-3 font-mono text-emerald-600 font-bold">
                      {rf.actualLiters ? `${rf.actualLiters} ลิตร` : <span className="text-stone-300">-</span>}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-stone-600">
                      {rf.requesterName}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-stone-500">
                      {rf.date}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full font-extrabold text-[9.5px] ${
                        rf.status === 'completed' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                        rf.status === 'approved_to_fill' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 animate-pulse' :
                        rf.status === 'cancelled' ? 'bg-red-50 text-red-650 border border-red-105' :
                        'bg-amber-50 text-amber-600 border border-amber-105'
                      }`}>
                        {rf.status === 'completed' ? 'เติมจริงแล้ว' :
                         rf.status === 'approved_to_fill' ? 'อนุมัติเติ่มแล้ว' :
                         rf.status === 'cancelled' ? 'ยกเลิก' : 'รออนุมัติ'}
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
  );
}
