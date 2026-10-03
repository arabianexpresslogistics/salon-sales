// Salon Data Types

export interface VisitData {
  "Bill No"?: string;
  "Date": string; // YYYY-MM-DD
  "Time"?: string; // e.g. 10:30 AM
  "Customer Name": string;
  "Phone Number"?: string;
  "Gender / Category"?: string; // Men, Kids, VIP, Groom
  "Service"?: string;
  "Services"?: string; // Comma separated or string
  "Stylist / Barber"?: string;
  "Employee Name"?: string;
  "Payment Method"?: "KNet" | "Cash" | "Credit/Debit Card" | "Apple Pay" | "Salon Pass" | "Other" | string;
  "Amount"?: number;
  "Total Amount (KD)"?: number;
  "Discount (KD)"?: number;
  "Final Amount (KD)"?: number;
  "Notes / Preference"?: string;
  "Note"?: string;
  "Created By"?: string;
  "Status"?: "Completed" | "In-Service" | "Booked";
  "Timestamp"?: string;
  [key: string]: any;
}

export interface EmployeeData {
  "Employee Name": string;
  "Username"?: string;
  "Password"?: string;
  "Role": string;
  "Phone Number": string;
  "Joining Date": string;
  "Status": "Active" | "Inactive";
  name?: string;
  username?: string;
  password?: string;
  phone?: string;
  role?: string;
  joiningDate?: string;
  [key: string]: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  token?: string;
  role?: string;
  username?: string;
  name?: string;
  phone?: string;
  visits?: VisitData[];
  employees?: EmployeeData[];
  billNo?: string;
  message?: string;
  error?: string;
}

export interface SalonServiceItem {
  id: string;
  name: string;
  category: 
    | 'Hair & Beard' 
    | 'Colouring' 
    | 'Face & Skin Care' 
    | 'Hair Care' 
    | 'Hair Treatment' 
    | 'Hair Styling' 
    | 'Hand & Foot Care' 
    | 'Waxing'
    | 'Package'
    | 'Other';
  price: number; // in KD
  durationMin: number;
  popular?: boolean;
}

export interface UserSession {
  token: string;
  username: string;
  name: string;
  role: string;
  phone?: string;
}


