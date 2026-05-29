import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera, FileCheck, Wrench, Calendar } from 'lucide-react';
import { HeavyMachinery } from '../types';

interface QrScannerModalProps {
  onClose: () => void;
  onScan: (decodedText: string) => void;
  machineries: HeavyMachinery[];
}

export default function QrScannerModal({ onClose, onScan, machineries }: QrScannerModalProps) {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scannedMachine, setScannedMachine] = useState<HeavyMachinery | null>(null);

  useEffect(() => {
    // initialize scanner
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
      supportedScanTypes: [] // uses default
    };

    const scanner = new Html5QrcodeScanner('qr-reader', config, false);

    scanner.render((decodedText) => {
      setScanResult(decodedText);
      scanner.clear(); // stop scanning after success
      
      // Try to find machine 
      const found = machineries.find(m => m.code === decodedText || m.id === decodedText);
      if (found) {
        setScannedMachine(found);
      }
      onScan(decodedText);
    }, (err) => {
      // ignore
    });

    return () => {
      scanner.clear().catch(e => console.error("Failed to clear scanner", e));
    };
  }, [machineries, onScan]);

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-center p-4">
      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-stone-800">Scan Equipment QR View</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-lg text-stone-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          
          {!scanResult ? (
             <div>
               <p className="text-sm text-stone-500 mb-4 text-center">สแกน QR Code ที่ติดอยู่บนเครื่องจักรเพื่อเปิดข้อมูล</p>
               <div className="rounded-2xl overflow-hidden border border-stone-200 bg-stone-900 shadow-inner" id="qr-reader"></div>
             </div>
          ) : (
             <div className="space-y-6">
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto mb-2 shadow-sm">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-emerald-800 text-lg">Scan Successful!</h4>
                  <p className="text-xs text-emerald-600/80 font-mono mt-1">Code: {scanResult}</p>
                </div>

                {scannedMachine ? (
                  <div className="bg-white border text-left border-stone-200 rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-stone-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="relative">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-orange-500/10 text-orange-600 border border-orange-500/20 uppercase">Record Found</span>
                      <h3 className="font-display font-bold text-xl text-stone-900 mt-2">{scannedMachine.brand} {scannedMachine.model}</h3>
                      <p className="text-sm text-stone-500">Code: <span className="font-bold text-stone-700">{scannedMachine.code}</span></p>
                      
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                          <p className="text-[10px] text-stone-500 font-medium mb-1">Hour Meter</p>
                          <p className="text-sm font-bold text-stone-800">{scannedMachine.hourMeter.toLocaleString()} hrs</p>
                        </div>
                        <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                          <p className="text-[10px] text-stone-500 font-medium mb-1">Status</p>
                          <p className="text-sm font-bold text-stone-800">
                            {scannedMachine.status === 'active' ? <span className="text-emerald-600">พร้อมใช้งาน</span> :
                             scannedMachine.status === 'under_repair' ? <span className="text-rose-600">รอซ่อม</span> : 
                             scannedMachine.status === 'maintenance_due' ? <span className="text-amber-600">ถึงกำหนด PM</span> : 'เลิกใช้งาน'}
                          </p>
                        </div>
                      </div>

                      {/* Quick Actions (Simulated) */}
                      <div className="mt-5 grid grid-cols-2 gap-2">
                        <button className="py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow transition-all flex items-center justify-center gap-2">
                          <Wrench className="w-3.5 h-3.5" />
                          เปิดแจ้งซ่อม
                        </button>
                        <button className="py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold border border-stone-200 transition-all flex items-center justify-center gap-2">
                          <Calendar className="w-3.5 h-3.5" />
                          ดูแผน PM
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl text-center">
                    <p className="text-sm text-rose-700 font-medium mb-1">Unrecognized QR Code</p>
                    <p className="text-xs text-rose-600/80">รหัสนี้ไม่พบอยู่ในฐานข้อมูลเครื่องจักร</p>
                  </div>
                )}
             </div>
          )}

        </div>
      </div>
    </div>
  );
}
