// Browser-only, dependency-free CSV/XLSX intake. No spreadsheet formula execution
// and no external upload: the original authenticated Portal Domain State owns writes.
export const IMPORT_LIMITS=Object.freeze({fileBytes:4*1024*1024,rows:1000,columns:40,serializedBytes:220*1024});

export function tableFromRecords(records,{sheet="CSV"}={}){
  if(!Array.isArray(records))throw new Error("Geen geldige tabel aangetroffen.");
  const meaningful=records.filter(row=>Array.isArray(row)&&row.some(v=>String(v??"").trim()));
  if(meaningful.length<2)throw new Error("Het bestand moet een kopregel en minimaal één gegevensrij bevatten.");
  const header=meaningful[0];
  if(header.length>IMPORT_LIMITS.columns)throw new Error("Te veel kolommen; maximaal 40 per import.");
  const names=new Set();
  const columns=header.map((value,index)=>{
    const base=String(value??"").trim().slice(0,80)||"Kolom "+(index+1);
    let unique=base,n=2;
    while(names.has(unique.toLowerCase()))unique=base+" ("+(n++)+")";
    names.add(unique.toLowerCase());
    return unique;
  });
  const rows=meaningful.slice(1).map((raw,index)=>{
    if(raw.length>IMPORT_LIMITS.columns || raw.slice(columns.length).some(v=>String(v??"").trim()))
      throw new Error("Rij "+(index+2)+" bevat meer kolommen dan de kopregel.");
    return columns.map((_,i)=>{const cell=String(raw[i]??"").trim();if(cell.length>2000)throw new Error("Rij "+(index+2)+" bevat een te lange celwaarde.");return cell;});
  });
  if(rows.length>IMPORT_LIMITS.rows)throw new Error("Meer dan 1.000 rijen. Gebruik een kleiner bestand of een bestaande gegevenskoppeling.");
  const table={sheet,columns,rows,rowCount:rows.length};
  if(new TextEncoder().encode(JSON.stringify(table)).length>IMPORT_LIMITS.serializedBytes)
    throw new Error("Deze tabel is te groot voor veilige portaalopslag (maximaal 220 KB aan gegevens). Gebruik voor grote datasets een koppeling.");
  return table;
}
function delimiterFor(text){
  const first=String(text).split(/\r?\n/,1)[0]||"";
  const scores=[",",";","\t"].map(delimiter=>{
    let count=0,quotes=false;
    for(let i=0;i<first.length;i++){
      if(first[i]==='"'&&first[i+1]==='"'&&quotes){i++;continue;}
      if(first[i]==='"')quotes=!quotes;
      else if(!quotes&&first[i]===delimiter)count++;
    }
    return {delimiter,count};
  }).sort((a,b)=>b.count-a.count);
  return scores[0].count?scores[0].delimiter:",";
}
export function parseCsv(text){
  if(typeof text!=="string")throw new Error("CSV-tekst ontbreekt.");
  const source=text.replace(/^\uFEFF/,"");
  if(source.includes("\0"))throw new Error("Dit lijkt geen geldig tekstbestand.");
  const delimiter=delimiterFor(source);
  const records=[];let cells=[],cell="",quoted=false;
  for(let i=0;i<source.length;i++){
    const ch=source[i];
    if(ch==='"'){
      if(quoted&&source[i+1]==='"'){cell+='"';i++;}
      else if(quoted)quoted=false;
      else if(!cell.trim())quoted=true;
      else cell+=ch;
    }else if(!quoted&&ch===delimiter){cells.push(cell);cell="";}
    else if(!quoted&&(ch==="\n"||ch==="\r")){
      if(ch==="\r"&&source[i+1]==="\n")i++;
      cells.push(cell);records.push(cells);cells=[];cell="";
      if(records.length>IMPORT_LIMITS.rows+101)throw new Error("Het CSV-bestand bevat te veel rijen.");
    }else cell+=ch;
  }
  if(quoted)throw new Error("De CSV bevat een niet-afgesloten aanhalingsteken.");
  cells.push(cell);records.push(cells);
  return tableFromRecords(records,{sheet:"CSV"});
}

const decoder=new TextDecoder("utf-8",{fatal:true});
const view32=(view,n)=>view.getUint32(n,true);
function readZipDirectory(bytes){
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  let eocd=-1;
  for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--){
    if(view32(view,i)===0x06054b50){eocd=i;break;}
  }
  if(eocd<0)throw new Error("Excel-bestand heeft geen geldige ZIP-structuur.");
  const count=view.getUint16(eocd+10,true),offset=view32(view,eocd+16);
  if(count>2000)throw new Error("Excel-bestand bevat te veel onderdelen.");
  const entries=new Map();let at=offset,total=0;
  for(let i=0;i<count;i++){
    if(at+46>bytes.length||view32(view,at)!==0x02014b50)throw new Error("Excel ZIP-index is ongeldig.");
    const method=view.getUint16(at+10,true);
    const compressed=view32(view,at+20),uncompressed=view32(view,at+24);
    const nameLen=view.getUint16(at+28,true),extra=view.getUint16(at+30,true),comment=view.getUint16(at+32,true);
    const filename=decoder.decode(bytes.subarray(at+46,at+46+nameLen));
    if(uncompressed>12*1024*1024||(total+=uncompressed)>24*1024*1024)
      throw new Error("Excel heeft te veel uitgepakte inhoud.");
    entries.set(filename,{offset:view32(view,at+42),method,compressed,uncompressed});
    at+=46+nameLen+extra+comment;
  }
  return entries;
}
async function xmlEntry(bytes,entries,path){
  const entry=entries.get(path);
  if(!entry)throw new Error("Excel-onderdeel ontbreekt: "+path);
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  const at=entry.offset;
  if(at+30>bytes.length||view32(view,at)!==0x04034b50)throw new Error("Excel-onderdeel beschadigd.");
  const start=at+30+view.getUint16(at+26,true)+view.getUint16(at+28,true);
  const data=bytes.subarray(start,start+entry.compressed);
  if(data.length!==entry.compressed)throw new Error("Excel-onderdeel onvolledig.");
  let output;
  if(entry.method===0)output=data;
  else if(entry.method===8){
    if(typeof DecompressionStream!=="function")throw new Error("Deze browser kan Excel niet uitpakken. Gebruik CSV of een bijgewerkte browser.");
    try{
      const stream=new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      output=new Uint8Array(await new Response(stream).arrayBuffer());
    }catch{throw new Error("Excel kon niet worden uitgepakt.");}
  }else throw new Error("Onbekende Excel-compressie.");
  if(output.length!==entry.uncompressed)throw new Error("Excel-inhoud is onvolledig.");
  const doc=new DOMParser().parseFromString(decoder.decode(output),"application/xml");
  if(doc.querySelector("parsererror"))throw new Error("Ongeldige Excel-XML.");
  return doc;
}
const tags=(node,local)=>[...node.getElementsByTagName("*")].filter(item=>item.localName===local);
const first=(node,local)=>tags(node,local)[0]||null;
const attr=(node,name)=>node?.getAttribute(name)||"";
function excelColumn(ref){
  const letters=String(ref).match(/^[A-Z]+/i)?.[0]?.toUpperCase()||"";
  let n=0;for(const c of letters)n=n*26+c.charCodeAt(0)-64;
  return n-1;
}
function excelDate(serial,base1904){
  const n=Number(serial);
  if(!Number.isFinite(n))return serial;
  const ms=Date.UTC(base1904?1904:1899,base1904?0:11,base1904?1:30)+Math.round(n*86400000);
  const date=new Date(ms);
  return Number.isNaN(date.getTime())?serial:date.toISOString().replace("T00:00:00.000Z","").replace(".000Z","Z");
}
function dateStyleIndexes(doc){
  if(!doc)return new Set();
  const customs=new Map(tags(doc,"numFmt").map(x=>[Number(attr(x,"numFmtId")),attr(x,"formatCode")]));
  const styles=new Set(),xfs=first(doc,"cellXfs");
  [...(xfs?.children||[])].forEach((xf,i)=>{
    const id=Number(attr(xf,"numFmtId")),format=customs.get(id)||"";
    if([14,15,16,17,18,19,20,21,22,45,46,47].includes(id)||/[dmy]/i.test(format.replace(/"[^"]*"/g,"").replace(/\[[^\]]*\]/g,"")))styles.add(i);
  });
  return styles;
}
export async function parseXlsx(buffer){
  const bytes=new Uint8Array(buffer);
  if(bytes[0]!==0x50||bytes[1]!==0x4b)throw new Error("Geen geldig .xlsx-bestand.");
  const entries=readZipDirectory(bytes);
  const workbook=await xmlEntry(bytes,entries,"xl/workbook.xml");
  const relationships=await xmlEntry(bytes,entries,"xl/_rels/workbook.xml.rels");
  const sheet=tags(workbook,"sheet")[0];
  if(!sheet)throw new Error("De Excel-werkmap bevat geen werkblad.");
  const sheetId=[...sheet.attributes].find(a=>a.localName==="id")?.value;
  const relationship=tags(relationships,"Relationship").find(n=>attr(n,"Id")===sheetId);
  const target=attr(relationship,"Target").replace(/^\/+/,"");
  if(!target||target.includes("..")||/^[a-z]+:/i.test(target))throw new Error("Onbekend Excel-werkbladpad.");
  const path=target.startsWith("xl/")?target:"xl/"+target;
  const xml=await xmlEntry(bytes,entries,path);
  const shared=entries.has("xl/sharedStrings.xml")?await xmlEntry(bytes,entries,"xl/sharedStrings.xml"):null;
  const strings=shared?tags(shared,"si").map(si=>tags(si,"t").map(t=>t.textContent).join("")):[];
  const styles=entries.has("xl/styles.xml")?dateStyleIndexes(await xmlEntry(bytes,entries,"xl/styles.xml")):new Set();
  const base1904=attr(first(workbook,"workbookPr"),"date1904")==="1";
  const records=[];
  for(const row of tags(xml,"row")){
    if(records.length>IMPORT_LIMITS.rows+100)throw new Error("Excel bevat te veel rijen.");
    const cells=[];
    for(const cell of [...row.children].filter(n=>n.localName==="c")){
      const col=excelColumn(attr(cell,"r"));
      if(col<0||col>=IMPORT_LIMITS.columns)throw new Error("Excel heeft meer dan 40 kolommen.");
      const type=attr(cell,"t"),value=first(cell,"v")?.textContent||"";
      let resolved=type==="s"?strings[Number(value)]??"":type==="inlineStr"?tags(cell,"t").map(t=>t.textContent).join(""):value;
      if(type!=="s"&&type!=="inlineStr"&&styles.has(Number(attr(cell,"s")))&&resolved!=="")resolved=excelDate(resolved,base1904);
      cells[col]=String(resolved??"");
    }
    records.push(cells);
  }
  return tableFromRecords(records,{sheet:attr(sheet,"name")||"Blad 1"});
}
export async function readImportFile(file){
  if(!file||!file.name)throw new Error("Kies eerst een CSV- of Excel-bestand.");
  const name=file.name.toLowerCase();
  if(file.size>IMPORT_LIMITS.fileBytes)throw new Error("Het bestand is groter dan 4 MB. Gebruik een gegevenskoppeling voor grote datasets.");
  if(name.endsWith(".csv"))return parseCsv(await file.text());
  if(name.endsWith(".xlsx"))return parseXlsx(await file.arrayBuffer());
  if(name.endsWith(".xls"))throw new Error("Oud Excel-formaat .xls: sla het bestand eerst op als .xlsx.");
  throw new Error("Gebruik een .csv- of .xlsx-bestand.");
}
