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
  const [selectedIssuanceId, setSelectedIssuanceId] = useState<string | null>(issuances[0]?.id || null);

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
    setSelectedIssuanceId(newIssue.id);
    setShowIssueForm(false);
  };

  // Approving a requisition
  const handleApproveRequisition = (iss: InventoryIssuance, isRejected = false) => {
    const targetItem = stocks.find(s => s.id === iss.itemId);
    if (!targetItem) return;

    if (isRejected) {
      onUpdateIssuance({
        ...iss,
        status: 'rejected'
      });
      return;
    }

    // Deduct quantity from the stock list matching rules
    const approvedCount = iss.qtyRequested;
    if (targetItem.quantity < approvedCount) {
      alert(`พัสดุในคลังมีจำกัด (${targetItem.quantity} ลูก) ไม่สามารถเบิกออก ${approvedCount} ได้! กรุณาลดปริมาณเบิกลง`);
      return;
    }

    onUpdateStockQty(targetItem.id, targetItem.quantity - approvedCount);
    onUpdateIssuance({
      ...iss,
      status: 'approved',
      qtyApproved: approvedCount
    });
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
            {issuances.map(iss => (
              <div 
                key={iss.id}
                onClick={() => setSelectedIssuanceId(iss.id)}
                className={`p-3 rounded-xl border text-[11px] cursor-pointer transition-all ${
                  iss.id === selectedIssuanceId
                    ? 'bg-orange-500/10 border-orange-500/50'
                    : 'bg-white/20 border-slate-900 hover:bg-white/50'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono font-bold text-stone-600">{iss.documentNo}</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                    iss.status === 'approved' ? 'bg-emerald-500/10 text-emerald-300' :
                    iss.status === 'rejected' ? 'bg-rose-500/10 text-rose-300' :
                    'bg-amber-500/10 text-amber-300 animate-pulse'
                  }`}>
                    {iss.status === 'approved' ? 'อนุมัติจ่าย' : iss.status === 'rejected' ? 'ปฏิเสธ' : 'รออนุมัติ'}
                  </span>
                </div>
                <div className="text-stone-500 space-y-0.5">
                  <p>พัสดุ: <strong className="text-stone-800">{iss.itemName}</strong> ({iss.qtyRequested} ชิ้น)</p>
                  <p>แผนก: {iss.department}</p>
                </div>
              </div>
            ))}
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
                    className="py-2 bg-rose-500/15 hover:bg-rose-600 hover:text-white rounded-lg text-rose-300 font-semibold transition-colors cursor-pointer"
                  >
                    X ไม่อนุมัติ
                  </button>
                  <button
                    onClick={() => handleApproveRequisition(selectedIssuance)}
                    className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors cursor-pointer"
                  >
                    อนุมัติจ่ายคลัง
                  </button>
                </div>
              )}

              {selectedIssuance.status === 'approved' && (
                <button
                  onClick={() => window.print()}
                  className="w-full py-2 bg-slate-905 hover:bg-stone-50 text-stone-600 border border-stone-200 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  สั่งพิมพ์ใบเบิกพัสดุ (Print A4)
                </button>
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
  );
}
