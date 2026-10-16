import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { HOORA_LOGO_XML } from '../components/hooraLogoXml';
import type { BookingItem, ChallanLine } from '../data/bookingsDemo';
import { SUPPORT } from '../data/support';

// e-Challan Payment Invoice (Dev File → Invoice, 882:372) as a PDF: the same layout the Invoice
// screen shows, printed with expo-print and handed to the share sheet so people can save or send it.
// A single challan's receipt uses the same template with just that challan; garage services use the
// Car Service Invoice layout.

const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;

/** "Rahul Tripathi" → "R***L T*****I", as on the invoice. */
export const maskName = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((w) =>
      w.length <= 2 ? w.toUpperCase() : `${w[0]}${'*'.repeat(w.length - 2)}${w[w.length - 1]}`.toUpperCase(),
    )
    .join(' ');

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c);

const LOGO = HOORA_LOGO_XML.replace('width="135.571" height="40.9373"', 'width="120" height="36"');
const STYLE = `<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #202020; }
  .page { padding: 36px; }
  .hero { position: relative; overflow: hidden; border-radius: 24px; background: #F6F7FB; padding: 28px; }
  .glow { position: absolute; top: -60px; left: 160px; width: 360px; height: 140px; border-radius: 50%; background: radial-gradient(#FFF27A, rgba(255,242,122,0)); }
  .top { position: relative; display: flex; justify-content: space-between; align-items: flex-start; }
  h1 { margin: 0; font-size: 30px; font-weight: 600; }
  .kind { margin-top: 4px; font-size: 16px; }
  .boxes { position: relative; display: flex; gap: 14px; margin-top: 22px; }
  .box { flex: 1; background: #fff; border-radius: 14px; padding: 16px; font-size: 12px; line-height: 2; }
  .box h3 { margin: 0 0 4px; font-size: 13px; font-weight: 600; }
  .k { color: #7C7C7C; }
  h2 { margin: 30px 0 12px; font-size: 13px; font-weight: 600; text-decoration: underline; }
  table { width: 100%; border-collapse: separate; border-spacing: 0 8px; font-size: 13px; }
  th { text-align: left; font-weight: 500; color: #555; padding: 0 14px; }
  td { padding: 12px 14px; border-top: 1px solid #ECEDF0; border-bottom: 1px solid #ECEDF0; }
  td:first-child { border-left: 1px solid #ECEDF0; border-radius: 10px 0 0 10px; }
  td:last-child { border-right: 1px solid #ECEDF0; border-radius: 0 10px 10px 0; }
  .r { text-align: right; }
  .breakup { margin-left: auto; width: 55%; font-size: 13px; }
  .line { display: flex; justify-content: space-between; padding: 5px 8px; }
  .total { margin-top: 6px; padding: 10px 8px; background: #F4F5F7; border-radius: 8px; font-weight: 600; }
  .note { margin-top: 28px; font-size: 10.5px; color: #555; line-height: 1.7; }
  .note b { color: #202020; }
  .foot { margin-top: 30px; padding: 22px 36px; background: #F6F7FB; display: flex; justify-content: space-between; align-items: center; font-size: 11px; line-height: 1.8; color: #555; }
  .foot b { color: #202020; }
  .rows { border: 1px solid #ECEDF0; border-radius: 12px; overflow: hidden; font-size: 13px; }
  .row { display: flex; justify-content: space-between; padding: 12px 14px; }
  .row + .row { border-top: 1px solid #ECEDF0; }
  .row b { font-weight: 600; }
  .gap { height: 10px; }
  .rule { margin: 6px 14px; border-top: 1px solid #202020; }
</style>`;
const FOOT = `<div class="foot"><div><b>HOORA Technologies Pvt. Ltd.</b><br/>www.hoora.in<br/>${SUPPORT.email} / +91-7350982181</div>${LOGO}</div>`;

/** Car Service Invoice (Dev File → Invoice, 8303:1216): service summary, payment summary, totals. */
function serviceInvoiceHtml(item: BookingItem, customer: string) {
  const v = item.serviceInvoice;
  if (!v) return '';
  const row = (k: string, val: string, strong = false) =>
    `<div class="row"><span>${esc(k)}</span>${strong ? `<b>${esc(val)}</b>` : `<span>${esc(val)}</span>`}</div>`;
  return `<!doctype html><html><head><meta charset="utf-8"/>${STYLE}</head><body>
<div class="page">
  <div class="hero"><div class="glow"></div>
    <div class="top"><div><h1>Invoice</h1><div class="kind">Car Service Invoice</div></div>${LOGO}</div>
    <div class="boxes">
      <div class="box"><h3>Invoice Details:</h3>
        <div><span class="k">Invoice number:</span> <b>${esc(v.number)}</b></div>
        <div><span class="k">Issued:</span> <b>${esc(v.issued)}</b></div>
        <div><span class="k">Status:</span> <b>${v.toCollect > 0 ? 'Pending' : 'Paid'}</b></div></div>
      <div class="box"><h3>Customer &amp; Vehicle Details:</h3>
        <div><span class="k">Name:</span> <b>${esc(customer)}</b></div>
        <div>${esc(v.vehicle)}</div>
        <div><span class="k">Vehicle Number:</span> <b>${esc(v.plate.replace(/\s/g, ''))}</b></div>
        <div><span class="k">Address:</span> <b>${esc(v.address)}</b></div></div>
    </div>
  </div>
  <h2>Service Summary</h2>
  <div class="rows">${v.summary.map(([k, val]) => row(k, val)).join('')}</div>
  <h2>Payment Summary</h2>
  <div class="rows">${v.items.map(([k, val]) => row(k, val, true)).join('')}</div>
  <div class="gap"></div>
  <div class="rows">
    ${row('Items Total', rupees(v.itemsTotal))}
    ${row('Door Step Pickup', 'FREE')}
    ${row('Platform Fees', 'FREE')}
    <div class="rule"></div>
    ${row('Booking Paid Amount', rupees(v.paid))}
    ${row('Amount to be collected*', rupees(v.toCollect), true)}
    ${row('Total (inclusive of all taxes)', rupees(v.total))}
  </div>
  <div class="note">This is a system-generated invoice and does not require a physical signature.<br/><br/><b>Thank you for trusting HOORA.</b></div>
</div>
${FOOT}
</body></html>`;
}

export function invoiceHtml(item: BookingItem, customer: string, only?: ChallanLine) {
  const c = item.challan;
  if (!c) return serviceInvoiceHtml(item, customer);
  const lines = only ? [only] : c.lines;
  const inv = c.invoice;
  const receipt = !!only;
  const govt = receipt ? only.amount : inv.govt;
  const rows = lines
    .map(
      (l) => `<tr><td>#${esc(l.number)}</td><td><b>${esc(l.type)}s</b></td><td class="r">${rupees(l.amount)}</td></tr>`,
    )
    .join('');
  const breakup = receipt
    ? `<div class="line total"><span>Amount paid</span><span>${rupees(only.amount)}</span></div>`
    : `<div class="line"><span>Govt. Challan Amount:</span><span>${rupees(govt)}</span></div>
       ${inv.discount ? `<div class="line"><span>Discount Negotiated by HOORA:</span><span>-${rupees(inv.discount)}</span></div>` : ''}
       ${inv.legalFee ? `<div class="line"><span>Legal Service Fees:</span><span>${rupees(inv.legalFee)}</span></div>` : ''}
       ${inv.gst ? `<div class="line"><span>GST (18% on legal fees):</span><span>${rupees(inv.gst)}</span></div>` : ''}
       <div class="line total"><span>Invoice total</span><span>${rupees(inv.total)}</span></div>`;
  const logo = LOGO;
  return `<!doctype html><html><head><meta charset="utf-8"/>
${STYLE}</head><body>
<div class="page">
  <div class="hero"><div class="glow"></div>
    <div class="top"><div><h1>${receipt ? 'Receipt' : 'Invoice'}</h1><div class="kind">${receipt ? 'e-Challan Payment Receipt' : 'e-Challan Payment Invoice'}</div></div>${logo}</div>
    <div class="boxes">
      <div class="box"><h3>Invoice Details:</h3>
        <div><span class="k">Invoice number:</span> <b>${esc(inv.number)}</b></div>
        <div><span class="k">Issued:</span> <b>${esc(inv.issued)}</b></div>
        <div><span class="k">Status:</span> <b>Paid</b></div></div>
      <div class="box"><h3>Customer &amp; Vehicle Details:</h3>
        <div><span class="k">Name:</span> <b>${esc(maskName(customer))}</b></div>
        <div><span class="k">Vehicle Number:</span> <b>${esc(c.plate.replace(/\s/g, ''))}</b></div></div>
    </div>
  </div>
  <h2>Challan Summary</h2>
  <table><thead><tr><th>Challan Number</th><th>Challan Type</th><th class="r">Amount</th></tr></thead><tbody>${rows}</tbody></table>
  <h2 style="margin-left:45%">Payment Breakup</h2>
  <div class="breakup">${breakup}</div>
  <div class="note"><b>Important Note:</b><br/>
    • This ${receipt ? 'receipt' : 'invoice'} confirms successful payment of ${receipt ? 'this challan' : 'all listed challans'}.<br/>
    • Traffic challans are settled instantly with authorities.<br/>
    • Court challans require legal representation. HOORA manages the complete process.<br/>
    • Government receipts may be available separately within 2–3 working days.<br/>
    This is a system-generated ${receipt ? 'receipt' : 'invoice'} and does not require a physical signature.<br/><br/>
    <b>Thank you for trusting HOORA.</b></div>
</div>
${FOOT}
</body></html>`;
}

/** Makes the PDF and opens the share sheet (Save to Files, WhatsApp, email…). On web, the print dialog. */
export async function downloadInvoice(item: BookingItem, customer: string, only?: ChallanLine) {
  const html = invoiceHtml(item, customer, only);
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: only ? 'Challan receipt' : 'Invoice',
    });
  }
}
