/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HeavyMachinery, WorkScheduleTask, StockItem, InventoryIssuance, WorkAttendance, AttendanceLog, RepairRequest, PreventiveMaintenance, RefuelStatus, ExpenseRecord, AuditLog } from './types';

export const INITIAL_MACHINERY: HeavyMachinery[] = [
  {
    id: 'mach-01',
    code: 'EXC-CAT320-01',
    type: 'backhoe',
    brand: 'Caterpillar',
    model: 'CAT 320D3',
    plateNumber: 'ตค-1204 เชียงใหม่',
    serialNumber: 'CAT0320D3K89201',
    hourMeter: 4850,
    status: 'active',
    responsibleName: 'ช่างศักดิ์ชาย เรืองเดช',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=EXC-CAT320-01'
  },
  {
    id: 'mach-02',
    code: 'GRD-KOM511-01',
    type: 'grader',
    brand: 'Komatsu',
    model: 'GD511A-1',
    plateNumber: '82-4587 ลำปาง',
    serialNumber: 'KOMGD511A990142',
    hourMeter: 7210,
    status: 'under_repair',
    responsibleName: 'ช่างวิชัย แก้วประเสริฐ',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=GRD-KOM511-01'
  },
  {
    id: 'mach-03',
    code: 'ROL-SAK120-02',
    type: 'roller',
    brand: 'Sakai',
    model: 'SV512TF',
    plateNumber: '81-0023 ตาก',
    serialNumber: 'SAKSV512002341',
    hourMeter: 3120,
    status: 'maintenance_due',
    responsibleName: 'ช่างนพดล แสงทอง',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ROL-SAK120-02'
  },
  {
    id: 'mach-04',
    code: 'TRK-ISU10W-01',
    type: 'tenwheeler',
    brand: 'Isuzu',
    model: 'DECA 360',
    plateNumber: '83-9912 เชียงราย',
    serialNumber: 'ISUDECA360X88910',
    hourMeter: 124500, // สิบล้อวัดโลเมตร
    status: 'active',
    responsibleName: 'นายพงษ์ศักดิ์ ดีพร้อม',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TRK-ISU10W-01'
  },
  {
    id: 'mach-05',
    code: 'WTR-HINFL-01',
    type: 'watertruck',
    brand: 'Hino',
    model: 'FL 260',
    plateNumber: '82-1549 เชียงใหม่',
    serialNumber: 'HINOFL260M11202',
    hourMeter: 8400,
    status: 'active',
    responsibleName: 'นายมานะ เจริญพานิช',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=WTR-HINFL-01'
  },
  {
    id: 'mach-06',
    code: 'CRN-KAD050-01',
    type: 'crane',
    brand: 'Kato',
    model: 'CR-500',
    plateNumber: '80-1122 พะเยา',
    serialNumber: 'KATO500C3341',
    hourMeter: 5120,
    status: 'active',
    responsibleName: 'ช่างเกรียงไกร ชำนาญยนต์',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=CRN-KAD050-01'
  },
  {
    id: 'mach-07',
    code: 'LDR-VOL120-01',
    type: 'loader',
    brand: 'Volvo',
    model: 'L120H',
    plateNumber: '81-5460 เชียงใหม่',
    serialNumber: 'VOLL120H99238',
    hourMeter: 4150,
    status: 'active',
    responsibleName: 'นายสุรสิทธิ์ มีชัย',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=LDR-VOL120-01'
  },
  {
    id: 'mach-08',
    code: 'FKL-TOY025-01',
    type: 'forklift',
    brand: 'Toyota',
    model: '8FD25',
    plateNumber: 'ชร-2351 เชียงใหม่',
    serialNumber: 'TOY8FD2511204',
    hourMeter: 2310,
    status: 'inactive',
    responsibleName: 'นายอาสา สุขสำราญ',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=FKL-TOY025-01'
  }
];

export const INITIAL_TASKS: WorkScheduleTask[] = [
  {
    id: 'tsk-101',
    title: 'ขุดลอกคลองส่งน้ำจุดเหนือหมู่บ้าน',
    description: 'งานปรับเคลียร์หน้าดินและขุดลอกแนวฝั่งดินสไลด์ปิดกั้นทางน้ำเพื่อป้องกันอุทกภัย',
    machineryId: 'mach-01',
    assignedTo: 'ช่างศักดิ์ชาย เรืองเดช',
    priority: 'high',
    dueDate: '2026-05-30',
    gpsLocName: 'ไซต์งานก่อสร้างคลอง ชลประทานเฟส 3',
    status: 'in_progress',
    timeline: [
      { status: 'pending', timestamp: '2026-05-27 08:30', note: 'รับแจ้งงานจากหัวหน้าควบคุมไซต์' },
      { status: 'in_progress', timestamp: '2026-05-28 09:15', note: 'กำลังตักเปิดหน้าดิน หน้างานพบตอไม้ขนาดใหญ่' }
    ],
    comments: [
      {
        id: 'c-01',
        userName: 'สมชาย คอนโทรล',
        userRole: 'Manager',
        text: 'เน้นย้ำความปลอดภัยใกล้เสาไฟฟ้าแรงสูงด้วยครับ',
        timestamp: '2026-05-28 10:00'
      }
    ],
    photoUrls: [
      'https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&q=80&w=400'
    ]
  },
  {
    id: 'tsk-102',
    title: 'บดอัดถนนดินลูกรัง ทางเข้าไซต์ B',
    description: 'เทลูกรังและเกรดปรับสภาพพร้อมบดอัดถนนเพื่อรองรับรถพ่วง 10 ล้อขนวัสดุเข้าคลัง',
    machineryId: 'mach-03',
    assignedTo: 'ช่างนพดล แสงทอง',
    priority: 'medium',
    dueDate: '2026-06-02',
    gpsLocName: 'หน้างานขยายทางเชื่อม อ.แม่ริม',
    status: 'pending',
    timeline: [
      { status: 'pending', timestamp: '2026-05-28 08:00', note: 'แจกจ่ายใบงานเตรียมเครื่องจักร' }
    ],
    comments: [],
    photoUrls: []
  },
  {
    id: 'tsk-103',
    title: 'ตรวจเช็คตามระยะระยะ 5,000 ชม.',
    description: 'เปลี่ยนถ่ายน้ำมันเครื่อง แผ่นกรองไฮดรอลิก ตรวจรั่วซึมกระบอกสูบหลัก',
    machineryId: 'mach-06',
    assignedTo: 'ช่างเกรียงไกร ชำนาญยนต์',
    priority: 'high',
    dueDate: '2026-05-29',
    gpsLocName: 'โรงซ่อมบำรุงใหญ่ ศูนย์เชียงใหม่',
    status: 'awaiting_approval',
    timeline: [
      { status: 'pending', timestamp: '2026-05-26 13:00', note: 'แจ้งเตือนอัตโนมัติเนื่องจากครบกำหนดชั่วโมงทำงานเครื่อง' },
      { status: 'in_progress', timestamp: '2026-05-27 09:00', note: 'เปลี่ยนอะไหล่เรียบร้อย อยู่ระหว่างรอหัวหน้าตรวจสอบเพื่ออนุมัติปิดงาน' }
    ],
    comments: [
      {
        id: 'c-02',
        userName: 'เกรียงไกร ชำนาญยนต์',
        userRole: 'Technician',
        text: 'ตรวจหน้าวาล์วพบล้าเล็กน้อย ปล่อยผ่านรอบนี้ได้ แต่รอบถัดไปแนะนำควรยกชุดซีลใหม่ครับ',
        timestamp: '2026-05-27 15:30'
      }
    ],
    photoUrls: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=400'
    ]
  }
];

export const INITIAL_STOCK: StockItem[] = [
  {
    id: 'item-01',
    code: 'FIL-AIR-CAT320',
    name: 'ไส้กรองอากาศ CAT 320D',
    category: 'กรองอากาศหยาบ/ละเอียด',
    quantity: 12,
    minQuantity: 5,
    unit: 'ลูก',
    location: 'หิ้ง A-4 คลังใหญ่',
    qrCodeText: 'FIL-AIR-CAT320'
  },
  {
    id: 'item-02',
    code: 'OIL-HYD-68',
    name: 'น้ำมันไฮดรอลิก Shell Tellus S2 V68 (20L)',
    category: 'น้ำมันหล่อลื่น',
    quantity: 3,
    minQuantity: 4, // สินค้าคลังใกล้หมด! (3 < 4)
    unit: 'ถัง',
    location: 'ลานน้ำมันคลังย่อย 2',
    qrCodeText: 'OIL-HYD-68'
  },
  {
    id: 'item-03',
    code: 'GSK-CYL-EXC',
    name: 'ปะเก็นฝาสูบแกนเกรด Komatsu',
    category: 'ยางและปะเก็นกันรั่ว',
    quantity: 8,
    minQuantity: 2,
    unit: 'ชุด',
    location: 'ตู้คลังอะไหล่ B-2',
    qrCodeText: 'GSK-CYL-EXC'
  },
  {
    id: 'item-04',
    code: 'BEL-CON-10W',
    name: 'สายพานพัดลม Isuzu Deca 360',
    category: 'สายพานและแบริ่ง',
    quantity: 1,
    minQuantity: 3, // เกือบหมด
    unit: 'เส้น',
    location: 'ตู้เก็บสายพาน C-1',
    qrCodeText: 'BEL-CON-10W'
  }
];

export const INITIAL_ISSUANCES: InventoryIssuance[] = [
  {
    id: 'iss-201',
    documentNo: 'REQ-202605-0015',
    itemId: 'item-01',
    itemName: 'ไส้กรองอากาศ CAT 320D',
    qtyRequested: 2,
    qtyApproved: 2,
    department: 'แผนกซ่อมบำรุงเครื่องจักรหนัก',
    status: 'approved',
    requestedBy: 'ช่างศักดิ์ชาย เรืองเดช',
    date: '2026-05-27'
  },
  {
    id: 'iss-202',
    documentNo: 'REQ-202605-0016',
    itemId: 'item-02',
    itemName: 'น้ำมันไฮดรอลิก Shell Tellus S2 V68 (20L)',
    qtyRequested: 2,
    qtyApproved: 0,
    department: 'แผนกบดอัดทางหลวง',
    status: 'pending',
    requestedBy: 'ช่างนพดล แสงทอง',
    date: '2026-05-28'
  }
];

export const INITIAL_ATTENDANCE: WorkAttendance[] = [
  {
    id: 'att-1',
    employeeName: 'ช่างศักดิ์ชาย เรืองเดช',
    checkIn: '07:45',
    checkOut: '17:15',
    date: '2026-05-28',
    gpsLocation: '18.7904, 98.9841 (หน้างานคลองส่งน้ำพืชสวนโลก)',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    status: 'present',
    otHours: 1.5
  },
  {
    id: 'att-2',
    employeeName: 'ช่างวิชัย แก้วประเสริฐ',
    checkIn: '07:55',
    date: '2026-05-28',
    gpsLocation: '18.8021, 98.9912 (อู่รถซ่อมใหญ่สารภี)',
    photoUrl: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&q=80&w=150',
    status: 'late',
    otHours: 0
  },
  {
    id: 'att-3',
    employeeName: 'ช่างนพดล แสงทอง',
    checkIn: '08:00',
    date: '2026-05-28',
    gpsLocation: '18.8955, 99.0123 (หน้างานแม่ริม)',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    status: 'present',
    otHours: 0
  }
];

export const INITIAL_ATTENDANCE_LOGS: AttendanceLog[] = [
  {
    id: 'att-l1',
    employeeName: 'ช่างศักดิ์ชาย เรืองเดช',
    role: 'วิศวกรขุดเจาะชลประทานชั้น 1',
    checkInTime: '07:45',
    checkOutTime: '17:15',
    siteName: 'ไซต์งานก่อสร้างคลอง ชลประทานเฟส 3',
    isOvertime: true,
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
    gpsLocIn: '18.7904, 98.9841 (กล้อง Face ID ผ่านแคมป์ B)',
    gpsLocOut: '18.7915, 98.9860'
  },
  {
    id: 'att-l2',
    employeeName: 'ช่างวิชัย แก้วประเสริฐ',
    role: 'หัวหน้าช่างซ่อมบำรุงล้อขับเคลื่อน',
    checkInTime: '07:58',
    siteName: 'โรงซ่อมบำรุงใหญ่ ศูนย์เชียงใหม่',
    isOvertime: false,
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    gpsLocIn: '18.8021, 98.9912 (อู่รถซ่อมใหญ่สารภี)'
  },
  {
    id: 'att-l3',
    employeeName: 'ช่างนพดล แสงทอง',
    role: 'ช่างประจำคันบดลูกกลิ้งใหญ่',
    checkInTime: '08:00',
    siteName: 'หน้างานขยายทางเชื่อม อ.แม่ริม',
    isOvertime: false,
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    gpsLocIn: '18.8955, 99.0123 (หน้างานแม่ริม)'
  }
];

export const INITIAL_REPAIRS: RepairRequest[] = [
  {
    id: 'rep-501',
    machineryId: 'mach-02',
    reporterName: 'นายพงษ์ศักดิ์ ดีพร้อม',
    problemDesc: 'ควันดำไอเสียหนาจัด กำลังเครื่องตกอย่างเห็นได้ชัดเมื่อเกรดปาดหน้าดินแข็งหนา มีเสียงครางวาล์วดังร่วม',
    urgency: 'high',
    gpsLoc: '18.8904, 99.0201 (พิกัดหน้างานทางหลวงแม่ริม)',
    status: 'assigned',
    assignedTech: 'ช่างวิชัย แก้วประเสริฐ',
    hoursMeterRecorded: 7210,
    photoUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=300',
    videoUrlMock: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
    checklist: [
      { task: 'ตรวจเช็คแรงดันหัวฉีดเชื้อเพลิง', done: false },
      { task: 'ถอดล้างเขม่าท่อร่วมไอดี', done: false },
      { task: 'เปลี่ยนแผ่นกรองโซล่าเสริม', done: true },
      { task: 'วัดกำลังอัดแต่ละสูบในเครื่องหลัก', done: false }
    ],
    timestamp: '2026-05-27 14:10'
  },
  {
    id: 'rep-502',
    machineryId: 'mach-03',
    reporterName: 'ช่างนพดล แสงทอง',
    problemDesc: 'ล้อขย่มกระบอกสั่นลูกปืนขัดสีรอบต่ำ สั่นผิดปกติเสี่ยงซีลประคองแตก',
    urgency: 'critical',
    gpsLoc: '18.7845, 98.9877 (ไซต์ขยายงานสารภี)',
    status: 'repairing',
    assignedTech: 'ช่างเกรียงไกร ชำนาญยนต์',
    hoursMeterRecorded: 3120,
    photoUrl: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&q=80&w=300',
    checklist: [
      { task: 'ถอดฝาครอบเพลาขับปั๊มลูกสั่น', done: true },
      { task: 'เปลี่ยนตลับลูกปืนแคนตัสคลาส 3', done: true },
      { task: 'ปรับแกนตั้งศูนย์ล้อบดขับเคลื่อนร่วม', done: false }
    ],
    timestamp: '2026-05-28 07:45'
  }
];

export const INITIAL_PM: PreventiveMaintenance[] = [
  {
    id: 'pm-301',
    machineryId: 'mach-01',
    title: 'PM เปลี่ยนถ่ายน้ำมันไฮดรอลิกชุดใหญ่ (5,000 ชม.)',
    cycleHours: 5000,
    lastPmHour: 0,
    lastPmDate: '2024-05-10',
    nextPmDueHour: 5000,
    nextPmDueDate: '2026-06-15',
    status: 'upcoming'
  },
  {
    id: 'pm-302',
    machineryId: 'mach-03',
    title: 'PM ตรวจวิเคราะห์หน้าฟันกระเกดเหล็กขอบบด (รอบ 180 วัน)',
    cycleDays: 180,
    lastPmDate: '2025-11-15',
    nextPmDueDate: '2026-05-14', // ล่วงเลยกำหนดแล้ว! (Overdue)
    status: 'overdue'
  }
];

export const INITIAL_REFUELS: RefuelStatus[] = [
  {
    id: 'f-1',
    documentNo: 'FL-20260528-0901',
    date: '2026-05-28 08:30',
    machineryId: 'mach-01',
    plateNumber: 'ตค-1204 เชียงใหม่',
    fuelType: 'diesel',
    requestedLiters: 120,
    pricePerLiter: 33.5,
    siteLocation: 'ไซต์ก่อสร้าง ชลประทานเฟส 3',
    requesterName: 'นายสุรสิทธิ์ มีชัย',
    mileagePhoto: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=300',
    hourMeterValue: 4850,
    status: 'pending_approval'
  },
  {
    id: 'f-2',
    documentNo: 'FL-20260527-0842',
    date: '2026-05-27 11:20',
    machineryId: 'mach-04',
    plateNumber: '83-9912 เชียงราย',
    fuelType: 'premium_diesel',
    requestedLiters: 450,
    pricePerLiter: 38.2,
    siteLocation: 'ลานขนส่งแมคโครงกลางภาคเหนือ',
    requesterName: 'นายพงษ์ศักดิ์ ดีพร้อม',
    mileagePhoto: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=300',
    hourMeterValue: 124310,
    status: 'approved_to_fill'
  },
  {
    id: 'f-3',
    documentNo: 'FL-20260526-0711',
    date: '2026-05-26 07:15',
    machineryId: 'mach-05',
    plateNumber: '82-1549 เชียงใหม่',
    fuelType: 'diesel',
    requestedLiters: 200,
    pricePerLiter: 33.5,
    siteLocation: 'หน่วยบริการประปาสารภี',
    requesterName: 'นายมานะ เจริญพานิช',
    mileagePhoto: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=300',
    hourMeterValue: 8380,
    status: 'completed',
    actualLiters: 198,
    actualPrice: 6633, // 198 * 33.5
    gasStationName: 'ปตท. ดอนจั่น มอเตอร์ฟูล',
    receiptPhotoUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=300',
    gpsLocFilled: '18.7752, 99.0351',
    operatorName: 'สิริวรรณ การปิโตรเลียม'
  }
];

export const INITIAL_EXPENSES: ExpenseRecord[] = [
  {
    id: 'exp-1',
    date: '2026-05-28',
    category: 'fuel',
    description: 'เติมเพื่อเร่งขุดเขื่อนกั้นน้ำชลประทานดินเหนียว (FL-20260526-0711)',
    amount: 6633,
    siteLocation: 'ไซต์ก่อสร้าง ชลประทานเฟส 3',
    recordedBy: 'นายมานะ เจริญพานิช',
    machineryId: 'mach-05'
  },
  {
    id: 'exp-2',
    date: '2026-05-27',
    category: 'repair',
    description: 'ซื้อชุดซีลยางซ่อมกระบอกวาล์วล้มกระแทก รถ Komatsu GD511',
    amount: 4500,
    siteLocation: 'อู่รถซ่อมใหญ่สารภี',
    recordedBy: 'ช่างวิชัย แก้วประเสริฐ',
    machineryId: 'mach-02'
  },
  {
    id: 'exp-3',
    date: '2026-05-26',
    category: 'parts',
    description: 'จัดซื้อไส้กรองอะไหล่คิงส์ฟิลเตอร์สำรองคลัง',
    amount: 8400,
    siteLocation: 'คลังพัสดุใหญ่',
    recordedBy: 'สุพรรณี จัดซื่อสินทรัพย์'
  },
  {
    id: 'exp-4',
    date: '2026-05-25',
    category: 'labor',
    description: 'เหมาค่าแรงนอกชั่วโมงซ่อมเครนใหญ่ Kato ลานตัดดินแรด',
    amount: 3200,
    siteLocation: 'หน้างานขยายทางเชื่อม อ.แม่ริม',
    recordedBy: 'ช่างเกรียงไกร ชำนาญยนต์',
    machineryId: 'mach-06'
  },
  {
    id: 'exp-5',
    date: '2026-05-24',
    category: 'rent',
    description: 'ค่าเช่ารถเทรลเลอร์ขนลากบด Sakai ตู้หัวรากใหญ่',
    amount: 15000,
    siteLocation: 'ขนส่ง อ.ปาย แม่ฮ่องสอน',
    recordedBy: 'เกรียงเดช สิทธิประภาวงศ์',
    machineryId: 'mach-03'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    user: 'สมชาย ควบคุมศูนย์',
    action: 'อนุมัติใบเติมน้ำมันเอกสาร FL-20260526-0711',
    module: 'Fuel Service',
    timestamp: '2026-05-28 09:12',
    description: 'อนุมัติเติมน้ำมันดีเซลปริมาณ 200 ลิตร สำหรับเครื่องจักร watertruck แฟ้มงานประปา'
  },
  {
    id: 'log-2',
    user: 'ช่างนพดล แสงทอง',
    action: 'เช็คอินเวลาเข้างานสำเร็จ (Check-In)',
    module: 'Time Attendance',
    timestamp: '2026-05-28 08:00',
    description: 'พิกัด 18.8955, 99.0123 กล้องยืนยันถ่ายหน้างานจริงเรียบร้อย'
  },
  {
    id: 'log-3',
    user: 'ช่างศักดิ์ชาย เรืองเดช',
    action: 'ยื่นคำร้องเบิกอะไหล่ ไส้กรองอากาศ REQ-202605-0015',
    module: 'Inventory',
    timestamp: '2026-05-27 15:10',
    description: 'ยื่นเบิกอุปกรณ์สำรองสำหรับงานซ่อมด่วนบดอัดชลประทาน'
  }
];

export const SUPABASE_SQL_SCHEMA = `-- FlowWork CMMS 360 - Database Schema Design (For Supabase / PostgreSQL)

-- 1. Heavy Machinery Table (ตารางทะเบียนเครื่องจักรหนัก)
CREATE TABLE heavy_machinery (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'backhoe', 'grader', 'roller', 'tenwheeler', etc.
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    plate_number VARCHAR(50),
    serial_number VARCHAR(100) UNIQUE,
    hour_meter NUMERIC(10, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'under_repair', 'maintenance_due', 'inactive'
    responsible_name VARCHAR(150),
    qr_code_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Work Schedule Tasks Table (ตารางแผนปฏิบัติงานรายวัน/รายสัปดาห์)
CREATE TABLE work_schedule_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    machinery_id UUID REFERENCES heavy_machinery(id) ON DELETE SET NULL,
    assigned_to VARCHAR(150) NOT NULL,
    priority VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    due_date DATE NOT NULL,
    gps_location_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'awaiting_approval', 'completed', 'cancelled'
    photo_urls TEXT[], -- array of image links
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Comments Table (ระบบคอมเมนต์ย่อยในใบงาน)
CREATE TABLE task_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES work_schedule_tasks(id) ON DELETE CASCADE,
    user_name VARCHAR(150) NOT NULL,
    user_role VARCHAR(100),
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Spare Parts Stock Table (ตารางคลังอะไหล่และพัสดุ)
CREATE TABLE stock_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(150) NOT NULL,
    quantity INTEGER DEFAULT 0,
    min_quantity INTEGER DEFAULT 5,
    unit VARCHAR(50) NOT NULL,
    location VARCHAR(100),
    qr_code_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Inventory Issuance (ตารางเบิกจ่าย/คืนพัสดุ)
CREATE TABLE inventory_issuances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_no VARCHAR(100) UNIQUE NOT NULL,
    item_id UUID REFERENCES stock_items(id) ON DELETE CASCADE,
    qty_requested INTEGER NOT NULL,
    qty_approved INTEGER DEFAULT 0,
    department VARCHAR(150) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    requested_by VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Work Attendance (ตารางลงคะแนนลงเวลาการทำงานผ่านพิกัด GPS)
CREATE TABLE work_attendances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_name VARCHAR(150) NOT NULL,
    check_in TIME NOT NULL,
    check_out TIME,
    work_date DATE DEFAULT CURRENT_DATE NOT NULL,
    gps_coordinates VARCHAR(100) NOT NULL,
    photo_url TEXT,
    status VARCHAR(50) DEFAULT 'present', -- 'present', 'absent', 'leave', 'late'
    ot_hours NUMERIC(4, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Mechanical Repair Requests (ตารางระบบรับแจ้งซ่อมเครื่องจักรหนัก)
CREATE TABLE repair_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    machinery_id UUID REFERENCES heavy_machinery(id) ON DELETE CASCADE,
    reporter_name VARCHAR(150) NOT NULL,
    problem_desc TEXT NOT NULL,
    urgency VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    gps_location VARCHAR(100),
    status VARCHAR(50) DEFAULT 'reported', -- 'reported', 'approved', 'assigned', 'repairing', 'completed'
    assigned_tech VARCHAR(150),
    hours_meter_recorded NUMERIC(10, 2) NOT NULL,
    reporter_photo_url TEXT,
    video_url_mock TEXT,
    checklist JSONB DEFAULT '[]'::jsonb, -- array of checkout lists
    signature_base64 TEXT, -- Digital Signatures of PM closing
    before_photo TEXT,
    after_photo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. Preventive Maintenance (ตารางแผนซ่อมบำรุงเชิงป้องกัน)
CREATE TABLE preventive_maintenances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    machinery_id UUID REFERENCES heavy_machinery(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    cycle_days INTEGER,
    cycle_hours INTEGER,
    last_pm_date DATE,
    last_pm_hour NUMERIC(10, 2),
    next_pm_due_date DATE,
    next_pm_due_hour NUMERIC(10,2),
    status VARCHAR(50) DEFAULT 'upcoming', -- 'upcoming', 'overdue', 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. Fuel Request and Complete Service Table (ระบบใบเบิกและบันทึกจ่ายเติมน้ำมันจริง)
CREATE TABLE fuel_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_no VARCHAR(100) UNIQUE NOT NULL,
    machinery_id UUID REFERENCES heavy_machinery(id) ON DELETE CASCADE,
    refuel_date DATE DEFAULT CURRENT_DATE NOT NULL,
    fuel_type VARCHAR(50) NOT NULL, -- 'diesel', 'gasoline', 'premium_diesel'
    requested_liters NUMERIC(8,2) NOT NULL,
    price_per_liter NUMERIC(6,2) NOT NULL,
    site_location VARCHAR(255) NOT NULL,
    requester_name VARCHAR(150) NOT NULL,
    mileage_photo_url TEXT,
    hour_meter_value NUMERIC(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending_approval', -- 'pending_approval', 'approved_to_fill', 'completed', 'cancelled'
    actual_liters NUMERIC(8,2),
    actual_price NUMERIC(10,2),
    gas_station_name VARCHAR(150),
    receipt_photo_url TEXT,
    gps_coordinates_filled VARCHAR(100),
    operator_name VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 10. Site Expense Records Table (ตารางบันทึกรายจ่ายโครงการ)
CREATE TABLE expense_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_date DATE DEFAULT CURRENT_DATE NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'fuel', 'repair', 'labor', 'parts', 'transport', 'rent', 'other'
    description TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    receipt_photo_url TEXT,
    site_location VARCHAR(255) NOT NULL,
    recorded_by VARCHAR(150) NOT NULL,
    machinery_id UUID REFERENCES heavy_machinery(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 11. Core Audit Logs Table (ล็อกความเคลื่อนไหวความปลอดภัยของสารสนเทศ)
CREATE TABLE audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_name VARCHAR(150) NOT NULL,
    action_type VARCHAR(200) NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    description TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for Speed Performance Optimization
CREATE INDEX idx_mach_status ON heavy_machinery(status);
CREATE INDEX idx_task_due ON work_schedule_tasks(due_date, status);
CREATE INDEX idx_repair_mach ON repair_requests(machinery_id, status);
CREATE INDEX idx_fuel_mach ON fuel_services(machinery_id, status);
CREATE INDEX idx_expense_cat ON expense_records(category, expense_date);

-- =========================================
-- INSERT SAMPLE DATA (Seed)
-- =========================================

-- 1. Machinery
INSERT INTO heavy_machinery (code, brand, name, type, status, hour_meter, model, responsible_name) VALUES 
('EXC-01', 'CAT', 'CAT 320D3', 'backhoe', 'active', 1200, '320D3', 'somchai'),
('GRD-01', 'Komatsu', 'Komatsu GD511A', 'grader', 'active', 540, 'GD511A', 'wichai'),
('ROL-01', 'Sakai', 'Sakai SV512', 'roller', 'under_repair', 300, 'SV512', 'nopadol'),
('TRK-01', 'Isuzu', 'Isuzu DECA 360', 'tenwheeler', 'active', 45000, 'DECA', 'pong');

-- 2. Work Schedule Tasks
INSERT INTO work_schedule_tasks (title, description, assigned_to, machinery_id, status, due_date) 
SELECT 'ขุดลอกคลองน้ำ', 'ไซต์งาน A', 'สมชาย', id, 'in_progress', '2026-06-01' FROM heavy_machinery WHERE code = 'EXC-01';

INSERT INTO work_schedule_tasks (title, description, assigned_to, machinery_id, status, due_date) 
SELECT 'เกรดปรับหน้าดิน', 'ถนนเข้าหมู่บ้าน', 'วิชัย', id, 'pending', '2026-06-05' FROM heavy_machinery WHERE code = 'GRD-01';

INSERT INTO work_schedule_tasks (title, description, assigned_to, machinery_id, status, due_date) 
SELECT 'บดอัดดินลูกรัง', 'ทำถนนใหม่', 'นพดล', id, 'pending', '2026-06-12' FROM heavy_machinery WHERE code = 'ROL-01';

INSERT INTO work_schedule_tasks (title, description, assigned_to, machinery_id, status, due_date) 
SELECT 'ขนย้ายดิน', 'โซน 3', 'พงษ์', id, 'completed', '2026-05-20' FROM heavy_machinery WHERE code = 'TRK-01';

-- 3. Spare Parts Stock Table
INSERT INTO stock_items (code, name, category, quantity, unit, min_quantity) VALUES
('FIL-01', 'ไส้กรองอากาศ CAT', 'parts', 15, 'ลูก', 5),
('OIL-01', 'น้ำมันเครื่อง 10W-40', 'fluid', 8, 'ถัง', 10),
('GSK-01', 'ปะเก็นชุดใหญ่', 'parts', 4, 'ชุด', 2),
('TYR-01', 'ยาง 11R22.5', 'parts', 12, 'เส้น', 4);

-- 4. Inventory Issuance
INSERT INTO inventory_issuances (document_no, item_id, qty_requested, qty_approved, department, requested_by)
SELECT 'REQ-01', id, 2, 2, 'ซ่อมบำรุง', 'สมชาย' FROM stock_items WHERE code = 'FIL-01';

INSERT INTO inventory_issuances (document_no, item_id, qty_requested, qty_approved, department, requested_by)
SELECT 'REQ-02', id, 1, 1, 'เครื่องหน้า', 'วิชัย' FROM stock_items WHERE code = 'OIL-01';

INSERT INTO inventory_issuances (document_no, item_id, qty_requested, qty_approved, department, requested_by)
SELECT 'REQ-03', id, 6, 6, 'ขนส่ง', 'พงษ์' FROM stock_items WHERE code = 'TYR-01';

INSERT INTO inventory_issuances (document_no, item_id, qty_requested, qty_approved, department, requested_by)
SELECT 'REQ-04', id, 1, 1, 'ซ่อมบำรุง', 'นพดล' FROM stock_items WHERE code = 'GSK-01';

-- 5. Time Attendance Logs
INSERT INTO work_attendances (employee_name, check_in, work_date, gps_coordinates, status) VALUES
('สมชาย ช่างขุด', '07:45:00', '2026-05-28', '18.7904, 98.9841', 'present'),
('วิชัย ช่างเกรด', '07:50:00', '2026-05-28', '18.7905, 98.9841', 'present'),
('นพดล ช่างบด', '08:05:00', '2026-05-28', '18.7914, 98.9845', 'late'),
('พงษ์ คนขับ', '07:30:00', '2026-05-28', '18.8914, 98.9745', 'present');

-- 6. Repair Requests
INSERT INTO repair_requests (machinery_id, reporter_name, problem_desc, urgency, status, hours_meter_recorded)
SELECT id, 'สมชาย', 'ระบบไฮดรอลิกรั่ว', 'high', 'reported', 1200 FROM heavy_machinery WHERE code = 'EXC-01';

INSERT INTO repair_requests (machinery_id, reporter_name, problem_desc, urgency, status, hours_meter_recorded)
SELECT id, 'พงษ์', 'ล้อยางรั่ว', 'medium', 'reported', 45000 FROM heavy_machinery WHERE code = 'TRK-01';

INSERT INTO repair_requests (machinery_id, reporter_name, problem_desc, urgency, status, hours_meter_recorded)
SELECT id, 'วิชัย', 'เปลี่ยนแบตเตอรี่', 'low', 'assigned', 540 FROM heavy_machinery WHERE code = 'GRD-01';

INSERT INTO repair_requests (machinery_id, reporter_name, problem_desc, urgency, status, hours_meter_recorded)
SELECT id, 'นพดล', 'เครื่องยนต์สะดุด', 'critical', 'repairing', 300 FROM heavy_machinery WHERE code = 'ROL-01';

-- 7. Fuel Service Options
INSERT INTO fuel_services (document_no, machinery_id, requested_liters, price_per_liter, fuel_type, site_location, requester_name, hour_meter_value)
SELECT 'FUEL-01', id, 200, 30, 'diesel', 'Site A', 'สมชาย', 1200 FROM heavy_machinery WHERE code = 'EXC-01';

INSERT INTO fuel_services (document_no, machinery_id, requested_liters, price_per_liter, fuel_type, site_location, requester_name, hour_meter_value)
SELECT 'FUEL-02', id, 150, 30, 'diesel', 'Site B', 'วิชัย', 540 FROM heavy_machinery WHERE code = 'GRD-01';

INSERT INTO fuel_services (document_no, machinery_id, requested_liters, price_per_liter, fuel_type, site_location, requester_name, hour_meter_value)
SELECT 'FUEL-03', id, 80, 30, 'diesel', 'Site C', 'นพดล', 300 FROM heavy_machinery WHERE code = 'ROL-01';

INSERT INTO fuel_services (document_no, machinery_id, requested_liters, price_per_liter, fuel_type, site_location, requester_name, hour_meter_value)
SELECT 'FUEL-04', id, 300, 30, 'diesel', 'Site D', 'พงษ์', 45000 FROM heavy_machinery WHERE code = 'TRK-01';

-- 8. Expenses
INSERT INTO expense_records (category, amount, description, site_location, recorded_by) VALUES
('fuel', 21900, 'ค่าน้ำมันประจำสัปดาห์', 'Site All', 'Admin'),
('parts', 15000, 'ค่าอะไหล่ CAT', 'Site A', 'Admin'),
('repair', 4500, 'ค่าแรงช่างนอก', 'Site C', 'Admin'),
('other', 1200, 'ค่าอาหารรับรอง', 'Office', 'Admin');

`;
