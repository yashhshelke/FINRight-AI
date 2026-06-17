/**
 * upiParser.ts
 * Client-side UPI statement parser.
 * All processing happens in the browser - zero data is sent to any server.
 * Supports: CSV format (Papa Parse) and PDF text extraction (pdfjs-dist).
 */

import Papa from "papaparse";

export interface UPITransaction {
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  upiRef: string;
  txnId: string;
}

// --- CSV Parser ---

function parseIndianDate(raw: string): string {
  if (!raw) return new Date().toISOString().slice(0, 10);
  raw = raw.trim();
  const dmy = raw.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const year = y.length === 2 ? "20" + y : y;
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const mdy = raw.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
  if (mdy) {
    const [, m, d, y] = mdy;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return raw;
}

function cleanAmount(raw: string | number | undefined): number {
  if (raw === undefined || raw === null || raw === "") return 0;
  const s = String(raw).replace(/[\u20B9,\s]/g, "").trim();
  return parseFloat(s) || 0;
}

function detectHeaders(headers: string[]): Record<string, string> {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const map: Record<string, string> = {};
  headers.forEach((h) => {
    const n = norm(h);
    if (["date", "txndate", "transactiondate", "valuedate"].includes(n)) map["date"] = h;
    else if (["narration", "description", "particulars", "details", "remarks", "txndescription", "transactiondescription"].includes(n)) map["description"] = h;
    else if (["debit", "debitamount", "withdrawal", "withdrawalamount", "dr", "amount(dr)"].includes(n)) map["debit"] = h;
    else if (["credit", "creditamount", "deposit", "depositamount", "cr", "amount(cr)"].includes(n)) map["credit"] = h;
    else if (["balance", "closingbalance", "runningbalance", "availablebalance"].includes(n)) map["balance"] = h;
    else if (["upiref", "upirefno", "referencenumber", "ref", "refno", "refnumber"].includes(n)) map["upiRef"] = h;
    else if (["txnid", "transactionid", "id", "receiptno"].includes(n)) map["txnId"] = h;
    else if (["amount"].includes(n)) map["amount"] = h;
  });
  return map;
}

export function parseCSV(text: string): UPITransaction[] {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  if (!result.data || result.data.length === 0) return [];
  const headers = Object.keys(result.data[0] || {});
  const hMap = detectHeaders(headers);
  const txns: UPITransaction[] = [];
  let runningBalance = 0;

  result.data.forEach((row, i) => {
    const dateRaw = hMap["date"] ? row[hMap["date"]] : "";
    const desc = hMap["description"] ? row[hMap["description"]] : `Transaction ${i + 1}`;
    let debit = hMap["debit"] ? cleanAmount(row[hMap["debit"]]) : 0;
    let credit = hMap["credit"] ? cleanAmount(row[hMap["credit"]]) : 0;
    if (!debit && !credit && hMap["amount"]) {
      const amt = cleanAmount(row[hMap["amount"]]);
      if (amt < 0) debit = Math.abs(amt);
      else credit = amt;
    }
    const balance = hMap["balance"] ? cleanAmount(row[hMap["balance"]]) : runningBalance + credit - debit;
    runningBalance = balance;
    const upiRef = hMap["upiRef"] ? (row[hMap["upiRef"]] || "") : "";
    const txnId = hMap["txnId"] ? (row[hMap["txnId"]] || `TXN${i}`) : `TXN${i}`;
    if (!dateRaw && !desc) return;
    txns.push({ date: parseIndianDate(dateRaw), description: (desc || "").trim(), debit, credit, balance, upiRef, txnId });
  });
  return txns;
}

// --- PDF Text Parser ---

export async function extractPDFText(arrayBuffer: ArrayBuffer): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const pageTexts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const rowMap = new Map<number, { x: number; text: string }[]>();
    for (const item of content.items) {
      if (!("str" in item) || !item.str.trim()) continue;
      const y = Math.round(item.transform[5]);
      if (!rowMap.has(y)) rowMap.set(y, []);
      rowMap.get(y)!.push({ x: item.transform[4], text: item.str });
    }
    const sortedRows = Array.from(rowMap.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([, tokens]) => tokens.sort((a, b) => a.x - b.x).map((t) => t.text).join(" "));
    pageTexts.push(sortedRows.join("\n"));
  }
  return pageTexts.join("\n");
}

// --- Google Pay PDF Parser ---

function monthToNum(mon: string): string {
  const MAP: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  };
  return MAP[mon.toLowerCase()] || "01";
}

function parseMergedDate(raw: string): string {
  const m = raw.match(/(\d{1,2})([A-Za-z]{3})[,\s]?(\d{4})/);
  if (!m) return new Date().toISOString().slice(0, 10);
  return `${m[3]}-${monthToNum(m[2])}-${m[1].padStart(2, "0")}`;
}

function parseGooglePayPDF(text: string): UPITransaction[] {
  const txns: UPITransaction[] = [];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const TXN_LINE = /^(\d{1,2})\s?([A-Za-z]{3}),?\s?(\d{4})\s+(.*?)\s+(\u20B9[\d,]+\.?\d*)$/;
  const TXN_MERGED = /(\d{2}[A-Za-z]{3},\d{4})\s*(Paidto|Receivedfrom|Selftransfer)(.*?)(\u20B9[\d,]+\.?\d*)/i;
  const UPI_REF_LINE = /UPITransactionID[:\s]*(\d+)/i;
  let txnIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("Note:") || line.startsWith("Page") || line.includes("Transactionstatement") || line.includes("Date&time")) continue;

    let dateStr = "";
    let desc = "";
    let amtStr = "";
    let matched = false;

    const m1 = line.match(TXN_LINE);
    if (m1) {
      const [, day, mon, year, description, amount] = m1;
      dateStr = `${year}-${monthToNum(mon)}-${day.padStart(2, "0")}`;
      desc = description.trim();
      amtStr = amount;
      matched = true;
    }
    if (!matched) {
      const m2 = line.match(TXN_MERGED);
      if (m2) {
        dateStr = parseMergedDate(m2[1]);
        desc = m2[2] + m2[3].trim();
        amtStr = m2[4];
        matched = true;
      }
    }
    if (!matched) continue;

    const lowerDesc = desc.toLowerCase();
    const isReceived = lowerDesc.startsWith("receivedfrom") || lowerDesc.startsWith("received from");
    const isSelf = lowerDesc.startsWith("selftransfer") || lowerDesc.startsWith("self transfer");
    const amount = parseFloat(amtStr.replace(/[\u20B9,\s]/g, "")) || 0;
    if (amount === 0) continue;

    let upiRef = "";
    for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
      const refMatch = lines[j].match(UPI_REF_LINE);
      if (refMatch) { upiRef = refMatch[1]; break; }
    }

    const cleanDesc = desc
      .replace(/^Paidto\s*/i, "Paid to ")
      .replace(/^Receivedfrom\s*/i, "Received from ")
      .replace(/^Selftransfer(to|from)?\s*/i, "Self transfer ")
      .trim();

    txns.push({
      date: dateStr,
      description: cleanDesc,
      debit: isReceived || isSelf ? 0 : amount,
      credit: isReceived ? amount : 0,
      balance: 0,
      upiRef,
      txnId: upiRef || `PDF-${txnIndex++}`,
    });
  }
  return txns;
}

// --- Master PDF text parser ---

export function parsePDFText(text: string): UPITransaction[] {
  const isGooglePay = text.includes("Transaction statement") || text.includes("UPITransactionID") || text.includes("Paidto") || text.includes("Receivedfrom");
  if (isGooglePay) {
    const txns = parseGooglePayPDF(text);
    if (txns.length > 0) return txns;
  }

  // Generic heuristic fallback
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const datePattern = /(\d{1,2}[\/\-][A-Za-z]{3}[\/\-]\d{2,4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;
  const amtPattern = /\u20B9?[\d,]+\.?\d{0,2}/g;
  const txns: UPITransaction[] = [];
  let idx = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!datePattern.test(line)) continue;
    const dateMatch = line.match(datePattern);
    if (!dateMatch) continue;
    const amounts = line.match(amtPattern) || [];
    const numAmounts = amounts.map((a) => parseFloat(a.replace(/[\u20B9,]/g, "")) || 0).filter((a) => a > 0);
    if (numAmounts.length === 0) continue;

    const dateStr = parseIndianDate(dateMatch[1]);
    const desc = line.replace(dateMatch[0], "").replace(amtPattern, "").trim() || `Transaction ${idx + 1}`;
    const mainAmt = numAmounts[0];

    txns.push({
      date: dateStr,
      description: desc,
      debit: mainAmt,
      credit: 0,
      balance: 0,
      upiRef: "",
      txnId: `GEN-${idx++}`,
    });
  }
  return txns;
}
