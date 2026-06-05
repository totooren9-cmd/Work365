/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Send, Check, Copy, MessageSquare, Info } from 'lucide-react';

type FlexType = 'issue' | 'receive' | 'schedule' | 'repair' | 'general';

interface BaseFlexData {
  type: FlexType;
  title: string;
  docNo: string;
  date: string;
  time: string;
  person: string;
  projectName?: string;
  location?: string;
  items?: Array<{ name: string; qty: number; unit: string; pricePerUnit?: number }>;
  totalAmount?: number;
  textColor?: string;
  bgColor?: string;
  extraDetails?: Record<string, string>;
}

export default function LineFlexBuilder() {
  const [activeType, setActiveType] = useState<FlexType>('issue');
  const [copied, setCopied] = useState(false);

  const [flexData, setFlexData] = useState<Record<FlexType, BaseFlexData>>({
    issue: {
      type: 'issue',
      title: '📤 แจ้งพัสดุและอนุมัติเบิกพัสดุคลัง',
      bgColor: 'bg-[#cf3545]', // Crimson Red
      textColor: 'text-[#cf3545]',
      docNo: 'REQ-260529-021',
      date: '2026-05-29',
      time: '09:15:30',
      person: 'ช่างพงษ์ศักดดิ์ (ผู้ขอเบิก)',
      projectName: 'ไซต์งานก่อสร้างทางหลวงจังหวัดเชียงใหม่ (สายเหนือ)',
      location: 'คลังพัสดุย่อย 3 (แม่น้ำปิง)',
      items: [
        { name: 'ไส้กรองน้ำมันเชื้อเพลิง ISUZU DECA', qty: 2, unit: 'ชิ้น', pricePerUnit: 850 },
        { name: 'สายพานขับพัดลมระบายความร้อนหม้อน้ำ', qty: 1, unit: 'เส้น', pricePerUnit: 1200 },
      ],
      totalAmount: 2900,
      extraDetails: {
        'สถานะคำขอเบิก': '🟢 อนุมัติการเบิกพัสดุเรียบร้อย',
        'ผู้อนุมัติเรื่อง': 'ผจก. วิชัย นพเกล้า',
        'การประยุกต์ใช้': 'บำรุงรักษาเชิงป้องกันตามรอบบริการ'
      }
    },
    receive: {
      type: 'receive',
      title: '📥 ยืนยันรับรายการจัดซื้อเข้าคลังสินค้า',
      bgColor: 'bg-[#007aff]', // Royal Blue
      textColor: 'text-[#007aff]',
      docNo: 'RCV-2026-0048',
      date: '2026-05-29',
      time: '14:20:00',
      person: 'สมบูรณ์ สิริมั่งคั่ง (ผู้ตรวจรับเข้าคลัง)',
      projectName: 'ใบสั่งซื้อเลขที่: PO-2026-99015',
      location: 'ซัพพลายเออร์: สยามแมชชีน พาร์ท จำกัด',
      items: [
        { name: 'ยางนอกรถตักดินล้อยางขนาด 12-16.5', qty: 4, unit: 'เส้น', pricePerUnit: 6500 },
        { name: 'จาระบีทนความร้อนสูง Shell Gadus S2', qty: 10, unit: 'ถัง', pricePerUnit: 950 },
      ],
      totalAmount: 35500,
      extraDetails: {
        'คลังปลายทาง': 'คลังอะไหล่สำนักงานใหญ่ (Zone B)',
        'การรับประกัน': 'รับประกันความชำรุดจากการขนส่ง 1 ปี',
        'ผู้ขนส่ง': 'DHL Express Logistics'
      }
    },
    schedule: {
      type: 'schedule',
      title: '📅 แจ้งแผนงานและมอบหมายตารางงานช่าง',
      bgColor: 'bg-[#6f42c1]', // Deep Purple
      textColor: 'text-[#6f42c1]',
      docNo: 'SCH-260529-001',
      date: '2026-05-29',
      time: '08:00:00',
      person: 'วิศวกรควบคุม สมศักดิ์ แสนดี',
      projectName: 'โครงการสร้างทางยกระดับบางปะอิน แขวงทางหลวง 2',
      location: 'พิกัด กม. 45+800 ฝั่งขาเข้ากรุงเทพฯ',
      extraDetails: {
        'ช่างปฏิบัติงาน': 'ทีมช่างงานระบบเครื่องกล 2',
        'ภารกิจ': 'เทคอนกรีตเสริมเหล็กฐานรากตอม่อเบอร์ A12',
        'เครื่องจักรหลัก': 'รถโม่คอนกรีต CPAC (MIX-02)',
        'ระดับความเร่งด่วน': '🔴 สูงสุด (High Priority)',
        'กำหนดส่งชิ้นงาน': 'ส่งมอบก่อนเวลา 17:00 น. วันนี้'
      }
    },
    repair: {
      type: 'repair',
      title: '🚨 ใบแจ้งซ่อมเครื่องจักรชำรุดฉุกเฉิน',
      bgColor: 'bg-[#fd7e14]', // Bright Orange
      textColor: 'text-[#fd7e14]',
      docNo: 'REP-260529-880',
      date: '2026-05-29',
      time: '10:15:45',
      person: 'กิตติศักดิ์ พลขับประจำรถตัก',
      projectName: 'สายซ่อมบำรุงฉุกเฉินระดับ 1',
      location: 'หน้างานก่อสร้างคลองชลประทาน เฟส 3',
      extraDetails: {
        'เครื่องจักรชำรุด': 'รถขุดตักดิน Caterpillar 320D (EXC-105)',
        'อาการเสียชำรุด': 'สายไฮดรอลิกฝั่งขวารั่วซึมรุนแรง ระบบแรงดันขาดตกรวดเร็ว',
        'ชั่วโมงสะสมล่าสุด': '12,450 ชม.',
        'ระดับความรุนแรง': '🔥 วิกฤตสูงสุด (Critical - สั่งหยุดใช้งานทันที)',
        'พิกัดที่เสียสำรอง': '13.7563, 100.5018 (ฝั่งทิศตะวันตกเฉียงใต้)'
      }
    },
    general: {
      type: 'general',
      title: '📢 ประกาศและข่าวสารทั่วไปภายในองค์การ',
      bgColor: 'bg-[#198754]', // Forest Green
      textColor: 'text-[#198754]',
      docNo: 'ANN-2026-332',
      date: '2026-05-29',
      time: '12:00:00',
      person: 'แผนกบริหารทรัพยากรบุคคล (HR) & คณะกรรมการความปลอดภัย',
      projectName: 'ประกาศเริ่มมาตรการความปลอดภัยและระบบสแกนระบบใหม่',
      location: 'ทุกแผนกและไซต์งานก่อสร้างทั่วประเทศ',
      extraDetails: {
        'เรื่องแจ้งพนักงาน': 'ขอความร่วมมือพนักงานทุกท่าน เริ่มใช้ระบบจัดเก็บประวัติซ่อมบำรุงด้วย QR Code',
        'มาตรการหลัก': 'สแกนคิวอาร์โค้ดบนพวงมาลัยเครื่องก่อนดึงกุญแจทุกครั้งเพื่อยืนยันชั่วโมงใช้งาน',
        'กรณีพบปัญหา': 'แจ้งประสานงานฝ่ายไอทีศูนย์กลาง หมายเลขภายใน 104',
        'ผู้ลงนามระเบียบ': 'ดร.ชาญวิทย์ พัฒนพิบูลย์ (ประธานฝ่ายทรัพยากร)'
      }
    }
  });

  const currentData = flexData[activeType];

  const [channelAccessToken, setChannelAccessToken] = useState(() => 
    localStorage.getItem('LINE_CHANNEL_ACCESS_TOKEN') || 'emexPY8OBr3kHbSKKDRNh9W33tnL9dHqLxtD3Zqwx6fYBpy7UMv6BqU65FAJ8L1VhXdmqb7nE9H/AmyijvpPnNlcFgob0ET7ysPGosTEO33GgL6ccIn60mxibiOrEZ47yVH+EkKWcsTOX+RUhI7U6gdB04t89/1O/w1cDnyilFU='
  );
  const [groupId, setGroupId] = useState(() => 
    localStorage.getItem('LINE_GROUP_ID') || 'Cfd9f3c46111cf32db3e3e69b6961fa3e'
  );
  const [isSending, setIsSending] = useState(false);

  React.useEffect(() => {
    localStorage.setItem('LINE_CHANNEL_ACCESS_TOKEN', channelAccessToken);
  }, [channelAccessToken]);

  React.useEffect(() => {
    localStorage.setItem('LINE_GROUP_ID', groupId);
  }, [groupId]);
  
  const handleTestConnection = async () => {
    setIsSending(true);
    try {
      const testFlex = {
        "type": "bubble",
        "size": "mega",
        "header": {
          "type": "box",
          "layout": "vertical",
          "backgroundColor": "#05B905",
          "paddingAll": "xl",
          "contents": [
            {
              "type": "text",
              "text": "🔌 LINE Group Connected!",
              "weight": "bold",
              "color": "#ffffff",
              "size": "xl"
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
              "text": "✅ ทดสอบการเชื่อมต่อกับกลุ่ม LINE สำเร็จ!",
              "weight": "bold",
              "size": "md",
              "color": "#09a209"
            },
            {
              "type": "text",
              "text": "ระบบส่งสัญญาณตอบรับอัตโนมัติจาก FlowWork 360 CMMS",
              "size": "xs",
              "color": "#64748b",
              "margin": "sm"
            },
            {
              "type": "separator",
              "margin": "md",
              "color": "#e2e8f0"
            },
            {
              "type": "box",
              "layout": "vertical",
              "margin": "md",
              "spacing": "xs",
              "contents": [
                {
                  "type": "box",
                  "layout": "horizontal",
                  "contents": [
                    { "type": "text", "text": "ทดสอบหาผู้รับกลุ่ม ID", "size": "xs", "color": "#64748b" },
                    { "type": "text", "text": groupId, "size": "xs", "color": "#0f172a", "align": "end", "wrap": true }
                  ]
                },
                {
                  "type": "box",
                  "layout": "horizontal",
                  "contents": [
                    { "type": "text", "text": "สถานะ Token", "size": "xs", "color": "#64748b" },
                    { "type": "text", "text": "ใช้งานการส่ง Push ข้อความ (Live)", "size": "xs", "color": "#15803d", "align": "end", "weight": "bold" }
                  ]
                },
                {
                  "type": "box",
                  "layout": "horizontal",
                  "contents": [
                    { "type": "text", "text": "เวลาและวันที่", "size": "xs", "color": "#64748b" },
                    { "type": "text", "text": `${new Date().toLocaleDateString('th-TH')} ${new Date().toLocaleTimeString('th-TH')}`, "size": "xs", "color": "#1e293b", "align": "end" }
                  ]
                }
              ]
            }
          ]
        }
      };

      const res = await fetch("/api/line/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          flexMessage: {
            type: "flex",
            altText: "🔌 LINE Group Connection Test Success!",
            contents: testFlex
          },
          channelAccessToken: channelAccessToken,
          groupId: groupId
        })
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || result.details?.message || "Push failed");
      }
      alert("🎉 สำเร็จ! บอทส่งข้อความตอบรับเข้า LINE กลุ่มของคุณเรียบร้อยแล้ว");
    } catch (err: any) {
      alert("❌ ไม่สามารถส่งข้อความได้เนื่องจาก: " + err.message + "\n\nคำแนะนำ: กรุณาเพิ่มเพื่อน (LINE Bot) และเชิญบอทดังกล่าวเข้าไปในกลุ่มของคุณก่อนกดทดสอบอีกครั้ง");
    } finally {
      setIsSending(false);
    }
  };
  
  // Real Flex message generation structure
  const buildFlexMessage = () => {
    // Generate inner items
    const itemContents = currentData.items?.map((item, idx) => {
      const itemRow = [
        {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "text",
              "text": `${idx + 1}. ${item.name}`,
              "size": "sm",
              "weight": "bold",
              "color": "#111827"
            }
          ]
        },
        {
          "type": "box",
          "layout": "vertical",
          "alignItems": "flex-end",
          "contents": [
            {
              "type": "text",
              "text": `${item.qty} ${item.unit}`,
              "size": "sm",
              "weight": "bold",
              "color": "#111827"
            }
          ]
        }
      ];

      return {
        "type": "box",
        "layout": "horizontal",
        "margin": "md",
        "contents": itemRow
      };
    }) || [];

    const extraDetailsArray = currentData.extraDetails ? Object.entries(currentData.extraDetails).map(([key, val]) => ({
      "type": "box",
      "layout": "baseline",
      "spacing": "sm",
      "contents": [
        {
          "type": "text",
          "text": key,
          "color": "#64748b",
          "size": "xs",
          "flex": 2
        },
        {
          "type": "text",
          "text": val as string,
          "wrap": true,
          "color": "#334155",
          "size": "sm",
          "flex": 5,
          "weight": "bold"
        }
      ]
    })) : [];

    // Header Color Mapping
    const headerBgMap: Record<FlexType, string> = {
      issue: "#cf3545",
      receive: "#007aff",
      schedule: "#6f42c1",
      repair: "#fd7e14",
      general: "#198754"
    };

    const flexJson = {
      "type": "flex",
      "altText": currentData.title,
      "contents": {
        "type": "bubble",
        "size": "mega",
        "header": {
          "type": "box",
          "layout": "vertical",
          "backgroundColor": headerBgMap[currentData.type] || "#000000",
          "paddingAll": "xl",
          "contents": [
            {
              "type": "text",
              "text": currentData.title,
              "weight": "bold",
              "color": "#ffffff",
              "size": "xl"
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
                  "text": currentData.docNo,
                  "size": "sm",
                  "color": "#64748b",
                  "align": "end"
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
                    { "type": "text", "text": "วันที่รายการ", "size": "sm", "color": "#64748b" },
                    { "type": "text", "text": currentData.date, "size": "sm", "color": "#1e293b", "align": "end", "weight": "bold" }
                  ]
                },
                {
                  "type": "box",
                  "layout": "horizontal",
                  "contents": [
                    { "type": "text", "text": "เวลาทำรายการ", "size": "sm", "color": "#64748b" },
                    { "type": "text", "text": currentData.time, "size": "sm", "color": "#1e293b", "align": "end" }
                  ]
                },
                {
                  "type": "box",
                  "layout": "horizontal",
                  "contents": [
                    { "type": "text", "text": "ผู้ดำเนินการ", "size": "sm", "color": "#64748b" },
                    { "type": "text", "text": currentData.person, "size": "sm", "color": "#111827", "align": "end", "weight": "bold" }
                  ]
                }
              ]
            },
            ...(currentData.projectName ? [{
              "type": "box",
              "layout": "vertical",
              "margin": "xl",
              "contents": [
                {
                  "type": "text",
                  "text": `โปรเจกต์: ${currentData.projectName}`,
                  "weight": "bold",
                  "size": "md",
                  "color": "#0f172a"
                },
                ...(currentData.location ? [{
                  "type": "text",
                  "text": `สถานที่: ${currentData.location}`,
                  "size": "sm",
                  "color": "#64748b",
                  "margin": "sm"
                }] : [])
              ]
            }] : []),
            ...(itemContents.length > 0 ? [{
              "type": "box",
              "layout": "vertical",
              "margin": "xl",
              "backgroundColor": "#f8f9fa",
              "paddingAll": "md",
              "cornerRadius": "md",
              "contents": [
                {
                  "type": "box",
                  "layout": "horizontal",
                  "contents": [
                    { "type": "text", "text": "รายการ", "color": "#94a3b8", "size": "xs" },
                    { "type": "text", "text": "จำนวน", "color": "#94a3b8", "size": "xs", "align": "end" }
                  ]
                },
                ...itemContents
              ]
            }] : []),
            ...(extraDetailsArray.length > 0 ? [{
              "type": "box",
              "layout": "vertical",
              "margin": "xl",
              "backgroundColor": "#f8f9fa",
              "paddingAll": "md",
              "cornerRadius": "md",
              "contents": extraDetailsArray
            }] : []),
            ...(currentData.totalAmount !== undefined ? [{
              "type": "box",
              "layout": "horizontal",
              "margin": "xl",
              "contents": [
                {
                  "type": "text",
                  "text": "ยอดรวมยอด",
                  "size": "md",
                  "weight": "bold",
                  "color": headerBgMap[currentData.type] || "#000000"
                },
                {
                  "type": "text",
                  "text": `${currentData.totalAmount.toLocaleString()} บาท`,
                  "size": "lg",
                  "weight": "bold",
                  "align": "end",
                  "color": headerBgMap[currentData.type] || "#000000"
                }
              ]
            }] : [])
          ]
        }
      }
    };

    return flexJson;
  };

  const handleCopyCode = () => {
    const dummyJson = buildFlexMessage();
    navigator.clipboard.writeText(JSON.stringify(dummyJson, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePushLINE = async () => {
    setIsSending(true);
    try {
      const payload = buildFlexMessage();
      const res = await fetch("/api/line/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          flexMessage: payload,
          channelAccessToken: channelAccessToken,
          groupId: groupId
        })
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || result.details?.message || "Push failed");
      }
      alert("ส่งการแจ้งเตือน Line Flex สำเร็จ!");
    } catch (err: any) {
      alert("Failed to push: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const updateCurrentData = (field: keyof BaseFlexData, value: any) => {
    setFlexData(prev => ({
      ...prev,
      [activeType]: {
        ...prev[activeType],
        [field]: value
      }
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="line-flex-builder-section">
      {/* Configuration Controls (Form) */}
      <div className="lg:col-span-7 bg-white/80 border border-stone-200 rounded-2xl p-6 shadow-sm backdrop-blur-md flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-green-500/10 text-green-600 rounded-xl">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-display font-medium text-stone-800">LINE Flex Message Preview</h2>
              <p className="text-xs text-stone-500">รูปแบบการแจ้งเตือนผ่าน Line OA</p>
            </div>
          </div>

          <div className="space-y-4 text-sm mt-6">
            {/* LINE API Configuration Panel */}
            <div className="bg-[#00B900]/5 border border-[#00B900]/20 rounded-xl p-4 space-y-3 shadow-[0_2px_10px_rgba(0,185,0,0.03)]">
              <div className="flex items-center justify-between border-b border-[#00B900]/10 pb-2 mb-1">
                <span className="text-xs font-bold text-[#009900] uppercase tracking-wider">LINE API Integration</span>
                <span className="text-[10px] bg-[#00B900]/10 text-[#009900] px-2 py-0.5 rounded-full font-medium">Push API Client</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[10px] leading-3 font-semibold text-stone-600 mb-1">Channel Access Token (Long-lived)</label>
                  <input
                    type="password"
                    placeholder="ใส่ Token หรือใช้ค่าดีฟอลต์ที่กำหนด"
                    className="w-full bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-xs text-stone-800 outline-none focus:border-[#00B900] transition-colors font-mono"
                    value={channelAccessToken}
                    onChange={(e) => setChannelAccessToken(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] leading-3 font-semibold text-stone-600 mb-1">Group ID / User ID (จุดรับข้อความ)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="ใส่ Group ID (เช่น C94ac0e...)"
                      className="flex-1 bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-xs text-[#001f3f] font-bold outline-none border-dashed border-emerald-400 focus:border-[#00B900] transition-colors font-mono"
                      value={groupId}
                      onChange={(e) => setGroupId(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={isSending}
                      className="px-3 py-1.5 bg-[#00B900] hover:bg-[#009900] text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-75 shadow-sm shadow-emerald-500/10"
                    >
                      🔌 ทดสอบเชื่อมกลุ่ม
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-2">ประเภทการแจ้งเตือน (Template Type)</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <button
                  onClick={() => setActiveType('schedule')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all border ${activeType === 'schedule' ? 'bg-[#6f42c1]/10 text-[#6f42c1] border-[#6f42c1]/50' : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100'}`}
                >
                  📅 แจ้งเตือนตารางงาน
                </button>
                <button
                  onClick={() => setActiveType('issue')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all border ${activeType === 'issue' ? 'bg-[#cf3545]/10 text-[#cf3545] border-[#cf3545]/50' : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100'}`}
                >
                  📤 แจ้งเบิกของ (อนุมัติ)
                </button>
                <button
                  onClick={() => setActiveType('receive')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all border ${activeType === 'receive' ? 'bg-[#007aff]/10 text-[#007aff] border-[#007aff]/50' : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100'}`}
                >
                  📥 แจ้งการซื้อของเข้า
                </button>
                <button
                  onClick={() => setActiveType('repair')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all border ${activeType === 'repair' ? 'bg-[#fd7e14]/10 text-[#fd7e14] border-[#fd7e14]/50' : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100'}`}
                >
                  🛠️ แจ้งซ่อม
                </button>
                <button
                  onClick={() => setActiveType('general')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all border ${activeType === 'general' ? 'bg-[#198754]/10 text-[#198754] border-[#198754]/50' : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100'}`}
                >
                  📢 แจ้งข่าวสารทั่วไป
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1">หัวข้อการแจ้งเตือน</label>
                <input
                  type="text"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-stone-700 outline-none focus:border-green-500 transition-colors"
                  value={currentData.title}
                  onChange={(e) => updateCurrentData('title', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1">เลขที่เอกสาร / อ้างอิง</label>
                <input
                  type="text"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-stone-700 outline-none focus:border-green-500 transition-colors"
                  value={currentData.docNo}
                  onChange={(e) => updateCurrentData('docNo', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1">ชื่อผู้ดำเนินการ / ผู้ขอ</label>
                <input
                  type="text"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-stone-700 outline-none focus:border-green-500 transition-colors"
                  value={currentData.person}
                  onChange={(e) => updateCurrentData('person', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1">โปรเจกต์ / หัวข้อย่อย</label>
                <input
                  type="text"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-stone-700 outline-none focus:border-green-500 transition-colors"
                  value={currentData.projectName || ''}
                  onChange={(e) => updateCurrentData('projectName', e.target.value)}
                />
              </div>
            </div>

          </div>
        </div>

        <div className="mt-8 border-t border-stone-200 pt-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-2 max-w-md">
            <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-stone-500 leading-relaxed">
              *ดีไซน์ปรับตามรูปแบบจริงของ LINE Flex Message ที่ใช้ในการแจ้งเตือนเบิกสินค้าและรับเข้า
            </p>
          </div>

          <div className="flex gap-2 w-full flex-col md:flex-row md:w-auto mt-4">
            <button
              onClick={handlePushLINE}
              disabled={isSending}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-[#00B900] text-white hover:bg-[#009900] px-6 py-2.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-[#00B900]/20"
            >
              <Send className="w-4 h-4" />
              {isSending ? 'กำลังส่ง...' : 'ทดสอบส่ง LINE Flex (Push API)'}
            </button>
            <button
              onClick={handleCopyCode}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-stone-50 text-stone-700 hover:text-stone-900 px-4 py-2.5 rounded-xl text-xs font-semibold border border-stone-200 hover:bg-stone-100 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'คัดลอกสำเร็จ!' : 'Copy JSON'}
            </button>
          </div>
        </div>
      </div>

      {/* LINE Mobile App UI Preview Emulator */}
      <div className="lg:col-span-5 flex justify-center items-center">
        <div className="relative mx-auto w-[330px] h-[650px] bg-[#f2f2f2] border-8 border-stone-800 rounded-[40px] shadow-2xl flex flex-col overflow-hidden ring-4 ring-stone-200">
          {/* Smartphone details */}
          <div className="absolute top-0 inset-x-0 h-6 bg-stone-800 rounded-b-3xl w-40 mx-auto z-20 flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 bg-stone-600 rounded-full"></div>
            <div className="w-12 h-1.5 bg-stone-700 rounded-full"></div>
          </div>

          {/* LINE Chat BG (Light theme LINE look) */}
          <div className="flex-1 bg-[#8fa9d2] pt-12 overflow-y-auto flex flex-col">
            
            {/* Header / Nav simulation */}
            <div className="absolute top-0 inset-x-0 h-20 bg-[#8fa9d2] z-10 px-4 flex flex-col justify-end pb-3 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 overflow-hidden flex items-center justify-center border border-emerald-200 text-[10px]">
                     🐸
                  </div>
                  <div className="flex gap-1 items-center">
                    <span className="font-semibold text-sm">การแจ้งเตือนระบบ</span>
                    <span className="text-xs opacity-80">(3)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 px-3 pb-4 pt-10 overflow-y-auto space-y-4">
              
              {/* Profile icon in chat */}
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0 border border-slate-300 flex items-center justify-center text-slate-400">
                   👤
                </div>

                {/* Flex Message Card */}
                <div className="w-[260px] bg-white rounded-xl overflow-hidden shadow-sm flex flex-col">
                  {/* Header part with dynamic color */}
                  <div className={`${currentData.bgColor} p-4 rounded-b-lg`}>
                    <h3 className="text-white font-bold text-lg truncate tracking-wide">
                      {currentData.title}
                    </h3>
                  </div>

                  {/* Body part */}
                  <div className="p-4 space-y-3 bg-white">
                    {/* Basic details */}
                    <div className="space-y-1 text-[13px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">เลขที่รายการ</span>
                        <span className="text-slate-500">{currentData.docNo}</span>
                      </div>
                      <div className="my-2 border-b border-slate-100"></div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">วันที่รายการ</span>
                        <span className="text-slate-800">{currentData.date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">เวลาทำรายการ</span>
                        <span className="text-slate-800">{currentData.time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">ผู้ดำเนินการ</span>
                        <span className="text-slate-800">{currentData.person}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="font-bold text-[14px] text-slate-800 flex items-center gap-1">
                        โปรเจกต์: {currentData.projectName}
                      </div>
                      {currentData.location && (
                        <div className="text-[13px] text-slate-500">
                          สถานที่: {currentData.location}
                        </div>
                      )}
                    </div>

                    {/* Table of items, if any */}
                    {(currentData.items && currentData.items.length > 0) && (
                      <div className="bg-[#f8f9fa] p-3 rounded-lg mt-3">
                        <div className="flex justify-between text-[12px] text-slate-500 mb-2">
                          <span>รายการส่วนย่อย</span>
                          <span>จำนวน</span>
                        </div>
                        {currentData.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-start mb-2 last:mb-0">
                            <div>
                              <div className="text-[14px] text-slate-800 font-medium">
                                {idx + 1}. {item.name}
                              </div>
                              {item.pricePerUnit && (
                                <div className="text-[12px] text-slate-400">
                                  @ {item.pricePerUnit} บาท/{item.unit} (รวม {item.qty * item.pricePerUnit} บ.)
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-[14px] text-slate-800 font-bold">{item.qty} {item.unit}</div>
                              {item.pricePerUnit && (
                                <div className="text-[12px] text-slate-400">
                                  รวม {(item.qty * item.pricePerUnit).toLocaleString()} บาท
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Extra Details */}
                    {currentData.extraDetails && (
                       <div className="bg-[#f8f9fa] p-3 rounded-lg mt-3 space-y-2">
                          {Object.entries(currentData.extraDetails).map(([key, val]) => (
                            <div key={key}>
                              <div className="text-[12px] text-slate-500">{key}</div>
                              <div className="text-[14px] text-slate-800 font-medium">{val}</div>
                            </div>
                          ))}
                       </div>
                    )}

                    {/* Total Amount */}
                    {currentData.totalAmount !== undefined && (
                      <div className="pt-2 flex justify-between items-center bg-white border-t border-slate-100 mt-2">
                        <span className={`font-bold text-[15px] ${currentData.textColor}`}>
                          รวมยอด (Total)
                        </span>
                        <span className={`font-bold text-[18px] ${currentData.textColor}`}>
                          {currentData.totalAmount.toLocaleString()} บาท
                        </span>
                      </div>
                    )}

                    {/* Footer sign section (from image) */}
                    <div className="text-[11px] text-slate-400 pt-3 space-y-1">
                      <div className="flex justify-between">
                        <span>ลงชื่อผู้ดำเนินการ............................</span>
                        <span>วันที่ {currentData.date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ผู้อนุมัติ...........................................</span>
                        <span>วันที่ {currentData.date}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Timestamps */}
            <div className="px-4 pb-2 text-right">
              <span className="text-[10px] text-black/40">10:45 AM</span>
            </div>

            {/* Input simulation */}
            <div className="bg-white h-[50px] flex items-center px-4 shrink-0 text-slate-400 font-sans text-sm gap-4">
              <span>+</span>
              <div className="flex-1 bg-slate-100 rounded-full h-[32px] px-3 flex items-center">
                Aa
              </div>
              <span>😊</span>
            </div>
            {/* iOS home indicator safe area */}
            <div className="bg-white h-5 flex justify-center items-center pb-2">
              <div className="w-1/3 h-1 bg-black/20 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
