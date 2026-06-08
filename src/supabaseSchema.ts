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

-- 12. LINE Multigroup Notification Settings Table (ตารางระบบตั้งค่าไลน์แยกกลุ่มส่งสติ๊กเกอร์สแกนเวลาด่วน)
CREATE TABLE line_settings (
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

-- 14. Employee Profiles Table (ตารางรายชื่อพนักงานที่ลงทะเบียน)
CREATE TABLE IF NOT EXISTS employee_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL,
    role VARCHAR(150) NOT NULL,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Seed default employees
INSERT INTO employee_profiles (name, role, photo_url) VALUES
('Admin2.ชัยนาวิน', 'แอดมินฝ่ายประสานงานกลาง', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250'),
('AE.ชัยนาวิน (บิว)', 'เจ้าหน้าที่ฝ่ายประสานงานขาย (AE)', 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&q=80&w=250'),
('BIWTY', 'เจ้าหน้าที่สนับสนุนโครงการ (บิวตี้)', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=250'),
('chalwat', 'ช่างเทคนิคและวิศวกรซ่อมคุมงาน', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=250'),
('cnw.นำหน้า', 'โฟร์แมนนำทีมเครื่องจักรชัยนาวิน', 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=250'),
('Max', 'หัวหน้าฝ่ายเทคโนโลยีสนาม (แม็กซ์)', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250'),
('Non. นนทนันท์ 5', 'ผู้ช่วยช่างควบคุมเครื่องเกรดเบอร์ 5', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=250'),
('Sitthichai. wongdee', 'ช่างคุมระบบไฟฟ้าและเครื่องกำเนิดไฟ', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=250'),
('WAVE', 'ช่างซ่อมบำรุงและเครื่องยนต์ดีเซล', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=250'),
('^ SONGPON ^', 'ช่างควบคุมเครื่องขุดระดับสูง (ทรงพล)', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250'),
('ช.ชาย เด็กผู้พันตรี', 'ช่างคุมงานตักลานหินบด', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=250'),
('ธชัย สระทองเขียว', 'โฟร์แมนควบคุมกะก่อสร้างงานดิน', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=250'),
('นา', 'แอดมินการเงินและตรวจสอบเวลา', 'https://images.unsplash.com/photo-1489980508314-941910ded1f4?auto=format&fit=crop&q=80&w=250'),
('ยศ', 'เจ้าหน้าที่สโตร์ส่วนภูมิภาค', 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=250'),
('สุธา ภูชะหาร', 'ผู้ดูแลกะคนขับรถพ่วงและหัวลาก', 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80&w=250'),
('อั้ม. อนุสรณ์', 'ฝ่ายซ่อมบำรุงหนักและยางเครื่องคลาน', 'https://images.unsplash.com/photo-1464746133101-a2c3f88e0dd9?auto=format&fit=crop&q=80&w=250'),
('เกด 24', 'ผู้จัดการแอดมินบริหารงานบุคคล', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=250'),
('เป๊ก', 'พนักงานขับรถส่งเครื่องจักรกลหนัก', 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=250'),
('เหว่า', 'ช่างเทคนิคซ่อมรถเกรดเดอร์ปูผิว', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250'),
('๕ กัลยา', 'ฝ่ายจัดการบัญชีเจ้าหนี้ (กัลยา)', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250'),
('Benz o Nares', 'วิศวกรควบคุมงานขุดเขื่อนระเบิดหิน', 'https://images.unsplash.com/photo-1542343633-ce7a216222e3?auto=format&fit=crop&q=80&w=250')
ON CONFLICT (name) DO NOTHING;

-- Indexes for Speed Performance Optimization
CREATE INDEX idx_mach_status ON heavy_machinery(status);
CREATE INDEX idx_task_due ON work_schedule_tasks(due_date, status);
CREATE INDEX idx_repair_mach ON repair_requests(machinery_id, status);
CREATE INDEX idx_fuel_mach ON fuel_services(machinery_id, status);
CREATE INDEX idx_expense_cat ON expense_records(category, expense_date);
`;
