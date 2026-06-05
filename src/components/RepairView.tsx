/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Wrench, 
  User, 
  MapPin, 
  AlertTriangle, 
  CheckSquare, 
  Square, 
  Camera, 
  PenTool, 
  Check, 
  Plus, 
  Activity, 
  Trash2,
  FileBadge,
  Sparkles
} from 'lucide-react';
import { RepairRequest, HeavyMachinery } from '../types';
import { uploadFileAndNotify } from '../utils/lineNotify';

interface RepairViewProps {
  repairs: RepairRequest[];
  machinery: HeavyMachinery[];
  onAddRepair: (rep: RepairRequest) => void;
  onUpdateRepair: (rep: RepairRequest) => void;
  onDeleteRepair: (id: string) => void;
  initialShowAddForm?: boolean;
  onCloseAddForm?: () => void;
}

export default function RepairView({ 
  repairs, 
  machinery, 
  onAddRepair, 
  onUpdateRepair, 
  onDeleteRepair,
  initialShowAddForm = false,
  onCloseAddForm
}: RepairViewProps) {
  const [selectedRepairId, setSelectedRepairId] = useState<string | null>(repairs[0]?.id || null);
  const [showAddForm, setShowAddForm] = useState(initialShowAddForm);

  // Synchronize state with initialShowAddForm
  useEffect(() => {
    if (initialShowAddForm) {
      setShowAddForm(true);
    }
  }, [initialShowAddForm]);

  const handleCloseForm = () => {
    setShowAddForm(false);
    onCloseAddForm?.();
  };

  // New report form states
  const [repMachId, setRepMachId] = useState(machinery[0]?.id || '');
  const [repReporter, setRepReporter] = useState('นายพงษ์ศักดิ์ ดีพร้อม');
  const [repDesc, setRepDesc] = useState('');
  const [repUrgency, setRepUrgency] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [repHour, setRepHour] = useState(5000);
  const [repGps, setRepGps] = useState('18.7904, 98.9841 (หน้างานคลองส่งน้ำพืชสวนโลก)');
  const [uploadedPhotoBase64, setUploadedPhotoBase64] = useState<string>('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);

  // Signature canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Current selected repair item
  const selectedRepair = useMemo(() => {
    return repairs.find(r => r.id === selectedRepairId) || null;
  }, [repairs, selectedRepairId]);

  // Clean the signature pad
  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Canvas drawing triggers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#38bdf8'; // Electric cyan color
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    
    // Clear canvas
    ctx.fillStyle = '#0f172a'; // slate 900
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const getMousePos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const handleStart = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      setIsDrawing(true);
      const pos = getMousePos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      const pos = getMousePos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      setHasSignature(true);
    };

    const handleStop = () => {
      setIsDrawing(false);
      ctx.closePath();
    };

    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleStop);

    canvas.addEventListener('touchstart', handleStart);
    canvas.addEventListener('touchmove', handleMove);
    canvas.addEventListener('touchend', handleStop);

    return () => {
      canvas.removeEventListener('mousedown', handleStart);
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('mouseup', handleStop);

      canvas.removeEventListener('touchstart', handleStart);
      canvas.removeEventListener('touchmove', handleMove);
      canvas.removeEventListener('touchend', handleStop);
    };
  }, [selectedRepairId, isDrawing]);

  // Form Submission
  const handleAddNewRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repDesc) return;

    setIsUploadingPhoto(true);
    let finalPhoto = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400';
    const repId = `REP-${Math.floor(Math.random() * 9000) + 1000}`;

    if (uploadedPhotoBase64) {
      try {
        finalPhoto = await uploadFileAndNotify({
          image: uploadedPhotoBase64,
          module: 'แจ้งซ่อม',
          docId: repId,
          uploadBy: repReporter,
          status: 'ยื่นแจ้งซ่อมฉุกเฉินสำเร็จ'
        });
      } catch (err) {
        console.error("Google Drive / LINE upload failed:", err);
      }
    } else {
      try {
        const { sendGoogleDriveLineNotification } = await import('../utils/lineNotify');
        const thaiDate = new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
        await sendGoogleDriveLineNotification({
          docId: repId,
          jobType: 'แจ้งซ่อม',
          operator: repReporter,
          timestamp: thaiDate,
          status: 'ยื่นแจ้งซ่อมใหม่ (ไม่ได้แนบภาพ)',
          imageUrl: finalPhoto
        });
      } catch (err) {
        console.error("Failed directly sending notifications:", err);
      }
    }

    const newRep: RepairRequest = {
      id: repId,
      machineryId: repMachId,
      reporterName: repReporter,
      problemDesc: repDesc,
      urgency: repUrgency,
      gpsLoc: repGps,
      status: 'reported',
      hoursMeterRecorded: Number(repHour),
      photoUrl: finalPhoto,
      checklist: [
        { task: 'ตรวจเช็คแก้มวาล์วรั่วซึมฝาหัวฉีด', done: false },
        { task: 'วัดแรงคลายกำลังอัดท่อนไฮดรอก', done: false },
        { task: 'เปลี่ยนถ่ายน้ำมันหล่อลื่นส่วนประทับฝา', done: false }
      ],
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    onAddRepair(newRep);
    setSelectedRepairId(newRep.id);
    handleCloseForm();
    setRepDesc('');
    setUploadedPhotoBase64('');
    setIsUploadingPhoto(false);
  };

  // Updates jobsheet active checklists on/off
  const toggleChecklistTask = (index: number) => {
    if (!selectedRepair) return;
    const updated = [...selectedRepair.checklist];
    updated[index].done = !updated[index].done;

    onUpdateRepair({
      ...selectedRepair,
      checklist: updated
    });
  };

  const assignTechnician = (techName: string) => {
    if (!selectedRepair) return;
    onUpdateRepair({
      ...selectedRepair,
      status: 'repairing',
      assignedTech: techName
    });
  };

  const closeRepairOrder = () => {
    if (!selectedRepair) return;
    
    // Save signature image mock representation
    const signatureBase64 = canvasRef.current?.toDataURL() || 'MOCK_SIGNATURE';

    // Change machinery status back to normal as well
    const associatedMach = machinery.find(m => m.id === selectedRepair.machineryId);
    if (associatedMach) {
      associatedMach.status = 'active'; // Machine is fixed now
    }

    onUpdateRepair({
      ...selectedRepair,
      status: 'completed',
      signature: signatureBase64,
      afterPhoto: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=400'
    });

    alert('🛠️ งานซ่อมแซมได้รับการตรวจและเซ็นรับปิดจ็อบเรียบร้อย ปรับดึงเครื่องจักรกลับมาให้บริการ (Active Fleet) เรียบร้อย!');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="repair-module-main">
      {/* 1. Left Fault Reports List (8 Columns) */}
      <div className="lg:col-span-8 bg-stone-50/40 border border-stone-200 rounded-2xl p-5 shadow-sm backdrop-blur-md flex flex-col justify-between">
        <div>
          {/* Header row with triggers */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-500/10 text-orange-600 rounded-xl">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-display font-medium text-stone-800">ทะเบียนรับแจ้งซ่อมเครื่องจักรหนัก (Heavy CMMS)</h2>
                <p className="text-xs text-stone-500">ควบคุมขั้นตอนซ่อม, มอบหมายช่างนอกสถานที่, จ๊อบซีตพร้อมพิกัดดาวเทียม</p>
              </div>
            </div>

            <button
              onClick={() => setShowAddForm(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              ยื่นแจ้งซ่อมฉุกเฉิน
            </button>
          </div>

          {/* Workflow form vs regular listings */}
          <div className="mt-4">
            {showAddForm ? (
              <form onSubmit={handleAddNewRepair} className="space-y-4 bg-white/50 p-5 rounded-2xl border border-stone-200">
                <h3 className="text-xs font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1">
                  <Activity className="w-4 h-4" />
                  กรอกใบแจ้งซ่อมเครื่องยนต์/ตัก/บด ตัวช่วยวิเคราะห์
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">เลือกเครื่องจักรที่ขัดข้อง</label>
                    <select
                      className="w-full bg-stone-50 border border-slate-755 rounded-xl px-3 py-2 text-stone-700 text-xs"
                      value={repMachId}
                      onChange={(e) => setRepMachId(e.target.value)}
                    >
                      {machinery.map(m => (
                        <option key={m.id} value={m.id}>{m.code} - {m.model} ({m.plateNumber})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">ความเร่งด่วนในการทำรอบ</label>
                    <select
                      className="w-full bg-stone-50 border border-slate-755 rounded-xl px-3 py-2 text-slate-205 text-xs"
                      value={repUrgency}
                      onChange={(e) => setRepUrgency(e.target.value as any)}
                    >
                      <option value="low">🟡 ทั่วไป (Low)</option>
                      <option value="medium">🟠 ปานกลาง (Medium)</option>
                      <option value="high">🔴 เร่งด่วน (High)</option>
                      <option value="critical">🚨 วิกฤตหยุดงาน (Critical)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">ชื่อผู้รายงานและยื่นฟ้อง</label>
                    <input
                      type="text"
                      className="w-full bg-stone-50 border border-slate-755 rounded-xl px-4 py-2 text-stone-700 outline-none text-xs focus:border-orange-500"
                      value={repReporter}
                      onChange={(e) => setRepReporter(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">มิเตอร์ชั่วโมง/กิโลเมตร ขณะพบอาการ</label>
                    <input
                      type="number"
                      className="w-full bg-stone-50 border border-slate-755 rounded-xl px-4 py-2 text-stone-700 outline-none text-xs"
                      value={repHour}
                      onChange={(e) => setRepHour(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-stone-500 mb-1">อาการเสีย / ลักษณะความชำรุดโดยสังเขป</label>
                  <textarea
                    rows={2}
                    className="w-full bg-stone-50 border border-slate-755 rounded-xl px-4 py-2 text-stone-800 outline-none text-xs focus:border-orange-500"
                    placeholder="เช่น หม้อน้ำระบายไม่ทันสะสมแรงดัน, กระบอกตักฝั่งซ้ายซีลโพลียูรีเทนรั่วมีน้ำมันพุ่ง..."
                    value={repDesc}
                    onChange={(e) => setRepDesc(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-stone-500 mb-1">แคมป์สถานที่เช็คอิน / พิกัดดาวเทียม (GPS)</label>
                  <input
                    type="text"
                    className="w-full bg-stone-50 border border-slate-755 rounded-xl px-4 py-2 text-stone-700 outline-none text-xs"
                    value={repGps}
                    onChange={(e) => setRepGps(e.target.value)}
                  />
                </div>

                {/* Custom File Upload & Preview Section */}
                <div className="bg-stone-50 p-4 border border-dashed border-stone-300 rounded-xl" id="repair-photo-uploader">
                  <span className="block text-xs font-medium text-stone-700 mb-1">📷 แนบรูปภาพแจ้งซ่อม (ส่งเข้าระบบจัดการแยกโฟลเดอร์ Google Drive อัตโนมัติ)</span>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="flex flex-col items-center justify-center bg-white border border-stone-200 rounded-lg p-3 cursor-pointer hover:border-orange-500 transition-colors w-24 h-20 text-center shrink-0">
                      <Camera className="w-5 h-5 text-stone-500 mb-1" />
                      <span className="text-[10px] text-stone-500">เลือกไฟล์</span>
                      <input
                        id="repair-file-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const rd = new FileReader();
                            rd.onload = () => setUploadedPhotoBase64(rd.result as string);
                            rd.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    
                    {uploadedPhotoBase64 ? (
                      <div className="relative w-24 h-20 border border-stone-200 rounded-lg overflow-hidden group">
                        <img src={uploadedPhotoBase64} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setUploadedPhotoBase64('')}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold"
                        >
                          ลบรูปภาพ
                        </button>
                      </div>
                    ) : (
                      <div className="text-[11px] text-stone-400">
                        ยังไม่ได้แนบรูปภาพประกอบความชำรุด ระบบพร้อมจัดกลุ่มพิกัดและสร้างโฟลเดอร์ /แจ้งซ่อม/{new Date().getFullYear()}/{String(new Date().getMonth()+1).padStart(2, '0')} บน Google Drive
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    disabled={isUploadingPhoto}
                    className="bg-stone-50 hover:bg-stone-50 text-stone-500 hover:text-stone-700 px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isUploadingPhoto}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow disabled:opacity-75 flex items-center gap-1.5"
                  >
                    {isUploadingPhoto ? (
                      <>
                        <div className="animate-spin rounded-full h-3 h-3 border-2 border-white border-t-transparent"></div>
                        กำลังอัปโหลดรูปภาพไปยัง Google Drive...
                      </>
                    ) : (
                      "ยื่นบันทึกใบแจ้งซ่อม"
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Regular fault reports row list */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[300px] overflow-y-auto pr-1">
                {repairs.map(r => {
                  const associatedMach = machinery.find(m => m.id === r.machineryId);
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedRepairId(r.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        r.id === selectedRepairId
                          ? 'bg-orange-500/10 border-orange-500/50 shadow-md'
                          : 'bg-white/40 border-stone-200 hover:bg-stone-50/60'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-orange-600 font-bold font-mono">รหัสคดี: {r.id}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                            r.status === 'completed' ? 'bg-emerald-500/10 text-emerald-300' :
                            r.status === 'repairing' ? 'bg-orange-500/10 text-orange-600 animate-pulse' :
                            'bg-rose-500/10 text-rose-300'
                          }`}>
                            {r.status === 'reported' ? 'แจ้งซ่อมใหม่' : r.status === 'repairing' ? 'ช่างกำลังทำ' : 'เสร็จปิดจ็อบ'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-stone-800 leading-tight">
                          เครื่อง: {associatedMach?.code || 'ยานพาหนะร่วม'} ({associatedMach?.model})
                        </h4>
                        <p className="text-[10px] text-stone-500 line-clamp-2 leading-relaxed">{r.problemDesc}</p>
                      </div>

                      <div className="flex justify-between items-center text-[9px] text-slate-500 pt-2 border-t border-slate-900/60 mt-2">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-450" />
                          โดย: {r.reporterName}
                        </span>
                        <span className="font-mono text-slate-450">{r.timestamp.split(' ')[0]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Informative Status Badge Footer */}
        <div className="bg-white/40 border-t border-stone-200 mt-4 pt-3 text-[11px] text-slate-455 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10px] text-stone-500">
            <Camera className="w-4 h-4 text-orange-600 shrink-0" />
            *ระบบสนับสนุนการอัปโหลดวิดีโออาการเสีย, ควันดำ และกล้องประทับพิกัดล้อขย่มสำเร็จรูป
          </span>
          <span className="font-mono text-slate-450">Jobsheet Signed 100% Mobile</span>
        </div>
      </div>

      {/* 2. Right Repair Order Jobsheet details with Signature (4 Columns) */}
      <div className="lg:col-span-4 bg-stone-50/40 border border-stone-200 rounded-2xl p-5 shadow-sm backdrop-blur-md flex flex-col justify-between">
        {selectedRepair ? (
          <div className="space-y-4 flex flex-col justify-between h-full">
            <div className="space-y-3.5">
              <div className="border-b border-stone-200 pb-2 flex justify-between items-center">
                <div>
                  <span className="text-[9px] text-slate-500 font-mono font-bold uppercase">ใบงาน: {selectedRepair.id}</span>
                  <h3 className="text-xs font-semibold text-slate-205">Jobsheet โฟลว์งานซ่อม</h3>
                </div>
                <button
                  onClick={() => onDeleteRepair(selectedRepair.id)}
                  className="p-1 hover:bg-rose-500/25 rounded hover:text-rose-600 text-slate-500"
                  title="ลบเคสนี้"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Photo preview of the machinery issue */}
              {selectedRepair.photoUrl && (
                <div className="rounded-xl overflow-hidden border border-stone-200" id="repair-sidebar-photo-preview">
                  <span className="block bg-stone-100/75 text-[9px] font-bold text-stone-600 px-3 py-1 border-b border-stone-200 uppercase tracking-widest flex items-center gap-1">
                    <Camera className="w-3 h-3 text-orange-500" /> รูปภาพรายงานปัญหา (Google Drive)
                  </span>
                  <div className="relative h-28 bg-stone-150">
                    <img 
                      src={selectedRepair.photoUrl} 
                      alt="Machinery issue preview" 
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform" 
                      onClick={() => window.open(selectedRepair.photoUrl, '_blank')}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              )}

              {/* Status workflow view */}
              <div className="bg-white/40 p-3 rounded-xl space-y-2 text-[11px] leading-relaxed text-stone-600">
                <p>📍 <strong className="text-stone-500">พิกัดทางภูมิศาสตร์:</strong> {selectedRepair.gpsLoc}</p>
                <p>⏱️ <strong className="text-stone-500">เลขมิเนอร์วิ่ง:</strong> {selectedRepair.hoursMeterRecorded} ชม.</p>
                {selectedRepair.assignedTech && (
                  <p>🛠️ <strong className="text-stone-500">ช่างคู่กรรมสิทธิ์:</strong> <span className="font-bold text-sky-400">{selectedRepair.assignedTech}</span></p>
                )}
              </div>

              {selectedRepair.status === 'reported' && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest">มอบหมายช่างนอกสถานที่</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['ช่างวิชัย สารภี', 'ช่างศักดิ์ชาย กองพล', 'ช่างเกรียงไกร เก่งยนต์'].map(tech => (
                      <button
                        key={tech}
                        onClick={() => assignTechnician(tech)}
                        className="py-1.5 px-2 bg-orange-500/10 hover:bg-orange-500 text-orange-600 hover:text-white rounded-lg text-[10px] font-bold transition-all border border-orange-500/20 cursor-pointer"
                      >
                        {tech}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Active checklists */}
              {selectedRepair.status !== 'reported' && (
                <div className="space-y-2 border-t border-stone-200 pt-2.5">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest flex items-center gap-1">
                    <CheckSquare className="w-3.5 h-3.5 text-orange-500" />
                    เช็คลิสต์ซ่อมแซมวิศวกรรม ({selectedRepair.checklist.filter(c => c.done).length}/{selectedRepair.checklist.length})
                  </label>
                  
                  <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-1">
                    {selectedRepair.checklist.map((item, idx) => (
                      <div 
                        key={idx}
                        onClick={() => selectedRepair.status !== 'completed' && toggleChecklistTask(idx)}
                        className="flex items-center gap-2 text-[10px] text-slate-350 cursor-pointer hover:text-stone-800"
                      >
                        {item.done ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                        <span className={item.done ? 'line-through text-slate-500' : 'text-stone-700'}>{item.task}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Digital signature pad box emulator if repairing */}
              {selectedRepair.status === 'repairing' && (
                <div className="space-y-2 border-t border-stone-200 pt-2.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest flex items-center gap-1">
                      <PenTool className="w-3.5 h-3.5 text-sky-400" />
                      เซ็นรับปิดหน้างานผ่านมือถือ (Signature)
                    </label>
                    <button
                      onClick={clearSignature}
                      className="text-[9px] text-slate-500 hover:text-stone-600 font-bold"
                    >
                      ล้างป้าย
                    </button>
                  </div>

                  <div className="relative rounded-xl overflow-hidden border border-slate-750 bg-white">
                    <canvas 
                      ref={canvasRef} 
                      width={220} 
                      height={90} 
                      className="w-full h-[90px] block cursor-crosshair touch-none"
                    ></canvas>
                    {!hasSignature && (
                      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[10px] text-slate-500 select-none pointer-events-none">
                        ใช้นิ้วหรือเมาส์วาดลายเซ็นที่นี่...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Display Signature preview if closed */}
              {selectedRepair.status === 'completed' && (
                <div className="space-y-2 border-t border-stone-200 pt-2.5">
                  <span className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest flex items-center gap-1">
                    <FileBadge className="w-3.5 h-3.5 text-emerald-600" />
                    เอกสารปิดงานสมบูรณ์ (Signature Attached)
                  </span>
                  
                  <div className="rounded-xl h-16 border border-stone-200 bg-white/60 p-1 flex items-center justify-center relative">
                    <span className="absolute right-2 bottom-1.5 text-[8px] font-mono text-emerald-500 font-bold">APPROVED BY ENGINEER</span>
                    {selectedRepair.signature && selectedRepair.signature.startsWith('data:') ? (
                      <img src={selectedRepair.signature} alt="Engineer Digital Sign" className="h-full object-contain filter invert opacity-80" />
                    ) : (
                      <div className="text-[10px] text-emerald-600 font-bold font-mono">=== SIGNATURE_ATTACHED ===</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Close repair order action */}
            {selectedRepair.status === 'repairing' && (
              <button
                onClick={closeRepairOrder}
                disabled={!hasSignature}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  hasSignature 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow shadow-emerald-500/20' 
                    : 'bg-stone-50 text-slate-500 cursor-not-allowed border border-slate-750'
                }`}
              >
                <Check className="w-4 h-4" />
                เซ็นรับและสั่งปิดงาน (Close Order)
              </button>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic text-center my-auto">ไม่มีความเคลื่อนไหวซ่อมแซม</p>
        )}
      </div>
    </div>

    {/* Table of All Repair Requests */}
    <div className="bg-white p-6 rounded-3xl border border-stone-200/50 shadow-sm mt-8" id="all-repair-records-table">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 border-b border-stone-100 pb-4">
        <div>
          <h2 className="text-md font-bold text-stone-800 font-sans tracking-tight">ตารางประวัติคำร้องใบแจ้งซ่อมเครื่องจักรทั้งหมด</h2>
          <p className="text-xs text-stone-500 mt-1 font-sans">
            รายการบันทึกอาการขัดข้อง ระบบตรวจสอบช่าง และเอกสารไฟล์ลงนามวิศวกรเครื่องกล
          </p>
        </div>
        <span className="bg-[#fffdf2] text-amber-700 text-xs font-mono px-3 py-1 rounded-xl border border-amber-200/60 font-bold shrink-0">
          ทั้งหมด {repairs.length} รายการ
        </span>
      </div>

      {repairs.length === 0 ? (
        <div className="text-center py-12 text-stone-400 text-xs bg-stone-50 rounded-2xl border border-dashed border-stone-200">
           ไม่มีผลงานแจ้งซ่อมในระบบฐานข้อมูล
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-600 border-collapse">
            <thead>
              <tr className="border-b border-stone-200/60 text-stone-400 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">เลขที่</th>
                <th className="py-3 px-3">เครื่องจักรกล</th>
                <th className="py-3 px-3">อาการขัดข้องที่รายงาน</th>
                <th className="py-3 px-3">วิศวกรผู้แจ้ง</th>
                <th className="py-3 px-3">รายละเอียดซ่อมของช่าง</th>
                <th className="py-3 px-3">วันเวลาแจ้งซ่อม</th>
                <th className="py-3 px-3 text-right">สถานะคืบหน้า</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {repairs.map((r) => {
                const machine = machinery.find(m => m.id === r.machineryId);
                return (
                  <tr 
                    key={r.id} 
                    className="hover:bg-stone-50/80 transition-colors cursor-colors cursor-pointer"
                    onClick={() => {
                      setSelectedRepairId(r.id);
                    }}
                  >
                    <td className="py-3.5 px-3 font-mono text-stone-550 shrink-0">
                      {r.id.substring(0, 8)}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-stone-800">
                      <div>
                        {machine?.code || 'ยานยนต์ร่วม'}
                        <span className="block text-[10px] text-stone-400 font-normal">{machine?.brand} {machine?.model}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-stone-700 max-w-xs truncate">
                      {r.problemDesc}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-stone-600">
                      {r.reporterName}
                    </td>
                    <td className="py-3.5 px-3 text-stone-600 italic">
                      {r.assignedTech ? `ช่างเบิก: ${r.assignedTech}` : <span className="text-stone-300">รอมอบหมายช่าง</span>}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-stone-500">
                      {r.timestamp}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full font-extrabold text-[9.5px] ${
                        r.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        r.status === 'repairing' ? 'bg-orange-50 text-orange-600 border border-orange-105 animate-pulse' :
                        'bg-rose-50 text-rose-600 border border-rose-105'
                      }`}>
                        {r.status === 'completed' ? 'เสร็จปิดจ็อบ' :
                         r.status === 'repairing' ? 'ช่างกำลังทำ' : 'แจ้งซ่อมใหม่'}
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
