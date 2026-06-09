import { supabase } from './supabaseClient';
import { 
  HeavyMachinery, 
  WorkScheduleTask, 
  StockItem, 
  InventoryIssuance, 
  AttendanceLog, 
  RepairRequest, 
  RefuelStatus, 
  ExpenseRecord,
  GoogleDriveUpload,
  LineSettingItem,
  EmployeeProfile
} from './types';
import { toUUID } from './utils/uuid';

// GRACEFUL EXCEPTION & TABLE VERIFICATION WRAPPER
async function runQuery<T>(queryPromise: any, fallback: T, tableName?: string): Promise<T> {
  let computedTable = tableName || 'unknown';
  if (!computedTable || computedTable === 'unknown') {
    try {
      if (queryPromise && typeof queryPromise.url === 'object' && queryPromise.url instanceof URL) {
        const pathParts = queryPromise.url.pathname.split('/');
        computedTable = pathParts[pathParts.length - 1] || 'unknown';
      } else if (queryPromise && typeof queryPromise.url === 'string') {
        const urlStr = queryPromise.url;
        const index = urlStr.indexOf('/rest/v1/');
        if (index !== -1) {
          computedTable = urlStr.substring(index + 9).split('?')[0];
        } else {
          const parts = urlStr.split('/');
          computedTable = parts[parts.length - 1].split('?')[0];
        }
      }
    } catch (e) {
      // ignore helper error
    }
  }

  const startTime = Date.now();
  console.log(`📡 [Supabase DEBUG Query] Fetching data from: "${computedTable}"...`);
  
  try {
    const { data, error, status, statusText } = await queryPromise;
    const duration = Date.now() - startTime;
    
    if (error) {
      console.error(`❌ [Supabase DEBUG Query Error] Failed to fetch table "${computedTable}" (${duration}ms):`, {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        httpStatusCode: status,
        httpStatusText: statusText
      });
      return fallback;
    }
    
    const count = Array.isArray(data) ? data.length : (data ? 1 : 0);
    console.log(`✅ [Supabase DEBUG Query Success] Table "${computedTable}" fetched successfully in ${duration}ms! Status: ${status} (${statusText || 'OK'}). Retrieved ${count} rows.`);
    return data || fallback;
  } catch (err: any) {
    const duration = Date.now() - startTime;
    console.error(`🚨 [Supabase DEBUG Query Exception] Fatal exception fetching table "${computedTable}" (${duration}ms):`, {
      message: err?.message || String(err),
      stack: err?.stack
    });
    return fallback;
  }
}

// 1. HEAVY MACHINERY MAPPINGS
export async function getMachinery(): Promise<HeavyMachinery[]> {
  const data = await runQuery(supabase.from('heavy_machinery').select('*'), null);
  if (!data) {
    return [];
  }
  return data.map((r: any) => ({
    id: toUUID(r.id),
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
    id: toUUID(m.id),
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
  const data = await runQuery(supabase.from('work_schedule_tasks').select('*'), null);
  if (!data) {
    return [];
  }
  return data.map((r: any) => {
    let descriptionText = r.description || '';
    let locations: string[] = [];
    let supervisors: string[] = [];
    let machineries: string[] = [];
    let employees: string[] = [];
    let assignedBy = '';
    let workTime = '';

    try {
      if (descriptionText.startsWith('{') || descriptionText.startsWith('[')) {
        const parsed = JSON.parse(descriptionText);
        descriptionText = parsed.description || '';
        locations = parsed.locations || [];
        supervisors = parsed.supervisors || [];
        machineries = parsed.machineries || [];
        employees = parsed.employees || [];
        assignedBy = parsed.assignedBy || '';
        workTime = parsed.workTime || '';
      } else {
        locations = r.gps_location_name ? [r.gps_location_name] : [];
        employees = r.assigned_to ? [r.assigned_to] : [];
      }
    } catch (e) {
      // ignore
    }

    if (locations.length === 0 && r.gps_location_name) {
      locations = [r.gps_location_name];
    }
    if (employees.length === 0 && r.assigned_to) {
      employees = [r.assigned_to];
    }

    return {
      id: toUUID(r.id),
      title: r.title,
      description: descriptionText,
      machineryId: r.machinery_id ? toUUID(r.machinery_id) : undefined,
      assignedTo: employees.join(', ') || r.assigned_to,
      priority: r.priority || 'medium',
      dueDate: r.due_date,
      gpsLocName: locations.join(', ') || r.gps_location_name || '',
      status: r.status || 'pending',
      timeline: r.timeline || [
        { status: r.status || 'pending', timestamp: new Date(r.created_at || Date.now()).toISOString().replace('T', ' ').substring(0, 16), note: 'สร้างรายการงานแล้ว' }
      ],
      comments: r.comments || [],
      photoUrls: r.photo_urls || [],
      locations,
      supervisors,
      machineries,
      employees,
      assignedBy,
      workTime
    };
  });
}

export async function saveTask(t: WorkScheduleTask) {
  const meta = {
    description: t.description || '',
    locations: t.locations || (t.gpsLocName ? [t.gpsLocName] : []),
    supervisors: t.supervisors || [],
    machineries: t.machineries || (t.machineryId ? [t.machineryId] : []),
    employees: t.employees || (t.assignedTo ? [t.assignedTo] : []),
    assignedBy: t.assignedBy || '',
    workTime: t.workTime || ''
  };

  const payload = {
    id: toUUID(t.id),
    title: t.title,
    description: JSON.stringify(meta),
    machinery_id: t.machineryId ? toUUID(t.machineryId) : null,
    assigned_to: t.employees && t.employees.length > 0 ? t.employees[0] : t.assignedTo,
    priority: t.priority,
    due_date: t.dueDate,
    gps_location_name: t.locations && t.locations.length > 0 ? t.locations[0] : (t.gpsLocName || ''),
    status: t.status,
    photo_urls: t.photoUrls || [],
    timeline: t.timeline || [],
    comments: t.comments || []
  } as any;
  await supabase.from('work_schedule_tasks').upsert(payload);
}

export async function deleteTask(id: string) {
  await supabase.from('work_schedule_tasks').delete().eq('id', toUUID(id));
}

// 3. SPARE PARTS STOCK MAPPINGS
export async function getStock(): Promise<StockItem[]> {
  const data = await runQuery(supabase.from('stock_items').select('*'), null);
  if (!data) {
    return [];
  }
  return data.map((r: any) => ({
    id: toUUID(r.id),
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
    id: toUUID(s.id),
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
  if (!data) {
    return [];
  }
  return data.map((r: any) => {
    const item = stockList.find(s => s.id === toUUID(r.item_id));
    return {
      id: toUUID(r.id),
      documentNo: r.document_no || `REQ-${r.id.substring(0,8).toUpperCase()}`,
      itemId: toUUID(r.item_id),
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
    id: toUUID(iss.id),
    document_no: iss.documentNo,
    item_id: toUUID(iss.itemId),
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
  const data = await runQuery(supabase.from('work_attendances').select('*').order('created_at', { ascending: false }), null);
  if (!data) {
    return [];
  }
  return data.map((r: any) => {
    let meta: any = {};
    try {
      if (r.photo_url && (r.photo_url.startsWith('{') || r.photo_url.startsWith('['))) {
        meta = JSON.parse(r.photo_url);
      } else {
        meta = { photoUrl: r.photo_url || '' };
      }
    } catch (e) {
      meta = { photoUrl: r.photo_url || '' };
    }

    return {
      id: toUUID(r.id),
      employeeName: r.employee_name,
      role: meta.role || 'ช่างควบคุมเครื่องจักร',
      checkInTime: r.check_in ? r.check_in.substring(0, 5) + ' น.' : '--:--',
      checkOutTime: r.check_out ? r.check_out.substring(0, 5) + ' น.' : undefined,
      workDate: r.work_date || new Date().toISOString().split('T')[0],
      siteName: meta.siteName || 'ไซต์งานชลประทาน B',
      status: r.status || meta.status || 'present',
      isOvertime: Number(r.ot_hours || 0) > 0 || !!meta.isOvertime,
      otHours: Number(r.ot_hours || 0),
      photoUrl: meta.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
      photoUrlOut: meta.photoUrlOut || undefined,
      gpsLocIn: r.gps_coordinates || '18.7961, 98.9792',
      gpsLocOut: meta.gpsLocOut || undefined,
      
      attendanceType: meta.attendanceType || 'normal',
      approvalStatus: meta.approvalStatus || (meta.attendanceType === 'retro' || r.status === 'wfh' ? 'pending_approval' : 'approved'),
      approvedBy: meta.approvedBy || '',
      reason: meta.reason || '',
      otRequest: meta.otRequest || {
        isRequested: Number(r.ot_hours || 0) > 0,
        hours: Number(r.ot_hours || 0),
        reason: meta.otReason || '',
        status: meta.otStatus || 'approved'
      }
    };
  });
}

export async function saveAttendance(log: AttendanceLog) {
  const checkIn = log.checkInTime.replace(' น.', '').trim();
  const checkOut = log.checkOutTime ? log.checkOutTime.replace(' น.', '').trim() : null;

  const meta = {
    photoUrl: log.photoUrl || '',
    photoUrlOut: log.photoUrlOut || '',
    siteName: log.siteName || '',
    role: log.role || '',
    gpsLocOut: log.gpsLocOut || '',
    isOvertime: log.isOvertime || false,
    
    attendanceType: log.attendanceType || 'normal',
    approvalStatus: log.approvalStatus || 'approved',
    approvedBy: log.approvedBy || '',
    reason: log.reason || '',
    otRequest: log.otRequest || null,
    otReason: log.otRequest?.reason || '',
    otStatus: log.otRequest?.status || 'approved'
  };

  const payload = {
    id: toUUID(log.id),
    employee_name: log.employeeName,
    check_in: checkIn.length === 5 ? checkIn + ':00' : (checkIn.length === 8 ? checkIn : '08:00:00'),
    check_out: checkOut ? (checkOut.length === 5 ? checkOut + ':00' : (checkOut.length === 8 ? checkOut : null)) : null,
    work_date: log.workDate || new Date().toISOString().split('T')[0],
    gps_coordinates: log.gpsLocIn || '18.7961, 98.9792',
    photo_url: JSON.stringify(meta),
    status: log.status || 'present',
    ot_hours: log.otRequest?.isRequested ? log.otRequest.hours : (log.isOvertime ? 2.0 : 0.0)
  };
  await supabase.from('work_attendances').upsert(payload);
}

export async function clearAllAttendances() {
  await supabase.from('work_attendances').delete().neq('employee_name', '');
}

export async function deleteAttendance(id: string) {
  await supabase.from('work_attendances').delete().eq('id', toUUID(id));
}

// 6. MECHANICAL REPAIRS MAPPINGS
export async function getRepairs(): Promise<RepairRequest[]> {
  const data = await runQuery(supabase.from('repair_requests').select('*'), null);
  if (!data) {
    return [];
  }
  return data.map((r: any) => ({
    id: toUUID(r.id),
    machineryId: toUUID(r.machinery_id),
    reporterName: r.reporter_name,
    problemDesc: r.problem_desc,
    urgency: r.urgency || 'medium',
    gpsLoc: r.gps_location || '18.7961, 98.9792',
    status: r.status || 'reported',
    assignedTech: r.assigned_tech || '',
    hoursMeterRecorded: Number(r.hours_meter_recorded || 0),
    photoUrl: r.reporter_photo_url || '',
    videoUrlMock: r.video_url_mock || '',
    checklist: r.checklist || [],
    signature: r.signature_base64 || '',
    beforePhoto: r.before_photo || '',
    afterPhoto: r.after_photo || '',
    timestamp: new Date(r.created_at || Date.now()).toISOString().replace('T', ' ').substring(0, 16)
  }));
}

export async function saveRepair(rep: RepairRequest) {
  const payload = {
    id: toUUID(rep.id),
    machinery_id: toUUID(rep.machineryId),
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
  await supabase.from('repair_requests').delete().eq('id', toUUID(id));
}

// 7. REFUEL SERVICES MAPPINGS
export async function getRefuels(machList: HeavyMachinery[]): Promise<RefuelStatus[]> {
  const data = await runQuery(supabase.from('fuel_services').select('*'), null);
  if (!data) {
    return [];
  }
  return data.map((r: any) => {
    const mach = machList.find(m => m.id === toUUID(r.machinery_id));
    return {
      id: toUUID(r.id),
      documentNo: r.document_no || `FUEL-${r.id.substring(0,8).toUpperCase()}`,
      date: r.refuel_date || new Date().toISOString().split('T')[0],
      machineryId: toUUID(r.machinery_id),
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
    id: toUUID(ref.id),
    document_no: ref.documentNo,
    machinery_id: toUUID(ref.machineryId),
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
  if (!data) {
    return [];
  }
  return data.map((r: any) => ({
    id: toUUID(r.id),
    date: r.expense_date || new Date().toISOString().split('T')[0],
    category: r.category || 'other',
    description: r.description || '',
    amount: Number(r.amount || 0),
    receiptPhoto: r.receipt_photo_url || '',
    siteLocation: r.site_location || 'ไซต์งานหลัก CMMS',
    recordedBy: r.recorded_by || 'Admin',
    machineryId: r.machinery_id ? toUUID(r.machinery_id) : undefined
  }));
}

export async function saveExpense(exp: ExpenseRecord) {
  const payload = {
    id: toUUID(exp.id),
    expense_date: exp.date,
    category: exp.category,
    description: exp.description,
    amount: exp.amount,
    receipt_photo_url: exp.receiptPhoto || '',
    site_location: exp.siteLocation,
    recorded_by: exp.recordedBy,
    machinery_id: exp.machineryId ? toUUID(exp.machineryId) : null
  };
  await supabase.from('expense_records').upsert(payload);
}

export async function deleteExpense(id: string) {
  await supabase.from('expense_records').delete().eq('id', toUUID(id));
}

// 9. GOOGLE DRIVE UPLOADS MAPPINGS
export async function getGoogleDriveUploads(): Promise<GoogleDriveUpload[]> {
  const data = await runQuery(supabase.from('google_drive_uploads').select('*'), null);
  if (!data) {
    return [];
  }
  return data.map((r: any) => ({
    id: toUUID(r.id),
    fileName: r.file_name || '',
    fileUrl: r.file_url || '',
    driveFileId: r.drive_file_id || '',
    uploadDate: r.upload_date || new Date().toISOString(),
    uploadBy: r.upload_by || 'Unknown',
    module: r.module || '',
    documentNo: r.document_no || ''
  }));
}

export async function saveGoogleDriveUpload(upload: GoogleDriveUpload) {
  const payload = {
    id: toUUID(upload.id),
    file_name: upload.fileName,
    file_url: upload.fileUrl,
    drive_file_id: upload.driveFileId,
    upload_date: upload.uploadDate,
    upload_by: upload.uploadBy,
    module: upload.module,
    document_no: upload.documentNo
  };
  await supabase.from('google_drive_uploads').upsert(payload);
}

// 10. LINE SETTINGS MAPPINGS (ระบบดึงค่าตั้งค่าไลน์แจ้งเตือนข้ามกลุ่ม)
export async function getLineSettingsFromDb(): Promise<LineSettingItem[]> {
  try {
    const { data, error } = await supabase.from('line_settings').select('*');
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table') || error.message?.includes('relation "public.line_settings" does not exist')) {
        console.info('[Supabase Service] Table line_settings not found yet in schema cache. Using default environment configs.');
        return [];
      }
      console.warn('Supabase DB Query warning (line_settings):', error);
      return [];
    }
    if (!data) return [];
    return data.map((r: any) => ({
      id: r.id,
      moduleName: r.module_name as 'attendance' | 'operations' | 'fuel' | 'fallback' | 'test',
      channelAccessToken: r.channel_access_token || '',
      groupId: r.group_id || '',
      createdAt: r.created_at
    }));
  } catch (err) {
    console.warn('[Supabase Service] Error loading line_settings, using local config fallbacks:', err);
    return [];
  }
}

export async function saveLineSettingsToDb(item: LineSettingItem) {
  try {
    const payload: any = {
      module_name: item.moduleName,
      channel_access_token: item.channelAccessToken,
      group_id: item.groupId
    };
    if (item.id) {
      payload.id = item.id;
    }
    const { error } = await supabase.from('line_settings').upsert(payload, { onConflict: 'module_name' });
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table') || error.message?.includes('relation "public.line_settings" does not exist')) {
        throw new Error("ตาราง 'line_settings' ยังไม่ได้ถูกสร้างในระบบฐานข้อมูล Supabase กรุณานำสคริปต์ SQL ในหน้า 'พิมพ์โครงสร้างฐานข้อมูล (SQL)' ไปรันในหน้า SQL Editor ของ Supabase เพื่อสร้างตารางก่อนทำการบันทึก");
      }
      throw error;
    }
  } catch (err: any) {
    console.error("saveLineSettingsToDb error:", err);
    throw err;
  }
}

// 11. EMPLOYEE PROFILE MAPPINGS
export async function getEmployeeProfiles(): Promise<EmployeeProfile[]> {
  try {
    const { data, error } = await supabase.from('employee_profiles').select('*').order('created_at', { ascending: false });
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('relation "public.employee_profiles" does not exist') || error.message?.includes('relation "employee_profiles" does not exist')) {
        console.warn('Table employee_profiles not found, using empty array.');
        return [];
      }
      console.warn('Supabase DB Query warning (employee_profiles):', error);
      return [];
    }
    if (!data) return [];
    return data.map((r: any) => ({
      id: toUUID(r.id),
      name: r.name,
      role: r.role,
      photoUrl: r.photo_url || '',
      createdAt: r.created_at
    }));
  } catch (err) {
    console.warn('[Supabase Service] Error loading employee_profiles:', err);
    return [];
  }
}

export async function getEmployeeProfileByName(name: string): Promise<EmployeeProfile | null> {
  try {
    if (!name) return null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(name);
    let data = null;
    if (isUuid) {
      const { data: uuidData } = await supabase.from('employee_profiles').select('*').eq('id', name).maybeSingle();
      data = uuidData;
    }
    if (!data) {
      const { data: nameData } = await supabase.from('employee_profiles').select('*').eq('name', name).maybeSingle();
      data = nameData;
    }
    if (!data) return null;
    return {
      id: toUUID(data.id),
      name: data.name,
      role: data.role,
      photoUrl: data.photo_url || '',
      createdAt: data.created_at
    };
  } catch (err) {
    console.warn('[Supabase Service] Error loading employee_profile by name or id:', err);
    return null;
  }
}

export async function saveEmployeeProfile(emp: EmployeeProfile) {
  const startTime = Date.now();
  const payload = {
    id: toUUID(emp.id),
    name: emp.name,
    role: emp.role,
    photo_url: emp.photoUrl
  };
  
  console.log(`📡 [Supabase DEBUG Mutation Initiated] saveEmployeeProfile calling upsert...`, {
    action: 'SAVE_EMPLOYEE_PROFILE',
    payloadCleaned: { id: payload.id, name: payload.name, role: payload.role, hasPhoto: !!payload.photo_url }
  });

  try {
    const { error, status, statusText } = await supabase.from('employee_profiles').upsert(payload);
    const duration = Date.now() - startTime;

    if (error) {
      console.error(`❌ [Supabase DEBUG Mutation Error] Fail to save employee profile in "${duration}ms" with status ${status} (${statusText}):`, {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });

      if (error.code === '42P01' || error.message?.includes('relation "public.employee_profiles" does not exist') || error.message?.includes('relation "employee_profiles" does not exist')) {
        throw new Error("ตาราง 'employee_profiles' ยังไม่ได้ถูกสร้างในระบบฐานข้อมูล Supabase กรุณานำสคริปต์ SQL ในหน้า 'พิมพ์โครงสร้างฐานข้อมูล (SQL)' ไปรันในหน้า SQL Editor ของ Supabase เพื่อสร้างตารางก่อน");
      }
      throw error;
    }

    console.log(`✅ [Supabase DEBUG Mutation Success] Employee profile saved to Supabase in "${duration}ms" with status ${status}. Name: "${emp.name}"`);
  } catch (err: any) {
    const duration = Date.now() - startTime;
    console.error(`🚨 [Supabase DEBUG Mutation Exception] Fatal exception saving employee profile in "${duration}ms":`, {
      message: err?.message || String(err),
      stack: err?.stack
    });
    throw err;
  }
}

export async function deleteEmployeeProfile(id: string) {
  const startTime = Date.now();
  const uuid = toUUID(id);
  console.log(`📡 [Supabase DEBUG Mutation Initiated] deleteEmployeeProfile for ID: "${uuid}"`);

  try {
    const { error, status, statusText } = await supabase.from('employee_profiles').delete().eq('id', uuid);
    const duration = Date.now() - startTime;

    if (error) {
      console.error(`❌ [Supabase DEBUG Mutation Error] Fail to delete employee profile in "${duration}ms" with status ${status}:`, {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log(`✅ [Supabase DEBUG Mutation Success] Employee profile ID "${uuid}" deleted in "${duration}ms" with status ${status}.`);
  } catch (err: any) {
    const duration = Date.now() - startTime;
    console.error(`🚨 [Supabase DEBUG Mutation Exception] Fatal exception deleting employee profile in "${duration}ms":`, {
      message: err?.message || String(err),
      stack: err?.stack
    });
    throw err;
  }
}

