import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Check, 
  Eye, 
  EyeOff, 
  MessageSquare, 
  Info, 
  Lock, 
  AlertCircle, 
  Wrench, 
  UserCheck, 
  Fuel, 
  Sparkles,
  HelpCircle,
  Beaker,
  Settings,
  RefreshCw,
  ArrowRight,
  Database,
  CloudLightning
} from 'lucide-react';
import { pushLineFlexMessage, testLineNotification, convertGoogleDriveUrl, extractGoogleDriveFileId, ensureValidImageUrl } from '../utils/lineNotify';
import { getLineSettingsFromDb, saveLineSettingsToDb, getEmployeeProfiles } from '../supabaseService';

export default function LineSettingsView() {
  // Sync state
  const [dbLoading, setDbLoading] = useState(true);

  // Diagnostics State
  const [diagnosticRecords, setDiagnosticRecords] = useState<any[]>([]);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [diagnosticRunCount, setDiagnosticRunCount] = useState(0);

  const runUrlDiagnostics = async () => {
    try {
      setDiagnosticLoading(true);
      console.log("============= STARTING PHOTO URL DIAGNOSTICS =============");
      const profiles = await getEmployeeProfiles();
      console.log(`Retrieved ${profiles.length} employee profiles from database.`);
      
      const analyzed = profiles.map(p => {
        const rawUrl = p.photoUrl || "";
        const convertedUrl = convertGoogleDriveUrl(rawUrl);
        const extractedId = extractGoogleDriveFileId(convertedUrl);
        const finalUrl = ensureValidImageUrl(rawUrl);
        
        console.group(`🔍 AUDIT: Profile for ${p.name}`);
        console.log(`👤 Name:`, p.name);
        console.log(`🆔 ID:`, p.id);
        console.log(`📂 Raw stored photo_url in DB:`, rawUrl || "(empty)");
        console.log(`🔄 After convertGoogleDriveUrl():`, convertedUrl || "(empty)");
        console.log(`🆔 Extracted Google Drive File ID:`, extractedId || "(no match)");
        console.log(`🌐 Final validated URL mapped for LINE:`, finalUrl || "(invalid / empty)");
        console.log(`📢 Expected Pattern Match:`, finalUrl.includes('drive.google.com/uc?export=view&id=') ? '✅ VALID DRIVE DIRECT LINK' : '⚠️ OTHER FORMAT OR EMPTY');
        console.groupEnd();

        return {
          id: p.id,
          name: p.name,
          role: p.role,
          rawUrl,
          convertedUrl,
          extractedId,
          finalUrl,
          isDrive: !!extractedId,
          isValid: !!finalUrl
        };
      });

      setDiagnosticRecords(analyzed);
      setDiagnosticRunCount(prev => prev + 1);
      console.log("============= PHOTO URL DIAGNOSTICS COMPLETED =============");
    } catch (err) {
      console.error("Error running database diagnostics:", err);
    } finally {
      setDiagnosticLoading(false);
    }
  };

  useEffect(() => {
    runUrlDiagnostics();
  }, []);

  // Group 1: Attendance
  const [tokenAttendance, setTokenAttendance] = useState(() => localStorage.getItem('LINE_TOKEN_ATTENDANCE') || 'emexPY8OBr3kHbSKKDRNh9W33tnL9dHqLxtD3Zqwx6fYBpy7UMv6BqU65FAJ8L1VhXdmqb7nE9H/AmyijvpPnNlcFgob0ET7ysPGosTEO33GgL6ccIn60mxibiOrEZ47yVH+EkKWcsTOX+RUhI7U6gdB04t89/1O/w1cDnyilFU=');
  const [groupAttendance, setGroupAttendance] = useState(() => localStorage.getItem('LINE_GROUP_ATTENDANCE') || 'Cfd9f3c46111cf32db3e3e69b6961fa3e');
  
  // Group 2: Work/General
  const [tokenWork, setTokenWork] = useState(() => localStorage.getItem('LINE_TOKEN_WORK') || '');
  const [groupWork, setGroupWork] = useState(() => localStorage.getItem('LINE_GROUP_WORK') || '');
  
  // Group 3: Fueling
  const [tokenFuel, setTokenFuel] = useState(() => localStorage.getItem('LINE_TOKEN_FUEL') || '');
  const [groupFuel, setGroupFuel] = useState(() => localStorage.getItem('LINE_GROUP_FUEL') || '');

  // Group 4: Testing (ส่งทดสอบ ทุกระบบ / Sandbox)
  const [tokenTest, setTokenTest] = useState(() => localStorage.getItem('LINE_TOKEN_TEST') || '');
  const [groupTest, setGroupTest] = useState(() => localStorage.getItem('LINE_GROUP_TEST') || '');

  // Fallback Channel Access Token
  const [fallbackToken, setFallbackToken] = useState(() => localStorage.getItem('LINE_CHANNEL_ACCESS_TOKEN') || '');

  // UI state
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({
    attendance: false,
    work: false,
    fuel: false,
    test: false,
    fallback: false
  });

  const [testStatus, setTestStatus] = useState<Record<string, { loading: boolean; success?: boolean; error?: string; simulated?: boolean; warning?: string }>>({
    attendance: { loading: false },
    work: { loading: false },
    fuel: { loading: false },
    test: { loading: false }
  });

  const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({
    attendance: false,
    work: false,
    fuel: false,
    test: false,
    fallback: false
  });

  // Load from Supabase on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        setDbLoading(true);
        const settings = await getLineSettingsFromDb();
        if (settings && settings.length > 0) {
          settings.forEach(item => {
            if (item.moduleName === 'attendance') {
              setTokenAttendance(item.channelAccessToken || 'emexPY8OBr3kHbSKKDRNh9W33tnL9dHqLxtD3Zqwx6fYBpy7UMv6BqU65FAJ8L1VhXdmqb7nE9H/AmyijvpPnNlcFgob0ET7ysPGosTEO33GgL6ccIn60mxibiOrEZ47yVH+EkKWcsTOX+RUhI7U6gdB04t89/1O/w1cDnyilFU=');
              setGroupAttendance(item.groupId || 'Cfd9f3c46111cf32db3e3e69b6961fa3e');
            } else if (item.moduleName === 'operations') {
              setTokenWork(item.channelAccessToken || '');
              setGroupWork(item.groupId || '');
            } else if (item.moduleName === 'fuel') {
              setTokenFuel(item.channelAccessToken || '');
              setGroupFuel(item.groupId || '');
            } else if (item.moduleName === 'test') {
              setTokenTest(item.channelAccessToken || '');
              setGroupTest(item.groupId || '');
            } else if (item.moduleName === 'fallback') {
              setFallbackToken(item.channelAccessToken || '');
            }
          });
        }
      } catch (err) {
        console.error("Failed to load settings from DB:", err);
      } finally {
        setDbLoading(false);
      }
    }
    loadSettings();
  }, []);

  const toggleShowToken = (key: string) => {
    setShowTokens(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async (category: 'attendance' | 'work' | 'fuel' | 'fallback' | 'test') => {
    let activeToken = '';
    let activeGroup = '';

    if (category === 'attendance') {
      activeToken = tokenAttendance;
      activeGroup = groupAttendance;
      localStorage.setItem('LINE_TOKEN_ATTENDANCE', tokenAttendance);
      localStorage.setItem('LINE_GROUP_ATTENDANCE', groupAttendance);
    } else if (category === 'work') {
      activeToken = tokenWork;
      activeGroup = groupWork;
      localStorage.setItem('LINE_TOKEN_WORK', tokenWork);
      localStorage.setItem('LINE_GROUP_WORK', groupWork);
      localStorage.setItem('LINE_TOKEN_OPERATIONS', tokenWork);
      localStorage.setItem('LINE_GROUP_OPERATIONS', groupWork);
    } else if (category === 'fuel') {
      activeToken = tokenFuel;
      activeGroup = groupFuel;
      localStorage.setItem('LINE_TOKEN_FUEL', tokenFuel);
      localStorage.setItem('LINE_GROUP_FUEL', groupFuel);
    } else if (category === 'test') {
      activeToken = tokenTest;
      activeGroup = groupTest;
      localStorage.setItem('LINE_TOKEN_TEST', tokenTest);
      localStorage.setItem('LINE_GROUP_TEST', groupTest);
    } else if (category === 'fallback') {
      activeToken = fallbackToken;
      activeGroup = '';
      localStorage.setItem('LINE_CHANNEL_ACCESS_TOKEN', fallbackToken);
    }

    try {
      const dbCategory = category === 'work' ? 'operations' : category;
      await saveLineSettingsToDb({
        moduleName: dbCategory,
        channelAccessToken: activeToken,
        groupId: activeGroup
      });
    } catch (err) {
      console.error(`Failed to save ${category} settings to Supabase DB:`, err);
    }

    setSavedStatus(prev => ({ ...prev, [category]: true }));
    setTimeout(() => {
      setSavedStatus(prev => ({ ...prev, [category]: false }));
    }, 2000);
  };

  const cleanAll = async (category: 'attendance' | 'work' | 'fuel' | 'test') => {
    if (confirm('คุณต้องการรีเซ็ตการตั้งค่ากลุ่มนี้กลับเป็นค่าเริ่มต้นหลักของระบบ ใช่หรือไม่?')) {
      if (category === 'attendance') {
        setTokenAttendance('');
        setGroupAttendance('');
        localStorage.removeItem('LINE_TOKEN_ATTENDANCE');
        localStorage.removeItem('LINE_GROUP_ATTENDANCE');
        await saveLineSettingsToDb({ moduleName: 'attendance', channelAccessToken: '', groupId: '' });
      } else if (category === 'work') {
        setTokenWork('');
        setGroupWork('');
        localStorage.removeItem('LINE_TOKEN_WORK');
        localStorage.removeItem('LINE_GROUP_WORK');
        localStorage.removeItem('LINE_TOKEN_OPERATIONS');
        localStorage.removeItem('LINE_GROUP_OPERATIONS');
        await saveLineSettingsToDb({ moduleName: 'operations', channelAccessToken: '', groupId: '' });
      } else if (category === 'fuel') {
        setTokenFuel('');
        setGroupFuel('');
        localStorage.removeItem('LINE_TOKEN_FUEL');
        localStorage.removeItem('LINE_GROUP_FUEL');
        await saveLineSettingsToDb({ moduleName: 'fuel', channelAccessToken: '', groupId: '' });
      } else if (category === 'test') {
        setTokenTest('');
        setGroupTest('');
        localStorage.removeItem('LINE_TOKEN_TEST');
        localStorage.removeItem('LINE_GROUP_TEST');
        await saveLineSettingsToDb({ moduleName: 'test', channelAccessToken: '', groupId: '' });
      }
    }
  };

  const handleTestConnection = async (category: 'attendance' | 'work' | 'fuel' | 'test') => {
    // Save current states first to ensure everything is synced
    await handleSave(category);

    setTestStatus(prev => ({ ...prev, [category]: { loading: true } }));

    try {
      const dbCategory = category === 'work' ? 'operations' : category;
      const result = await testLineNotification(dbCategory);
      if (result.success) {
        setTestStatus(prev => ({ 
          ...prev, 
          [category]: { 
            loading: false, 
            success: true, 
            simulated: result.simulated, 
            warning: result.warning 
          } 
        }));
      } else {
        setTestStatus(prev => ({ ...prev, [category]: { loading: false, success: false, error: result.error } }));
      }
    } catch (err: any) {
      setTestStatus(prev => ({ ...prev, [category]: { loading: false, success: false, error: err.message } }));
    }
  };

  const handleTestAllSystemsToTestGroup = async () => {
    // Save current states first to ensure everything is synced
    await handleSave('test');

    setTestStatus(prev => ({ ...prev, test: { loading: true } }));

    const test1Attendance = {
      "type": "bubble",
      "size": "mega",
      "header": {
        "type": "box",
        "layout": "vertical",
        "backgroundColor": "#6f42c1",
        "paddingAll": "xl",
        "contents": [
          { "type": "text", "text": "🕒 [กลุ่มลงเวลากล้อง GPS] สัญญาณทดสอบ", "color": "#ffffff", "weight": "bold", "size": "md" }
        ]
      },
      "body": {
        "type": "box",
        "layout": "vertical",
        "paddingAll": "xl",
        "contents": [
          {
            "type": "box",
            "layout": "vertical",
            "spacing": "xs",
            "contents": [
              { "type": "text", "text": "🟢 เช็คเวลากล้องพิกัด: นายศักดิ์ชาย ทองมี", "size": "sm", "weight": "bold" },
              { "type": "text", "text": "เวลาลงทะเบียน: " + new Date().toLocaleTimeString('th-TH') + " น.", "size": "xs", "color": "#1e293b" },
              { "type": "text", "text": "ค่าความแม่นยำ GPS: 98.7% (ผ่านระบบตรวจพิกัดหน้างาน)", "size": "xs", "color": "#64748b" }
            ]
          }
        ]
      }
    };

    const test2Work = {
      "type": "bubble",
      "size": "mega",
      "header": {
        "type": "box",
        "layout": "vertical",
        "backgroundColor": "#0284c7",
        "paddingAll": "xl",
        "contents": [
          { "type": "text", "text": "⚙️ [แผนงาน/ซ่อมบำรุง] สัญญาณทดสอบ", "color": "#ffffff", "weight": "bold", "size": "md" }
        ]
      },
      "body": {
        "type": "box",
        "layout": "vertical",
        "paddingAll": "xl",
        "contents": [
          {
            "type": "box",
            "layout": "vertical",
            "spacing": "xs",
            "contents": [
              { "type": "text", "text": "🟢 ใบแจ้งซ่อมหมายเลข: WO-94827", "size": "sm", "weight": "bold" },
              { "type": "text", "text": "เครื่องจักร: รถตัก Caterpillar 950GC", "size": "xs", "color": "#1e293b" },
              { "type": "text", "text": "อาการเสียหาย: ซีลน้ำมันไฮดรอลิกรั่วซึม", "size": "xs", "color": "#64748b" },
              { "type": "text", "text": "ความเร่งด่วน: ปานกลาง (PM - ซ่อมบำรุงเชิงป้องกัน)", "size": "xs", "color": "#1e293b" }
            ]
          }
        ]
      }
    };

    const test3Fuel = {
      "type": "bubble",
      "size": "mega",
      "header": {
        "type": "box",
        "layout": "vertical",
        "backgroundColor": "#b45309",
        "paddingAll": "xl",
        "contents": [
          { "type": "text", "text": "⛽ [กลุ่มเบิกเติมน้ำมัน] สัญญาณทดสอบ", "color": "#ffffff", "weight": "bold", "size": "md" }
        ]
      },
      "body": {
        "type": "box",
        "layout": "vertical",
        "paddingAll": "xl",
        "contents": [
          {
            "type": "box",
            "layout": "vertical",
            "spacing": "xs",
            "contents": [
              { "type": "text", "text": "🟢 ส่งอนุมัติเบิกจ่าย: บี20 ดีเซล 400 ลิตร", "size": "sm", "weight": "bold" },
              { "type": "text", "text": "อุปกรณ์รับเชื้อเพลิง: เครื่องกำเนิดไฟฟ้าดีเซล GEN-04", "size": "xs", "color": "#1e293b" },
              { "type": "text", "text": "คนรถ/ผู้เบิก: วิศวกร อุดม นามเจริญ", "size": "xs", "color": "#64748b" }
            ]
          }
        ]
      }
    };

    try {
      const res1 = await pushLineFlexMessage(test1Attendance, 'test');
      const res2 = await pushLineFlexMessage(test2Work, 'test');
      const res3 = await pushLineFlexMessage(test3Fuel, 'test');

      if (res1.success && res2.success && res3.success) {
        setTestStatus(prev => ({ ...prev, test: { loading: false, success: true } }));
      } else {
        const errors = [res1.error, res2.error, res3.error].filter(Boolean).join(' | ');
        setTestStatus(prev => ({ ...prev, test: { loading: false, success: false, error: errors || 'ส่งสำเร็จบางส่วน' } }));
      }
    } catch (err: any) {
      setTestStatus(prev => ({ ...prev, test: { loading: false, success: false, error: err.message } }));
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6" id="line-multigroups-settings-panel">
      {/* Upper header section with premium aesthetic details */}
      <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border border-indigo-950">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-0 pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -z-0 pointer-events-none"></div>

        <div className="z-10 space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/25 border border-violet-400/20 text-violet-200 text-[10px] font-bold tracking-wider uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" style={{ animationDuration: '3s' }} />
            Enterprise Custom Integration
          </div>
          <h2 className="text-xl md:text-2xl font-display font-black tracking-tight flex items-center gap-2 text-white">
            <Settings className="w-6 h-6 text-indigo-400" />
            ตั้งค่าผู้รับการแจ้งเตือน LINE แยกกลุ่มส่งพิกัดแผนภูมิ
          </h2>
          <p className="text-xs text-indigo-200 leading-normal font-medium">
            ปรับแยกกลุ่มห้อง LINE Notify / LINE Messaging API ขององค์กรอย่างอิสระ 
            เพื่อกรองเนื้อหากระจายข้อมูลให้แผนกและพนักงานผู้รับผิดชอบโดยละเอียด ป้องกันข้อมูลล้นหน้าจอ (Notification Spam)
          </p>
        </div>

        <div className="z-10 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-stone-100 flex flex-col justify-center min-w-[220px]">
          <span className="text-[10px] text-indigo-200 font-extrabold uppercase tracking-wide flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            สถานะฐานข้อมูล Supabase
          </span>
          <div className="text-sm font-black text-emerald-400 mt-1 flex items-center gap-1.5">
            {dbLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-stone-300" />
                <span>กำลังดึงการตั้งค่า...</span>
              </>
            ) : (
              <>
                <CloudLightning className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>ซิงค์ตรงเวลาคลาวด์!</span>
              </>
            )}
          </div>
          <p className="text-[10px] text-stone-300 mt-2 font-bold leading-relaxed">
            🔴 ตรวจรับลงเวลา / แปะ GPS<br />
            🟢 ซ่อมบำรุง / แผนงานประจำวัน<br />
            🟠 คำสั่งจ่ายเบิกเติมเชื้อเพลิง
          </p>
        </div>
      </div>

      {/* Troubleshooting Alert Box */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-5 text-stone-800 space-y-3 shadow-sm" id="line-troubleshooting-help-box">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5 text-amber-700 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-amber-900">🔔 วิธีแก้ไขข้อผิดพลาดระบบแจ้งเตือน LINE (Troubleshooting Guide)</h3>
            <p className="text-xs text-amber-800 leading-relaxed">
              หากระบบขึ้นข้อผิดพลาดหรือเกิดสถานะล้มเหลว <code className="font-mono bg-amber-100 text-amber-950 px-1 py-0.5 rounded text-[11px]">Failed to send messages (400)</code> ในขณะลงเวลางาน หรือกดทดสอบการแจ้งเตือน เป็นเพราะปัจจัยทางเทคนิค 2 ส่วนดังนี้:
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 pl-1 md:pl-13 text-[11px] text-stone-600">
          <div className="space-y-2 bg-white/60 p-3 rounded-2xl border border-amber-150">
            <span className="font-extrabold text-amber-900 block flex items-center gap-1">📍 1. คุณต้องเชิญบ็อต (LINE Bot OA) เข้าร่วมกลุ่มแชทนั้นๆ ก่อน</span>
            <p className="leading-relaxed">
              แม้คุณจะกรอก LINE Group ID ถูกต้อง แต่หากในกลุ่มแชทนั้น <b>ยังไม่ได้เชิญบ็อต (LINE OA) ที่สร้าง Channel Access Token นี้เข้าร่วมกลุ่มแชท</b> ระบบของ LINE API จะบล็อกการโพสต์ข้อความทันทีด้วย Error 400
            </p>
            <span className="text-[10px] text-amber-700 block font-semibold">💡 วิธีแก้ไข: เข้าไปที่กลุ่มแชท LINE ➡️ กดปุ่มเมนูขวาบน ➡️ เลือก 'เชิญ' (Invite) ➡️ ค้นหาบัญชีบ็อตรองรับแล้วเชิญเข้ามาในกลุ่มคู่สนทนาทันที</span>
          </div>

          <div className="space-y-2 bg-white/60 p-3 rounded-2xl border border-amber-150">
            <span className="font-extrabold text-amber-900 block flex items-center gap-1">🔑 2. ต้องเปลี่ยนจาก Group ID / Token แม่แบบมาเป็นของคุณเอง</span>
            <p className="leading-relaxed">
              ค่าเริ่มต้นที่แสดงตอนแรก เป็นกลุ่มแชทพรีวิวกองกลาง หากคุณต้องการส่งเข้าห้องทำงานแผนกของคุณ กรุณาสร้าง LINE Developers Account, ตั้ง LINE OA, ออก Token, ดึง บ็อตเข้ากลุ่ม, นำ Token และ Group ID ของกลุ่มตนเองมากรอกลงเซิร์ฟเวอร์
            </p>
            <span className="text-[10px] text-amber-700 block font-semibold">💡 ข้อสังเกต: รหัสไอดีกลุ่มแชท LINE (Group ID) จะยาว 33 ตัวอักษร และขึ้นต้นด้วยอักษรภาษาอังกฤษ 'C' เสมอ ส่วนไอดีสมาชิกจะขึ้นต้นด้วย 'U'</span>
          </div>

          <div className="space-y-2 bg-white/60 p-3 rounded-2xl border border-amber-150 relative overflow-hidden flex flex-col justify-between">
            <div>
              <span className="font-extrabold text-amber-950 block flex items-center gap-1">☁️ 3. เปิดใช้งาน Google Drive API (สำหรับบันทึกภาพถ่ายหลักฐาน)</span>
              <p className="leading-relaxed mt-1">
                ระบบ FlowWork บันทึกภาพส่งงานและภาพตอกบัตรลงบนคลัง Google Drive ส่วนกลางของโครงการคุณ หากเกิด Error <code className="font-mono bg-amber-100 text-amber-900 text-[10px] px-1 rounded">Google Drive API has not been used before or is disabled</code> แปลว่ายังไม่ได้กดเปิดสิทธิ์ API ด้านเซิร์ฟเวอร์หลัก
              </p>
            </div>
            <div className="pt-2">
              <a 
                href="https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=778841450865" 
                target="_blank" 
                referrerPolicy="no-referrer"
                rel="noreferrer" 
                className="w-full inline-flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-black py-2.5 px-3 rounded-xl transition-all shadow-sm text-center"
              >
                <span>🚀 คลิกเพื่อเปิดใช้งาน Drive API ใน 1 วินาที</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <span className="text-[9px] text-stone-500 mt-1 block text-center font-semibold">🔒 ดำเนินการโดยสมบูรณ์บนคอนโซลพาร์ทเนอร์ Google Cloud</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* ======================= GROUP 1: ATTENDANCE ======================= */}
        <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-violet-50 rounded-full -z-0 pointer-events-none"></div>
          
          <div className="space-y-4 z-10">
            {/* Group Label */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
                  <UserCheck className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-stone-800">1. กลุ่มลงเวลากล้อง GPS</h3>
                  <span className="text-[10px] text-slate-500 font-semibold">Attendance & Location</span>
                </div>
              </div>
              <span className="text-[9.5px] uppercase font-black px-2 py-0.5 rounded bg-violet-100/50 text-violet-700 font-mono tracking-wider">
                Category 1
              </span>
            </div>

            <p className="text-[11px] text-stone-500 leading-normal font-medium">
              ส่งข่าวทันทีเมื่อช่างหน้างานทำสแกนพิกัดกล้อง GPS เข้าและออกงาน ซิงค์ความถูกต้องพร้อมแสดงชื่อพนักงานช่างและภาพถ่ายพยานไปห้องรับเวลาทำงานของกองบุคคล
            </p>

            {/* Inputs */}
            <div className="space-y-3 pt-1">
              {/* Channel Token */}
              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-stone-600 block flex items-center justify-between">
                  <span>Channel Access Token</span>
                  <span className="text-[9px] text-stone-400 italic font-semibold">(ตอกบัตรพนักงาน)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type={showTokens.attendance ? "text" : "password"}
                    value={tokenAttendance}
                    onChange={(e) => setTokenAttendance(e.target.value)}
                    placeholder="กรอก Token ของลงเวลางาน..."
                    className="w-full text-xs pl-8.5 pr-8 py-2 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:border-violet-500 text-stone-800 font-mono outline-none shadow-inner"
                  />
                  <button 
                    type="button"
                    onClick={() => toggleShowToken('attendance')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-stone-400 hover:bg-stone-100 transition-colors"
                  >
                    {showTokens.attendance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Group ID */}
              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-stone-600 block flex items-center justify-between">
                  <span>LINE Group ID</span>
                  <span className="text-[9px] text-stone-400 font-mono">Starts with C...</span>
                </label>
                <input
                  type="text"
                  value={groupAttendance}
                  onChange={(e) => setGroupAttendance(e.target.value)}
                  placeholder="Cxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:border-violet-500 text-stone-800 font-mono outline-none shadow-inner"
                />
              </div>

              {/* Saved Status Indicator */}
              {savedStatus.attendance && (
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 p-1.5 rounded-lg border border-emerald-150 animate-bounce">
                  <Check className="w-3.5 h-3.5" />
                  บันทึกข้อมูลตอกบัตรเรียบร้อยแล้ว
                </div>
              )}

              {/* Test Status Indicator */}
              {testStatus.attendance.success !== undefined && (
                <div className={`text-[10px] p-2 rounded-xl border font-semibold ${
                  testStatus.attendance.success 
                    ? (testStatus.attendance.simulated ? 'bg-amber-50 border-amber-250 text-amber-800' : 'bg-emerald-50 border-emerald-150 text-emerald-700') 
                    : 'bg-rose-50 border-rose-150 text-rose-700'
                }`}>
                  {testStatus.attendance.success ? (
                    testStatus.attendance.simulated ? (
                      <span>⚠️ {testStatus.attendance.warning}</span>
                    ) : (
                      <span>🟢 สำเร็จ! ข้อความสติ๊กเกอร์แจ้งพิกัดส่งเข้าห้องแชทสำเร็จแล้ว</span>
                    )
                  ) : (
                    <span>🔴 ล้มเหลว: {testStatus.attendance.error || 'โทเค็นปฏิเสธการเชื่อมต่อ'}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-5 pt-3 border-t border-stone-100 flex flex-col gap-2 z-10 w-full">
            <button
              onClick={() => handleSave('attendance')}
              className="w-full bg-violet-600 hover:bg-violet-700 active:scale-95 text-white py-2 rounded-xl text-xs font-extrabold tracking-wide shadow-sm transition-all text-center cursor-pointer"
            >
              บันทึกการตั้งค่าลงเครื่องเซิร์ฟเวอร์
            </button>
            <div className="flex items-center gap-2 w-full mt-1">
              <button
                onClick={() => handleTestConnection('attendance')}
                disabled={testStatus.attendance.loading}
                title="ส่งคำเตือนทดสอบเข้าไปในกรุ๊ปสแกนอัตโนมัติ"
                className="flex-1 px-3 py-2.5 rounded-xl border border-violet-200 hover:border-violet-300 bg-violet-50 hover:bg-violet-100/70 text-violet-800 flex items-center justify-center gap-1.5 text-xs font-black active:scale-95 transition-all cursor-pointer disabled:opacity-40"
              >
                {testStatus.attendance.loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-violet-700" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Test Notification (ลงเวลา)</span>
                  </>
                )}
              </button>
              <button
                onClick={() => cleanAll('attendance')}
                title="ล้างส่วนตัวกลับไปเป็นเซิร์ฟเวอร์หลัก"
                className="p-2 px-3 rounded-xl border border-stone-200 hover:bg-stone-50 font-bold font-mono text-xs text-stone-400 hover:text-stone-600 transition-all active:scale-95 cursor-pointer"
              >
                ล้างค่า
              </button>
            </div>
          </div>
        </div>

        {/* ======================= GROUP 2: WORK / JOB OPS ======================= */}
        <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-sky-50 rounded-full -z-0 pointer-events-none"></div>

          <div className="space-y-4 z-10">
            {/* Group Label */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  <Wrench className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-stone-800">2. แผนงาน & ซ่อมบำรุง & คลัง</h3>
                  <span className="text-[10px] text-slate-500 font-semibold">Job Ops, Parts & Repair</span>
                </div>
              </div>
              <span className="text-[9.5px] uppercase font-black px-2 py-0.5 rounded bg-sky-100 text-sky-700 font-mono tracking-wider">
                Category 2
              </span>
            </div>

            <p className="text-[11px] text-stone-500 leading-normal font-medium">
              ส่งข่าวความคืบหน้า งานซ่อมเครื่องยนต์, แผนตารางช่างชลประทาน, การปิดงานเสร็จ, สปาร์ทพาร์ท (การเบิกคลังคืนอะไหล่) รวมถึงสเตตรุ่น PM งานคลังวัสดุ ไปห้องวิศวกรและคลัง
            </p>

            {/* Inputs */}
            <div className="space-y-3 pt-1">
              {/* Channel Token */}
              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-stone-600 block flex items-center justify-between">
                  <span>Channel Access Token</span>
                  <span className="text-[9px] text-stone-400 italic font-semibold">(ส่งข้อความแอดมินคลัง)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type={showTokens.work ? "text" : "password"}
                    value={tokenWork}
                    onChange={(e) => setTokenWork(e.target.value)}
                    placeholder="กรอก Token สำหรับฝ่ายปฏิบัติงาน..."
                    className="w-full text-xs pl-8.5 pr-8 py-2 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:border-sky-500 text-stone-800 font-mono outline-none shadow-inner"
                  />
                  <button 
                    type="button"
                    onClick={() => toggleShowToken('work')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-stone-400 hover:bg-stone-100 transition-colors"
                  >
                    {showTokens.work ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Group ID */}
              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-stone-600 block flex items-center justify-between">
                  <span>LINE Group ID</span>
                  <span className="text-[9px] text-stone-400 font-mono">Starts with C...</span>
                </label>
                <input
                  type="text"
                  value={groupWork}
                  onChange={(e) => setGroupWork(e.target.value)}
                  placeholder="Cxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:border-sky-500 text-stone-800 font-mono outline-none shadow-inner"
                />
              </div>

              {/* Saved Status Indicator */}
              {savedStatus.work && (
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 p-1.5 rounded-lg border border-emerald-150 animate-bounce">
                  <Check className="w-3.5 h-3.5" />
                  บันทึกข้อมูลกลุ่มงานปฏิบัติการเรียบร้อยแล้ว
                </div>
              )}

              {/* Test Status Indicator */}
              {testStatus.work.success !== undefined && (
                <div className={`text-[10px] p-2 rounded-xl border font-semibold ${
                  testStatus.work.success 
                    ? (testStatus.work.simulated ? 'bg-amber-50 border-amber-250 text-amber-800' : 'bg-emerald-50 border-emerald-150 text-emerald-700') 
                    : 'bg-rose-50 border-rose-150 text-rose-700'
                }`}>
                  {testStatus.work.success ? (
                    testStatus.work.simulated ? (
                      <span>⚠️ {testStatus.work.warning}</span>
                    ) : (
                      <span>🟢 สำเร็จ! บัตรงานทดสอบส่งเข้ารถขุด/คลังชิ้นส่วนสำรองเรียบร้อย</span>
                    )
                  ) : (
                    <span>🔴 ล้มเหลว: {testStatus.work.error || 'กรุณาตรวจสอบผู้ประสานงานหลัก'}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-5 pt-3 border-t border-stone-100 flex flex-col gap-2 z-10 w-full">
            <button
              onClick={() => handleSave('work')}
              className="w-full bg-sky-600 hover:bg-sky-700 active:scale-95 text-white py-2 rounded-xl text-xs font-extrabold tracking-wide shadow-sm transition-all text-center cursor-pointer"
            >
              บันทึกการตั้งค่าลงเครื่องเซิร์ฟเวอร์
            </button>
            <div className="flex items-center gap-2 w-full mt-1">
              <button
                onClick={() => handleTestConnection('work')}
                disabled={testStatus.work.loading}
                title="ส่งบันทึกงานปฏิบัตการเข้ากลุ่มวิศวกรณ์ช่าง"
                className="flex-1 px-3 py-2.5 rounded-xl border border-sky-200 hover:border-sky-300 bg-sky-50 hover:bg-sky-100/70 text-sky-800 flex items-center justify-center gap-1.5 text-xs font-black active:scale-95 transition-all cursor-pointer disabled:opacity-40"
              >
                {testStatus.work.loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-sky-700" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Test Notification (คลัง/ส่งงาน)</span>
                  </>
                )}
              </button>
              <button
                onClick={() => cleanAll('work')}
                title="รีเซ็ตพารามิเตอร์กลับไปเกตเวย์ดั้งเดิม"
                className="p-2 px-3 rounded-xl border border-stone-200 hover:bg-stone-50 font-bold font-mono text-xs text-stone-400 hover:text-stone-600 transition-all active:scale-95 cursor-pointer"
              >
                ล้างค่า
              </button>
            </div>
          </div>
        </div>

        {/* ======================= GROUP 3: FUEL ======================= */}
        <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-50 rounded-full -z-0 pointer-events-none"></div>

          <div className="space-y-4 z-10">
            {/* Group Label */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Fuel className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-stone-800">3. กลุ่มขอเบิกเติมน้ำมัน</h3>
                  <span className="text-[10px] text-slate-500 font-semibold">Refueling Request Status</span>
                </div>
              </div>
              <span className="text-[9.5px] uppercase font-black px-2 py-0.5 rounded bg-amber-100/60 text-amber-700 font-mono tracking-wider">
                Category 3
              </span>
            </div>

            <p className="text-[11px] text-stone-500 leading-normal font-medium">
              ส่งข่าวทันทีเมื่อคนขับรถตักหรือวิศวกรรวมใบคำขอพิมพ์เบิกพลังงานน้ำมัน (ดีเซล/เบนซิน) ของเครื่องมือกลหนัก ชี้แนะจำนวนคิวลิตรพิกัดที่เติม และระบุผู้อนุมัติรายจ่ายพลังงาน
            </p>

            {/* Inputs */}
            <div className="space-y-3 pt-1">
              {/* Channel Token */}
              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-stone-600 block flex items-center justify-between">
                  <span>Channel Access Token</span>
                  <span className="text-[9px] text-stone-400 italic font-semibold">(ฝ่ายอนุมัติพลังงาน)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type={showTokens.fuel ? "text" : "password"}
                    value={tokenFuel}
                    onChange={(e) => setTokenFuel(e.target.value)}
                    placeholder="กรอก Token สำหรับฝ่ายเบิกน้ำมัน..."
                    className="w-full text-xs pl-8.5 pr-8 py-2 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:border-amber-500 text-stone-800 font-mono outline-none shadow-inner"
                  />
                  <button 
                    type="button"
                    onClick={() => toggleShowToken('fuel')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-stone-400 hover:bg-stone-100 transition-colors"
                  >
                    {showTokens.fuel ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Group ID */}
              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-stone-600 block flex items-center justify-between">
                  <span>LINE Group ID</span>
                  <span className="text-[9px] text-stone-400 font-mono">Starts with C...</span>
                </label>
                <input
                  type="text"
                  value={groupFuel}
                  onChange={(e) => setGroupFuel(e.target.value)}
                  placeholder="Cxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:border-amber-500 text-stone-800 font-mono outline-none shadow-inner"
                />
              </div>

              {/* Saved Status Indicator */}
              {savedStatus.fuel && (
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 p-1.5 rounded-lg border border-emerald-150 animate-bounce">
                  <Check className="w-3.5 h-3.5" />
                  บันทึกข้อมูลกลุ่มคำขอน้ำมันสำเร็จ
                </div>
              )}

              {/* Test Status Indicator */}
              {testStatus.fuel.success !== undefined && (
                <div className={`text-[10px] p-2 rounded-xl border font-semibold ${
                  testStatus.fuel.success 
                    ? (testStatus.fuel.simulated ? 'bg-amber-50 border-amber-250 text-amber-800' : 'bg-emerald-50 border-emerald-150 text-emerald-700') 
                    : 'bg-rose-50 border-rose-150 text-rose-700'
                }`}>
                  {testStatus.fuel.success ? (
                    testStatus.fuel.simulated ? (
                      <span>⚠️ {testStatus.fuel.warning}</span>
                    ) : (
                      <span>🟢 สำเร็จ! ข้อความสลิปกรอกเบิกเติมเชื้อเพลิงส่งเข้าสำเร็จแล้ว</span>
                    )
                  ) : (
                    <span>🔴 ล้มเหลว: {testStatus.fuel.error || 'การเชื่อมต่อถูกตัดขาด'}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-5 pt-3 border-t border-stone-100 flex flex-col gap-2 z-10 w-full">
            <button
              onClick={() => handleSave('fuel')}
              className="w-full bg-amber-600 hover:bg-amber-700 active:scale-95 text-stone-900 py-2 rounded-xl text-xs font-extrabold tracking-wide shadow-sm transition-all text-center cursor-pointer"
            >
              บันทึกการตั้งค่าลงเครื่องเซิร์ฟเวอร์
            </button>
            <div className="flex items-center gap-2 w-full mt-1">
              <button
                onClick={() => handleTestConnection('fuel')}
                disabled={testStatus.fuel.loading}
                title="ส่งเทสตัวคิวใบเบิกน้ำมันพรีเมียม"
                className="flex-1 px-3 py-2.5 rounded-xl border border-amber-200 hover:border-amber-300 bg-amber-50 hover:bg-amber-100/70 text-amber-900 flex items-center justify-center gap-1.5 text-xs font-black active:scale-95 transition-all cursor-pointer disabled:opacity-40"
              >
                {testStatus.fuel.loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-700" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 font-bold" />
                    <span>Test Notification (น้ำมัน)</span>
                  </>
                )}
              </button>
              <button
                onClick={() => cleanAll('fuel')}
                title="เคลียร์ข้อมูลกลับไปเป็นค่าว่างดั้งเดิม"
                className="p-2 px-3 rounded-xl border border-stone-200 hover:bg-stone-50 font-bold font-mono text-xs text-stone-400 hover:text-stone-600 transition-all active:scale-95 cursor-pointer"
              >
                ล้างค่า
              </button>
            </div>
          </div>
        </div>

        {/* ======================= GROUP 4: TEST ALL SYSTEMS / SANDBOX ======================= */}
        <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-50 rounded-full -z-0 pointer-events-none"></div>

          <div className="space-y-4 z-10">
            {/* Group Label */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Beaker className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-stone-800">4. กลุ่มส่งทดสอบ (ทุกระบบ)</h3>
                  <span className="text-[10px] text-slate-500 font-semibold">Test Sandbox Status</span>
                </div>
              </div>
              <span className="text-[9.5px] uppercase font-black px-2 py-0.5 rounded bg-indigo-100/60 text-indigo-700 font-mono tracking-wider">
                Category 4
              </span>
            </div>

            <p className="text-[11px] text-stone-500 leading-normal font-medium">
              ส่งสัญญาณทดสอบระบบของแผนควบคุมต็อกบัตร GPS, สั่งจ่ายพลังงานน้ำมัน, และงานแจ้งซ่อมบำรุง ในรูปแบบ Flex Message เข้าสู่ห้องทดสอบผู้พัฒนาระบบหลักโดยไม่กวนแชนแนลจริง
            </p>

            {/* Inputs */}
            <div className="space-y-3 pt-1">
              {/* Channel Token */}
              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-stone-600 block flex items-center justify-between">
                  <span>Channel Access Token</span>
                  <span className="text-[9px] text-stone-400 italic font-semibold">(เฉพาะกลุ่มเทสบอร์ด)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type={showTokens.test ? "text" : "password"}
                    value={tokenTest}
                    onChange={(e) => setTokenTest(e.target.value)}
                    placeholder="กรอก Token สำหรับกลุ่มทดสอบ..."
                    className="w-full text-xs pl-8.5 pr-8 py-2 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:border-indigo-500 text-stone-800 font-mono outline-none shadow-inner"
                  />
                  <button 
                    type="button"
                    onClick={() => toggleShowToken('test')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-stone-400 hover:bg-stone-100 transition-colors"
                  >
                    {showTokens.test ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Group ID */}
              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-stone-600 block flex items-center justify-between">
                  <span>LINE Group ID</span>
                  <span className="text-[9px] text-stone-400 font-mono">Starts with C...</span>
                </label>
                <input
                  type="text"
                  value={groupTest}
                  onChange={(e) => setGroupTest(e.target.value)}
                  placeholder="Cxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:border-indigo-500 text-stone-800 font-mono outline-none shadow-inner"
                />
              </div>

              {/* Saved Status Indicator */}
              {savedStatus.test && (
                <div className="flex items-center gap-1.5 text-[10px] text-indigo-600 font-bold bg-indigo-50 p-1.5 rounded-lg border border-indigo-150 animate-bounce">
                  <Check className="w-3.5 h-3.5" />
                  บันทึกข้อมูลกลุ่มทดสอบระบบสำเร็จ
                </div>
              )}

              {/* Test Status Indicator */}
              {testStatus.test.success !== undefined && (
                <div className={`text-[10px] p-2 rounded-xl border font-semibold ${
                  testStatus.test.success 
                    ? (testStatus.test.simulated ? 'bg-amber-50 border-amber-250 text-amber-800' : 'bg-indigo-50 border-indigo-150 text-indigo-700') 
                    : 'bg-rose-50 border-rose-150 text-rose-700'
                }`}>
                  {testStatus.test.success ? (
                    testStatus.test.simulated ? (
                      <span>⚠️ {testStatus.test.warning}</span>
                    ) : (
                      <span>🟢 สำเร็จ! ส่งครบทุกระบบ (ตอกบัตร, ปฏิบัติงาน, น้ำมัน) เข้ากลุ่มทดสอบแล้ว</span>
                    )
                  ) : (
                    <span>🔴 ล้มเหลว: {testStatus.test.error || 'กรุณาตรวจสอบการตั้งค่า'}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-5 pt-3 border-t border-stone-100 flex flex-col gap-2 z-10 w-full">
            <button
              onClick={() => handleSave('test')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white py-2 rounded-xl text-xs font-extrabold tracking-wide shadow-sm transition-all text-center cursor-pointer"
            >
              บันทึกการตั้งค่าลงเครื่องเซิร์ฟเวอร์
            </button>
            <div className="flex flex-col gap-2 w-full mt-1">
              <button
                onClick={handleTestAllSystemsToTestGroup}
                disabled={testStatus.test.loading}
                title="ส่งทดสอบใบงานทุกระบบเข้ากลุ่มนี้"
                className="w-full px-3 py-2.5 rounded-xl border border-indigo-200 hover:border-indigo-300 bg-indigo-50 hover:bg-indigo-100/70 text-indigo-805 flex items-center justify-center gap-1.5 text-xs font-black active:scale-95 transition-all cursor-pointer disabled:opacity-40"
              >
                {testStatus.test.loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-700" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 font-bold" />
                    <span>ส่งทดสอบ ทุกระบบ (ตอกบัตร+งาน+น้ำมัน)</span>
                  </>
                )}
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTestConnection('test')}
                  disabled={testStatus.test.loading}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-[11px] font-bold active:scale-95 transition-all text-center cursor-pointer"
                >
                  ส่งข้อความเทสมาตรฐาน
                </button>
                <button
                  type="button"
                  onClick={() => cleanAll('test')}
                  title="เคลียร์ข้อมูลกลับไปเป็นค่าว่างดั้งเดิม"
                  className="p-1 px-3 rounded-xl border border-stone-200 hover:bg-stone-50 font-bold font-mono text-[11px] text-stone-400 hover:text-stone-600 transition-all active:scale-95 cursor-pointer"
                >
                  ล้างค่า
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ======================= DATABASE PHOTO URL AUDIT & DIAGNOSTICS LAB ======================= */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div className="space-y-1">
            <h4 className="text-sm font-black text-stone-800 flex items-center gap-2">
              <Beaker className="w-5 h-5 text-indigo-600" />
              ห้องทดลองวินิจฉัย URL รูปภาพในระบบ (Supabase Profile Photo URL Audit Lab)
            </h4>
            <p className="text-[11px] text-stone-500 leading-normal font-medium max-w-2xl">
              ระบบตรวจสอบความถูกต้องรูปภาพประจำตัวพนักงานจากตาราง <code className="bg-stone-100 px-1 py-0.5 rounded font-mono font-bold text-[10px] text-stone-700">employee_profiles</code> โดยจำลองการแปลง URL และการคัดลอกไฟล์ไอดี (File ID) ของ Google Drive เพื่อรับประกันภาพขึ้นจอแชท LINE API โดยผลลัพธ์ได้รับการคัดลอกลง Developer Console เช่นกัน
            </p>
          </div>
          <button
            onClick={runUrlDiagnostics}
            disabled={diagnosticLoading}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-55 font-black text-xs text-white rounded-xl shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${diagnosticLoading ? 'animate-spin' : ''}`} />
            <span>เริ่มวินิจฉัยข้อมูลใหม่ ({diagnosticRunCount})</span>
          </button>
        </div>

        {diagnosticLoading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs font-bold text-stone-500 font-sans">กำลังดึงข้อมูลและประมวลผลความถูกต้อง...</span>
          </div>
        ) : diagnosticRecords.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-stone-200 rounded-2xl bg-stone-50">
            <span className="text-xs text-stone-400 font-bold font-sans">ไม่มีประวัติการวินิจฉัย หรือไม่พบข้อมูลพนักงานประวัตินอกเขต</span>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-stone-100 shadow-sm">
            <table className="w-full text-[11px] text-stone-600 font-medium">
              <thead className="bg-stone-50 text-stone-700 text-left font-black uppercase tracking-wider text-[10px] border-b border-stone-100">
                <tr>
                  <th className="p-3 pl-4">พนักงาน / ตําแหน่ง</th>
                  <th className="p-3 font-sans">ข้อมูลในฐานข้อมูล (Supabase Raw)</th>
                  <th className="p-3">ระบบประมวลผล (Google Drive File ID Match)</th>
                  <th className="p-3 text-right pr-4 font-sans">ผลลัพธ์ LINE URL Mapped</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {diagnosticRecords.map((r, idx) => (
                  <tr key={r.id || idx} className="hover:bg-stone-50/50 transition-colors">
                    <td className="p-3 pl-4">
                      <div className="font-bold text-stone-900">{r.name}</div>
                      <div className="text-[10px] text-stone-400 font-semibold">{r.role}</div>
                    </td>
                    <td className="p-3 max-w-[200px] truncate">
                      {r.rawUrl ? (
                        <a 
                          href={r.rawUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          title={r.rawUrl}
                          className="font-mono text-[10px] text-stone-500 hover:text-indigo-600 font-semibold hover:underline"
                        >
                          {r.rawUrl}
                        </a>
                      ) : (
                        <span className="text-stone-300 font-semibold italic">(ไม่มีรูปประจำตัว)</span>
                      )}
                    </td>
                    <td className="p-3">
                      {r.extractedId ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 rounded bg-indigo-50 border border-indigo-150 px-1.5 py-0.5 text-[9.5px] font-bold text-indigo-700 font-mono">
                            ID: {r.extractedId}
                          </span>
                          <span className="block text-[10px] text-green-600 font-black">✅ MATCHED DRIVE SUCCESS</span>
                        </div>
                      ) : r.rawUrl ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-150 px-1.5 py-0.5 text-[9.5px] font-bold text-amber-700">
                            Normal Web Link
                          </span>
                          <span className="block text-[10px] text-stone-500 font-semibold">⚠️ DIRECT WEB RAW USE</span>
                        </div>
                      ) : (
                        <span className="text-stone-300 italic">-</span>
                      )}
                    </td>
                    <td className="p-3 text-right pr-4">
                      {r.finalUrl ? (
                        <div className="space-y-1">
                          <a 
                            href={r.finalUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="inline-flex items-center gap-1 text-[10.5px] font-bold text-indigo-600 hover:underline"
                          >
                            <span>ดูรูปสาธารณะ DIRECT</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </a>
                          <div className="text-[9.5px] text-stone-400 font-mono font-bold max-w-xs truncate ml-auto" title={r.finalUrl}>
                            {r.finalUrl}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-rose-50 border border-rose-150 px-1.5 py-0.5 text-[9.5px] font-bold text-rose-500 font-sans">
                          ❌ SKIP SEND IMG
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================= REUSABLE INTEGRATION DOCUMENTATION AND EXPLANATION ======================= */}
      <div className="bg-stone-50 border border-stone-200 rounded-3xl p-6 space-y-4">
        <h4 className="text-xs uppercase tracking-wider font-extrabold text-stone-700 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-600" />
          คู่มือการขอรับ Token และ Group ID ของ LINE Messenger เพื่อแยกห้องข่าวสาร
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-stone-600 leading-relaxed">
          <div className="space-y-3">
            <h5 className="font-extrabold text-indigo-900 flex items-center gap-1">
              <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center font-mono text-[10.5px]">A</span>
              วิธีสร้าง LINE Messaging API Token บัญชีทีมงาน
            </h5>
            <ol className="list-decimal pl-5 space-y-1 py-1 text-stone-600 font-medium font-sans">
              <li>ล็อกอินเข้าสู่พอร์ทัล <a href="https://developers.line.biz/" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-bold">LINE Developers Console</a> ด้วย LINE บัญชีของคุณ</li>
              <li>สร้าง <b>Provider</b> และสร้างแชนแนลประเภท <b>Messaging API</b> สำหรับ FlowWork Automated Bot</li>
              <li>ไปที่แท็บ <b>Messaging API</b> เลื่อนลงมาล่างสุดที่หัวข้อ <b>Channel access token (long-lived)</b> แล้วกดปุ่ม <b>Issue</b></li>
              <li>คัดลอกค่าโทเค็น (String ยาวประมาณ 100+ ตัวอักษร) มาวางในช่องด้านบนของแต่ละหมวด</li>
            </ol>
          </div>

          <div className="space-y-3">
            <h5 className="font-extrabold text-[#b45309] flex items-center gap-1">
              <span className="w-5 h-5 rounded-full bg-amber-150 flex items-center justify-center font-mono text-[10.5px] text-[#b45309]">B</span>
              การหารหัสกลุ่มไอดีแชท (Group ID) ของแอปย่อย
            </h5>
            <p className="text-stone-600 font-medium leading-relaxed">
              หมายเลขไอดีกลุ่มไลน์ (หรือเรียกว่า <b>GroupId</b>) จะขึ้นต้นด้วยตัวอักษรพิมพ์ใหญ่ตัวซี (<b>C...</b>) ตามด้วยตัวอักษรผสม 32 ตัว เช่น 
              <code className="text-[10px] ml-1 bg-stone-150 font-mono font-bold px-1 py-0.5 rounded text-stone-800">C94ac0eec7f7dc7b97fd2767104d1e7a0</code>
            </p>
            <p className="text-[11px] text-stone-500 font-bold bg-amber-50 p-2.5 rounded-xl border border-amber-150">
              💡 <b>คำแนะนำหน้างาน:</b> คุณต้องเชิญบ็อตคู่ตัว (LINE Bot Official Account) เข้าร่วมกลุ่มแชทนั้น ๆ ก่อน จากนั้นเมื่อบ็อตได้รับอนุญาต ระบบจะระบุ Group ID ของกลุ่มแชทส่งกลับไปที่ Log หรือ webhook ของระบบ พิกัดความร่วมมือทันใจ!
            </p>
          </div>
        </div>

        {/* Global Fallback configurations */}
        <div className="border-t border-stone-200 pt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-black text-stone-800 flex items-center gap-1">
              <Lock className="w-4 h-4 text-stone-500" />
              โทเค็นสำรองอเนกประสงค์ (Fallback Access Token)
            </h4>
            <p className="text-[10.5px] text-stone-500 leading-normal font-medium max-w-xl">
              หากกลุ่มใดไม่ถูกระบุโทเค็นเฉพาะส่วน ระบบจะดึงเอาแชนแนลโทเค็นสำรองอเนกประสงค์กลางคู่นี้ไปใช้ส่งงานแทนอัตโนมัติ เพื่อยืนยันว่าการทำงานของบ็อตจะไม่ติดขัด
            </p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto max-w-sm shrink-0">
            <input
              type={showTokens.fallback ? "text" : "password"}
              value={fallbackToken}
              onChange={(e) => setFallbackToken(e.target.value)}
              placeholder="โทเค็นเชื่อมต่อกระดูกทางเลือก..."
              className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white font-mono shadow-sm outline-none focus:border-indigo-500 shrink-1"
            />
            <button
              onClick={() => toggleShowToken('fallback')}
              className="p-2 border border-stone-200 hover:bg-stone-100 rounded-xl"
              title="สลับโหมดซ่อน/ดูข้อความ"
            >
              {showTokens.fallback ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => handleSave('fallback')}
              className="p-2 bg-stone-900 border border-stone-800 rounded-xl hover:bg-stone-850 text-white font-black text-xs min-w-[50px] cursor-pointer"
            >
              {savedStatus.fallback ? 'บันทึกแล้ว' : 'เซฟ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
