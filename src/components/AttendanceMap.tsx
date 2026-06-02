import React, { useEffect, useState, useRef } from 'react';
import { AttendanceLog } from '../types';

interface AttendanceMapProps {
  attendances: AttendanceLog[];
  selectedLogId: string | null;
  onSelectLog?: (id: string | null) => void;
}

// Helper to parse coordinates from "lat, lng" string
function parseCoordinates(coordStr: string | undefined): { lat: number; lng: number } | null {
  if (!coordStr) return null;
  const parts = coordStr.split(',');
  if (parts.length === 2) {
    const lat = parseFloat(parts[0].trim());
    const lng = parseFloat(parts[1].trim());
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }
  return null;
}

export default function AttendanceMap({
  attendances,
  selectedLogId,
  onSelectLog
}: AttendanceMapProps) {
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // 1. Dynamic script loader for Leaflet (compatible with React 19 / Zero build-time issues)
  useEffect(() => {
    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }

    // Append beautiful Leaflet CSS
    const cssId = 'leaflet-cdn-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    // Append Leaflet script
    const scriptId = 'leaflet-cdn-js';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.crossOrigin = '';
      script.onload = () => setLeafletLoaded(true);
      document.head.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if ((window as any).L) {
          setLeafletLoaded(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  // 2. Map Initialization
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    // Create Leaflet Map Instance
    // Center at Lamphun/Chiang Mai area default (construction project sites)
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([18.7904, 98.9841], 10);

    // Beautiful High Contrast Light OSM Tile template
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    mapInstanceRef.current = map;

    // Trigger immediate resize to fix any Leaflet container sizing bugs
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [leafletLoaded]);

  // 3. Render and Synchronize Pins / Markers when attendance list or selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = (window as any).L;
    if (!map || !L || !leafletLoaded) return;

    // Clean up older items
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const bounds: any[] = [];
    let focusedMarker: any = null;

    attendances.forEach(attendance => {
      const isSelected = selectedLogId === attendance.id;

      // --- A. CHECK-IN MARKER RENDER ---
      const inCoord = parseCoordinates(attendance.gpsLocIn);
      if (inCoord) {
        const checkInMarker = L.marker([inCoord.lat, inCoord.lng], {
          icon: L.divIcon({
            className: 'custom-leaflet-pin',
            html: `
              <div class="relative flex flex-col items-center">
                <span class="w-3.5 h-3.5 bg-emerald-500 border border-white rounded-full shadow-lg absolute animate-ping opacity-75"></span>
                <div class="w-7 h-7 rounded-full bg-emerald-600 border-2 ${isSelected ? 'border-amber-400 scale-125 ring-4 ring-emerald-500/20' : 'border-white'} flex items-center justify-center shadow-md relative z-15 transition-transform duration-300">
                  <span class="text-white text-[9px] font-black leading-none">IN</span>
                </div>
                <div class="absolute -bottom-5 bg-stone-900 border border-stone-800 text-[8px] font-black text-white px-1 py-0.5 rounded shadow mt-0.5 whitespace-nowrap z-20">
                  ${attendance.employeeName.split(' ')[0]}
                </div>
              </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          })
        });

        const checkInPopup = `
          <div class="p-1 font-sans text-xs min-w-[200px]">
            <div class="flex items-center gap-1.5 border-b border-stone-150 pb-1.5 mb-1.5">
              <span class="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.5 rounded">สแกนเข้างาน 🟢</span>
              <span class="text-stone-400 text-[10px] ml-auto font-mono">${attendance.checkInTime ? attendance.checkInTime.substring(11, 16) : '-'} น.</span>
            </div>
            <div class="font-extrabold text-stone-850 text-sm leading-tight">${attendance.employeeName}</div>
            <div class="text-stone-500 font-bold text-[10px] mt-0.5">${attendance.role || 'พนักงานช่าง'}</div>
            
            <div class="mt-2 space-y-1 text-stone-700">
              <p>📍 <b>จุดลงงาน:</b> ${attendance.siteName || '-'}</p>
              <p class="font-mono text-[9px] text-stone-400">พิกัดทางภูมิศาสตร์: ${attendance.gpsLocIn}</p>
            </div>

            ${attendance.photoUrl ? `
              <div class="mt-2 rounded-xl overflow-hidden border border-stone-200 shadow-sm">
                <img src="${attendance.photoUrl}" alt="Photo In" class="w-full h-24 object-cover" referrerpolicy="no-referrer" />
              </div>
            ` : `
              <div class="mt-2 py-2 px-1 text-center bg-stone-50 rounded-lg text-[10px] text-stone-400 italic">
                ไม่ได้แนบรูปถ่ายกล้องเข้างาน
              </div>
            `}
          </div>
        `;

        checkInMarker.bindPopup(checkInPopup);
        
        checkInMarker.on('click', () => {
          if (onSelectLog) onSelectLog(attendance.id);
        });

        checkInMarker.addTo(map);
        markersRef.current.push(checkInMarker);
        bounds.push([inCoord.lat, inCoord.lng]);

        if (isSelected) {
          focusedMarker = checkInMarker;
        }
      }

      // --- B. CHECK-OUT MARKER RENDER ---
      if (attendance.gpsLocOut) {
        const outCoord = parseCoordinates(attendance.gpsLocOut);
        if (outCoord) {
          const checkOutMarker = L.marker([outCoord.lat, outCoord.lng], {
            icon: L.divIcon({
              className: 'custom-leaflet-pin-out',
              html: `
                <div class="relative flex flex-col items-center">
                  <span class="w-3.5 h-3.5 bg-rose-500 border border-white rounded-full shadow-lg absolute animate-ping opacity-75"></span>
                  <div class="w-7 h-7 rounded-full bg-rose-600 border-2 ${isSelected ? 'border-amber-400 scale-125 ring-4 ring-rose-500/20' : 'border-white'} flex items-center justify-center shadow-md relative z-15 transition-transform duration-300">
                    <span class="text-white text-[9px] font-black leading-none">OUT</span>
                  </div>
                  <div class="absolute -bottom-5 bg-stone-900 border border-stone-800 text-[8px] font-black text-white px-1 py-0.5 rounded shadow mt-0.5 whitespace-nowrap z-20">
                    ${attendance.employeeName.split(' ')[0]} (ออก)
                  </div>
                </div>
              `,
              iconSize: [36, 36],
              iconAnchor: [18, 18]
            })
          });

          const checkOutPopup = `
            <div class="p-1 font-sans text-xs min-w-[200px]">
              <div class="flex items-center gap-1.5 border-b border-stone-150 pb-1.5 mb-1.5">
                <span class="bg-rose-100 text-rose-800 text-[9px] font-black px-1.5 py-0.5 rounded">สแกนออกงาน 🔴</span>
                <span class="text-stone-400 text-[10px] ml-auto font-mono">${attendance.checkOutTime ? attendance.checkOutTime.substring(11, 16) : '-'} น.</span>
              </div>
              <div class="font-extrabold text-stone-850 text-sm leading-tight">${attendance.employeeName}</div>
              <div class="text-stone-500 font-bold text-[10px] mt-0.5">${attendance.role || 'พนักงานช่าง'}</div>
              
              <div class="mt-2 space-y-1 text-stone-700">
                <p>📍 <b>จุดปิดงาน:</b> ${attendance.siteName || '-'}</p>
                <p class="font-mono text-[9px] text-stone-400">พิกัดทางภูมิศาสตร์: ${attendance.gpsLocOut}</p>
              </div>

              ${attendance.photoUrlOut ? `
                <div class="mt-2 rounded-xl overflow-hidden border border-stone-200 shadow-sm">
                  <img src="${attendance.photoUrlOut}" alt="Photo Out" class="w-full h-24 object-cover" referrerpolicy="no-referrer" />
                </div>
              ` : `
                <div class="mt-2 py-2 px-1 text-center bg-stone-50 rounded-lg text-[10px] text-stone-400 italic">
                  ไม่ได้แนบรูปถ่ายกล้องออกงาน
                </div>
              `}
            </div>
          `;

          checkOutMarker.bindPopup(checkOutPopup);
          
          checkOutMarker.on('click', () => {
            if (onSelectLog) onSelectLog(attendance.id);
          });

          checkOutMarker.addTo(map);
          markersRef.current.push(checkOutMarker);
          bounds.push([outCoord.lat, outCoord.lng]);

          // Prefer centering on Check-in but if we select check-out we can zoom too
          if (isSelected && !focusedMarker) {
            focusedMarker = checkOutMarker;
          }
        }
      }
    });

    // Handle map zoom and focusing interaction
    if (focusedMarker) {
      const markerLatLng = focusedMarker.getLatLng();
      map.setView(markerLatLng, 15);
      focusedMarker.openPopup();
    } else if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [leafletLoaded, attendances, selectedLogId]);

  return (
    <div className="relative w-full h-[320px] bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-inner flex flex-col justify-end">
      {!leafletLoaded ? (
        <div className="absolute inset-x-0 bottom-0 top-0 flex flex-col items-center justify-center bg-stone-50 z-35">
          <span className="w-8 h-8 rounded-full border-4 border-violet-600/30 border-t-violet-600 animate-spin mb-2"></span>
          <p className="text-[11px] font-black text-stone-600">กำลังเชื่อมต่อแผนที่ความมแม่นยำสูงกล้อง GPS...</p>
        </div>
      ) : null}
      
      {/* Real Map DOM Element */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full z-10" 
        style={{ minHeight: '100%' }}
      />

      {/* Tiny instructions overlay */}
      <div className="absolute top-2 right-2 bg-stone-900/95 backdrop-blur text-white text-[8px] font-bold px-2 py-1 rounded shadow-md border border-stone-800 z-15 pointer-events-none uppercase">
        Live GL Coordinates sync
      </div>
    </div>
  );
}
