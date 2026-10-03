'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getStoredUser, 
  logout, 
  addVisit, 
  fetchVisits, 
  addEmployee, 
  deleteEmployee,
  fetchEmployees,
  getSpreadsheetUrl 
} from '@/lib/salonApi';
import { 
  SALON_INFO, 
  SALON_SERVICES, 
  SERVICE_CATEGORIES, 
  PAYMENT_METHODS, 
  CUSTOMER_CATEGORIES,
  DEFAULT_EMPLOYEES 
} from '@/lib/constants';
import { SalonServiceItem, VisitData, EmployeeData } from '@/types/salon';
import { 
  Scissors, 
  Plus, 
  Search, 
  RefreshCw, 
  Download, 
  Printer, 
  X, 
  ExternalLink,
  Check,
  Shield,
  UserCheck,
  Trash2
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');

  // Active Tab: 'pos' | 'my-entries' | 'all-entries' | 'pricelist' | 'staff'
  const [activeTab, setActiveTab] = useState<'pos' | 'my-entries' | 'all-entries' | 'pricelist' | 'staff'>('pos');

  const getTodayDate = () => new Date().toISOString().substring(0, 10);
  const getCurrentTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  const generateBillNo = () => {
    return `BL-${Math.floor(1000 + Math.random() * 9000)}`;
  };

  // POS Form States
  const [billNo, setBillNo] = useState(generateBillNo());
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState(CUSTOMER_CATEGORIES[0]);
  const [date, setDate] = useState(getTodayDate());
  const [time, setTime] = useState(getCurrentTime());
  const [selectedServices, setSelectedServices] = useState<SalonServiceItem[]>([SALON_SERVICES[0]]);
  const [stylist, setStylist] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Custom Item
  const [showCustomItem, setShowCustomItem] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  // Staff Account Form (Admin)
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Master Barber');

  // Async States & Data
  const [submitting, setSubmitting] = useState(false);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [allVisits, setAllVisits] = useState<any[]>([]);
  const [employeeList, setEmployeeList] = useState<any[]>(DEFAULT_EMPLOYEES);

  // Modals (Receipt & Delete Staff)
  const [receiptData, setReceiptData] = useState<any | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<any | null>(null);

  // Filters & Sorters (Day, Week, Month, All Time)
  const [adminDateFilter, setAdminDateFilter] = useState<'day' | 'week' | 'month' | 'all'>('day');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [salesSearch, setSalesSearch] = useState('');
  const [myEntriesDateFilter, setMyEntriesDateFilter] = useState<'day' | 'week' | 'month' | 'all'>('day');
  const [myEntriesSearch, setMyEntriesSearch] = useState('');

  const isAdmin = currentUser?.role === 'Admin';

  const formatKD = (amount: number | string) => {
    const val = Number(amount) || 0;
    return `${val % 1 !== 0 ? val.toFixed(1) : val} KD`;
  };

  const getEntryCustomer = (v: any) => v['Customer Name'] || v['customerName'] || v['Customer'] || (Object.values(v)[1] as string) || 'Guest';
  const getEntryService = (v: any) => v['Service'] || v['Services'] || v['service'] || (Object.values(v)[2] as string) || '-';
  const getEntryStaff = (v: any) => v['Employee Name'] || v['Stylist / Barber'] || v['employeeName'] || (Object.values(v)[3] as string) || '-';
  const getEntryAmount = (v: any) => {
    const a = v['Amount'] ?? v['Final Amount (KD)'] ?? v['Final Amount (₹)'] ?? v['amount'] ?? Object.values(v)[4];
    return Number(a) || 0;
  };
  const getEntryPayment = (v: any) => v['Payment Method'] || v['paymentMethod'] || Object.values(v)[5] || 'Cash';
  const getEntryDate = (v: any) => {
    const d = v['Date'] || v['date'] || Object.values(v)[0];
    if (!d) return '-';
    const str = String(d);
    if (str.includes('T')) return str.split('T')[0];
    return str;
  };

  useEffect(() => {
    const user = getStoredUser();
    if (!user || !user.token) {
      router.push('/login');
    } else {
      setCurrentUser(user);
      setStylist(user.role === 'Admin' ? (user.name || 'Admin') : user.name);
      setSpreadsheetUrl(getSpreadsheetUrl());
      loadData();
    }
  }, [router]);

  const loadData = async () => {
    setLoadingVisits(true);
    try {
      const [visitsRes, empRes] = await Promise.all([
        fetchVisits(),
        fetchEmployees(),
      ]);

      if (visitsRes?.visits && Array.isArray(visitsRes.visits)) {
        const clean = visitsRes.visits.filter((v: any) => {
          const c = String(v['Customer Name'] || '').toLowerCase();
          return c !== 'customer name' && c !== 'customer';
        });
        setAllVisits(clean);
      }

      if (empRes?.employees && Array.isArray(empRes.employees) && empRes.employees.length > 0) {
        setEmployeeList(empRes.employees);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingVisits(false);
    }
  };

  const toggleService = (s: SalonServiceItem) => {
    if (selectedServices.some(item => item.id === s.id)) {
      setSelectedServices(selectedServices.filter(item => item.id !== s.id));
    } else {
      setSelectedServices([...selectedServices, s]);
    }
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customPrice) return;
    const priceNum = parseFloat(customPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;

    const item: SalonServiceItem = {
      id: `custom_${Date.now()}`,
      name: customName.trim(),
      category: 'Other',
      price: priceNum,
      durationMin: 30,
    };

    setSelectedServices([...selectedServices, item]);
    setCustomName('');
    setCustomPrice('');
    setShowCustomItem(false);
  };

  const subtotalKD = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const finalAmountKD = Math.max(0, subtotalKD - discount);

  const handleSubmitVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter customer name' });
      return;
    }
    if (selectedServices.length === 0) {
      setStatusMsg({ type: 'error', text: 'Please select at least one service' });
      return;
    }

    setSubmitting(true);
    setStatusMsg(null);

    const barberName = stylist || currentUser?.name || currentUser?.username || 'Staff';
    const servicesText = selectedServices.map(s => s.name).join(', ');

    const payload: VisitData = {
      "Bill No": billNo,
      "Date": date,
      "Time": time,
      "Customer Name": customerName.trim(),
      "Phone Number": phone.trim(),
      "Gender / Category": category,
      "Service": servicesText,
      "Services": servicesText,
      "Employee Name": barberName,
      "Stylist / Barber": barberName,
      "Created By": currentUser?.username || barberName,
      "Payment Method": paymentMethod,
      "Amount": finalAmountKD,
      "Total Amount (KD)": subtotalKD,
      "Discount (KD)": discount,
      "Final Amount (KD)": finalAmountKD,
      "Note": notes.trim(),
      "Status": "Completed",
      "Timestamp": new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    try {
      const res = await addVisit(payload);
      if (res.success || res.message || res.billNo) {
        setStatusMsg({ 
          type: 'success', 
          text: `Saved to Google Sheets! Total: ${formatKD(finalAmountKD)} &bull; ${barberName}` 
        });
        setAllVisits((prev) => [...prev, payload]);

        setReceiptData({
          ...payload,
          items: selectedServices,
          subtotal: subtotalKD,
          discount: discount,
          finalAmount: finalAmountKD,
        });

        // Reset
        setBillNo(generateBillNo());
        setTime(getCurrentTime());
        setCustomerName('');
        setPhone('');
        setSelectedServices([SALON_SERVICES[0]]);
        setDiscount(0);
        setNotes('');
      } else {
        setStatusMsg({ type: 'error', text: res.error || 'Failed to save entry' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error connecting to Google Sheets' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddStaffAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffUsername.trim() || !newStaffPassword.trim()) {
      setStatusMsg({ type: 'error', text: 'Please provide full name, username, and password' });
      return;
    }

    setSubmitting(true);
    setStatusMsg(null);

    const empPayload: EmployeeData = {
      "Employee Name": newStaffName.trim(),
      "Username": newStaffUsername.trim().toLowerCase(),
      "Password": newStaffPassword.trim(),
      "Role": newStaffRole,
      "Phone Number": newStaffPhone.trim() || '+965',
      "Joining Date": date,
      "Status": "Active",
      name: newStaffName.trim(),
      username: newStaffUsername.trim().toLowerCase(),
      role: newStaffRole,
      phone: newStaffPhone.trim() || '+965'
    };

    try {
      const res = await addEmployee(empPayload);
      if (res.success || res.message) {
        setStatusMsg({ 
          type: 'success', 
          text: `Staff account "${newStaffName}" (username: ${newStaffUsername}) saved to spreadsheet!` 
        });
        setEmployeeList((prev) => [...prev, empPayload]);
        setNewStaffName('');
        setNewStaffUsername('');
        setNewStaffPassword('');
        setNewStaffPhone('');
        setActiveTab('staff');
      } else {
        setStatusMsg({ type: 'error', text: res.error || 'Failed to save staff' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error connecting to Google Sheets' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = (emp: any) => {
    const empUser = emp.username || '';
    if (empUser.toLowerCase() === 'admin' || emp.role === 'Admin') {
      setStatusMsg({ type: 'error', text: 'Cannot delete the primary Admin account.' });
      return;
    }
    setStaffToDelete(emp);
  };

  const confirmDeleteStaff = async () => {
    if (!staffToDelete) return;
    const empName = staffToDelete.name || staffToDelete['Employee Name'] || 'Staff';
    const empUser = staffToDelete.username || '';

    setSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await deleteEmployee(empUser, empName);
      if (res.success || res.message) {
        setStatusMsg({ 
          type: 'success', 
          text: `Staff account "${empName}" (@${empUser}) deleted from Google Sheets!` 
        });
        setEmployeeList(prev => prev.filter(e => {
          const u = (e.username || '').toLowerCase();
          const n = (e.name || e['Employee Name'] || '').toLowerCase();
          return u !== empUser.toLowerCase() && n !== empName.toLowerCase();
        }));
      } else {
        setStatusMsg({ type: 'error', text: res.error || 'Failed to delete staff account' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error connecting to Google Sheets' });
    } finally {
      setSubmitting(false);
      setStaffToDelete(null);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Date Filtering Helper (Day, Week, Month, All Time)
  const isDateInFilter = (dateVal: string, filter: 'day' | 'week' | 'month' | 'all') => {
    if (filter === 'all') return true;
    if (!dateVal || dateVal === '-') return false;
    const today = getTodayDate();
    if (filter === 'day') return dateVal === today;
    if (filter === 'month') return dateVal.startsWith(today.substring(0, 7));
    if (filter === 'week') {
      try {
        const d = new Date(dateVal + 'T00:00:00');
        const now = new Date(today + 'T00:00:00');
        if (isNaN(d.getTime())) return false;
        const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 3600 * 24));
        return diffDays >= 0 && diffDays <= 7;
      } catch (e) {
        return false;
      }
    }
    return true;
  };

  // Staff Performance Breakdown for Admin (Day, Week, Month, All)
  const staffPerformanceList = useMemo(() => {
    return employeeList.map((emp) => {
      const empName = emp.name || emp['Employee Name'] || '';
      const empUser = (emp.username || '').toLowerCase();
      
      const visitsInPeriod = allVisits.filter((v) => {
        if (!isDateInFilter(getEntryDate(v), adminDateFilter)) return false;
        const s = getEntryStaff(v).toLowerCase();
        const u = String(v['Created By'] || '').toLowerCase();
        return s.includes(empName.toLowerCase()) || (empUser && u === empUser);
      });

      const totalRevenue = visitsInPeriod.reduce((sum, v) => sum + getEntryAmount(v), 0);
      const clientCount = visitsInPeriod.length;

      // Extract services count and totals
      const serviceBreakdown: Record<string, { count: number; totalKD: number }> = {};
      visitsInPeriod.forEach((v) => {
        const sText = getEntryService(v);
        const parts = sText.split(',').map((p: string) => p.trim()).filter(Boolean);
        const visitAmt = getEntryAmount(v);
        const estPrice = parts.length > 0 ? visitAmt / parts.length : visitAmt;
        parts.forEach((srv: string) => {
          if (!serviceBreakdown[srv]) {
            serviceBreakdown[srv] = { count: 0, totalKD: 0 };
          }
          serviceBreakdown[srv].count += 1;
          serviceBreakdown[srv].totalKD += estPrice;
        });
      });

      return {
        name: empName,
        username: empUser,
        role: emp.role || emp['Role'] || 'Barber',
        phone: emp.phone || emp['Phone Number'] || '+965',
        clientCount,
        totalRevenue,
        serviceBreakdown,
        visits: visitsInPeriod,
      };
    });
  }, [employeeList, allVisits, adminDateFilter]);

  // Selected Staff Object if Admin has chosen a specific staff member
  const activeStaffDetails = useMemo(() => {
    if (selectedStaff === 'all') return null;
    return staffPerformanceList.find(s => s.name === selectedStaff || s.username === selectedStaff) || null;
  }, [staffPerformanceList, selectedStaff]);

  // Admin All Entries Filtered
  const filteredAdminEntries = useMemo(() => {
    return allVisits.filter((v) => {
      // 1. Timeframe
      if (!isDateInFilter(getEntryDate(v), adminDateFilter)) return false;

      // 2. Staff filter
      if (selectedStaff !== 'all') {
        const s = getEntryStaff(v).toLowerCase();
        const u = String(v['Created By'] || '').toLowerCase();
        if (!s.includes(selectedStaff.toLowerCase()) && u !== selectedStaff.toLowerCase()) {
          return false;
        }
      }

      // 3. Search query
      if (salesSearch.trim()) {
        const q = salesSearch.toLowerCase();
        const cName = getEntryCustomer(v).toLowerCase();
        if (cName === 'customer name' || cName === 'customer') return false;
        const sName = getEntryService(v).toLowerCase();
        const eName = getEntryStaff(v).toLowerCase();
        const pNum = String(v['Phone Number'] || '').toLowerCase();
        const bNo = String(v['Bill No'] || '').toLowerCase();
        if (!cName.includes(q) && !sName.includes(q) && !eName.includes(q) && !pNum.includes(q) && !bNo.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [allVisits, adminDateFilter, selectedStaff, salesSearch]);

  const adminPeriodRevenueKD = filteredAdminEntries.reduce((acc, v) => acc + getEntryAmount(v), 0);
  const totalAllVisitsRevenueKD = allVisits.reduce((acc, v) => acc + getEntryAmount(v), 0);

  // My Entries Computation (For Staff)
  const myVisits = useMemo(() => {
    if (!currentUser) return [];
    if (isAdmin) return allVisits;
    const curName = (currentUser.name || '').toLowerCase();
    const curUser = (currentUser.username || '').toLowerCase();
    return allVisits.filter((v) => {
      const s = getEntryStaff(v).toLowerCase();
      const u = String(v['Created By'] || '').toLowerCase();
      return s.includes(curName) || u === curUser || s.includes(curUser);
    });
  }, [allVisits, currentUser, isAdmin]);

  const filteredMyVisits = useMemo(() => {
    return myVisits.filter((v) => {
      if (!isDateInFilter(getEntryDate(v), myEntriesDateFilter)) return false;

      if (myEntriesSearch.trim()) {
        const q = myEntriesSearch.toLowerCase();
        const cName = getEntryCustomer(v).toLowerCase();
        if (cName === 'customer name' || cName === 'customer') return false;
        const sName = getEntryService(v).toLowerCase();
        const pNum = String(v['Phone Number'] || '').toLowerCase();
        const bNo = String(v['Bill No'] || '').toLowerCase();
        if (!cName.includes(q) && !sName.includes(q) && !pNum.includes(q) && !bNo.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [myVisits, myEntriesDateFilter, myEntriesSearch]);

  const myFilteredRevenueKD = filteredMyVisits.reduce((acc, v) => acc + getEntryAmount(v), 0);
  const myTotalRevenueKD = myVisits.reduce((acc, v) => acc + getEntryAmount(v), 0);
  const myTodayVisits = myVisits.filter((v) => getEntryDate(v) === getTodayDate());
  const myTodayRevenueKD = myTodayVisits.reduce((acc, v) => acc + getEntryAmount(v), 0);

  const filteredServiceList = categoryFilter === 'All'
    ? SALON_SERVICES
    : SALON_SERVICES.filter(s => s.category === categoryFilter);

  const groupedServices = useMemo(() => {
    const map: Record<string, SalonServiceItem[]> = {};
    SALON_SERVICES.forEach(s => {
      if (!map[s.category]) map[s.category] = [];
      map[s.category].push(s);
    });
    return map;
  }, []);

  const exportToCSV = () => {
    if (filteredAdminEntries.length === 0) return;
    const headers = ["Date", "Customer Name", "Service", "Employee Name", "Amount (KD)", "Payment Method", "Timestamp"];
    const rows = filteredAdminEntries.map(v => [
      `"${getEntryDate(v)}"`,
      `"${getEntryCustomer(v)}"`,
      `"${getEntryService(v).replace(/"/g, '""')}"`,
      `"${getEntryStaff(v)}"`,
      getEntryAmount(v),
      `"${getEntryPayment(v)}"`,
      `"${v['Timestamp'] || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Beard_Lounge_Entries_${adminDateFilter}_${getTodayDate()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f17] text-gray-400 text-xs">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f17] text-gray-200 p-4 sm:p-6 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* MINIMAL HEADER */}
        <header className="flex flex-wrap items-center justify-between pb-4 border-b border-white/10 gap-3">
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-semibold text-white tracking-wide uppercase">
              Beard <span className="text-[#f5cf68]">Lounge</span>
            </h1>
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-mono">
              &bull; Farwaniya, Kuwait
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
              <span>{currentUser.name || currentUser.username}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-gray-400">
                {currentUser.role}
              </span>
            </div>

            {spreadsheetUrl && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="text-gray-400 hover:text-[#f5cf68] transition-colors"
                title="Open Google Spreadsheet"
              >
                Sheet &rarr;
              </a>
            )}

            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-400 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* MINIMAL TAB BAR */}
        <div className="flex items-center gap-1 border-b border-white/10 pb-2 text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('pos');
              setStatusMsg(null);
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium whitespace-nowrap ${
              activeTab === 'pos'
                ? 'bg-[#d4af37] text-[#0b0f17] font-semibold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            + New Client Entry
          </button>

          {/* STAFF ONLY: MY ENTRIES */}
          {!isAdmin && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('my-entries');
                setStatusMsg(null);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'my-entries'
                  ? 'bg-[#d4af37] text-[#0b0f17] font-semibold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>My Entries</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'my-entries' ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-400'
              }`}>
                {myVisits.length}
              </span>
            </button>
          )}

          {/* ADMIN ONLY: ALL ENTRIES & STAFF PERFORMANCE */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('all-entries');
                setStatusMsg(null);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'all-entries'
                  ? 'bg-[#d4af37] text-[#0b0f17] font-semibold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>All Entries & Staff Sales</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'all-entries' ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-400'
              }`}>
                {allVisits.length}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setActiveTab('pricelist');
              setStatusMsg(null);
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium whitespace-nowrap ${
              activeTab === 'pricelist'
                ? 'bg-[#d4af37] text-[#0b0f17] font-semibold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Price List (KD)
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('staff');
                setStatusMsg(null);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium whitespace-nowrap ${
                activeTab === 'staff'
                  ? 'bg-[#d4af37] text-[#0b0f17] font-semibold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              + Staff Accounts
            </button>
          )}
        </div>

        {/* STATUS ALERT */}
        {statusMsg && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center justify-between border ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-red-500/10 text-red-400 border-red-500/30'
            }`}
          >
            <span dangerouslySetInnerHTML={{ __html: statusMsg.text }} />
            {spreadsheetUrl && statusMsg.type === 'success' && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-white ml-2 shrink-0"
              >
                View Sheet &rarr;
              </a>
            )}
          </div>
        )}

        {/* TAB 1: CLIENT ENTRY & POS BILLING */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Form Left (8 Cols) */}
            <div className="lg:col-span-8 space-y-4">
              <form onSubmit={handleSubmitVisit} id="posForm" className="bg-[#111622] border border-white/10 rounded-xl p-4 sm:p-6 space-y-4">
                
                <div className="flex items-center justify-between pb-3 border-b border-white/5 text-xs">
                  <span className="font-semibold text-white">Client Visit Entry</span>
                  <span className="text-gray-400 font-mono">Bill #{billNo}</span>
                </div>

                {/* Customer Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Customer Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#0b0f17] border border-white/10 rounded-lg focus:border-[#d4af37] text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1 flex justify-between">
                      <span>Phone No</span>
                      {phone && (
                        <a
                          href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-emerald-400 hover:underline"
                        >
                          WhatsApp &rarr;
                        </a>
                      )}
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 98765432"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#0b0f17] border border-white/10 rounded-lg focus:border-[#d4af37] text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Assigned Staff *</label>
                    {isAdmin ? (
                      <select
                        value={stylist}
                        onChange={(e) => setStylist(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#0b0f17] border border-white/10 rounded-lg focus:border-[#d4af37] text-white focus:outline-none"
                      >
                        {employeeList.map((emp, i) => {
                          const name = emp.name || emp['Employee Name'];
                          return (
                            <option key={i} value={name}>{name}</option>
                          );
                        })}
                      </select>
                    ) : (
                      <div className="w-full px-3 py-2 text-xs bg-[#0b0f17] border border-[#d4af37]/40 rounded-lg text-[#f5cf68] font-medium flex items-center justify-between">
                        <span>{currentUser?.name || currentUser?.username}</span>
                        <span className="text-[10px] text-gray-400">Auto-Tagged</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Date & Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#0b0f17] border border-white/10 rounded-lg focus:border-[#d4af37] text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Note / Preferences</label>
                    <input
                      type="text"
                      placeholder="Optional notes..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#0b0f17] border border-white/10 rounded-lg focus:border-[#d4af37] text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Services Selector */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white">Select Services ({selectedServices.length})</span>
                    <button
                      type="button"
                      onClick={() => setShowCustomItem(!showCustomItem)}
                      className="text-[11px] text-[#f5cf68] hover:underline flex items-center gap-1"
                    >
                      <Plus size={11} /> Custom Item
                    </button>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex flex-wrap gap-1 pb-1">
                    {SERVICE_CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategoryFilter(cat)}
                        className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${
                          categoryFilter === cat
                            ? 'bg-white/20 text-white font-medium'
                            : 'bg-white/5 text-gray-400 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Custom Item Drawer */}
                  {showCustomItem && (
                    <div className="p-2.5 rounded-lg bg-[#0b0f17] border border-[#d4af37]/30 flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Service Name"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-xs bg-[#111622] border border-white/10 rounded text-white"
                      />
                      <input
                        type="number"
                        placeholder="KD"
                        step="0.5"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value)}
                        className="w-20 px-2.5 py-1.5 text-xs bg-[#111622] border border-white/10 rounded text-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomItem}
                        className="px-3 py-1.5 bg-[#d4af37] text-black text-xs font-semibold rounded"
                      >
                        Add
                      </button>
                    </div>
                  )}

                  {/* Service Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                    {filteredServiceList.map((s) => {
                      const isSelected = selectedServices.some(sel => sel.id === s.id);
                      return (
                        <div
                          key={s.id}
                          onClick={() => toggleService(s)}
                          className={`p-2.5 rounded-lg border cursor-pointer select-none text-xs flex justify-between items-center transition-colors ${
                            isSelected
                              ? 'bg-[#d4af37]/15 border-[#d4af37] text-white'
                              : 'bg-[#0b0f17] border-white/5 text-gray-300 hover:border-white/20'
                          }`}
                        >
                          <span className="truncate pr-1">{s.name}</span>
                          <span className="font-mono font-semibold text-[#f5cf68] shrink-0">
                            {formatKD(s.price)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </form>
            </div>

            {/* Checkout Summary Right (4 Cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-[#111622] border border-white/10 rounded-xl p-4 sm:p-5 space-y-4">
                
                <div className="flex items-center justify-between pb-2 border-b border-white/5 text-xs">
                  <span className="font-semibold text-white">Summary</span>
                  <span className="text-gray-400 font-mono">{selectedServices.length} Selected</span>
                </div>

                {/* Selected items list */}
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {selectedServices.length > 0 ? (
                    selectedServices.map(s => (
                      <div key={s.id} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-[#0b0f17] text-gray-300">
                        <span className="truncate pr-2">{s.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-mono text-[#f5cf68]">{formatKD(s.price)}</span>
                          <button
                            type="button"
                            onClick={() => toggleService(s)}
                            className="text-gray-500 hover:text-red-400 font-bold ml-1"
                          >
                            &times;
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 text-center py-2">No items selected</p>
                  )}
                </div>

                {/* Payment Methods */}
                <div className="space-y-1.5 pt-2 border-t border-white/5">
                  <label className="block text-[11px] text-gray-400">Payment Method</label>
                  <div className="grid grid-cols-3 gap-1">
                    {PAYMENT_METHODS.map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        className={`py-1.5 px-1.5 text-[11px] rounded transition-colors text-center ${
                          paymentMethod === m
                            ? 'bg-[#d4af37] text-black font-semibold'
                            : 'bg-[#0b0f17] text-gray-400 hover:text-white border border-white/5'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Calculations */}
                <div className="space-y-2 pt-2 border-t border-white/5 text-xs">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatKD(subtotalKD)}</span>
                  </div>

                  <div className="flex justify-between items-center text-gray-400">
                    <span>Discount (KD):</span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      max={subtotalKD}
                      value={discount || ''}
                      onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                      placeholder="0"
                      className="w-16 px-2 py-1 text-xs text-right bg-[#0b0f17] border border-white/10 rounded text-white font-mono"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-white/10 text-white font-semibold">
                    <span>Total (KD):</span>
                    <span className="text-lg font-mono text-[#f5cf68] font-bold">
                      {formatKD(finalAmountKD)}
                    </span>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  form="posForm"
                  disabled={submitting || selectedServices.length === 0}
                  className="w-full py-2.5 px-4 bg-[#d4af37] hover:bg-[#e5c07b] text-black text-xs font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving...' : `Submit (${formatKD(finalAmountKD)})`}
                </button>

              </div>
            </div>

          </div>
        )}

        {/* TAB 2: MY ENTRIES AREA (FOR STAFF & ADMIN) */}
        {activeTab === 'my-entries' && (
          <div className="space-y-4">
            {/* Header & Quick Action */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-sm">
                  {isAdmin ? 'All Staff Entries & Logs' : 'My Service Entries & Sales'}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#f5cf68] text-[10px] font-medium">
                  {currentUser?.name || currentUser?.username} ({currentUser?.role})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('pos')}
                  className="px-3 py-1.5 bg-[#d4af37] hover:bg-[#c49f27] text-black rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Plus size={13} /> + New Client
                </button>
              </div>
            </div>

            {/* My Personal KPI Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#111622] border border-white/10 rounded-xl p-3.5">
                <span className="text-[11px] text-gray-400 block">Today&apos;s Sales</span>
                <span className="text-lg font-bold text-[#f5cf68] font-mono">{formatKD(myTodayRevenueKD)}</span>
              </div>
              <div className="bg-[#111622] border border-white/10 rounded-xl p-3.5">
                <span className="text-[11px] text-gray-400 block">Today&apos;s Clients</span>
                <span className="text-lg font-bold text-white font-mono">{myTodayVisits.length}</span>
              </div>
              <div className="bg-[#111622] border border-white/10 rounded-xl p-3.5">
                <span className="text-[11px] text-gray-400 block">Total Sales</span>
                <span className="text-lg font-bold text-[#f5cf68] font-mono">{formatKD(myTotalRevenueKD)}</span>
              </div>
              <div className="bg-[#111622] border border-white/10 rounded-xl p-3.5">
                <span className="text-[11px] text-gray-400 block">Total Clients</span>
                <span className="text-lg font-bold text-white font-mono">{myVisits.length}</span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-[#111622] border border-white/10 rounded-xl p-3.5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setMyEntriesDateFilter('day')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      myEntriesDateFilter === 'day' ? 'bg-[#d4af37] text-black font-semibold' : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setMyEntriesDateFilter('week')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      myEntriesDateFilter === 'week' ? 'bg-[#d4af37] text-black font-semibold' : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    This Week
                  </button>
                  <button
                    type="button"
                    onClick={() => setMyEntriesDateFilter('month')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      myEntriesDateFilter === 'month' ? 'bg-[#d4af37] text-black font-semibold' : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    This Month
                  </button>
                  <button
                    type="button"
                    onClick={() => setMyEntriesDateFilter('all')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      myEntriesDateFilter === 'all' ? 'bg-[#d4af37] text-black font-semibold' : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    All ({myVisits.length})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadData}
                    disabled={loadingVisits}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded text-xs transition-colors"
                  >
                    {loadingVisits ? 'Syncing...' : '↻ Refresh Data'}
                  </button>
                </div>
              </div>

              <input
                type="text"
                placeholder="Search by customer name, phone, bill number, or service..."
                value={myEntriesSearch}
                onChange={(e) => setMyEntriesSearch(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-[#0b0f17] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            {/* My Entries Table */}
            <div className="bg-[#111622] border border-white/10 rounded-xl overflow-hidden">
              <div className="p-3 border-b border-white/5 flex justify-between text-xs">
                <span className="font-semibold text-white">Showing {filteredMyVisits.length} Records</span>
                <span className="text-gray-400">Total: <strong className="text-[#f5cf68] font-mono">{formatKD(myFilteredRevenueKD)}</strong></span>
              </div>

              <div className="overflow-x-auto max-h-[480px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0b0f17] text-gray-400 border-b border-white/5 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Bill #</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Phone</th>
                      <th className="py-2.5 px-3">Services Provided</th>
                      <th className="py-2.5 px-3">Payment</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-center">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredMyVisits.length > 0 ? (
                      filteredMyVisits.slice().reverse().map((v, i) => {
                        const bill = v['Bill No'] || `BL-${1000 + i}`;
                        const cPhone = v['Phone Number'] || '';
                        const amt = getEntryAmount(v);
                        return (
                          <tr key={i} className="hover:bg-white/5 transition-colors">
                            <td className="py-2 px-3 text-gray-400 whitespace-nowrap font-mono">{getEntryDate(v)}</td>
                            <td className="py-2 px-3 text-gray-400 font-mono text-[11px] whitespace-nowrap">{bill}</td>
                            <td className="py-2 px-3 font-medium text-white">{getEntryCustomer(v)}</td>
                            <td className="py-2 px-3 text-gray-400 whitespace-nowrap text-[11px]">
                              {cPhone ? (
                                <a
                                  href={`https://wa.me/${cPhone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-gray-400 hover:text-emerald-400 font-mono"
                                  title="Chat on WhatsApp"
                                >
                                  {cPhone}
                                </a>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="py-2 px-3 text-gray-300 max-w-[220px] truncate">{getEntryService(v)}</td>
                            <td className="py-2 px-3 text-gray-400 whitespace-nowrap text-[11px]">{getEntryPayment(v)}</td>
                            <td className="py-2 px-3 font-semibold font-mono text-[#f5cf68] text-right whitespace-nowrap">{formatKD(amt)}</td>
                            <td className="py-2 px-3 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setReceiptData({
                                    ...v,
                                    finalAmount: amt,
                                  });
                                }}
                                className="px-2 py-0.5 rounded bg-white/5 hover:bg-[#d4af37] hover:text-black text-gray-300 text-[10px] transition-colors"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-gray-500">
                          {loadingVisits ? 'Loading your entries...' : 'No entries found for this period. Click "+ New Client" to add your first visit!'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PRICE LIST (KD) */}
        {activeTab === 'pricelist' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
              <span className="font-semibold text-white">Full Menu Price List (KD)</span>
              <span className="text-gray-400">Farwaniya Block 1</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(groupedServices).map(([catName, services]) => (
                <div key={catName} className="bg-[#111622] border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-xs font-semibold text-[#f5cf68] uppercase tracking-wider">{catName}</span>
                    <span className="text-[10px] text-gray-500 font-mono">{services.length} items</span>
                  </div>

                  <div className="space-y-1.5">
                    {services.map((s) => (
                      <div key={s.id} className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0">
                        <span className="text-gray-300">{s.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[#f5cf68] font-medium">{formatKD(s.price)}</span>
                          <button
                            type="button"
                            onClick={() => {
                              toggleService(s);
                              setActiveTab('pos');
                            }}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 hover:bg-[#d4af37] hover:text-black transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ALL ENTRIES & STAFF PERFORMANCE (ADMIN ONLY) */}
        {activeTab === 'all-entries' && isAdmin && (
          <div className="space-y-5">
            {/* Header & Timeframe Sorting Bar */}
            <div className="bg-[#111622] border border-white/10 rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <h2 className="font-semibold text-white text-sm">All Salon Entries & Staff Performance</h2>
                  <p className="text-[11px] text-gray-400">Click on any staff member below to view their specific service breakdown and total earnings</p>
                </div>

                {/* Day / Week / Month / All Sorter */}
                <div className="flex items-center gap-1.5 bg-[#0b0f17] p-1 rounded-lg border border-white/10">
                  <span className="text-[10px] uppercase font-semibold text-gray-400 px-2">Sort:</span>
                  <button
                    type="button"
                    onClick={() => setAdminDateFilter('day')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      adminDateFilter === 'day'
                        ? 'bg-[#d4af37] text-black font-semibold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Day (Today)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminDateFilter('week')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      adminDateFilter === 'week'
                        ? 'bg-[#d4af37] text-black font-semibold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Week (7 Days)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminDateFilter('month')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      adminDateFilter === 'month'
                        ? 'bg-[#d4af37] text-black font-semibold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Month (This Month)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminDateFilter('all')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      adminDateFilter === 'all'
                        ? 'bg-[#d4af37] text-black font-semibold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    All Time
                  </button>
                </div>
              </div>

              {/* Action row with Search & Export */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
                <input
                  type="text"
                  placeholder="Search customer, phone, bill number, service, or staff..."
                  value={salesSearch}
                  onChange={(e) => setSalesSearch(e.target.value)}
                  className="flex-1 min-w-[240px] px-3 py-1.5 text-xs bg-[#0b0f17] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#d4af37]"
                />

                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={exportToCSV}
                    disabled={filteredAdminEntries.length === 0}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Download size={12} /> Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={loadData}
                    disabled={loadingVisits}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw size={12} className={loadingVisits ? 'animate-spin' : ''} />
                    {loadingVisits ? 'Syncing...' : 'Refresh'}
                  </button>
                </div>
              </div>
            </div>

            {/* STAFF SELECTOR CARDS (CLICK TO FILTER & DRILL DOWN) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-300 uppercase tracking-wider text-[11px]">
                  Staff Performance Cards ({adminDateFilter.toUpperCase()}):
                </span>
                {selectedStaff !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedStaff('all')}
                    className="text-[11px] text-[#f5cf68] hover:underline"
                  >
                    &larr; View All Staff Summary
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {/* ALL STAFF CARD */}
                <div
                  onClick={() => setSelectedStaff('all')}
                  className={`p-3 rounded-xl border cursor-pointer select-none transition-all ${
                    selectedStaff === 'all'
                      ? 'bg-[#d4af37]/15 border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                      : 'bg-[#111622] border-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="text-xs font-bold text-white block">All Salon Staff</span>
                  <span className="text-[10px] text-gray-400 block mb-2">{employeeList.length} Team Members</span>
                  <div className="pt-2 border-t border-white/5 flex justify-between items-baseline">
                    <span className="text-base font-bold font-mono text-[#f5cf68]">{formatKD(adminPeriodRevenueKD)}</span>
                    <span className="text-[10px] text-gray-400">{filteredAdminEntries.length} visits</span>
                  </div>
                </div>

                {/* INDIVIDUAL STAFF CARDS */}
                {staffPerformanceList.map((emp, i) => {
                  const isSelected = selectedStaff.toLowerCase() === emp.name.toLowerCase() || selectedStaff.toLowerCase() === emp.username;
                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedStaff(emp.name)}
                      className={`p-3 rounded-xl border cursor-pointer select-none transition-all ${
                        isSelected
                          ? 'bg-[#d4af37]/20 border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                          : 'bg-[#111622] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-xs font-bold text-white truncate block">{emp.name}</span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] shrink-0 mt-1" />
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 truncate block mb-2">{emp.role}</span>
                      <div className="pt-2 border-t border-white/5 flex justify-between items-baseline">
                        <span className="text-base font-bold font-mono text-[#f5cf68]">{formatKD(emp.totalRevenue)}</span>
                        <span className="text-[10px] text-gray-400">{emp.clientCount} visits</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SELECTED STAFF SERVICE BREAKDOWN PANEL */}
            {activeStaffDetails && (
              <div className="bg-[#111622] border border-[#d4af37]/40 rounded-xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm sm:text-base">{activeStaffDetails.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#f5cf68] font-medium">
                        {activeStaffDetails.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Phone: {activeStaffDetails.phone} &bull; Period: <strong className="text-white uppercase">{adminDateFilter}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Staff Earnings</span>
                      <span className="text-xl font-black font-mono text-[#f5cf68]">{formatKD(activeStaffDetails.totalRevenue)}</span>
                    </div>
                    <div className="text-right border-l border-white/10 pl-4">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Clients Served</span>
                      <span className="text-xl font-black font-mono text-white">{activeStaffDetails.clientCount}</span>
                    </div>
                  </div>
                </div>

                {/* Services Performed Breakdown */}
                <div>
                  <span className="text-xs font-semibold text-gray-300 block mb-2.5">
                    Services Breakdown Performed by {activeStaffDetails.name}:
                  </span>

                  {Object.keys(activeStaffDetails.serviceBreakdown).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {Object.entries(activeStaffDetails.serviceBreakdown).map(([srvName, stats]) => (
                        <div key={srvName} className="p-2.5 rounded-lg bg-[#0b0f17] border border-white/5 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-medium text-white block">{srvName}</span>
                            <span className="text-[10px] text-gray-400">Done {stats.count} {stats.count === 1 ? 'time' : 'times'}</span>
                          </div>
                          <span className="font-mono font-bold text-[#f5cf68] text-right">
                            {formatKD(stats.totalKD)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 py-2">No services recorded for this staff member in this timeframe.</p>
                  )}
                </div>
              </div>
            )}

            {/* ENTRIES TABLE */}
            <div className="bg-[#111622] border border-white/10 rounded-xl overflow-hidden">
              <div className="p-3 border-b border-white/5 flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-white">
                    {selectedStaff === 'all' ? 'All Salon Entries' : `${selectedStaff}'s Entries`} ({filteredAdminEntries.length})
                  </span>
                  <span className="text-[11px] text-gray-400 ml-2 font-mono">
                    &bull; Sorted by: <strong className="text-[#f5cf68] uppercase">{adminDateFilter}</strong>
                  </span>
                </div>
                <span className="text-gray-400">
                  Total: <strong className="text-[#f5cf68] font-mono">{formatKD(adminPeriodRevenueKD)}</strong>
                </span>
              </div>

              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0b0f17] text-gray-400 border-b border-white/5 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Bill #</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Phone</th>
                      <th className="py-2.5 px-3">Staff / Barber</th>
                      <th className="py-2.5 px-3">Services Provided</th>
                      <th className="py-2.5 px-3">Payment</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-center">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredAdminEntries.length > 0 ? (
                      filteredAdminEntries.slice().reverse().map((v, i) => {
                        const bill = v['Bill No'] || `BL-${1000 + i}`;
                        const cPhone = v['Phone Number'] || '';
                        const amt = getEntryAmount(v);
                        const staff = getEntryStaff(v);
                        return (
                          <tr key={i} className="hover:bg-white/5 transition-colors">
                            <td className="py-2 px-3 text-gray-400 whitespace-nowrap font-mono">{getEntryDate(v)}</td>
                            <td className="py-2 px-3 text-gray-400 font-mono text-[11px] whitespace-nowrap">{bill}</td>
                            <td className="py-2 px-3 font-medium text-white">{getEntryCustomer(v)}</td>
                            <td className="py-2 px-3 text-gray-400 whitespace-nowrap text-[11px]">
                              {cPhone ? (
                                <a
                                  href={`https://wa.me/${cPhone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-gray-400 hover:text-emerald-400 font-mono"
                                  title="Chat on WhatsApp"
                                >
                                  {cPhone}
                                </a>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              <span
                                onClick={() => setSelectedStaff(staff)}
                                className="px-2 py-0.5 rounded bg-white/5 hover:bg-[#d4af37]/20 text-[#f5cf68] cursor-pointer text-[11px] font-medium transition-colors"
                                title={`Filter by ${staff}`}
                              >
                                {staff}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-gray-300 max-w-[200px] truncate">{getEntryService(v)}</td>
                            <td className="py-2 px-3 text-gray-400 whitespace-nowrap text-[11px]">{getEntryPayment(v)}</td>
                            <td className="py-2 px-3 font-semibold font-mono text-[#f5cf68] text-right whitespace-nowrap">{formatKD(amt)}</td>
                            <td className="py-2 px-3 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setReceiptData({
                                    ...v,
                                    finalAmount: amt,
                                  });
                                }}
                                className="px-2 py-0.5 rounded bg-white/5 hover:bg-[#d4af37] hover:text-black text-gray-300 text-[10px] transition-colors"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={9} className="py-10 text-center text-gray-500">
                          {loadingVisits ? 'Loading salon records...' : 'No entries found for this filter.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: ADD STAFF ACCOUNTS (ADMIN) */}
        {activeTab === 'staff' && isAdmin && (
          <div className="max-w-xl mx-auto bg-[#111622] border border-white/10 rounded-xl p-5 sm:p-7 space-y-4">
            <div className="pb-3 border-b border-white/5">
              <h2 className="text-sm font-semibold text-white">Create Staff Login Account</h2>
              <p className="text-xs text-gray-400">Stores directly to the Employees spreadsheet</p>
            </div>

            <form onSubmit={handleAddStaffAccount} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sameer Khan"
                    value={newStaffName}
                    onChange={(e) => {
                      setNewStaffName(e.target.value);
                      if (!newStaffUsername) {
                        setNewStaffUsername(e.target.value.toLowerCase().replace(/\s+/g, ''));
                      }
                    }}
                    className="w-full px-3 py-2 text-xs bg-[#0b0f17] border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. +965 9876 5432"
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#0b0f17] border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Login Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. sameer"
                    value={newStaffUsername}
                    onChange={(e) => setNewStaffUsername(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#0b0f17] border border-white/10 rounded-lg text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Login Password *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. sameer@123"
                    value={newStaffPassword}
                    onChange={(e) => setNewStaffPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#0b0f17] border border-white/10 rounded-lg text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Role</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0b0f17] border border-white/10 rounded-lg text-white focus:outline-none"
                >
                  <option value="Master Barber">Master Barber</option>
                  <option value="Senior Hair Stylist">Senior Hair Stylist</option>
                  <option value="Beard Specialist">Beard Specialist</option>
                  <option value="Skin & Spa Therapist">Skin & Spa Therapist</option>
                  <option value="Front Desk Manager">Front Desk Manager</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-[#d4af37] hover:bg-[#e5c07b] text-black text-xs font-semibold rounded-lg transition-colors disabled:opacity-40"
              >
                {submitting ? 'Creating Account...' : 'Save Staff to Spreadsheet'}
              </button>
            </form>

            <div className="pt-3 border-t border-white/5 space-y-2">
              <span className="text-[11px] text-gray-400 font-semibold block">Registered Staff ({employeeList.length})</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {employeeList.map((emp, i) => {
                  const empName = emp.name || emp['Employee Name'];
                  const empUser = emp.username || '';
                  const isPrimaryAdmin = empUser.toLowerCase() === 'admin';
                  return (
                    <div key={i} className="p-2.5 rounded bg-[#0b0f17] border border-white/5 text-xs flex justify-between items-center group">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white block">{empName}</span>
                          {empUser && (
                            <span className="text-[10px] font-mono text-[#f5cf68]">@{empUser}</span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400">{emp.role || emp['Role']}</span>
                      </div>

                      {!isPrimaryAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteStaff(emp)}
                          disabled={submitting}
                          title={`Delete account @${empUser}`}
                          className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MINIMAL RECEIPT MODAL */}
      {receiptData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#111622] border border-white/10 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-start border-b border-white/5 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Beard Lounge Kuwait</h3>
                <p className="text-[10px] text-gray-400">Farwaniya Block 1 &bull; Bill #{receiptData['Bill No']}</p>
              </div>
              <button onClick={() => setReceiptData(null)} className="text-gray-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="text-xs text-gray-300 space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">Client:</span><span>{receiptData['Customer Name']}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Staff:</span><span className="text-[#f5cf68]">{receiptData['Employee Name']}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Date:</span><span>{receiptData['Date']} {receiptData['Time']}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Payment:</span><span>{receiptData['Payment Method']}</span></div>
            </div>

            <div className="border-t border-b border-white/5 py-2 space-y-1">
              {receiptData.items && Array.isArray(receiptData.items) ? (
                receiptData.items.map((it: any, i: number) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-gray-300">{it.name}</span>
                    <span className="font-mono text-white">{formatKD(it.price)}</span>
                  </div>
                ))
              ) : (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300">{receiptData['Service'] || receiptData['Services'] || 'Salon Service'}</span>
                  <span className="font-mono text-white">{formatKD(receiptData.finalAmount || receiptData['Amount'] || 0)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between text-sm font-bold text-white pt-1">
              <span>Total:</span>
              <span className="font-mono text-[#f5cf68]">{formatKD(receiptData.finalAmount)}</span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 bg-[#d4af37] text-black rounded text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Printer size={13} /> Print
              </button>
              <button
                type="button"
                onClick={() => setReceiptData(null)}
                className="py-2 px-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CENTERED CONFIRM DELETE STAFF MODAL */}
      {staffToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#111622] border border-red-500/30 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-scale-in">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 mx-auto flex items-center justify-center">
              <Trash2 size={22} />
            </div>

            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Delete Staff Account?</h3>
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                Are you sure you want to delete <strong className="text-white">{staffToDelete.name || staffToDelete['Employee Name']}</strong>
                {staffToDelete.username ? ` (@${staffToDelete.username})` : ''}?
              </p>
              <p className="text-[11px] text-red-400/80 mt-1">
                This will permanently remove their login access from the spreadsheet.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStaffToDelete(null)}
                disabled={submitting}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteStaff}
                disabled={submitting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Yes, Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


