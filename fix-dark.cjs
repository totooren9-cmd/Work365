const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'components', 'WorkScheduleView.tsx');
let content = fs.readFileSync(file, 'utf8');

// remove all dark: classes
content = content.replace(/ \bdark:[a-z0-9\-/\#[\]]+/g, '');
content = content.replace(/\bdark:[a-z0-9\-/\#[\]]+/g, '');

content = content.replace(/'bg-stone-50\/5 border-slate-200\/5 hover:bg-slate-200\/10'/g, "'bg-stone-50/80 border border-stone-200/60 hover:bg-white'");
content = content.replace(/bg-stone-50\/5/g, 'bg-white');
content = content.replace(/bg-black\/5/g, 'bg-white');
content = content.replace(/bg-black\/10/g, 'bg-stone-50');

fs.writeFileSync(file, content, 'utf8');
console.log('Done fix-dark');
