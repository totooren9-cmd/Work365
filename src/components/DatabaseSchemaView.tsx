/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, Copy, Check, Terminal, ExternalLink, Activity } from 'lucide-react';
import { SUPABASE_SQL_SCHEMA } from '../supabaseSchema';
import { supabase } from '../supabaseClient';

export default function DatabaseSchemaView() {
  const [copied, setCopied] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    try {
      // Basic health check probing machines table if exists or just standard API ping
      const { data, error } = await supabase.from('heavy_machinery').select('*', { count: 'exact', head: true });
      if (error && error.code !== '42P01') { 
        // 42P01 is table does not exist, meaning connection works but table hasn't been created yet
        throw error;
      }
      setTestStatus('success');
    } catch (err) {
      console.error(err);
      setTestStatus('error');
    }
  };

  return (
    <div className="space-y-6" id="db-schema-view-section">
      <div className="bg-white/80 backdrop-blur-md border border-amber-200/50 shadow-sm rounded-2xl p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-200 to-yellow-100 text-amber-700 rounded-xl shadow-sm border border-amber-200/50">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-stone-800">โครงสร้างฐานข้อมูล (Supabase SQL Schema)</h2>
              <p className="text-xs text-stone-500 font-medium">ระบบ FlowWork CMMS 360 พร้อมเชื่อมต่อ Supabase เรีบร้อยแล้ว</p>
            </div>
          </div>
          <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleTestConnection}
              disabled={testStatus === 'testing'}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Activity className={`w-4 h-4 ${testStatus === 'testing' ? 'animate-pulse text-amber-500' : testStatus === 'success' ? 'text-emerald-500' : testStatus === 'error' ? 'text-rose-500' : 'text-stone-400'}`} />
              {testStatus === 'idle' && 'ทดสอบการเชื่อมต่อ API'}
              {testStatus === 'testing' && 'กำลังทดสอบ Ping...'}
              {testStatus === 'success' && 'เชื่อมต่อ API สำเร็จ ยอดเยี่ยม!'}
              {testStatus === 'error' && 'พบข้อผิดพลาด โปรดตรวจสอบ Key'}
            </button>
            <button
              onClick={handleCopy}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-tr from-amber-400 to-yellow-300 text-stone-900 border-amber-300 shadow-[0_4px_16px_-4px_rgba(251,191,36,0.4)] hover:shadow-md px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'คัดลอก Schema สำเร็จ!' : 'Copy SQL Schema รันเลย'}
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col lg:flex-row gap-6">
          {/* SQL Editor Frame */}
          <div className="flex-1 bg-white border border-stone-200 rounded-2xl overflow-hidden font-mono text-[11px] leading-relaxed shadow-sm">
            <div className="bg-stone-50 px-4 py-2 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-stone-500 font-semibold">
                <Terminal className="w-4 h-4 text-amber-500" />
                <span>supabase_cmms_schema_v2.sql</span>
              </div>
              <span className="text-[10px] bg-stone-200 text-stone-600 px-2 py-0.5 rounded font-bold">PostgreSQL v15+ Compatible</span>
            </div>
            <div className="p-4 h-[420px] overflow-y-auto custom-scroll text-stone-600 bg-stone-50/50">
              <pre className="whitespace-pre">{SUPABASE_SQL_SCHEMA}</pre>
            </div>
          </div>

          {/* Quick Setup Guide Sidebar */}
          <div className="w-full lg:w-[320px] bg-white/60 border border-stone-200 rounded-2xl p-5 space-y-4 text-xs shrink-0 self-start shadow-sm">
            <h3 className="text-sm font-bold text-stone-800 border-b border-stone-200 pb-2">คำแนะนำการติดตั้งใน Supabase</h3>
            <ol className="space-y-3 pl-4 list-decimal text-stone-600 font-medium leading-relaxed">
              <li>
                <strong className="text-stone-800">เปิดแดชบอร์ด Supabase</strong> ของคุณและเข้าไปที่โครงการ (Project)
              </li>
              <li>
                เลือกแท็บ <strong className="text-stone-800">SQL Editor</strong> จากเมนูด้านซ้ายมือ
              </li>
              <li>
                กดสร้าง Query ใหม่ (<strong className="text-stone-800">New Query</strong>)
              </li>
              <li>
                กดคลิกปุ่ม <strong className="text-stone-800">Copy</strong> ด้านบน เพื่อคัดลอก SQL Code ทั้งหมดไปวางในช่องโปรแกรม
              </li>
              <li>
                กดสวิตช์ <strong className="text-amber-600">Run</strong> ด้านขวาบนเพื่อทำการสร้างตาราง คีย์ และอินเด็กซ์ทั้งหมดในระบบภายใน 3 วินาที!
              </li>
            </ol>
            <div className="pt-3 border-t border-stone-200">
              <div className="bg-[#fffefaa6] p-3 rounded-xl border border-amber-200/50 shadow-sm">
                <span className="font-bold text-amber-700 block mb-1">🔥 สิ่งที่จะถูกสร้างภารกิจ:</span>
                <p className="text-[11px] text-stone-600 font-medium leading-normal">
                  - 11 ตารางเอกสารสำคัญครบครัน<br />
                  - Foreign Key เชื่อมสัมพันธ์ Cascade<br />
                  - ตัังค่าบีบอัด JSONB คล่องตัวสูง<br />
                  - ดัชนี (Indexes) เร่งความเร็วการกรองข้อมูล
                </p>
              </div>
            </div>
            <a 
              href="https://supabase.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center justify-center gap-1.5 text-amber-600 hover:text-amber-500 text-[11px] font-bold pt-1 hover:underline"
            >
              <span>รายละเอียดที่ Supabase.com</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
