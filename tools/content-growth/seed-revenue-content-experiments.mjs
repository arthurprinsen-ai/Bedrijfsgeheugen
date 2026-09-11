import fs from 'node:fs';
import { buildExperimentCalendar } from '../../brain/creative/revenue-content-intelligence.mjs';

const [output='data/revenue-content-experiment-calendar.json',start='2026-09-12',end='2026-12-31']=process.argv.slice(2);
const calendar=buildExperimentCalendar({start,end});
if(!calendar.length)throw new Error('empty revenue content experiment calendar');
fs.writeFileSync(output,JSON.stringify({version:'revenue-content-calendar-v1',start,end,count:calendar.length,calendar},null,2)+'\n');
console.log(JSON.stringify({output,start,end,count:calendar.length}));
