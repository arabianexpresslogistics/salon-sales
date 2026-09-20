'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getStoredUser, 
  logout, 
  addVisit, 
  fetchVisits, 
  addEmployee, 
  fetchEmployees,
  getSpreadsheetUrl 
} from '@/lib/salonApi';

export default function HomePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');

  // Tabs: 'customer' | 'employee' (admin only) | 'dashboard' (admin only)
  const [viewMode, setViewMode] = useState<'customer' | 'employee' | 'dashboard'>('customer');

  // Customer Form states
  const getTodayDate = () => new Date().toISOString().substring(0, 10);
  const [customerName, setCustomerName] = useState('');
  const [date, setDate] = useState(getTodayDate());
  const [service, setService] = useState('');
  const [note, setNote] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [amount, setAmount] = useState('');

  // Add Employee Form states (Admin only)
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Hair Stylist');

  // App data & suggestions
  const [submitting, setSubmitting] = useState(false);
  const [loadingSales, setLoadingSales] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [allVisits, setAllVisits] = useState<any[]>([]);
  const [employeeList, setEmployeeList] = useState<any[]>([]);
  const [serviceSuggestions] = useState<string[]>([
    'Haircut',
    'Beard Trim',
    'Haircut & Beard Trim',
    'Hair Wash',
    'Beard Shave',
    'Hair Spa',
    'Face De-Tan',
    'Hair Color',
    'Facial'
  ]);

  // Dashboard filter & search
  const [salesDateFilter, setSalesDateFilter] = useState<'today' | 'month' | 'all'>('all');
  const [salesSearch, setSalesSearch] = useState('');

  const isAdmin = currentUser?.role === 'Admin';

  // Robust field extractors
  const getEntryCustomer = (v: any) => v['Customer Name'] || v['customerName'] || v['Customer'] || (Object.values(v)[1] as string) || 'Guest';
  const getEntryService = (v: any) => v['Service'] || v['Services'] || v['service'] || (Object.values(v)[2] as string) || '-';
  const getEntryStaff = (v: any) => v['Employee Name'] || v['Stylist / Barber'] || v['employeeName'] || (Object.values(v)[3] as string) || '-';
  const getEntryAmount = (v: any) => {
    const a = v['Amount'] ?? v['Final Amount (₹)'] ?? v['Total Amount (₹)'] ?? v['amount'] ?? Object.values(v)[4];
    return Number(a) || 0;
  };
  const getEntryDate = (v: any) => {
    const d = v['Date'] || v['date'] || Object.values(v)[0];
    if (!d) return '-';
    const str = String(d);
    if (str.includes('T')) return str.split('T')[0];
    if (str.includes('GMT')) {
      try {
        const dt = new Date(str);
        if (!isNaN(dt.getTime())) return dt.toISOString().split('T')[0];
      } catch {}
    }
    return str;
  };

  useEffect(() => {
    const user = getStoredUser();
    if (!user || !user.token) {
      router.push('/login');
    } else {
      setCurrentUser(user);
      setSpreadsheetUrl(getSpreadsheetUrl());
      loadData();
    }
  }, [router]);

  const loadData = async () => {
    setLoadingSales(true);
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
        const firstName = empRes.employees[0].name || empRes.employees[0]['Employee Name'];
        if (firstName && !employeeName) {
          setEmployeeName(firstName);
        }
      } else {
        setEmployeeList([
          { name: 'Sameer Khan', role: 'Master Barber' },
          { name: 'Arjun Das', role: 'Hair Stylist' }
        ]);
        if (!employeeName) setEmployeeName('Sameer Khan');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSales(false);
    }
  };

  // Submit Customer Visit
  const handleSubmitVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter customer name' });
      return;
    }
    if (!service.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter or select a service' });
      return;
    }
    if (!employeeName.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter or select employee name' });
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    const parsedAmount = parseFloat(amount) || 0;
    const payload = {
      "Date": date,
      "Customer Name": customerName.trim(),
      "Service": service.trim(),
      "Employee Name": employeeName.trim(),
      "Amount": parsedAmount,
      "Note": note.trim(),
      "Timestamp": new Date().toLocaleString(),
    };

    try {
      const res = await addVisit(payload as any);
      if (res.success || res.message) {
        setStatusMessage({ type: 'success', text: `Saved to Google Sheets! Amount: ₹${parsedAmount}` });
        setAllVisits((prev) => [...prev, payload]);

        // Reset customer form
        setCustomerName('');
        setService('');
        setNote('');
        setAmount('');
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Failed to submit to Google Sheets' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error communicating with Google Sheets' });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit New Staff (Admin Only)
  const handleSubmitStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;

    setSubmitting(true);
    setStatusMessage(null);

    const empPayload = {
      "Employee Name": newStaffName.trim(),
      "Phone Number": newStaffPhone.trim(),
      "Role": newStaffRole,
      "Joining Date": date,
      "Status": "Active" as const,
    };

    try {
      const res = await addEmployee(empPayload);
      if (res.success || res.message) {
        setStatusMessage({ type: 'success', text: `Staff ${newStaffName} registered to Google Sheets!` });
        setEmployeeList((prev) => [...prev, empPayload]);
        setNewStaffName('');
        setNewStaffPhone('');
        setViewMode('customer');
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Failed to add employee' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error communicating with Google Sheets' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Dashboard Computations
  const todayStr = getTodayDate();
  const currentMonthStr = todayStr.substring(0, 7);

  const filteredSales = useMemo(() => {
    return allVisits.filter((v) => {
      const vDate = getEntryDate(v);
      
      // Date Filter
      if (salesDateFilter === 'today' && vDate !== todayStr) return false;
      if (salesDateFilter === 'month' && !vDate.startsWith(currentMonthStr)) return false;

      // Search Query
      if (salesSearch.trim()) {
        const q = salesSearch.toLowerCase();
        const cName = getEntryCustomer(v).toLowerCase();
        if (cName === 'customer name' || cName === 'customer') return false;
        const sName = getEntryService(v).toLowerCase();
        const eName = getEntryStaff(v).toLowerCase();
        if (!cName.includes(q) && !sName.includes(q) && !eName.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [allVisits, salesDateFilter, salesSearch, todayStr, currentMonthStr]);

  // KPIs
  const todayVisits = allVisits.filter((v) => getEntryDate(v) === todayStr);
  const todayRevenue = todayVisits.reduce((acc, v) => acc + getEntryAmount(v), 0);
  const totalRevenueAll = allVisits.reduce((acc, v) => acc + getEntryAmount(v), 0);
  const filteredRevenue = filteredSales.reduce((acc, v) => acc + getEntryAmount(v), 0);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 md:p-10 font-[Poppins]">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Minimal Header */}
        <header className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
                Beard Lounge
              </h1>
              {isAdmin ? (
                <span className="text-[10px] font-semibold uppercase bg-slate-900 text-white px-2 py-0.5 rounded-full">
                  Admin
                </span>
              ) : (
                <span className="text-[10px] font-semibold uppercase bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                  Staff
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">Premium Salon &bull; Logged in as {currentUser.username} ({currentUser.role})</p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {spreadsheetUrl && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="text-slate-600 hover:text-slate-900 underline"
              >
                Spreadsheet &rarr;
              </a>
            )}
            <span className="text-slate-300">|</span>
            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-red-600 transition-colors"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Navigation Tabs (Admin gets Add Staff & Dashboard) */}
        <div className="flex border-b border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => {
              setViewMode('customer');
              setStatusMessage(null);
            }}
            className={`pb-2 px-3 font-medium transition-colors border-b-2 -mb-px ${
              viewMode === 'customer'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Customer Entry
          </button>

          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => {
                  setViewMode('dashboard');
                  setStatusMessage(null);
                }}
                className={`pb-2 px-3 font-medium transition-colors border-b-2 -mb-px ${
                  viewMode === 'dashboard'
                    ? 'border-slate-900 text-slate-900 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Sales Dashboard
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewMode('employee');
                  setStatusMessage(null);
                }}
                className={`pb-2 px-3 font-medium transition-colors border-b-2 -mb-px ${
                  viewMode === 'employee'
                    ? 'border-slate-900 text-slate-900 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                + Add Staff
              </button>
            </>
          )}
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div
            className={`p-3 rounded-lg text-xs font-medium border transition-all ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* TAB 1: Customer Entry */}
        {viewMode === 'customer' && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-7 shadow-sm space-y-4">
            <form onSubmit={handleSubmitVisit} className="space-y-4">
              
              {/* Customer Name */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all text-slate-800 placeholder:text-slate-400"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all text-slate-800"
                />
              </div>

              {/* Service */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Service *
                </label>
                <input
                  type="text"
                  required
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  placeholder="e.g. Haircut, Beard Trim"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all text-slate-800 placeholder:text-slate-400"
                />
                
                {/* Quick Service Suggestions */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {serviceSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setService(service ? `${service}, ${s}` : s)}
                      className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition-colors"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Note
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Any preferences or instructions..."
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all text-slate-800 placeholder:text-slate-400 resize-none"
                />
              </div>

              {/* Employee Name */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Employee Name *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    placeholder="Staff / Barber Name"
                    className="flex-1 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all text-slate-800 placeholder:text-slate-400"
                  />
                  {employeeList.length > 0 && (
                    <select
                      onChange={(e) => e.target.value && setEmployeeName(e.target.value)}
                      value=""
                      className="px-2 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-600 focus:outline-none"
                    >
                      <option value="">Choose Staff</option>
                      {employeeList.map((emp, i) => {
                        const name = emp.name || emp['Employee Name'];
                        return (
                          <option key={i} value={name}>
                            {name}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 350"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all text-slate-800 placeholder:text-slate-400"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm mt-2"
              >
                {submitting ? 'Saving to Google Sheets...' : 'Submit Entry'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: Simple Sales Dashboard (Admin Only) */}
        {viewMode === 'dashboard' && isAdmin && (
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
                <span className="text-[11px] text-slate-500 font-medium block">Today&apos;s Sales</span>
                <span className="text-lg font-bold text-slate-900">₹{todayRevenue.toLocaleString()}</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
                <span className="text-[11px] text-slate-500 font-medium block">Today&apos;s Visits</span>
                <span className="text-lg font-bold text-slate-900">{todayVisits.length}</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
                <span className="text-[11px] text-slate-500 font-medium block">Total Revenue</span>
                <span className="text-lg font-bold text-slate-900">₹{totalRevenueAll.toLocaleString()}</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
                <span className="text-[11px] text-slate-500 font-medium block">Total Records</span>
                <span className="text-lg font-bold text-slate-900">{allVisits.length}</span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setSalesDateFilter('today')}
                    className={`px-3 py-1.5 rounded-lg border transition-colors ${
                      salesDateFilter === 'today'
                        ? 'bg-slate-900 text-white border-slate-900 font-medium'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setSalesDateFilter('month')}
                    className={`px-3 py-1.5 rounded-lg border transition-colors ${
                      salesDateFilter === 'month'
                        ? 'bg-slate-900 text-white border-slate-900 font-medium'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    This Month
                  </button>
                  <button
                    type="button"
                    onClick={() => setSalesDateFilter('all')}
                    className={`px-3 py-1.5 rounded-lg border transition-colors ${
                      salesDateFilter === 'all'
                        ? 'bg-slate-900 text-white border-slate-900 font-medium'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    All ({allVisits.length})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={loadData}
                  disabled={loadingSales}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                >
                  {loadingSales ? 'Refreshing...' : '↻ Refresh Data'}
                </button>
              </div>

              {/* Search */}
              <input
                type="text"
                placeholder="Search by customer, service or staff..."
                value={salesSearch}
                onChange={(e) => setSalesSearch(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            {/* Sales Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-3.5 border-b border-slate-100 flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-900">
                  Sales Entries ({filteredSales.length})
                </span>
                <span className="text-slate-500 font-medium">
                  Subtotal: <strong className="text-slate-900">₹{filteredRevenue.toLocaleString()}</strong>
                </span>
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3 font-medium">Date</th>
                      <th className="py-2.5 px-3 font-medium">Customer</th>
                      <th className="py-2.5 px-3 font-medium">Service</th>
                      <th className="py-2.5 px-3 font-medium">Staff</th>
                      <th className="py-2.5 px-3 font-medium text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSales.length > 0 ? (
                      filteredSales.slice().reverse().map((v, i) => (
                        <tr key={i} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                            {getEntryDate(v)}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-900">
                            {getEntryCustomer(v)}
                          </td>
                          <td className="py-2 px-3 text-slate-600">
                            {getEntryService(v)}
                          </td>
                          <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                            {getEntryStaff(v)}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-900 text-right">
                            ₹{getEntryAmount(v).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          {loadingSales ? 'Loading records...' : 'No sales records found'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Add Staff (Admin Only) */}
        {viewMode === 'employee' && isAdmin && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-7 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-semibold text-slate-900">Register New Staff Member</h2>
              <p className="text-xs text-slate-500">Only administrators can add staff to the Google Sheet</p>
            </div>

            <form onSubmit={handleSubmitStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Employee Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="e.g. Sameer Khan"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all text-slate-800 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newStaffPhone}
                  onChange={(e) => setNewStaffPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all text-slate-800 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Role
                </label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all text-slate-800"
                >
                  <option value="Hair Stylist">Hair Stylist</option>
                  <option value="Master Barber">Master Barber</option>
                  <option value="Beard Specialist">Beard Specialist</option>
                  <option value="Spa Therapist">Spa Therapist</option>
                  <option value="Front Desk">Front Desk</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm mt-2"
              >
                {submitting ? 'Saving to Employees Sheet...' : 'Add Staff to Spreadsheet'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
