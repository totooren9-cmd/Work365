const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'components');

const replacements = [
  // When hovering on a light button to another light background, we don't want text-white.
  { rx: /text-stone-700 hover:text-white/g, val: 'text-stone-700 hover:text-stone-900' },
  { rx: /text-stone-600 hover:text-white/g, val: 'text-stone-600 hover:text-stone-900' },
  { rx: /text-stone-500 hover:text-white/g, val: 'text-stone-500 hover:text-stone-900' },
  { rx: /text-stone-400 hover:text-white/g, val: 'text-stone-500 hover:text-stone-900' },
  
  // A lot of "text-white" in small tabs or labels that now have light backgrounds
  { rx: /bg-white text-stone-500/g, val: 'bg-white text-stone-700' },
  
  // For text colors that were just translated from text-slate-300
  { rx: /text-stone-300/g, val: 'text-stone-600' },
  
  // Any "text-white" that is definitely wrong on a light background. 
  // Let's specifically look at some buttons.
  // Wait, I will use regular expressions to target specific known issues if we see them. 
  // Let's replace "text-white" inside elements that DO NOT have dark backgrounds. 
  // Simple case: text-stone-300 is too light. changed to text-stone-600 above.
];

fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.tsx')) {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    replacements.forEach(r => {
      content = content.replace(r.rx, r.val);
    });
    fs.writeFileSync(path.join(dir, file), content, 'utf8');
  }
});
console.log('Done fix-text-colors.');
