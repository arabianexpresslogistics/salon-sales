import { SalonServiceItem } from '@/types/salon';

export const SALON_SERVICES: SalonServiceItem[] = [
  // Hair
  { id: 'hair_cut', name: 'Signature Haircut & Style', category: 'Hair', price: 350, durationMin: 30, popular: true },
  { id: 'hair_fade', name: 'Skin Fade / Taper Fade Cut', category: 'Hair', price: 450, durationMin: 40, popular: true },
  { id: 'hair_kids', name: 'Junior Haircut (Under 12)', category: 'Hair', price: 250, durationMin: 25 },
  { id: 'hair_wash', name: 'Deep Clean Hair Wash & Blowdry', category: 'Hair', price: 200, durationMin: 15 },
  
  // Beard
  { id: 'beard_trim', name: 'Beard Sculpting & Line-up', category: 'Beard', price: 250, durationMin: 20, popular: true },
  { id: 'beard_shave', name: 'Royal Hot Towel Shave', category: 'Beard', price: 350, durationMin: 30, popular: true },
  { id: 'beard_spa', name: 'Beard Oil Spa & Hydration', category: 'Beard', price: 400, durationMin: 25 },
  { id: 'beard_color', name: 'Natural Beard Color / Camo', category: 'Beard', price: 300, durationMin: 20 },

  // Facial & Spa
  { id: 'spa_detan', name: 'Charcoal De-Tan & Face Scrub', category: 'Spa & Facial', price: 500, durationMin: 30, popular: true },
  { id: 'spa_facial', name: 'Hydra Glow Executive Facial', category: 'Spa & Facial', price: 1200, durationMin: 45 },
  { id: 'spa_massage', name: 'Ayurvedic Head & Shoulder Massage (20m)', category: 'Spa & Facial', price: 400, durationMin: 20 },
  { id: 'spa_hair', name: 'Anti-Dandruff / Keratin Hair Spa', category: 'Spa & Facial', price: 900, durationMin: 45 },

  // Color & Texture
  { id: 'color_hair', name: 'Full Hair Color (Ammonia Free)', category: 'Color & Texture', price: 800, durationMin: 40 },
  { id: 'hair_straight', name: 'Hair Smoothening / Straightening', category: 'Color & Texture', price: 2500, durationMin: 90 },

  // Packages
  { id: 'pkg_groom', name: 'Executive Groom Package (Cut + Beard + DeTan + Wash)', category: 'Package', price: 1400, durationMin: 75, popular: true },
  { id: 'pkg_vip', name: 'Royal VIP Experience (Cut + Shave + Facial + Hair Spa)', category: 'Package', price: 2500, durationMin: 105 }
];

export const DEFAULT_EMPLOYEES = [
  { name: 'Sameer Khan', phone: '+91 98765 43210', role: 'Master Barber' },
  { name: 'Arjun Das', phone: '+91 98765 43211', role: 'Senior Hair Stylist' },
  { name: 'Rohan Sharma', phone: '+91 98765 43212', role: 'Beard Specialist' },
  { name: 'Fahad Ali', phone: '+91 98765 43213', role: 'Skin & Spa Therapist' }
];

export const PAYMENT_METHODS = [
  'UPI / GPay',
  'Cash',
  'Credit/Debit Card',
  'Salon Pass',
  'Other'
];

export const CUSTOMER_CATEGORIES = [
  'Regular Men',
  'VIP Member',
  'First-Time Visitor',
  'Groom / Special Occasion',
  'Kids'
];
