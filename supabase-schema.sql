-- FlowWork CMMS 360 - Database Schema Design (For Supabase / PostgreSQL)

-- Drop existing tables to allow safe re-run
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS expense_records CASCADE;
DROP TABLE IF EXISTS fuel_services CASCADE;
DROP TABLE IF EXISTS preventive_maintenances CASCADE;
DROP TABLE IF EXISTS repair_requests CASCADE;
DROP TABLE IF EXISTS work_attendances CASCADE;
DROP TABLE IF EXISTS inventory_issuances CASCADE;
DROP TABLE IF EXISTS stock_items CASCADE;
DROP TABLE IF EXISTS task_comments CASCADE;
DROP TABLE IF EXISTS work_schedule_tasks CASCADE;
DROP TABLE IF EXISTS heavy_machinery CASCADE;

-- 1. Heavy Machinery Table (ตารางทะเบียนเครื่องจักรหนัก)
CREATE TABLE heavy_machinery (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
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

-- 12. Google Drive Uploaded Files Database
CREATE TABLE IF NOT EXISTS google_drive_uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    drive_file_id VARCHAR(100) NOT NULL,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    upload_by VARCHAR(150),
    module VARCHAR(100) NOT NULL,
    document_no VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 13. LINE Multigroup Notification Settings Table (ตารางระบบตั้งค่าไลน์แยกกลุ่มส่งสติ๊กเกอร์สแกนเวลาด่วน)
CREATE TABLE IF NOT EXISTS line_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    module_name VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'attendance', 'operations', 'fuel', 'test', 'fallback'
    channel_access_token TEXT,
    group_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Seed default settings
INSERT INTO line_settings (module_name, channel_access_token, group_id) VALUES
('attendance', '', ''),
('operations', '', ''),
('fuel', '', ''),
('test', '', ''),
('fallback', '', '')
ON CONFLICT (module_name) DO NOTHING;

