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
    timeline JSONB DEFAULT '[]'::jsonb,
    comments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Spare Parts Stock Table (ตารางคลังอะไหล่และพัสดุ)
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

-- 4. Inventory Issuance (ตารางเบิกจ่าย/คืนพัสดุ)
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

-- 5. Work Attendance (ตารางลงคะแนนลงเวลาการทำงานผ่านพิกัด GPS)
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

-- 6. Mechanical Repair Requests (ตารางระบบรับแจ้งซ่อมเครื่องจักรหนัก)
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

-- 7. Preventive Maintenance (ตารางแผนซ่อมบำรุงเชิงป้องกัน)
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

-- 8. Fuel Request and Complete Service Table (ระบบใบเบิกและบันทึกจ่ายเติมน้ำมันจริง)
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

-- 9. Site Expense Records Table (ตารางบันทึกรายจ่ายโครงการ)
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

-- 10. Google Drive Uploads Table (ตารางบันทึกประวัติการอัปโหลดเข้าคลังภาพไดรฟ์)
CREATE TABLE google_drive_uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    drive_file_id VARCHAR(100) NOT NULL,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    upload_by VARCHAR(150),
    module VARCHAR(100),
    document_no VARCHAR(100)
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
`;
