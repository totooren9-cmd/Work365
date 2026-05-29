const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'components', 'WorkScheduleView.tsx');
let content = fs.readFileSync(file, 'utf8');

// Replace invalid text colors
content = content.replace(/text-slate-650/g, 'text-slate-600');
content = content.replace(/text-slate-450/g, 'text-slate-500');
content = content.replace(/text-slate-850/g, 'text-slate-800');
content = content.replace(/text-slate-105/g, 'text-slate-700');
content = content.replace(/text-slate-250/g, 'text-slate-400');
content = content.replace(/bg-purple-105/g, 'bg-purple-100');
content = content.replace(/border-emerald-250/g, 'border-emerald-200');
content = content.replace(/text-stone-650/g, 'text-stone-600');
content = content.replace(/text-stone-450/g, 'text-stone-500');
content = content.replace(/text-stone-850/g, 'text-stone-800');
content = content.replace(/text-stone-905/g, 'text-stone-900');
content = content.replace(/text-amber-850/g, 'text-amber-800');
content = content.replace(/text-sky-850/g, 'text-sky-800');
content = content.replace(/text-purple-850/g, 'text-purple-800');
content = content.replace(/text-emerald-850/g, 'text-emerald-800');
content = content.replace(/text-rose-850/g, 'text-rose-800');
content = content.replace(/border-stone-250/g, 'border-stone-200');
content = content.replace(/text-orange-550/g, 'text-orange-600');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed invalid tailwind colors');
