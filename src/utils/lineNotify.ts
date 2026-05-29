import { WorkScheduleTask, RepairRequest, HeavyMachinery } from '../types';

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
 * Builds and sends an automated LINE Flex message for new Work Schedule Tasks
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
    "altText": `📢 แจ้งเตือนตารางงานใหม่: ${task.title}`,
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
            "text": "📅 มอบหมายแผนงานใหม่",
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
                  { "type": "text", "text": "วันที่ส่งเรื่อง", "size": "sm", "color": "#64748b" },
                  { "type": "text", "text": formattedDate, "size": "sm", "color": "#1e293b", "align": "end", "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  { "type": "text", "text": "เวลาทำรายการ", "size": "sm", "color": "#64748b" },
                  { "type": "text", "text": formattedTime, "size": "sm", "color": "#1e293b", "align": "end" }
                ]
              },
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  { "type": "text", "text": "ช่างผู้รับผิดชอบ", "size": "sm", "color": "#64748b" },
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
                "text": `งาน: ${task.title}`,
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
                  { "type": "text", "text": "เครื่องจักร", "color": "#64748b", "size": "xs", "flex": 2 },
                  { "type": "text", "text": machineryCode, "wrap": true, "color": "#334155", "size": "xs", "flex": 5, "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "กำหนดส่ง", "color": "#64748b", "size": "xs", "flex": 2 },
                  { "type": "text", "text": task.dueDate, "wrap": true, "color": "#334155", "size": "xs", "flex": 5, "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "ความเร่งด่วน", "color": "#64748b", "size": "xs", "flex": 2 },
                  { "type": "text", "text": priorityText, "wrap": true, "color": priorityColor, "size": "xs", "flex": 5, "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "พิกัด/ไซต์", "color": "#64748b", "size": "xs", "flex": 2 },
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
 * Builds and sends an automated LINE Flex message for new Repair Requests
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
        "backgroundColor": "#fd7e14",
        "paddingAll": "xl",
        "contents": [
          {
            "type": "text",
            "text": "🚨 มีการแจ้งซ่อมใหม่ด่วน!",
            "weight": "bold",
            "color": "#ffffff",
            "size": "xl"
          },
          {
            "type": "text",
            "text": "ระบบแจ้งซ่อมฉุกเฉิน CMMS 360",
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
                "text": "เลขรหัสใบแจ้งซ่อม",
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
                  { "type": "text", "text": "วันที่แจ้งเรื่อง", "size": "sm", "color": "#64748b" },
                  { "type": "text", "text": formattedDate, "size": "sm", "color": "#1e293b", "align": "end", "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  { "type": "text", "text": "เวลาทำรายการ", "size": "sm", "color": "#64748b" },
                  { "type": "text", "text": formattedTime, "size": "sm", "color": "#1e293b", "align": "end" }
                ]
              },
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  { "type": "text", "text": "ผู้บันทึกแจ้งซ่อม", "size": "sm", "color": "#64748b" },
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
                "text": `เครื่องจักร: ${machineryCode}`,
                "weight": "bold",
                "size": "md",
                "color": "#0f172a"
              },
              {
                "type": "text",
                "text": `ปัญหาที่พบ: ${repair.problemDesc}`,
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
                  { "type": "text", "text": "ระดับความรุนแรง", "color": "#64748b", "size": "xs", "flex": 3 },
                  { "type": "text", "text": urgencyText, "wrap": true, "color": urgencyColor, "size": "xs", "flex": 5, "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "ชั่วโมงใช้งานล่าสุด", "color": "#64748b", "size": "xs", "flex": 3 },
                  { "type": "text", "text": `${repair.hoursMeterRecorded} ชม.`, "wrap": true, "color": "#334155", "size": "xs", "flex": 5, "weight": "bold" }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "margin": "sm",
                "contents": [
                  { "type": "text", "text": "สถานที่เครื่องจักรเสีย", "color": "#64748b", "size": "xs", "flex": 3 },
                  { "type": "text", "text": repair.gpsLoc, "wrap": true, "color": "#334155", "size": "xs", "flex": 5, "weight": "bold" }
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
