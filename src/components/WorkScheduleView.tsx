/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { 
  Calendar as CalIcon, 
  List, 
  MapPin, 
  User, 
  Clock, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Edit3, 
  Paperclip, 
  Send,
  AlertCircle,
  Bell,
  Save,
  X,
  CheckCircle2,
  ChevronRight,
  Upload,
  Sparkles,
  Map
} from 'lucide-react';
import { WorkScheduleTask, TaskPriority, TaskStatus, HeavyMachinery } from '../types';

interface WorkScheduleViewProps {
  theme?: 'blue' | 'green' | 'white' | 'yellow' | 'black';
  tasks: WorkScheduleTask[];
  machinery: HeavyMachinery[];
  onAddTask: (task: WorkScheduleTask) => void;
  onUpdateTask: (task: WorkScheduleTask) => void;
  onDeleteTask: (id: string) => void;
  initialShowAddForm?: boolean;
  onCloseAddForm?: () => void;
}

export default function WorkScheduleView({ 
  theme = 'black', 
  tasks, 
  machinery, 
  onAddTask, 
  onUpdateTask, 
  onDeleteTask,
  initialShowAddForm = false,
  onCloseAddForm
}: WorkScheduleViewProps) {
  
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('month');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(tasks[0]?.id || null);
  const [showAddForm, setShowAddForm] = useState(initialShowAddForm);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDayTab, setSelectedDayTab] = useState('2026-05-28'); // Default to current metadata date
  
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(4); // 0-indexed: May is 4 (May 2026)

  // Synchronize calendar view month with selectedDayTab
  React.useEffect(() => {
    if (selectedDayTab) {
      const parts = selectedDayTab.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // 0-indexed
        if (!isNaN(year) && !isNaN(month)) {
          setCurrentYear(year);
          setCurrentMonth(month);
        }
      }
    }
  }, [selectedDayTab]);

  // Synchronize state with initialShowAddForm
  React.useEffect(() => {
    if (initialShowAddForm) {
      setShowAddForm(true);
    }
  }, [initialShowAddForm]);

  const handleCloseForm = () => {
    setShowAddForm(false);
    onCloseAddForm?.();
  };

  // Form Creation State
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formMach, setFormMach] = useState('');
  const [formAssign, setFormAssign] = useState('');
  const [formPriority, setFormPriority] = useState<TaskPriority>('medium');
  const [formDueDate, setFormDueDate] = useState('2026-05-30');
  const [formGps, setFormGps] = useState('ไซต์ก่อสร้างคลอง ชลประทานเฟส 3');
  
  // Lists and Inputs for Rich Scheduling Form
  const [locationsList, setLocationsList] = useState<string[]>([]);
  const [locInput, setLocInput] = useState('');
  
  const [supervisorsList, setSupervisorsList] = useState<string[]>([]);
  const [supInput, setSupInput] = useState('');
  
  const [machineriesList, setMachineriesList] = useState<string[]>([]);
  const [machInput, setMachInput] = useState('');
  
  const [employeesList, setEmployeesList] = useState<string[]>([]);
  const [empInput, setEmpInput] = useState('');
  
  const [assignedBy, setAssignedBy] = useState('');
  const [formTime, setFormTime] = useState('08:00');
  const [formStatus, setFormStatus] = useState<TaskStatus>('pending');

  // Comment state
  const [commentText, setCommentText] = useState('');

  // Edit Task State
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editAssign, setEditAssign] = useState('');
  const [editPriority, setEditPriority] = useState<TaskPriority>('medium');
  const [editDueDate, setEditDueDate] = useState('');
  const [editGps, setEditGps] = useState('');
  const [editMach, setEditMach] = useState('');

  // Selected Task Memo
  const selectedTask = useMemo(() => {
    return tasks.find(t => t.id === activeTaskId) || null;
  }, [tasks, activeTaskId]);

  // Initiate Edit Form Values
  const handleStartEdit = () => {
    if (!selectedTask) return;
    setEditTitle(selectedTask.title);
    setEditDesc(selectedTask.description || '');
    setEditAssign(selectedTask.assignedTo);
    setEditPriority(selectedTask.priority);
    setEditDueDate(selectedTask.dueDate);
    setEditGps(selectedTask.gpsLocName || '');
    setEditMach(selectedTask.machineryId || '');
    setIsEditing(true);
  };

  // Save Edits handler
  const handleSaveEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !editTitle || !editAssign) return;

    const notesChanged = [];
    if (selectedTask.title !== editTitle) notesChanged.push('แก้ไขชื่องาน');
    if (selectedTask.assignedTo !== editAssign) notesChanged.push(`เปลี่ยนช่างเป็น ${editAssign}`);
    if (selectedTask.dueDate !== editDueDate) notesChanged.push(`เลื่อนกำหนดส่งเป็น ${editDueDate}`);
    if (selectedTask.priority !== editPriority) notesChanged.push(`ปรับความสำคัญเป็น ${editPriority}`);

    const newTimelineNote = notesChanged.length > 0 
      ? `แก้ไขใบงาน: ${notesChanged.join(', ')}` 
      : 'อัปเดตข้อมูลใบงานทั่วไป';

    const updatedTask: WorkScheduleTask = {
      ...selectedTask,
      title: editTitle,
      description: editDesc,
      assignedTo: editAssign,
      priority: editPriority,
      dueDate: editDueDate,
      gpsLocName: editGps,
      machineryId: editMach || undefined,
      timeline: [
        ...selectedTask.timeline,
        {
          status: selectedTask.status,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          note: newTimelineNote
        }
      ]
    };

    onUpdateTask(updatedTask);
    setIsEditing(false);
  };

  // Local Styles for 4 Colors Theme (โทนอ่อนหมด / Soft pastel tones)
  const localStyle = {
    yellow: {
      card: "bg-stone-50/60 border-stone-200/80 text-stone-800",
      cardActive: "bg-orange-500/10 border-orange-500/60 shadow-md",
      innerBg: "bg-white/40 border border-stone-200/80",
      formBg: "bg-white/50 border border-stone-200 p-5 rounded-2xl",
      inputText: "text-stone-800 bg-stone-50 border-stone-200 focus:border-orange-500",
      btnPrimary: "bg-orange-500 hover:bg-orange-600 text-white font-bold",
      btnSecondary: "bg-stone-50 hover:bg-white text-stone-700 hover:text-stone-700 border border-stone-200",
      label: "text-stone-700 font-bold",
      textMuted: "text-stone-500",
      textTitle: "text-stone-800",
      badgePending: "bg-amber-100/50 text-amber-600 border border-amber-200",
      badgeDoing: "bg-sky-100/50 text-sky-600 border border-sky-200",
      badgeAwaiting: "bg-purple-100/50 text-purple-600 border border-purple-200",
      badgeCompleted: "bg-emerald-100/50 text-emerald-600 border border-emerald-200",
      badgeCancelled: "bg-rose-100/50 text-rose-600 border border-rose-200",
      divider: "border-stone-200",
      chip: "bg-white border border-stone-200",
      pulseColor: "bg-rose-500",
      panelBg: "bg-white border border-stone-200",
      badgeHeader: "bg-orange-500/10 text-orange-600"
    },
    blue: {
      card: "bg-white border-sky-100 text-slate-800 shadow-sm shadow-sky-50",
      cardActive: "bg-sky-50/70 border-sky-300 shadow-md shadow-sky-100/50",
      innerBg: "bg-sky-50/30 border border-sky-100/60",
      formBg: "bg-sky-50/40 border border-sky-100/80 p-5 rounded-2xl shadow-sm",
      inputText: "text-slate-800 bg-white border-sky-200 focus:border-sky-500",
      btnPrimary: "bg-sky-500 hover:bg-sky-600 text-white font-bold",
      btnSecondary: "bg-white hover:bg-sky-50 text-sky-600 border border-sky-200",
      label: "text-slate-600 font-bold",
      textMuted: "text-slate-500",
      textTitle: "text-slate-800",
      badgePending: "bg-amber-50 text-amber-800 border border-amber-200",
      badgeDoing: "bg-sky-50 text-sky-800 border border-sky-200",
      badgeAwaiting: "bg-purple-100 text-purple-800 border border-purple-200",
      badgeCompleted: "bg-emerald-50 text-emerald-800 border border-emerald-200",
      badgeCancelled: "bg-rose-100 text-rose-800 border border-rose-200",
      divider: "border-sky-100",
      chip: "bg-sky-50/50 border border-sky-100",
      pulseColor: "bg-sky-500",
      panelBg: "bg-white border border-sky-100 shadow-sm shadow-sky-50",
      badgeHeader: "bg-sky-100 text-sky-700"
    },
    green: {
      card: "bg-white border-emerald-100 text-stone-800 shadow-sm shadow-emerald-50",
      cardActive: "bg-emerald-50/70 border-emerald-300 shadow-md shadow-emerald-100/50",
      innerBg: "bg-emerald-50/30 border border-emerald-100/60",
      formBg: "bg-emerald-50/40 border border-emerald-100/80 p-5 rounded-2xl shadow-sm",
      inputText: "text-stone-800 bg-white border-emerald-200 focus:border-emerald-500",
      btnPrimary: "bg-emerald-600 hover:bg-emerald-700 text-white font-bold",
      btnSecondary: "bg-white hover:bg-emerald-50 text-emerald-600 border border-emerald-200",
      label: "text-stone-600 font-bold",
      textMuted: "text-stone-500",
      textTitle: "text-stone-800",
      badgePending: "bg-amber-50 text-amber-800 border border-amber-200",
      badgeDoing: "bg-sky-50 text-sky-800 border border-sky-200",
      badgeAwaiting: "bg-purple-100 text-purple-800 border border-purple-200",
      badgeCompleted: "bg-emerald-50 text-emerald-800 border border-emerald-200",
      badgeCancelled: "bg-rose-100 text-rose-800 border border-rose-200",
      divider: "border-emerald-100",
      chip: "bg-emerald-50/50 border border-emerald-100",
      pulseColor: "bg-emerald-500",
      panelBg: "bg-white border border-emerald-100 shadow-sm shadow-emerald-50",
      badgeHeader: "bg-emerald-100 text-emerald-700"
    },
    white: {
      card: "bg-white border-stone-200 text-stone-800 shadow-sm shadow-stone-100",
      cardActive: "bg-stone-50 border-stone-300 shadow-md",
      innerBg: "bg-stone-50/60 border border-stone-200/60",
      formBg: "bg-stone-50/80 border border-stone-200/80 p-5 rounded-2xl shadow-sm",
      inputText: "text-stone-900 bg-white border-stone-300 focus:border-stone-600",
      btnPrimary: "bg-stone-800 hover:bg-stone-900 text-white font-bold",
      btnSecondary: "bg-white hover:bg-stone-100 text-stone-700 border border-stone-200",
      label: "text-stone-700 font-bold",
      textMuted: "text-stone-500",
      textTitle: "text-stone-900",
      badgePending: "bg-amber-50 text-amber-800 border border-amber-200",
      badgeDoing: "bg-sky-50 text-sky-800 border border-sky-200",
      badgeAwaiting: "bg-purple-50 text-purple-800 border border-purple-200",
      badgeCompleted: "bg-emerald-50 text-emerald-800 border border-emerald-200",
      badgeCancelled: "bg-rose-50 text-rose-800 border border-rose-200",
      divider: "border-stone-200",
      chip: "bg-stone-50 border border-stone-200/50",
      pulseColor: "bg-stone-700",
      panelBg: "bg-white border border-stone-200 shadow-sm shadow-stone-100",
      badgeHeader: "bg-stone-100 text-stone-800"
    }
  };

  const style = localStyle[theme];

  // File Upload Reference and Handler (Real Upload -> Converts to Base64 data URL!)
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedTask || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onUpdateTask({
          ...selectedTask,
          photoUrls: [...selectedTask.photoUrls, dataUrl],
          timeline: [
            ...selectedTask.timeline,
            {
              status: selectedTask.status,
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
              note: `อัปโหลดรูปภาพหน้างานจริงสำเร็จ: ${file.name}`
            }
          ]
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Urgent Alarm Algorithm - Checks upcoming due tasks (2026-05-28 current day context)
  const upcomingTasks = useMemo(() => {
    return tasks.filter(t => {
      if (t.status === 'completed' || t.status === 'cancelled') return false;
      const tDate = new Date(t.dueDate);
      const today = new Date('2026-05-28');
      const diffTime = tDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= -2 && diffDays <= 4; // due within 4 days, or overdue up to 2 days
    });
  }, [tasks]);

  // Form submit handler
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle) return;

    // Use employee lists and other lists, formatting fallbacks
    const selectedAssignedTo = employeesList.join(', ') || formAssign || 'รอกำหนดช่าง';
    const selectedGpsLoc = locationsList.join(', ') || formGps || 'ไซต์งานหลัก';

    const newTask: WorkScheduleTask = {
      id: `tsk-${Math.floor(Math.random() * 900) + 100}`,
      title: formTitle,
      description: formDesc,
      machineryId: formMach || undefined,
      assignedTo: selectedAssignedTo,
      priority: formPriority,
      dueDate: formDueDate,
      gpsLocName: selectedGpsLoc,
      status: formStatus,
      timeline: [
        { 
          status: formStatus, 
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16), 
          note: `สร้างใบแผนงานสำเร็จในระบบ FlowWork CMMS - กำหนดผู้รับผิดชอบ: ${selectedAssignedTo}` 
        }
      ],
      comments: [],
      photoUrls: [],
      locations: locationsList.length > 0 ? locationsList : [selectedGpsLoc],
      supervisors: supervisorsList,
      machineries: machineriesList,
      employees: employeesList.length > 0 ? employeesList : (formAssign ? [formAssign] : []),
      assignedBy: assignedBy,
      workTime: formTime
    };

    onAddTask(newTask);
    setActiveTaskId(newTask.id);
    
    // Reset Form
    setFormTitle('');
    setFormDesc('');
    setFormMach('');
    setFormAssign('');
    setFormPriority('medium');
    setFormGps('ไซต์งานก่อสร้างคลอง ชลประทานเฟส 3');
    setLocationsList([]);
    setLocInput('');
    setSupervisorsList([]);
    setSupInput('');
    setMachineriesList([]);
    setMachInput('');
    setEmployeesList([]);
    setEmpInput('');
    setAssignedBy('');
    setFormTime('08:00');
    setFormStatus('pending');
    handleCloseForm();
  };

  // Comment System
  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText || !selectedTask) return;

    const updatedComments = [
      ...selectedTask.comments,
      {
        id: `com-${Date.now()}`,
        userName: 'วิศวกรสิทธิโชค (กรุงเทพ)',
        userRole: 'ผู้อนุมัติโครงการ',
        text: commentText,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
      }
    ];

    onUpdateTask({
      ...selectedTask,
      comments: updatedComments
    });

    setCommentText('');
  };

  // Status Machine
  const handleStatusChange = (newStatus: TaskStatus) => {
    if (!selectedTask) return;

    const statusLabel = 
      newStatus === 'pending' ? 'รอดำเนินการ' :
      newStatus === 'in_progress' ? 'กำลังทำ' :
      newStatus === 'awaiting_approval' ? 'รออนุมัติเสร็จสิ้น' :
      newStatus === 'completed' ? 'เสร็จเสร็จสมบูรณ์' : 'ยกเลิกปฏิบัติงาน';

    const updatedTimeline = [
      ...selectedTask.timeline,
      {
        status: newStatus,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        note: `เปลี่ยนขั้นตอนการซ่อมบำรุงเป็น: [${statusLabel}]`
      }
    ];

    onUpdateTask({
      ...selectedTask,
      status: newStatus,
      timeline: updatedTimeline
    });
  };

  const handleMockAttachment = () => {
    if (!selectedTask) return;
    const library = [
      'https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=400'
    ];
    const pick = library[Math.floor(Math.random() * library.length)];
    onUpdateTask({
      ...selectedTask,
      photoUrls: [...selectedTask.photoUrls, pick]
    });
  };

  // 1. Month Calendar Matrix Configuration (Dynamic)
  const calendarDays = useMemo(() => {
    const days = [];
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Blank cells before the start of the month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ blank: true, dayNum: 0 });
    }

    // Days in Month
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const monthPart = String(currentMonth + 1).padStart(2, '0');
      const dayPart = String(day).padStart(2, '0');
      const dayStr = `${currentYear}-${monthPart}-${dayPart}`;
      const dayTasks = tasks.filter(t => t.dueDate === dayStr);
      days.push({ blank: false, dayNum: day, dateStr: dayStr, dayTasks });
    }
    return days;
  }, [tasks, currentYear, currentMonth]);

  // 2. Week Calendar configuration (Dynamic 7-day week based on selectedDayTab)
  const weekDays = useMemo(() => {
    const parts = selectedDayTab.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const d = new Date(year, month, day);
    const dayOfWeek = d.getDay(); // 0 is Sun, 1 is Mon, ..., 6 is Sat
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const monday = new Date(year, month, day + distanceToMonday);
    
    const thaiDayNames = [
      'จันทร์ (Mon)',
      'อังคาร (Tue)',
      'พุธ (Wed)',
      'พฤหัสฯ (Thu)',
      'ศุกร์ (Fri)',
      'เสาร์ (Sat)',
      'อาทิตย์ (Sun)'
    ];
    
    const list = [];
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const yStr = currentDay.getFullYear();
      const mStr = String(currentDay.getMonth() + 1).padStart(2, '0');
      const dStr = String(currentDay.getDate()).padStart(2, '0');
      const dateStr = `${yStr}-${mStr}-${dStr}`;
      
      list.push({
        name: thaiDayNames[i],
        dateStr
      });
    }
    
    return list.map(d => {
      const dayTasks = tasks.filter(t => t.dueDate === d.dateStr);
      return { ...d, dayTasks };
    });
  }, [tasks, selectedDayTab]);

  // 3. Day Calendar Configuration (Dynamic hours timeline for selectedDayTab)
  const dayScheduleTasks = useMemo(() => {
    return tasks.filter(t => t.dueDate === selectedDayTab);
  }, [tasks, selectedDayTab]);

  return (
    <div className="space-y-6" id="work-schedule-view-component">
      
      {/* Dynamic Urgency warning panel (แจ้งเตือนงานใกล้ครบกำหนด) */}
      {upcomingTasks.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-pulse" id="urgency-alert-panel">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/20 text-rose-600 rounded-xl relative">
              <Bell className="w-5 h-5 text-rose-500" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-600 rounded-full"></span>
            </div>
            <div>
              <h3 className="text-xs font-black text-rose-600">🚨 ตรวจพบแผนการปฏิบัติงานซ่อมเกณฑ์เร่งด่วน ({upcomingTasks.length} รายการ)</h3>
              <p className="text-[10px] text-stone-500 mt-0.5">โปรดเร่งรัดหัวหน้าช่างประจำไซต์ก่อนเลยกำหนด เพื่อหลีกเลี่ยงกระบวนการระงับงานล่าช้ากว่าแผน</p>
            </div>
          </div>
          <div className="flex gap-2 max-w-full overflow-x-auto py-1">
            {upcomingTasks.map(t => (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTaskId(t.id);
                  setIsEditing(false);
                }}
                className={`px-3 py-1 bg-rose-500 text-white rounded-lg text-[9px] font-bold tracking-wider hover:bg-rose-600 flex items-center gap-1 shrink-0 ${activeTaskId === t.id ? 'ring-2 ring-white scale-105' : ''}`}
              >
                <span>{t.id} ({t.dueDate.substring(8, 10)} พ.ค.)</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Structural Deck Grid Wrapper */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="work-schedule-main">
        
        {/* LEFT COLUMN: Calendar & list switcher panel (8 Grid Units) */}
        <div className={`lg:col-span-8 ${style.panelBg} rounded-2xl p-5 flex flex-col justify-between shadow-lg`}>
          <div>
            
            {/* Action Bar Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-500/10 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 ${style.badgeHeader} rounded-xl`}>
                  <CalIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className={`text-base font-bold ${style.textTitle}`}>ระบบสั่งการตารางแผนงาน (FlowWork-360 Schedule)</h2>
                  <p className="text-xs text-stone-500">ควบคุมและสั่งการช่างเครื่องยนต์ประเมินผลรายวันและรายสัปดาห์</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* 1. Day / Week / Month tab switcher (ปฏิทินงานรายวัน รายสัปดาห์ รายเดือน) */}
                {viewMode === 'calendar' && (
                  <div className="bg-stone-50/40 p-1 rounded-xl flex gap-1 border border-slate-550/10">
                    {(['day', 'week', 'month'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setCalendarView(mode)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                          calendarView === mode
                            ? style.btnPrimary
                            : 'text-stone-500 hover:text-stone-700'
                        }`}
                      >
                        {mode === 'day' ? 'รายวัน' : mode === 'week' ? 'รายสัปดาห์' : 'รายเดือน'}
                      </button>
                    ))}
                  </div>
                )}

                {/* 2. Visual View Format toggle */}
                <div className="bg-stone-50/40 p-1 rounded-xl flex gap-1 border border-slate-550/10">
                  <button
                    onClick={() => setViewMode('calendar')}
                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-slate-500/20 text-orange-600' : 'text-stone-500 hover:text-stone-700'}`}
                    title="แสดงรูปแบบปฏิทินปัดหมุด"
                  >
                    <CalIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-500/20 text-orange-600' : 'text-stone-500 hover:text-stone-700'}`}
                    title="แสดงรายการการ์ดเรียงลำดับ"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* 3. New Mission Button */}
                <button
                  onClick={() => {
                    setShowAddForm(true);
                    setIsEditing(false);
                  }}
                  className={`flex items-center gap-1.5 ${style.btnPrimary} px-3 py-1.5 rounded-xl text-xs font-black shadow transition-all hover:scale-[1.02] cursor-pointer`}
                >
                  <Plus className="w-4 h-4" />
                  เพิ่มงาน
                </button>
              </div>
            </div>

            {/* Core Visual workspace display rendering */}
            <div className="mt-5">
              {showAddForm ? (
                /* Dynamic Work Assignment form */
                <form onSubmit={handleCreateTask} className={`${style.formBg} transition-all duration-300`}>
                  <div className="flex items-center justify-between border-b pb-2.5 mb-4 border-slate-500/10">
                    <h3 className="text-sm font-black text-orange-500 flex items-center gap-1.5 uppercase tracking-wide">
                      <Sparkles className="w-4 h-4" /> มอบหมายแผนงานใหม่
                    </h3>
                    <button 
                      type="button" 
                      onClick={handleCloseForm}
                      className="p-1 hover:bg-slate-500/10 rounded transition-colors duration-200 cursor-pointer"
                    >
                      <X className="w-4 h-4 text-stone-550" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-[10px] ${style.label} mb-1 uppercase tracking-wider`}>ชื่องานปฏิบัติการ (Task Title)</label>
                      <input
                        type="text"
                        className={`w-full rounded-xl px-4 py-2.5 text-xs outline-none ${style.inputText}`}
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="เช่น ช่างซ่อมบำรุงเปลี่ยนซีลแทร็กรถแม็คโคร"
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-[10px] ${style.label} mb-1 uppercase tracking-wider`}>ผู้มอบหมายงานหลัก</label>
                      <input
                        type="text"
                        className={`w-full rounded-xl px-4 py-2.5 text-xs outline-none ${style.inputText}`}
                        value={assignedBy}
                        onChange={(e) => setAssignedBy(e.target.value)}
                        placeholder="ชื่อผู้รับผิดชอบหลัก"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3.5">
                    {/* Locations */}
                    <div>
                      <label className={`block text-[10px] ${style.label} mb-1 uppercase tracking-wider text-rose-600 flex justify-between`}>
                        <span>📍 สถานที่หน้างาน (Locations) ({locationsList.length})</span>
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          className={`flex-1 rounded-xl px-3 py-2 text-xs outline-none ${style.inputText}`}
                          value={locInput}
                          onChange={(e) => setLocInput(e.target.value)}
                          placeholder="เช่น PTNC บางเลน นครปฐม"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (locInput.trim()) {
                                setLocationsList([...locationsList, locInput.trim()]);
                                setLocInput('');
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (locInput.trim()) {
                              setLocationsList([...locationsList, locInput.trim()]);
                              setLocInput('');
                            }
                          }}
                          className="px-3 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold rounded-xl transition-all"
                        >
                          +
                        </button>
                      </div>
                      {locationsList.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5 p-1.5 bg-stone-500/5 rounded-xl border border-stone-200/50">
                          {locationsList.map((loc, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 bg-white border border-stone-200 rounded-lg px-2 py-0.5 text-[9.5px] font-medium text-stone-700">
                              <span>{loc}</span>
                              <button
                                type="button"
                                onClick={() => setLocationsList(locationsList.filter((_, i) => i !== idx))}
                                className="text-stone-400 hover:text-stone-600 font-bold ml-0.5"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Vehicles / Machinery */}
                    <div>
                      <label className={`block text-[10px] ${style.label} mb-1 uppercase tracking-wider text-emerald-600 flex justify-between`}>
                        <span>🚜 เพิ่มรถและเครื่องจักร ({machineriesList.length})</span>
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          className={`flex-1 rounded-xl px-3 py-2 text-xs outline-none ${style.inputText}`}
                          value={machInput}
                          onChange={(e) => setMachInput(e.target.value)}
                          placeholder="เช่น แบคโฮ เบอร์ 5 5 (320) เครื่องจักร สามารถเพิ่มได้มากกว่า 2 รายการ"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (machInput.trim()) {
                                setMachineriesList([...machineriesList, machInput.trim()]);
                                setMachInput('');
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (machInput.trim()) {
                              setMachineriesList([...machineriesList, machInput.trim()]);
                              setMachInput('');
                            }
                          }}
                          className="px-3 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold rounded-xl transition-all"
                        >
                          +
                        </button>
                      </div>
                      {machineriesList.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5 p-1.5 bg-stone-500/5 rounded-xl border border-stone-200/50">
                          {machineriesList.map((machItem, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 bg-white border border-stone-200 rounded-lg px-2 py-0.5 text-[9.5px] font-medium text-stone-700">
                              <span>{machItem}</span>
                              <button
                                type="button"
                                onClick={() => setMachineriesList(machineriesList.filter((_, i) => i !== idx))}
                                className="text-stone-400 hover:text-stone-600 font-bold ml-0.5"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    {/* Team supervisors */}
                    <div>
                      <label className={`block text-[10px] ${style.label} mb-1 uppercase tracking-wider text-amber-600`}>🧔 เพิ่มหัวหน้างาน ({supervisorsList.length})</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          className={`flex-1 rounded-xl px-3 py-2 text-xs outline-none ${style.inputText}`}
                          value={supInput}
                          onChange={(e) => setSupInput(e.target.value)}
                          placeholder="เช่น พี่ต้น"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (supInput.trim()) {
                                setSupervisorsList([...supervisorsList, supInput.trim()]);
                                setSupInput('');
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (supInput.trim()) {
                              setSupervisorsList([...supervisorsList, supInput.trim()]);
                              setSupInput('');
                            }
                          }}
                          className="px-3 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold rounded-xl transition-all"
                        >
                          +
                        </button>
                      </div>
                      {supervisorsList.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5 p-1.5 bg-stone-500/5 rounded-xl border border-stone-200/50">
                          {supervisorsList.map((sup, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 bg-white border border-stone-200 rounded-lg px-2 py-0.5 text-[9.5px] font-medium text-stone-700">
                              <span>{sup}</span>
                              <button
                                type="button"
                                onClick={() => setSupervisorsList(supervisorsList.filter((_, i) => i !== idx))}
                                className="text-stone-400 hover:text-stone-600 font-bold ml-0.5"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Field Workers */}
                    <div>
                      <label className={`block text-[10px] ${style.label} mb-1 uppercase tracking-wider text-indigo-600`}>👷 เพิ่มพนักงาน ได้มากกว่า 2 รายการ ({employeesList.length})</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          className={`flex-1 rounded-xl px-3 py-2 text-xs outline-none ${style.inputText}`}
                          value={empInput}
                          onChange={(e) => setEmpInput(e.target.value)}
                          placeholder="เช่น พี่เบนซ์ พี่เทพ"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (empInput.trim()) {
                                setEmployeesList([...employeesList, empInput.trim()]);
                                setEmpInput('');
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (empInput.trim()) {
                              setEmployeesList([...employeesList, empInput.trim()]);
                              setEmpInput('');
                            }
                          }}
                          className="px-3 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold rounded-xl transition-all"
                        >
                          +
                        </button>
                      </div>
                      {employeesList.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5 p-1.5 bg-stone-500/5 rounded-xl border border-stone-200/50">
                          {employeesList.map((emp, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 bg-white border border-stone-200 rounded-lg px-2 py-0.5 text-[9.5px] font-medium text-stone-700">
                              <span>{emp}</span>
                              <button
                                type="button"
                                onClick={() => setEmployeesList(employeesList.filter((_, i) => i !== idx))}
                                className="text-stone-400 hover:text-stone-600 font-bold ml-0.5"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3.5">
                    <label className={`block text-[10px] ${style.label} mb-1 uppercase tracking-wider`}>คำแนะนำและอสังหาริมทรัพย์ / รายละเอียดงานเพิ่มเติม</label>
                    <textarea
                      rows={2.5}
                      className={`w-full rounded-xl px-4 py-2 text-xs outline-none ${style.inputText}`}
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      placeholder="อธิบายรายละเอียด พิกัดจุดขุด และอื่น ๆ..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-3.5">
                    <div>
                      <label className={`block text-[10.5px] ${style.label} mb-1`}>ความเร่งด่วน</label>
                      <select
                        className={`w-full rounded-xl px-3 py-2 text-xs outline-none ${style.inputText}`}
                        value={formPriority}
                        onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
                      >
                        <option value="low">🟡 ทั่วไป (Low Priority)</option>
                        <option value="medium">🟠 สำคัญ (Medium Priority)</option>
                        <option value="high">🔴 เร่งด่วน (High Priority)</option>
                        <option value="critical">🚨 วิกฤตหยุดเครื่อง (Critical)</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-[10.5px] ${style.label} mb-1`}>สถานะเริ่มต้น</label>
                      <select
                        className={`w-full rounded-xl px-3 py-2 text-xs outline-none ${style.inputText}`}
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as TaskStatus)}
                      >
                        <option value="pending">⏳ รอดำเนินการ</option>
                        <option value="in_progress">⚙️ กำลังดำเนินการ</option>
                        <option value="awaiting_approval">🔔 รออนุมัติเสร็จงาน</option>
                        <option value="completed">✅ เสร็จสิ้นการปฏิบัติงาน</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-[10.5px] ${style.label} mb-2`}>วันที่ทำงาน</label>
                      <input
                        type="date"
                        className={`w-full rounded-xl px-3 py-2 text-xs outline-none ${style.inputText}`}
                        value={formDueDate}
                        onChange={(e) => setFormDueDate(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className={`block text-[10.5px] ${style.label} mb-2`}>เวลา</label>
                      <input
                        type="time"
                        className={`w-full rounded-xl px-3 py-2 text-xs outline-none ${style.inputText}`}
                        value={formTime}
                        onChange={(e) => setFormTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-500/10 mt-4.5">
                    <button
                      type="button"
                      onClick={handleCloseForm}
                      className={`${style.btnSecondary} cursor-pointer px-4 py-1.5 rounded-xl text-xs`}
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className={`${style.btnPrimary} cursor-pointer px-6 py-2 rounded-xl text-xs shadow-md`}
                    >
                      บันทึกคำสั่งงาน
                    </button>
                  </div>
                </form>
              ) : viewMode === 'calendar' ? (
                
                // 3.1: Month View Engine
                calendarView === 'month' ? (
                  <div className="space-y-3">
                    <div className="bg-stone-50/60 p-3.5 rounded-t-xl flex flex-col sm:flex-row gap-3 justify-between items-center text-xs font-bold text-stone-700 border border-slate-500/10">
                      <div className="flex items-center gap-1.5">
                        <button 
                          type="button"
                          onClick={() => {
                            if (currentMonth === 0) {
                              setCurrentMonth(11);
                              setCurrentYear(prev => prev - 1);
                              const prevMonthDay = String(new Date(currentYear - 1, 11, 28).getDate()).padStart(2, '0');
                              setSelectedDayTab(`${currentYear - 1}-12-${prevMonthDay}`);
                            } else {
                              setCurrentMonth(prev => prev - 1);
                              const prevMonthDay = String(new Date(currentYear, currentMonth - 1, 28).getDate()).padStart(2, '0');
                              setSelectedDayTab(`${currentYear}-${String(currentMonth).padStart(2, '0')}-${prevMonthDay}`);
                            }
                          }}
                          className="px-2.5 py-1 text-[10px] bg-white border border-stone-200 rounded-lg hover:bg-stone-50 select-none shadow-sm cursor-pointer"
                        >
                          ◀ ย้อนหลัง
                        </button>
                        <span className="text-stone-850 font-black px-1.5 text-xs sm:text-sm">
                          🗓️ {[
                            'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                            'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
                          ][currentMonth]} {currentYear + 543} / {[
                            'January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December'
                          ][currentMonth]} {currentYear}
                        </span>
                        <button 
                          type="button"
                          onClick={() => {
                            if (currentMonth === 11) {
                              setCurrentMonth(0);
                              setCurrentYear(prev => prev + 1);
                              const nextMonthDay = String(new Date(currentYear + 1, 0, 28).getDate()).padStart(2, '0');
                              setSelectedDayTab(`${currentYear + 1}-01-${nextMonthDay}`);
                            } else {
                              setCurrentMonth(prev => prev + 1);
                              const nextMonthDay = String(new Date(currentYear, currentMonth + 1, 28).getDate()).padStart(2, '0');
                              setSelectedDayTab(`${currentYear}-${String(currentMonth + 2).padStart(2, '0')}-${nextMonthDay}`);
                            }
                          }}
                          className="px-2.5 py-1 text-[10px] bg-white border border-stone-200 rounded-lg hover:bg-stone-50 select-none shadow-sm cursor-pointer"
                        >
                          ถัดไป ▶
                        </button>
                      </div>
                      <span className="text-[10px] text-orange-600 bg-orange-500/10 px-3 py-1 rounded-full font-black">
                        ชลประทานเฟรส 3 เขตเหนือ
                      </span>
                    </div>
                    
                    {/* Calendar Day Titles */}
                    <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-black text-slate-500 border-b border-slate-500/10 pb-2">
                      <div>อา. (Sun)</div>
                      <div>จ. (Mon)</div>
                      <div>อ. (Tue)</div>
                      <div>พ. (Wed)</div>
                      <div>พฤ. (Thu)</div>
                      <div>ศ. (Fri)</div>
                      <div>ส. (Sat)</div>
                    </div>

                    <div className="grid grid-cols-7 gap-1.5 h-64 overflow-y-auto pr-1">
                      {calendarDays.map((val, idx) => {
                        if (val.blank) {
                          return <div key={`bg-blank-${idx}`} className="bg-white rounded-xl min-h-11"></div>;
                        }

                        const hasTasks = val.dayTasks && val.dayTasks.length > 0;
                        const hasActive = val.dayTasks?.some(t => t.id === activeTaskId);
                        const isCurrentActiveDay = val.dateStr === selectedDayTab;

                        return (
                          <div 
                            key={val.dayNum} 
                            onClick={() => {
                              if (val.dateStr) {
                                setSelectedDayTab(val.dateStr);
                              }
                              if (hasTasks && val.dayTasks) {
                                setActiveTaskId(val.dayTasks[0].id);
                                setIsEditing(false);
                              } else {
                                // Default task template
                                if (val.dateStr) {
                                  setFormDueDate(val.dateStr);
                                }
                                setShowAddForm(true);
                              }
                            }}
                            className={`min-h-12 p-2 rounded-xl flex flex-col justify-between border cursor-pointer hover:scale-105 active:scale-95 transition-all text-left ${
                              isCurrentActiveDay
                                ? 'bg-orange-500/20 border-orange-600 font-extrabold text-orange-700 shadow-sm'
                                : hasActive 
                                  ? 'bg-orange-500/15 border-orange-500/70 text-orange-600' 
                                  : hasTasks 
                                    ? `${style.card} border-sky-400/50 hover:border-sky-500` 
                                    : 'bg-stone-50/80 border border-stone-200/60 hover:bg-white'
                            }`}
                          >
                            <span className={`text-[10px] font-mono leading-none font-bold ${hasTasks ? 'text-orange-500 font-extrabold' : 'text-slate-500'}`}>
                              {val.dayNum}
                            </span>
                            
                            {/* Small dots on schedule dates */}
                            {hasTasks && (
                              <div className="flex gap-0.5 justify-end">
                                {val.dayTasks?.map(dt => (
                                  <span 
                                    key={dt.id} 
                                    className={`w-2 h-2 rounded-full ${
                                      dt.priority === 'high' || dt.priority === 'critical' ? 'bg-rose-500' : 'bg-teal-400'
                                    }`}
                                    title={`${dt.id}: ${dt.title}`}
                                  ></span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : calendarView === 'week' ? (
                  
                  // 3.2: Weekly Calendar Grid (7 Columns Mon-Sun)
                  <div className="space-y-3">
                    <div className="bg-stone-50/60 p-3 rounded-t-xl flex flex-col sm:flex-row gap-2 items-center justify-between text-xs font-bold text-stone-700 border border-slate-500/10">
                      <div>
                        📅 แผนงานจำลองรายสัปดาห์ ({new Date(weekDays[0].dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} - {new Date(weekDays[6].dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })})
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const [y, m, d] = selectedDayTab.split('-').map(Number);
                            const prevWeek = new Date(y, m - 1, d - 7);
                            const yStr = prevWeek.getFullYear();
                            const mStr = String(prevWeek.getMonth() + 1).padStart(2, '0');
                            const dStr = String(prevWeek.getDate()).padStart(2, '0');
                            setSelectedDayTab(`${yStr}-${mStr}-${dStr}`);
                          }}
                          className="px-2.5 py-1 text-[10px] bg-white border border-stone-200 rounded-lg hover:bg-stone-50 select-none shadow-sm cursor-pointer"
                        >
                          ◀ สัปดาห์ก่อนหน้า
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const [y, m, d] = selectedDayTab.split('-').map(Number);
                            const nextWeek = new Date(y, m - 1, d + 7);
                            const yStr = nextWeek.getFullYear();
                            const mStr = String(nextWeek.getMonth() + 1).padStart(2, '0');
                            const dStr = String(nextWeek.getDate()).padStart(2, '0');
                            setSelectedDayTab(`${yStr}-${mStr}-${dStr}`);
                          }}
                          className="px-2.5 py-1 text-[10px] bg-white border border-stone-200 rounded-lg hover:bg-stone-50 select-none shadow-sm cursor-pointer"
                        >
                          สัปดาห์ถัดไป ▶
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-3 h-80 overflow-y-auto pr-1">
                      {weekDays.map(day => (
                        <div key={day.dateStr} className={`p-2 rounded-xl h-full flex flex-col ${day.dateStr === selectedDayTab ? 'ring-2 ring-orange-500/50 bg-orange-500/5 border-orange-500/20 shadow-md' : style.innerBg}`}>
                          <div className="text-center border-b border-slate-500/15 pb-1.5 mb-2">
                            <h4 className="text-[10px] font-black uppercase text-orange-500 shrink-0">{day.name}</h4>
                            <span className="text-[9px] font-mono font-extrabold text-slate-500">
                              {new Date(day.dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>

                          <div className="space-y-1.5 flex-1 overflow-y-auto max-h-60">
                            {day.dayTasks.length > 0 ? (
                              day.dayTasks.map(t => (
                                <div 
                                  key={t.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDayTab(day.dateStr);
                                    setActiveTaskId(t.id);
                                    setIsEditing(false);
                                  }}
                                  className={`p-2 rounded-lg border text-left cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                                    t.id === activeTaskId 
                                      ? 'bg-orange-600 text-white border-orange-500/80 shadow' 
                                      : 'bg-white border-slate-200 text-stone-800'
                                  }`}
                                >
                                  <p className="text-[9px] font-bold line-clamp-2 leading-tight">{t.title}</p>
                                  <div className="flex justify-between items-center mt-1 text-[8px] opacity-75">
                                    <span className="uppercase font-mono font-semibold">{t.priority}</span>
                                    <span>ช่าง {t.assignedTo.split(' ').pop()}</span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-[9px] text-slate-500 italic text-center my-auto py-4">ไม่มีแผนงาน</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  
                  // 3.3: Chronological Day View Timeline
                  <div className="space-y-4">
                    <div className="bg-stone-50/60 p-3 rounded-t-xl flex flex-wrap gap-2 items-center justify-between border border-slate-500/10">
                      <span className="text-xs font-bold text-stone-700">🔍 ตารางเวลารายวันพิเศษ (Daily Timeline)</span>
                      
                      {/* Tabs choosing active date */}
                      <div className="flex gap-1 overflow-x-auto">
                        {weekDays.map(day => (
                          <button
                            key={day.dateStr}
                            onClick={() => setSelectedDayTab(day.dateStr)}
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold shrink-0 transition-colors ${
                              selectedDayTab === day.dateStr 
                                ? 'bg-orange-500 text-white' 
                                : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
                            }`}
                          >
                            {new Date(day.dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-stone-50/10 rounded-2xl p-4 border border-slate-500/5">
                      <div className="space-y-3 pl-3 border-l-2 border-stone-200/50">
                        {dayScheduleTasks.length > 0 ? (
                          dayScheduleTasks.map((t, idx) => (
                            <div 
                              key={t.id} 
                              onClick={() => {
                                setActiveTaskId(t.id);
                                setIsEditing(false);
                              }}
                              className={`relative group p-3.5 rounded-xl border transition-all cursor-pointer ${
                                t.id === activeTaskId 
                                  ? 'bg-orange-500/10 border-orange-500/70 shadow' 
                                  : 'bg-white border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {/* Indicator dot */}
                              <span className="absolute -left-[19px] top-4 w-3.5 h-3.5 rounded-full border-2 border-white bg-orange-500 group-hover:scale-125 transition-transform" />
                              
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-orange-600 font-mono">Slot #{idx + 1}</span>
                                    <h4 className="text-xs font-bold leading-none">{t.title}</h4>
                                  </div>
                                  <p className="text-[10px] text-stone-500 mt-1 max-w-md line-clamp-1">{t.description || 'ไม่มีลายละเอียดระบุ'}</p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full capitalize font-mono ${
                                    t.priority === 'high' || t.priority === 'critical' ? 'bg-rose-500/10 text-rose-600' : 'bg-teal-500/10 text-teal-600'
                                  }`}>
                                    {t.priority}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-semibold font-mono">ช่างนพดล</span>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-6 text-center text-slate-500 italic text-xs">
                            😴 ไม่มีแผงระบุการปฏิบัติภารกิจในวันนี้นอนหลับได้ หรือคลิกเลือกวันที่อื่นแถบขวามือเพื่อค้นหา
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              ) : (
                
                /* List View layout */
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1" id="list-format-deck">
                  {tasks.map(t => (
                    <div 
                      key={t.id}
                      onClick={() => {
                        setActiveTaskId(t.id);
                        setIsEditing(false);
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        t.id === activeTaskId 
                          ? style.cardActive
                          : `${style.card} hover:bg-stone-50`
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono font-black uppercase ${
                            t.priority === 'high' || t.priority === 'critical' 
                              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/25'
                              : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/25'
                          }`}>
                            {t.priority} Priority
                          </span>
                          <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border ${
                            t.status === 'completed' ? style.badgeCompleted :
                            t.status === 'in_progress' ? style.badgeDoing :
                            t.status === 'awaiting_approval' ? style.badgeAwaiting :
                            t.status === 'cancelled' ? style.badgeCancelled : style.badgePending
                          }`}>
                            {t.status === 'pending' ? 'รอดำเนินการ' :
                             t.status === 'in_progress' ? 'กำลังปฏิบัติภารกิจ' :
                             t.status === 'awaiting_approval' ? 'รอผู้จัดการอนุมัติ' :
                             t.status === 'completed' ? 'ปิดงานสำเร็จ' : 'งานยกเลิก'}
                          </span>
                          <span className="text-[10px] text-stone-500 font-bold">ID: [{t.id}]</span>
                        </div>
                        <h4 className="text-xs font-black">{t.title}</h4>
                        <p className="text-[10px] text-stone-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                          <span>พิกัดหน้างาน: {t.gpsLocName || 'ไซต์สารภี เชียงใหม่'}</span>
                        </p>
                      </div>
                      <div className="text-right text-[11px] font-bold shrink-0">
                        <p className="text-orange-500 font-mono tracking-tight">{t.dueDate}</p>
                        <p className="text-stone-500 mt-1">ช่าง: {t.assignedTo.split(' ').slice(1).join(' ') || t.assignedTo}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sync notification bar */}
          <div className="bg-white/20 border-t border-slate-500/10 mt-5 pt-3.5 text-[11px] text-stone-500 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-stone-500 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ระบบบันทึกพยากรณ์และ AI ตารางงาน ซิงก์กล้องสะสม GPS บนคลาวด์ภาคเหนือสำเร็จ
            </span>
            <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest">
              OFFLINE CACHE ACTIVE (AES-256)
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: Task Detail Panel & Edit Mode (4 Grid Units) */}
        <div className={`lg:col-span-4 ${style.panelBg} rounded-2xl p-5 flex flex-col justify-between shadow-lg`}>
          {selectedTask ? (
            isEditing ? (
              
              /* ----------------- EDIT FORM LAYOUT ----------------- */
              <form onSubmit={handleSaveEdits} className="space-y-4 flex-1 flex flex-col justify-between text-left">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-500/10 pb-2 mb-4">
                    <h3 className="text-xs font-black text-orange-500 flex items-center gap-1.5">
                      <Edit3 className="w-4 h-4" /> ปรับปรุงใบงาน {selectedTask.id}
                    </h3>
                    <button 
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="p-1 hover:bg-slate-500/10 rounded"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] text-stone-500 font-bold uppercase mb-1">ชื่องานซ่อมบำรุง</label>
                      <input
                        type="text"
                        className={`w-full rounded-lg px-3 py-1.5 text-xs outline-none ${style.inputText}`}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-stone-500 font-bold uppercase mb-1">คำอธิบายงานปฏิบัติงาน</label>
                      <textarea
                        rows={3}
                        className={`w-full rounded-lg px-3 py-1.5 text-xs outline-none ${style.inputText}`}
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-stone-500 font-bold uppercase mb-1">มอบหมายผู้คุมเครื่องหลัก</label>
                      <input
                        type="text"
                        className={`w-full rounded-lg px-3 py-1.5 text-xs outline-none ${style.inputText}`}
                        value={editAssign}
                        onChange={(e) => setEditAssign(e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-stone-500 font-bold uppercase mb-1">ความเร่งด่วน</label>
                        <select
                          className={`w-full rounded-lg px-2 py-1.5 text-xs outline-none ${style.inputText}`}
                          value={editPriority}
                          onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                        >
                          <option value="low">🟡 ทั่วไป (Low)</option>
                          <option value="medium">🟠 กลาง (Med)</option>
                          <option value="high">🔴 ด่วน (High)</option>
                          <option value="critical">🚨 วิกฤต (Crit)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-stone-500 font-bold uppercase mb-1">กำหนดส่งมอบ</label>
                        <input
                          type="date"
                          className={`w-full rounded-lg px-2 py-1.5 text-[11px] outline-none ${style.inputText}`}
                          value={editDueDate}
                          onChange={(e) => setEditDueDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-stone-500 font-bold uppercase mb-1">สเปคไซต์ก่อสร้าง (GPS Site)</label>
                      <input
                        type="text"
                        className={`w-full rounded-lg px-3 py-1.5 text-xs outline-none ${style.inputText}`}
                        value={editGps}
                        onChange={(e) => setEditGps(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-stone-500 font-bold uppercase mb-1">เชื่อมต่อกับสารบบยานขับเคลื่อน</label>
                      <select
                        className={`w-full rounded-lg px-2 py-1.5 text-xs outline-none ${style.inputText}`}
                        value={editMach}
                        onChange={(e) => setEditMach(e.target.value)}
                      >
                        <option value="">-- ไม่เชื่อมเครื่องจักร --</option>
                        {machinery.map(m => (
                          <option key={m.id} value={m.id}>{m.code} ({m.model})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-500/10 mt-5">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 text-center bg-stone-50/10 hover:bg-slate-500/10 rounded-xl py-2 text-xs text-stone-500 font-bold border border-slate-500/15"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2 text-xs font-bold"
                  >
                    <Save className="w-4 h-4" />
                    บันทึกข้อมูล
                  </button>
                </div>
              </form>
            ) : (
              
              /* ----------------- DETAIL PREVIEW LAYOUT ----------------- */
              <div className="space-y-4 flex-1 flex flex-col justify-between text-left">
                <div>
                  
                  {/* ID & Title and Action Buttons */}
                  <div className="flex items-start justify-between border-b pb-2.5 border-slate-500/10 mb-3.5">
                    <div>
                      <span className="text-[10px] opacity-60 font-mono font-bold tracking-widest uppercase">ID: {selectedTask.id}</span>
                      <h3 className="text-sm font-black tracking-tight text-slate-800 leading-snug">{selectedTask.title}</h3>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={handleStartEdit}
                        className="p-2 bg-sky-500/10 text-sky-500 hover:bg-sky-500 hover:text-white rounded-xl transition-all cursor-pointer"
                        title="แก้ไขข้อมูลหลัก"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTask(selectedTask.id)}
                        className="p-2 bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all cursor-pointer"
                        title="ลบรายการแผนงานนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Task Parameters Block rendering */}
                  <div className="space-y-2 text-xs text-slate-700">
                    <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-500/5">
                      <span className="opacity-70 flex items-center gap-1.5 font-bold">
                        <User className="w-3.5 h-3.5 text-orange-450 shrink-0" /> ผู้ปฎิบัติงานหลัก
                      </span>
                      <span className="font-bold text-slate-800">{selectedTask.assignedTo}</span>
                    </div>

                    <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-500/5 font-bold">
                      <span className="opacity-70 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-orange-450 shrink-0" /> ดีเดย์กําหนดเสร็จ
                      </span>
                      <span className="font-mono text-orange-600">{selectedTask.dueDate}</span>
                    </div>

                    <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-500/5">
                      <span className="opacity-70 flex items-center gap-1.5 font-bold">
                        <MapPin className="w-3.5 h-3.5 text-orange-450 shrink-0" /> ตําแหน่ง GPS โครงการ
                      </span>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedTask.gpsLocName || 'เชียงใหม่')}`}
                        target="_blank" 
                        rel="noreferrer"
                        className="text-sky-500 font-bold hover:underline truncate max-w-[150px] flex items-center gap-1"
                        title="คลิกแสดงหมุดดาวเทียมส่องกล้องจริง"
                      >
                        <span>{selectedTask.gpsLocName || 'แคมป์ B เชียงใหม่'}</span>
                        <Map className="w-3 h-3 text-sky-500" />
                      </a>
                    </div>
                  </div>

                  {/* Status workflow controller */}
                  <div className="space-y-2 mt-4">
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-stone-500">อัปเดตความก้าวหน้าหน้างานจริง</label>
                    <div className="grid grid-cols-5 gap-1 bg-stone-50 p-1 rounded-xl border border-slate-500/5">
                      {(['pending', 'in_progress', 'awaiting_approval', 'completed', 'cancelled'] as const).map(st => {
                        const statusTh = 
                          st === 'pending' ? 'รอดำเนินการ' :
                          st === 'in_progress' ? 'กำลังทำ' :
                          st === 'awaiting_approval' ? 'รออนุมัติ' :
                          st === 'completed' ? 'เสร็จสิ้น' : 'ยกเลิก';
                        const activeVal = selectedTask.status === st;

                        return (
                          <button
                            key={st}
                            onClick={() => handleStatusChange(st)}
                            className={`py-2 px-0.5 rounded-lg text-[8px] xs:text-[9px] md:text-[10px] font-black transition-all border text-center flex items-center justify-center tracking-tighter ${
                              activeVal 
                                ? 'bg-orange-500 border-orange-500 text-white shadow-sm font-extrabold' 
                                : 'bg-transparent border-transparent text-stone-500 hover:bg-stone-100'
                            }`}
                            title={statusTh}
                          >
                            {statusTh}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Image files & documents attachments engine (แนบรูปภาพ มี uploader จริง) */}
                  <div className="space-y-2 border-t border-slate-500/10 pt-4 mt-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] uppercase font-black tracking-widest text-stone-500">แนบไฟล์ภาพส่องกล้องหน้างาน</label>
                      
                      {/* Hidden HTML Uploader */}
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileUpload} 
                        accept="image/*" 
                        className="hidden"
                      />
                      
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[10.5px] text-sky-550 font-bold flex items-center gap-1 hover:underline"
                          title="อัปโหลดภาพจริงจากเครื่องช่าง"
                        >
                          <Upload className="w-3.5 h-3.5 text-sky-500" />
                          <span>อัปภาพจริง</span>
                        </button>
                        <span className="text-slate-500">|</span>
                        <button 
                          onClick={handleMockAttachment}
                          className="text-[10.5px] text-orange-500 font-bold flex items-center gap-1 hover:underline"
                          title="แนบรูปตัวอย่างดาวเทียม"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>Mock</span>
                        </button>
                      </div>
                    </div>

                    {selectedTask.photoUrls.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 max-h-24 overflow-y-auto pr-1">
                        {selectedTask.photoUrls.map((url, i) => (
                          <div key={i} className="relative rounded-xl overflow-hidden h-14 border border-slate-500/15 group shadow-sm">
                            <img src={url} alt="Site evidence doc" referrerPolicy="no-referrer" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                              <span className="text-[8px] text-white font-mono bg-black/40 px-1 py-0.5 rounded font-black">
                                DOC #{i + 1}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border border-dashed border-slate-500/15 py-3 rounded-xl text-center text-[10px] text-slate-500 italic bg-white">
                        ยังไม่มีสื่อแนบหน้าเครื่องยนต์คันนี้
                      </div>
                    )}
                  </div>

                  {/* Operational Log Chronological Timeline (Timeline งาน) */}
                  <div className="space-y-2 border-t border-slate-500/10 pt-4 mt-4 text-left">
                    <span className="block text-[10px] uppercase font-black tracking-widest text-[#a855f7] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> ประวัติไทม์ไลน์บันทึกหน้างาน (Job Timeline)
                    </span>
                    <div className="space-y-3 pl-3 border-l-2 border-purple-500/20 max-h-24 overflow-y-auto pr-1 mt-2">
                      {selectedTask.timeline && selectedTask.timeline.length > 0 ? (
                        selectedTask.timeline.map((act, idx) => (
                          <div key={idx} className="relative text-[10px] leading-tight space-y-0.5">
                            {/* Chronology bullet */}
                            <span className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-purple-500 border border-white" />
                            <div className="flex justify-between text-[9px] opacity-60 font-mono">
                              <span className="font-bold text-purple-400 capitalize">{act.status}</span>
                              <span>{act.timestamp}</span>
                            </div>
                            <p className="text-slate-800 font-medium">{act.note}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-slate-550 italic">ไม่มีบันทึกไทม์ไลน์</p>
                      )}
                    </div>
                  </div>

                  {/* Technical Comments Dialogue section (Comment ในงาน) */}
                  <div className="space-y-3.5 border-t border-slate-500/10 pt-4 mt-4">
                    <span className="block text-[10px] uppercase font-black tracking-widest text-stone-500 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-orange-500" /> บันทึกคอมเมนต์ทางเทคนิค ({selectedTask.comments.length})
                    </span>

                    {/* Feed balloons */}
                    <div className="space-y-2 max-h-[110px] overflow-y-auto pr-1">
                      {selectedTask.comments.length > 0 ? (
                        selectedTask.comments.map(c => (
                          <div key={c.id} className="bg-stone-50 p-2.5 rounded-xl text-[10.5px] border border-slate-500/5 text-left leading-normal space-y-1">
                            <div className="flex justify-between items-center text-[9px]">
                              <span className="font-extrabold text-orange-500">{c.userName} ({c.userRole})</span>
                              <span className="opacity-50 font-mono">{c.timestamp.split(' ').pop()} น.</span>
                            </div>
                            <p className="text-slate-800">{c.text}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10.5px] text-slate-500 italic text-center py-2 pl-1">
                          ยังไม่มีข้อสังเกตเพิ่มเติม สามารถเขียนแนะนําตัวกรองหรือประเด็นน้ำมันเครื่องได้ทันที
                        </p>
                      )}
                    </div>

                    {/* Quick input field */}
                    <form onSubmit={handlePostComment} className="flex gap-1.5">
                      <input
                        type="text"
                        className={`flex-grow rounded-lg px-2.5 py-1 text-[11px] outline-none ${style.inputText}`}
                        placeholder="เขียนคำสั่งงานช่าง/ข้อสังเกตด่วน..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        required
                      />
                      <button 
                        type="submit" 
                        className="p-1 px-2.5 bg-sky-500 hover:bg-sky-600 rounded-lg text-white font-bold text-xs"
                      >
                        <Send className="w-3 h-3 text-white" />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )
          ) : (
            <p className="text-xs text-slate-500 italic text-center my-auto">กรุณาเลือกตารางงาน เพื่อจัดทำหรืออนุมัติความก้าวหน้า</p>
          )}
        </div>

      </div>
    </div>
  );
}
