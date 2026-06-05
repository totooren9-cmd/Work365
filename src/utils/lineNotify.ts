import { WorkScheduleTask, RepairRequest, HeavyMachinery, InventoryIssuance, StockItem, RefuelStatus, AttendanceLog, ExpenseRecord } from '../types';
import { saveGoogleDriveUpload, getLineSettingsFromDb } from '../supabaseService';


const DEFAULT_CHANNEL_ACCESS_TOKEN = "emexPY8OBr3kHbSKKDRNh9W33tnL9dHqLxtD3Zqwx6fYBpy7UMv6BqU65FAJ8L1VhXdmqb7nE9H/AmyijvpPnNlcFgob0ET7ysPGosTEO33GgL6ccIn60mxibiOrEZ47yVH+EkKWcsTOX+RUhI7U6gdB04t89/1O/w1cDnyilFU=";
const DEFAULT_GROUP_ID = "Cfd9f3c46111cf32db3e3e69b6961fa3e";

export function getLineSettings(category: 'attendance' | 'work' | 'operations' | 'fuel' | 'test' = 'work') {
  if (typeof window === 'undefined') {
    return {
      channelAccessToken: DEFAULT_CHANNEL_ACCESS_TOKEN,
      groupId: DEFAULT_GROUP_ID
    };
  }

  // Fallback shared token
  const customChannelAuth = localStorage.getItem('LINE_CHANNEL_ACCESS_TOKEN');

  if (category === 'attendance') {
    const token = localStorage.getItem('LINE_TOKEN_ATTENDANCE');
    const groupId = localStorage.getItem('LINE_GROUP_ATTENDANCE');
    return {
      channelAccessToken: token || customChannelAuth || DEFAULT_CHANNEL_ACCESS_TOKEN,
      groupId: groupId || DEFAULT_GROUP_ID
    };
  } else if (category === 'fuel') {
    const token = localStorage.getItem('LINE_TOKEN_FUEL');
    const groupId = localStorage.getItem('LINE_GROUP_FUEL');
    return {
      channelAccessToken: token || customChannelAuth || DEFAULT_CHANNEL_ACCESS_TOKEN,
      groupId: groupId || DEFAULT_GROUP_ID
    };
  } else if (category === 'test') {
    const token = localStorage.getItem('LINE_TOKEN_TEST');
    const groupId = localStorage.getItem('LINE_GROUP_TEST');
    return {
      channelAccessToken: token || customChannelAuth || DEFAULT_CHANNEL_ACCESS_TOKEN,
      groupId: groupId || DEFAULT_GROUP_ID
    };
  } else if (category === 'work' || category === 'operations') {
    const token = localStorage.getItem('LINE_TOKEN_OPERATIONS') || localStorage.getItem('LINE_TOKEN_WORK');
    const groupId = localStorage.getItem('LINE_GROUP_OPERATIONS') || localStorage.getItem('LINE_GROUP_WORK');
    return {
      channelAccessToken: token || customChannelAuth || DEFAULT_CHANNEL_ACCESS_TOKEN,
      groupId: groupId || localStorage.getItem('LINE_GROUP_ID') || DEFAULT_GROUP_ID
    };
  } else {
    return {
      channelAccessToken: customChannelAuth || DEFAULT_CHANNEL_ACCESS_TOKEN,
      groupId: DEFAULT_GROUP_ID
    };
  }
}

/**
 * Resolver that loads configs from Supabase 'line_settings' tables first,
 * then falls back to LocalStorage or global DEFAULT constants.
 */
export async function getLineSettingsAsync(category: 'attendance' | 'work' | 'operations' | 'fuel' | 'test' = 'work') {
  try {
    const dbSettings = await getLineSettingsFromDb();
    
    // Map values easily by moduleName
    const settingsMap = (dbSettings || []).reduce((acc, curr) => {
      acc[curr.moduleName] = curr;
      return acc;
    }, {} as Record<string, { channelAccessToken: string; groupId: string }>);

    const fallbackSetting = settingsMap['fallback'];
    const dbFallbackToken = fallbackSetting?.channelAccessToken;

    const dbCategory = category === 'work' ? 'operations' : category;
    const currentSetting = settingsMap[dbCategory];
    const dbToken = currentSetting?.channelAccessToken;
    const dbGroupId = currentSetting?.groupId;

    const customChannelAuth = localStorage.getItem('LINE_CHANNEL_ACCESS_TOKEN');
    const localCategoryKey = category === 'work' ? 'OPERATIONS' : category.toUpperCase();
    const localToken = localStorage.getItem(`LINE_TOKEN_${localCategoryKey}`) || localStorage.getItem(`LINE_TOKEN_WORK`);
    const localGroupId = localStorage.getItem(`LINE_GROUP_${localCategoryKey}`) || localStorage.getItem(`LINE_GROUP_WORK`);

    // Order of priority: 1. DB Specific, 2. LocalSpecific, 3. DB Fallback, 4. Local Fallback, 5. Hardcoded Defaults
    const token = dbToken || localToken || dbFallbackToken || customChannelAuth || DEFAULT_CHANNEL_ACCESS_TOKEN;
    const groupId = dbGroupId || localGroupId || DEFAULT_GROUP_ID;

    return {
      channelAccessToken: token,
      groupId: groupId
    };
  } catch (error) {
    console.warn("[LINE config] Error fetching from DB, fallback to localStorage/constants", error);
    return getLineSettings(category);
  }
}

/**
 * Sends a pre-compiled Flex Message to the configured LINE group
 */
export async function pushLineFlexMessage(flexMessage: any, category: 'attendance' | 'work' | 'operations' | 'fuel' | 'test' = 'work') {
  try {
    const { channelAccessToken, groupId } = await getLineSettingsAsync(category);
    const response = await fetch('/api/line/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        flexMessage,
        channelAccessToken,
        groupId
      })
    });
    
    const result = await response.json();
    if (!response.ok) {
      console.error(`Failed to push LINE notification (${category}):`, result.error || "Unknown error");
      return { success: false, error: result.error || "Unknown error" };
    }
    console.log(`LINE push notification (${category}) sent successfully to Group: ${groupId}`);
    return { success: true };
  } catch (error: any) {
    console.error(`Error pushing LINE notification (${category}):`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Ensures a photo URL is formatted as an absolute HTTPS/HTTP link.
 * If the link is relative, it prepends the application origin.
 * If the link starts with data: or is invalid/missing, it returns empty string to skip sending.
 */
export function ensureValidImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  let absoluteUrl = url.trim();
  if (absoluteUrl.startsWith('data:')) {
    return ""; // Base64 data URLs are invalid for LINE Flex
  }
  if (absoluteUrl.startsWith('/')) {
    const appUrl = (typeof window !== 'undefined' && window.location) 
      ? window.location.origin 
      : (process.env.APP_URL || "https://ais-dev-v4xmqfyvpohkbt7yv5i5b4-778841450865.asia-southeast1.run.app");
    const origin = appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl;
    absoluteUrl = `${origin}${absoluteUrl}`;
  }
  if (absoluteUrl.startsWith('http://') || absoluteUrl.startsWith('https://')) {
    return absoluteUrl;
  }
  return ""; // Not a valid URL schema for LINE API
}

/**
 * 1. [PURPLE] Builds and sends an automated LINE Flex message for new Work Schedule Tasks
 */
export async function sendLineTaskNotification(task: WorkScheduleTask, machinery: HeavyMachinery[]) {
  const machineryItem = machinery.find(m => m.id === task.machineryId);
  const machineryCode = machineryItem ? `${machineryItem.brand} ${machineryItem.model} (${machineryItem.code})` : 'ไม่ได้ระบุ';
  const formattedDate = new Date().toLocaleDateString('th-TH');
  const formattedTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const priorityColor = 
    task.priority === 'critical' ? '#cf3545' :
    task.priority === 'high' ? '#fd7e14' :
    task.priority === 'medium' ? '#6f42c1' : '#198754';
  
  const priorityText = 
    task.priority === 'critical' ? 'วิกฤต (Critical)' :
    task.priority === 'high' ? 'สูง (High)' :
    task.priority === 'medium' ? 'ปานกลาง (Medium)' : 'ต่ำ (Low)';

  const displayId = task.id.length > 24 ? task.id.substring(0, 18) + '...' : task.id;
  const displayWorkTime = task.workTime || '08:00';
  const displayDueDate = task.dueDate || 'ไม่ระบุ';

  const extraMachinery = task.machineries && task.machineries.length > 0
    ? task.machineries.join(', ')
    : 'ไม่ได้ระบุ';

  const locationsText = task.locations && task.locations.length > 0
    ? task.locations.join(', ')
    : (task.gpsLocName || 'ไม่ระบุพิกัด');

  const employeesText = task.employees && task.employees.length > 0
    ? task.employees.join(', ')
    : (task.assignedTo || 'ไม่ได้ระบุ');

  const flexJson = {
    "type": "flex",
    "altText": `📅 แจ้งเตือนตารางงานใหม่: ${task.title}`,
    "contents": {
      "type": "bubble",
      "size": "mega",
      "header": {
        "type": "box",
        "layout": "vertical",
        "backgroundColor": "#6f42c1",
        "paddingAll": "xl",
        "contents": [
          {
            "type": "text",
            "text": "📅 มอบหมายแผนงานป...",
            "weight": "bold",
            "color": "#ffffff",
            "size": "lg"
          },
          {
            "type": "text",
            "text": "ระบบแจ้งเตือนอัตโนมัติ FlowWork CMMS",
            "color": "#e9ecef",
            "size": "xs",
            "margin": "sm"
          }
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
            "spacing": "sm",
            "contents": [
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  { "type": "text", "text": "เลขที่อ้างอิง", "size": "sm", "color": "#94a3b8" },
                  { "type": "text", "text": displayId, "size": "sm", "color": "#1e293b", "align": "end" }
                ]
              },
              {
                "type": "separator",
                "margin": "md",
                "color": "#f1f5f9"
              },
              {
                "type": "box",
                "layout": "horizontal",
                "margin": "md",
                "contents": [
                  { "type": "text", "text": "วันที่มอบหมาย", "size": "sm", "color": "#64748b" },
                  { "type": "text", "text": formattedDate, "size": "sm", "color": "#1e293b", "align": "end", "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  { "type": "text", "text": "เวลาส่งแผนงาน", "size": "sm", "color": "#64748b" },
                  { "type": "text", "text": formattedTime, "size": "sm", "color": "#1e293b", "align": "end" }
                ]
              },
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  { "type": "text", "text": "วันที่ให้เข้าทำงาน", "size": "sm", "color": "#64748b" },
                  { "type": "text", "text": displayDueDate, "size": "sm", "color": "#00b894", "align": "end", "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  { "type": "text", "text": "เวลาทำงาน", "size": "sm", "color": "#64748b" },
                  { "type": "text", "text": displayWorkTime, "size": "sm", "color": "#03a9f4", "align": "end", "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  { "type": "text", "text": "ช่างผู้ทำงาน", "size": "sm", "color": "#64748b" },
                  { "type": "text", "text": task.assignedTo || 'ไม่ได้ระบุ', "size": "sm", "color": "#1e293b", "align": "end", "weight": "bold" }
                ]
              }
            ]
          },
          {
            "type": "box",
            "layout": "vertical",
            "margin": "xl",
            "contents": [
              {
                "type": "text",
                "text": `งานหลัก: ${task.title}`,
                "weight": "bold",
                "size": "md",
                "color": "#0f172a"
              },
              {
                "type": "text",
                "text": task.description || 'ไม่มีรายละเอียดเพิ่มเติม',
                "size": "sm",
                "color": "#64748b",
                "margin": "sm",
                "wrap": true
              }
            ]
          },
          {
            "type": "box",
            "layout": "vertical",
            "margin": "xl",
            "backgroundColor": "#f8f9fa",
            "paddingAll": "md",
            "cornerRadius": "md",
            "contents": [
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "contents": [
                  { "type": "text", "text": "เครื่องจักรใช้งาน", "color": "#64748b", "size": "xs", "flex": 3 },
                  { "type": "text", "text": machineryCode, "wrap": true, "color": "#334155", "size": "xs", "flex": 5, "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "อุปกรณ์/รถยนต์", "color": "#64748b", "size": "xs", "flex": 3 },
                  { "type": "text", "text": extraMachinery, "wrap": true, "color": "#00a8ff", "size": "xs", "flex": 5, "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "กำหนดส่งมอบ", "color": "#64748b", "size": "xs", "flex": 3 },
                  { "type": "text", "text": displayDueDate, "wrap": true, "color": "#1e293b", "size": "xs", "flex": 5, "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "ความด่วนของงาน", "color": "#64748b", "size": "xs", "flex": 3 },
                  { "type": "text", "text": `● ${priorityText}`, "wrap": true, "color": priorityColor, "size": "xs", "flex": 5, "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "สถานที่หน้างาน", "color": "#64748b", "size": "xs", "flex": 3 },
                  { "type": "text", "text": locationsText, "wrap": true, "color": "#334155", "size": "xs", "flex": 5, "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "พนักงานปฏิบัติการ", "color": "#64748b", "size": "xs", "flex": 3 },
                  { "type": "text", "text": employeesText, "wrap": true, "color": "#10b981", "size": "xs", "flex": 5, "weight": "bold" }
                ]
              }
            ]
          }
        ]
      }
    }
  };

  return await pushLineFlexMessage(flexJson);
}

/**
 * 2. [CRIMSON RED] Builds and sends an automated LINE Flex message for Material Requisition (Pending/Approved/Rejected)
 */
export async function sendLineIssuanceNotification(issuance: InventoryIssuance) {
  const formattedDate = new Date().toLocaleDateString('th-TH');
  const formattedTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const isApproved = issuance.status === 'approved';
  const isRejected = issuance.status === 'rejected';

  const statusColor = 
    isApproved ? '#198754' :
    isRejected ? '#dc3545' : '#e28743';

  const statusText = 
    isApproved ? '🟢 อนุมัติการเบิกจ่ายแล้ว (Approved)' :
    isRejected ? '🔴 ปฏิเสธคำขอเบิกแล้ว (Rejected)' : '🟡 รออนุมัติการเบิกจ่ายพัสดุ';

  const flexJson = {
    "type": "flex",
    "altText": `📦 มีอัปเดตสถานะใบเบิกพัสดุเลขที่: ${issuance.documentNo}`,
    "contents": {
      "type": "bubble",
      "size": "mega",
      "header": {
        "type": "box",
        "layout": "vertical",
        "backgroundColor": "#cf3545", // Crimson red background
        "paddingAll": "xl",
        "contents": [
          {
            "type": "text",
            "text": "📊 แจ้งขอเบิกพัสดุและอนุมัติ",
            "weight": "bold",
            "color": "#ffffff",
            "size": "xl"
          },
          {
            "type": "text",
            "text": "คลังอะไหล่สะสมกลาง FlowWork CMMS",
            "color": "#fcd34d",
            "size": "xs",
            "margin": "sm",
            "weight": "bold"
          }
        ]
      },
      "body": {
        "type": "box",
        "layout": "vertical",
        "paddingAll": "xl",
        "contents": [
          {
            "type": "box",
            "layout": "horizontal",
            "contents": [
              {
                "type": "text",
                "text": "เลขที่ใบเบิกชิ้นงาน",
                "size": "sm",
                "color": "#94a3b8"
              },
              {
                "type": "text",
                "text": issuance.documentNo,
                "size": "sm",
                "color": "#1e293b",
                "align": "end",
                "weight": "bold"
              }
            ]
          },
          {
            "type": "separator",
            "margin": "md",
            "color": "#f1f5f9"
          },
          {
            "type": "box",
            "layout": "vertical",
            "margin": "md",
            "spacing": "sm",
            "contents": [
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  { "type": "text", "text": "วันที่ทำการร้องขอ", "size": "sm", "color": "#64748b" },
                  { "type": "text", "text": issuance.date || formattedDate, "size": "sm", "color": "#1e293b", "align": "end" }
                ]
              },
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  { "type": "text", "text": "เวลาปรับปรุงสถานะ", "size": "sm", "color": "#64748b" },
                  { "type": "text", "text": formattedTime, "size": "sm", "color": "#1e293b", "align": "end" }
                ]
              },
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  { "type": "text", "text": "ผู้อยู่แผนกเบิกจ่าย", "size": "sm", "color": "#64748b" },
                  { "type": "text", "text": issuance.department, "size": "sm", "color": "#1e293b", "align": "end", "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  { "type": "text", "text": "ตัวแทนผู้ขอเบิกพัสดุ", "size": "sm", "color": "#64748b" },
                  { "type": "text", "text": issuance.requestedBy, "size": "sm", "color": "#1e293b", "align": "end" }
                ]
              }
            ]
          },
          {
            "type": "box",
            "layout": "vertical",
            "margin": "xl",
            "contents": [
              {
                "type": "text",
                "text": `รายการพัสดุ: ${issuance.itemName}`,
                "weight": "bold",
                "size": "md",
                "color": "#0f172a"
              }
            ]
          },
          {
            "type": "box",
            "layout": "vertical",
            "margin": "md",
            "backgroundColor": "#f8f9fa",
            "paddingAll": "md",
            "cornerRadius": "md",
            "contents": [
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "contents": [
                  { "type": "text", "text": "จำนวนประสงค์ขอ", "color": "#64748b", "size": "xs", "flex": 3 },
                  { "type": "text", "text": `${issuance.qtyRequested} ชิ้น`, "color": "#334155", "size": "xs", "flex": 5, "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "จำนวนเบิกจ่ายจริง", "color": "#64748b", "size": "xs", "flex": 3 },
                  { "type": "text", "text": `${issuance.qtyApproved} ชิ้น`, "color": "#0f172a", "size": "xs", "flex": 5, "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "สถานะการนำออก", "color": "#64748b", "size": "xs", "flex": 3 },
                  { "type": "text", "text": statusText, "color": statusColor, "size": "xs", "flex": 5, "weight": "bold" }
                ]
              }
            ]
          }
        ]
      }
    }
  };

  return await pushLineFlexMessage(flexJson);
}

/**
 * 3. [ROYAL BLUE] Builds and sends an automated LINE Flex message for Stock Entry / Goods Received (Purchase Received)
 */
export async function sendLineStockReceiveNotification(item: StockItem, qtyAdded: number, source: string, receiver: string) {
  const formattedDate = new Date().toLocaleDateString('th-TH');
  const formattedTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const flexJson = {
    "type": "flex",
    "altText": `📥 ยืนยันการรับพัสดุอะไหล่จัดซื้อเข้าใหม่: ${item.name}`,
    "contents": {
      "type": "bubble",
      "size": "mega",
      "header": {
        "type": "box",
        "layout": "vertical",
        "backgroundColor": "#007aff", // Beautiful Royal Blue
        "paddingAll": "xl",
        "contents": [
          {
            "type": "text",
            "text": "📥 น้ำเข้าคลังอะไหล่ (Stock Received)",
            "weight": "bold",
            "color": "#ffffff",
            "size": "lg"
          },
          {
            "type": "text",
            "text": "สรุปจัดซื้อและรับพัสดุประมวลผลอัตโนมัติ",
            "color": "#e2e8f0",
            "size": "xs",
            "margin": "xs"
          }
        ]
      },
      "body": {
        "type": "box",
        "layout": "vertical",
        "paddingAll": "xl",
        "contents": [
          {
            "type": "box",
            "layout": "horizontal",
            "contents": [
              {
                "type": "text",
                "text": "รหัสอะไหล่ระบบ",
                "size": "sm",
                "color": "#94a3b8"
              },
              {
                "type": "text",
                "text": item.code,
                "size": "sm",
                "color": "#1e293b",
                "align": "end",
                "weight": "bold"
              }
            ]
          },
          {
            "type": "separator",
            "margin": "md",
            "color": "#f1f5f9"
          },
          {
            "type": "box",
            "layout": "vertical",
            "margin": "md",
            "spacing": "sm",
            "contents": [
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  { "type": "text", "text": "วันที่ตรวจรับ", "size": "sm", "color": "#64748b" },
                  { "type": "text", "text": formattedDate, "size": "sm", "color": "#1e293b", "align": "end" }
                ]
              },
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  { "type": "text", "text": "เวลาแสตมป์ตรวจรับ", "size": "sm", "color": "#64748b" },
                  { "type": "text", "text": formattedTime, "size": "sm", "color": "#1e293b", "align": "end" }
                ]
              },
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  { "type": "text", "text": "แหล่งซัพพลายเออร์ที่ซื้อ", "size": "sm", "color": "#64748b" },
                  { "type": "text", "text": source || 'แหล่งจัดซื้อภายใน / ทั่วไป', "size": "sm", "color": "#1e293b", "align": "end", "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  { "type": "text", "text": "ผู้ตรวจรับลงบัญชี", "size": "sm", "color": "#64748b" },
                  { "type": "text", "text": receiver || 'สมดุล แสวงธรรม', "size": "sm", "color": "#1e293b", "align": "end" }
                ]
              }
            ]
          },
          {
            "type": "box",
            "layout": "vertical",
            "margin": "xl",
            "contents": [
              {
                "type": "text",
                "text": `อะไหล่: ${item.name}`,
                "weight": "bold",
                "size": "md",
                "color": "#0958ca"
              },
              {
                "type": "text",
                "text": `จัดเก็บหมวดหมู่: ${item.category}`,
                "size": "xs",
                "color": "#64748b"
              }
            ]
          },
          {
            "type": "box",
            "layout": "vertical",
            "margin": "md",
            "backgroundColor": "#f0f7ff",
            "paddingAll": "md",
            "cornerRadius": "md",
            "contents": [
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "contents": [
                  { "type": "text", "text": "จำนวนนำเข้ารอบนี้", "color": "#007aff", "size": "xs", "flex": 3, "weight": "bold" },
                  { "type": "text", "text": `+${qtyAdded} ${item.unit}`, "color": "#007aff", "size": "xs", "flex": 5, "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "ยอดสต็อกคงเหลือปัจจุบัน", "color": "#64748b", "size": "xs", "flex": 3 },
                  { "type": "text", "text": `${item.quantity} ${item.unit}`, "color": "#111827", "size": "xs", "flex": 5, "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "ตำแหน่งเกณฑ์พัสดุชั้น", "color": "#64748b", "size": "xs", "flex": 3 },
                  { "type": "text", "text": item.location || 'ไม่ได้ระบุ', "color": "#64748b", "size": "xs", "flex": 5 }
                ]
              }
            ]
          }
        ]
      }
    }
  };

  return await pushLineFlexMessage(flexJson);
}

/**
 * 4. [BRIGHT ORANGE] Builds and sends an automated LINE Flex message for new Repair Requests
 */
export async function sendLineRepairNotification(repair: RepairRequest, machinery: HeavyMachinery[]) {
  const machineryItem = machinery.find(m => m.id === repair.machineryId);
  const machineryCode = machineryItem ? `${machineryItem.brand} ${machineryItem.model} (${machineryItem.code})` : 'ไม่ระบุข้อมูล';
  const formattedDate = new Date().toLocaleDateString('th-TH');
  const formattedTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const urgencyColor = 
    repair.urgency === 'critical' ? '#cf3545' :
    repair.urgency === 'high' ? '#fd7e14' :
    repair.urgency === 'medium' ? '#6f42c1' : '#198754';
  
  const urgencyText = 
    repair.urgency === 'critical' ? '🔴 วิกฤต (Critical)' :
    repair.urgency === 'high' ? '🟠 สูง (High)' :
    repair.urgency === 'medium' ? '🟣 ปานกลาง (Medium)' : '🟢 ต่ำ (Low)';

  const flexJson = {
    "type": "flex",
    "altText": `🚨 แจ้งซ่อมเครื่องจักรฉุกเฉิน: ${machineryCode}`,
    "contents": {
      "type": "bubble",
      "size": "mega",
      "header": {
        "type": "box",
        "layout": "vertical",
        "backgroundColor": "#fd7e14", // Orange
        "paddingAll": "xl",
        "contents": [
          {
            "type": "text",
            "text": "🚨 แจ้งซ่อมบำรุงรักษาเครื่องชำรุด",
            "weight": "bold",
            "color": "#ffffff",
            "size": "xl"
          },
          {
            "type": "text",
            "text": "ระบบรายงานความชำรุดด่วน FlowWork CMMS",
            "color": "#e9ecef",
            "size": "xs",
            "margin": "sm"
          }
        ]
      },
      "body": {
        "type": "box",
        "layout": "vertical",
        "paddingAll": "xl",
        "contents": [
          {
            "type": "box",
            "layout": "horizontal",
            "contents": [
              {
                "type": "text",
                "text": "รหัสใบรายงานซ่อม",
                "size": "sm",
                "color": "#94a3b8"
              },
              {
                "type": "text",
                "text": repair.id,
                "size": "sm",
                "color": "#64748b",
                "align": "end",
                "weight": "bold"
              }
            ]
          },
          {
            "type": "separator",
            "margin": "md",
            "color": "#f1f5f9"
          },
          {
            "type": "box",
            "layout": "vertical",
            "margin": "md",
            "spacing": "sm",
            "contents": [
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  { "type": "text", "text": "วันที่ตรวจพบชำรุด", "size": "sm", "color": "#64748b" },
                  { "type": "text", "text": formattedDate, "size": "sm", "color": "#1e293b", "align": "end", "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  { "type": "text", "text": "เวลาที่ทำการจับตา", "size": "sm", "color": "#64748b" },
                  { "type": "text", "text": formattedTime, "size": "sm", "color": "#1e293b", "align": "end" }
                ]
              },
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  { "type": "text", "text": "พนักงานผู้ขับแจ้งส่งเรื่อง", "size": "sm", "color": "#64748b" },
                  { "type": "text", "text": repair.reporterName, "size": "sm", "color": "#111827", "align": "end", "weight": "bold" }
                ]
              }
            ]
          },
          {
            "type": "box",
            "layout": "vertical",
            "margin": "xl",
            "contents": [
              {
                "type": "text",
                "text": `ยี่ห้อรุ่นเครื่องจักร: ${machineryCode}`,
                "weight": "bold",
                "size": "md",
                "color": "#0f172a"
              },
              {
                "type": "text",
                "text": `อธิบายปัญหา: ${repair.problemDesc}`,
                "size": "sm",
                "color": "#64748b",
                "margin": "sm",
                "wrap": true
              }
            ]
          },
          {
            "type": "box",
            "layout": "vertical",
            "margin": "xl",
            "backgroundColor": "#f8f9fa",
            "paddingAll": "md",
            "cornerRadius": "md",
            "contents": [
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "contents": [
                  { "type": "text", "text": "ประเภทระดับขัดข้อง", "color": "#64748b", "size": "xs", "flex": 3 },
                  { "type": "text", "text": urgencyText, "wrap": true, "color": urgencyColor, "size": "xs", "flex": 5, "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "ชั่วโมงทำงานขณะที่เสียหาย", "color": "#64748b", "size": "xs", "flex": 3 },
                  { "type": "text", "text": `${repair.hoursMeterRecorded} ชม.`, "wrap": true, "color": "#334155", "size": "xs", "flex": 5, "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "ตึก/แผนก/สถานที่สังเกต", "color": "#64748b", "size": "xs", "flex": 3 },
                  { "type": "text", "text": repair.gpsLoc || 'หน้างานในโครงการหลัก', "wrap": true, "color": "#334155", "size": "xs", "flex": 5, "weight": "bold" }
                ]
              }
            ]
          }
        ]
      }
    }
  };

  return await pushLineFlexMessage(flexJson);
}

/**
 * 5. [FOREST GREEN] Builds and sends an automated LINE Flex message for Announcements and General Logs
 */
export async function sendLineGeneralNotification(title: string, content: string, reporter: string, category?: string) {
  const formattedDate = new Date().toLocaleDateString('th-TH');
  const formattedTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const flexJson = {
    "type": "flex",
    "altText": `📢 ประกาศกองการสื่อสารทั่วไป: ${title}`,
    "contents": {
      "type": "bubble",
      "size": "mega",
      "header": {
        "type": "box",
        "layout": "vertical",
        "backgroundColor": "#198754", // Forest Green
        "paddingAll": "xl",
        "contents": [
          {
            "type": "text",
            "text": "📢 สรุปข่าวสารและการสื่อสารทั่วไป",
            "weight": "bold",
            "color": "#ffffff",
            "size": "lg"
          },
          {
            "type": "text",
            "text": "สำนักแจ้งเตือนประชาสัมพันธ์โครงการหลัก",
            "color": "#dbf1e5",
            "size": "xs",
            "margin": "xs"
          }
        ]
      },
      "body": {
        "type": "box",
        "layout": "vertical",
        "paddingAll": "xl",
        "contents": [
          {
            "type": "box",
            "layout": "horizontal",
            "contents": [
              {
                "type": "text",
                "text": "ประเภทของข่าวสาร",
                "size": "sm",
                "color": "#94a3b8"
              },
              {
                "type": "text",
                "text": category || 'ทั่วไป (General Info)',
                "size": "sm",
                "color": "#198754",
                "align": "end",
                "weight": "bold"
              }
            ]
          },
          {
            "type": "separator",
            "margin": "md",
            "color": "#f1f5f9"
          },
          {
            "type": "box",
            "layout": "vertical",
            "margin": "md",
            "spacing": "sm",
            "contents": [
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  { "type": "text", "text": "วันที่ทำการแจ้งสาร", "size": "sm", "color": "#64748b" },
                  { "type": "text", "text": formattedDate, "size": "sm", "color": "#1e293b", "align": "end" }
                ]
              },
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  { "type": "text", "text": "เวลาประชาสัมพันธ์", "size": "sm", "color": "#64748b" },
                  { "type": "text", "text": formattedTime, "size": "sm", "color": "#1e293b", "align": "end" }
                ]
              },
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  { "type": "text", "text": "กองส่งข้อมูล / ประกาศโดย", "size": "sm", "color": "#64748b" },
                  { "type": "text", "text": reporter || 'ฝ่ายธุรการ', "size": "sm", "color": "#1e293b", "align": "end", "weight": "bold" }
                ]
              }
            ]
          },
          {
            "type": "box",
            "layout": "vertical",
            "margin": "xl",
            "contents": [
              {
                "type": "text",
                "text": `เรื่อง: ${title}`,
                "weight": "bold",
                "size": "md",
                "color": "#0f172a"
              },
              {
                "type": "text",
                "text": content || 'โปรดดูข่าวสารในโปรแกรม CMMS FlowWork หลักอย่างต่อเนื่อง เพื่อทราบการปรับปรุงทักษะหน้างาน',
                "size": "sm",
                "color": "#64748b",
                "margin": "sm",
                "wrap": true
              }
            ]
          }
        ]
      }
    }
  };

  return await pushLineFlexMessage(flexJson);
}

/**
 * 6. [GOLDEN YELLOW / AMBER] Builds and sends an automated LINE Flex message for Fueling Requests & Status Updates
 */
export async function sendLineFuelNotification(refuel: RefuelStatus, machinery: HeavyMachinery[]) {
  const machineryItem = machinery.find(m => m.id === refuel.machineryId);
  const machineryCode = machineryItem ? `${machineryItem.brand} ${machineryItem.model} (${machineryItem.code})` : 'ไม่ระบุ';
  const formattedDate = new Date().toLocaleDateString('th-TH');
  const formattedTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const statusColor = 
    refuel.status === 'completed' ? '#198754' :
    refuel.status === 'cancelled' ? '#dc3545' : '#b45309';

  const statusText = 
    refuel.status === 'completed' ? '🟢 ดำเนินการเติมน้ำมันสำเร็จ' :
    refuel.status === 'cancelled' ? '🔴 ยกเลิกคำขอแล้ว' :
    refuel.status === 'approved_to_fill' ? '🟡 ผู้อนุมัติไฟเขียว เติมได้ทันที' : '⌛ รอการพิจารณาอนุมัติเติม';

  const flexJson = {
    "type": "flex",
    "altText": `⛽ ใบคำขอเบิกน้ำมันเชื้อเพลิงเลขที่: ${refuel.documentNo}`,
    "contents": {
      "type": "bubble",
      "size": "mega",
      "header": {
        "type": "box",
        "layout": "vertical",
        "backgroundColor": "#d97706", // Dark Golden Yellow / Amber
        "paddingAll": "xl",
        "contents": [
          {
            "type": "text",
            "text": "⛽ บันทึกขอเบิกน้ำมัน (Fuel Request)",
            "weight": "bold",
            "color": "#ffffff",
            "size": "lg"
          },
          {
            "type": "text",
            "text": "รายงานระบบควบคุมและตรวจสอบพลังงาน FlowWork",
            "color": "#fef3c7",
            "size": "xs",
            "margin": "xs",
            "weight": "bold"
          }
        ]
      },
      "body": {
        "type": "box",
        "layout": "vertical",
        "paddingAll": "xl",
        "contents": [
          {
            "type": "box",
            "layout": "horizontal",
            "contents": [
              {
                "type": "text",
                "text": "เลขที่ใบขอเบิกน้ำมัน",
                "size": "sm",
                "color": "#94a3b8"
              },
              {
                "type": "text",
                "text": refuel.documentNo,
                "size": "sm",
                "color": "#1e293b",
                "align": "end",
                "weight": "bold"
              }
            ]
          },
          {
            "type": "separator",
            "margin": "md",
            "color": "#f1f5f9"
          },
          {
            "type": "box",
            "layout": "vertical",
            "margin": "md",
            "spacing": "sm",
            "contents": [
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  { "type": "text", "text": "วันที่ร้องเรียน", "size": "sm", "color": "#64748b" },
                  { "type": "text", "text": refuel.date || formattedDate, "size": "sm", "color": "#1e293b", "align": "end" }
                ]
              },
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  { "type": "text", "text": "แสตมป์นาทีเบิก", "size": "sm", "color": "#64748b" },
                  { "type": "text", "text": formattedTime, "size": "sm", "color": "#1e293b", "align": "end" }
                ]
              },
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  { "type": "text", "text": "พนักงานลงชื่อขอกราบเบิก", "size": "sm", "color": "#64748b" },
                  { "type": "text", "text": refuel.requesterName, "size": "sm", "color": "#111827", "align": "end", "weight": "bold" }
                ]
              }
            ]
          },
          {
            "type": "box",
            "layout": "vertical",
            "margin": "xl",
            "contents": [
              {
                "type": "text",
                "text": `สำหรับเครื่องจักร: ${machineryCode}`,
                "weight": "bold",
                "size": "md",
                "color": "#b45309"
              },
              {
                "type": "text",
                "text": `ชนิดจ่ายพลังงาน: น้ำมัน${refuel.fuelType === 'diesel' ? 'ดีเซลหมุนเร็ว' : refuel.fuelType === 'premium_diesel' ? 'ดีเซลพรีเมียม' : 'เบนซิน'}`,
                "size": "sm",
                "color": "#64748b",
                "margin": "xs"
              }
            ]
          },
          {
            "type": "box",
            "layout": "vertical",
            "margin": "md",
            "backgroundColor": "#fffbeb",
            "paddingAll": "md",
            "cornerRadius": "md",
            "contents": [
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "contents": [
                  { "type": "text", "text": "ปริมาตรขอกลั่นเบิก", "color": "#64748b", "size": "xs", "flex": 3 },
                  { "type": "text", "text": `${refuel.requestedLiters} ลิตร`, "color": "#111827", "size": "xs", "flex": 5, "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "ราคาต่อลิตรประเมิน", "color": "#64748b", "size": "xs", "flex": 3 },
                  { "type": "text", "text": `${refuel.pricePerLiter} บาท / ลิตร`, "color": "#111827", "size": "xs", "flex": 5 }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "ประมาณการรวม", "color": "#64748b", "size": "xs", "flex": 3 },
                  { "type": "text", "text": `${(refuel.requestedLiters * refuel.pricePerLiter).toLocaleString()} บาท`, "color": "#b45309", "size": "xs", "flex": 5, "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "ระยะทาง / ชั่วโมงรับประกัน", "color": "#64748b", "size": "xs", "flex": 3 },
                  { "type": "text", "text": `${refuel.hourMeterValue} ชม.`, "color": "#64748b", "size": "xs", "flex": 5 }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "สถานที่บริการน้ำมัน", "color": "#64748b", "size": "xs", "flex": 3 },
                  { "type": "text", "text": refuel.siteLocation || 'ไม่ระบุไซต์', "color": "#334155", "size": "xs", "flex": 5, "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "สถานะคำขอ", "color": "#64748b", "size": "xs", "flex": 3 },
                  { "type": "text", "text": statusText, "color": statusColor, "size": "xs", "flex": 5, "weight": "bold" }
                ]
              }
            ]
          }
        ]
      }
    }
  };

  return await pushLineFlexMessage(flexJson, 'fuel');
}

export async function sendLinePmNotification(machinery: HeavyMachinery, nextPmDueHour: number, hoursRemaining: number) {
  const formattedDate = new Date().toLocaleDateString('th-TH');
  const formattedTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const flexJson = {
    "type": "flex",
    "altText": `⚠️ แจ้งเตือนด่วน: เครื่องจักร ${machinery.code} ใกล้ถึงรอบ PM`,
    "contents": {
      "type": "bubble",
      "size": "mega",
      "header": {
        "type": "box",
        "layout": "vertical",
        "backgroundColor": "#ea580c",
        "paddingAll": "xl",
        "contents": [
          {
            "type": "text",
            "text": "⚠️ แจ้งเตือนบำรุงรักษาเชิงป้องกัน (PM)",
            "weight": "bold",
            "color": "#ffffff",
            "size": "lg"
          },
          {
            "type": "text",
            "text": "ระบบแจ้งเตือนตารางชั่วโมงสะสม FlowWork CMMS",
            "color": "#ffedd5",
            "size": "xs",
            "margin": "sm"
          }
        ]
      },
      "body": {
        "type": "box",
        "layout": "vertical",
        "paddingAll": "xl",
        "contents": [
          {
            "type": "box",
            "layout": "horizontal",
            "contents": [
              {
                "type": "text",
                "text": "ส่งข้อมูลเมื่อ",
                "size": "sm",
                "color": "#94a3b8"
              },
              {
                "type": "text",
                "text": `${formattedDate} ${formattedTime} น.`,
                "size": "sm",
                "color": "#334155",
                "align": "end",
                "weight": "bold"
              }
            ]
          },
          {
            "type": "separator",
            "margin": "md",
            "color": "#f1f5f9"
          },
          {
            "type": "text",
            "text": `เครื่องจักร: ${machinery.brand} ${machinery.model} (${machinery.code})`,
            "weight": "bold",
            "size": "md",
            "color": "#0f172a",
            "margin": "md",
            "wrap": true
          },
          {
            "type": "box",
            "layout": "vertical",
            "margin": "md",
            "backgroundColor": "#fff7ed",
            "paddingAll": "md",
            "cornerRadius": "md",
            "contents": [
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "contents": [
                  { "type": "text", "text": "ชั่วโมงทำงานปัจจุบัน", "color": "#64748b", "size": "xs", "flex": 4 },
                  { "type": "text", "text": `${machinery.hourMeter.toLocaleString()} ชม.`, "color": "#0f172a", "size": "xs", "flex": 5, "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "กำหนดรอบ PM ถัดไป", "color": "#64748b", "size": "xs", "flex": 4 },
                  { "type": "text", "text": `${nextPmDueHour.toLocaleString()} ชม.`, "color": "#c2410c", "size": "xs", "flex": 5, "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "ชั่วโมงเหลือการทำงาน", "color": "#64748b", "size": "xs", "flex": 4 },
                  { "type": "text", "text": `${hoursRemaining.toLocaleString()} ชม.`, "color": "#ea580c", "size": "xs", "flex": 5, "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "ผู้รับผิดชอบดูแล", "color": "#64748b", "size": "xs", "flex": 4 },
                  { "type": "text", "text": machinery.responsibleName || 'ไม่ระบุ', "color": "#334155", "size": "xs", "flex": 5 }
                ]
              }
            ]
          },
          {
            "type": "text",
            "text": "💡 แนะนำด่วน: กรุณาเตรียมจัดซื้อแกลลอนน้ำมันไฮดรอลิกและเป่าแผ่นกรองอากาศล่วงหน้าก่อนเครื่องยนต์สะสมค่าเกินกำหนดป้องเกียร์ชำรุด",
            "color": "#ea580c",
            "size": "xxs",
            "margin": "md",
            "wrap": true
          }
        ]
      }
    }
  };

  return await pushLineFlexMessage(flexJson);
}

export async function sendLineAttendanceNotification(attendance: AttendanceLog) {
  const formattedDate = new Date().toLocaleDateString('th-TH');
  const formattedTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const isCheckOut = !!attendance.checkOutTime;
  const statusTitle = isCheckOut ? "⏱️ บันทึกเวลาออกงาน (Check-out)" : "⏱️ บันทึกเวลาเข้างาน (Check-in)";
  const headerBgColor = isCheckOut ? "#dc2626" : "#16a34a"; // Red for checkout, green for checkin
  const timeLabel = isCheckOut ? `เวลาออกงาน: ${attendance.checkOutTime}` : `เวลาเข้างาน: ${attendance.checkInTime}`;

  const targetPhoto = isCheckOut ? (attendance.photoUrlOut || attendance.photoUrl) : attendance.photoUrl;
  const verifiedPhotoUrl = ensureValidImageUrl(targetPhoto);
  const hasValidPhotoUrl = !!verifiedPhotoUrl;

  const flexJson = {
    "type": "flex",
    "altText": `⏱️ ${attendance.employeeName} ${isCheckOut ? 'ลงเวลาออกงาน' : 'ลงเวลาเข้างาน'}`,
    "contents": {
      "type": "bubble",
      "size": "mega",
      "header": {
        "type": "box",
        "layout": "vertical",
        "backgroundColor": headerBgColor,
        "paddingAll": "xl",
        "contents": [
          {
            "type": "text",
            "text": statusTitle,
            "weight": "bold",
            "color": "#ffffff",
            "size": "lg",
            "wrap": true
          },
          {
            "type": "text",
            "text": "ระบบบันทึกเวลาปฏิบัติงานออนไลน์ FlowWork 360",
            "color": "#f0fdf4",
            "size": "xs",
            "margin": "sm",
            "wrap": true
          }
        ]
      },
      "body": {
        "type": "box",
        "layout": "vertical",
        "paddingAll": "xl",
        "contents": [
          ...(hasValidPhotoUrl ? [
            {
              "type": "image",
              "url": verifiedPhotoUrl,
              "size": "full",
              "aspectRatio": "1.51:1",
              "aspectMode": "cover",
              "margin": "none"
            },
            {
              "type": "separator",
              "margin": "md",
              "color": "#f1f5f9"
            }
          ] : []),
          {
            "type": "box",
            "layout": "horizontal",
            "contents": [
              {
                "type": "text",
                "text": "วันที่บันทึก",
                "size": "sm",
                "color": "#94a3b8"
              },
              {
                "type": "text",
                "text": `${formattedDate} ${formattedTime} น.`,
                "size": "sm",
                "color": "#334155",
                "align": "end",
                "weight": "bold",
                "wrap": true
              }
            ]
          },
          {
            "type": "separator",
            "margin": "md",
            "color": "#f1f5f9"
          },
          {
            "type": "text",
            "text": `พนักงาน: ${attendance.employeeName}`,
            "weight": "bold",
            "size": "md",
            "color": "#0f172a",
            "margin": "md",
            "wrap": true
          },
          {
            "type": "box",
            "layout": "vertical",
            "margin": "md",
            "backgroundColor": "#f8fafc",
            "paddingAll": "md",
            "cornerRadius": "md",
            "contents": [
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "contents": [
                  { "type": "text", "text": "ตำแหน่ง/บทบาท", "color": "#64748b", "size": "xs", "flex": 4 },
                  { "type": "text", "text": attendance.role || 'ช่างควบคุมเครื่องจักร', "color": "#334155", "size": "xs", "flex": 5, "weight": "bold", "wrap": true }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "แผนก/ส่วนงาน", "color": "#64748b", "size": "xs", "flex": 4 },
                  { "type": "text", "text": "กองพัสดุและซ่อมบำรุง", "color": "#334155", "size": "xs", "flex": 5, "wrap": true }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "ไซต์ปฏิบัติงาน", "color": "#64748b", "size": "xs", "flex": 4 },
                  { "type": "text", "text": attendance.siteName || 'ไซต์งานหลัก CMMS', "color": "#334155", "size": "xs", "flex": 5, "wrap": true }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "บันทึกเวลา", "color": "#64748b", "size": "xs", "flex": 4 },
                  { "type": "text", "text": timeLabel, "color": headerBgColor, "size": "xs", "flex": 5, "weight": "bold", "wrap": true }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "พิกัดดาวเทียม (GPS)", "color": "#64748b", "size": "xs", "flex": 4 },
                  { "type": "text", "text": isCheckOut ? (attendance.gpsLocOut || 'ไม่ระบุ') : attendance.gpsLocIn, "color": "#3b82f6", "size": "xs", "flex": 5, "weight": "bold", "wrap": true }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "ภาพถ่ายใบหน้า", "color": "#64748b", "size": "xs", "flex": 4 },
                  { "type": "text", "text": targetPhoto && targetPhoto.startsWith('data:') ? "📸 เซลฟี่ใบหน้าจริงสำเร็จ" : "👤 ใช้ภาพโปรไฟล์แทน", "color": "#0d9488", "size": "xs", "flex": 5, "weight": "bold", "wrap": true }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "การทำงานล่วงเวลา (OT)", "color": "#64748b", "size": "xs", "flex": 4 },
                  { "type": "text", "text": attendance.isOvertime ? "อนุมัติค่าล่วงเวลา (มี OT) 💰" : "ชั่วโมงงานปกติ", "color": attendance.isOvertime ? "#eab308" : "#64748b", "size": "xs", "flex": 5, "weight": "bold", "wrap": true }
                ]
              }
            ]
          }
        ]
      }
    }
  };

  return await pushLineFlexMessage(flexJson, 'attendance');
}

export async function sendLineExpenseNotification(expense: ExpenseRecord) {
  const formattedDate = new Date().toLocaleDateString('th-TH');
  const formattedTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const categoryThai = 
    expense.category === 'fuel' ? '⛽ ค่าน้ำมันเชื้อเพลิง (Fuel)' :
    expense.category === 'repair' ? '🔧 ค่าซ่อมแซม/บำรุงรักษา (Repair)' :
    expense.category === 'labor' ? '👷 ค่าแรงงาน/วิศวกร (Labor)' :
    expense.category === 'parts' ? '⚙️ ค่าอะไหล่สำรอง (Parts)' :
    expense.category === 'transport' ? '🚚 ค่าขนส่ง/โลจิสติกส์ (Transport)' :
    expense.category === 'rent' ? '🏢 ค่าเช่าเครื่องจักร/สถานที่ (Rent)' : '📦 รายจ่ายอื่น ๆ (Other)';

  const validatedReceiptPhoto = ensureValidImageUrl(expense.receiptPhoto);

  const flexJson = {
    "type": "flex",
    "altText": `💰 บันทึกรายจ่ายใหม่: [${expense.category.toUpperCase()}] ${expense.amount.toLocaleString()} บาท`,
    "contents": {
      "type": "bubble",
      "size": "mega",
      "header": {
        "type": "box",
        "layout": "vertical",
        "backgroundColor": "#2563eb",
        "paddingAll": "xl",
        "contents": [
          {
            "type": "text",
            "text": "💰 บันทึกรายงานค่าใช้จ่ายโครงการ",
            "weight": "bold",
            "color": "#ffffff",
            "size": "lg"
          },
          {
            "type": "text",
            "text": "ระบบควบคุมต้นทุนและประวัติรายจ่ายงบประมาณ",
            "color": "#dbeafe",
            "size": "xs",
            "margin": "sm"
          }
        ]
      },
      "body": {
        "type": "box",
        "layout": "vertical",
        "paddingAll": "xl",
        "contents": [
          ...(validatedReceiptPhoto ? [
            {
              "type": "image",
              "url": validatedReceiptPhoto,
              "size": "full",
              "aspectRatio": "1.51:1",
              "aspectMode": "cover",
              "margin": "none"
            },
            {
              "type": "separator",
              "margin": "md",
              "color": "#f1f5f9"
            }
          ] : []),
          {
            "type": "box",
            "layout": "horizontal",
            "contents": [
              {
                "type": "text",
                "text": "บันทึกเมื่อ",
                "size": "sm",
                "color": "#94a3b8"
              },
              {
                "type": "text",
                "text": `${formattedDate} ${formattedTime} น.`,
                "size": "sm",
                "color": "#334155",
                "align": "end",
                "weight": "bold"
              }
            ]
          },
          {
            "type": "separator",
            "margin": "md",
            "color": "#f1f5f9"
          },
          {
            "type": "text",
            "text": `รายการ: ${expense.description}`,
            "weight": "bold",
            "size": "md",
            "color": "#0f172a",
            "margin": "md",
            "wrap": true
          },
          {
            "type": "box",
            "layout": "vertical",
            "margin": "md",
            "backgroundColor": "#eff6ff",
            "paddingAll": "md",
            "cornerRadius": "md",
            "contents": [
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "contents": [
                  { "type": "text", "text": "หมวดหมู่ค่าใช้จ่าย", "color": "#1e40af", "size": "xs", "flex": 4, "weight": "bold" },
                  { "type": "text", "text": categoryThai, "color": "#1e3a8a", "size": "xs", "flex": 5, "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "จำนวนเงินสุทธิ", "color": "#1e40af", "size": "xs", "flex": 4 },
                  { "type": "text", "text": `${expense.amount.toLocaleString()} บาท`, "color": "#dc2626", "size": "sm", "flex": 5, "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "ไซต์งานต้นทาง", "color": "#64748b", "size": "xs", "flex": 4 },
                  { "type": "text", "text": expense.siteLocation || 'ไซต์งานหลัก CMMS', "color": "#334155", "size": "xs", "flex": 5 }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "ผู้บันทึกระบบ", "color": "#64748b", "size": "xs", "flex": 4 },
                  { "type": "text", "text": expense.recordedBy || 'Admin', "color": "#334155", "size": "xs", "flex": 5 }
                ]
              }
            ]
          }
        ]
      }
    }
  };

  return await pushLineFlexMessage(flexJson);
}

/**
 * 9. [EMERALD] Builds and sends an automated LINE Flex message for new Job Submissions (หน้าส่งงาน)
 */
export async function sendLineJobSubmissionNotification(
  taskTitle: string,
  submitter: string,
  description: string,
  progress: number,
  gps: string,
  photoUrl?: string
) {
  const formattedDate = new Date().toLocaleDateString('th-TH');
  const formattedTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  const bubble: any = {
    "type": "bubble",
    "size": "mega",
    "header": {
      "type": "box",
      "layout": "vertical",
      "backgroundColor": "#10b981",
      "paddingAll": "xl",
      "contents": [
        {
          "type": "text",
          "text": "⚙️ รายงานส่งมอบแผนงานสำเร็จ",
          "weight": "bold",
          "color": "#ffffff",
          "size": "lg"
        },
        {
          "type": "text",
          "text": "ระบบแจ้งส่งรายงานและปิดตารางงาน FlowWork CMMS",
          "color": "#d1fae5",
          "size": "xs",
          "margin": "sm"
        }
      ]
    },
    "body": {
      "type": "box",
      "layout": "vertical",
      "paddingAll": "xl",
      "contents": [
        {
          "type": "text",
          "text": `ชื่องานปฏิบัติการ: ${taskTitle}`,
          "weight": "bold",
          "size": "md",
          "color": "#0f172a",
          "wrap": true
        },
        {
          "type": "box",
          "layout": "vertical",
          "margin": "lg",
          "backgroundColor": "#f8fafc",
          "paddingAll": "md",
          "cornerRadius": "md",
          "contents": [
            {
              "type": "box",
              "layout": "baseline",
              "spacing": "sm",
              "contents": [
                { "type": "text", "text": "ผู้ลงชื่อส่งงาน", "color": "#64748b", "size": "xs", "flex": 4, "weight": "bold" },
                { "type": "text", "text": submitter, "color": "#1e293b", "size": "xs", "flex": 5, "weight": "bold" }
              ]
            },
            {
              "type": "box",
              "layout": "baseline",
              "spacing": "sm",
              "margin": "sm",
              "contents": [
                { "type": "text", "text": "ระดับความสำเร็จ", "color": "#64748b", "size": "xs", "flex": 4 },
                { "type": "text", "text": `${progress}%`, "color": progress === 100 ? "#10b981" : "#f59e0b", "size": "xs", "flex": 5, "weight": "bold" }
              ]
            },
            {
              "type": "box",
              "layout": "baseline",
              "spacing": "sm",
              "margin": "sm",
              "contents": [
                { "type": "text", "text": "รายละเอียดสรุป", "color": "#64748b", "size": "xs", "flex": 4 },
                { "type": "text", "text": description || 'ไม่มีรายละเอียดเพิ่มเติม', "color": "#334155", "size": "xs", "flex": 5, "wrap": true }
              ]
            },
            {
              "type": "box",
              "layout": "baseline",
              "spacing": "sm",
              "margin": "sm",
              "contents": [
                { "type": "text", "text": "วันเวลาที่ส่งงาน", "color": "#64748b", "size": "xs", "flex": 4 },
                { "type": "text", "text": `${formattedDate} ${formattedTime} น.`, "color": "#475569", "size": "xs", "flex": 5 }
              ]
            },
            {
              "type": "box",
              "layout": "baseline",
              "spacing": "sm",
              "margin": "sm",
              "contents": [
                { "type": "text", "text": "GPS หน้างาน", "color": "#64748b", "size": "xs", "flex": 4 },
                { "type": "text", "text": gps || 'ไม่ได้ระบุพิกัด', "color": "#475569", "size": "xs", "flex": 5 }
              ]
            }
          ]
        }
      ]
    }
  };

  const verifiedPhoto = ensureValidImageUrl(photoUrl);
  if (verifiedPhoto) {
    bubble.hero = {
      "type": "image",
      "url": verifiedPhoto,
      "size": "full",
      "aspectRatio": "16:11",
      "aspectMode": "cover"
    };
  }

  const flexJson = {
    "type": "flex",
    "altText": `⚙️ ส่งงานสำเร็จ (${progress}%): ${taskTitle}`,
    "contents": bubble
  };

  return await pushLineFlexMessage(flexJson);
}

/**
 * Sends a unified, beautifully styled Google Drive + LINE OA Flex notification
 */
export async function sendGoogleDriveLineNotification(params: {
  docId: string;
  jobType: string;
  operator: string;
  timestamp: string;
  status: string;
  imageUrl?: string;
  category?: 'attendance' | 'work' | 'operations' | 'fuel' | 'test';
}) {
  const { docId, jobType, operator, timestamp, status, imageUrl, category: paramCategory } = params;
  
  const displayId = docId || "JOB-MOCK-ID";
  const appUrl = (typeof window !== 'undefined' && window.location) 
    ? window.location.origin 
    : (process.env.APP_URL || "https://ais-dev-v4xmqfyvpohkbt7yv5i5b4-778841450865.asia-southeast1.run.app");
  
  const actionUrl = `${appUrl}/jobs/${displayId}`;
  const activeImgUrl = (imageUrl && imageUrl.startsWith("http")) 
    ? imageUrl
    : "https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&q=80&w=600";

  const flexJson = {
    "type": "flex",
    "altText": `🔔 แจ้งเตือนรายการใหม่: [${jobType}] ${displayId}`,
    "contents": {
      "type": "bubble",
      "size": "mega",
      "header": {
        "type": "box",
        "layout": "vertical",
        "backgroundColor": "#1e3a8a",
        "paddingAll": "lg",
        "contents": [
          {
            "type": "text",
            "text": "🔔 แจ้งเตือนรายการใหม่",
            "weight": "bold",
            "color": "#ffffff",
            "size": "md",
            "align": "center"
          }
        ]
      },
      "hero": {
        "type": "image",
        "url": activeImgUrl,
        "size": "full",
        "aspectRatio": "16:9",
        "aspectMode": "cover"
      },
      "body": {
        "type": "box",
        "layout": "vertical",
        "spacing": "md",
        "paddingAll": "lg",
        "contents": [
          {
            "type": "box",
            "layout": "horizontal",
            "spacing": "xs",
            "contents": [
              {
                "type": "text",
                "text": "เลขที่เอกสาร",
                "size": "xs",
                "color": "#64748b",
                "flex": 4
              },
              {
                "type": "text",
                "text": displayId,
                "size": "xs",
                "weight": "bold",
                "color": "#1e293b",
                "align": "end",
                "flex": 8
              }
            ]
          },
          {
            "type": "box",
            "layout": "horizontal",
            "spacing": "xs",
            "contents": [
              {
                "type": "text",
                "text": "ประเภทงาน",
                "size": "xs",
                "color": "#64748b",
                "flex": 4
              },
              {
                "type": "text",
                "text": jobType,
                "size": "xs",
                "color": "#0f766e",
                "align": "end",
                "weight": "bold",
                "flex": 8
              }
            ]
          },
          {
            "type": "box",
            "layout": "horizontal",
            "spacing": "xs",
            "contents": [
              {
                "type": "text",
                "text": "ผู้ดำเนินการ",
                "size": "xs",
                "color": "#64748b",
                "flex": 4
              },
              {
                "type": "text",
                "text": operator,
                "size": "xs",
                "color": "#334155",
                "align": "end",
                "flex": 8
              }
            ]
          },
          {
            "type": "box",
            "layout": "horizontal",
            "spacing": "xs",
            "contents": [
              {
                "type": "text",
                "text": "วันที่เวลา",
                "size": "xs",
                "color": "#64748b",
                "flex": 4
              },
              {
                "type": "text",
                "text": timestamp,
                "size": "xs",
                "color": "#334155",
                "align": "end",
                "flex": 8
              }
            ]
          },
          {
            "type": "box",
            "layout": "horizontal",
            "spacing": "xs",
            "contents": [
              {
                "type": "text",
                "text": "สถานะ",
                "size": "xs",
                "color": "#64748b",
                "flex": 4
              },
              {
                "type": "text",
                "text": status,
                "size": "xs",
                "color": "#b91c1c",
                "align": "end",
                "weight": "bold",
                "flex": 8
              }
            ]
          }
        ]
      },
      "footer": {
        "type": "box",
        "layout": "vertical",
        "spacing": "sm",
        "contents": [
          {
            "type": "button",
            "style": "primary",
            "color": "#2563eb",
            "height": "sm",
            "action": {
              "type": "uri",
              "label": "เปิดรายการตรวจสอบ",
              "uri": actionUrl
            }
          }
        ]
      }
    }
  };

  const lowerJob = String(jobType || "").toLowerCase().trim();
  let category: 'attendance' | 'work' | 'operations' | 'fuel' | 'test' = paramCategory || 'work';
  if (!paramCategory) {
    if (
      lowerJob.includes("checkin") || 
      lowerJob.includes("checkout") || 
      lowerJob.includes("check in") || 
      lowerJob.includes("check out") || 
      lowerJob.includes("attendance") || 
      lowerJob.includes("ลงเวลา")
    ) {
      category = 'attendance';
    } else if (lowerJob.includes("fuel") || lowerJob.includes("น้ำมัน") || lowerJob.includes("refuel")) {
      category = 'fuel';
    } else if (lowerJob.includes("test") || lowerJob.includes("ทดสอบ")) {
      category = 'test';
    }
  }

  return await pushLineFlexMessage(flexJson, category);
}

/**
 * Upload base64 image, save database metadata (Supabase & localStorage) and trigger line notification.
 */
export async function uploadFileAndNotify(params: {
  image: string;
  module: string;
  docId: string;
  uploadBy: string;
  status: string;
}): Promise<string> {
  const { image, module: moduleName, docId, uploadBy, status } = params;
  
  if (!image) {
    console.warn("No image found to upload, returning empty.");
    return "";
  }

  // If the image is not a base64 string, it's already a URL, so just trigger notification
  if (!image.startsWith("data:")) {
    try {
      const thaiDate = new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
      await sendGoogleDriveLineNotification({
        docId,
        jobType: moduleName,
        operator: uploadBy,
        timestamp: thaiDate,
        status,
        imageUrl: image
      });
    } catch (e) {
      console.warn("Error running notification for already uploaded image:", e);
    }
    return image;
  }

  try {
    const response = await fetch('/api/upload-photo', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image,
        module: moduleName,
        docId,
        uploadBy
      })
    });

    if (!response.ok) {
      throw new Error(`Upload endpoint error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Upload response success false");
    }

    // Save to DB
    const uploadMeta = {
      id: `drv-${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      fileName: data.fileName,
      fileUrl: data.url,
      driveFileId: data.fileId || `fallback-${Date.now()}`,
      uploadDate: data.uploadDate || new Date().toISOString(),
      uploadBy: data.uploadBy || uploadBy,
      module: data.module,
      documentNo: data.documentNo
    };

    await saveGoogleDriveUpload(uploadMeta);

    // Prompt LINE Flex notification
    const thaiDate = new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
    await sendGoogleDriveLineNotification({
      docId,
      jobType: moduleName,
      operator: uploadBy,
      timestamp: thaiDate,
      status,
      imageUrl: data.url
    });

    return data.url;
  } catch (err) {
    console.error("Error in uploadFileAndNotify:", err);
    // Return base64 as fallback so it displays
    return image;
  }
}

/**
 * Sends a modularized sample Test Flex Message to verify Line config for a specific category
 */
export async function testLineNotification(category: 'attendance' | 'operations' | 'fuel' | 'test') {
  const categoryTitle = 
    category === 'attendance' ? '🕒 ระบบลงเวลากล้อง GPS (Attendance)' :
    category === 'fuel' ? '⛽ ระบบเบิกเติมน้ำมันเชื้อเพลิง (Fueling)' :
    category === 'test' ? '🧪 กลุ่มทดสอบความเข้ากันได้ทุกระบบ (Main Test Group)' :
    '⚙️ ระบบส่งงาน & แจ้งซ่อมเครื่องจักร (Operations)';

  const headingColor = 
    category === 'attendance' ? '#6f42c1' :
    category === 'fuel' ? '#b45309' : 
    category === 'test' ? '#4f46e5' : '#0284c7';

  const testFlex = {
    "type": "bubble",
    "size": "mega",
    "header": {
      "type": "box",
      "layout": "vertical",
      "backgroundColor": headingColor,
      "paddingAll": "xl",
      "contents": [
        {
          "type": "text",
          "text": "⚡ สัญญาณทดสอบการเชื่อมต่อกลุ่ม",
          "weight": "bold",
          "color": "#ffffff",
          "size": "md"
        },
        {
          "type": "text",
          "text": "ระบบแจ้งเตือนอัตโนมัติ FlowWork CMMS 360",
          "color": "#f1f5f9",
          "size": "xs",
          "margin": "xs"
        }
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
          "spacing": "md",
          "contents": [
            {
              "type": "text",
              "text": "🟢 ยืนยันเชื่อมต่อสำเร็จหลัก!",
              "weight": "bold",
              "size": "sm",
              "color": "#05B905"
            },
            {
              "type": "text",
              "text": `กลุ่มรับข้อมูล: ${categoryTitle}`,
              "size": "xs",
              "color": "#1e293b",
              "weight": "bold"
            },
            {
              "type": "text",
              "text": "ช่องทางแชทนี้ได้รับสิทธิกระจายข่าวจากฐานข้อมูล FlowWork Cloud เรียบร้อยแล้ว พร้อมส่งมอบรายการส่งงาน ใบขอสแกน พิกัด GPS ความเที่ยงตรงสูงในลำดับถัดไป",
              "size": "xs",
              "color": "#64748b",
              "wrap": true
            },
            {
              "type": "separator",
              "color": "#f1f5f9"
            },
            {
              "type": "box",
              "layout": "horizontal",
              "contents": [
                { "type": "text", "text": "อุปกรณ์ทดสอบ", "size": "xxs", "color": "#94a3b8" },
                { "type": "text", "text": "FlowWork Web Console Client", "size": "xxs", "color": "#475569", "align": "end" }
              ]
            }
          ]
        }
      ]
    }
  };

  return await pushLineFlexMessage(testFlex, category === 'operations' ? 'work' : category);
}


