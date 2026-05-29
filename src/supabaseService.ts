import { supabase } from './supabaseClient';
import { 
  HeavyMachinery, 
  WorkScheduleTask, 
  StockItem, 
  InventoryIssuance, 
  AttendanceLog, 
  RepairRequest, 
  PreventiveMaintenance, 
  RefuelStatus, 
  ExpenseRecord 
} from './types';
import { 
  INITIAL_MACHINERY, 
  INITIAL_TASKS, 
  INITIAL_STOCK, 
  INITIAL_ISSUANCES, 
  INITIAL_ATTENDANCE_LOGS, 
  INITIAL_REPAIRS, 
  INITIAL_REFUELS, 
  INITIAL_EXPENSES 
} from './mockData';

// GRACEFUL EXCEPTION & TABLE VERIFICATION WRAPPER
async function runQuery<T>(queryPromise: any, fallback: T): Promise<T> {
  try {
    const { data, error } = await queryPromise;
    if (error) {
      console.warn('Supabase DB Query warning (falling back to local memory):', error);
      return fallback;
    }
    return data || fallback;
  } catch (err) {
    console.error('Supabase DB Exception (falling back to local memory):', err);
    return fallback;
  }
}

// 1. HEAVY MACHINERY MAPPINGS
export async function getMachinery(): Promise<HeavyMachinery[]> {
  const data = await runQuery(supabase.from('heavy_machinery').select('*'), null);
  if (!data) return INITIAL_MACHINERY;
  return data.map((r: any) => ({
    id: r.id,
    code: r.code,
    type: r.type,
    brand: r.brand,
    model: r.model,
    plateNumber: r.plate_number || '',
    serialNumber: r.serial_number || '',
    hourMeter: Number(r.hour_meter || 0),
    status: r.status || 'active',
    responsibleName: r.responsible_name || '',
    qrCodeUrl: r.qr_code_url || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${r.code}`
  }));
}

export async function saveMachinery(m: HeavyMachinery) {
  const payload = {
    id: m.id,
    code: m.code,
    type: m.type,
    brand: m.brand,
    model: m.model,
    plate_number: m.plateNumber,
    serial_number: m.serialNumber,
    hour_meter: m.hourMeter,
    status: m.status,
    responsible_name: m.responsibleName,
    qr_code_url: m.qrCodeUrl
  };
  await supabase.from('heavy_machinery').upsert(payload);
}

// 2. WORK SCHEDULE TASKS MAPPINGS
export async function getTasks(): Promise<WorkScheduleTask[]> {
  // Try fetching tasks joined with comment logs or JSONB
  const data = await runQuery(supabase.from('work_schedule_tasks').select('*'), null);
  if (!data) return INITIAL_TASKS;
  return data.map((r: any) => ({
    id: r.id,
    title: r.title,
    description: r.description || '',
    machineryId: r.machinery_id,
    assignedTo: r.assigned_to,
    priority: r.priority || 'medium',
    dueDate: r.due_date,
    gpsLocName: r.gps_location_name || '',
    status: r.status || 'pending',
    timeline: r.timeline || [
      { status: r.status || 'pending', timestamp: new Date(r.created_at || Date.now()).toISOString().replace('T', ' ').substring(0, 16), note: 'สร้างรายการงานแล้ว' }
    ],
    comments: r.comments || [],
    photoUrls: r.photo_urls || []
  }));
}

export async function saveTask(t: WorkScheduleTask) {
  const payload = {
    id: t.id,
    title: t.title,
    description: t.description,
    machinery_id: t.machineryId || null,
    assigned_to: t.assignedTo,
    priority: t.priority,
    due_date: t.dueDate,
    gps_location_name: t.gpsLocName,
    status: t.status,
    photo_urls: t.photoUrls || [],
    timeline: t.timeline || [],
    comments: t.comments || []
  } as any;
  await supabase.from('work_schedule_tasks').upsert(payload);
}

export async function deleteTask(id: string) {
  await supabase.from('work_schedule_tasks').delete().eq('id', id);
}

// 3. SPARE PARTS STOCK MAPPINGS
export async function getStock(): Promise<StockItem[]> {
  const data = await runQuery(supabase.from('stock_items').select('*'), null);
  if (!data) return INITIAL_STOCK;
  return data.map((r: any) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    category: r.category,
    quantity: Number(r.quantity || 0),
    minQuantity: Number(r.min_quantity || 5),
    unit: r.unit,
    location: r.location || '',
    qrCodeText: r.qr_code_text || r.code
  }));
}

export async function saveStockItem(s: StockItem) {
  const payload = {
    id: s.id,
    code: s.code,
    name: s.name,
    category: s.category,
    quantity: s.quantity,
    min_quantity: s.minQuantity,
    unit: s.unit,
    location: s.location,
    qr_code_text: s.qrCodeText
  };
  await supabase.from('stock_items').upsert(payload);
}

// 4. INVENTORY ISSUANCES MAPPINGS
export async function getIssuances(stockList: StockItem[]): Promise<InventoryIssuance[]> {
  const data = await runQuery(supabase.from('inventory_issuances').select('*'), null);
  if (!data) return INITIAL_ISSUANCES;
  return data.map((r: any) => {
    const item = stockList.find(s => s.id === r.item_id);
    return {
      id: r.id,
      documentNo: r.document_no || `REQ-${r.id.substring(0,8).toUpperCase()}`,
      itemId: r.item_id,
      itemName: item ? item.name : 'อะไหล่ทั่วไป',
      qtyRequested: Number(r.qty_requested || 1),
      qtyApproved: Number(r.qty_approved || 0),
      department: r.department,
      status: r.status || 'pending',
      requestedBy: r.requested_by,
      date: new Date(r.created_at || Date.now()).toISOString().split('T')[0]
    };
  });
}

export async function saveIssuance(iss: InventoryIssuance) {
  const payload = {
    id: iss.id,
    document_no: iss.documentNo,
    item_id: iss.itemId,
    qty_requested: iss.qtyRequested,
    qty_approved: iss.qtyApproved,
    department: iss.department,
    status: iss.status,
    requested_by: iss.requestedBy
  };
  await supabase.from('inventory_issuances').upsert(payload);
}

// 5. ATTENDANCE LOG MAPS
export async function getAttendances(): Promise<AttendanceLog[]> {
  const data = await runQuery(supabase.from('work_attendances').select('*'), null);
  if (!data) return INITIAL_ATTENDANCE_LOGS;
  return data.map((r: any) => ({
    id: r.id,
    employeeName: r.employee_name,
    role: 'ช่างควบคุมเครื่องจักร',
    checkInTime: r.check_in ? r.check_in.substring(0, 5) + ' น.' : '--:--',
    checkOutTime: r.check_out ? r.check_out.substring(0, 5) + ' น.' : undefined,
    siteName: 'ไซต์งานชลประทาน B',
    isOvertime: Number(r.ot_hours || 0) > 0,
    photoUrl: r.photo_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    gpsLocIn: r.gps_coordinates || '18.7961, 98.9792',
    gpsLocOut: r.gps_coordinates || undefined
  }));
}

export async function saveAttendance(log: AttendanceLog) {
  const checkIn = log.checkInTime.replace(' น.', '').trim();
  const checkOut = log.checkOutTime ? log.checkOutTime.replace(' น.', '').trim() : null;
  const payload = {
    id: log.id,
    employee_name: log.employeeName,
    check_in: checkIn.length === 5 ? checkIn + ':00' : '08:00:00',
    check_out: checkOut && checkOut.length === 5 ? checkOut + ':00' : null,
    work_date: new Date().toISOString().split('T')[0],
    gps_coordinates: log.gpsLocIn,
    photo_url: log.photoUrl || '',
    status: 'present',
    ot_hours: log.isOvertime ? 2.0 : 0.0
  };
  await supabase.from('work_attendances').upsert(payload);
}

// 6. MECHANICAL REPAIRS MAPPINGS
export async function getRepairs(): Promise<RepairRequest[]> {
  const data = await runQuery(supabase.from('repair_requests').select('*'), null);
  if (!data) return INITIAL_REPAIRS;
  return data.map((r: any) => ({
    id: r.id,
    machineryId: r.machinery_id,
    reporterName: r.reporter_name,
    problemDesc: r.problem_desc,
    urgency: r.urgency || 'medium',
    gpsLoc: r.gps_location || '18.7961, 98.9792',
    status: r.status || 'reported',
    assignedTech: r.assigned_tech || '',
    hoursMeterRecorded: Number(r.hours_meter_recorded || 0),
    photoUrl: r.reporter_photo_url || '',
    videoUrlMock: r.video_url_mock || '',
    checklist: r.checklist || [
      { task: "ตรวจวัดสภาพน้ำมันและพัดลมระบายความร้อน", done: true },
      { task: "ถอดสลักคานหลักและตรวจดูความร้าวของไฮดรอลิก", done: false }
    ],
    signature: r.signature_base64 || '',
    beforePhoto: r.before_photo || '',
    afterPhoto: r.after_photo || '',
    timestamp: new Date(r.created_at || Date.now()).toISOString().replace('T', ' ').substring(0, 16)
  }));
}

export async function saveRepair(rep: RepairRequest) {
  const payload = {
    id: rep.id,
    machinery_id: rep.machineryId,
    reporter_name: rep.reporterName,
    problem_desc: rep.problemDesc,
    urgency: rep.urgency,
    gps_location: rep.gpsLoc,
    status: rep.status,
    assigned_tech: rep.assignedTech || null,
    hours_meter_recorded: rep.hoursMeterRecorded,
    reporter_photo_url: rep.photoUrl,
    video_url_mock: rep.videoUrlMock || null,
    checklist: rep.checklist || [],
    signature_base64: rep.signature || null,
    before_photo: rep.beforePhoto || null,
    after_photo: rep.afterPhoto || null
  };
  await supabase.from('repair_requests').upsert(payload);
}

export async function deleteRepair(id: string) {
  await supabase.from('repair_requests').delete().eq('id', id);
}

// 7. REFUEL SERVICES MAPPINGS
export async function getRefuels(machList: HeavyMachinery[]): Promise<RefuelStatus[]> {
  const data = await runQuery(supabase.from('fuel_services').select('*'), null);
  if (!data) return INITIAL_REFUELS;
  return data.map((r: any) => {
    const mach = machList.find(m => m.id === r.machinery_id);
    return {
      id: r.id,
      documentNo: r.document_no || `FUEL-${r.id.substring(0,8).toUpperCase()}`,
      date: r.refuel_date || new Date().toISOString().split('T')[0],
      machineryId: r.machinery_id,
      plateNumber: mach ? mach.plateNumber : 'ไม่ระบุทะเบียน',
      fuelType: r.fuel_type || 'diesel',
      requestedLiters: Number(r.requested_liters || 50),
      pricePerLiter: Number(r.price_per_liter || 33.5),
      siteLocation: r.site_location || 'ไซต์งานหลัก CMMS',
      requesterName: r.requester_name || 'ช่างคุมงาน',
      mileagePhoto: r.mileage_photo_url || '',
      hourMeterValue: Number(r.hour_meter_value || 0),
      status: r.status || 'pending_approval',
      actualLiters: r.actual_liters ? Number(r.actual_liters) : undefined,
      actualPrice: r.actual_price ? Number(r.actual_price) : undefined,
      gasStationName: r.gas_station_name || undefined,
      receiptPhotoUrl: r.receipt_photo_url || undefined,
      gpsLocFilled: r.gps_coordinates_filled || undefined,
      operatorName: r.operator_name || undefined
    };
  });
}

export async function saveRefuel(ref: RefuelStatus) {
  const payload = {
    id: ref.id,
    document_no: ref.documentNo,
    machinery_id: ref.machineryId,
    refuel_date: ref.date,
    fuel_type: ref.fuelType,
    requested_liters: ref.requestedLiters,
    price_per_liter: ref.pricePerLiter,
    site_location: ref.siteLocation,
    requester_name: ref.requesterName,
    mileage_photo_url: ref.mileagePhoto,
    hour_meter_value: ref.hourMeterValue,
    status: ref.status,
    actual_liters: ref.actualLiters || null,
    actual_price: ref.actualPrice || null,
    gas_station_name: ref.gasStationName || null,
    receipt_photo_url: ref.receiptPhotoUrl || null,
    gps_coordinates_filled: ref.gpsLocFilled || null,
    operator_name: ref.operatorName || null
  };
  await supabase.from('fuel_services').upsert(payload);
}

// 8. SITE EXPENSES MAPPINGS
export async function getExpenses(): Promise<ExpenseRecord[]> {
  const data = await runQuery(supabase.from('expense_records').select('*'), null);
  if (!data) return INITIAL_EXPENSES;
  return data.map((r: any) => ({
    id: r.id,
    date: r.expense_date || new Date().toISOString().split('T')[0],
    category: r.category || 'other',
    description: r.description || '',
    amount: Number(r.amount || 0),
    receiptPhoto: r.receipt_photo_url || '',
    siteLocation: r.site_location || 'ไซต์งานหลัก CMMS',
    recordedBy: r.recorded_by || 'Admin',
    machineryId: r.machinery_id || undefined
  }));
}

export async function saveExpense(exp: ExpenseRecord) {
  const payload = {
    id: exp.id,
    expense_date: exp.date,
    category: exp.category,
    description: exp.description,
    amount: exp.amount,
    receipt_photo_url: exp.receiptPhoto || '',
    site_location: exp.siteLocation,
    recorded_by: exp.recordedBy,
    machinery_id: exp.machineryId || null
  };
  await supabase.from('expense_records').upsert(payload);
}

export async function deleteExpense(id: string) {
  await supabase.from('expense_records').delete().eq('id', id);
}
