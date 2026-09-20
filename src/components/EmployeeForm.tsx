'use client';

import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Phone, 
  Briefcase, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Shield, 
  Sparkles,
  Search
} from 'lucide-react';
import { EmployeeData } from '@/types/salon';
import { addEmployee } from '@/lib/salonApi';

interface EmployeeFormProps {
  employees: EmployeeData[];
  onEmployeeAdded: (newEmp: EmployeeData) => void;
  spreadsheetUrl: string;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({ employees, onEmployeeAdded, spreadsheetUrl }) => {
  const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Master Barber');
  const [joiningDate, setJoiningDate] = useState(getTodayDate());
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const rolesList = [
    'Master Barber',
    'Senior Hair Stylist',
    'Beard Specialist',
    'Color & Chemical Expert',
    'Skin & Spa Therapist',
    'Junior Barber',
    'Front Desk & Manager'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter employee name.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Please enter employee contact number.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    const newEmployeeData: EmployeeData = {
      "Employee Name": name.trim(),
      "Phone Number": phone.trim(),
      "Role": role,
      "Joining Date": joiningDate,
      "Status": status,
    };

    try {
      const res = await addEmployee(newEmployeeData);
      if (res.success) {
        onEmployeeAdded(newEmployeeData);
        setSuccessToast(true);

        // Reset fields
        setName('');
        setPhone('');
        setRole('Master Barber');
        setStatus('Active');

        setTimeout(() => setSuccessToast(false), 5000);
      } else {
        setErrorMsg(res.error || 'Failed to add employee to Google Sheets.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error communicating with Google Apps Script.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const empName = emp['Employee Name'] || emp.name || '';
    const empRole = emp['Role'] || emp.role || '';
    const q = searchQuery.toLowerCase();
    return empName.toLowerCase().includes(q) || empRole.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-8">
      {/* Toast Alert */}
      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center justify-between gap-3 animate-slide-up shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Employee Added & Synced Successfully!</p>
              <p className="text-xs text-emerald-400/80">Staff profile recorded in the Google Sheets database.</p>
            </div>
          </div>
          {spreadsheetUrl && (
            <a 
              href={spreadsheetUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="text-xs font-semibold underline text-emerald-300 hover:text-emerald-100"
            >
              Open Sheet &rarr;
            </a>
          )}
        </div>
      )}

      {/* Grid: Registration Form (Left) & Active Team Roster (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Card */}
        <div className="lg:col-span-5 salon-card p-6 md:p-8">
          <div className="flex items-center gap-2.5 pb-5 border-b border-white/10 mb-6">
            <span className="p-2 rounded-lg bg-[#d4af37]/10 text-[#f5cf68]">
              <UserPlus size={18} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white">Register Salon Employee</h2>
              <p className="text-xs text-gray-400">Add stylist to Google Sheet database</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Employee Name */}
            <div>
              <label className="salon-label">Employee Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g., Sameer Khan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="salon-input"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="salon-label">Contact / Mobile Number *</label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="e.g., +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="salon-input"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="salon-label flex items-center gap-1">
                <Briefcase size={13} className="text-[#d4af37]" /> Salon Role / Designation
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="salon-input"
              >
                {rolesList.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Joining Date & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="salon-label flex items-center gap-1">
                  <Calendar size={13} className="text-[#d4af37]" /> Joining Date
                </label>
                <input
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="salon-input"
                />
              </div>

              <div>
                <label className="salon-label">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="salon-input"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-gold w-full py-3 text-sm mt-3"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Saving to Employees Sheet...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus size={16} /> Save Staff to Spreadsheet
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Team Roster View */}
        <div className="lg:col-span-7 salon-card p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-white/10 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users size={18} className="text-[#f5cf68]" /> Active Salon Stylists & Team
              </h2>
              <p className="text-xs text-gray-400">Synced with &apos;Employees&apos; tab in Google Sheet</p>
            </div>

            {/* Search filter */}
            <div className="relative w-48">
              <Search size={14} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="salon-input py-1.5 pl-8 text-xs bg-[#121620]"
              />
            </div>
          </div>

          {/* Roster Cards */}
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp, index) => {
                const empName = emp['Employee Name'] || emp.name || 'Stylist';
                const empRole = emp['Role'] || emp.role || 'Barber';
                const empPhone = emp['Phone Number'] || emp.phone || '';
                const empStatus = emp['Status'] || emp.status || 'Active';
                const isActive = empStatus.toLowerCase() === 'active';

                return (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-[#d4af37]/40 transition-all flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#f5cf68] font-bold text-sm">
                        {empName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                          {empName}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            isActive 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-gray-500/10 text-gray-400'
                          }`}>
                            {empStatus}
                          </span>
                        </h4>
                        <p className="text-xs text-[#d4af37] font-medium">{empRole}</p>
                        {empPhone && (
                          <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                            <Phone size={11} /> {empPhone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-gray-500 font-mono block">ID #{index + 101}</span>
                      <span className="text-xs text-[#f5cf68] font-medium">On Duty</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-gray-500 text-xs">
                No staff members match your filter.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
