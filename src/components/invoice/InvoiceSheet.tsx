import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { BookingItem } from '../../data/bookingsDemo';
import { SUPPORT } from '../../data/support';
import { downloadInvoice, maskName } from '../../lib/invoice';
import { FormSheet } from '../booking/FormSheet';
import { ink } from '../home/homeTheme';
import { HooraLogo } from '../HooraLogo';
import { fs, sz } from '../responsive';
import { fonts } from '../theme';
import { YellowButton } from '../tracking/TrackingSheets';

// The invoice in a bottom sheet (Dev File → Invoice): e-Challan Payment Invoice (882:372) for
// challans, Car Service Invoice (8303:1216) for garage. Download makes the PDF and opens the
// share sheet.

const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;

function KV({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.kv}>
      <Text style={styles.k}>{k}</Text>
      <Text style={styles.v}>{v}</Text>
    </View>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowK}>{k}</Text>
      <Text style={[styles.rowV, strong && styles.rowStrong]}>{v}</Text>
    </View>
  );
}

function Head({ kind, children }: { kind: string; children: ReactNode }) {
  return (
    <View style={styles.hero}>
      <LinearGradient
        colors={['rgba(255,236,80,0)', 'rgba(255,236,80,0.55)', 'rgba(255,236,80,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.glow}
      />
      <LinearGradient colors={['rgba(246,247,251,0)', '#F6F7FB']} style={styles.glowFade} />
      <View style={styles.heroTop}>
        <View>
          <Text style={styles.h1}>Invoice</Text>
          <Text style={styles.kind}>{kind}</Text>
        </View>
        <HooraLogo width={sz(84)} />
      </View>
      {children}
    </View>
  );
}

function ChallanInvoice({ item, customer }: { item: BookingItem; customer: string }) {
  const c = item.challan;
  if (!c) return null;
  const inv = c.invoice;
  return (
    <>
      <Head kind="e-Challan Payment Invoice">
        <View style={styles.box}>
          <Text style={styles.boxTitle}>Invoice Details</Text>
          <KV k="Invoice number" v={inv.number} />
          <KV k="Issued" v={inv.issued} />
          <KV k="Status" v="Paid" />
        </View>
        <View style={styles.box}>
          <Text style={styles.boxTitle}>Customer & Vehicle Details</Text>
          <KV k="Name" v={maskName(customer)} />
          <KV k="Vehicle Number" v={c.plate.replace(/\s/g, '')} />
        </View>
      </Head>
      <Text style={styles.h2}>Challan Summary</Text>
      <View style={styles.rows}>
        {c.lines.map((l) => (
          <View key={l.number} style={styles.challan}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowK} numberOfLines={1}>
                #{l.number}
              </Text>
              <Text style={styles.challanType}>{l.type}</Text>
            </View>
            <Text style={styles.rowV}>{rupees(l.amount)}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.h2}>Payment Breakup</Text>
      <View style={styles.rows}>
        <Row k="Govt. Challan Amount" v={rupees(inv.govt)} />
        {inv.discount ? <Row k="Discount Negotiated by HOORA" v={`-${rupees(inv.discount)}`} /> : null}
        {inv.legalFee ? <Row k="Legal Service Fees" v={rupees(inv.legalFee)} /> : null}
        {inv.gst ? <Row k="GST (18% on legal fees)" v={rupees(inv.gst)} /> : null}
        <View style={[styles.row, styles.total]}>
          <Text style={styles.totalK}>Invoice total</Text>
          <Text style={styles.totalV}>{rupees(inv.total)}</Text>
        </View>
      </View>
      <Text style={styles.note}>
        Traffic challans are settled instantly with authorities. Court challans need legal representation — HOORA
        manages the complete process. Government receipts may come separately within 2–3 working days.
      </Text>
    </>
  );
}

function ServiceInvoice({ item, customer }: { item: BookingItem; customer: string }) {
  const v = item.serviceInvoice;
  if (!v) return null;
  return (
    <>
      <Head kind="Car Service Invoice">
        <View style={styles.box}>
          <Text style={styles.boxTitle}>Invoice Details</Text>
          <KV k="Invoice number" v={v.number} />
          <KV k="Issued" v={v.issued} />
          <KV k="Status" v={v.toCollect > 0 ? 'Pending' : 'Paid'} />
        </View>
        <View style={styles.box}>
          <Text style={styles.boxTitle}>Customer & Vehicle Details</Text>
          <KV k="Name" v={customer} />
          <KV k="Vehicle" v={`${v.vehicle} · ${v.plate.replace(/\s/g, '')}`} />
          <KV k="Address" v={v.address} />
        </View>
      </Head>
      <Text style={styles.h2}>Service Summary</Text>
      <View style={styles.rows}>
        {v.summary.map(([k, val]) => (
          <Row key={k} k={k} v={val} />
        ))}
      </View>
      <Text style={styles.h2}>Payment Summary</Text>
      <View style={styles.rows}>
        {v.items.map(([k, val]) => (
          <Row key={k} k={k} v={val} strong />
        ))}
      </View>
      <View style={[styles.rows, { marginTop: sz(8) }]}>
        <Row k="Items Total" v={rupees(v.itemsTotal)} />
        <Row k="Door Step Pickup" v="FREE" />
        <Row k="Platform Fees" v="FREE" />
        <Row k="Booking Paid Amount" v={rupees(v.paid)} />
        <Row k="Amount to be collected" v={rupees(v.toCollect)} strong />
        <View style={[styles.row, styles.total]}>
          <Text style={styles.totalK}>Total (incl. all taxes)</Text>
          <Text style={styles.totalV}>{rupees(v.total)}</Text>
        </View>
      </View>
    </>
  );
}

/** Opens with a booking that has an invoice (challan payment or garage service); closes with undefined. */
export function InvoiceSheet({
  item,
  customer,
  onClose,
}: {
  item?: BookingItem;
  customer: string;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState(item);
  if (item && item !== shown) setShown(item);
  const it = item ?? shown;
  const download = async () => {
    if (!it) return;
    setBusy(true);
    try {
      await downloadInvoice(it, customer);
    } finally {
      setBusy(false);
    }
  };
  return (
    <FormSheet
      visible={!!item}
      title="Invoice"
      onClose={onClose}
      maxHeight="90%"
      footer={
        <YellowButton
          label={busy ? 'Preparing…' : 'Download invoice'}
          onPress={() => void download()}
          disabled={busy}
        />
      }
    >
      {it ? (
        <View style={styles.paper}>
          {it.challan ? (
            <ChallanInvoice item={it} customer={customer} />
          ) : (
            <ServiceInvoice item={it} customer={customer} />
          )}
          <View style={styles.company}>
            <View style={{ flex: 1 }}>
              <Text style={styles.companyName}>HOORA Technologies Pvt. Ltd.</Text>
              <Text style={styles.companyLine}>www.hoora.in · {SUPPORT.email} · +91-7350982181</Text>
            </View>
          </View>
        </View>
      ) : null}
    </FormSheet>
  );
}

const styles = StyleSheet.create({
  paper: {
    paddingTop: sz(4),
  },
  hero: {
    padding: sz(14),
    borderRadius: sz(14),
    backgroundColor: '#F6F7FB',
    overflow: 'hidden',
    gap: sz(10),
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: sz(40),
    right: sz(-20),
    height: sz(90),
    transform: [{ rotate: '-4deg' }],
  },
  glowFade: {
    position: 'absolute',
    top: sz(30),
    left: 0,
    right: 0,
    height: sz(70),
  },
  heroTop: {
    marginBottom: sz(4),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  h1: {
    fontFamily: fonts.semiBold,
    fontSize: fs(22),
    color: ink.text,
  },
  kind: {
    marginTop: sz(2),
    fontFamily: fonts.medium,
    fontSize: fs(12.5),
    color: ink.text,
  },
  box: {
    padding: sz(12),
    borderRadius: sz(10),
    backgroundColor: '#FFFFFF',
    gap: sz(4),
  },
  boxTitle: {
    marginBottom: sz(2),
    fontFamily: fonts.semiBold,
    fontSize: fs(12.5),
    color: ink.text,
  },
  kv: {
    flexDirection: 'row',
    gap: sz(6),
  },
  k: {
    fontFamily: fonts.regular,
    fontSize: fs(11.5),
    color: ink.muted,
  },
  v: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: fs(11.5),
    color: ink.text,
  },
  h2: {
    marginTop: sz(16),
    marginBottom: sz(8),
    fontFamily: fonts.semiBold,
    fontSize: fs(13),
    color: ink.text,
  },
  rows: {
    borderRadius: sz(10),
    borderWidth: 1,
    borderColor: '#ECEDF0',
    overflow: 'hidden',
  },
  row: {
    paddingHorizontal: sz(12),
    paddingVertical: sz(9),
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: sz(10),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECEDF0',
  },
  rowK: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: fs(12.5),
    color: ink.label,
  },
  rowV: {
    fontFamily: fonts.medium,
    fontSize: fs(12.5),
    color: ink.text,
  },
  rowStrong: {
    fontFamily: fonts.semiBold,
  },
  challan: {
    paddingHorizontal: sz(12),
    paddingVertical: sz(9),
    flexDirection: 'row',
    alignItems: 'center',
    gap: sz(10),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECEDF0',
  },
  challanType: {
    marginTop: sz(1),
    fontFamily: fonts.semiBold,
    fontSize: fs(11.5),
    color: ink.text,
  },
  total: {
    backgroundColor: '#F4F5F7',
    borderBottomWidth: 0,
  },
  totalK: {
    fontFamily: fonts.semiBold,
    fontSize: fs(13),
    color: ink.text,
  },
  totalV: {
    fontFamily: fonts.bold,
    fontSize: fs(13.5),
    color: ink.text,
  },
  note: {
    marginTop: sz(12),
    fontFamily: fonts.regular,
    fontSize: fs(11),
    lineHeight: fs(16),
    color: ink.muted,
  },
  company: {
    marginTop: sz(16),
    padding: sz(12),
    borderRadius: sz(10),
    backgroundColor: '#F6F7FB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyName: {
    fontFamily: fonts.semiBold,
    fontSize: fs(11.5),
    color: ink.text,
  },
  companyLine: {
    marginTop: sz(2),
    fontFamily: fonts.regular,
    fontSize: fs(10.5),
    color: ink.muted,
  },
});
