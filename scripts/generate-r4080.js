#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { create } = require('xmlbuilder2');
const XLSX = require('xlsx');

const INPUT_FILE = process.argv[2] || 'mar_todos.xlsx';
const OUTPUT_DIR = path.resolve(process.cwd(), 'output');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'R4080_mar_todos.xml');

const toDigits = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\D/g, '');
};

const toPerApur = (value) => {
  if (!value) return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;
  }
  const str = String(value);
  const match = str.match(/(\d{4})[-\/]?(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}`;
  }
  return str;
};

const toNatRend = (value) => {
  if (value === null || value === undefined || value === '') return '';
  const digits = String(value).replace(/\D/g, '');
  return digits.padStart(5, '0');
};

const toDate = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }
  const str = String(value);
  const match = str.match(/(\d{4})[-\/]?(\d{2})[-\/]?(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  throw new Error(`Não foi possível interpretar a data de recebimento: ${value}`);
};

const toMoney = (value) => {
  const num = Number(value) || 0;
  return num.toFixed(2);
};

const workbook = XLSX.readFile(INPUT_FILE, { cellDates: true });
const sheetName = workbook.SheetNames[0];
if (!sheetName) {
  throw new Error('Planilha sem abas.');
}
const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '', raw: true });
if (!rows.length) {
  throw new Error('Planilha vazia.');
}

const perApur = toPerApur(rows[0]['Período de apuração'] || rows[0]['Periodo']);
const estabCnpj = toDigits(rows[0]['CNPJ do Estabelecimento']);
if (estabCnpj.length !== 14) {
  throw new Error('CNPJ do estabelecimento inválido.');
}
const contribRaiz = estabCnpj.slice(0, 8);

const grouped = new Map();
rows.forEach((row, index) => {
  const fontCnpj = toDigits(row['CNPJ da fonte pagadora']);
  if (fontCnpj.length !== 14) {
    console.warn(`Linha ${index + 2}: CNPJ da fonte pagadora inválido, ignorado.`);
    return;
  }
  const natRend = toNatRend(row['Nat Rend Rec p Bem']);
  if (!natRend) {
    console.warn(`Linha ${index + 2}: natureza de rendimento ausente, ignorada.`);
    return;
  }
  const dtFG = toDate(row['Data do recebimento']);
  const vlrBruto = Number(row['Valor bruto']) || 0;
  const vlrBaseIR = Number(row['Valor da base de cálculo do IRRF']) || 0;
  const vlrIR = Number(row['Valor do IRRF']) || 0;

  if (!grouped.has(fontCnpj)) {
    grouped.set(fontCnpj, new Map());
  }
  const rendMap = grouped.get(fontCnpj);
  if (!rendMap.has(natRend)) {
    rendMap.set(natRend, new Map());
  }
  const recMap = rendMap.get(natRend);
  if (!recMap.has(dtFG)) {
    recMap.set(dtFG, { vlrBruto: 0, vlrBaseIR: 0, vlrIR: 0 });
  }
  const rec = recMap.get(dtFG);
  rec.vlrBruto += vlrBruto;
  rec.vlrBaseIR += vlrBaseIR;
  rec.vlrIR += vlrIR;
});

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const eventId = `ID${estabCnpj}${perApur.replace(/\D/g, '') || '0000'}00001`.slice(0, 36);
const root = create({ version: '1.0', encoding: 'UTF-8' });
const reinf = root.ele('Reinf');
const evt = reinf.ele('evtRetRec', { id: eventId });
const ideEvento = evt.ele('ideEvento');
ideEvento.ele('indRetif').txt('1');
ideEvento.ele('perApur').txt(perApur);
ideEvento.ele('tpAmb').txt('1');
ideEvento.ele('procEmi').txt('1');
ideEvento.ele('verProc').txt('1.0');

const ideContri = evt.ele('ideContri');
ideContri.ele('tpInsc').txt('1');
ideContri.ele('nrInsc').txt(contribRaiz);

const ideEstab = evt.ele('ideEstab');
ideEstab.ele('tpInscEstab').txt('1');
ideEstab.ele('nrInscEstab').txt(estabCnpj);

for (const [fontCnpj, rendMap] of grouped) {
  const ideFont = ideEstab.ele('ideFont');
  ideFont.ele('cnpjFont').txt(fontCnpj);
  for (const [natRend, recMap] of rendMap) {
    const ideRend = ideFont.ele('ideRend');
    ideRend.ele('natRend').txt(natRend);
    for (const [dtFG, values] of Array.from(recMap.entries()).sort(([a], [b]) => a.localeCompare(b))) {
      const infoRec = ideRend.ele('infoRec');
      infoRec.ele('dtFG').txt(dtFG);
      infoRec.ele('vlrBruto').txt(toMoney(values.vlrBruto));
      infoRec.ele('vlrBaseIR').txt(toMoney(values.vlrBaseIR));
      infoRec.ele('vlrIR').txt(toMoney(values.vlrIR));
    }
  }
}

const xml = root.end({ prettyPrint: true, indent: '  ', newline: '\n' });
fs.writeFileSync(OUTPUT_FILE, xml);

const totalFonts = grouped.size;
let totalInfoRec = 0;
for (const rendMap of grouped.values()) {
  for (const recMap of rendMap.values()) {
    totalInfoRec += recMap.size;
  }
}

console.log(`Arquivo gerado em ${OUTPUT_FILE}`);
console.log(`Fontes únicas: ${totalFonts}`);
console.log(`Registros infoRec gerados: ${totalInfoRec}`);
