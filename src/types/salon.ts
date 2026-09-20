// Salon Data Types

export interface VisitData {
  "Bill No": string;
  "Date": string; // YYYY-MM-DD
  "Time": string; // e.g. 10:30 AM
  "Customer Name": string;
  "Phone Number": string;
  "Gender / Category": string; // Men, Kids, VIP, Groom
  "Services": string; // Comma separated or string
  "Stylist / Barber": string;
  "Payment Method": "Cash" | "UPI / GPay" | "Credit/Debit Card" | "Salon Pass" | "Other";
  "Total Amount (₹)": number;
  "Discount (₹)": number;
  "Final Amount (₹)": number;
  "Notes / Preference"?: string;
  "Status": "Completed" | "In-Service" | "Booked";
  "Timestamp"?: string;
  [key: string]: any;
}

export interface EmployeeData {
  "Employee Name": string;
  "Phone Number": string;
  "Role": string;
  "Joining Date": string;
  "Status": "Active" | "Inactive";
  [key: string]: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  token?: string;
  role?: string;
  username?: string;
  visits?: VisitData[];
  employees?: EmployeeData[];
  billNo?: string;
  message?: string;
  error?: string;
}

export interface SalonServiceItem {
  id: string;
  name: string;
  category: 'Hair' | 'Beard' | 'Spa & Facial' | 'Package' | 'Color & Texture';
  price: number;
  durationMin: number;
  popular?: boolean;
}

export interface UserSession {
  token: string;
  username: string;
  role: string;
}
