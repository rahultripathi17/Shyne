import type { ImageSourcePropType } from 'react-native';

// Bookings across every Hoora vertical. SAMPLE data for the prototype (taken from the
// "My Bookings — premium" reference) — replace with the bookings API.

export type VerticalKey = 'washes' | 'society' | 'products' | 'bundles' | 'challans' | 'garage' | 'qr';

export const VERTICALS: { key: VerticalKey; label: string; image: ImageSourcePropType; explore: string }[] = [
  { key: 'washes', label: 'Washes', image: require('../../assets/home/v2/wash-icon.png'), explore: 'Book a wash' },
  {
    key: 'society',
    label: 'Society Pack',
    image: require('../../assets/bookings/society.png'),
    explore: 'View society packs',
  },
  {
    key: 'products',
    label: 'Products',
    image: require('../../assets/home/v2/accessories-icon.png'),
    explore: 'Shop products',
  },
  { key: 'bundles', label: 'Bundles', image: require('../../assets/bookings/package.png'), explore: 'View wash packs' },
  {
    key: 'challans',
    label: 'Challans',
    image: require('../../assets/home/challan-check.png'),
    explore: 'Check challans',
  },
  { key: 'garage', label: 'Garage', image: require('../../assets/home/v2/garage-icon.png'), explore: 'Book a service' },
  {
    key: 'qr',
    label: 'Connect QR',
    image: require('../../assets/home/connect-qr.png'),
    explore: 'Get a Connect QR tag',
  },
];

/** Status colour families — one per meaning, so the same colour always says the same thing. */
export type Tone = 'progress' | 'transit' | 'pending' | 'active' | 'attention' | 'done' | 'closed';

export type BookingItem = {
  id: string;
  vertical: VerticalKey;
  ref: string;
  status: string;
  tone: Tone;
  eyebrow: string;
  title: string;
  meta: string;
  image?: ImageSourcePropType;
  /** Small highlighted line under the meta, e.g. add-ons or items. */
  note?: string;
  /** Extras shown in the details sheet. */
  addOns?: { name: string; qty: number }[];
  /** Plans and packs: how much is used. */
  usage?: { left: number; total: number; label: string };
  when: { icon: 'calendar' | 'truck' | 'receipt' | 'pickup'; title: string; sub: string };
  /** The second line is a note (refund, receipt…) rather than a place, so it gets no location pin. */
  subIsNote?: boolean;
  /** Something went wrong — shown in red under the date box. */
  alert?: string;
  placed: string;
  amount: number;
  amountDue?: boolean;
  /** Bookings made in the app: the full service address. */
  address?: string;
  /** Booked for someone else. */
  bookedFor?: { name: string; phone: string };
  /** Who the partner calls for this booking. */
  contact?: { name: string; phone: string; role: string };
  action: string;
  /** Primary (dark) for tracking and paying; quiet outline for viewing and reordering. */
  primary: boolean;
  history: boolean;
};

const IMG = {
  interior: require('../../assets/home/wash-man.png'),
  kit: require('../../assets/rewards/prize-carekit.png'),
  dashcam: require('../../assets/home/acc-product2b.png'),
  denting: require('../../assets/home/denting.png'),
  ac: require('../../assets/home/ac-service.png'),
  spray: require('../../assets/home/acc-product2.png'),
};

export const SAMPLE_BOOKINGS: BookingItem[] = [
  // ——— Washes ———
  {
    id: 'w1',
    vertical: 'washes',
    ref: '#HW-28491',
    status: 'Ongoing',
    tone: 'progress',
    eyebrow: 'Three-time wash',
    title: 'Ceramic Maintenance Wash',
    meta: 'Honda WR-V · MH 31 AX 4021',
    note: '3 add-ons included',
    addOns: [
      { name: 'Liquid Wax Polish', qty: 1 },
      { name: 'Microfiber Towel', qty: 2 },
      { name: 'Tyre Shine', qty: 1 },
    ],
    when: { icon: 'calendar', title: 'Today, 11 Oct · 11:15 AM', sub: 'Home, Nagpur' },
    placed: 'Booked 08 Oct · 8:15 AM',
    amount: 1249,
    action: 'Track service',
    primary: true,
    history: false,
  },
  {
    id: 'w2',
    vertical: 'washes',
    ref: '#HW-28472',
    status: 'On the way',
    tone: 'transit',
    eyebrow: 'One-time wash',
    title: 'Exterior Foam Wash',
    meta: 'Honda City · MH 31 CX 1234',
    note: '1 add-on included',
    addOns: [{ name: 'Tyre Polish', qty: 1 }],
    when: { icon: 'calendar', title: 'Today, 11 Oct · 2:30 PM', sub: 'Home, Nagpur' },
    placed: 'Booked 08 Oct · 10:00 AM',
    amount: 534,
    action: 'Track service',
    primary: true,
    history: false,
  },
  {
    id: 'w3',
    vertical: 'washes',
    ref: '#HW-28450',
    status: 'Assigned',
    tone: 'pending',
    eyebrow: 'Two-time wash',
    title: 'Interior Deep Cleaning',
    meta: 'Honda Elevate · MH 12 DK 9220',
    image: IMG.interior,
    when: { icon: 'calendar', title: 'Tue, 13 Oct · 10:00 AM', sub: 'Work, Pune' },
    placed: 'Booked 07 Oct · 9:30 AM',
    amount: 899,
    action: 'Track service',
    primary: true,
    history: false,
  },
  {
    id: 'w4',
    vertical: 'washes',
    ref: '#HW-28511',
    status: 'Placed',
    tone: 'pending',
    eyebrow: 'One-time wash',
    title: 'Exterior Pressure Wash',
    meta: 'TVS Jupiter · MH 31 FZ 7781',
    when: { icon: 'calendar', title: 'Mon, 12 Oct · 9:00 AM', sub: 'Home, Nagpur' },
    placed: 'Booked 09 Oct · 7:25 AM',
    amount: 449,
    action: 'View details',
    primary: false,
    history: false,
  },
  {
    id: 'w5',
    vertical: 'washes',
    ref: '#HW-28502',
    status: 'On the way',
    tone: 'transit',
    eyebrow: 'One-time wash',
    title: 'Exterior Premium Wash',
    meta: 'Honda Jazz · MH 31 BJ 2210',
    when: { icon: 'calendar', title: 'Today, 11 Oct · 8:00 AM', sub: 'Home, Nagpur' },
    alert: 'Arrival delayed · Get assistance',
    placed: 'Booked 08 Oct · 7:40 PM',
    amount: 599,
    action: 'Track service',
    primary: true,
    history: false,
  },
  {
    id: 'w6',
    vertical: 'washes',
    ref: '#HW-27930',
    status: 'Completed',
    tone: 'done',
    eyebrow: 'One-time wash',
    title: 'Exterior Foam Wash',
    meta: 'Honda City · MH 31 CX 1234',
    when: { icon: 'receipt', title: 'Fri, 2 Oct · 10:40 AM', sub: 'Home, Nagpur' },
    placed: 'Booked 01 Oct · 6:10 PM',
    amount: 499,
    action: 'Book again',
    primary: false,
    history: true,
  },
  {
    id: 'w7',
    vertical: 'washes',
    ref: '#HW-27712',
    status: 'Cancelled',
    tone: 'closed',
    eyebrow: 'One-time wash',
    title: 'Interior Vacuum Cleaning',
    meta: 'Honda Jazz · MH 31 BJ 2210',
    image: IMG.interior,
    when: { icon: 'receipt', title: 'Sat, 26 Sep · 9:00 AM', sub: 'Refund of ₹399 sent to source' },
    subIsNote: true,
    placed: 'Booked 25 Sep · 9:00 PM',
    amount: 399,
    action: 'Book again',
    primary: false,
    history: true,
  },

  // ——— Society Pack ———
  {
    id: 's1',
    vertical: 'society',
    ref: '#SP-10384',
    status: 'Active',
    tone: 'active',
    eyebrow: 'Quarterly package',
    title: 'Quarterly Premium Wash',
    meta: 'Audi A3 · MH 31 AA 1111',
    usage: { left: 7, total: 12, label: 'washes remaining' },
    when: { icon: 'calendar', title: 'Next wash: Mon, 12 Oct · 7:30 AM', sub: 'Vision Workspace, Nagpur' },
    placed: 'Purchased 08 Oct · 10:00 AM',
    amount: 1489,
    action: 'Track services',
    primary: true,
    history: false,
  },
  {
    id: 's2',
    vertical: 'society',
    ref: '#SP-10365',
    status: 'Active',
    tone: 'active',
    eyebrow: 'Monthly package',
    title: 'Premium Society Wash',
    meta: 'Honda City · MH 31 CX 1234',
    usage: { left: 3, total: 4, label: 'washes remaining' },
    when: { icon: 'calendar', title: 'Next wash: Tue, 13 Oct · 8:00 AM', sub: 'Heritage Society, Pune' },
    placed: 'Purchased 28 Sep · 10:00 AM',
    amount: 969,
    action: 'View plan',
    primary: false,
    history: false,
  },
  {
    id: 's3',
    vertical: 'society',
    ref: '#SP-09520',
    status: 'Expired',
    tone: 'closed',
    eyebrow: 'Monthly package',
    title: 'Essential Society Wash',
    meta: 'Audi A3 · MH 31 AA 1111',
    usage: { left: 0, total: 4, label: 'washes remaining' },
    when: { icon: 'receipt', title: 'Ended Wed, 30 Sep', sub: 'Vision Workspace, Nagpur' },
    placed: 'Purchased 01 Sep · 8:00 AM',
    amount: 849,
    action: 'Renew plan',
    primary: true,
    history: true,
  },

  // ——— Products ———
  {
    id: 'p1',
    vertical: 'products',
    ref: '#45012',
    status: 'Placed',
    tone: 'pending',
    eyebrow: 'Car care essentials',
    title: 'Waterless Wash Spray',
    meta: '1 item · 500 ml',
    image: IMG.spray,
    when: { icon: 'truck', title: 'Arriving by Mon, 12 Oct', sub: 'Home, Nagpur' },
    placed: 'Ordered 08 Oct · 10:00 AM',
    amount: 299,
    action: 'Track order',
    primary: true,
    history: false,
  },
  {
    id: 'p2',
    vertical: 'products',
    ref: '#44920',
    status: 'Shipped',
    tone: 'transit',
    eyebrow: 'Cleaning accessories',
    title: 'Premium Microfiber Set',
    meta: '1 set · 4 cloths',
    image: IMG.kit,
    when: { icon: 'truck', title: 'Arriving by Tue, 13 Oct', sub: 'Home, Nagpur' },
    placed: 'Ordered 05 Oct · 11:30 AM',
    amount: 499,
    action: 'Track order',
    primary: true,
    history: false,
  },
  {
    id: 'p3',
    vertical: 'products',
    ref: '#44815',
    status: 'Out for delivery',
    tone: 'transit',
    eyebrow: 'Car care combo',
    title: 'Detailing Essentials Kit',
    meta: '3 items · Spray, duster & freshener',
    image: IMG.kit,
    when: { icon: 'truck', title: 'Arriving today, 11 Oct', sub: 'Office, Mumbai' },
    placed: 'Ordered 03 Oct · 9:15 AM',
    amount: 1850,
    action: 'Track order',
    primary: true,
    history: false,
  },
  {
    id: 'p4',
    vertical: 'products',
    ref: '#33831',
    status: 'Delivered',
    tone: 'done',
    eyebrow: 'Shine & care',
    title: 'Dashboard Polish + Tyre Gel',
    meta: '2 items',
    when: { icon: 'receipt', title: 'Mon, 14 Sep · 4:45 PM', sub: 'Khamla Road, Nagpur' },
    placed: 'Ordered 12 Sep · 3:10 PM',
    amount: 850,
    action: 'Reorder',
    primary: false,
    history: true,
  },

  // ——— Bundles ———
  {
    id: 'b1',
    vertical: 'bundles',
    ref: '#BL-12888',
    status: 'Active',
    tone: 'active',
    eyebrow: 'Prepaid wash pack',
    title: 'Starter Pack · 4 Washes',
    meta: 'Applicable on any sedan',
    usage: { left: 2, total: 4, label: 'washes remaining' },
    when: { icon: 'calendar', title: 'Valid until Sat, 24 Oct', sub: 'Any sedan, any Hoora location' },
    subIsNote: true,
    placed: 'Purchased 24 Sep · 6:40 PM',
    amount: 1199,
    action: 'Schedule wash',
    primary: true,
    history: false,
  },
  {
    id: 'b2',
    vertical: 'bundles',
    ref: '#BL-12931',
    status: 'In use',
    tone: 'active',
    eyebrow: 'Monthly package',
    title: 'Monthly Unlimited Wash',
    meta: 'Honda City · MH 31 CX 1234',
    note: '1 wash already scheduled',
    when: { icon: 'calendar', title: 'Next wash: Mon, 12 Oct · 8:30 AM', sub: 'Valid until 10 Nov, 2026' },
    placed: 'Purchased 01 Oct · 10:00 AM',
    amount: 2499,
    action: 'Track booking',
    primary: true,
    history: false,
  },
  {
    id: 'b3',
    vertical: 'bundles',
    ref: '#BL-11074',
    status: 'Expired',
    tone: 'closed',
    eyebrow: 'Quarterly package',
    title: 'Quarterly Basic Wash',
    meta: 'Applicable on any hatchback',
    usage: { left: 0, total: 6, label: 'washes remaining' },
    when: { icon: 'receipt', title: 'Ended Thu, 10 Sep', sub: 'Any hatchback' },
    subIsNote: true,
    placed: 'Purchased 10 Jun · 9:45 AM',
    amount: 999,
    action: 'Renew pack',
    primary: true,
    history: true,
  },

  // ——— Challans ———
  {
    id: 'c1',
    vertical: 'challans',
    ref: '#CH-12046',
    status: 'Payment pending',
    tone: 'attention',
    eyebrow: 'E-challan',
    title: '2 Pending Challans',
    meta: 'MH 31 CX 1234',
    when: { icon: 'receipt', title: 'Pay by Thu, 15 Oct', sub: 'Review challans before paying' },
    subIsNote: true,
    placed: 'Checked 08 Oct · 10:00 AM',
    amount: 2000,
    amountDue: true,
    action: 'Review & pay',
    primary: true,
    history: false,
  },
  {
    id: 'c2',
    vertical: 'challans',
    ref: '#CH-12045',
    status: 'Processing',
    tone: 'progress',
    eyebrow: 'E-challan payment',
    title: '2 Challans',
    meta: 'MH 31 CX 1234',
    when: { icon: 'receipt', title: 'Updated Thu, 8 Oct · 2:30 PM', sub: '1 of 2 challans cleared' },
    subIsNote: true,
    placed: 'Paid 07 Oct · 10:30 AM',
    amount: 1500,
    action: 'Track payment',
    primary: true,
    history: false,
  },
  {
    id: 'c3',
    vertical: 'challans',
    ref: '#CH-11425',
    status: 'Cleared',
    tone: 'done',
    eyebrow: 'E-challan payment',
    title: 'Traffic Challan Payment',
    meta: 'MH 31 AB 9999 · 1 challan',
    when: { icon: 'receipt', title: 'Sat, 15 Aug · 4:15 PM', sub: 'Receipt is available' },
    subIsNote: true,
    placed: 'Paid 15 Aug · 4:15 PM',
    amount: 500,
    action: 'View receipt',
    primary: false,
    history: true,
  },

  // ——— Garage ———
  {
    id: 'g1',
    vertical: 'garage',
    ref: '#GR-20216',
    status: 'In progress',
    tone: 'progress',
    eyebrow: 'Mechanical service',
    title: 'AC Inspection & Service',
    meta: 'Audi A3 · MH 31 AA 1111',
    image: IMG.ac,
    when: { icon: 'calendar', title: 'Started Fri, 9 Oct · 10:00 AM', sub: 'Vision Workspace, Nagpur' },
    placed: 'Booked 07 Oct · 2:00 PM',
    amount: 1299,
    action: 'Track service',
    primary: true,
    history: false,
  },
  {
    id: 'g2',
    vertical: 'garage',
    ref: '#GR-20211',
    status: 'Scheduled',
    tone: 'pending',
    eyebrow: 'Body repair',
    title: 'Rear Bumper Repainting',
    meta: 'Audi A3 · MH 31 AA 1111',
    image: IMG.denting,
    note: 'Pickup included',
    when: { icon: 'pickup', title: 'Pickup Mon, 12 Oct · 10:00 AM', sub: 'Vision Workspace, Nagpur' },
    placed: 'Booked 08 Oct · 4:00 PM',
    amount: 2499,
    action: 'Track service',
    primary: true,
    history: false,
  },
  {
    id: 'g3',
    vertical: 'garage',
    ref: '#GR-19130',
    status: 'Completed',
    tone: 'done',
    eyebrow: 'Periodic maintenance',
    title: 'Engine Oil & Filter Service',
    meta: 'Honda City · MH 31 CX 1234',
    when: { icon: 'receipt', title: 'Mon, 21 Sep · 5:20 PM', sub: 'Invoice available' },
    subIsNote: true,
    placed: 'Booked 20 Sep · 11:40 AM',
    amount: 3299,
    action: 'View invoice',
    primary: false,
    history: true,
  },

  // ——— Connect QR ———
  {
    id: 'q1',
    vertical: 'qr',
    ref: '#B3EE9938',
    status: 'Shipped',
    tone: 'transit',
    eyebrow: 'Connect QR tag',
    title: 'Small ConnectQR Tag',
    meta: '1 tag · Standard size',
    when: { icon: 'truck', title: 'Arriving by Mon, 12 Oct', sub: 'Khamla Road, Nagpur' },
    placed: 'Ordered 05 Oct · 11:30 AM',
    amount: 49,
    action: 'Track order',
    primary: true,
    history: false,
  },
  {
    id: 'q2',
    vertical: 'qr',
    ref: '#B3EE9937',
    status: 'On hold',
    tone: 'attention',
    eyebrow: 'Connect QR tag',
    title: 'Small ConnectQR Tag',
    meta: '1 tag · Standard size',
    when: { icon: 'truck', title: 'Arriving by Tue, 13 Oct', sub: 'Khamla Road, Nagpur' },
    alert: 'Contact support for the latest update',
    placed: 'Ordered 03 Oct · 9:15 AM',
    amount: 49,
    action: 'View order',
    primary: false,
    history: false,
  },
  {
    id: 'q3',
    vertical: 'qr',
    ref: '#B3EE9936',
    status: 'Delivered',
    tone: 'done',
    eyebrow: 'Connect QR tag',
    title: 'Small ConnectQR Tag',
    meta: '1 tag · Standard size',
    when: { icon: 'receipt', title: 'Mon, 14 Sep · 4:45 PM', sub: 'Khamla Road, Nagpur' },
    placed: 'Ordered 10 Sep · 1:15 PM',
    amount: 49,
    action: 'Reorder',
    primary: false,
    history: true,
  },
];

export type JourneyStep = { title: string; sub: string };

/**
 * The steps each kind of booking goes through (wording from the "My Bookings — refined"
 * reference). Plans and packs have no journey; their sheet shows a package overview instead.
 */
export function journeyFor(item: BookingItem): { title: string; steps: JourneyStep[] } | undefined {
  switch (item.vertical) {
    case 'washes':
      return {
        title: 'Service journey',
        steps: [
          { title: 'Placed', sub: 'Booking received and confirmed' },
          {
            title: 'Assigned',
            sub:
              item.status === 'On the way'
                ? 'Your professional is travelling to you'
                : 'A professional has been allocated',
          },
          { title: 'Service', sub: 'Vehicle cleaning has started' },
          { title: 'Completed', sub: 'Your service has finished' },
        ],
      };
    case 'garage':
      return {
        title: 'Service journey',
        steps: [
          { title: 'Placed', sub: 'Garage request received' },
          { title: 'Pickup', sub: 'Vehicle pickup has been arranged' },
          { title: 'Service', sub: 'Work is being carried out' },
          { title: 'Completed', sub: 'Service work is finished' },
        ],
      };
    case 'products':
      return {
        title: 'Delivery journey',
        steps: [
          { title: 'Placed', sub: 'Your order is confirmed' },
          { title: 'Shipped', sub: 'Handed over for delivery' },
          { title: 'Out for delivery', sub: 'At the final delivery stage' },
          { title: 'Delivered', sub: 'Order delivered successfully' },
        ],
      };
    case 'qr':
      return {
        title: 'Delivery journey',
        steps: [
          { title: 'Processed', sub: 'Warehouse prepared your tag' },
          { title: 'Shipped', sub: 'Handed over for delivery' },
          { title: 'Delivered', sub: 'Physical tag delivered' },
        ],
      };
    case 'challans':
      return {
        title: 'Payment journey',
        steps: [
          { title: 'Identified', sub: 'Challan details linked to your vehicle' },
          { title: 'Payment', sub: 'Payment being processed' },
          { title: 'Cleared', sub: 'Final settlement confirmed' },
        ],
      };
    default:
      return undefined;
  }
}

// Which step is in progress for each status (steps before it are done). Finished bookings point
// past the last step so every step shows as done.
const STEP_BY_STATUS: Record<string, number> = {
  Placed: 0,
  Assigned: 1,
  'On the way': 1,
  'Service started': 2,
  Ongoing: 2,
  Scheduled: 0,
  'In progress': 2,
  Completed: 9,
  Processed: 0,
  Shipped: 1,
  'On hold': 1,
  'Out for delivery': 2,
  Delivered: 9,
  'Payment pending': 0,
  Processing: 1,
  Cleared: 9,
  Cancelled: 0,
};

export const journeyStep = (item: BookingItem) => STEP_BY_STATUS[item.status] ?? 0;
