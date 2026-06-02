import React, { useState, useRef, useEffect } from 'react';
import { 
  CheckCircle2, 
  Camera, 
  MapPin, 
  FileCheck, 
  ChevronRight, 
  Upload, 
  Sparkles, 
  Wrench, 
  User, 
  ArrowRight,
  RefreshCw,
  Clock
} from 'lucide-react';
import { WorkScheduleTask } from '../types';
import { saveTask } from '../supabaseService';
import { sendLineJobSubmissionNotification } from '../utils/lineNotify';

interface JobSubmissionViewProps {
  tasks: WorkScheduleTask[];
  onTaskUpdated: (updated: WorkScheduleTask) => void;
  theme: 'orange' | 'blue' | 'yellow' | 'green';
}

export default function JobSubmissionView({ tasks, onTaskUpdated, theme }: JobSubmissionViewProps) {
  // Styles based on theme
  const getThemeStyles = () => {
    switch (theme) {
      case 'orange':
        return {
          bg: 'bg-orange-500',
          text: 'text-orange-500',
          border: 'border-orange-500/20',
          ring: 'focus:ring-orange-500/20',
          btnPrimary: 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/10',
          accentBg: 'bg-orange-50',
          iconColor: 'text-orange-500',
        };
      case 'yellow':
        return {
          bg: 'bg-amber-500',
          text: 'text-amber-500',
          border: 'border-amber-500/20',
          ring: 'focus:ring-amber-500/20',
          btnPrimary: 'bg-amber-500 hover:bg-amber-600 text-neutral-900 shadow-amber-500/10',
          accentBg: 'bg-amber-50',
          iconColor: 'text-amber-600',
        };
      case 'green':
        return {
          bg: 'bg-emerald-600',
          text: 'text-emerald-500',
          border: 'border-emerald-600/20',
          ring: 'focus:ring-emerald-600/20',
          btnPrimary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10',
          accentBg: 'bg-emerald-50',
          iconColor: 'text-emerald-600',
        };
      default: // blue
        return {
          bg: 'bg-blue-600',
          text: 'text-blue-500',
          border: 'border-blue-500/20',
          ring: 'focus:ring-blue-500/20',
          btnPrimary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10',
          accentBg: 'bg-blue-50',
          iconColor: 'text-blue-600',
        };
    }
  };

  const style = getThemeStyles();

  // Active / pending tasks to choose from
  const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');

  // Form State
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [customTaskTitle, setCustomTaskTitle] = useState<string>('');
  
  const [workerName, setWorkerName] = useState<string>('');
  const [workDetails, setWorkDetails] = useState<string>('');
  const [progress, setProgress] = useState<number>(100);
  const [gpsLocation, setGpsLocation] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  
  // UI Loading/Status States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [cameraMode, setCameraMode] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto Geolocate
  const getGPSCoords = () => {
    if (!navigator.geolocation) {
      setGpsLocation('18.7912, 98.9856'); // baseline fallbacks
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const text = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
        setGpsLocation(text);
        setGpsLoading(false);
      },
      () => {
        setGpsLocation('18.791522, 98.986105');
        setGpsLoading(false);
      },
      { timeout: 7000 }
    );
  };

  useEffect(() => {
    getGPSCoords();
  }, []);

  // Web camera controls
  const handleStartCamera = async () => {
    try {
      setCameraMode(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (e) {
      console.error("Camera access failed", e);
      setCameraMode(false);
      alert("⚠️ ไม่สนับสนุนหรือเข้าถึงกล้องถ่ายภาพไม่ได้ กรุณาใช้ป้อนอัปโหลดไฟล์รูปภาพแกลเลอรีแทน");
    }
  };

  const handleStopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setCameraMode(false);
  };

  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setPhotoUrl(dataUrl);
      }
      handleStopCamera();
    }
  };

  // Local File Upload Convert to Base64 (UTF-8, Thai compatible)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("⚠️ ไม่บรรลุเป้าหมาย: ขนาดไฟล์ต้องไม่เกิน 5MB เพื่อความฉับไวในการส่งข้อมูล");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPhotoUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    let taskTitle = '';
    let targetTask: WorkScheduleTask | null = null;
    
    if (selectedTaskId === 'custom') {
      if (!customTaskTitle.trim()) {
        alert("⚠️ กรุณาระบชื่อชื่องานปฏิบัติการ");
        return;
      }
      taskTitle = customTaskTitle.trim();
    } else {
      targetTask = tasks.find(t => t.id === selectedTaskId) || null;
      if (!targetTask) {
        alert("⚠️ กรุณาเลือกงานที่ได้รับมอบระบุในระบบ");
        return;
      }
      taskTitle = targetTask.title;
    }

    if (!workerName.trim()) {
      alert("⚠️ กรุณาระบุชื่อช่างผู้ส่งงาน");
      return;
    }

    setIsSubmitting(true);

    try {
      const finalStatus = progress === 100 ? 'completed' : 'in_progress';
      let taskToSave: WorkScheduleTask;

      if (targetTask) {
        // Update existing task details in Supabase
        const updatedTimeline = [
          ...targetTask.timeline,
          {
            status: finalStatus as any,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
            note: `ส่งมอบรายงานผลงานระดับ ${progress}% โดยช่างชำนาญการ: ${workerName}. รายละเอียด: ${workDetails}`
          }
        ];

        const updatedPhotos = photoUrl ? [...(targetTask.photoUrls || []), photoUrl] : (targetTask.photoUrls || []);
        
        taskToSave = {
          ...targetTask,
          status: finalStatus as any,
          photoUrls: updatedPhotos,
          timeline: updatedTimeline,
        };
      } else {
        // Create new schedule task record for standard job reporting directly mapped
        taskToSave = {
          id: `tsk-${Math.floor(Math.random() * 900) + 100}`,
          title: taskTitle,
          description: workDetails,
          assignedTo: workerName,
          priority: 'medium',
          dueDate: new Date().toISOString().split('T')[0],
          gpsLocName: gpsLocation || 'ไซต์งานหลัก CMMS',
          status: finalStatus as any,
          timeline: [
            {
              status: finalStatus as any,
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
              note: `ช่างทำรายการส่งงานด่วนระดับ ${progress}% รายชื่อ: ${workerName}. รายละเอียด: ${workDetails}`
            }
          ],
          comments: [],
          photoUrls: photoUrl ? [photoUrl] : [],
          employees: [workerName],
          locations: gpsLocation ? [gpsLocation] : []
        };
      }

      // 1. Save Task directly to Supabase with real state consistency
      await saveTask(taskToSave);
      
      // Update global application screen state
      onTaskUpdated(taskToSave);

      // 2. Fire Line Flex message with the beautiful custom alert context
      await sendLineJobSubmissionNotification(
        taskTitle,
        workerName,
        workDetails,
        progress,
        gpsLocation,
        photoUrl || undefined
      );

      // Alert Success
      alert(`🎉 บันทึกข้อมูลผลงานจริง และส่งสติ๊กเกอร์ LINE Flex Message แจ้งเตือนเสร็จสิ้นไร้รอยต่อ 100%!`);
      
      // Reset Fields
      setSelectedTaskId('');
      setCustomTaskTitle('');
      setWorkDetails('');
      setPhotoUrl('');
    } catch (err: any) {
      console.error(err);
      alert(`❌ เกิดข้อผิดพลาดในการบันทึก Supabase: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-2" id="job-completion-submission">
      {/* Page Header */}
      <div className="mb-6 bg-white p-5 rounded-3xl border border-stone-200/50 shadow-sm flex items-center gap-4">
        <div className={`p-3.5 rounded-2xl ${style.bg} bg-opacity-10 text-white flex justify-center items-center`}>
          <FileCheck className={`w-6 h-6 ${style.text}`} />
        </div>
        <div>
          <h1 className="text-lg font-black text-stone-800">ส่งรายงานผลการปฏิบัติงาน</h1>
          <p className="text-xs text-stone-500 mt-1">
            บันทึกการส่งงานจริง ตรวจสอบความสมบูรณ์ อัปโหลดภาพถ่ายพิกัด GPS อัปเดต Supabase และส่งข้อมูลเข้าสู่กลุ่มไลน์ทีมงานช่างโดยตรง
          </p>
        </div>
      </div>

      {/* Main Submission Board Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-stone-250/60 shadow-sm space-y-5">
            <h2 className="text-xs uppercase font-extrabold text-stone-400 tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-500" />
              ฟอร์มกรอกรายงานภารกิจ (Active Reporting Card)
            </h2>

            {/* Select Active Task */}
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1.5">1. เลือกแผนงานปฏิบัติการในระบบ</label>
              <select
                className="w-full text-xs rounded-xl p-3 border border-stone-200 bg-stone-50 outline-none focus:ring-2 focus:border-stone-300"
                value={selectedTaskId}
                onChange={(e) => {
                  setSelectedTaskId(e.target.value);
                  if (e.target.value !== 'custom' && e.target.value !== '') {
                    const found = tasks.find(t => t.id === e.target.value);
                    if (found) {
                      setWorkerName(found.assignedTo || '');
                    }
                  }
                }}
                required
              >
                <option value="">-- กรุณาเลือกรายการงานด้านล่าง --</option>
                {activeTasks.map(t => (
                  <option key={t.id} value={t.id}>
                    [{t.id}] {t.title} - (ช่างดูแล: {t.assignedTo})
                  </option>
                ))}
                <option value="custom">➕ บันทึกส่งงานอื่นภายนอก (กรอกมือใหม่)</option>
              </select>
            </div>

            {/* Custom Task title when selected custom */}
            {selectedTaskId === 'custom' && (
              <div className="animate-fade-in">
                <label className="block text-xs font-semibold text-stone-600 mb-1">ระบุหัวข้อ/รายละเอียดงานปฏิบัติการใหม่</label>
                <input
                  type="text"
                  placeholder="เช่น ซ่อมแก้ช่วงล่างรถเกรดเบอร์ 2"
                  className="w-full text-xs rounded-xl p-3 border border-stone-200 outline-none"
                  value={customTaskTitle}
                  onChange={(e) => setCustomTaskTitle(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Worker & Technician Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1.5">2. ชื่อช่างผู้ดำเนินการส่งมอบงาน</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-stone-400"><User className="w-4 h-4" /></span>
                  <input
                    type="text"
                    placeholder="ป้อนชื่อผู้ปฏิบัติงาน เช่น นายภานุ โชคดี"
                    className="w-full text-xs rounded-xl pl-9 pr-3 py-3 border border-stone-200 outline-none"
                    value={workerName}
                    onChange={(e) => setWorkerName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1.5">3. ระบุระดับความเสร็จสมบูรณ์ (%)</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="10"
                      className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      value={progress}
                      onChange={(e) => setProgress(Number(e.target.value))}
                    />
                  </div>
                  <div className={`px-3 py-1.5 rounded-xl font-bold text-xs ${progress === 100 ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                    {progress}% {progress === 100 ? 'เสร็จสิ้น 100%' : 'ระหว่างทำ'}
                  </div>
                </div>
              </div>
            </div>

            {/* Work details Summary */}
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1.5">4. รายละเอียดผลงานสรุปการปฏิบัติงานเพิ่มเติม</label>
              <textarea
                rows={3}
                placeholder="เช่น เปลี่ยนซีลกระบอกไฮดรอลิคและอัดจารบีหัวบูชเรียบร้อย ทดสอบแรงดันน้ำมันไฮดรอลิคไม่พบการรั่วซีมรอบเครื่องยนต์ ทำงานปรกติ"
                className="w-full text-xs rounded-xl p-3 border border-stone-200 outline-none"
                value={workDetails}
                onChange={(e) => setWorkDetails(e.target.value)}
                required
              />
            </div>

            {/* GPS Tracker Container */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-150/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  พิกัดละติจูด-ลองจิจูด (GPS Verification)
                </span>
                <button
                  type="button"
                  onClick={getGPSCoords}
                  className="text-[10px] text-stone-500 font-extrabold hover:text-stone-850 flex items-center gap-1 bg-white border px-2.5 py-1 rounded-lg shadow-sm"
                  disabled={gpsLoading}
                >
                  <RefreshCw className={`w-3 h-3 ${gpsLoading ? 'animate-spin' : ''}`} />
                  จับตำแหน่งปัจจุบัน
                </button>
              </div>
              <input
                type="text"
                className="w-full text-xs font-mono rounded-xl p-2.5 bg-white border border-stone-200 outline-none text-stone-600"
                placeholder="เช่น 18.784231, 98.99501"
                value={gpsLocation}
                onChange={(e) => setGpsLocation(e.target.value)}
              />
            </div>

            {/* Photos & Camera Capturing Container */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-600">5. แนบรูปถ่ายส่งผลงาน (Webcam หรืออัปโหลดไฟล์)</label>
              
              {/* Camera Preview */}
              {cameraMode && (
                <div className="border border-stone-200 rounded-3xl overflow-hidden bg-stone-900 relative">
                  <video ref={videoRef} autoPlay playsInline className="w-full max-h-72 object-cover"></video>
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleCapture}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-emerald-700 active:scale-95 transition-all"
                    >
                      กดถ่ายภาพหน้าจอ
                    </button>
                    <button
                      type="button"
                      onClick={handleStopCamera}
                      className="px-4 py-2 bg-stone-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-stone-705 active:scale-95 transition-all"
                    >
                      ปิดกล้อง
                    </button>
                  </div>
                </div>
              )}

              {/* Photo Options Panel */}
              {!cameraMode && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Camera button triggers */}
                  <button
                    type="button"
                    onClick={handleStartCamera}
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-stone-200 rounded-3xl hover:border-orange-500 hover:bg-orange-50/10 transition-all cursor-pointer group"
                  >
                    <Camera className="w-8 h-8 text-stone-400 group-hover:text-orange-505 mb-2 transition-all" />
                    <span className="text-xs font-extrabold text-stone-700">เปิดกล้องถ่ายภาพ</span>
                    <span className="text-[10px] text-stone-450 mt-1">ใช้เว็บแคมหน้างานได้ทันที</span>
                  </button>

                  {/* Upload button triggers */}
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-stone-200 rounded-3xl hover:border-emerald-500 hover:bg-emerald-50/10 transition-all cursor-pointer group">
                    <Upload className="w-8 h-8 text-stone-400 group-hover:text-emerald-505 mb-2 transition-all" />
                    <span className="text-xs font-extrabold text-stone-700">เลือกรูปภาพจากมือถือ</span>
                    <span className="text-[10px] text-stone-450 mt-1">รองรับ JPG, PNG สูงสุด 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              )}

              {/* Thumbnail Previews */}
              {photoUrl && (
                <div className="mt-3 bg-stone-50 p-3 rounded-2xl border border-stone-150 relative inline-block">
                  <img src={photoUrl} alt="Preview capture completion" className="max-h-40 rounded-xl object-contain border border-stone-200" />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-black hover:bg-red-600 cursor-pointer shadow-md"
                  >
                    &times;
                  </button>
                  <div className="text-[9.5px] text-stone-400 mt-1 font-mono">{photoUrl.slice(0, 35)}...</div>
                </div>
              )}
            </div>

            {/* Form submission controls */}
            <div className="pt-4 border-t border-stone-200/60 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex items-center gap-2 px-9 py-3.5 rounded-2xl font-black text-xs cursor-pointer shadow-lg transition-all duration-300 transform active:scale-95 ${
                  isSubmitting ? 'bg-stone-300 text-stone-500 cursor-not-allowed' : style.btnPrimary
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    กำลังซิงค์ Supabase & ส่ง LINE...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    ยืนยันรายงานผลส่งมอบแผนงาน
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Dashboard sidebar info help */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-6 rounded-3xl shadow-sm">
            <h3 className="text-sm font-black flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4" />
              คำแนะนำงานส่งมอบจริง
            </h3>
            <div className="space-y-3.5 text-xs text-emerald-50/90 leading-relaxed">
              <div className="flex gap-2">
                <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-black shrink-0">1</div>
                <div>เลือกแผนงานปฏิบัติการให้ตรงตามเป้าหมายของทีมซ่อมบำรุง</div>
              </div>
              <div className="flex gap-2">
                <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-black shrink-0">2</div>
                <div>แนบภาพถ่ายชิ้นงานที่สำเร็จ เพื่อสร้างเป็นหลักฐานในการตรวจสอบวิศวกรรม</div>
              </div>
              <div className="flex gap-2">
                <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-black shrink-0">3</div>
                <div>เมื่อกดบันทึกสำเร็จ ข้อมูลจะถูกบันทึกและส่งรายงาน Flex Message เข้าสู่ห้องแชทไลน์กลุ่มทันทีโดยไม่ต้องไปโพสต์ซ้ำ</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200/50 shadow-sm">
            <h3 className="text-xs uppercase font-extrabold text-stone-400 mb-3 tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> แผนงานล่าสุดในระบบ ({activeTasks.length})
            </h3>
            {activeTasks.length === 0 ? (
              <p className="text-stone-450 text-xs">🎉 ยอดเยี่ยม! ไม่มีงานค้างในระบบปฏิทิน</p>
            ) : (
              <div className="divide-y divide-stone-100 max-h-60 overflow-y-auto">
                {activeTasks.map(t => (
                  <div key={t.id} className="py-2.5 flex items-center justify-between text-xs cursor-pointer hover:bg-stone-50 rounded-lg px-1 transition-colors" onClick={() => setSelectedTaskId(t.id)}>
                    <div className="truncate pr-2">
                      <p className="font-bold text-stone-800 truncate">{t.title}</p>
                      <p className="text-[10px] text-stone-450 truncate">ช่าง {t.assignedTo || 'รอกำหนดช่าง'}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
