import { SalonServiceItem } from '@/types/salon';

export const SALON_INFO = {
  name: 'Beard Lounge',
  tagline: "A Touch of Luxury in Every Style.",
  motto: 'YOUR LOOK. YOUR STYLE. YOUR LOUNGE.',
  subtitle: "Premium Men's Salon",
  address: 'Farwaniya Block 1, Mobile 2000 Building, M1 Floor',
  country: 'Kuwait',
  currency: 'KD',
  currencySymbol: 'KD',
};

export const SALON_SERVICES: SalonServiceItem[] = [
  // HAIR & BEARD
  { id: 'hair_cut', name: 'Hair Cut', category: 'Hair & Beard', price: 1, durationMin: 30, popular: true },
  { id: 'trimming', name: 'Trimming', category: 'Hair & Beard', price: 1, durationMin: 20, popular: true },
  { id: 'shaving', name: 'Shaving', category: 'Hair & Beard', price: 1, durationMin: 25, popular: true },
  { id: 'baby_hair_cut', name: 'Baby Hair Cut', category: 'Hair & Beard', price: 2, durationMin: 25 },

  // COLOURING
  { id: 'hair_bleach', name: 'Hair Bleach', category: 'Colouring', price: 3, durationMin: 35 },
  { id: 'hair_coloring_strip', name: 'Hair Coloring Strip', category: 'Colouring', price: 1, durationMin: 20 },
  { id: 'hair_coloring', name: 'Hair Coloring', category: 'Colouring', price: 5, durationMin: 45, popular: true },
  { id: 'hair_dye', name: 'Hair Dye', category: 'Colouring', price: 1, durationMin: 25 },
  { id: 'beard_dye', name: 'Beard Dye', category: 'Colouring', price: 1, durationMin: 20, popular: true },
  { id: 'perm_bold_style', name: 'Permanent Bold Style', category: 'Colouring', price: 12, durationMin: 60 },

  // FACE & SKIN CARE
  { id: 'face_cleaning', name: 'Face Cleaning', category: 'Face & Skin Care', price: 1, durationMin: 20, popular: true },
  { id: 'normal_facial', name: 'Normal Facial', category: 'Face & Skin Care', price: 3, durationMin: 30 },
  { id: 'papaya_facial', name: 'Papaya Facial', category: 'Face & Skin Care', price: 5, durationMin: 40 },
  { id: 'gold_facial', name: 'Gold Facial', category: 'Face & Skin Care', price: 6, durationMin: 45, popular: true },
  { id: 'diamond_facial', name: 'Diamond Facial', category: 'Face & Skin Care', price: 8, durationMin: 50 },
  { id: 'face_bleach', name: 'Face Bleach', category: 'Face & Skin Care', price: 1.5, durationMin: 25 },
  { id: 'face_bleach_cleanse', name: 'Face Bleach & Cleanse', category: 'Face & Skin Care', price: 2, durationMin: 30 },
  { id: 'face_massage', name: 'Face Massage', category: 'Face & Skin Care', price: 2, durationMin: 20 },
  { id: 'neck_bleach', name: 'Neck Bleach', category: 'Face & Skin Care', price: 2, durationMin: 20 },
  { id: 'detan', name: 'Detan', category: 'Face & Skin Care', price: 3, durationMin: 30, popular: true },

  // HAIR CARE
  { id: 'oil_head_massage', name: 'Oil Head Massage', category: 'Hair Care', price: 1, durationMin: 20, popular: true },
  { id: 'normal_hair_spa', name: 'Normal Hair Spa', category: 'Hair Care', price: 5, durationMin: 40 },
  { id: 'dandruff_hair_spa', name: 'Dandruff Hair Spa', category: 'Hair Care', price: 10, durationMin: 45 },
  { id: 'hair_smoothing', name: 'Hair Smoothing', category: 'Hair Care', price: 10, durationMin: 60 },

  // HAIR TREATMENT
  { id: 'hair_keratin', name: 'Hair Keratin', category: 'Hair Treatment', price: 20, durationMin: 90, popular: true },
  { id: 'hair_nanoplastia', name: 'Hair Nanoplastia', category: 'Hair Treatment', price: 25, durationMin: 120 },
  { id: 'hair_straightening', name: 'Hair Straightening', category: 'Hair Treatment', price: 7, durationMin: 60 },

  // HAIR STYLING
  { id: 'hair_washing', name: 'Hair Washing', category: 'Hair Styling', price: 3, durationMin: 15 },
  { id: 'hair_styling', name: 'Hair Styling', category: 'Hair Styling', price: 3, durationMin: 20 },
  { id: 'hair_filling', name: 'Hair Filling', category: 'Hair Styling', price: 3, durationMin: 25 },

  // HAND & FOOT CARE
  { id: 'basic_pedicure', name: 'Basic Pedicure', category: 'Hand & Foot Care', price: 5, durationMin: 35 },
  { id: 'premium_pedicure', name: 'Premium Pedicure', category: 'Hand & Foot Care', price: 8, durationMin: 50, popular: true },
  { id: 'manicure_bleach', name: 'Manicure & Bleach', category: 'Hand & Foot Care', price: 4, durationMin: 40 },

  // WAXING
  { id: 'nose_ear_waxing', name: 'Nose & Ear Waxing', category: 'Waxing', price: 3, durationMin: 15, popular: true },
];

export const SERVICE_CATEGORIES = [
  'All',
  'Hair & Beard',
  'Colouring',
  'Face & Skin Care',
  'Hair Care',
  'Hair Treatment',
  'Hair Styling',
  'Hand & Foot Care',
  'Waxing'
] as const;

export const DEFAULT_EMPLOYEES: Array<{ name: string; phone?: string; role?: string }> = [];

export const PAYMENT_METHODS = [
  'KNet',
  'Cash',
  'Credit/Debit Card',
  'Apple Pay',
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

