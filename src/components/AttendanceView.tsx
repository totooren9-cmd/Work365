/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  MapPin, 
  User, 
  UserCheck, 
  Sparkles, 
  Timer, 
  Coffee, 
  ArrowUpRight, 
  Camera, 
  Smartphone
} from 'lucide-react';
import { AttendanceLog } from '../types';

interface AttendanceViewProps {
  attendances: AttendanceLog[];
  onAddAttendance: (log: AttendanceLog) => void;
  onUpdateAttendance: (log: AttendanceLog) => void;
}

export default function AttendanceView({ attendances, onAddAttendance, onUpdateAttendance }: AttendanceViewProps) {
  const [selectedLogId, setSelectedLogId] = useState<string | null>(attendances[0]?.id || null);
  const [showClockForm, setShowClockForm] = useState(false);

  // New check-in state parameters
  const [workName, setWorkName] = useState('ช่างวิรัช ทองแท้');
  const [workRole, setWorkRole] = useState('ผู้ควบคุมพวงมาลัยอาวุโส');
  const [workSite, setWorkSite] = useState('ไซต์ก่อสร้างเขื่อนกั้นน้ำปิง');
  const [isOvertime, setIsOvertime] = useState(false);

  // GPS coordinates state simulation
  const [gpsSim, setGpsSim] = useState('18.7904, 98.9841 (WiFi-Camp ชลประทานปิง)');

  // Selected details
  const selectedLog = useMemo(() => {
    return attendances.find(a => a.id === selectedLogId) || null;
  }, [attendances, selectedLogId]);

  // Compute daily metrics
  const summary = useMemo(() => {
    const totalCount = attendances.length;
    const activeChecking = attendances.filter(a => !a.checkOutTime).length;
    const otCount = attendances.filter(a => a.isOvertime).length;
    const lateApproaches = attendances.filter(a => a.checkInTime > '08:00').length; // simple threshold mock

    return {
      totalCount,
      activeChecking,
      otCount,
      lateApproaches
    };
  }, [attendances]);

  // Perform clock checkout
  const handleCheckOut = (log: AttendanceLog) => {
    onUpdateAttendance({
      ...log,
      checkOutTime: new Date().toTimeString().slice(0, 5),
      gpsLocOut: '18.7915, 98.9860'
    });
    alert(`👋 ทำการลงชื่อออฟไลน์เช็คเอ้าต์วิศวกร [${log.employeeName}] เรียบร้อย เวลาสั่นสมบูรณ์!`);
  };

  // Perform Clock check-in
  const handleCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workName) return;

    const formattedTime = new Date().toTimeString().slice(0, 5); // HH:MM style

    const newLog: AttendanceLog = {
      id: `att-${Date.now()}`,
      employeeName: workName,
      role: workRole,
      checkInTime: formattedTime,
      siteName: workSite,
      isOvertime,
      photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
      gpsLocIn: gpsSim
    };

    onAddAttendance(newLog);
    setSelectedLogId(newLog.id);
    setShowClockForm(false);
  };

  const handleMockGPSPin = () => {
    const simulatedGpsLocations = [
      '18.7951, 98.9790 (ค่ายฝั่งขวา ถนลำพูนโฮเต็ล)',
      '18.7904, 98.9841 (WiFi-Camp ชลประทานปิง)',
      '18.7831, 98.9950 (สำนักงานใหญ่ศูนย์สถิติ CMMS)'
    ];
    const picked = simulatedGpsLocations[Math.floor(Math.random() * simulatedGpsLocations.length)];
    setGpsSim(picked);
    alert(`📍 [GPS PIN SELECTION SUCCESS] ดึงพิกัดผ่านดาวเทียมสแกนความถี่เซลลูลาร์สำเร็จ ปักหมุด: ${picked}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="attendance-log-main">
      {/* 1. Left Logs Cards Panel (8 Columns) */}
      <div className="lg:col-span-8 bg-stone-50/40 border border-stone-200 rounded-2xl p-5 shadow-sm backdrop-blur-md flex flex-col justify-between">
        <div>
          {/* Daily metrics indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-b border-stone-200 pb-5">
            <div className="bg-white p-3 rounded-xl border border-slate-900 flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] text-slate-450 font-bold block mb-0.5">พนักงานสแกนวันนี้</span>
                <span className="text-sm font-mono text-stone-800 font-extrabold">{summary.totalCount} คน</span>
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-900 flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg shrink-0">
                <Timer className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] text-slate-450 font-bold block mb-0.5">อยู่ระหว่างทำเบรก</span>
                <span className="text-sm font-mono text-stone-800 font-extrabold">{summary.activeChecking} คน</span>
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-900 flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg shrink-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] text-slate-450 font-bold block mb-0.5">ทำงานล่วงเวลา (OT)</span>
                <span className="text-sm font-mono text-amber-400 font-extrabold">{summary.otCount} กะ</span>
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-900 flex items-center gap-3">
              <div className="p-2 bg-rose-500/10 text-rose-600 rounded-lg shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] text-slate-450 font-bold block mb-0.5">สายสะสมสถิติ</span>
                <span className="text-sm font-mono text-rose-600 font-extrabold">{summary.lateApproaches} คน</span>
              </div>
            </div>
          </div>

          {/* Action Row tab triggers */}
          <div className="flex justify-between items-center mt-4 border-b border-stone-200 pb-3">
            <h3 className="text-xs font-bold text-slate-350">ประวัติสแกนการลงเวลางานพฤหัสที่ 28 พฤษภาคม 2026</h3>
            <button
              onClick={() => setShowClockForm(true)}
              className="bg-orange-500 hover:bg-orange-600 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              จำลองกล้องพิกัดตอกบัตร
            </button>
          </div>

          {/* Clock-in forms vs Logs grids */}
          <div className="mt-4">
            {showClockForm ? (
              /* Clock check-in form */
              <form onSubmit={handleCheckInSubmit} className="space-y-4 bg-white/50 p-5 rounded-2xl border border-stone-200">
                <h3 className="text-xs font-bold text-orange-600 uppercase tracking-wider">🤳 สแกนสถิติใบหน้าและจับระบุกุมอำนาจทางพิกัด (Face Log)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">ชื่อพนักงานปฏิบัติการ</label>
                    <input
                      type="text"
                      className="w-full bg-stone-50 border border-slate-755 rounded-xl px-4 py-2 text-stone-800 outline-none text-xs focus:border-orange-500"
                      value={workName}
                      onChange={(e) => setWorkName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">ตำแหน่งวิชาชีพ</label>
                    <input
                      type="text"
                      className="w-full bg-stone-50 border border-slate-755 rounded-xl px-4 py-2 text-stone-700 outline-none text-xs"
                      value={workRole}
                      onChange={(e) => setWorkRole(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs text-stone-500 mb-1">ไซต์ก่อสร้าง / หรือป้อมโครงการ</label>
                    <input
                      type="text"
                      className="w-full bg-stone-50 border border-slate-755 rounded-xl px-4 py-2 text-slate-205 outline-none text-xs"
                      value={workSite}
                      onChange={(e) => setWorkSite(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center pt-5 pl-2">
                    <input
                      type="checkbox"
                      id="form-ot"
                      className="w-4 h-4 accent-orange-500 rounded border-stone-200 bg-stone-50 cursor-pointer"
                      checked={isOvertime}
                      onChange={(e) => setIsOvertime(e.target.checked)}
                    />
                    <label htmlFor="form-ot" className="text-xs text-slate-350 ml-2 font-semibold cursor-pointer">
                      ลงเวลาเป็นกะล่วงเวลา (OT)
                    </label>
                  </div>
                </div>

                {/* Simulated GPS Coordinate Pull Widget */}
                <div className="space-y-2 pt-2 border-t border-slate-900">
                  <div className="flex items-center justify-between">
                    <span className="block text-[10px] text-slate-450 uppercase font-black">ตัวรับสแกนพิกัดดาวเทียม (GPS Lock)</span>
                    <button
                      type="button"
                      onClick={handleMockGPSPin}
                      className="text-[10px] text-orange-600 hover:text-orange-350 font-bold flex items-center gap-1"
                    >
                      🗺️ ดึงพิกัดพยานสะสมร่วม
                    </button>
                  </div>
                  <div className="bg-stone-50 p-2.5 rounded-xl text-stone-600 font-mono text-[10px] truncate border border-stone-200">
                    {gpsSim}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowClockForm(false)}
                    className="bg-stone-50 hover:bg-stone-50 text-stone-500 hover:text-stone-700 px-4 py-2 rounded-xl text-xs font-semibold"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow"
                  >
                    Check-In สแกนเช็คชื่อทางไกล
                  </button>
                </div>
              </form>
            ) : (
              /* Regular attendance rows grid */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[300px] overflow-y-auto pr-1">
                {attendances.map(log => {
                  const checkInLate = log.checkInTime > '08:00';
                  return (
                    <div
                      key={log.id}
                      onClick={() => setSelectedLogId(log.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                        log.id === selectedLogId
                          ? 'bg-orange-500/10 border-orange-500/50 shadow-md scale-[1.01]'
                          : 'bg-white/40 border-stone-200 hover:bg-slate-905/60'
                      }`}
                    >
                      {/* Avatar preview decoration thumbnail */}
                      <div className="relative rounded-xl overflow-hidden w-11 h-11 shrink-0 bg-white border border-stone-200">
                        <img src={log.photoUrl} alt="Staff avatar" className="w-full h-full object-cover" />
                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#121c2e] ${
                          log.checkOutTime ? 'bg-slate-500' : 'bg-emerald-400 animate-pulse'
                        }`}></span>
                      </div>

                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-stone-800 truncate leading-tight">{log.employeeName}</h4>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                            log.isOvertime ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'
                          }`}>
                            {log.isOvertime ? 'มีกะ OT' : 'วันทำการปกติ'}
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-500">{log.role} | {log.siteName}</p>
                        
                        <div className="flex justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-950/50 mt-1">
                          <span className="flex items-center gap-1">
                            🕒 {log.checkInTime}
                            {checkInLate && <span className="text-rose-450 font-bold ml-1">สาย</span>}
                          </span>
                          <span>{log.checkOutTime ? `👋 ออก: ${log.checkOutTime}` : '🟢 กำลังปฏิบัติงาน'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic status footer info bar */}
        <div className="bg-white/40 border-t border-stone-200 mt-4 pt-3 text-[11px] text-slate-455 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10px] text-stone-500">
            <Timer className="w-4 h-4 text-orange-600 shrink-0" />
            *ระบบใช้วิธียิงเกตกล้องตรวจสอบทางใบหน้า ตรวจสอบรอยลักลอบจดคะแนนเข้าปืนพกพาอย่างยุติธรรมที่สุด
          </span>
          <span className="font-mono text-slate-405">Time Check 360</span>
        </div>
      </div>

      {/* 2. Right Employee Clock-In Detail Drawer File (4 Columns) */}
      <div className="lg:col-span-4 bg-stone-50/40 border border-stone-200 rounded-2xl p-5 shadow-sm backdrop-blur-md flex flex-col justify-between">
        {selectedLog ? (
          <div className="space-y-4 flex flex-col justify-between h-full">
            <div className="space-y-4">
              <div className="border-b border-stone-200 pb-2">
                <span className="text-[9px] text-slate-450 font-mono font-bold uppercase">ID ID: {selectedLog.id}</span>
                <h3 className="text-sm font-semibold text-stone-800">บิตตอกเวลา: {selectedLog.employeeName}</h3>
              </div>

              {/* Attendance metrics visual card details */}
              <div className="bg-white/45 border border-slate-900 p-4 rounded-xl text-[11px] text-stone-600 space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-stone-200 shrink-0">
                    <img src={selectedLog.photoUrl} alt="Staff checkin preview" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-stone-700">{selectedLog.employeeName}</h4>
                    <span className="text-[10px] text-slate-500 block">{selectedLog.role}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-900">
                  <p>📍 <strong className="text-stone-500">ลงพิกัดเช็คอิน:</strong> {selectedLog.siteName}</p>
                  <p>🕒 <strong className="text-stone-500">ตอกเข้างานเวลา:</strong> <span className="font-mono text-emerald-600 font-bold">{selectedLog.checkInTime} น.</span></p>
                  {selectedLog.checkOutTime ? (
                    <p>🕒 <strong className="text-stone-500">ตอกออกงานเวลา:</strong> <span className="font-mono text-stone-500 font-semibold">{selectedLog.checkOutTime} น.</span></p>
                  ) : (
                    <p className="text-emerald-600 animate-pulse font-extrabold flex items-center gap-1">🟢 กำลังทำงานอยู่ในระเบียบวินัย</p>
                  )}
                </div>

                <div className="space-y-2.5 border-t border-slate-900/80 pt-2.5 text-slate-450">
                  <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">กล้องเซลฟี่ที่แสตมป์ยืนยัน (Device Camera Checkin)</span>
                  <div className="h-20 rounded-xl overflow-hidden relative border border-stone-200 bg-white flex items-center justify-center">
                    <img src={selectedLog.photoUrl} alt="Selfie capture log" className="w-16 h-16 rounded-full border border-stone-200 object-cover" />
                    <span className="absolute bottom-1 right-2 text-[8px] bg-stone-50/70 text-slate-350 font-mono px-1 rounded flex items-center gap-0.5">
                      <Camera className="w-2.5 h-2.5" />
                      GPS Camera Match
                    </span>
                  </div>
                </div>
              </div>

              {/* Check-Out active trigger buttons if still checked-in */}
              {!selectedLog.checkOutTime && (
                <button
                  onClick={() => handleCheckOut(selectedLog)}
                  className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl text-xs font-bold border border-rose-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-4"
                >
                  👋 ลงชื่อออกทางไกล (Clock-Out Away)
                </button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic text-center my-auto">ไม่มีประวัติตอกสถิติพนักงานในแผ่นดิน</p>
        )}
      </div>
    </div>
  );
}
