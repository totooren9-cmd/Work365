/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  FileText, 
  CheckCircle, 
  XCircle, 
  QrCode, 
  Smartphone, 
  Printer, 
  AlertCircle, 
  Database,
  ArrowRight
} from 'lucide-react';
import { StockItem, InventoryIssuance } from '../types';
import { sendLineIssuanceNotification, sendLineStockReceiveNotification } from '../utils/lineNotify';

interface InventoryViewProps {
  stocks: StockItem[];
  issuances: InventoryIssuance[];
  onAddStock: (item: StockItem) => void;
  onAddIssuance: (issue: InventoryIssuance) => void;
  onUpdateIssuance: (issue: InventoryIssuance) => void;
  onUpdateStockQty: (id: string, newQty: number) => void;
}

export default function InventoryView({ stocks, issuances, onAddStock, onAddIssuance, onUpdateIssuance, onUpdateStockQty }: InventoryViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddStockForm, setShowAddStockForm] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [selectedIssuanceId, setSelectedIssuanceId] = useState<string | null>(null);

  const pendingIssuances = useMemo(() => {
    return issuances.filter(i => i.status === 'pending');
  }, [issuances]);

  const resolvedIssuances = useMemo(() => {
    return issuances.filter(i => i.status === 'approved' || i.status === 'rejected');
  }, [issuances]);

  // Synchronize selection
  React.useEffect(() => {
    if (!selectedIssuanceId) {
      const firstPending = issuances.find(i => i.status === 'pending');
      if (firstPending) {
        setSelectedIssuanceId(firstPending.id);
      } else if (issuances.length > 0) {
        setSelectedIssuanceId(issuances[0].id);
      }
    }
  }, [issuances, selectedIssuanceId]);

  // Form states for adding stock
  const [newStockName, setNewStockName] = useState('');
  const [newStockCode, setNewStockCode] = useState('');
  const [newStockCategory, setNewStockCategory] = useState('น้ำมันหล่อลื่น');
  const [newStockQty, setNewStockQty] = useState(10);
  const [newStockMin, setNewStockMin] = useState(3);
  const [newStockUnit, setNewStockUnit] = useState('ถัง');
  const [newStockLoc, setNewStockLoc] = useState('ตู้เก็บสารเคมี คลังใหญ่');

  // Form states for Requisition Issue
  const [issuePartId, setIssuePartId] = useState(stocks[0]?.id || '');
  const [issueQty, setIssueQty] = useState(1);
  const [issueDept, setIssueDept] = useState('แผนกซ่อมบำรุงทางด่วน B');
  const [issueReqName, setIssueReqName] = useState('ช่างศักดิ์ชาย เรืองเดช');

  // Scanner Simulator State
  const [scannerActive, setScannerActive] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  // List of unique categories for stock items filter
  const categories = useMemo(() => {
    return ['all', ...Array.from(new Set(stocks.map(s => s.category)))];
  }, [stocks]);

  // Filtered stocks list
  const filteredStocks = useMemo(() => {
    return stocks.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === 'all' || s.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [stocks, searchTerm, selectedCategory]);

  // Selected Requisition
  const selectedIssuance = useMemo(() => {
    return issuances.find(i => i.id === selectedIssuanceId) || null;
  }, [issuances, selectedIssuanceId]);

  // Handler for adding new stock catalog item
  const handleCreateStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStockName || !newStockCode) return;

    const newItem: StockItem = {
      id: `item-${Math.floor(Math.random() * 90) + 10}`,
      code: newStockCode,
      name: newStockName,
      category: newStockCategory,
      quantity: Number(newStockQty),
      minQuantity: Number(newStockMin),
      unit: newStockUnit,
      location: newStockLoc,
      qrCodeText: newStockCode
    };

    onAddStock(newItem);
    sendLineStockReceiveNotification(newItem, newItem.quantity, "ใบสั่งซื้อกองพัสดุ / สต็อกตั้งต้นใหม่", "เจ้าหน้าที่ดูแลพัสดุกลาง").catch(err => {
      console.error("Error sending LINE notification for stock entry:", err);
    });
    
    // Reset Form
    setNewStockName('');
    setNewStockCode('');
    setNewStockQty(10);
    setNewStockMin(3);
    setShowAddStockForm(false);
  };

  // Handler for posting stock Requisition
  const handleCreateReservation = (e: React.FormEvent) => {
    e.preventDefault();
    const targetItem = stocks.find(s => s.id === issuePartId);
    if (!targetItem) return;

    const autoDocNo = `REQ-202605-${Math.floor(Math.random() * 9000) + 1000}`; // Auto-generated Document doc number
    const newIssue: InventoryIssuance = {
      id: `iss-${Date.now()}`,
      documentNo: autoDocNo,
      itemId: targetItem.id,
      itemName: targetItem.name,
      qtyRequested: Number(issueQty),
      qtyApproved: 0,
      department: issueDept,
      status: 'pending',
      requestedBy: issueReqName,
      date: new Date().toISOString().split('T')[0]
    };

    onAddIssuance(newIssue);
    sendLineIssuanceNotification(newIssue).catch(err => {
      console.error("Error sending LINE notification for requisition request:", err);
    });
    setSelectedIssuanceId(newIssue.id);
    setShowIssueForm(false);
  };

  // Approving a requisition
  const handleApproveRequisition = (iss: InventoryIssuance, isRejected = false) => {
    const targetItem = stocks.find(s => s.id === iss.itemId);
    if (!targetItem) return;

    if (isRejected) {
      const updatedReject: InventoryIssuance = {
        ...iss,
        status: 'rejected'
      };
      onUpdateIssuance(updatedReject);
      sendLineIssuanceNotification(updatedReject).catch(err => {
        console.error("Error sending LINE notification for rejected requisition:", err);
      });
      setSelectedIssuanceId(null);
      return;
    }

    // Deduct quantity from the stock list matching rules
    const approvedCount = iss.qtyRequested;
    if (targetItem.quantity < approvedCount) {
      alert(`พัสดุในคลังมีจำกัด (${targetItem.quantity} ลูก) ไม่สามารถเบิกออก ${approvedCount} ได้! กรุณาลดปริมาณเบิกลง`);
      return;
    }

    onUpdateStockQty(targetItem.id, targetItem.quantity - approvedCount);
    const updatedApproved: InventoryIssuance = {
      ...iss,
      status: 'approved',
      qtyApproved: approvedCount
    };
    onUpdateIssuance(updatedApproved);
    sendLineIssuanceNotification(updatedApproved).catch(err => {
      console.error("Error sending LINE notification for approved requisition:", err);
    });
    setSelectedIssuanceId(null);
  };

  // Simulates scanning spare part stickers
  const triggerMobileScanAndApprove = (itemCode: string) => {
    setScannerActive(true);
    setScanResult(null);

    // After 2.3 seconds of scan beep simulation
    setTimeout(() => {
      setScanResult(itemCode);
      const matchingStock = stocks.find(s => s.code === itemCode);
      if (matchingStock) {
        // Auto approve any pending requisition matching this scanned code if available
        const pendingIssue = issuances.find(i => i.itemId === matchingStock.id && i.status === 'pending');
        if (pendingIssue) {
          handleApproveRequisition(pendingIssue);
          alert(`[SCAN SUCCESS] ตรวจพบใบเบิกพัสดุค้างสำหรับการสแกนชิ้นส่วน ${itemCode} กล้องมือถือตรวจจับพิกัดสมบูรณ์ ทำการตัดยอดคงคลังอัตโนมัติ!`);
        } else {
          alert(`[SCAN SUCCESS] ถ่ายรูปยืนยันและสแกนพิกัด QR สำเร็จ: ${matchingStock.name} (ในคลังเหลือ ${matchingStock.quantity} ${matchingStock.unit})`);
        }
      }
      setScannerActive(false);
    }, 1800);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="inventory-grid-center">
      {/* 1. Left Catalog and Issuances Panel (8 Columns) */}
      <div className="lg:col-span-8 bg-stone-50/40 border border-stone-200 rounded-2xl p-5 shadow-sm backdrop-blur-md flex flex-col justify-between">
        <div>
          {/* Controls Bar Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-500/10 text-orange-600 rounded-xl">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-display font-medium text-stone-800">คลังอะไหล่สะสมและใบเบิกพัสดุ</h2>
                <p className="text-xs text-stone-500">ควบคุมปริมาณไส้กรอง ปะเก็นฝาสูบ น้ำมันไฮดรอกลิก ซิงก์จำนวนตัดจ่ายจริง</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddStockForm(true)}
                className="bg-white hover:bg-white text-stone-700 hover:text-stone-900 border border-stone-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-orange-500" />
                เพิ่มสเปคอะไหล่
              </button>
              <button
                onClick={() => setShowIssueForm(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow transition-all flex items-center gap-1 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                สร้างใบเบิกอะไหล่
              </button>
            </div>
          </div>

          {/* Catalog Layout Form & List */}
          <div className="mt-4">
            {showAddStockForm ? (
              /* Add new item specification */
              <form onSubmit={handleCreateStock} className="space-y-4 bg-white/50 p-5 rounded-2xl border border-stone-200">
                <h3 className="text-xs font-bold text-orange-600 uppercase tracking-wider">📦 บันทึกสเปคและรหัสพัสดุใหม่</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">ชื่อสเปคอะไหล่ภาษาไทย</label>
                    <input
                      type="text"
                      className="w-full bg-stone-50 border border-slate-705 rounded-xl px-4 py-2 text-stone-800 outline-none text-xs focus:border-orange-500"
                      value={newStockName}
                      onChange={(e) => setNewStockName(e.target.value)}
                      placeholder="เช่น ไส้กรองไฮดรอลิกตูดทอง"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">รหัสสินค้า / Part Code (Unique)</label>
                    <input
                      type="text"
                      className="w-full bg-stone-50 border border-slate-705 rounded-xl px-4 py-2 text-stone-700 outline-none text-xs focus:border-orange-500"
                      value={newStockCode}
                      onChange={(e) => setNewStockCode(e.target.value.toUpperCase())}
                      placeholder="เช่น FIL-HYD-CAT320EX"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs text-stone-500 mb-1">หมวดหมู่</label>
                    <input
                      type="text"
                      className="w-full bg-stone-50 border border-slate-705 rounded-xl px-3 py-2 text-stone-700 outline-none text-xs focus:border-orange-500"
                      value={newStockCategory}
                      onChange={(e) => setNewStockCategory(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">จำนวนตั้งต้น</label>
                    <input
                      type="number"
                      className="w-full bg-stone-50 border border-slate-705 rounded-xl px-3 py-2 text-stone-700 outline-none text-xs"
                      value={newStockQty}
                      onChange={(e) => setNewStockQty(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">วิกฤต (Min)</label>
                    <input
                      type="number"
                      className="w-full bg-stone-50 border border-slate-705 rounded-xl px-3 py-2 text-stone-700 outline-none text-xs"
                      value={newStockMin}
                      onChange={(e) => setNewStockMin(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">หน่วยนับ</label>
                    <input
                      type="text"
                      className="w-full bg-stone-50 border border-slate-705 rounded-xl px-3 py-2 text-stone-700 outline-none text-xs"
                      value={newStockUnit}
                      onChange={(e) => setNewStockUnit(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-stone-500 mb-1">ชั้นเก็บสิ่งของ (Storage Shelf Location)</label>
                  <input
                    type="text"
                    className="w-full bg-stone-50 border border-slate-705 rounded-xl px-4 py-2 text-stone-700 outline-none text-xs"
                    value={newStockLoc}
                    onChange={(e) => setNewStockLoc(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddStockForm(false)}
                    className="bg-stone-50 hover:bg-stone-50 text-stone-500 hover:text-stone-700 px-4 py-2 rounded-xl text-xs font-semibold"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow"
                  >
                    บันทึกสเปคอะไหล่
                  </button>
                </div>
              </form>
            ) : showIssueForm ? (
              /* Create requisition issue file */
              <form onSubmit={handleCreateReservation} className="space-y-4 bg-white/50 p-5 rounded-2xl border border-stone-200">
                <h3 className="text-xs font-bold text-orange-600 uppercase tracking-wider">📄 ยื่นใบกำกับขอเบิกพัสดุและพึ่งซ่อม</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">เลือกอะไหล่ที่ต้องการเบิก</label>
                    <select
                      className="w-full bg-stone-50 border border-slate-750 rounded-xl px-3 py-2.5 text-stone-800 outline-none text-xs"
                      value={issuePartId}
                      onChange={(e) => setIssuePartId(e.target.value)}
                    >
                      {stocks.map(s => (
                        <option key={s.id} value={s.id}>{s.name} (ในคลังเหลือ {s.quantity} {s.unit})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">จำนวนเบิกตามแผนก</label>
                    <input
                      type="number"
                      className="w-full bg-stone-50 border border-slate-750 rounded-xl px-4 py-2 text-stone-800 outline-none text-xs focus:border-orange-500"
                      value={issueQty}
                      onChange={(e) => setIssueQty(Number(e.target.value))}
                      min={1}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">หน่วยค่ายสังกัดเบิกพัสดุ</label>
                    <input
                      type="text"
                      className="w-full bg-stone-50 border border-slate-750 rounded-xl px-4 py-2 text-stone-700 outline-none text-xs"
                      value={issueDept}
                      onChange={(e) => setIssueDept(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 mb-1">ชื่อผู้ขอเบิกดั้งเดิม</label>
                    <input
                      type="text"
                      className="w-full bg-stone-50 border border-slate-750 rounded-xl px-4 py-2 text-stone-700 outline-none text-xs"
                      value={issueReqName}
                      onChange={(e) => setIssueReqName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowIssueForm(false)}
                    className="bg-stone-50 hover:bg-stone-50 text-stone-500 hover:text-stone-700 px-4 py-2 rounded-xl text-xs font-semibold"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow"
                  >
                    ยื่นขอเบิกพัสดุ (Auto Req #)
                  </button>
                </div>
              </form>
            ) : (
              /* Stock catalog listing */
              <div className="space-y-4">
                {/* Search Bar / Filter Category Tabs */}
                <div className="flex flex-col md:flex-row gap-2 border-b border-stone-200 pb-3">
                  <div className="relative flex-1 bg-white rounded-xl border border-stone-200">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      className="w-full bg-transparent pl-9 pr-4 py-2 text-xs text-stone-700 outline-none"
                      placeholder="ค้นหาชื่ออะไหล่ หรือ Part number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-1 overflow-x-auto select-none">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all shrink-0 border ${
                          selectedCategory === cat
                            ? 'bg-orange-500 border-orange-500 text-white'
                            : 'bg-stone-50/40 text-stone-500 border-stone-200 hover:text-stone-700'
                        }`}
                      >
                        {cat === 'all' ? '📁 ทั้งหมด' : cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid Table of items */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[290px] overflow-y-auto pr-1">
                  {filteredStocks.map((item) => {
                    const isLow = item.quantity <= item.minQuantity;
                    return (
                      <div 
                        key={item.id} 
                        className={`p-3.5 rounded-xl border flex justify-between items-center bg-white/30 transition-all hover:scale-[1.01] ${
                          isLow ? 'border-rose-500/20 bg-rose-500/5' : 'border-stone-200 hover:border-orange-500/10'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-semibold text-stone-700 leading-tight">{item.name}</h4>
                            {isLow && (
                              <span className="animate-pulse bg-rose-500 text-white px-1 py-0.5 rounded text-[8px] font-extrabold flex items-center gap-0.5">
                                <AlertCircle className="w-2.5 h-2.5" />
                                หมดคิว!
                              </span>
                            )}
                          </div>
                          <span className="block text-[10px] text-slate-450 font-mono">
                            คาร์ด: {item.code} | ชั้นวาง: {item.location}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="block text-xs font-mono font-black text-stone-800">{item.quantity} {item.unit}</span>
                            <span className="text-[9px] text-slate-500">ขั้นต่ำ {item.minQuantity}</span>
                          </div>

                          <button
                            onClick={() => triggerMobileScanAndApprove(item.code)}
                            className="p-2.5 bg-orange-500/10 text-orange-600 hover:text-white hover:bg-orange-500 rounded-xl transition-all cursor-pointer"
                            title="สแกนมือถือบาร์โค้ด"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic status overview label */}
        <div className="bg-white/40 border-t border-stone-200 mt-4 pt-3 text-[11px] text-slate-455 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10px] text-stone-500">
            <QrCode className="w-4 h-4 text-orange-600 shrink-0" />
            *หน้าต่างคลังซิงโครนัสผ่านระบบ QR Code Scanner ทันใจและรายงานสต็อกหน้างานแบบ Real-time
          </span>
          <span className="font-mono text-stone-500">PDF-Voucher 100% Exported</span>
        </div>
      </div>

      {/* 2. Right Requisition Drawer / SCAN Emulator (4 Columns) */}
      <div className="lg:col-span-4 bg-stone-50/40 border border-stone-200 rounded-2xl p-5 shadow-sm backdrop-blur-md flex flex-col justify-between">
        <div className="space-y-4">
          <div className="border-b border-stone-200 pb-2">
            <h3 className="text-xs uppercase font-bold text-stone-500 tracking-wider">ตรวจสอบคำขอเบิกพัสดุอะไหล่</h3>
          </div>

          <div className="space-y-3.5 max-h-[190px] overflow-y-auto pr-1">
            {pendingIssuances.length === 0 ? (
              <div className="text-center py-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                {/* Glowing moving dot */}
                <div className="absolute top-2 right-2 flex h-3.5 w-3.5 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>
                <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-full w-fit mx-auto mb-2 animate-bounce">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <p className="font-bold text-xs text-emerald-800 tracking-tight">ไม่มีรายการสั่งเบิกอะไหล่ค้างอนุมัติในขณะนี้</p>
                <p className="text-[10px] text-emerald-600/80 mt-1">คลังพัสดุและอะไหล่สะสมสถานะสมดุลและปลอดภัย</p>
              </div>
            ) : (
              pendingIssuances.map(iss => (
                <div 
                  key={iss.id}
                  onClick={() => setSelectedIssuanceId(iss.id)}
                  className={`p-3 rounded-xl border text-[11px] cursor-pointer transition-all ${
                    iss.id === selectedIssuanceId
                      ? 'bg-orange-500/10 border-orange-500/50'
                      : 'bg-white/20 border-stone-200 hover:bg-white/50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono font-bold text-stone-600">{iss.documentNo}</span>
                    <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-amber-500/10 text-amber-600 animate-pulse">
                      รออนุมัติ
                    </span>
                  </div>
                  <div className="text-stone-500 space-y-0.5">
                    <p>พัสดุ: <strong className="text-stone-800">{iss.itemName}</strong> ({iss.qtyRequested} ชิ้น)</p>
                    <p>แผนก: {iss.department}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Active Drawer Details (Only if pending / selectable) */}
          {selectedIssuance && (
            <div className="bg-white/40 p-4 rounded-xl border border-stone-200 space-y-3 text-[11px]">
              <div className="flex justify-between border-b border-stone-200 pb-1.5 items-center">
                <span className="font-bold text-orange-600">ใบเสร็จ: {selectedIssuance.documentNo}</span>
                <span className="text-slate-500 font-mono">{selectedIssuance.date}</span>
              </div>
              <div className="text-stone-600 space-y-1">
                <p><strong>ผู้เบิกพัสดุ:</strong> {selectedIssuance.requestedBy}</p>
                <p><strong>อะไหล่เป้าหมาย:</strong> {selectedIssuance.itemName}</p>
                <p className="text-orange-600"><strong>ระบุจำนวนขอเบิก:</strong> {selectedIssuance.qtyRequested} ชิ้น</p>
              </div>

              {selectedIssuance.status === 'pending' && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => handleApproveRequisition(selectedIssuance, true)}
                    className="py-2 bg-rose-500/15 hover:bg-rose-600 hover:text-white rounded-lg text-rose-500 font-semibold transition-colors cursor-pointer text-center"
                  >
                    X ไม่อนุมัติ
                  </button>
                  <button
                    onClick={() => handleApproveRequisition(selectedIssuance)}
                    className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors cursor-pointer text-center"
                  >
                    อนุมัติจ่ายคลัง
                  </button>
                </div>
              )}

              {selectedIssuance.status === 'approved' && (
                <div className="space-y-2">
                  <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg font-semibold text-center text-emerald-700 flex items-center justify-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span>อนุมัติจ่ายคลังเรียบร้อย</span>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 rounded-lg font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-[10px]"
                  >
                    <Printer className="w-3.5 h-3.5 text-stone-500" />
                    สั่งพิมพ์ใบเบิกพัสดุ
                  </button>
                </div>
              )}

              {selectedIssuance.status === 'rejected' && (
                <div className="p-2 bg-rose-50 border border-rose-100 rounded-lg font-semibold text-center text-rose-700 flex items-center justify-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span>ปฏิเสธการขอเบิกจ่ายคลังแล้ว</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. QR Mobile Scanner Simulator */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 space-y-3 mt-4 text-center">
          <div className="flex items-center gap-2 text-xs font-bold text-stone-600 uppercase border-b border-slate-900 pb-2">
            <Smartphone className="w-4 h-4 text-orange-500" />
            <span>Mobile Scan QR Simulator (จำลองการสแกน)</span>
          </div>

          {scannerActive ? (
            <div className="h-28 bg-stone-50 border border-dashed border-orange-500/40 rounded-xl relative overflow-hidden flex flex-col items-center justify-center text-xs">
              <div className="w-full absolute top-1/2 left-0 h-0.5 bg-orange-500 animate-bounce"></div>
              <p className="text-orange-600 font-mono font-bold animate-pulse">กำลังสแกนผ่านกล้องโทรศัพท์...</p>
              <p className="text-[10px] text-slate-500">จำลองการตรวจจับภาพและระบุเลขพยากรณ์</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[10px] text-stone-500 leading-normal">
                กดสแกนคลาวด์พัสดุด่วนจำลอง เพื่อตรวจสอบร่องรอย อนุมัติยิงเป้าคลังตัดพิกัดทันที
              </p>
              <button
                onClick={() => triggerMobileScanAndApprove(stocks[0]?.code || 'FIL-AIR-CAT320')}
                className="w-full py-2 bg-orange-500/10 hover:bg-orange-500 text-orange-600 hover:text-white rounded-xl text-xs font-bold transition-all border border-orange-500/30 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                จำลองการกดหยิบสแกน QR อนุมัติ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Google Sheets Live Requisition Hub */}
    <div className="bg-white border text-stone-850 border-stone-200 rounded-2xl shadow-sm overflow-hidden" id="google-sheets-requisition-panel">
        {/* Title and Connected status bar */}
        <div className="bg-[#107c41] px-4 py-3 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-emerald-700">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 bg-white/20 rounded flex items-center justify-center font-bold text-xs">田</span>
            <div>
              <h3 className="text-xs font-bold font-sans tracking-tight text-white">ตารางแสดงรายการประวัติใบเบิกพัสดุอะไหล่สะสม (Google Sheets Sync)</h3>
            </div>
          </div>
          <span className="bg-emerald-800 border border-emerald-600/30 text-emerald-100 text-[9px] font-semibold px-2.5 py-0.5 rounded font-mono animate-pulse">
            ● Google Sheets Connected
          </span>
        </div>

        {/* Spreadsheet Component Layout */}
        <div className="overflow-x-auto w-full">
          <table className="min-w-full border-collapse border border-stone-200 font-mono text-[11px] text-stone-700">
            <thead>
              {/* Spreadsheet letters A, B, C, D... header row */}
              <tr className="bg-stone-100 select-none">
                <th className="w-8 border border-stone-200 bg-stone-200 text-[10px] text-stone-500 text-center py-1 font-sans"></th>
                <th className="border border-stone-200 text-stone-500 font-sans tracking-tight text-center text-[10px] w-[50px] uppercase">A</th>
                <th className="border border-stone-200 text-stone-500 font-sans tracking-tight text-center text-[10px] w-[135px] uppercase">B</th>
                <th className="border border-stone-200 text-stone-500 font-sans tracking-tight text-center text-[10px] w-[95px] uppercase">C</th>
                <th className="border border-stone-200 text-stone-500 font-sans tracking-tight text-center text-[10px] uppercase">D</th>
                <th className="border border-stone-200 text-stone-500 font-sans tracking-tight text-center text-[10px] w-[110px] uppercase">E</th>
                <th className="border border-stone-200 text-stone-500 font-sans tracking-tight text-center text-[10px] w-[110px] uppercase">F</th>
                <th className="border border-stone-200 text-stone-500 font-sans tracking-tight text-center text-[10px] w-[170px] uppercase">G</th>
                <th className="border border-stone-200 text-stone-500 font-sans tracking-tight text-center text-[10px] w-[130px] uppercase">H</th>
                <th className="border border-stone-200 text-stone-500 font-sans tracking-tight text-center text-[10px] w-[120px] uppercase">I</th>
              </tr>

              {/* Real Table Column Headers representing spreadsheet cell layout */}
              <tr className="bg-stone-100/80 font-bold select-none text-left">
                <td className="border border-stone-200 bg-stone-200/50 text-center text-[9px] text-stone-400 font-sans">#</td>
                <td className="border border-stone-200 px-2 py-1.5 text-stone-600 text-center bg-stone-100">ลำดับ</td>
                <td className="border border-stone-200 px-2 py-1.5 text-stone-600">เลขที่เอกสาร</td>
                <td className="border border-stone-200 px-2 py-1.5 text-stone-600 text-center">วันที่ขอ</td>
                <td className="border border-stone-200 px-2 py-1.5 text-stone-600">รายการพัสดุอะไหล่</td>
                <td className="border border-stone-200 px-2 py-1.5 text-stone-600 text-right">จำนวนที่ขอ</td>
                <td className="border border-stone-200 px-2 py-1.5 text-stone-600 text-right">จำนวนจ่ายจริง</td>
                <td className="border border-stone-200 px-2 py-1.5 text-stone-600">หน่วยสังกัด</td>
                <td className="border border-stone-200 px-2 py-1.5 text-stone-600">ผู้ขอประสงค์เบิก</td>
                <td className="border border-stone-200 px-2 py-1.5 text-stone-600 text-center">สถานะการอนุมัติ</td>
              </tr>
            </thead>
            <tbody>
              {/* Render resolved (approved & rejected) items */}
              {resolvedIssuances.map((iss, index) => {
                const isApproved = iss.status === 'approved';
                // Alternating rows like Google Sheet
                const rowBg = index % 2 === 0 ? "bg-white" : "bg-[#f3fbf7]";
                
                return (
                  <tr 
                    key={iss.id} 
                    onClick={() => setSelectedIssuanceId(iss.id)}
                    className={`${rowBg} hover:bg-emerald-50 relative group cursor-pointer transition-colors`}
                  >
                    <td className="border border-stone-200 bg-stone-100 text-stone-400 text-center select-none font-sans font-semibold">
                      {index + 1}
                    </td>
                    <td className="border border-stone-200 px-2 py-1.5 text-stone-500 text-center">
                      {index + 1}
                    </td>
                    <td className="border border-stone-200 px-2 py-1.5 font-bold text-emerald-850">
                      {iss.documentNo}
                    </td>
                    <td className="border border-stone-200 px-2 py-1.5 text-stone-500 text-center">
                      {iss.date}
                    </td>
                    <td className="border border-stone-200 px-2 py-1.5 text-stone-800 font-semibold">
                      {iss.itemName}
                    </td>
                    <td className="border border-stone-200 px-2 py-1.5 text-stone-600 text-right font-medium">
                      {iss.qtyRequested}
                    </td>
                    <td className="border border-stone-200 px-2 py-1.5 text-right font-bold text-stone-800 bg-[#fbfbfb]">
                      {iss.qtyApproved}
                    </td>
                    <td className="border border-stone-200 px-2 py-1.5 text-stone-500 truncate" title={iss.department}>
                      {iss.department}
                    </td>
                    <td className="border border-stone-200 px-2 py-1.5 text-stone-600 select-all" title={iss.requestedBy}>
                      {iss.requestedBy}
                    </td>
                    <td className="border border-stone-200 px-1 py-1 text-center font-bold">
                      {isApproved ? (
                        <span className="inline-block bg-[#e6f4ea] text-[#137333] px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">
                          🟢 อนุมัติเบิกจ่าย
                        </span>
                      ) : (
                        <span className="inline-block bg-[#fce8e6] text-[#c5221f] px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">
                          🔴 ปฏิเสธคำขอ
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Add blank spreadsheet grid rows for stunning aesthetic realism */}
              {Array.from({ length: Math.max(2, 6 - resolvedIssuances.length) }).map((_, i) => {
                const rowIndex = resolvedIssuances.length + i + 1;
                // Alternating rows blank layout
                const rowBg = rowIndex % 2 === 0 ? "bg-[#f3fbf7]" : "bg-white";
                
                return (
                  <tr key={`blank-${i}`} className={`${rowBg} select-none font-sans`}>
                    <td className="border border-stone-200 bg-stone-100 text-[10px] text-stone-400 text-center">
                      {rowIndex}
                    </td>
                    <td className="border border-stone-150 px-2 py-1 text-stone-300 text-center">-</td>
                    <td className="border border-stone-150 px-2 py-1 text-stone-300">-</td>
                    <td className="border border-stone-150 px-2 py-1 text-stone-300">-</td>
                    <td className="border border-stone-150 px-2 py-1 text-stone-300">-</td>
                    <td className="border border-stone-150 px-2 py-1 text-stone-300">-</td>
                    <td className="border border-stone-150 px-2 py-1 text-stone-300">-</td>
                    <td className="border border-stone-150 px-2 py-1 text-stone-300">-</td>
                    <td className="border border-stone-150 px-2 py-1 text-stone-300">-</td>
                    <td className="border border-stone-150 px-2 py-1 text-stone-300 text-center">-</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Google Sheet Simple info bar */}
        <div className="bg-[#f9f9f9] border-t border-stone-200 px-4 py-2.5 flex justify-between items-center text-[10px] text-stone-500 font-mono">
          <div>
            <span>จำนวนใบเบิกทั้งหมด: <strong className="text-stone-850 font-bold">{resolvedIssuances.length}</strong> รายการ</span>
          </div>
          <div>
            <span>พัสดุอะไหล่ตัดคลังจ่ายสะสม: <strong className="text-emerald-700 font-bold">{resolvedIssuances.reduce((sum, item) => sum + item.qtyApproved, 0)}</strong> ชิ้น</span>
          </div>
        </div>
      </div>
    </div>
  );
}
