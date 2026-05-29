import { WorkScheduleTask, RepairRequest, HeavyMachinery, InventoryIssuance, StockItem, RefuelStatus, AttendanceLog, ExpenseRecord } from '../types';

const CHANNEL_ACCESS_TOKEN = "LOsEWhXvFup41WFZWMyMZtUwqGFWws583/YbGvEGtADMlAEfw1kJoc61miQlxR155ayovX2w+wQnWAAUGqKInRMkg43XgFvxcXoo8QkbPbDOso+a0PpwwBQDFUjQYF9LIuiemAo9f/iqKRxsJh6UXgdB04t89/1O/w1cDnyilFU=";
const GROUP_ID = "C94ac0eec7f7dc7b97fd2767104d1e7a0";

/**
 * Sends a pre-compiled Flex Message to the default LINE group
 */
export async function pushLineFlexMessage(flexMessage: any) {
  try {
    const response = await fetch('/api/line/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        flexMessage,
        channelAccessToken: CHANNEL_ACCESS_TOKEN,
        groupId: GROUP_ID
      })
    });
    
    const result = await response.json();
    if (!response.ok) {
      console.error("Failed to push LINE notification:", result.error || "Unknown error");
      return { success: false, error: result.error || "Unknown error" };
    }
    console.log("LINE push notification sent successfully");
    return { success: true };
  } catch (error: any) {
    console.error("Error pushing LINE notification:", error);
    return { success: false, error: error.message };
  }
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
    task.priority === 'critical' ? '🔴 วิกฤต (Critical)' :
    task.priority === 'high' ? '🟠 สูง (High)' :
    task.priority === 'medium' ? '🟣 ปานกลาง (Medium)' : '🟢 ต่ำ (Low)';

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
            "text": "📅 มอบหมายแผนงานปฏิบัติการ",
            "weight": "bold",
            "color": "#ffffff",
            "size": "xl"
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
            "layout": "horizontal",
            "contents": [
              {
                "type": "text",
                "text": "เลขที่อ้างอิง",
                "size": "sm",
                "color": "#94a3b8"
              },
              {
                "type": "text",
                "text": task.id,
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
                  { "type": "text", "text": "วันที่ส่งแผนงาน", "size": "sm", "color": "#64748b" },
                  { "type": "text", "text": formattedDate, "size": "sm", "color": "#1e293b", "align": "end", "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  { "type": "text", "text": "เวลาส่งมอบงาน", "size": "sm", "color": "#64748b" },
                  { "type": "text", "text": formattedTime, "size": "sm", "color": "#1e293b", "align": "end" }
                ]
              },
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  { "type": "text", "text": "ช่างผู้ทำงาน", "size": "sm", "color": "#64748b" },
                  { "type": "text", "text": task.assignedTo, "size": "sm", "color": "#111827", "align": "end", "weight": "bold" }
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
                  { "type": "text", "text": "เครื่องจักรใช้งาน", "color": "#64748b", "size": "xs", "flex": 2.5 },
                  { "type": "text", "text": machineryCode, "wrap": true, "color": "#334155", "size": "xs", "flex": 5, "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "กำหนดส่งมอบ", "color": "#64748b", "size": "xs", "flex": 2.5 },
                  { "type": "text", "text": task.dueDate || 'ไม่ระบุ', "wrap": true, "color": "#334155", "size": "xs", "flex": 5, "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "ความด่วนของงาน", "color": "#64748b", "size": "xs", "flex": 2.5 },
                  { "type": "text", "text": priorityText, "wrap": true, "color": priorityColor, "size": "xs", "flex": 5, "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "สถานที่หน้างาน", "color": "#64748b", "size": "xs", "flex": 2.5 },
                  { "type": "text", "text": task.gpsLocName || 'ไม่ระบุพิกัด', "wrap": true, "color": "#334155", "size": "xs", "flex": 5, "weight": "bold" }
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

  return await pushLineFlexMessage(flexJson);
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
            "size": "lg"
          },
          {
            "type": "text",
            "text": "ระบบบันทึกเวลาปฏิบัติงานออนไลน์ FlowWork 360",
            "color": "#f0fdf4",
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
          ...(attendance.photoUrl ? [
            {
              "type": "image",
              "url": attendance.photoUrl,
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
            "text": `พนักงาน: ${attendance.employeeName}`,
            "weight": "bold",
            "size": "md",
            "color": "#0f172a",
            "margin": "md"
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
                  { "type": "text", "text": attendance.role || 'ช่างควบคุมเครื่องจักร', "color": "#334155", "size": "xs", "flex": 5, "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "แผนก/ส่วนงาน", "color": "#64748b", "size": "xs", "flex": 4 },
                  { "type": "text", "text": "กองพัสดุและซ่อมบำรุง", "color": "#334155", "size": "xs", "flex": 5 }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "ไซต์ปฏิบัติงาน", "color": "#64748b", "size": "xs", "flex": 4 },
                  { "type": "text", "text": attendance.siteName || 'ไซต์งานหลัก CMMS', "color": "#334155", "size": "xs", "flex": 5 }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "บันทึกเวลา", "color": "#64748b", "size": "xs", "flex": 4 },
                  { "type": "text", "text": timeLabel, "color": headerBgColor, "size": "xs", "flex": 5, "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "พิกัดดาวเทียม (GPS)", "color": "#64748b", "size": "xs", "flex": 4 },
                  { "type": "text", "text": isCheckOut ? (attendance.gpsLocOut || 'ไม่ระบุ') : attendance.gpsLocIn, "color": "#3b82f6", "size": "xs", "flex": 5, "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "การทำงานล่วงเวลา (OT)", "color": "#64748b", "size": "xs", "flex": 4 },
                  { "type": "text", "text": attendance.isOvertime ? "อนุมัติค่าล่วงเวลา (มี OT) 💰" : "ชั่วโมงงานปกติ", "color": attendance.isOvertime ? "#eab308" : "#64748b", "size": "xs", "flex": 5, "weight": "bold" }
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
          ...(expense.receiptPhoto ? [
            {
              "type": "image",
              "url": expense.receiptPhoto,
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
