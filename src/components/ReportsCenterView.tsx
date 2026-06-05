import React, { useState, useMemo } from 'react';
import { 
  Briefcase, 
  FileCheck, 
  Wrench, 
  Package, 
  Building2, 
  Fuel, 
  Coins, 
  UserCheck, 
  Calendar, 
  Search, 
  Download, 
  Printer, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  ChevronRight, 
  ArrowRight,
  MapPin,
  Bot,
  Filter,
  Check,
  AlertCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import { exportToExcel } from '../utils/excelExport';
import AttendanceMap from './AttendanceMap';
import { 
  WorkScheduleTask, 
  RepairRequest, 
  StockItem, 
  HeavyMachinery, 
  RefuelStatus, 
  ExpenseRecord,
  AttendanceLog 
} from '../types';

interface ReportsCenterViewProps {
  tasks: WorkScheduleTask[];
  repairs: RepairRequest[];
  stocks: StockItem[];
  machinery: HeavyMachinery[];
  refuels: RefuelStatus[];
  expenses: ExpenseRecord[];
  attendances: AttendanceLog[];
  theme?: string;
  onNavigate?: (tab: string) => void;
}

type ReportType = 
  | 'schedule' 
  | 'submissions' 
  | 'repairs' 
  | 'inventory' 
  | 'machinery' 
  | 'refuels' 
  | 'expenses' 
  | 'attendance';

export default function ReportsCenterView({
  tasks,
  repairs,
  stocks,
  machinery,
  refuels,
  expenses,
  attendances,
  theme = 'yellow',
  onNavigate
}: ReportsCenterViewProps) {
  // Report selection state
  const [activeReport, setActiveReport] = useState<ReportType>('schedule');

  // Interactive filters
  const [startDate, setStartDate] = useState('2026-05-01');
  const [endDate, setEndDate] = useState('2026-06-30');
  const [branchFilter, setBranchFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Table sorting & pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Selected table row for detailed image attachment popup
  const [selectedPhotoRow, setSelectedPhotoRow] = useState<any>(null);

  // Selected attendance log to focus on map
  const [selectedMapLogId, setSelectedMapLogId] = useState<string | null>(null);

  // Ask AI Advisor chatbot sim state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiInsightText, setAiInsightText] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // List of reports
  const reportsList = [
    { id: 'schedule', title: '1. ปฏิทินแผนงานช่าง', description: 'ความคืบหน้างานและผู้ดูแลแผน', icon: Briefcase, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { id: 'submissions', title: '2. รายงานหน่วยช่างปฏิบัติการ', description: 'ภาพรวมงานส่งแนบหลักฐานรูปภาพ', icon: FileCheck, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { id: 'repairs', title: '3. แจ้งซ่อมเครื่องจักรฉุกเฉิน', description: 'สถิติการขัดข้อง อาการเสียเฉียบพลัน', icon: Wrench, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { id: 'inventory', title: '4. คลังสารพัดอะไหล่พัสดุ', description: 'ตรวจสอบสเปค ระดับใกล้หมดคลัง', icon: Package, color: 'text-sky-600 bg-sky-50 border-sky-200' },
    { id: 'machinery', title: '5. ทะเบียนเครื่องจักรหลัก', description: 'ประวัติประจำรถ ชั่วโมงใช้งาน สถานะ', icon: Building2, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { id: 'refuels', title: '6. ขออนุมัติเติมน้ำมันเชื้อเพลิง', description: 'การใช้น้ำมัน ตรวจสอบราคาเฉลี่ยร่วม', icon: Fuel, color: 'text-orange-600 bg-orange-50 border-orange-200' },
    { id: 'expenses', title: '7. บัญชีงบประมาณโครงการ & AI', description: 'ติดตามความคุ้มค่าและคำแนะนำตัดต้นทุน', icon: Coins, color: 'text-teal-600 bg-teal-50 border-teal-200' },
    { id: 'attendance', title: '8. ตอกบัตรพิกัดกล้อง GPS', description: 'บันทึกเวลาปฏิบัติการณ์ เข้า-สาย-ขาด', icon: UserCheck, color: 'text-violet-600 bg-violet-50 border-violet-200' },
  ] as const;

  // Global static budget details for Report 7
  const budgetLimits: Record<string, { limit: number; label: string }> = {
    fuel: { limit: 1200000, label: 'น้ำมันเชื้อเพลิง' },
    repair: { limit: 800000, label: 'ค่าซ่อมบำรุง' },
    labor: { limit: 600000, label: 'ค่าแรงฝีมือช่าง' },
    parts: { limit: 500000, label: 'พัสดุ/อะไหล่' },
    transport: { limit: 200000, label: 'งานส่งกำลังพล' },
    rent: { limit: 400000, label: 'ค่าเช่ารถเครื่องจักร' },
    other: { limit: 150000, label: 'จิปาถะอื่น ๆ' }
  };

  // Helper date parsing check
  const isWithinDateRange = (dateStr: string | undefined): boolean => {
    if (!dateStr) return true;
    const cleanDate = dateStr.substring(0, 10);
    return cleanDate >= startDate && cleanDate <= endDate;
  };

  // Simulated Branch and Department mapping filters (high coherence)
  const isWithinFilter = (item: any): boolean => {
    // Branch simulation based on location/ID to maintain robust coherence
    if (branchFilter !== 'all') {
      const siteStr = String(item.siteLocation || item.gpsLocName || item.siteName || item.location || '').toLowerCase();
      if (branchFilter === 'north' && !siteStr.includes('เหนือ') && !siteStr.includes('เชียง') && !siteStr.includes('พะเยา') && !siteStr.includes('น่าน') && !siteStr.includes('ลำพูน')) return false;
      if (branchFilter === 'central' && !siteStr.includes('ยม') && !siteStr.includes('กลาง') && !siteStr.includes('กรุงเทพ')) return false;
      if (branchFilter === 'south' && !siteStr.includes('ราษฎร์') && !siteStr.includes('ใต้') && !siteStr.includes('สงขลา')) return false;
    }

    // Department simulation mapping
    if (deptFilter !== 'all') {
      const respStr = String(item.assignedTo || item.employeeName || item.reporterName || item.responsibleName || item.department || '').toLowerCase();
      if (deptFilter === 'maintenance' && !respStr.includes('ช่าง') && !respStr.includes('ซ่อม') && !respStr.includes('บำรุง')) return false;
      if (deptFilter === 'civil' && !respStr.includes('โยธา') && !respStr.includes('ตัก') && !respStr.includes('ขุด')) return false;
      if (deptFilter === 'transport' && !respStr.includes('ขนส่ง') && !respStr.includes('ขับ') && !respStr.includes('ส่งหมอบ')) return false;
    }
    return true;
  };

  // 1. DATA COMPUTATION FOR ACTIVE REPORTS

  // -- REPORT 1: ปฏิทินแผนงานช่าง --
  const scheduleData = useMemo(() => {
    const list = tasks.filter(t => isWithinDateRange(t.dueDate) && isWithinFilter(t));
    const total = list.length;
    const completed = list.filter(t => t.status === 'completed').length;
    const pending = list.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
    
    // overdue check compared to today (mock day: 2026-06-02)
    const overdue = list.filter(t => t.status !== 'completed' && t.dueDate < '2026-06-02').length;

    // Chart daily distribution
    const dailyMap: Record<string, number> = {};
    list.forEach(t => {
      const d = t.dueDate || 'ไม่ระบุ';
      dailyMap[d] = (dailyMap[d] || 0) + 1;
    });
    const dailyChart = Object.entries(dailyMap).map(([date, count]) => ({ date, count })).sort((a,b)=> a.date.localeCompare(b.date)).slice(-7);

    // Chart team distribution
    const teamMap: Record<string, number> = {};
    list.forEach(t => {
      const team = t.assignedTo || 'ไม่ได้ระบุ';
      teamMap[team] = (teamMap[team] || 0) + 1;
    });
    const teamChart = Object.entries(teamMap).map(([team, count]) => ({ team, count })).sort((a,b)=> b.count - a.count).slice(0, 5);

    return { total, completed, pending, overdue, list, dailyChart, teamChart };
  }, [tasks, startDate, endDate, branchFilter, deptFilter]);

  // -- REPORT 2: รายงานส่งงานช่างปฏิบัติการ --
  const submissionsData = useMemo(() => {
    // we search for tasks with checklist completed or containing timeline evidence or awaiting approval / active photos
    const list = tasks.filter(t => {
      const isSub = t.status === 'completed' || t.status === 'awaiting_approval' || (t.photoUrls && t.photoUrls.length > 0);
      return isSub && isWithinDateRange(t.dueDate) && isWithinFilter(t);
    });
    const total = list.length;
    const awaiting = list.filter(t => t.status === 'awaiting_approval').length;
    const approved = list.filter(t => t.status === 'completed').length;
    const rejected = list.filter(t => t.status === 'cancelled').length; // mapped as rejected for CMMS layout

    return { total, awaiting, approved, rejected, list };
  }, [tasks, startDate, endDate, branchFilter, deptFilter]);

  // -- REPORT 3: แจ้งซ่อมเครื่องจักรฉุกเฉิน --
  const repairsData = useMemo(() => {
    const list = repairs.filter(r => isWithinDateRange(r.timestamp) && isWithinFilter(r));
    const total = list.length;
    const completed = list.filter(r => r.status === 'completed').length;
    const ongoing = list.filter(r => r.status === 'repairing' || r.status === 'assigned' || r.status === 'approved').length;
    const pendingParts = list.filter(r => r.status === 'reported').length; // Waiting inspection/spareparts count

    // Urgency count for Recharts
    const urgencyData = [
      { name: 'วิกฤต (Critical)', value: list.filter(r => r.urgency === 'critical').length, color: '#ef4444' },
      { name: 'สูง (High)', value: list.filter(r => r.urgency === 'high').length, color: '#f97316' },
      { name: 'ปานกลาง (Medium)', value: list.filter(r => r.urgency === 'medium').length, color: '#8b5cf6' },
      { name: 'ต่ำ (Low)', value: list.filter(r => r.urgency === 'low').length, color: '#10b981' }
    ].filter(v => v.value > 0);

    // Calculated virtual repair costs from expense tracker where repair was done on same machinery
    const machineRepairCosts: Record<string, number> = {};
    expenses.filter(e => e.category === 'repair').forEach(e => {
      const machCode = machinery.find(m => m.id === e.machineryId)?.code || 'ส่วนกลาง';
      machineRepairCosts[machCode] = (machineRepairCosts[machCode] || 0) + e.amount;
    });
    const costChart = Object.entries(machineRepairCosts).map(([mach, amount]) => ({ mach, amount })).sort((a,b)=>b.amount - a.amount).slice(0, 6);

    return { total, completed, ongoing, pendingParts, list, urgencyData, costChart };
  }, [repairs, expenses, machinery, startDate, endDate, branchFilter, deptFilter]);

  // -- REPORT 4: รายงานคลังอะไหล่และสเปค --
  const stocksData = useMemo(() => {
    // inventory quantities are not date dependent but are filtered by metadata or search query
    const list = stocks.filter(s => {
      return isWithinFilter(s);
    });
    const totalCount = list.length;
    
    // Value = quantity * default simulated price
    const mockPrices: Record<string, number> = {
      'HYD': 25000, 'FIL': 650, 'SEAL': 420, 'OIL': 4500, 'TIR': 12000, 'BRK': 3200, 'BELT': 1200, 'BAT': 3800
    };
    const totalVal = list.reduce((sum, item) => {
      const catKey = item.code.substring(0, 3);
      const price = mockPrices[catKey] || 1500;
      return sum + (item.quantity * price);
    }, 0);

    const lowStock = list.filter(s => s.quantity > 0 && s.quantity <= s.minQuantity).length;
    const outOfStock = list.filter(s => s.quantity === 0).length;

    return { totalCount, totalVal, lowStock, outOfStock, list, mockPrices };
  }, [stocks, branchFilter, deptFilter]);

  // -- REPORT 5: ทะเบียนเครื่องจักรหลัก --
  const machineryData = useMemo(() => {
    const list = machinery.filter(m => isWithinFilter(m));
    const total = list.length;
    const active = list.filter(m => m.status === 'active').length;
    const repairing = list.filter(m => m.status === 'under_repair').length;
    const maintenanceDue = list.filter(m => m.status === 'maintenance_due').length;

    // Type distribution for chart
    const typeCounts: Record<string, number> = {};
    list.forEach(m => {
      const typeThai = 
        m.type === 'backhoe' ? 'รถแบรคโฮ' :
        m.type === 'grader' ? 'รถเกรดเดอร์' :
        m.type === 'roller' ? 'รถบดลม' :
        m.type === 'tenwheeler' ? 'สิบล้อขนส่ง' :
        m.type === 'watertruck' ? 'รถส่งน้ำ' : 'รถขุดอื่น ๆ';
      typeCounts[typeThai] = (typeCounts[typeThai] || 0) + 1;
    });
    const typeChart = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

    return { total, active, repairing, maintenanceDue, list, typeChart };
  }, [machinery, branchFilter, deptFilter]);

  // -- REPORT 6: ขออนุมัติเติมน้ำมันเชื้อเพลิง --
  const refuelsData = useMemo(() => {
    const list = refuels.filter(r => isWithinDateRange(r.date) && isWithinFilter(r));
    const total = list.length;
    
    // calculations
    const approved = list.filter(r => r.status === 'completed' || r.status === 'approved_to_fill').length;
    const pending = list.filter(r => r.status === 'pending_approval').length;
    const cancelled = list.filter(r => r.status === 'cancelled').length;

    // group fueling liters over days/months
    const dailyLiters: Record<string, number> = {};
    list.filter(r => r.status === 'completed').forEach(r => {
      const d = r.date || 'ไม่ระบุ';
      dailyLiters[d] = (dailyLiters[d] || 0) + (r.actualLiters || r.requestedLiters);
    });
    const litersChart = Object.entries(dailyLiters).map(([date, liters]) => ({ date, liters })).sort((a,b)=>a.date.localeCompare(b.date)).slice(-7);

    return { total, approved, pending, cancelled, list, litersChart };
  }, [refuels, startDate, endDate, branchFilter, deptFilter]);

  // -- REPORT 7: รายงานบัญชีงบประมาณเเละ AI Advisor --
  const expensesData = useMemo(() => {
    const list = expenses.filter(e => isWithinDateRange(e.date) && isWithinFilter(e));
    const totalAllocated = 4500000; // Mock total structural budget for the quarterly workspace
    const spent = list.reduce((sum, e) => sum + e.amount, 0);
    const balance = Math.max(0, totalAllocated - spent);
    const spentPercent = Number(((spent / totalAllocated) * 100).toFixed(1));

    // Calculate details per type of category
    const categoriesList = ['fuel', 'repair', 'labor', 'parts', 'transport', 'rent', 'other'] as const;
    const tableRows = categoriesList.map(cat => {
      const spentInCat = list.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
      const limit = budgetLimits[cat]?.limit || 100000;
      const label = budgetLimits[cat]?.label || 'อื่น ๆ';
      const rem = Math.max(0, limit - spentInCat);
      const pct = Number(((spentInCat / limit) * 100).toFixed(1));
      return { category: cat, label, limit, spent: spentInCat, rem, pct };
    });

    return { totalAllocated, spent, balance, spentPercent, rows: tableRows, list };
  }, [expenses, startDate, endDate, branchFilter, deptFilter]);

  // -- REPORT 8: ตอกบัตรพิกัดกล้อง GPS --
  const attendanceData = useMemo(() => {
    const list = attendances.filter(a => isWithinDateRange(a.checkInTime ? a.checkInTime.substring(0,10) : '') && isWithinFilter(a));
    const totalRecords = list.length;
    
    // Simulate absences or leaves
    const onTime = list.filter(a => {
      if (!a.checkInTime) return false;
      const hour = parseInt(a.checkInTime.substring(11, 13) || '0', 10);
      const min = parseInt(a.checkInTime.substring(14, 16) || '0', 10);
      return hour < 8 || (hour === 8 && min <= 15); // present before 08:15 AM
    }).length;

    const late = list.filter(a => {
      if (!a.checkInTime) return false;
      const hour = parseInt(a.checkInTime.substring(11, 13) || '0', 10);
      const min = parseInt(a.checkInTime.substring(14, 16) || '0', 10);
      return hour > 8 || (hour === 8 && min > 15);
    }).length;

    const absent = Math.max(0, 12 - (onTime + late)); // mock company crew has 12 tech staffs

    // Top employees checkin list
    const empFreq: Record<string, number> = {};
    list.forEach(a => {
      empFreq[a.employeeName] = (empFreq[a.employeeName] || 0) + 1;
    });
    const topChart = Object.entries(empFreq).map(([name, checkins]) => ({ name, checkins })).slice(0, 6);

    return { totalRecords, onTime, late, absent, list, topChart };
  }, [attendances, startDate, endDate, branchFilter, deptFilter]);

  // 2. SEARCH, SORT, AND PAGINATION LOGIC FOR ACTIVE REPORT TABLE
  const activeReportTableData = useMemo(() => {
    let rawList: any[] = [];
    switch (activeReport) {
      case 'schedule': rawList = scheduleData.list; break;
      case 'submissions': rawList = submissionsData.list; break;
      case 'repairs': rawList = repairsData.list; break;
      case 'inventory': rawList = stocksData.list; break;
      case 'machinery': rawList = machineryData.list; break;
      case 'refuels': rawList = refuelsData.list; break;
      case 'expenses': rawList = expensesData.list; break;
      case 'attendance': rawList = attendanceData.list; break;
    }

    // Apply Search Input
    let filtered = rawList;
    if (searchTerm) {
      const cleanSearch = searchTerm.toLowerCase();
      filtered = rawList.filter(item => {
        return Object.values(item).some(val => 
          String(val).toLowerCase().includes(cleanSearch)
        );
      });
    }

    // Apply Sorting
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        // Format undefined
        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';

        if (typeof valA === 'string') {
          return sortDirection === 'asc' 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
        } else {
          return sortDirection === 'asc' 
            ? (valA > valB ? 1 : -1) 
            : (valB > valA ? 1 : -1);
        }
      });
    }

    return filtered;
  }, [
    activeReport, 
    searchTerm, 
    sortField, 
    sortDirection, 
    scheduleData.list, 
    submissionsData.list, 
    repairsData.list, 
    stocksData.list, 
    machineryData.list, 
    refuelsData.list, 
    expensesData.list, 
    attendanceData.list
  ]);

  // Paginated chunk
  const paginatedTableData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return activeReportTableData.slice(startIndex, startIndex + itemsPerPage);
  }, [activeReportTableData, currentPage]);

  const totalPages = Math.ceil(activeReportTableData.length / itemsPerPage);

  const requestSort = (field: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortField === field && sortDirection === 'asc') {
      direction = 'desc';
    }
    setSortField(field);
    setSortDirection(direction);
    setCurrentPage(1);
  };

  // 3. EXPORT / PRINT HANDLERS
  const handleExportActiveReport = () => {
    const formatThaiStatus = (s: string) => {
      switch(s) {
        case 'completed': return 'เสร็จสมบูรณ์';
        case 'pending': return 'รอดำเนินการ';
        case 'in_progress': return 'กำลังทำงาน';
        case 'awaiting_approval': return 'รอตรวจรับงาน';
        case 'cancelled': return 'ยกเลิกแผน';
        case 'reported': return 'แจ้งชำรุด';
        case 'repairing': return 'ช่างซ่อมอยู่';
        case 'active': return 'ใช้งานปกติ';
        case 'under_repair': return 'นำซ่อมโรงงาน';
        case 'maintenance_due': return 'ครบวงรอบ PM';
        case 'present': return 'มาทำงานปกติ';
        case 'late': return 'มาทำงานสาย';
        case 'leave': return 'ลากิจ/ลาป่วย';
        default: return s;
      }
    };

    switch(activeReport) {
      case 'schedule':
        exportToExcel(
          scheduleData.list.map(t => ({
            ...t,
            statusThai: formatThaiStatus(t.status)
          })),
          [
            { key: 'dueDate', label: 'วันที่กำหนด' },
            { key: 'id', label: 'เลขที่แผนงาน' },
            { key: 'title', label: 'หัวข้องานซ่อมบำรุง' },
            { key: 'assignedTo', label: 'ช่างหลักผู้รับผิดชอบ' },
            { key: 'workTime', label: 'ชั่วโมงเป้าหมาย' },
            { key: 'statusThai', label: 'สถานะปัจจุบัน' }
          ],
          '1_work_schedule'
        );
        break;
      case 'submissions':
        exportToExcel(
          submissionsData.list.map(t => ({
            ...t,
            statusThai: formatThaiStatus(t.status)
          })),
          [
            { key: 'id', label: 'เลขใบงาน' },
            { key: 'dueDate', label: 'วันที่ส่งใบงาน' },
            { key: 'assignedTo', label: 'ช่างชำนาญการส่ง' },
            { key: 'assignedBy', label: 'ผู้ควบคุมฝ่ายอนุมัติ' },
            { key: 'workTime', label: 'ระยะเวลาที่ใช้รวม' },
            { key: 'statusThai', label: 'ผลการตรวจรับ' }
          ],
          '2_job_submissions'
        );
        break;
      case 'repairs':
        exportToExcel(
          repairsData.list.map(r => {
            const mCode = machinery.find(m => m.id === r.machineryId)?.code || 'ไม่พบรหัส';
            return {
              ...r,
              machineryCode: mCode,
              urgencyThai: r.urgency === 'critical' ? 'วิกฤตเร่งด่วน' : r.urgency === 'high' ? 'สูง' : 'ปกติ',
              statusThai: formatThaiStatus(r.status)
            };
          }),
          [
            { key: 'id', label: 'เลขที่เคสแจ้งซ่อม' },
            { key: 'timestamp', label: 'เวลารายงานขัดข้อง' },
            { key: 'machineryCode', label: 'รหัสเครื่องจักร' },
            { key: 'reporterName', label: 'ผู้กระทำการแจ้ง' },
            { key: 'problemDesc', label: 'รายละเอียดชำรุด' },
            { key: 'assignedTech', label: 'วิศวกรซ่อมคุมเคส' },
            { key: 'urgencyThai', label: 'ความเร่งด่วนทีม' },
            { key: 'statusThai', label: 'สถานะอาการ' }
          ],
          '3_emergency_repairs'
        );
        break;
      case 'inventory':
        exportToExcel(
          stocksData.list.map(s => {
            const catKey = s.code.substring(0, 3);
            const price = stocksData.mockPrices[catKey] || 1500;
            return {
              ...s,
              price,
              totalVal: s.quantity * price
            };
          }),
          [
            { key: 'code', label: 'รหัสพัสดุ' },
            { key: 'name', label: 'ชื่ออะไหล่ชลประทานอ้างอิง' },
            { key: 'category', label: 'หมวดหมู่อุปกรณ์' },
            { key: 'quantity', label: 'จำนวนคงคลังเหลือ' },
            { key: 'minQuantity', label: 'จุดวิกฤตสั่งซื้อ' },
            { key: 'unit', label: 'หน่วยวัดนับ' },
            { key: 'price', label: 'ราคาต่อหน่วย (฿)' },
            { key: 'totalVal', label: 'มูลค่ารวมคงคลัง (฿)' },
            { key: 'location', label: 'พิกัดตู้วางหิ้ง' }
          ],
          '4_inventory_parts'
        );
        break;
      case 'machinery':
        exportToExcel(
          machineryData.list.map(m => ({
            ...m,
            statusThai: formatThaiStatus(m.status)
          })),
          [
            { key: 'code', label: 'รหัสประจำคัน' },
            { key: 'brand', label: 'ยี่ห้อผู้ผลิต' },
            { key: 'model', label: 'รุ่นโมเดล' },
            { key: 'serialNumber', label: 'คัสซีซีเรียลการผลิต' },
            { key: 'responsibleName', label: 'วิศวกรผู้ควบคุมดูแล' },
            { key: 'hourMeter', label: 'ชั่วโมงมาตรวัดปัจจุบัน' },
            { key: 'statusThai', label: 'ความพร้อมขับเคลื่อน' }
          ],
          '5_machinery_index'
        );
        break;
      case 'refuels':
        exportToExcel(
          refuelsData.list.map(r => {
            const mCode = machinery.find(m => m.id === r.machineryId)?.code || 'รถส่วนกลาง';
            return {
              ...r,
              machineryCode: mCode,
              totalPrice: (r.actualLiters || r.requestedLiters) * r.pricePerLiter,
              statusThai: formatThaiStatus(r.status)
            };
          }),
          [
            { key: 'documentNo', label: 'รหัสเอกสารใบเบิก' },
            { key: 'date', label: 'วันที่ยื่นสิทธิ์เติม' },
            { key: 'machineryCode', label: 'คีย์เครื่องจักร' },
            { key: 'requesterName', label: 'ผู้ร้องขอสิทธิ์' },
            { key: 'fuelType', label: 'ชนิดน้ำมัน' },
            { key: 'requestedLiters', label: 'ปริมาตรอนุมัติ (ลิตร)' },
            { key: 'pricePerLiter', label: 'ราคาต่อลิตรเฉลี่ย' },
            { key: 'totalPrice', label: 'จำนวนเงินมูลค่างวด' },
            { key: 'statusThai', label: 'สถานะเบิกจ่ายจริง' }
          ],
          '6_refuel_requests'
        );
        break;
      case 'expenses':
        exportToExcel(
          expensesData.list,
          [
            { key: 'date', label: 'วันที่ทำรายงานงบ' },
            { key: 'category', label: 'ประเภทหมวด' },
            { key: 'description', label: 'คำอธิบายรายการสั่งจ่าย' },
            { key: 'amount', label: 'จำนวนเงินงบประมาณจริง (฿)' },
            { key: 'siteLocation', label: 'หน่วยไซต์งานเป้าหมาย' },
            { key: 'recordedBy', label: 'พนักงานผู้โอนจดบัญชี' }
          ],
          '7_quarterly_budget'
        );
        break;
      case 'attendance':
        exportToExcel(
          attendanceData.list.map(a => {
            const checkInClean = a.checkInTime ? a.checkInTime.substring(11, 19) : 'ไม่ได้สแกน';
            const checkOutClean = a.checkOutTime ? a.checkOutTime.substring(11, 19) : 'ยังไม่เช็คเอาท์';
            return {
              ...a,
              checkInClean,
              checkOutClean,
              statusThai: a.checkInTime ? 'เช็คอินสมบูรณ์' : 'ขาดลงชื่อ'
            };
          }),
          [
            { key: 'id', label: 'เลขบันทึกระบบ' },
            { key: 'employeeName', label: 'ชื่อพนักงานปฏิบัติงาน' },
            { key: 'role', label: 'ตำแหน่งช่าง' },
            { key: 'siteName', label: 'จุดพิกัดงานก่อสร้าง' },
            { key: 'checkInClean', label: 'เวลาแสกนเข้างาน' },
            { key: 'checkOutClean', label: 'เวลาสแกนออกงาน' },
            { key: 'gpsLocIn', label: 'พิกัดแผนที่ละติจูดเข้า' },
            { key: 'statusThai', label: 'สถานะเช็คบัตร' }
          ],
          '8_attendance_gps'
        );
        break;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // 4. SMART REAL-TIME AI INSIGHT ANALYSIS (Generatively Simulated for ultimate production quality)
  const currentAiInsight = useMemo(() => {
    let title = '';
    let bullets: string[] = [];
    let badge = 'ปลอดภัย (控制中)';

    switch(activeReport) {
      case 'schedule':
        title = '⚡ AI วิเคราะห์ความหนาแน่นปฏิทินปฏิบัติงานช่าง คาดการณ์ประสิทธิภาพ';
        bullets = [
          `ตรวจพบสถิติงานรวม ${scheduleData.total} รายการ (เสร็จแล้ว ${scheduleData.completed} เคส และงานค้างรวม ${scheduleData.pending} เคส)`,
          `มีสัดส่วนงานล่าช้าเกินกำหนดสะสม ${scheduleData.overdue} เคส ซึ่งส่งผลรบกวนประสิทธิภาพการส่งคืนพื้นที่หน้างาน 8%`,
          `คำแนะนำ: ทีมงานชลประทานเขตเหนือ แนะนำทำการสับเปลี่ยนเวรปฏิบัติภารกิจซ่อมบำรุงในช่วงวันพุธ-ศุกร์ เพื่อลดรอบเวฟงานซ้อนขัดข้อง (Peak Density Window)`
        ];
        break;
      case 'submissions':
        title = '🔎 AI ตรวจรับการแนบภาพพยานหลักฐานและรายงานผลช่าง';
        bullets = [
          `จำนวนรายงานส่งเสร็จสิ้นสะสมที่รอนุมัติมีทั้งสิ้น ${submissionsData.awaiting} ใบงานหลัก`,
          `การสุ่มสำรวจคุณภาพพิกัดระบุ พบว่ารูปถ่ายแนบมีความสอดคล้องกับสภาพจริงของไซเรนรถบดและช่วงยางล้อ 95%`,
          `ประเด็นแนะนำปรับโครงสร้าง: แฟ้มงานช่างที่มีการใช้เวลาซ่อมสูง (เกิน 4 ชั่วโมง) ควรรวบรวมภาพอะไหล่เสียที่ถูกแยกออกเพื่อถอดแบบต้นทุนสีกาวหน้างาน`
        ];
        break;
      case 'repairs':
        title = '🛠️ AI พยากรณ์อาการชำรุดเครื่องยนต์ขวางแผนดำเนินการฉุกเฉิน';
        bullets = [
          `ตรวจพบเคสฉุกเฉินความรุนแรงระดับ 'วิกฤต (Critical)' จำนวนค้างอยู่ รอการส่งมอบกำลังพลสนับสนุน`,
          `โมเดลประมวลพบแนวโน้มกระบอกวาล์วระบบเกียร์ชุดรถเกรดเสียถี่สะสม สานต่อจากขุดเจาะหน้างานลำพูนร่วม`,
          `กลยุทธ์ป้องกัน: สั่งการเร่งติดตั้งสวิตช์จับกระแสแม่เหล็กหม้อน้ำ และเริ่มสแกน QR เพื่อทำ PM ย่อยล่วงหน้าทุก ๆ 250 ชม.`
        ];
        break;
      case 'inventory':
        const sumVal = stocksData.totalVal;
        title = '📦 AI วิเคราะห์สภาพคล่องคลังอะไหล่และสเปคพิเศษควบคุมคอส';
        bullets = [
          `สินทรัพย์คลังวิศวกรรมมีมูลค่ารวมประเมิน ฿${sumVal.toLocaleString()} บาท มีประเภทอะไหล่ใกล้ตกตารางสั่งซื้อขั้นตํ่า ${stocksData.lowStock} ชิ้น`,
          `พบวิกฤตระดับน้ำมันเครื่องไฮดรอลิกและหัวกรอง (คีย์ HYD/FIL) มียอดสั่งซ่อมเฉลี่ยสูงขึ้น แนะนำจัดเตรียมเจรจาผู้จัดจำหน่ายราคาส่ง`,
          `คำแนะนำสั่งพัสดุ: กดสุ่มทำสัญญายืมอะไหล่เกียร์รถบดล่วงหน้าระหว่างรอเบิกงบ เพื่อจัดทำโครงบีบอัดไม่ให้งานสะดุด`
        ];
        break;
      case 'machinery':
        title = '🚜 AI ตรวจดูอัตราความเข้มข้นกำลังเครื่องจักรหนักในองค์กร (KPI)';
        bullets = [
          `จากจำนวนเครื่องจักรหนัก ${machineryData.total} คัน พบสัดส่วนการชำรุดโรงงาน (Under Repair) คิดเป็นอัตราส่วน ${((machineryData.repairing / machineryData.total)*100).toFixed(1)}%`,
          `อายุการใช้ชั่วโมงสายพานในรถโฟล์คลิฟท์และเครนผ่านเกณฑ์สลับโหมดบำรุงรักษาถัดไป (PM Overdue Alerts) ภายใน 12 วันทำการ`,
          `ข้อแนะนำ: จัดลำดับการปล่อยปฏิบัติงานสำหรับรถที่มาตรวัดเกิน 4,500 ชั่วโมง ให้วิ่งเบาระยะใกล้เพื่อเลี่ยงการพังกระทันหัน`
        ];
        break;
      case 'refuels':
        title = '⛽ AI คำนวณความเสื่อมถอยค่าน้ำมันเชื้อเพลิงและประหยัดงบ';
        bullets = [
          `ปริมาตรการจ่ายน้ำมันรวมในระบบอนุมัติสำเร็จมีจำนวนมาก คิดเป็นเงินหมวดงวดแปรผันในโครงการชลประทานรวม`,
          `สแกนพิกัดระบุตำแหน่งสเตชั่นตู้จ่ายพบมีความคุ้มทุนเฉลี่ย 33.5 บาท/ลิตร แต่อัตราการสูญเสียในรอบการขับรถบรรทุกเกินมาตรฐานลิตรละ 3%`,
          `นวัตกรรมแนะนำ: ปรับรอบสิทธิการลงเวลาพนักงานเติมน้ำมันโดยเชื่อมกับรหัส GPS หน้างาน ป้องกันพฤติกรรมการอ้อมสายงานหรือสตาร์ทรถทิ้งไว้`
        ];
        break;
      case 'expenses':
        title = '💰 AI วิเคราะห์งบประมาณการเงินรายปีและแผนการจัดสรรประคองตัวเลข';
        bullets = [
          `งบลงทุนปัจจุบันใช้ไปแล้ว ฿${expensesData.spent.toLocaleString()} บาท จากวงเงินกำหนด ฿${expensesData.totalAllocated.toLocaleString()} (สัดส่วน ${expensesData.spentPercent}%) คงเหลือ ฿${expensesData.balance.toLocaleString()}`,
          `หมวดหมู่ที่ใช้งบสัดส่วนสูงสุดคือ หมวดน้ำมันเชื้อเพลิงและค่าซ่อมคันดิน มีเกณฑ์เร่งตัวในรอบปีสูงกว่ากรอบประมาณการไว้ 4.5%`,
          `คำพยากรณ์สิ้นปี: งบชำระทั่วไปมีแนวโน้มเพียงพอจนสิ้นสุดไตรมาส 3 แต่จำเป็นต้องตัดทอนเบี้ยพิเศษงวดการขนส่งลง 10% เพื่อสำรองเคสฉุกเฉินหน้าฝน`
        ];
        break;
      case 'attendance':
        title = '🚨 AI ตรวจสอบวินัยพิกัดเวลาเข้าทำงานผ่านกล้องและสัญญาณเทียม';
        bullets = [
          `สถิติวินัยช่างวันนี้: มาทำงานตรงเวลา ${attendanceData.onTime} คน, สถิติสแกนสายสะสม ${attendanceData.late} คน และคาดการณ์ประวัติขาดลากิจ ${attendanceData.absent} คน`,
          `พิกัดความผิดพลาดกล้องระบุ (เช็คอินหน้างาน) พบความลาดเอียงคลาดเคลื่อนเล็กน้อยในบริเวณแม่น้ำยมตะวันออกเหนือแผนผัง`,
          `ข้อเสนอแนะบริหารทีม: เพิ่มระบบตบมือเช็คอินแบบกลุ่มช่างช่วงเช้า 07:45 พร้อมสวมหน้ากากรักษาระเบียบการระแวดระวังลืมตอกบัตร`
        ];
        break;
    }

    return { title, bullets };
  }, [activeReport, scheduleData, repairsData, stocksData, machineryData, refuelsData, expensesData, attendanceData]);

  // Handle Dynamic Interactive Prompting with the AI Advisor (Ask anything input)
  const handleAskAdvisor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsLoadingAi(true);

    setTimeout(() => {
      const q = aiPrompt.toLowerCase();
      let response = '';

      if (q.includes('ประหยัด') || q.includes('ลดคอส') || q.includes('เซฟ') || q.includes('งบ')) {
        response = `💡 [วิเคราะห์เป้าหมายการประหยัด] แนะนำมาตรการเด็ดขาดเพื่อตัดรายจ่ายลง 15%: \n1. จำกัดพัสดุและอะไหล่จุดวิกฤต หันมาสลับสับอะไหล่บำรุงในรถที่จอดสเตชั่นชำรุด\n2. เจรจาทำตั๋วเติมน้ำมันเหมาจ่ายกับสถานีบริการในสัญญาระยะยาวรับส่วนลดเครดิตเทอม 45 วัน\n3. จัดโคลนิ่งตารางเช็คอินช่าง ให้ช่างพื้นที่ทำงานใกล้พิกัดบ้านมากที่สุดลดงบเดินทางคันดิน`;
      } else if (q.includes('ซ่อม') || q.includes('ชำรุด') || q.includes('อาการ') || q.includes('เครื่องจักร')) {
        response = `🛠️ [รายงานอาการเสียและอะไหล่สำรอง] จากประวัติการซ่อมกระบอกวาล์วและล้อขับเกรดเดอร์:\n• อัตราความชำรุดสะสมกำลังเข้าใกล้วงรอบเปลี่ยนกรองในเครื่องยนต์ CAT (${machinery.filter(m => m.status === 'maintenance_due').length} คัน)\n• ควรสำรองพิกัดซีลและข้อต่อยางคีย์ HYD-SEAL ไว้ใต้กล่องคลังชลประทานด่วน เพื่อสอดรับเกณฑ์รับงานเสร็จพฤษภาคมและมิถุนายนปีนี้`;
      } else if (q.includes('สาย') || q.includes('ลงเวลา') || q.includes('สายเยอะ') || q.includes('ขาด')) {
        response = `⏰ [ประเมินจริยธรรมพนักงานเช็คอิน] รายงานลงเวลาช่วงวันที่ ${startDate} ถึง ${endDate} ชี้ว่า:\n• ช่างผู้รับทำงานในพื้นที่เขตพิกัดห่างไกลมักสแกนเข้างานช่วงเร่งด่วน 08:10-08:25 อยู่บ่อยครั้ง\n• มาตรการแก้ไข: จัดทำรายงานรางวัลจูงใจพนักงาน "มาดีเด่นไม่สายประพฤติดี" และแจ้งเตือนสัญญาณตรงเวลาร่วมผ่านทาง LINE Notify อัติโนมัติทุกเช้า 07.45 น.`;
      } else {
        response = `🤖 [พยากรณ์ปัญญาประดิษฐ์ FlowWork Brain] ระบบคัดกรองคำถามของท่านเกี่ยวกับโมดูล "${activeReport}" แล้ว\n• ขณะคำนวณฐานข้อมูลประมวลผล สัญญาณความเสถียรของเครื่องจักรรวมทุกเขตยังประคองตัวอยู่ในเกณฑ์สีเขียวเข้มปลอดภัย (Safe Zone 94.2%)\n• หากต้องการวิเคราะห์ข้อมูลละเอียดระดับสเตเปิล แนะนำให้ปุ่มเครื่องมือค้นหา (Search) หรือกดส่งออกข้อมูลดิบเป็นไฟล์ Excel เพื่อเปรียบตัวเลขเทียบเชิงลึกได้ครับ`;
      }

      setAiInsightText(response);
      setIsLoadingAi(false);
    }, 900);
  };

  // Synchronize dynamic alert insights whenever report tab switches
  React.useEffect(() => {
    setAiInsightText('');
    setAiPrompt('');
  }, [activeReport]);

  return (
    <div className="space-y-6 select-none" id="reports-center-container">
      
      {/* 1. HEADER SECTION with Premium Industrial Theme */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-4 sm:p-6 shadow-sm backdrop-blur-md flex flex-col xl:flex-row xl:items-center justify-between gap-4" id="reports-header-card">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="text-[10px] uppercase font-black text-blue-600 tracking-widest bg-blue-50 px-2 py-0.5 rounded-md">Executive Analytics Hub</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-800 tracking-tight flex items-center gap-2.5">
            📊 รายงาน (Reports Center)
          </h1>
          <p className="text-stone-500 text-xs mt-1">
            ศูนย์กลางประมวลรายงานสำเร็จรูป อัตราหมวดงบ คลังพัสดุอะไหล่ และคำพยากรณ์แก้ไขค่าซ่อมจาก AI Advisor
          </p>
        </div>

        {/* Global Control Tools: Export and Print */}
        <div className="flex flex-wrap items-center gap-2" id="global-action-controls">
          <button
            onClick={handleExportActiveReport}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 hover:bg-emerald-100 bg-emerald-50 text-emerald-800 border border-emerald-300/40 rounded-xl font-bold text-xs shadow-sm cursor-pointer select-none transition-all active:scale-95"
            title="กดดาวน์โหลดรายงานหน้าปัจจุบันเป็นสกุลแผ่นงาน Excel ภาษาไทยสมบูรณ์"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>ส่งออก Excel</span>
          </button>
          
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 hover:bg-sky-100 bg-sky-50 text-sky-800 border border-sky-300/40 rounded-xl font-bold text-xs shadow-sm cursor-pointer select-none transition-all active:scale-95"
          >
            <Printer className="w-4 h-4 text-sky-600" />
            <span>พิมพ์รายงาน (Print)</span>
          </button>
        </div>
      </div>

      {/* 2. DYNAMIC SEARCH & ADVANCED DRILLDOWN FILTER BAR */}
      <div className="bg-stone-50/70 border border-stone-200/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4" id="advanced-reports-filter">
        <div className="flex items-center gap-2 pb-1 border-b border-stone-200/60">
          <Filter className="w-4 h-4 text-stone-600" />
          <h3 className="text-xs font-black text-stone-700 uppercase tracking-wider">เครื่องมือคัดกรองข้อมูลดิบของรายงาน</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Calendar Range Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-stone-500 uppercase">กรองตั้งแต่วันที่</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-stone-400 pointer-events-none" />
              <input 
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                className="w-full bg-white border border-stone-250 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-750 font-bold outline-none focus:border-amber-500 shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-stone-500 uppercase">ถึงขอบเขตวันที่</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-stone-400 pointer-events-none" />
              <input 
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                className="w-full bg-white border border-stone-250 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-750 font-bold outline-none focus:border-amber-500 shadow-sm"
              />
            </div>
          </div>

          {/* Location/Branch Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-stone-500 uppercase">เลือกสาขา / ไซต์หน้างาน</label>
            <select
              value={branchFilter}
              onChange={(e) => { setBranchFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-white border border-stone-250 cursor-pointer rounded-xl px-3 py-2 text-xs font-bold text-stone-750 outline-none focus:border-amber-500 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.03)]"
            >
              <option value="all">🌐 แสดงทั้งหมดทุกภาคส่วน</option>
              <option value="north">🏔️ เขตเหนือ (ชลประทานเฟรส 3/ลำพูน)</option>
              <option value="central">🏙️ เขตกลาง (ลุ่มน้ำยม/ไซต์ปากน้ำคันกั้น)</option>
              <option value="south">🏝️ เขตใต้ (อ่าวเคียงสุราษฎร์ธานี)</option>
            </select>
          </div>

          {/* Department Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-stone-500 uppercase">เลือกแผนก / ฝ่ายผู้ดูแล</label>
            <select
              value={deptFilter}
              onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-white border border-stone-250 cursor-pointer rounded-xl px-3 py-2 text-xs font-bold text-stone-750 outline-none focus:border-amber-500 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.03)]"
            >
              <option value="all">👥 ฝ่ายงานช่างบริหารร่วมทั้งหมด</option>
              <option value="maintenance">🛠️ ฝ่ายซ่อมบำรุงทางอุตสาหกรรม</option>
              <option value="civil">🚜 ฝ่ายโยธาขุดท่อตักคันดินหนัก</option>
              <option value="transport">🚚 ฝ่ายขนส่งโลจิสติกส์กำลังพล</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE REPORT MENU CARDS (Responsive Layout Grid) */}
      <div className="space-y-3">
        <h2 className="text-xs font-black text-stone-500 uppercase tracking-widest flex items-center gap-1.5">
          👉 กรุณาเลือกประเภทรายงานเพื่อแสดงแดชบอร์ดสถิติและตารางข้อมูลสำเร็จรูป (8 หมวดหลัก)
        </h2>
        
        {/* Mobile slide horizontal view / Desktop grid of report selector buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5" id="reports-categories-grid">
          {reportsList.map((item) => {
            const Icon = item.icon;
            const active = activeReport === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveReport(item.id);
                  setSearchTerm('');
                  setSortField('');
                  setCurrentPage(1);
                }}
                className={`p-3 rounded-2xl flex flex-col text-left justify-between h-24 border select-none transition-all duration-200 cursor-pointer shadow-sm active:scale-95 ${
                  active 
                    ? 'bg-stone-850 border-stone-800 text-amber-400 ring-2 ring-yellow-400/35' 
                    : 'bg-white border-stone-200/80 hover:bg-stone-50 hover:border-stone-300 text-stone-800'
                }`}
              >
                <div className="flex justify-between items-start w-full">
                  <div className={`p-1.5 rounded-xl border ${active ? 'bg-stone-750 border-stone-650 text-yellow-400' : 'bg-stone-10s0 border-black/5 text-stone-600'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {active && <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping"></span>}
                </div>
                <div>
                  <h3 className={`text-[11px] font-black truncate ${active ? 'text-amber-400':'text-stone-800'}`}>{item.title}</h3>
                  <p className="text-[9px] text-stone-400 truncate mt-0.5 font-medium">{item.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. CHOSEN ACTIVE REPORT DETAIL & STATS DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="report-view-panels">
        
        {/* LEFT COLUMN: ACTIVE REPORT PERFORMANCE STATS (8 Columns) */}
        <div className="lg:col-span-8 space-y-5 flex flex-col">
          
          {/* A. Dynamic Highlights Indicator Dashboards (4 Key Cards based on chosen tab) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* REPORT 1 INSIGHT CARD */}
            {activeReport === 'schedule' && (
              <>
                <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] text-stone-400 uppercase font-black">งานรวมทั้งหมด</span>
                  <div className="text-2xl font-black text-stone-800 font-mono mt-1">{scheduleData.total}</div>
                  <p className="text-[9.5px] text-stone-400 mt-1">ใบรับงานในเขตตรวจสอบ</p>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-200/50 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] text-emerald-600 uppercase font-black">งานดำเนินการเสร็จ</span>
                  <div className="text-2xl font-black text-emerald-700 font-mono mt-1">{scheduleData.completed}</div>
                  <p className="text-[9.5px] text-emerald-600 mt-1">ปิดแฟ้มสมบูรณ์ 100%</p>
                </div>
                <div className="bg-blue-50/50 border border-blue-200/50 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] text-blue-600 uppercase font-black">งานค้างในสัปดาห์</span>
                  <div className="text-2xl font-black text-blue-700 font-mono mt-1">{scheduleData.pending}</div>
                  <p className="text-[9.5px] text-blue-600 mt-1">กำลังทำงาน/รออะไหล่</p>
                </div>
                <div className="bg-rose-50/50 border border-rose-200/50 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] text-rose-600 uppercase font-black">งานเกินกำหนดเวลา</span>
                  <div className="text-2xl font-black text-rose-700 font-mono mt-1">{scheduleData.overdue}</div>
                  <p className="text-[9.5px] text-rose-600 mt-1">สถิติล่าช้าเปรียบทันที</p>
                </div>
              </>
            )}

            {/* REPORT 2 INSIGHT CARD */}
            {activeReport === 'submissions' && (
              <>
                <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] text-stone-400 uppercase font-black">งานที่ยื่นส่งมอบ</span>
                  <div className="text-2xl font-black text-stone-800 font-mono mt-1">{submissionsData.total}</div>
                  <p className="text-[9.5px] text-stone-400 mt-1">ใบงานแนบรูปพินหลักฐาน</p>
                </div>
                <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] text-amber-600 uppercase font-black">รอวิศวกรอนุมัติ</span>
                  <div className="text-2xl font-black text-amber-700 font-mono mt-1">{submissionsData.awaiting}</div>
                  <p className="text-[9.5px] text-amber-500 mt-1">เช็คสภาพใบงานก่อนปิด</p>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-200/50 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] text-emerald-600 uppercase font-black">ตรวจผ่านอนุมัติแล้ว</span>
                  <div className="text-2xl font-black text-emerald-700 font-mono mt-1">{submissionsData.approved}</div>
                  <p className="text-[9.5px] text-emerald-600 mt-1">ปิดระบบเรียบร้อยยอดเยี่ยม</p>
                </div>
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] text-stone-500 uppercase font-black">ไม่ผ่าน/ยกเลิกแผน</span>
                  <div className="text-2xl font-black text-stone-700 font-mono mt-1">{submissionsData.rejected}</div>
                  <p className="text-[9.5px] text-stone-400 mt-1">งานถูกตีกลับเนื่องจากงานไม่ผ่าน</p>
                </div>
              </>
            )}

            {/* REPORT 3 INSIGHT CARD */}
            {activeReport === 'repairs' && (
              <>
                <div className="bg-rose-50/50 border border-rose-200/50 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] text-rose-600 uppercase font-black">ยอดรวมเคสฉุกเฉิน</span>
                  <div className="text-2xl font-black text-rose-700 font-mono mt-1">{repairsData.total}</div>
                  <p className="text-[9.5px] text-rose-600 mt-1">รับแจ้งชำรุดระบบเกียร์/เครื่อง</p>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-200/50 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] text-emerald-600 uppercase font-black">ซ่อมเสร็จสมบูรณ์</span>
                  <div className="text-2xl font-black text-emerald-700 font-mono mt-1">{repairsData.completed}</div>
                  <p className="text-[9.5px] text-emerald-600 mt-1">แก้ไขส่งคืนพื้นที่หน้างานแล้ว</p>
                </div>
                <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] text-amber-600 uppercase font-black">ช่างหน้างานรื้อเครื่อง</span>
                  <div className="text-2xl font-black text-amber-700 font-mono mt-1">{repairsData.ongoing}</div>
                  <p className="text-[9.5px] text-amber-500 mt-1">อยู่ระหว่างดำเนินการชำแหละ</p>
                </div>
                <div className="bg-blue-50/50 border border-blue-200/50 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] text-blue-600 uppercase font-black">ประเมินรอพัสดุ/อะไหล่</span>
                  <div className="text-2xl font-black text-blue-700 font-mono mt-1">{repairsData.pendingParts}</div>
                  <p className="text-[9.5px] text-blue-500 mt-1">คัดรอบใบเสนองบสั่งซื้อ</p>
                </div>
              </>
            )}

            {/* REPORT 4 INSIGHT CARD */}
            {activeReport === 'inventory' && (
              <>
                <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] text-stone-400 uppercase font-black">พัสดุชิ้นส่วนในสต็อก</span>
                  <div className="text-2xl font-black text-stone-800 font-mono mt-1">{stocksData.totalCount}</div>
                  <p className="text-[9.5px] text-stone-400 mt-1">จำนวนรายการอะไหล่จดทะเบียน</p>
                </div>
                <div className="bg-amber-50/40 border border-amber-200/50 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] text-amber-700 uppercase font-black">มูลค่ารวมพัสดุสะสม</span>
                  <div className="text-lg font-black text-stone-800 font-mono mt-1.5">฿{stocksData.totalVal.toLocaleString()}</div>
                  <p className="text-[9.5px] text-amber-600 mt-0.5">ราคาประเมินคาร์โก้จัดซื้อ</p>
                </div>
                <div className="bg-orange-50/50 border border-orange-200/50 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] text-orange-600 uppercase font-black">อะไหล่ใกล้หมด (Low)</span>
                  <div className="text-2xl font-black text-orange-700 font-mono mt-1">{stocksData.lowStock}</div>
                  <p className="text-[9.5px] text-orange-600 mt-1">เหลือยอดน้อยกว่าจุดปลอดภัย</p>
                </div>
                <div className="bg-rose-50/40 border border-rose-300/55 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] text-rose-600 uppercase font-black font-extrabold">หมดสต็อกวิกฤต</span>
                  <div className="text-2xl font-black text-rose-700 font-mono mt-1">{stocksData.outOfStock}</div>
                  <p className="text-[9.5px] text-rose-600 mt-1">ต้องติดต่อซัพพลายเออร์ด่วน</p>
                </div>
              </>
            )}

            {/* REPORT 5 INSIGHT CARD */}
            {activeReport === 'machinery' && (
              <>
                <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] text-stone-400 uppercase font-black">เครื่องจักรหนักทั้งหมด</span>
                  <div className="text-2xl font-black text-stone-800 font-mono mt-1">{machineryData.total}</div>
                  <p className="text-[9.5px] text-stone-400 mt-1">รถอุตสาหกรรมชลประทาน</p>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-200/50 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] text-emerald-600 uppercase font-black">ใช้งานได้ปกติ (Active)</span>
                  <div className="text-2xl font-black text-emerald-700 font-mono mt-1">{machineryData.active}</div>
                  <p className="text-[9.5px] text-emerald-600 mt-1">พร้อมประประจำการทุกไซต์ขับ</p>
                </div>
                <div className="bg-rose-50/50 border border-rose-200/50 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] text-rose-600 uppercase font-black">กำลังจอดซ่อมบำรุง</span>
                  <div className="text-2xl font-black text-rose-700 font-mono mt-1">{machineryData.repairing}</div>
                  <p className="text-[9.5px] text-rose-600 mt-1">รถถอดชุดฟันเกียร์จอดอู่</p>
                </div>
                <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] text-amber-600 uppercase font-black">พบเตือนแจ้งถึงดิว PM</span>
                  <div className="text-2xl font-black text-amber-700 font-mono mt-1">{machineryData.maintenanceDue}</div>
                  <p className="text-[9.5px] text-amber-500 mt-1">ใกล้ครบกำหนดเปลี่ยนน้ำมันเครื่อง</p>
                </div>
              </>
            )}

            {/* REPORT 6 INSIGHT CARD */}
            {activeReport === 'refuels' && (
              <>
                <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] text-stone-400 uppercase font-black">คำขอรับสิทธิ์น้ำมัน</span>
                  <div className="text-2xl font-black text-stone-800 font-mono mt-1">{refuelsData.total}</div>
                  <p className="text-[9.5px] text-stone-400 mt-1">รวมใบเบิกจ่ายเชื้อเพลิงวิ่งงาน</p>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-200/50 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] text-emerald-600 uppercase font-black font-extrabold">สำเร็จ/เติมเรียบร้อย</span>
                  <div className="text-2xl font-black text-emerald-700 font-mono mt-1">{refuelsData.approved}</div>
                  <p className="text-[9.5px] text-emerald-600 mt-1">บันทึกเลขน้ำมันเกือบเสร็จสิ้น</p>
                </div>
                <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] text-amber-600 uppercase font-black">รอยื่นหลักฐานหัวจ่าย</span>
                  <div className="text-2xl font-black text-amber-700 font-mono mt-1">{refuelsData.pending}</div>
                  <p className="text-[9.5px] text-amber-550 mt-1">รอแอดมินตรวจสอบบิลค่าน้ำแข็ง</p>
                </div>
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] text-stone-500 uppercase font-black">สิทธิ์คำขอโดนยกเลิก</span>
                  <div className="text-2xl font-black text-stone-700 font-mono mt-1">{refuelsData.cancelled}</div>
                  <p className="text-[9.5px] text-stone-400 mt-1">คัดสิทธิ์กรอกถังสำรองส่วนตัว</p>
                </div>
              </>
            )}

            {/* REPORT 7 INSIGHT CARD */}
            {activeReport === 'expenses' && (
              <>
                <div className="bg-stone-850 text-[#fffdf2] border border-stone-850 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] text-amber-400 uppercase font-black">งบประมาณไตรมาสร่วม</span>
                  <div className="text-sm sm:text-base font-black font-mono tracking-tight mt-1">฿{expensesData.totalAllocated.toLocaleString()}</div>
                  <p className="text-[9.5px] text-[#fffdf2]/70 mt-1">กรอบงบเบิกสำหรับไซต์บริหาร</p>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] text-rose-600 uppercase font-black">ใช้ไปแล้วสะสม</span>
                  <div className="text-[#a40f0f] font-black text-sm sm:text-base font-mono tracking-tight mt-1">฿{expensesData.spent.toLocaleString()}</div>
                  <p className="text-[9.5px] text-rose-500 mt-1">คิดเป็นเปอร์เซ็นต์ {expensesData.spentPercent}%</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] text-emerald-600 uppercase font-black">คงเหลือนำจ่ายจ่าย</span>
                  <div className="text-emerald-700 font-black text-xs sm:text-sm font-mono tracking-tight mt-1.5">฿{expensesData.balance.toLocaleString()}</div>
                  <p className="text-[9.5px] text-emerald-600 mt-0.5">รวมเงินรันงานปกติได้ต่อเนื่อง</p>
                </div>
                <div className="bg-blue-50/50 border border-blue-200/50 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] text-blue-600 uppercase font-black">สถานะงบการเงิน</span>
                  <div className={`text-xs font-black px-2 py-0.5 mt-1 text-center rounded-lg inline-block ${expensesData.spentPercent > 85 ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-emerald-100 text-emerald-700'}`}>
                    {expensesData.spentPercent > 90 ? '🔥 งบล้นคุมด่วน' : expensesData.spentPercent > 70 ? '⚠️ เริ่มเฝ้าจำกัด' : '✅ คงที่ปลอดภัย'}
                  </div>
                  <p className="text-[9.5px] text-blue-500 mt-1">ประเมินผ่าน FlowWork CMMS</p>
                </div>
              </>
            )}

            {/* REPORT 8 INSIGHT CARD */}
            {activeReport === 'attendance' && (
              <>
                <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] text-stone-400 uppercase font-black">ยอดการลงเวลารวม</span>
                  <div className="text-2xl font-black text-stone-800 font-mono mt-1">{attendanceData.totalRecords}</div>
                  <p className="text-[9.5px] text-stone-400 mt-1">ประวัติสแกนพิกัด GPS กล้อง</p>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-200/50 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] text-emerald-600 uppercase font-black">มาตรงเวลาดีเด่น</span>
                  <div className="text-2xl font-black text-emerald-700 font-mono mt-1">{attendanceData.onTime}</div>
                  <p className="text-[9.5px] text-emerald-600 mt-1">เช็คอินก่อนเวลา 08:15 น.</p>
                </div>
                <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] text-amber-600 uppercase font-black">สแกนสายสะสม</span>
                  <div className="text-2xl font-black text-amber-700 font-mono mt-1">{attendanceData.late}</div>
                  <p className="text-[9.5px] text-amber-550 mt-1">ต้องหักชั่วโมงการใช้น้ำมันรถ</p>
                </div>
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] text-stone-400 uppercase font-black">สถิติวันขาดงาน</span>
                  <div className="text-2xl font-black text-stone-500 font-mono mt-1">{attendanceData.absent}</div>
                  <p className="text-[9.5px] text-stone-400 mt-1">พนักงานเวรลาป่วย/ขาดสแกน</p>
                </div>
              </>
            )}

          </div>

          {/* B. GRAPHICAL REPRESENTATION DIVISION (Recharts) */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-sm" id="report-charts-box">
            <h3 className="text-xs font-black text-stone-700 mb-4 flex items-center gap-1.5 uppercase">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              การแสดงผลข้อมูลแบบแผนภาพด่วน (Visual Charts)
            </h3>

            {/* Responsive Recharts component container */}
            <div className="h-64 sm:h-72 w-full">
              
              {/* Chart for Report 1 */}
              {activeReport === 'schedule' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scheduleData.teamChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="team" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} stroke="#cbd5e1" />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} stroke="#cbd5e1" />
                    <Tooltip contentStyle={{ fontSize: 11, background: '#1c1917', color: '#fff', borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar name="จำนวนงานซ่อม (เคส)" dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {/* Chart for Report 2 */}
              {activeReport === 'submissions' && (
                <div className="flex h-full flex-col sm:flex-row items-center justify-around">
                  <div className="w-full sm:w-1/2 h-full min-h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'รออนุมัติ (Awaiting)', value: submissionsData.awaiting },
                            { name: 'ยินยอมผ่านอนุมัติ (Approved)', value: submissionsData.approved },
                            { name: 'ตีกลับใบงาน (Rejected)', value: submissionsData.rejected },
                          ].filter(v => v.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          <Cell fill="#f97316" />
                          <Cell fill="#10b981" />
                          <Cell fill="#ef4444" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 text-xs font-bold text-stone-600">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-amber-500"></span>
                      <span>รอการอนุมัติ: {submissionsData.awaiting} ใบงาน</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-emerald-500"></span>
                      <span>ปิดงานสมบูรณ์: {submissionsData.approved} ใบงาน</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-rose-500"></span>
                      <span>งานที่ยกเลิก/ตีกลับ: {submissionsData.rejected} ใบงาน</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Chart for Report 3 */}
              {activeReport === 'repairs' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={repairsData.costChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="mach" tick={{ fontSize: 10, fill: '#64748b' }} stroke="#cbd5e1" />
                    <YAxis label={{ value: 'ค่าซ่อมบำรุงสะสม (บาท)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#64748b' } }} tick={{ fontSize: 10, fill: '#64748b' }} stroke="#cbd5e1" />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Bar name="งบซ่อมสั่งใช้สะสมตามเบอร์รถ" dataKey="amount" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {/* Chart for Report 4 */}
              {activeReport === 'inventory' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stocksData.list.slice(0, 7).map(item => ({
                    name: item.name.length > 10 ? item.name.substring(0, 8) + '...' : item.name,
                    quantity: item.quantity,
                    min: item.minQuantity
                  }))}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#475569' }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip wrapperStyle={{ fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar name="จำนวนชิ้นอะไหล่คงคลัง" dataKey="quantity" fill="#0ea5e9" />
                    <Bar name="จุดล่างสั่งซ่อม (Min Limit)" dataKey="min" fill="#f43f5e" />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {/* Chart for Report 5 */}
              {activeReport === 'machinery' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={machineryData.typeChart} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke="#cbd5e1" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: '#475569', fontWeight: 'bold' }} width={80} stroke="#cbd5e1" />
                    <Tooltip />
                    <Bar name="ปริมาณเครื่องจักร (คัน)" dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {/* Chart for Report 6 */}
              {activeReport === 'refuels' && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={refuelsData.litersChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                    <YAxis label={{ value: 'ปริมาณลิตรรวม', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" name="ปริมาณเติมดีเซล (ลิตร)" dataKey="liters" stroke="#f97316" strokeWidth={3} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {/* Chart for Report 7 */}
              {activeReport === 'expenses' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expensesData.rows}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#475569', fontWeight: 'bold' }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value) => `${Number(value).toLocaleString()} ฿`} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar name="งบประมาณโควตา" dataKey="limit" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar name="ใช้จ่ายงบประมาณจริง" dataKey="spent" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {/* Chart for Report 8 */}
              {activeReport === 'attendance' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceData.topChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#475569' }} />
                    <YAxis label={{ value: 'สถิติสแกนสะสม', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar name="จำนวนสแกนเข้าพิกัด" dataKey="checkins" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}

            </div>
          </div>

          {/* C. DRILLDOWN DATA TABLE (Filterable, Sortable, Paginated) */}
          <div className="bg-white border border-stone-200/80 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col justify-between" id="report-drilldown-table">
            
            {/* Table Header Controls */}
            <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/50">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-3 bg-amber-500 rounded-full"></span>
                <h3 className="text-xs font-black text-stone-750 uppercase tracking-widest">
                  ตารางรายงานเจาะลึกดิบ ({activeReportTableData.length} แถว)
                </h3>
              </div>

              {/* Dynamic search inside table */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="ค้นหาข้อมูลทุกคอลัมน์ในตาราง..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="bg-white border border-stone-250 rounded-lg pl-8 pr-3 py-1 text-[11px] text-stone-750 placeholder-stone-400 outline-none focus:border-amber-500 w-56 font-bold shadow-sm"
                />
              </div>
            </div>

            {/* Table Matrix Viewport */}
            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50/70 border-b border-stone-200/60 uppercase font-bold text-stone-500 text-[10px]">
                    
                    {/* Render headers based on chosen active sub-report */}
                    {activeReport === 'schedule' && (
                      <>
                        <th className="p-3 cursor-pointer select-none hover:bg-stone-100/80" onClick={() => requestSort('dueDate')}>กำหนดส่งมอบ {sortField === 'dueDate' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
                        <th className="p-3">เลขที่ใบงาน</th>
                        <th className="p-3 cursor-pointer select-none hover:bg-stone-100/80" onClick={() => requestSort('title')}>ชื่องานปฏิบัติการ {sortField === 'title' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
                        <th className="p-3 cursor-pointer select-none hover:bg-stone-100/80" onClick={() => requestSort('assignedTo')}>ช่างหลักดูแล {sortField === 'assignedTo' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
                        <th className="p-3 text-center">สถิติชั่วโมงทำ</th>
                        <th className="p-3 text-right">สถานะ</th>
                      </>
                    )}

                    {activeReport === 'submissions' && (
                      <>
                        <th className="p-3">เลขที่ใบงานหลัก</th>
                        <th className="p-3">ชั่วโมงงานส่ง</th>
                        <th className="p-3">ช่างผู้ปฏิบัติการ</th>
                        <th className="p-3">ผู้ตรวจรับ</th>
                        <th className="p-3 text-center">ภาพพยานหลักฐาน</th>
                        <th className="p-3 text-right">ผลการอนุมัติ</th>
                      </>
                    )}

                    {activeReport === 'repairs' && (
                      <>
                        <th className="p-3 cursor-pointer select-none hover:bg-stone-100/80" onClick={() => requestSort('timestamp')}>วันที่ยื่นแจ้ง {sortField === 'timestamp' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
                        <th className="p-3">เครื่องจักรที่ชำรุด</th>
                        <th className="p-3">อาการบกพร่อง</th>
                        <th className="p-3">วิศวกรวิเคราะห์</th>
                        <th className="p-3 text-center">ระดับวิกฤต</th>
                        <th className="p-3 text-right">สถานะทีม</th>
                      </>
                    )}

                    {activeReport === 'inventory' && (
                      <>
                        <th className="p-3 cursor-pointer select-none hover:bg-stone-100/80" onClick={() => requestSort('code')}>รหัสอะไหล่ {sortField === 'code' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
                        <th className="p-3 cursor-pointer select-none hover:bg-stone-100/80" onClick={() => requestSort('name')}>ชื่อพัสดุชลประทาน {sortField === 'name' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
                        <th className="p-3">หมวดประเภท</th>
                        <th className="p-3 text-center">ยอดคงเหลือ</th>
                        <th className="p-3 text-center">ราคาเฉลี่ยต่อหน่วย</th>
                        <th className="p-3 text-right">ที่ตั้งหิ้งวาง</th>
                      </>
                    )}

                    {activeReport === 'machinery' && (
                      <>
                        <th className="p-3 cursor-pointer select-none hover:bg-stone-100/80" onClick={() => requestSort('code')}>รหัสประจำเบอร์ {sortField === 'code' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
                        <th className="p-3 cursor-pointer select-none hover:bg-stone-100/80" onClick={() => requestSort('brand')}>แบรนด์ / รุ่น {sortField === 'brand' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
                        <th className="p-3 text-center">ชั่วโมงมาตรวัดสะสม</th>
                        <th className="p-3">ผู้ดูแลวิศวกร</th>
                        <th className="p-3 text-center">รหัสคลังซีเรียล</th>
                        <th className="p-3 text-right">สภาพคันดิน</th>
                      </>
                    )}

                    {activeReport === 'refuels' && (
                      <>
                        <th className="p-3">เลขที่เบิกสิทธิ์</th>
                        <th className="p-3 cursor-pointer select-none hover:bg-stone-100/80" onClick={() => requestSort('date')}>วันอนุมัติจ่าย {sortField === 'date' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
                        <th className="p-3">รถที่เติมน้ำมัน</th>
                        <th className="p-3">ผู้เบิกเติม</th>
                        <th className="p-3">ชนิดน้ำมัน / ปริมาตรจริง</th>
                        <th className="p-3 text-right">สถานะงวดเติม</th>
                      </>
                    )}

                    {activeReport === 'expenses font-mono' && (
                      <>
                        <th className="p-3">หมวดงบล่วงหน้า</th>
                        <th className="p-3 text-right">กรอบลิมิตงบสูงสุดอิง</th>
                        <th className="p-3 text-right">งบเบิกจ่ายจริงสะสม</th>
                        <th className="p-3 text-right">งบคงเหลือจ่ายได้</th>
                        <th className="p-3 text-center">สัดส่วนที่เบิก</th>
                      </>
                    )}
                    {/* Catch structural budget matching */}
                    {activeReport === 'expenses' && (
                      <>
                        <th className="p-3">วันที่ใช้จ่าย</th>
                        <th className="p-3">รายการบัญชีจัดซื้อ</th>
                        <th className="p-3">ประเภทหมวดหมู่</th>
                        <th className="p-3 text-right">มูลค่างบสะสม (฿)</th>
                        <th className="p-3">ไซต์ก่อสร้างเป้าหมาย</th>
                        <th className="p-3 text-right">ผู้บันทึกงวด</th>
                      </>
                    )}

                    {activeReport === 'attendance' && (
                      <>
                        <th className="p-3 cursor-pointer select-none hover:bg-stone-100/80" onClick={() => requestSort('employeeName')}>พนักงานช่างที่แสกน {sortField === 'employeeName' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}</th>
                        <th className="p-3">รายละเอียดตำแหน่ง</th>
                        <th className="p-3 text-center">จุดเช็คอินไซต์</th>
                        <th className="p-3 text-center">เวลาสแกนเข้า</th>
                        <th className="p-3 text-center">เวลาสแกนออก</th>
                        <th className="p-3 text-right">รวมชั่วโมงโอที</th>
                      </>
                    )}

                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {paginatedTableData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-stone-400 font-bold">
                        🚫 ค้นไม่พบรายการข้อมูลตรงกับเงื่อนไขตัวกรอง โปรดปรับเงื่อนไขวันที่หรือความด่วนหน้างาน
                      </td>
                    </tr>
                  ) : (
                    paginatedTableData.map((row: any, idx: number) => {
                      const isRowSelectedOnMap = activeReport === 'attendance' && selectedMapLogId === row.id;
                      return (
                        <tr 
                          key={row.id || idx} 
                          className={`transition-colors ${
                            isRowSelectedOnMap 
                              ? 'bg-violet-50/80 hover:bg-violet-100/50 shadow-inner border-l-4 border-violet-500' 
                              : 'hover:bg-amber-100/10'
                          }`}
                        >
                          
                          {/* REPORT 1 BODY CELLS */}
                          {activeReport === 'schedule' && (
                            <>
                              <td className="p-3 font-mono font-bold text-stone-600">{row.dueDate}</td>
                              <td className="p-3 font-mono text-stone-400 text-[10px] truncate max-w-[80px]" title={row.id}>{row.id.substring(0,8)}...</td>
                              <td className="p-3 font-black text-stone-800">{row.title}</td>
                              <td className="p-3 text-stone-600 font-bold">{row.assignedTo || 'ไม่ได้ระบุ'}</td>
                              <td className="p-3 text-center font-mono font-medium text-stone-500">{row.workTime || '08:00'}</td>
                              <td className="p-3 text-right">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                                  row.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                  row.status === 'in_progress' ? 'bg-amber-100 text-amber-800' :
                                  'bg-stone-100 text-stone-600'
                                }`}>
                                  {row.status === 'completed' ? 'สำเร็จ' : row.status === 'in_progress' ? 'กำลังดำเนินการ' : 'รอมอบหมาย'}
                                </span>
                              </td>
                            </>
                          )}

                          {/* REPORT 2 BODY CELLS */}
                          {activeReport === 'submissions' && (
                            <>
                              <td className="p-3 font-mono text-[11px] font-bold text-stone-600">{row.id.substring(0, 10)}...</td>
                              <td className="p-3 font-medium text-stone-500">{row.dueDate}</td>
                              <td className="p-3 font-black text-stone-800">{row.assignedTo}</td>
                              <td className="p-3 font-bold text-stone-600">{row.assignedBy || 'ผู้ประสานเขต'}</td>
                              <td className="p-3 text-center">
                                {row.photoUrls && row.photoUrls.length > 0 ? (
                                  <button
                                    onClick={() => setSelectedPhotoRow(row)}
                                    className="px-2 py-0.5 text-[9px] bg-sky-50 border border-sky-300/40 hover:bg-sky-100 text-sky-700 font-black rounded-lg cursor-pointer transition-all"
                                  >
                                    📸 ดูภาพแนบ ({row.photoUrls.length})
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-stone-450 italic">ไม่มีพยานรูปภาพ</span>
                                )}
                              </td>
                              <td className="p-3 text-right font-black">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                                  row.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700 animate-pulse'
                                }`}>
                                  {row.status === 'completed' ? 'อนุมัติเรียบร้อย' : 'รอตรวจสอบรับ'}
                                </span>
                              </td>
                            </>
                          )}

                          {/* REPORT 3 BODY CELLS */}
                          {activeReport === 'repairs' && (
                            <>
                              <td className="p-3 font-mono font-bold text-stone-500">{row.timestamp ? row.timestamp.substring(0,10) : '2026-05-28'}</td>
                              <td className="p-3 font-mono text-[11.5px] text-stone-700 font-extrabold">
                                {machinery.find(m => m.id === row.machineryId)?.code || 'รถส่วนกลางโยธา'}
                              </td>
                              <td className="p-3 font-black text-stone-800">{row.problemDesc}</td>
                              <td className="p-3 text-stone-600 font-bold">{row.assignedTech || 'พิจารณาหัวหน้างาน'}</td>
                              <td className="p-3 text-center">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black font-mono ${
                                  row.urgency === 'critical' ? 'bg-rose-500 text-white animate-pulse' :
                                  row.urgency === 'high' ? 'bg-orange-500 text-white' : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {row.urgency.toUpperCase()}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                                  row.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                  row.status === 'repairing' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {row.status === 'completed' ? 'ซ่อมสำเร็จ' : row.status === 'repairing' ? 'เกียร์ถอดฝา' : 'รอช่างเข้าตรวจสอบ'}
                                </span>
                              </td>
                            </>
                          )}

                          {/* REPORT 4 BODY CELLS */}
                          {activeReport === 'inventory' && (
                            <>
                              <td className="p-3 font-mono font-black text-stone-600">{row.code}</td>
                              <td className="p-3 font-bold text-stone-800">{row.name}</td>
                              <td className="p-3 text-stone-500 font-medium">{row.category}</td>
                              <td className="p-3 text-center font-mono">
                                <span className={`px-2 py-0.5 rounded font-black ${
                                  row.quantity === 0 ? 'bg-rose-100 text-rose-800 font-extrabold border border-rose-300' :
                                  row.quantity <= row.minQuantity ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-700'
                                }`}>
                                  {row.quantity} {row.unit}
                                </span>
                              </td>
                              <td className="p-3 text-center font-mono font-medium text-stone-600">
                                ฿{((stocksData.mockPrices[row.code.substring(0,3)] || 1500)).toLocaleString()}
                              </td>
                              <td className="p-3 text-right font-mono font-black text-stone-500">{row.location}</td>
                            </>
                          )}

                          {/* REPORT 5 BODY CELLS */}
                          {activeReport === 'machinery' && (
                            <>
                              <td className="p-3 font-mono font-black text-stone-700">{row.code}</td>
                              <td className="p-3 font-bold text-stone-800">{row.brand} - {row.model}</td>
                              <td className="p-3 text-center font-mono font-bold text-amber-700">{row.hourMeter.toLocaleString()} ชม.</td>
                              <td className="p-3 font-bold text-stone-600">{row.responsibleName}</td>
                              <td className="p-3 text-center font-mono text-stone-400">{row.serialNumber.substring(0,12)}...</td>
                              <td className="p-3 text-right">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                                  row.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                                  row.status === 'under_repair' ? 'bg-orange-100 text-orange-850' : 'bg-red-100 text-red-800'
                                }`}>
                                  {row.status === 'active' ? 'พร้อมขุดวิ่ง' : row.status === 'under_repair' ? 'จอดซ่อมปรับเกียร์' : 'ครบกำหนด PM'}
                                </span>
                              </td>
                            </>
                          )}

                          {/* REPORT 6 BODY CELLS */}
                          {activeReport === 'refuels' && (
                            <>
                              <td className="p-3 font-mono font-bold text-stone-400">{row.documentNo}</td>
                              <td className="p-3 font-mono font-medium text-stone-600">{row.date}</td>
                              <td className="p-3 font-mono text-[11.5px] text-stone-750 font-black">
                                {machinery.find(m => m.id === row.machineryId)?.code || 'รถขุดตักดินแม่ยม'}
                              </td>
                              <td className="p-3 font-black text-stone-800">{row.requesterName}</td>
                              <td className="p-3 font-medium text-amber-800">
                                <span className="font-mono">{row.actualLiters || row.requestedLiters} ลิตร</span> ({row.fuelType})
                              </td>
                              <td className="p-3 text-right">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                                  row.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800 animate-pulse'
                                }`}>
                                  {row.status === 'completed' ? 'เติมเสร็จจ่ายงบ' : 'ได้รับการอนุมัติ'}
                                </span>
                              </td>
                            </>
                          )}

                          {/* REPORT 7 BODY CELLS */}
                          {activeReport === 'expenses' && (
                            <>
                              <td className="p-3 font-mono text-stone-500 font-bold">{row.date}</td>
                              <td className="p-3 font-black text-stone-850">{row.description}</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 bg-stone-100 border rounded text-[10px] font-bold text-stone-600">
                                  {row.category.toUpperCase()}
                                </span>
                              </td>
                              <td className="p-3 text-right font-mono font-black text-teal-700">฿{row.amount.toLocaleString()}</td>
                              <td className="p-3 text-stone-600 font-bold">{row.siteLocation}</td>
                              <td className="p-3 text-right text-stone-400 font-semibold">{row.recordedBy}</td>
                            </>
                          )}

                          {/* REPORT 8 BODY CELLS */}
                          {activeReport === 'attendance' && (
                            <>
                              <td className="p-3 font-black text-stone-800">
                                <div className="flex items-center gap-2">
                                  <span>{row.employeeName}</span>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedMapLogId(row.id === selectedMapLogId ? null : row.id)}
                                    title="ดูพิกัดบนแผนที่"
                                    className={`p-1 rounded-lg transition-all border shrink-0 ${
                                      selectedMapLogId === row.id 
                                        ? 'bg-violet-600 border-violet-655 text-white shadow-sm' 
                                        : 'bg-stone-50 border-stone-200 text-stone-500 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200'
                                    }`}
                                  >
                                    <MapPin className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                              <td className="p-3 font-medium text-stone-500">{row.role || 'พนักงานช่างทั่วไป'}</td>
                              <td className="p-3 text-center text-stone-650 font-bold">{row.siteName || 'ลุ่มแม่น้ำงาม'}</td>
                              <td className="p-3 text-center font-mono text-stone-700">{row.checkInTime ? row.checkInTime.substring(11, 16) : '-'} น.</td>
                              <td className="p-3 text-center font-mono text-stone-400">{row.checkOutTime ? row.checkOutTime.substring(11, 16) : '-'} น.</td>
                              <td className="p-3 text-right font-mono font-bold text-violet-600">{row.isOvertime ? '3 ชม. (OT)' : '0'}</td>
                            </>
                          )}

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            <div className="p-4 border-t border-stone-100 bg-stone-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-stone-500">
              <span>
                แสดง {Math.min(activeReportTableData.length, (currentPage - 1) * itemsPerPage + 1)} ถึง {Math.min(activeReportTableData.length, currentPage * itemsPerPage)} จากทั้งหมด {activeReportTableData.length} รายการกรอง
              </span>
              
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 cursor-pointer disabled:opacity-50 select-none"
                >
                  ◀ ก่อนหน้า
                </button>
                <span className="px-3 font-mono font-black text-stone-850">
                  หน้า {currentPage} / {Math.max(1, totalPages)}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 cursor-pointer disabled:opacity-50 select-none"
                >
                  ถัดไป ▶
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: REVENUE ANALYTICS, MOCK MAP & REAL AI ADVISOR CARD (4 Columns) */}
        <div className="lg:col-span-4 space-y-5 flex flex-col">
          
          {/* A. MAP OR GEOLOCATION VISUAL PIEZ (Only rendering if tab is Attendance or Repairs) */}
          {(activeReport === 'attendance' || activeReport === 'repairs') && (
            <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-sm" id="geolocation-telemetry-panel">
              <div className="border-b border-stone-100 pb-2 mb-3">
                <h3 className="text-xs uppercase font-black text-stone-500 tracking-wider flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  {activeReport === 'attendance' ? 'แผนที่ภูมิศาสตร์จริงลงเวลากล้อง GPS' : 'พิกัดลงเวลาหน้างานก่อสร้าง (GPS Map Telemetry)'}
                </h3>
              </div>
              
              {activeReport === 'attendance' ? (
                <div className="space-y-2">
                  <AttendanceMap 
                    attendances={attendanceData.list} 
                    selectedLogId={selectedMapLogId}
                    onSelectLog={(id) => setSelectedMapLogId(id)}
                  />
                  {selectedMapLogId && (
                    <div className="flex items-center justify-between bg-stone-50 border border-stone-100 rounded-lg px-2 py-1 text-[10px]">
                      <span className="font-bold text-stone-600">
                        กำลังระบุโฟกัส: <span className="text-rose-600 font-extrabold">{attendanceData.list.find(a => a.id === selectedMapLogId)?.employeeName || 'พนักงาน'}</span>
                      </span>
                      <button 
                        type="button"
                        onClick={() => setSelectedMapLogId(null)}
                        className="text-stone-400 hover:text-stone-700 font-extrabold"
                      >
                        [ เลิกจับตา ]
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Clean Schematic Map Indicator Overlay */
                <div className="relative w-full h-44 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center">
                  <div className="absolute inset-0 bg-radial-[circle_at_center,_var(--tw-gradient-stops)] from-sky-100 via-stone-50 to-stone-150/40 opacity-70"></div>
                  <div className="absolute top-2 left-4 text-[9px] uppercase font-mono font-black text-stone-400">Lamphun/Yaw Basin 12km Matrix</div>
                  
                  {/* Simulated Pins */}
                  <div className="absolute top-1/3 left-1/4 flex flex-col items-center">
                    <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping absolute"></span>
                    <MapPin className="w-5 h-5 text-rose-600 relative z-10" />
                    <span className="bg-stone-850 text-[#fffdf2] font-black text-[7px] px-1.5 rounded-md shadow mt-0.5">ไซต์เหนือ 1</span>
                  </div>

                  <div className="absolute bottom-1/4 right-1/3 flex flex-col items-center">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    <span className="bg-stone-850 text-[#fffdf2] font-black text-[7px] px-1.5 rounded-md shadow mt-0.5">ลุ่มน้ำยม 3</span>
                  </div>

                  {/* Technical Coordinates display */}
                  <div className="absolute bottom-2 left-2 right-2 bg-stone-900/95 backdrop-blur border border-stone-800 text-amber-400 font-mono text-[8px] p-1.5 rounded-lg flex justify-between">
                    <span>GPS Lat: 18.5492"N</span>
                    <span>Lon: 99.0431"E</span>
                    <span>Accuracy: ±4.5m</span>
                  </div>
                </div>
              )}
              
              <p className="text-[9.5px] mt-2 text-stone-500 font-medium leading-normal">
                {activeReport === 'attendance'
                  ? '📌 แสดงข้อมูลและหมุกสแกนจริตผ่านพิกัดจีพีเอสจริง (เขียว = ลงเวลากดเข้าไซต์งาน, แดง = สแกนเก็บจบไซต์งาน) และภาพถ่ายพยานจากกล้อง'
                  : '📍 พิกัดระบุอัตโนมัติเมื่อกดลงชื่อตรวจรับงานผ่านกล้อง สัญญาณภาพถูกบันทึกในฐานข้อมูลคลาวด์ ซิงค์ความแม่นยำสูง'
                }
              </p>
            </div>
          )}

          {/* B. EXECUTIVE AUTOMATED AI ADVISOR */}
          <div className="bg-stone-850 text-stone-100 rounded-2xl p-5 shadow-md flex flex-col justify-between" id="ai-advisor-panel">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                      AI COST ADVISOR
                      <span className="bg-amber-400 text-stone-900 font-black text-[7.5px] px-1.5 py-0.5 rounded-full leading-none">AUTO</span>
                    </h3>
                    <p className="text-[9px] text-stone-400 font-medium">ปัญญาประดิษฐ์ตรวจรับค่าเสียหาย</p>
                  </div>
                </div>
                <span className="text-[8.5px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-black">● ใช้งานได้</span>
              </div>

              {/* Live dynamic systemic insights */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-black text-stone-250 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  {currentAiInsight.title}
                </h4>
                <div className="space-y-2">
                  {currentAiInsight.bullets.map((bullet, idx) => (
                    <div key={idx} className="flex gap-2 text-[10.5px] leading-relaxed text-stone-300">
                      <span className="text-amber-400 shrink-0 select-none">•</span>
                      <p>{bullet}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* interactive chatbot simulation block */}
              <form onSubmit={handleAskAdvisor} className="border-t border-stone-800 pt-4 mt-3" id="ai-advisor-chat-form">
                <p className="text-[10px] text-stone-400 font-bold mb-2">💡 ถามปัญญาวิเคราะห์งบหรือชั่วโมงคลังอะไหล่เฉพาะรุ่น :</p>
                
                {aiInsightText && (
                  <div className="mb-3.5 p-3 bg-stone-900 border border-stone-800 text-stone-200 text-[10.5px] leading-relaxed rounded-xl font-bold whitespace-pre-line">
                    {aiInsightText}
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="เช่น: 'วิธีเซฟคอส', 'ชั่วโมงอายุงานบ่าวาล์ว', 'ทำอย่างไรป้องกันคนมาสาย'..."
                    className="flex-1 bg-stone-900 border border-stone-800 text-stone-200 text-[11px] placeholder-stone-500 px-3 py-2 rounded-xl outline-none focus:border-amber-400 font-medium"
                  />
                  <button
                    type="submit"
                    disabled={isLoadingAi}
                    className="px-3.5 py-2 bg-amber-400 text-stone-950 hover:bg-amber-300 disabled:opacity-50 rounded-xl text-xs font-black select-none pointer-events-auto cursor-pointer"
                  >
                    {isLoadingAi ? '...' : 'คำนวณ'}
                  </button>
                </div>
              </form>
            </div>
            
            <div className="pt-4 mt-5 border-t border-stone-800/80 text-[8.5px] text-stone-500 font-bold text-center">
              FlowWork Brain CMMS AI Engine v2.4a
            </div>
          </div>

        </div>

      </div>

      {/* 5. IMAGE EVIDENCE MODAL ATTACHMENT VIEW */}
      {selectedPhotoRow && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-sans select-none" id="evidence-modal-overlay">
          <div className="bg-white border border-stone-300 max-w-lg w-full rounded-2xl shadow-xl overflow-hidden flex flex-col justify-between">
            <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
              <h3 className="text-xs font-black text-stone-800 uppercase tracking-widest flex items-center gap-1.5">
                📸 รายละเอียดหลักฐานรูปภาพใบงานซ่อมสำเร็จ
              </h3>
              <button
                onClick={() => setSelectedPhotoRow(null)}
                className="p-1 rounded-lg hover:bg-stone-200 text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-xs font-bold text-stone-650 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-stone-400">ใบงาน ID:</span> <span className="font-mono text-stone-800 font-black">{selectedPhotoRow.id.substring(0, 10)}...</span>
                </div>
                <div>
                  <span className="text-stone-400">ช่างซ่อม:</span> <span className="text-stone-800 font-black">{selectedPhotoRow.assignedTo}</span>
                </div>
                <div>
                  <span className="text-stone-400">ตารางวันที่:</span> <span className="text-stone-800 font-black">{selectedPhotoRow.dueDate}</span>
                </div>
                <div>
                  <span className="text-stone-400">เวลาซ่อม:</span> <span className="font-mono text-stone-850 font-black">{selectedPhotoRow.workTime || '08:00'} น.</span>
                </div>
              </div>

              {/* Render structural layout representation for repair images */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-rose-600 block text-center uppercase">1. ข้อมูลก่อนเข้าซ่อม</span>
                  <div className="relative aspect-square bg-[#fffdf2] border border-stone-200 rounded-xl overflow-hidden shadow-sm flex items-center justify-center">
                    {/* Fallback mock graphic to simulate high contrast repair status */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#fff3cd] to-stone-50 flex flex-col items-center justify-center text-center p-2">
                      <span className="text-[9.5px] font-bold text-stone-700">กระบอกรั่ว</span>
                      <span className="text-[8px] font-mono font-medium text-amber-700 mt-1">CAT320-01</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black text-purple-600 block text-center uppercase">2. ระหว่างซ่อม</span>
                  <div className="relative aspect-square bg-[#fffdf2] border border-stone-200 rounded-xl overflow-hidden shadow-sm flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#e2d9f3] to-stone-50 flex flex-col items-center justify-center text-center p-2">
                      <span className="text-[9.5px] font-bold text-stone-700">อัดซีลใหม่</span>
                      <span className="text-[8px] text-purple-700 mt-1">ช่างโยธาหลัก</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black text-emerald-600 block text-center uppercase">3. ตรวจเช็คเสร็จ</span>
                  <div className="relative aspect-square bg-[#fffdf2] border border-stone-200 rounded-xl overflow-hidden shadow-sm flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#d1e7dd] to-stone-50 flex flex-col items-center justify-center text-center p-2">
                      <span className="text-[9.5px] font-bold text-stone-700">ทดสอบผ่าน</span>
                      <span className="text-[8px] text-emerald-700 mt-1">แรงดันปกติ</span>
                    </div>
                  </div>
                </div>

              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200/50">
                <p className="text-[10px] text-amber-800 leading-normal font-bold">
                  ⚠️ ผู้ประสานงานเขตชลประทานได้ทำการตรวจเช็คด้วยตนเองและยืนยันว่า การบำรุงรักษาได้รับการลงนามสัญลักษณ์อิเล็กทรอนิกส์ในระบบสำเร็จแล้ว
                </p>
              </div>
            </div>

            <div className="p-3 border-t border-stone-100 bg-stone-50/70 text-right">
              <button
                onClick={() => setSelectedPhotoRow(null)}
                className="px-4 py-1.5 bg-stone-850 hover:bg-stone-800 text-[#fffdf2] rounded-xl text-xs font-bold cursor-pointer select-none"
              >
                ปิดหน้าต่างหลัก
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
