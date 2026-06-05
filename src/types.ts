/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MachineryType = 
  | 'backhoe' // รถแบคโฮ
  | 'grader' // รถเกรด
  | 'roller' // รถบด
  | 'tenwheeler' // รถสิบล้อ
  | 'watertruck' // รถน้ำ
  | 'crane' // รถเครน
  | 'loader' // รถตัก
  | 'forklift'; // รถโฟล์คลิฟท์

export interface HeavyMachinery {
  id: string;
  code: string; // รหัสเครื่องจักร
  type: MachineryType;
  brand: string;
  model: string;
  plateNumber: string;
  serialNumber: string;
  hourMeter: number;
  status: 'active' | 'under_repair' | 'maintenance_due' | 'inactive';
  responsibleName: string;
  qrCodeUrl: string;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'pending' | 'in_progress' | 'awaiting_approval' | 'completed' | 'cancelled';

export interface Comment {
  id: string;
  userName: string;
  userRole: string;
  text: string;
  timestamp: string;
}

export interface WorkScheduleTask {
  id: string;
  title: string;
  description: string;
  machineryId?: string;
  assignedTo: string;
  priority: TaskPriority;
  dueDate: string;
  gpsLocName?: string;
  status: TaskStatus;
  timeline: { status: TaskStatus; timestamp: string; note: string }[];
  comments: Comment[];
  photoUrls: string[];
  locations?: string[];
  supervisors?: string[];
  machineries?: string[];
  employees?: string[];
  assignedBy?: string;
  workTime?: string;
}

export interface StockItem {
  id: string;
  code: string;
  name: string;
  category: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  location: string;
  qrCodeText: string;
}

export interface InventoryIssuance {
  id: string;
  documentNo: string;
  itemId: string;
  itemName: string;
  qtyRequested: number;
  qtyApproved: number;
  department: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  date: string;
}

export interface WorkAttendance {
  id: string;
  employeeName: string;
  checkIn: string; // HH:MM
  checkOut?: string; // HH:MM
  date: string;
  gpsLocation: string;
  photoUrl: string;
  status: 'present' | 'absent' | 'leave' | 'late';
  otHours: number;
}

export interface AttendanceLog {
  id: string;
  employeeName: string;
  role: string;
  checkInTime: string;
  checkOutTime?: string;
  workDate?: string; // YYYY-MM-DD
  siteName: string;
  status?: string; // 'present' | 'absent' | 'leave' | 'late' | 'wfh'
  gpsLocIn: string;
  gpsLocOut?: string;
  photoUrl: string;
  photoUrlOut?: string;
  isOvertime: boolean;
  otHours?: number;
  
  // Enhanced attributes for Work-From-Home (WFH), retro-adjustments, and approvals
  attendanceType?: 'normal' | 'retro';
  approvalStatus?: 'pending_approval' | 'approved' | 'rejected';
  approvedBy?: string;
  reason?: string;
  
  // Enhanced attributes for OT Requests
  otRequest?: {
    isRequested: boolean;
    hours: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    approvedBy?: string;
  };
}

export interface RepairRequest {
  id: string;
  machineryId: string;
  reporterName: string;
  problemDesc: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  gpsLoc: string;
  status: 'reported' | 'approved' | 'assigned' | 'repairing' | 'completed';
  assignedTech?: string;
  hoursMeterRecorded: number;
  photoUrl: string;
  videoUrlMock?: string;
  checklist: { task: string; done: boolean }[];
  signature?: string; // Base64 signature
  beforePhoto?: string;
  afterPhoto?: string;
  timestamp: string;
}

// PM Schedules
export interface PreventiveMaintenance {
  id: string;
  machineryId: string;
  title: string;
  cycleDays?: number;
  cycleHours?: number;
  lastPmDate?: string;
  lastPmHour?: number;
  nextPmDueDate?: string;
  nextPmDueHour?: number;
  status: 'upcoming' | 'overdue' | 'completed';
}

export interface RefuelStatus {
  id: string;
  documentNo: string;
  date: string;
  machineryId: string;
  plateNumber: string;
  fuelType: 'diesel' | 'gasoline' | 'premium_diesel';
  requestedLiters: number;
  pricePerLiter: number;
  siteLocation: string;
  requesterName: string;
  mileagePhoto: string;
  hourMeterValue: number;
  status: 'pending_approval' | 'approved_to_fill' | 'completed' | 'cancelled';
  // Fueling Execution Data
  actualLiters?: number;
  actualPrice?: number;
  gasStationName?: string;
  receiptPhotoUrl?: string;
  gpsLocFilled?: string;
  operatorName?: string;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  category: 'fuel' | 'repair' | 'labor' | 'parts' | 'transport' | 'rent' | 'other';
  description: string;
  amount: number;
  receiptPhoto?: string;
  siteLocation: string;
  recordedBy: string;
  machineryId?: string;
}

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  module: string;
  timestamp: string;
  description: string;
}

export interface GoogleDriveUpload {
  id: string;
  fileName: string;
  fileUrl: string;
  driveFileId: string;
  uploadDate: string;
  uploadBy: string;
  module: string;
  documentNo: string;
}

export interface LineSettingItem {
  id?: string;
  moduleName: 'attendance' | 'operations' | 'fuel' | 'fallback' | 'test';
  channelAccessToken: string;
  groupId: string;
  createdAt?: string;
}


