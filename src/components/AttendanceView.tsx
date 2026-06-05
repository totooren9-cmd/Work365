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
import { uploadFileAndNotify } from '../utils/lineNotify';

const DEFAULT_EMPLOYEE_PRESETS = [
  { name: 'Art Kitthana(122427)', role: 'ช่างเครื่องกลอาวุโส', photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' },
  { name: 'Admin2.ชัยนาวิน', role: 'ผู้ดูแลระบบสำนักงาน', photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200' },
  { name: 'AE.ชัยนาวิน (บิว)', role: 'ผู้ดูแลหน้างาน/ประสานการผลิต', photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200' },
  { name: 'B I W T Y 🧸', role: 'เจ้าหน้าที่ธุรการไซต์ประปา', photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200' },
  { name: 'chalwat', role: 'ช่างซ่อมบำรุงล้อเลื่อน', photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200' },
  { name: 'cnw.นำหน้า', role: 'ผู้ควบคุมเครื่องจักรกลหนัก', photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200' },
  { name: 'Max', role: 'โฟร์แมนควบคุมงานโครงสร้าง', photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200' },
  { name: 'Non. นนทนันท์💸 ⚡ 🛡️', role: 'ผู้จัดการแผนกซ่อมบำรุงทั่วไป', photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=200' },
  { name: 'Sitthichai. wongdee', role: 'ช่างเทคนิคอาวุโส', photoUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=200' },
  { name: 'WAVE', role: 'วิศวกรเครื่องจักรกลหน้างาน', photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200' },
  { name: '^ SONGPON ^', role: 'ผู้จัดการโครงการเขื่อนชลประทาน', photoUrl: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&q=80&w=200' },
  { name: 'ช.ชาย เด็กผู้พันตรี', role: 'ช่างไฟฟ้าอาวุโสบริการเครื่องจักร', photoUrl: 'https://images.unsplash.com/photo-1489980508314-941910ded1f4?auto=format&fit=crop&q=80&w=200' },
  { name: 'ธชัย สระทองเขียว', role: 'พนักงานขับรถขนส่งวัสดุหนัก', photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200' },
  { name: 'นำ', role: 'โฟร์แมนอาวุโสตรวจสอบหน้าดิน', photoUrl: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&q=80&w=200' },
  { name: 'ยศ', role: 'ช่างควบคุมระบบปั๊มสูบระบาย', photoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200' },
  { name: 'สุธา ภูชะหาร', role: 'ผู้ช่วยผู้รักษาความปลอดภัยประจำกะ', photoUrl: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&q=80&w=200' },
  { name: 'อั้ม. อนุสรณ์', role: 'วิศวกรซ่อมบำรุงระบบหล่อลื่น', photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200' },
  { name: 'เกด 24 🔑', role: 'เจ้าหน้าที่บริหารความมั่นคงหน้างาน', photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200' },
  { name: 'เป๊ก 🎃', role: 'ช่างขับรถแม็คโคระบบล้อยาง', photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200' },
  { name: 'เหว่า', role: 'พนักงานขับรถแทรกเตอร์ใหญ่ประคองฐาน', photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200' },
  { name: '🌸 กัลยา 🌸', role: 'ผู้จัดการธุรการและบัญชีสนาม', photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200' },
  { name: '🔰 Benz ♉ Nares', role: 'วิศวกรโครงสร้างและระบบนิรภัย', photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200' }
];

interface AttendanceViewProps {
  attendances: AttendanceLog[];
  onAddAttendance: (log: AttendanceLog) => void;
  onUpdateAttendance: (log: AttendanceLog) => void;
  onClearAllData?: () => void;
}

export default function AttendanceView({ 
  attendances, 
  onAddAttendance, 
  onUpdateAttendance,
  onClearAllData
}: AttendanceViewProps) {
  const [selectedLogId, setSelectedLogId] = useState<string | null>(attendances[0]?.id || null);
  const [showClockForm, setShowClockForm] = useState(false);

  // New check-in state parameters
  const [workName, setWorkName] = useState('');
  const [workRole, setWorkRole] = useState('ช่างควบคุมเครื่องจักร');
  const [workSite, setWorkSite] = useState('ไซต์งานชลประทาน B');
  const [isOvertime, setIsOvertime] = useState(false);
  const [photoSim, setPhotoSim] = useState('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200');

  // GPS coordinates state simulation
  const [gpsSim, setGpsSim] = useState('18.7904, 98.9841 (WiFi-Camp ชลประทานปิง)');

  // Attendance Mode & retro states
  const [attendanceMode, setAttendanceMode] = useState<'normal' | 'wfh' | 'retro'>('normal');
  const [retroDate, setRetroDate] = useState(new Date().toISOString().split('T')[0]);
  const [retroInTime, setRetroInTime] = useState('08:00');
  const [retroOutTime, setRetroOutTime] = useState('17:00');
  const [retroReason, setRetroReason] = useState('');
  
  // Overtime Request states
  const [otRequested, setOtRequested] = useState(false);
  const [otRequestedHours, setOtRequestedHours] = useState(2);
  const [otRequestedReason, setOtRequestedReason] = useState('');

  // Supervisor state
  const [supervisorName, setSupervisorName] = useState('เจมส์ สมิท');

  // Employee profile search query
  const [searchEmployeeQuery, setSearchEmployeeQuery] = useState('');

  // Sidebar Filter state
  const [logFilter, setLogFilter] = useState<'all' | 'pending' | 'wfh' | 'retro' | 'ot'>('all');

  // Real camera & GPS states
  const [useRealCamera, setUseRealCamera] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Check-out states
  const [showCheckoutPanel, setShowCheckoutPanel] = useState(false);
  const [checkOutPhoto, setCheckOutPhoto] = useState<string>('');
  const [checkOutGps, setCheckOutGps] = useState<string>('');

  // Edit Employee State Parameters
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editSite, setEditSite] = useState('');
  const [editPhoto, setEditPhoto] = useState('');
  const [editIsOvertime, setEditIsOvertime] = useState(false);
  const [editCheckInTime, setEditCheckInTime] = useState('');
  const [editCheckOutTime, setEditCheckOutTime] = useState('');

  // Extract unique employees directory from database records and merge with defaults
  const uniqueEmployees = useMemo(() => {
    const mapList = new Map<string, { name: string; role: string; photoUrl: string }>();
    DEFAULT_EMPLOYEE_PRESETS.forEach(p => {
      mapList.set(p.name, p);
    });
    attendances.forEach(a => {
      if (a.employeeName && !mapList.has(a.employeeName)) {
        mapList.set(a.employeeName, { name: a.employeeName, role: a.role, photoUrl: a.photoUrl });
      }
    });
    return Array.from(mapList.values());
  }, [attendances]);

  // Filter employees based on search query
  const filteredPresetEmployees = useMemo(() => {
    return uniqueEmployees.filter(employee => 
      employee.name.toLowerCase().includes(searchEmployeeQuery.toLowerCase()) ||
      employee.role.toLowerCase().includes(searchEmployeeQuery.toLowerCase())
    );
  }, [uniqueEmployees, searchEmployeeQuery]);

  // Selected details
  const selectedLog = useMemo(() => {
    return attendances.find(a => a.id === selectedLogId) || null;
  }, [attendances, selectedLogId]);

  const filteredLogs = useMemo(() => {
    return attendances.filter(log => {
      if (logFilter === 'all') return true;
      if (logFilter === 'pending') {
        return log.approvalStatus === 'pending_approval' || (log.otRequest?.isRequested && log.otRequest?.status === 'pending');
      }
      if (logFilter === 'wfh') {
        return log.status === 'wfh';
      }
      if (logFilter === 'retro') {
        return log.attendanceType === 'retro';
      }
      if (logFilter === 'ot') {
        return !!log.otRequest?.isRequested;
      }
      return true;
    });
  }, [attendances, logFilter]);

  const handleClearAllData = () => {
    if (confirm("🗑️ คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลพนักงานและประวัติการทำงานทั้งหมดจากฐานข้อมูล Supabase? การกระทำนี้ไม่สามารถย้อนคืนได้")) {
      if (onClearAllData) {
        onClearAllData();
      }
    }
  };

  // Auto select default name if empty on mounts
  React.useEffect(() => {
    if (!workName && uniqueEmployees.length > 0) {
      setWorkName(uniqueEmployees[0].name);
      setWorkRole(uniqueEmployees[0].role);
      setPhotoSim(uniqueEmployees[0].photoUrl);
    } else if (!workName) {
      setWorkName('สมชาย สยามราช');
    }
  }, [uniqueEmployees]);

  // Automatic state synchronizer when selected employee log changes
  React.useEffect(() => {
    if (selectedLog) {
      setEditName(selectedLog.employeeName);
      setEditRole(selectedLog.role);
      setEditSite(selectedLog.siteName);
      setEditPhoto(selectedLog.photoUrl);
      setEditIsOvertime(selectedLog.isOvertime);
      setEditCheckInTime(selectedLog.checkInTime);
      setEditCheckOutTime(selectedLog.checkOutTime || '');
      setIsEditing(false); // Reset edit state when switching employees
    }
  }, [selectedLog]);

  // Video references
  const checkInVideoRef = React.useRef<HTMLVideoElement>(null);
  const checkOutVideoRef = React.useRef<HTMLVideoElement>(null);

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

  // GPS geolocation handler
  const getRealGPSLocation = (target: 'in' | 'out') => {
    if (!navigator.geolocation) {
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const formatted = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        if (target === 'in') {
          setGpsSim(formatted);
        } else {
          setCheckOutGps(formatted);
        }
        setGpsLoading(false);
      },
      (error) => {
        // Log a silent, informative trace instead of raising noisy warnings or alerts in sandboxed iframe previews
        console.log("GPS lookup: defaulting to baseline map coordinates due to sandboxed iframe/browser permission policy.");
        let fallbackLoc = target === 'in' ? '18.790400, 98.984100' : '18.791500, 98.986000';
        if (target === 'in') {
          setGpsSim(fallbackLoc);
        } else {
          setCheckOutGps(fallbackLoc);
        }
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  // Real webcam handlers
  const startCamera = async (target: 'in' | 'out') => {
    try {
      setCameraLoading(true);
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      setActiveStream(stream);
      setUseRealCamera(true);
      setCameraLoading(false);
      
      setTimeout(() => {
        const video = target === 'in' ? checkInVideoRef.current : checkOutVideoRef.current;
        if (video) {
          video.srcObject = stream;
        }
      }, 100);
    } catch (err: any) {
      console.error("Camera access error:", err);
      alert(`⚠️ ไม่สามารถเปิดกล้องได้: ${err.message || 'กรุณาอนุญาตสิทธิ์การใช้กล้องในเบราว์เซอร์'}`);
      setUseRealCamera(false);
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (activeStream) {
      activeStream.getTracks().forEach(track => track.stop());
      setActiveStream(null);
    }
    setUseRealCamera(false);
  };

  const capturePhoto = (target: 'in' | 'out') => {
    const video = target === 'in' ? checkInVideoRef.current : checkOutVideoRef.current;
    if (!video) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Mirror the selfie capture
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        if (target === 'in') {
          setPhotoSim(dataUrl);
        } else {
          setCheckOutPhoto(dataUrl);
        }
        stopCamera();
      }
    } catch (error) {
      console.error("Capture capture error:", error);
    }
  };

  // Automatic triggers upon visibility
  React.useEffect(() => {
    if (showClockForm) {
      getRealGPSLocation('in');
    }
  }, [showClockForm]);

  React.useEffect(() => {
    if (showCheckoutPanel) {
      getRealGPSLocation('out');
      if (selectedLog) {
        setCheckOutPhoto(selectedLog.photoUrl);
      }
    }
  }, [showCheckoutPanel, selectedLog]);

  React.useEffect(() => {
    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [activeStream]);

  // Perform Clock check-in Submit
  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workName || uploadingPhoto) return;

    setUploadingPhoto(true);
    let finalPhotoUrl = photoSim;
    const docId = `CI-${Date.now().toString().slice(-4)}`;

    const formattedTime = attendanceMode === 'retro'
      ? `${retroInTime} น.`
      : (new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.');

    const statusType = attendanceMode === 'wfh' ? 'wfh' : (formattedTime.replace(' น.', '') > '08:00' ? 'late' : 'present');
    const isWfh = attendanceMode === 'wfh';
    const isRetro = attendanceMode === 'retro';

    if (photoSim.startsWith('data:')) {
      try {
        finalPhotoUrl = await uploadFileAndNotify({
          image: photoSim,
          module: 'Checkin',
          docId,
          uploadBy: workName,
          status: `เข้างานแบบ [${isWfh ? '🏠 WFH' : (isRetro ? '📅 ย้อนหลัง' : '🟢 ปกติ')}]: ${isWfh ? 'สถานที่พักตน' : workSite}`
        });
      } catch (err) {
        console.error("Failed to upload check-in photo:", err);
      }
    } else {
      try {
        const { sendGoogleDriveLineNotification } = await import('../utils/lineNotify');
        const thaiDate = new Date().toLocaleDateString('th-TH') + ' ' + formattedTime;
        await sendGoogleDriveLineNotification({
          docId,
          jobType: isWfh ? 'Check In WFH' : (isRetro ? 'Check In Retroactive' : 'Check In'),
          operator: workName,
          timestamp: thaiDate,
          status: `ลงเวลาเข้างานแบบ [${isWfh ? '🏠 WFH' : (isRetro ? '📅 ย้อนหลัง' : '🟢 ปกติ')}]: ${isWfh ? 'สถานที่พักตน' : workSite}`,
          imageUrl: finalPhotoUrl
        });
      } catch (e) {
        console.warn("Direct notification failed", e);
      }
    }

    const newLog: AttendanceLog = {
      id: `att-${Date.now()}`,
      employeeName: workName,
      role: workRole,
      checkInTime: formattedTime,
      checkOutTime: isRetro && retroOutTime ? `${retroOutTime} น.` : undefined,
      workDate: isRetro ? retroDate : new Date().toISOString().split('T')[0],
      siteName: isWfh ? '🏠 Work From Home (ทำงานที่บ้าน)' : workSite,
      status: statusType,
      isOvertime: otRequested,
      otHours: otRequested ? otRequestedHours : 0,
      photoUrl: finalPhotoUrl,
      gpsLocIn: isWfh ? '13.7563, 100.5018 (พิกัดบ้านพักอาศัย WFH)' : gpsSim,
      gpsLocOut: undefined,
      
      attendanceType: attendanceMode,
      approvalStatus: (isRetro || isWfh || otRequested) ? 'pending_approval' : 'approved',
      reason: isRetro ? retroReason : (isWfh ? 'ปฏิบัติงานแบบ Work From Home' : ''),
      otRequest: otRequested ? {
        isRequested: true,
        hours: otRequestedHours,
        reason: otRequestedReason,
        status: 'pending'
      } : undefined
    };

    onAddAttendance(newLog);
    setSelectedLogId(newLog.id);
    setShowClockForm(false);
    stopCamera();
    setUploadingPhoto(false);
  };

  // Perform Clock check-out Submit
  const handleCheckOutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLog || uploadingPhoto) return;

    setUploadingPhoto(true);
    let finalPhotoUrlOut = checkOutPhoto || selectedLog.photoUrl;
    const docId = `CO-${Date.now().toString().slice(-4)}`;

    if (finalPhotoUrlOut.startsWith('data:')) {
      try {
        finalPhotoUrlOut = await uploadFileAndNotify({
          image: finalPhotoUrlOut,
          module: 'Checkout',
          docId,
          uploadBy: selectedLog.employeeName,
          status: `ออกงานพิกัดสแกน: ${selectedLog.siteName}`
        });
      } catch (err) {
        console.error("Failed to upload check-out photo:", err);
      }
    } else {
      try {
        const { sendGoogleDriveLineNotification } = await import('../utils/lineNotify');
        const thaiDate = new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
        await sendGoogleDriveLineNotification({
          docId,
          jobType: 'Check Out',
          operator: selectedLog.employeeName,
          timestamp: thaiDate,
          status: `ออกงานพิกัดสแกน: ${selectedLog.siteName} (ไม่ได้อัดกล้องจริง)`,
          imageUrl: finalPhotoUrlOut
        });
      } catch (e) {
        console.warn("Direct notification failed", e);
      }
    }

    const formattedTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';

    onUpdateAttendance({
      ...selectedLog,
      checkOutTime: formattedTime,
      photoUrlOut: finalPhotoUrlOut,
      gpsLocOut: checkOutGps || '18.7915, 98.9860'
    });

    setShowCheckoutPanel(false);
    stopCamera();
    setUploadingPhoto(false);
    alert(`👋 ลงประวัติสแกนออกงานและแจ้งเตือนเข้ากลุ่ม LINE เรียบร้อยสำเร็จพร้อมส่งรูปภาพจริง!`);
  };

  // Perform Edit Employee Details Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLog || uploadingPhoto) return;

    setUploadingPhoto(true);
    let finalPhotoUrl = editPhoto;

    // If the edited photo is a base64 string, upload to Express to get public absolute URL
    if (editPhoto.startsWith('data:')) {
      try {
        const response = await fetch('/api/upload-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: editPhoto })
        });
        if (response.ok) {
          const resData = await response.json();
          if (resData.success && resData.url) {
            finalPhotoUrl = resData.url.startsWith('http') ? resData.url : `${window.location.origin}${resData.url}`;
          }
        }
      } catch (err) {
        console.error("Failed to upload updated photo to public API server:", err);
      }
    }

    const updatedLog: AttendanceLog = {
      ...selectedLog,
      employeeName: editName,
      role: editRole,
      siteName: editSite,
      photoUrl: finalPhotoUrl,
      isOvertime: editIsOvertime,
      checkInTime: editCheckInTime,
      checkOutTime: editCheckOutTime ? editCheckOutTime : undefined
    };

    onUpdateAttendance(updatedLog);
    setIsEditing(false);
    setUploadingPhoto(false);
    alert(`✏️ แก้ไขข้อมูลพนักงานเรียบร้อย และแจ้งเตือนห้อง LINE สำเร็จ!`);
  };

  const handleMockGPSPin = () => {
    getRealGPSLocation('in');
  };

  const handleApproveAttendance = (isApproved: boolean) => {
    if (!selectedLog) return;
    const nameToUse = supervisorName.trim() || 'ผู้ดูแลระบบ';
    const updated: AttendanceLog = {
      ...selectedLog,
      approvalStatus: isApproved ? 'approved' : 'rejected',
      approvedBy: nameToUse,
    };
    onUpdateAttendance(updated);
    alert(`👍 บันทึกผลการพิจารณาเวลา เรียบร้อย (สถานะ: ${isApproved ? 'อนุมัติ' : 'ปฏิเสธ'}) เเละทำการยิง LINE เรียบร้อย!`);
  };

  const handleApproveOT = (isApproved: boolean) => {
    if (!selectedLog) return;
    const nameToUse = supervisorName.trim() || 'ผู้ดูแลระบบ';
    const originalOt = selectedLog.otRequest || { isRequested: false, hours: 0, reason: '', status: 'pending' };
    const updated: AttendanceLog = {
      ...selectedLog,
      isOvertime: isApproved,
      otHours: isApproved ? originalOt.hours : 0,
      approvedBy: nameToUse,
      otRequest: {
        ...originalOt,
        status: isApproved ? 'approved' : 'rejected',
        approvedBy: nameToUse
      }
    };
    onUpdateAttendance(updated);
    alert(`⚡ อนุมัติการเคลม OT จำนวน ${originalOt.hours} ชั่วโมง เรียบร้อยเเละส่งบันทึกเเล้ว!`);
  };

  return (
    <div className="space-y-6">
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
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg shrink-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] text-slate-450 font-bold block mb-0.5">ทำงานล่วงเวลา (OT)</span>
                <span className="text-sm font-mono text-stone-800 font-extrabold">{summary.otCount} กะ</span>
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
          <div className="mt-4 border-b border-stone-200 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-xs font-bold text-slate-400">ประวัติสแกนการลงเวลางานจริง</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleClearAllData}
                  disabled={uploadingPhoto}
                  className="bg-red-50 hover:bg-red-100 text-red-600 disabled:bg-stone-100 disabled:text-stone-400 border border-red-200 px-3 py-1.5 rounded-xl text-[10.5px] font-black transition-all flex items-center gap-1 cursor-pointer"
                  title="เคลียร์พนักงานและประวัติการทำงานทุกคนจากฐานข้อมูล Supabase โดยตรง"
                >
                  🗑️ เคลียร์ข้อมูลพนักงานทั้งหมด
                </button>
                <button
                  onClick={() => {
                    setAttendanceMode('normal');
                    setOtRequested(false);
                    setShowClockForm(true);
                  }}
                  className="bg-orange-505 hover:bg-orange-600 text-stone-800 bg-[#ffe8bc] border border-orange-200 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer font-sans"
                >
                  <Smartphone className="w-3.5 h-3.5 text-orange-600" />
                  ลงเวลาปฏิบัติงานด่วน
                </button>
              </div>
            </div>

            {/* Live Filter Tags Bar */}
            <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-stone-100">
              <span className="text-[10px] text-stone-400 font-bold mr-1">🔍 ตัวกรอง:</span>
              {[
                { id: 'all', label: 'ทั้งหมด', emoji: '📋' },
                { id: 'pending', label: 'รออนุมัติ', emoji: '⏳', count: attendances.filter(a => a.approvalStatus === 'pending_approval' || (a.otRequest?.isRequested && a.otRequest?.status === 'pending')).length },
                { id: 'wfh', label: 'ทำงานที่บ้าน (WFH)', emoji: '🏠', count: attendances.filter(a => a.status === 'wfh').length },
                { id: 'retro', label: 'ลงย้อนหลัง', emoji: '📅', count: attendances.filter(a => a.attendanceType === 'retro').length },
                { id: 'ot', label: 'ขอโอที (OT)', emoji: '⌛', count: attendances.filter(a => a.otRequest?.isRequested).length },
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLogFilter(item.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all border cursor-pointer flex items-center gap-1 ${
                    logFilter === item.id 
                      ? 'bg-stone-850 bg-stone-800 text-white border-stone-900 shadow-sm' 
                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <span>{item.emoji} {item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                      {item.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Clock-in forms vs Logs grids */}
          <div className="mt-4">
            {showClockForm ? (
              /* Clock check-in form with detailed selection forms */
              <form onSubmit={handleCheckInSubmit} className="space-y-4 bg-white/70 p-5 rounded-2xl border border-stone-200 transition-all shadow-inner animate-fade-in text-stone-700">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                  <h3 className="text-xs font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1">
                    🤳 ลงเวลาเข้างานประเภทต่างๆ (Employee Attendance Entry)
                  </h3>
                  <span className="text-[10px] text-stone-400 font-mono">FLOWWORK 360 v2</span>
                </div>

                {/* Mode Selectors */}
                <div className="space-y-1">
                  <span className="block text-[10.5px] text-stone-500 font-bold">1. เลือกรูปแบบพฤติกรรมการลงเวลางาน</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'normal', label: '🟢 งานปกติ (Regular)', hint: 'ลงเวลา ณ ไซต์งานปัจจุบัน' },
                      { id: 'wfh', label: '🏠 ขอ WFH (Work Home)', hint: 'ขออนุมัติปฏิบัติงานที่บ้าน' },
                      { id: 'retro', label: '📅 ลงย้อนหลัง (Retro)', hint: 'ระบุเวลาที่ติดขัดก่อนหน้า' }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => {
                          setAttendanceMode(mode.id as any);
                          if (mode.id === 'wfh') {
                            setWorkSite('🏠 Work From Home (ทำงานที่บ้าน)');
                          } else if (workSite.includes('Home')) {
                            setWorkSite('ไซต์งานชลประทาน B');
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-[11px] font-bold text-left transition-all cursor-pointer ${
                          attendanceMode === mode.id
                            ? 'bg-orange-50 border-orange-400 text-orange-700 shadow-sm'
                            : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        <div className="font-extrabold">{mode.label}</div>
                        <div className="text-[9px] text-stone-400 font-normal mt-0.5">{mode.hint}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Searchable Profile Selector */}
                <div className="space-y-2 p-3.5 bg-stone-50 border border-stone-200 rounded-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <span className="block text-[11px] text-stone-700 font-extrabold flex items-center gap-1">
                        👤 เลือกรายชื่อตัวตนเพื่อลงเวลางาน (Select Staff Profile)
                      </span>
                      <span className="block text-[9px] text-stone-400 font-medium">เพื่อความสะดวกรวดเร็วกรุณาเลือกรายชื่อและภาพประจำตัวของตนเองด้านล่าง หรือพิมพ์ค้นหาด่วน</span>
                    </div>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="🔍 ค้นหาพนักงาน/ตำแหน่ง..."
                        value={searchEmployeeQuery}
                        onChange={(e) => setSearchEmployeeQuery(e.target.value)}
                        className="bg-white border border-stone-300 rounded-xl px-3 py-1 text-[11px] font-bold text-stone-700 w-full sm:w-[220px] outline-none focus:border-orange-500 shadow-sm"
                      />
                      {searchEmployeeQuery && (
                        <button 
                          type="button" 
                          onClick={() => setSearchEmployeeQuery('')} 
                          className="absolute right-2.5 top-1.5 text-stone-400 hover:text-stone-600 font-bold text-[10px]"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 max-h-[190px] overflow-y-auto pr-1">
                    {filteredPresetEmployees.length === 0 ? (
                      <div className="col-span-full py-4 text-center text-stone-400 text-[10px]">
                        ไม่พบรายชื่อพนักงานที่ระบุ ยางล้างตัวกรองและลองพิมพ์ใหม่ หรือระบุด้านล่างเองโดยตรง
                      </div>
                    ) : (
                      filteredPresetEmployees.map(preset => {
                        const isSelected = workName === preset.name;
                        return (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => {
                              setWorkName(preset.name);
                              setWorkRole(preset.role);
                              setPhotoSim(preset.photoUrl);
                            }}
                            className={`p-2 rounded-xl border flex flex-col items-center text-center cursor-pointer transition-all outline-none ${
                              isSelected 
                                ? 'bg-orange-500/10 border-orange-500 shadow-sm scale-[1.02]' 
                                : 'bg-white border-stone-200 hover:bg-stone-55 hover:bg-stone-100 shadow-xs'
                            }`}
                          >
                            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-stone-200 mb-1.5 shadow-xs bg-stone-100 flex-shrink-0">
                              <img src={preset.photoUrl} alt={preset.name} className="w-full h-full object-cover" />
                              {isSelected && (
                                <div className="absolute inset-0 bg-orange-500/10 flex items-center justify-center">
                                  <span className="bg-orange-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-black border border-white shadow">
                                    ✓
                                  </span>
                                </div>
                              )}
                            </div>
                            <span className="text-[10.5px] font-black text-stone-800 line-clamp-1 leading-snug">{preset.name}</span>
                            <span className="text-[8px] text-stone-500 font-bold line-clamp-1 mt-0.5 uppercase tracking-wide">{preset.role}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Standard Inputs (Manual overrides if needed) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10.5px] text-stone-500 font-bold mb-1">ชื่อพนักงานปฏิบัติงานพิมพ์ยืนยันอีกครั้ง</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-stone-800 outline-none text-xs focus:border-orange-500 font-bold shadow-sm"
                      value={workName}
                      onChange={(e) => setWorkName(e.target.value)}
                      required
                      placeholder="เช่น ชื่อพนักงานพิมพ์อิสระได้เช่นกัน"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] text-stone-500 font-bold mb-1">ตำแหน่งสายงาน / วิชาชีพ</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-stone-700 outline-none text-xs shadow-sm"
                      value={workRole}
                      onChange={(e) => setWorkRole(e.target.value)}
                      placeholder="เช่น ขับรถแบ็คโฮ, ช่างรังวัด"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10.5px] text-stone-500 font-bold mb-1">โครงการ / สถานที่เข้างานจริง</label>
                    <input
                      type="text"
                      disabled={attendanceMode === 'wfh'}
                      className="w-full bg-white disabled:bg-stone-100 border border-stone-200 rounded-xl px-3 py-1.5 text-stone-800 outline-none text-xs focus:border-orange-500 shadow-sm"
                      value={workSite}
                      onChange={(e) => setWorkSite(e.target.value)}
                      required
                    />
                  </div>

                  {/* Overtime (OT) Request options */}
                  <div className="bg-stone-50 p-2 rounded-xl border border-stone-200 flex flex-col justify-center">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="checkin-with-ot"
                        className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                        checked={otRequested}
                        onChange={(e) => setOtRequested(e.target.checked)}
                      />
                      <label htmlFor="checkin-with-ot" className="text-xs text-stone-700 ml-2 font-extrabold cursor-pointer">
                        ขอค่าล่วงเวลา (OT Request)
                      </label>
                    </div>
                    {otRequested && (
                      <div className="mt-1.5 text-left border-t border-stone-200/60 pt-1.5 animate-fade-in space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9.5px] text-stone-500">จำนวนชั่วโมงที่ขอ:</span>
                          <select 
                            value={otRequestedHours}
                            onChange={(e) => setOtRequestedHours(Number(e.target.value))}
                            className="bg-white border border-stone-300 rounded px-1.5 py-0.2 text-[10px] font-mono font-bold"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(h => (
                              <option key={h} value={h}>{h} ชม.</option>
                            ))}
                          </select>
                        </div>
                        <input
                          type="text"
                          required
                          value={otRequestedReason}
                          onChange={(e) => setOtRequestedReason(e.target.value)}
                          placeholder="เหตุผล เช่น เคลียร์สินค้าเทสท์"
                          className="w-full bg-white border border-stone-200 rounded px-1.5 py-0.5 text-[9.5px]"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Conditional backdated/retroactive details */}
                {attendanceMode === 'retro' && (
                  <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200 space-y-3 animate-fade-in text-[11px]">
                    <span className="block text-amber-800 font-extrabold leading-none mb-0.5 text-[11.5px]">📅 รายละเอียดเอกสารขอยื่นเวลางานย้อนหลัง (จำเป็นต้องผ่านการอนุมัติ)</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-stone-500 mb-0.5">วันที่ขอย้อนหลัง (Work Date)</label>
                        <input
                          type="date"
                          required
                          max={new Date().toISOString().split('T')[0]}
                          value={retroDate}
                          onChange={(e) => setRetroDate(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-500 mb-0.5">เวลาเข้างานจริง</label>
                        <input
                          type="text"
                          required
                          placeholder="เช่น 08:00"
                          value={retroInTime}
                          onChange={(e) => setRetroInTime(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-xs text-center font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-500 mb-0.5">เวลาออกงานจริง</label>
                        <input
                          type="text"
                          placeholder="เช่น 17:00 (ระบุเพื่อขอตัดออกพร้อมกัน)"
                          value={retroOutTime}
                          onChange={(e) => setRetroOutTime(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-xs text-center font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-stone-500 mb-0.5">ระบุความจำเป็นระเบียบการย้อนหลัง (Reason)</label>
                      <input
                        type="text"
                        required
                        placeholder="ระบุเหตุผลความจำเป็น เช่น โทรศัพท์มือถือแบตหมดระหว่างวัน, สัญญาณอินเทอร์เน็ตที่ไซต์กั้นน้ำล่ม"
                        value={retroReason}
                        onChange={(e) => setRetroReason(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-xs font-semibold"
                      />
                    </div>
                  </div>
                )}

                {/* Real-time Photo Capture Widget */}
                <div className="space-y-2 pt-2 border-t border-stone-200">
                  <div className="flex items-center justify-between">
                    <span className="block text-[10px] text-stone-550 uppercase font-bold text-orange-600">🤳 ถ่ายรูปใบหน้ายืนยันตัวตน (Face Selfie Capture)</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (useRealCamera) {
                          stopCamera();
                        } else {
                          startCamera('in');
                        }
                      }}
                      className="text-[10px] text-orange-700 bg-orange-100 hover:bg-orange-200 px-2 py-1 rounded font-bold transition-all"
                    >
                      {useRealCamera ? '🔌 ปิดการเชื่อมต่อกล้อง' : '📸 สลับไปกล้องจริง (Real Webcam)'}
                    </button>
                  </div>
                  
                  {useRealCamera ? (
                    <div className="flex flex-col items-center bg-stone-900 p-3 rounded-2xl relative overflow-hidden h-64 border border-stone-800">
                      <video
                        ref={checkInVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover rounded-xl scale-x-[-1]"
                      />
                      <div className="absolute bottom-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => capturePhoto('in')}
                          className="bg-orange-500 text-white font-extrabold text-xs px-5 py-2 rounded-xl shadow-lg hover:bg-orange-600 transition-all cursor-pointer"
                        >
                          📷 กดลั่นชัตเตอร์บันทึกใบหน้า
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center bg-stone-50 p-3 rounded-2xl border border-stone-200">
                      <div className="md:col-span-1 flex flex-col items-center">
                        <div className="w-20 h-20 rounded-xl border-2 border-orange-500 overflow-hidden shadow-sm shrink-0 bg-white">
                          <img src={photoSim} alt="Selfie capture preview" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[8px] bg-orange-105 text-orange-700 px-1.5 py-0.5 rounded font-black mt-1.5 uppercase tracking-wider">ภาพที่บันทึก</span>
                      </div>

                      <div className="md:col-span-3 space-y-1.5">
                        <p className="text-[10px] text-stone-550 font-semibold mb-1">💡 เคล็ดลับตัวตน: ท่านสามารถเลื่อนค้นหาและเลือกสแกนตัวจริงที่แถบบอร์ดย่อยด้านบนสุดของแบบฟอร์มเพื่อตั้งค่าใบหน้าประวัติโปรไฟล์อัตโนมัติได้สะดวกที่สุด!</p>
                        
                        <div>
                          <label className="block text-[9px] text-stone-400 font-bold uppercase">หรือระบุไฟล์รูปภาพภายนอกอื่นๆ</label>
                          <input
                            type="text"
                            className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1 text-stone-700 outline-none text-[10px] mt-0.5 focus:border-orange-500 font-mono"
                            value={photoSim}
                            onChange={(e) => setPhotoSim(e.target.value)}
                          />
                        </div>

                        <div className="mt-2 text-left">
                          <label className="block text-[9px] text-orange-600 font-bold uppercase">📥 หรืออัปโหลดไฟล์รูปถ่ายจากสถานที่จริง</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  if (typeof reader.result === 'string') {
                                    setPhotoSim(reader.result);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1 text-stone-700 outline-none text-[10px] mt-0.5 cursor-pointer file:mr-2 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-[9px] file:font-bold file:bg-orange-50 file:text-orange-700 file:cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Real-time GPS Coordinate Widget */}
                <div className="space-y-2 pt-2 border-t border-stone-200">
                  <div className="flex items-center justify-between">
                    <span className="block text-[10px] text-stone-550 uppercase font-black tracking-wide">🛰️ รูทพิกัดดาวเทียมนำทาง (Real-time GPS Location)</span>
                    <button
                      type="button"
                      onClick={() => getRealGPSLocation('in')}
                      disabled={gpsLoading}
                      className="text-[10px] text-orange-600 hover:text-orange-700 font-extrabold flex items-center gap-1 cursor-pointer bg-orange-50 px-2.5 py-1 rounded border border-orange-100 transition-all"
                    >
                      {gpsLoading ? '📡 กำลังติดต่อพิกัดดาวเทียม...' : '🌐 เรียกคืนพิกัดจริง ณ ปัจจุบัน (ดึง GPS)'}
                    </button>
                  </div>
                  <div className="bg-stone-50 p-2.5 rounded-xl text-stone-600 font-mono text-[10px] truncate border border-stone-200 flex items-center justify-between">
                    <span>{gpsSim}</span>
                    <span className="px-1.5 py-0.5 rounded text-[8px] uppercase tracking-widest bg-emerald-100 text-emerald-700 font-sans font-black">Active PIN</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      setShowClockForm(false);
                    }}
                    className="bg-stone-100 hover:bg-stone-200 text-stone-600 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingPhoto}
                    className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow hover:shadow-md cursor-pointer transition-all flex items-center gap-1"
                  >
                    {uploadingPhoto ? '⏳ กำลังบันทึก...' : '🚀 ยืนยัน บันทึกเวลาปฏิบัติงาน'}
                  </button>
                </div>
              </form>
            ) : (
              /* Regular attendance rows grid */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[350px] overflow-y-auto pr-1">
                {(logFilter === 'all' ? attendances : filteredLogs).length === 0 ? (
                  <div className="col-span-2 text-center py-10 text-stone-400 bg-stone-50 border border-stone-200/50 rounded-2xl text-[11px]">
                    ไม่มีบันทึกเวลาประเภทที่เลือกค้างอยู่ในแผนภูมิปฏิบัติการณ์
                  </div>
                ) : (
                  (logFilter === 'all' ? attendances : filteredLogs).map(log => {
                    const checkInLate = log.checkInTime.replace(' น.', '') > '08:30';
                    const isLogRetro = log.attendanceType === 'retro';
                    const isLogWfh = log.status === 'wfh';
                    const isPending = log.approvalStatus === 'pending_approval';
                    const isApproved = log.approvalStatus === 'approved';
                    const isRejected = log.approvalStatus === 'rejected';

                    return (
                      <div
                        key={log.id}
                        onClick={() => setSelectedLogId(log.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-2 relative ${
                          log.id === selectedLogId
                            ? 'bg-orange-500/10 border-orange-500/60 shadow-md scale-[1.01]'
                            : 'bg-white/45 border-stone-200 hover:bg-stone-50 shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Avatar preview decoration thumbnail */}
                          <div className="relative rounded-xl overflow-hidden w-10 h-10 shrink-0 bg-white border border-stone-200">
                            <img src={log.photoUrl || 'https://images.unsplash.com/photo-1513151233558-d860c5398176'} alt="Staff avatar" className="w-full h-full object-cover" />
                            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white ${
                              log.checkOutTime ? 'bg-slate-400' : 'bg-emerald-400 animate-pulse'
                            }`}></span>
                          </div>

                          <div className="space-y-0.5 flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-black text-stone-800 truncate leading-tight">{log.employeeName}</h4>
                              
                              <div className="flex items-center gap-1 shrink-0">
                                {isPending && (
                                  <span className="bg-amber-100 text-amber-800 text-[8px] font-black px-1.5 py-0.2 rounded font-sans uppercase animate-pulse border border-amber-200">
                                    ⏳ รออนุมัติ
                                  </span>
                                )}
                                {isApproved && (
                                  <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black px-1.5 py-0.2 rounded font-sans uppercase border border-emerald-250">
                                    ✅ อนุมัติ
                                  </span>
                                )}
                                {isRejected && (
                                  <span className="bg-rose-100 text-rose-800 text-[8px] font-black px-1.5 py-0.2 rounded font-sans uppercase border border-rose-200">
                                    ❌ ปฏิเสธ
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-[10px] text-stone-500 truncate">{log.role}</p>
                            <p className="text-[9.5px] text-stone-400 truncate font-semibold">📍 {log.siteName}</p>
                          </div>
                        </div>

                        {/* Middle metadata row for Work types */}
                        <div className="flex flex-wrap gap-1 border-t border-dashed border-stone-200 pt-1.5">
                          {isLogWfh && (
                            <span className="bg-sky-50 text-sky-700 text-[8.5px] px-1.5 py-0.2 rounded font-bold border border-sky-200">
                              🏠 ทำงานที่บ้าน WFH
                            </span>
                          )}
                          {isLogRetro && (
                            <span className="bg-purple-50 text-purple-700 text-[8.5px] px-1.5 py-0.2 rounded font-bold border border-purple-200">
                              📅 ลงเวลาย้อนหลัง
                            </span>
                          )}
                          {log.otRequest?.isRequested ? (
                            <span className="bg-amber-55 bg-amber-50 text-amber-800 text-[8.5px] px-1.5 py-0.2 rounded font-bold border border-amber-200">
                              ⌛ ขอ OT • {log.otRequest.hours} ชม. ({log.otRequest.status === 'pending' ? 'รอสกรีน' : 'อนุมัติแล้ว'})
                            </span>
                          ) : log.isOvertime ? (
                            <span className="bg-amber-50 text-amber-800 text-[8.5px] px-1.5 py-0.2 rounded font-bold border border-amber-250">
                              ⌛ มีกะ OT
                            </span>
                          ) : null}
                        </div>

                        {/* Timings row bottom */}
                        <div className="flex justify-between items-center text-[9px] text-stone-500 pt-1 border-t border-stone-100 mt-1">
                          <span className="flex items-center gap-0.5 font-bold">
                            🕒 เข้า: <span className="font-mono text-emerald-600">{log.checkInTime}</span>
                            {checkInLate && <span className="text-red-500 font-extrabold ml-1">สาย</span>}
                          </span>
                          <span className="font-bold">
                            {log.checkOutTime ? (
                              <span>👋 ออก: <span className="font-mono text-rose-500">{log.checkOutTime}</span></span>
                            ) : (
                              <span className="text-emerald-600 animate-pulse font-extrabold">🟢 กำลังทำงาน</span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
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
          isEditing ? (
            /* REAL INTERACTIVE EMPLOYEE DETAIL EDITING FORM WITH PHOTO EDITING */
            <form onSubmit={handleEditSubmit} className="space-y-4 flex flex-col justify-between h-full bg-orange-50/10 p-4 rounded-xl border border-orange-200">
              <div className="space-y-4 w-full">
                <div className="border-b border-stone-200 pb-2 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-orange-600 font-mono font-black uppercase tracking-wider">✏️ แก้ไขข้อมูลพนักงาน (EDIT PROFILE)</span>
                    <h3 className="text-xs font-bold text-stone-800">รหัส ID: {selectedLog.id}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="p-1 hover:bg-stone-200 rounded-full font-bold text-xs shrink-0"
                  >
                    ✕
                  </button>
                </div>

                <div className="bg-white border border-stone-200 p-4 rounded-xl text-[11px] text-stone-600 space-y-4 shadow-sm">
                  {/* Photo Uploader Section */}
                  <div className="space-y-2 pb-2 border-b border-stone-100">
                    <span className="block text-[10px] text-stone-500 font-bold uppercase tracking-wider">📸 รูปภาพพนักงาน (แก้ไขรูปพนักงานได้)</span>
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-stone-200 shrink-0 relative group">
                        <img 
                          src={editPhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'} 
                          alt="Edit preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label 
                          htmlFor="edit-employee-photo-uploader"
                          className="inline-block bg-orange-50 hover:bg-orange-105 text-orange-600 text-[10px] px-3 py-1 rounded-lg font-black cursor-pointer transition-all border border-orange-200 text-center"
                        >
                          📂 เลือกรูปถ่ายใหม่
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="edit-employee-photo-uploader"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (uploadEvent) => {
                                const base64Img = uploadEvent.target?.result as string;
                                setEditPhoto(base64Img);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <p className="text-[8.5px] text-stone-400 leading-normal">รองรับ JPG, PNG (ระบบจะอัพโหลดขึ้นเซิร์ฟเวอร์ LINE อัตโนมัติ)</p>
                      </div>
                    </div>
                    <div className="space-y-1 pt-0.5">
                      <span className="text-[9px] text-stone-400 block">หรือใส่ลิงก์รูปภาพโดยตรง (Photo URL):</span>
                      <input
                        type="text"
                        value={editPhoto}
                        onChange={(e) => setEditPhoto(e.target.value)}
                        className="w-full bg-stone-55 border border-stone-200 rounded-lg px-2.5 py-1 text-[10px] font-mono text-stone-600 outline-none"
                        placeholder="https://example.com/photo.jpg"
                      />
                    </div>
                  </div>

                  {/* Standard Form Inputs */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] text-stone-500 font-bold mb-1">👤 ชื่อพนักงานปฏิบัติการ</label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-stone-800 outline-none text-xs focus:border-orange-500 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-stone-500 font-bold mb-1">💼 ตำแหน่งงาน / วิชาชีพ</label>
                      <input
                        type="text"
                        required
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-stone-800 outline-none text-xs focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-stone-500 font-bold mb-1">🏗️ ไซต์งานปฏิบัติการ</label>
                      <input
                        type="text"
                        required
                        value={editSite}
                        onChange={(e) => setEditSite(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-stone-800 outline-none text-xs focus:border-orange-500"
                      />
                    </div>

                    {/* Checkin/Checkout Timing fields */}
                    <div className="grid grid-cols-2 gap-3 pt-1 border-t border-stone-100">
                      <div>
                        <label className="block text-[10px] text-stone-500 font-bold mb-0.5">🕒 เวลาสแกนเข้า</label>
                        <input
                          type="text"
                          required
                          value={editCheckInTime}
                          onChange={(e) => setEditCheckInTime(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-stone-800 outline-none text-xs text-center font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-stone-500 font-bold mb-0.5">👋 เวลาสแกนออก</label>
                        <input
                          type="text"
                          value={editCheckOutTime}
                          onChange={(e) => setEditCheckOutTime(e.target.value)}
                          placeholder="กำลังทำงานอยู่"
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-stone-800 outline-none text-xs text-center font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-center pt-1.5 pl-0.5">
                      <input
                        type="checkbox"
                        id="edit-ot-checkbox"
                        checked={editIsOvertime}
                        onChange={(e) => setEditIsOvertime(e.target.checked)}
                        className="w-4 h-4 accent-orange-500 rounded border-stone-300 cursor-pointer"
                      />
                      <label htmlFor="edit-ot-checkbox" className="text-xs text-stone-600 ml-2 font-bold cursor-pointer">
                        ทำงานล่วงเวลาสะสม (OT)
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="w-1/2 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-xs font-bold transition-all text-center cursor-pointer border border-stone-250"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingPhoto}
                    className="w-1/2 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-xl text-xs font-black transition-all text-center flex items-center justify-center gap-1 shadow hover:shadow-md cursor-pointer"
                  >
                    {uploadingPhoto ? '⏳ กำลังบันทึก...' : '💾 บันทึกและส่ง LINE'}
                  </button>
                </div>
              </div>
            </form>
          ) : showCheckoutPanel ? (
            /* REAL INTERACTIVE CHECK-OUT SCANNER FORM */
            <form onSubmit={handleCheckOutSubmit} className="space-y-4 flex flex-col justify-between h-full bg-rose-50/20 p-4 rounded-xl border border-rose-100">
              <div className="space-y-4 w-full">
                <div className="border-b border-stone-200 pb-2 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-rose-600 font-mono font-black uppercase tracking-wider">⏱️ SCANNER CO-OUT</span>
                    <h3 className="text-xs font-bold text-stone-800">เลิกงาน: {selectedLog.employeeName}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      setShowCheckoutPanel(false);
                    }}
                    className="p-1 hover:bg-stone-200 rounded-full font-bold text-xs"
                  >
                    ✕
                  </button>
                </div>

                <div className="bg-white border border-stone-200 p-3 rounded-xl text-[11px] text-stone-600 space-y-2.5 shadow-sm">
                  <p>👤 <strong>พนักงาน:</strong> {selectedLog.employeeName}</p>
                  <p>💼 <strong>ตำแหน่ง/สายงาน:</strong> {selectedLog.role}</p>
                  <p>🏗️ <strong>ไซต์งาน:</strong> {selectedLog.siteName}</p>
                  <p>🕒 <strong>เวลาเข้างาน:</strong> <span className="text-emerald-600 font-bold">{selectedLog.checkInTime} น.</span></p>

                  {/* REAL-TIME GEOLOCATION ON RETREAT */}
                  <div className="space-y-1.5 pt-2 border-t border-stone-100">
                    <div className="flex items-center justify-between">
                      <span className="block text-[9px] text-stone-550 font-black uppercase tracking-wide">🛰️ พิกัดออกงานจริง (Checkout GPS)</span>
                      <button
                        type="button"
                        onClick={() => getRealGPSLocation('out')}
                        disabled={gpsLoading}
                        className="text-[9px] text-rose-700 bg-rose-50 hover:bg-rose-105 px-2 py-0.5 rounded font-black border border-rose-120 transition-all cursor-pointer"
                      >
                        {gpsLoading ? '📡 ดึงดาวเทียม...' : '🌐 พิกัดขากลับ'}
                      </button>
                    </div>
                    <div className="bg-stone-50 p-2 rounded text-stone-600 font-mono text-[9.5px] border border-stone-200 truncate flex justify-between items-center">
                      <span>{checkOutGps || '18.791500, 98.986000'}</span>
                      <span className="px-1 py-0.2 rounded text-[8px] bg-rose-100 text-rose-700 font-sans font-extrabold uppercase animate-pulse">GPS Real-time</span>
                    </div>
                  </div>

                  {/* REAL WEBCAM PICTURE SECURE CHECKOUT */}
                  <div className="space-y-1.5 pt-2 border-t border-stone-100">
                    <div className="flex items-center justify-between">
                      <span className="block text-[9px] text-stone-550 font-black uppercase tracking-wide">📸 เซลฟี่สแกนขากลับ (Checkout Photo)</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (useRealCamera) {
                            stopCamera();
                          } else {
                            startCamera('out');
                          }
                        }}
                        className="text-[9px] text-rose-750 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded font-bold transition-all border border-rose-120 cursor-pointer"
                      >
                        {useRealCamera ? '🔌 ปิดกล้อง' : '📷 เปิดระบบกล้องจริง'}
                      </button>
                    </div>

                    {useRealCamera ? (
                      <div className="flex flex-col items-center bg-stone-900 p-1.5 rounded-xl h-44 relative overflow-hidden border border-stone-800 mt-1 shadow-inner">
                        <video
                          ref={checkOutVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover rounded-lg scale-x-[-1]"
                        />
                        <button
                          type="button"
                          onClick={() => capturePhoto('out')}
                          className="absolute bottom-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-[9.5px] px-3.5 py-1.5 rounded-lg shadow-lg transition-all cursor-pointer"
                        >
                          📷 กดถ่ายภาพยืนยัน
                        </button>
                      </div>
                    ) : (
                      <div className="h-auto p-2.5 rounded-xl border border-stone-200 bg-white flex flex-col items-center justify-center mt-1 space-y-2">
                        <img 
                          src={checkOutPhoto || selectedLog.photoUrl} 
                          alt="Selfie capture log checkout" 
                          className="w-16 h-16 rounded-full border border-stone-200 object-cover shadow-sm animate-fade-in" 
                        />
                        <span className="text-[8px] text-stone-400 font-mono uppercase tracking-wider">ภาพสแกนขากลับ</span>
                        
                        <div className="w-full text-left">
                          <label className="block text-[9px] text-rose-600 font-bold uppercase">📥 หรืออัปโหลดไฟล์รูปภาพหรือสถานที่จริง</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  if (typeof reader.result === 'string') {
                                    setCheckOutPhoto(reader.result);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-stone-700 outline-none text-[9.5px] mt-0.5 cursor-pointer file:mr-2 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-[8px] file:font-bold file:bg-rose-50 file:text-rose-700 file:cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      setShowCheckoutPanel(false);
                    }}
                    className="w-1/2 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-xs font-bold transition-all text-center cursor-pointer border border-stone-205"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingPhoto}
                    className="w-1/2 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white rounded-xl text-xs font-black transition-all text-center flex items-center justify-center gap-1 shadow hover:shadow-md cursor-pointer"
                  >
                    {uploadingPhoto ? '⏳ กำลังส่งข้อมูลภาพ...' : '👋 ยืนยันออกงาน & ส่ง LINE'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* READ-ONLY CARD FOR PRESENT ATTENDANCE */
            <div className="space-y-4 flex flex-col justify-between h-full">
              <div className="space-y-4">
                <div className="border-b border-stone-200 pb-2 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-slate-450 font-mono font-bold uppercase">ID ID: {selectedLog.id}</span>
                    <h3 className="text-sm font-semibold text-stone-800">บิตตอกเวลา: {selectedLog.employeeName}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1 text-[10px] bg-slate-100 hover:bg-slate-205 px-2.5 py-1 rounded-lg border border-stone-200 text-stone-700 font-bold cursor-pointer transition-all shrink-0 animate-bounce"
                  >
                    ✏️ แก้ไขข้อมูลรายคน
                  </button>
                </div>

                {/* Attendance metrics visual card details */}
                <div className="bg-white border border-stone-200 p-4 rounded-xl text-[11px] text-stone-600 space-y-2.5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-stone-200 shrink-0">
                      <img src={selectedLog.photoUrl} alt="Staff checkin preview" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-stone-700">{selectedLog.employeeName}</h4>
                      <span className="text-[10px] text-slate-500 block leading-tight">{selectedLog.role}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-stone-200">
                    <p>📍 <strong className="text-stone-500 font-bold">ลงพิกัดเช็คอิน:</strong> {selectedLog.siteName}</p>
                    <p>🕒 <strong className="text-stone-500 font-bold">ตอกเข้างานเวลา:</strong> <span className="font-mono text-emerald-600 font-bold">{selectedLog.checkInTime} น.</span></p>
                    {selectedLog.checkOutTime ? (
                      <>
                        <p>🕒 <strong className="text-stone-550 text-stone-500">ตอกออกงานเวลา:</strong> <span className="font-mono text-rose-600 font-bold">{selectedLog.checkOutTime}</span></p>
                        <p>📍 <strong className="text-stone-550 text-stone-500">พิกัดทางภูมิศาสตร์ (GPS ขากลับ):</strong> <span className="font-mono text-stone-600">{selectedLog.gpsLocOut || 'ไม่ได้ระบุ'}</span></p>
                      </>
                    ) : (
                      <p className="text-emerald-600 animate-pulse font-extrabold flex items-center gap-1 text-[10.5px]">🟢 กำลังทำงานอยู่ในระเบียบวินัย</p>
                    )}
                  </div>

                  <div className="space-y-2.5 border-t border-stone-200 pt-2.5 text-slate-450">
                    <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">
                      {selectedLog.checkOutTime ? "กล้องเซลฟี่ที่แสตมป์ขากลับ (Checkout Photo Preview)" : "กล้องเซลฟี่ที่แสตมป์ยืนยัน (Device Camera Checkin)"}
                    </span>
                    <div className="h-24 rounded-xl overflow-hidden relative border border-stone-200 bg-stone-50 flex items-center justify-center">
                      <img 
                        src={selectedLog.checkOutTime ? (selectedLog.photoUrlOut || selectedLog.photoUrl) : selectedLog.photoUrl} 
                        alt="Selfie capture log" 
                        className="w-16 h-16 rounded-full border border-stone-200 object-cover shadow" 
                      />
                      <span className="absolute bottom-1 right-2 text-[8px] bg-white/80 border border-stone-200 text-stone-500 font-mono px-1 rounded flex items-center gap-0.5">
                        <Camera className="w-2.5 h-2.5" />
                        Camera Secure
                      </span>
                    </div>
                  </div>
                </div>

                {/* Supervisor/Manager Approval Actions Cockpit Segment */}
                {((selectedLog.approvalStatus === 'pending_approval') || 
                  (selectedLog.otRequest?.isRequested && selectedLog.otRequest?.status === 'pending')) && (
                  <div className="bg-[#fffbeb] border border-amber-300 p-3 rounded-2xl text-[11px] space-y-3.5 text-stone-700 shadow-sm mt-3 animate-pulse-once">
                    <div className="border-b border-amber-200 pb-1.5">
                      <span className="text-[9px] text-amber-800 font-extrabold uppercase tracking-wider block">⏳ แผงควบคุมอนุมัติผู้บังคับบัญชา (Approval Cockpit)</span>
                      <p className="text-[10px] text-stone-450 mt-0.5">ระบุชื่อหัวหน้างานแล้วเลือกอนุมัติหรือปฏิเสธคำขอบริการพนักงาน</p>
                    </div>

                    {selectedLog.approvalStatus === 'pending_approval' && (
                      <div className="space-y-1.5 bg-white p-2.5 rounded-xl border border-amber-200 shadow-xs">
                        <p className="font-extrabold text-amber-800 text-[10.5px]">
                          📢 สแกนเข้าประเภท: {selectedLog.attendanceType === 'retro' ? '📅 ย้อนหลัง (Retroactive)' : '🏠 ทำงานที่บ้าน (WFH)'}
                        </p>
                        {selectedLog.reason && (
                          <div className="bg-stone-50 p-2 rounded-lg border border-stone-200/60 font-medium text-stone-600">
                            <strong>เหตุผล:</strong> "{selectedLog.reason}"
                          </div>
                        )}
                        {selectedLog.workDate && (
                          <p className="text-stone-500 font-semibold">📅 วันเวลายื่นเรื่อง: {selectedLog.workDate}</p>
                        )}
                        
                        <div className="pt-2 flex flex-col gap-1 border-t border-stone-100">
                          <label className="text-[9.5px] text-stone-450 font-bold block">👤 ผู้ควบคุมสั่งรับรองงาน (Supervisor Name):</label>
                          <input 
                            type="text"
                            className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-[10.5px] font-bold text-stone-800 outline-none focus:border-amber-500"
                            value={supervisorName}
                            onChange={(e) => setSupervisorName(e.target.value)}
                            placeholder="ระบุชื่อหัวหน้าผู้เซ็นอนุมัติ"
                          />
                          <div className="flex gap-2 pt-1.5">
                            <button
                              type="button"
                              onClick={() => handleApproveAttendance(true)}
                              className="w-1/2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black cursor-pointer transition-all shadow-xs"
                            >
                              ✅ อนุมัติการเข้างาน
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveAttendance(false)}
                              className="w-1/2 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black cursor-pointer transition-all shadow-xs"
                            >
                              ❌ ปฏิเสธคำขอ
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedLog.otRequest?.isRequested && selectedLog.otRequest?.status === 'pending' && (
                      <div className="space-y-1.5 bg-white p-2.5 rounded-xl border border-amber-200 shadow-xs mt-2">
                        <p className="font-extrabold text-amber-800 text-[10.5px]">
                          ⌛ ยื่นเรื่องขออนุมัติบวก OT (Overtime Claim)
                        </p>
                        <p className="text-stone-700 font-extrabold bg-amber-500/10 text-amber-800 px-2 py-1 rounded inline-block">⏱️ ขอเรียกรับ: {selectedLog.otRequest.hours} ชั่วโมงทำงาน</p>
                        {selectedLog.otRequest.reason && (
                          <div className="bg-stone-50 p-2 rounded-lg border border-stone-200/60 font-medium text-stone-600 italic">
                            💬 "{selectedLog.otRequest.reason}"
                          </div>
                        )}
                        
                        <div className="pt-2 flex flex-col gap-1 border-t border-stone-100 mt-1">
                          <label className="text-[9.5px] text-stone-450 font-bold block">👤 ผู้ยืนอนุมัติกะ OT (Supervisor Name):</label>
                          <input 
                            type="text"
                            className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-[10.5px] font-bold text-stone-800 outline-none focus:border-amber-500"
                            value={supervisorName}
                            onChange={(e) => setSupervisorName(e.target.value)}
                            placeholder="ระบุชื่อหัวหน้าอนุมัติงาน OT"
                          />
                          <div className="flex gap-2 pt-1.5">
                            <button
                              type="button"
                              onClick={() => handleApproveOT(true)}
                              className="w-1/2 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-black cursor-pointer transition-all shadow-xs"
                            >
                              ✅ อนุมัติกะ OT
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveOT(false)}
                              className="w-1/2 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black cursor-pointer transition-all shadow-xs"
                            >
                              ❌ ปฏิเสธกะ OT
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Approved states display labels */}
                {selectedLog.approvedBy && (
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-[10.5px] text-emerald-800 space-y-1 mt-2.5 shadow-xs">
                    <p className="font-extrabold flex items-center gap-1">📢 ตรวจสอบยืนยันสิทธิ์เรียบร้อยเเล้ว</p>
                    <p>💼 <strong>ผู้พิจารณาอนุมัติ:</strong> {selectedLog.approvedBy}</p>
                    <p>📝 <strong>สถานะลงเวลา:</strong> {selectedLog.approvalStatus === 'approved' ? '💚 อนุมัติผ่านระบบเรียบร้อย' : '❤️ ปฏิเสธคำขอลงเวลา'}</p>
                    {selectedLog.otRequest?.isRequested && (
                      <p>✨ <strong>สิทธิ์ขอโอที (OT):</strong> {selectedLog.otRequest.status === 'approved' ? `⚡ อนุมัติเพิ่มค่าพิเศษ (${selectedLog.otRequest.hours} ชั่วโมง)` : '❌ ไม่ผ่านการประเมิน OT'}</p>
                    )}
                  </div>
                )}

                {/* Check-Out active trigger buttons if still checked-in */}
                {!selectedLog.checkOutTime && (
                  <button
                    type="button"
                    onClick={() => {
                      setCheckOutPhoto(selectedLog.photoUrl);
                      setShowCheckoutPanel(true);
                    }}
                    className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-600 border border-rose-500/20 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-4"
                  >
                    👋 สแกนกล้องออกงาน (Clock-Out Scanner)
                  </button>
                )}
              </div>
            </div>
          )
        ) : (
          <p className="text-xs text-slate-500 italic text-center my-auto">ไม่มีประวัติตอกสถิติพนักงานในแผ่นดิน</p>
        )}
      </div>
    </div>

    {/* Table of All Attendance Logs */}
    <div className="bg-white p-6 rounded-3xl border border-stone-200/50 shadow-sm" id="all-attendance-records-table">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 border-b border-stone-100 pb-4">
        <div>
          <h2 className="text-md font-bold text-stone-800 font-sans tracking-tight">ตารางประวัติเวลาการเข้า-ออกงานทั้งหมด</h2>
          <p className="text-xs text-stone-500 mt-1 font-sans">
            แสดงข้อมูลบันทึกสถิติลงเวลางาน พิกัดดาวเทียม และรูปเซลฟี่ยืนยันจากฐานข้อมูลจริง
          </p>
        </div>
        <span className="bg-[#fffdf2] text-amber-700 text-xs font-mono px-3 py-1 rounded-xl border border-amber-200/60 font-bold shrink-0">
          ทั้งหมด {attendances.length} รายการ
        </span>
      </div>

      {attendances.length === 0 ? (
        <div className="text-center py-12 text-stone-400 text-xs bg-stone-50 rounded-2xl border border-dashed border-stone-200">
           ไม่มีประวัติลงเวลาปฏิบัติงานในระบบ
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-600 border-collapse">
            <thead>
              <tr className="border-b border-stone-200/60 text-stone-400 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">รูปถ่าย</th>
                <th className="py-3 px-3">ชื่อช่าง / พนักงาน</th>
                <th className="py-3 px-3">ตำแหน่งงาน</th>
                <th className="py-3 px-3">สถานที่เข้างาน</th>
                <th className="py-3 px-3">เวลาตอกเข้า</th>
                <th className="py-3 px-3">เวลาตอกออก</th>
                <th className="py-3 px-3">กะพิเศษ (OT)</th>
                <th className="py-3 px-3">พิกัดดาวเทียม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {attendances.map((log) => (
                <tr 
                  key={log.id} 
                  className="hover:bg-stone-50/80 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedLogId(log.id);
                  }}
                >
                  <td className="py-3 px-3 shrink-0">
                    <div className="w-9 h-9 rounded-lg overflow-hidden border border-stone-200 bg-stone-100">
                      <img src={log.photoUrl} alt="Selfie" className="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td className="py-3 px-3 font-bold text-stone-800">
                    <div className="flex flex-col">
                      <span>{log.employeeName}</span>
                      <div className="flex gap-1 mt-0.5">
                        {log.status === 'wfh' && <span className="text-[8.5px] bg-sky-50 text-sky-700 font-bold px-1 rounded border border-sky-200">🏠 WFH</span>}
                        {log.attendanceType === 'retro' && <span className="text-[8.5px] bg-purple-50 text-purple-700 font-bold px-1 rounded border border-purple-200">📅 ย้อนหลัง</span>}
                        {log.approvalStatus === 'pending_approval' && <span className="text-[8.5px] bg-amber-100 text-amber-800 px-1 rounded border border-amber-200 animate-pulse">⏳ รอพิจารณา</span>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-semibold text-stone-600">
                    {log.role}
                  </td>
                  <td className="py-3 px-3 text-stone-700 font-semibold">
                    {log.siteName}
                  </td>
                  <td className="py-3 px-3 font-mono text-emerald-600 font-bold">
                    🕒 {log.checkInTime} น.
                  </td>
                  <td className="py-3 px-3 font-mono text-rose-500 font-bold">
                    {log.checkOutTime ? `👋 ${log.checkOutTime} น.` : '🟢 กำลังทำงาน'}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                      log.isOvertime ? 'bg-amber-100 text-amber-800 border border-amber-200/50' : 'bg-emerald-100 text-emerald-800 border border-emerald-200/50'
                    }`}>
                      {log.isOvertime ? `มี OT ${log.otHours ? `(${log.otHours} ชม.)` : ''}` : 'กะปกติ'}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-stone-500 text-[10.5px]">
                    {log.gpsLocIn} {log.gpsLocOut ? `/ ขากลับ: ${log.gpsLocOut}` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
  );
}
