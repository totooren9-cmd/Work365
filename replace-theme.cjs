const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'components');

const replacements = [
  { rx: /bg-slate-950/g, val: 'bg-white' },
  { rx: /bg-slate-900/g, val: 'bg-stone-50' },
  { rx: /bg-slate-850/g, val: 'bg-white' },
  { rx: /bg-slate-800/g, val: 'bg-stone-50' },
  { rx: /bg-slate-700/g, val: 'bg-stone-100' },
  { rx: /border-slate-800/g, val: 'border-stone-200' },
  { rx: /border-slate-850/g, val: 'border-stone-200' },
  { rx: /border-slate-700/g, val: 'border-stone-200' },
  { rx: /border-slate-600/g, val: 'border-stone-200' },
  { rx: /text-slate-400/g, val: 'text-stone-500' },
  { rx: /text-slate-300/g, val: 'text-stone-600' },
  { rx: /text-slate-200/g, val: 'text-stone-700' },
  { rx: /text-slate-150/g, val: 'text-stone-800' },
  { rx: /text-slate-100/g, val: 'text-stone-800' },
  { rx: /text-slate-50\b/g, val: 'text-stone-900' },
  { rx: /bg-industrial-blue\/40/g, val: 'bg-white/80' },
  { rx: /bg-industrial-blue/g, val: 'bg-white' },
  { rx: /text-emerald-400/g, val: 'text-emerald-600' },
  { rx: /text-red-400/g, val: 'text-red-600' },
  { rx: /text-orange-400/g, val: 'text-orange-600' },
  { rx: /text-teal-400/g, val: 'text-teal-600' },
  { rx: /text-rose-400/g, val: 'text-rose-600' },
  { rx: /bg-slate-950\/60/g, val: 'bg-stone-100/60' },
  { rx: /bg-orange-500\/10 text-orange-400/g, val: 'bg-amber-100 text-amber-600' },
  { rx: /text-white/g, val: 'text-stone-900' }, // For buttons, might break some, but let's see. Wait, action buttons with bg-orange-500 need text-white! Let's skip text-white globally.
];

// Avoid blanket text-white replacement
const replacementsSafe = replacements.filter(r => r.rx.source !== 'text-white' && typeof r.rx !== 'string');

fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.tsx') && file !== 'DatabaseSchemaView.tsx') { // we manually did DatabaseSchemaView
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    replacementsSafe.forEach(r => {
      content = content.replace(r.rx, r.val);
    });
    // some specific premium upgrades:
    content = content.replace(/glass-panel/g, 'shadow-sm backdrop-blur-md');
    fs.writeFileSync(path.join(dir, file), content, 'utf8');
  }
});
console.log('Done replacement.');
