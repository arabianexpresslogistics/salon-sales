'use client';

import React, { useState, useEffect } from 'react';
import { 
  Scissors, 
  User, 
  Phone, 
  Calendar, 
  Clock, 
  CreditCard, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Plus, 
  Tag, 
  FileText,
  Percent,
  IndianRupee,
  BadgeCheck
} from 'lucide-react';
import { VisitData, EmployeeData, SalonServiceItem } from '@/types/salon';
import { SALON_SERVICES, PAYMENT_METHODS, CUSTOMER_CATEGORIES } from '@/lib/constants';
import { addVisit } from '@/lib/salonApi';

interface CustomerFormProps {
  employees: EmployeeData[];
  onSuccess: (newVisit: VisitData) => void;
  spreadsheetUrl: string;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({ employees, onSuccess, spreadsheetUrl }) => {
  // Generate random bill number like BL-2401
  const generateBillNo = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `BL-${new Date().getFullYear()}-${randomSuffix}`;
  };

  const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const [billNo, setBillNo] = useState(generateBillNo());
  const [date, setDate] = useState(getTodayDate());
  const [time, setTime] = useState(getCurrentTime());
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [category, setCategory] = useState(CUSTOMER_CATEGORIES[0]);
  const [selectedServices, setSelectedServices] = useState<SalonServiceItem[]>([SALON_SERVICES[0]]);
  const [stylist, setStylist] = useState(employees[0]?.['Employee Name'] || 'Sameer Khan');
  const [paymentMethod, setPaymentMethod] = useState<VisitData['Payment Method']>('UPI / GPay');
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<VisitData['Status']>('Completed');

  // Custom service input
  const [showCustomService, setShowCustomService] = useState(false);
  const [customServiceName, setCustomServiceName] = useState('');
  const [customServicePrice, setCustomServicePrice] = useState('');

  // Active filter category for services
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState<string>('All');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState(false);

  // Sync stylist default when employees load
  useEffect(() => {
    if (employees.length > 0 && !stylist) {
      setStylist(employees[0]['Employee Name'] || employees[0].name || '');
    }
  }, [employees, stylist]);

  // Compute billing
  const subtotal = selectedServices.reduce((acc, curr) => acc + curr.price, 0);
  const finalAmount = Math.max(0, subtotal - discount);

  const toggleService = (service: SalonServiceItem) => {
    if (selectedServices.some(s => s.id === service.id)) {
      setSelectedServices(selectedServices.filter(s => s.id !== service.id));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const handleAddCustomService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customServiceName.trim() || !customServicePrice) return;
    const priceNum = parseFloat(customServicePrice);
    if (isNaN(priceNum) || priceNum < 0) return;

    const newCustom: SalonServiceItem = {
      id: `custom_${Date.now()}`,
      name: customServiceName.trim(),
      category: 'Package',
      price: priceNum,
      durationMin: 30,
    };

    setSelectedServices([...selectedServices, newCustom]);
    setCustomServiceName('');
    setCustomServicePrice('');
    setShowCustomService(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setErrorMsg('Please enter customer full name.');
      return;
    }
    if (!phoneNumber.trim()) {
      setErrorMsg('Please enter customer phone number.');
      return;
    }
    if (selectedServices.length === 0) {
      setErrorMsg('Please select at least one grooming service.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    const servicesText = selectedServices.map(s => s.name).join(', ');

    const visitPayload: VisitData = {
      "Bill No": billNo,
      "Date": date,
      "Time": time,
      "Customer Name": customerName.trim(),
      "Phone Number": phoneNumber.trim(),
      "Gender / Category": category,
      "Services": servicesText,
      "Stylist / Barber": stylist,
      "Payment Method": paymentMethod,
      "Total Amount (₹)": subtotal,
      "Discount (₹)": discount,
      "Final Amount (₹)": finalAmount,
      "Notes / Preference": notes.trim() || 'None',
      "Status": status,
      "Timestamp": new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    try {
      const res = await addVisit(visitPayload);
      if (res.success || res.billNo) {
        onSuccess(visitPayload);
        setSuccessToast(true);

        // Reset form for next client
        setBillNo(generateBillNo());
        setTime(getCurrentTime());
        setCustomerName('');
        setPhoneNumber('');
        setSelectedServices([SALON_SERVICES[0]]);
        setDiscount(0);
        setNotes('');

        setTimeout(() => setSuccessToast(false), 5000);
      } else {
        setErrorMsg(res.error || 'Failed to submit visit to Google Sheets.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error communicating with Google Apps Script.');
    } finally {
      setSubmitting(false);
    }
  };

  const categoriesList = ['All', 'Hair', 'Beard', 'Spa & Facial', 'Package', 'Color & Texture'];
  const filteredServices = serviceCategoryFilter === 'All' 
    ? SALON_SERVICES 
    : SALON_SERVICES.filter(s => s.category === serviceCategoryFilter);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center justify-between gap-3 animate-slide-up shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Visit Logged & Synced Successfully!</p>
              <p className="text-xs text-emerald-400/80">Entry recorded in Google Sheets database under bill #{billNo}.</p>
            </div>
          </div>
          {spreadsheetUrl && (
            <a 
              href={spreadsheetUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="text-xs font-semibold underline text-emerald-300 hover:text-emerald-100 shrink-0"
            >
              Open Sheet &rarr;
            </a>
          )}
        </div>
      )}

      {/* Main Card Form */}
      <form onSubmit={handleSubmit} className="salon-card p-6 md:p-8 space-y-8">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-[#d4af37]/10 text-[#f5cf68]">
                <Scissors size={18} />
              </span>
              <h2 className="text-xl font-bold text-white tracking-wide">Client Visit & Service Billing</h2>
            </div>
            <p className="text-xs text-gray-400 mt-1">Log haircut, beard styling & executive salon services to Google Spreadsheet</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Bill No display & re-roll */}
            <div className="flex items-center gap-2 bg-[#121620] border border-[#d4af37]/40 px-3 py-1.5 rounded-xl">
              <span className="text-xs text-gray-400 font-mono">BILL:</span>
              <span className="text-sm font-bold text-[#f5cf68] font-mono">{billNo}</span>
              <button 
                type="button" 
                onClick={() => setBillNo(generateBillNo())}
                title="Regenerate Bill Number"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <RefreshCw size={13} />
              </button>
            </div>

            {/* Visit Status */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="salon-input py-1.5 px-3 text-xs w-auto bg-[#121620] border-white/15"
            >
              <option value="Completed">Completed</option>
              <option value="In-Service">In-Service</option>
              <option value="Booked">Booked</option>
            </select>
          </div>
        </div>

        {/* Section 1: Customer Info */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#d4af37] mb-4 flex items-center gap-2">
            <User size={15} /> 1. Customer Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer Name */}
            <div>
              <label className="salon-label">Customer Full Name *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g., Rajesh Kumar"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="salon-input"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="salon-label flex justify-between">
                <span>Phone / WhatsApp *</span>
                {phoneNumber && (
                  <a
                    href={`https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#25D366] hover:underline"
                  >
                    WhatsApp Chat
                  </a>
                )}
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="e.g., 9876543210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="salon-input"
                />
              </div>
            </div>

            {/* Customer Category */}
            <div>
              <label className="salon-label">Customer Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="salon-input"
              >
                {CUSTOMER_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Date, Time & Stylist */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="salon-label flex items-center gap-1">
              <Calendar size={13} className="text-[#d4af37]" /> Visit Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="salon-input"
            />
          </div>

          <div>
            <label className="salon-label flex items-center gap-1">
              <Clock size={13} className="text-[#d4af37]" /> Visit Time
            </label>
            <input
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="10:30 AM"
              className="salon-input"
            />
          </div>

          <div>
            <label className="salon-label flex items-center gap-1">
              <Scissors size={13} className="text-[#d4af37]" /> Assigned Stylist / Barber
            </label>
            <select
              value={stylist}
              onChange={(e) => setStylist(e.target.value)}
              className="salon-input"
            >
              {employees.length > 0 ? (
                employees.map((emp, i) => {
                  const empName = emp['Employee Name'] || emp.name || `Stylist ${i + 1}`;
                  const empRole = emp['Role'] || emp.role || 'Barber';
                  return (
                    <option key={i} value={empName}>
                      {empName} ({empRole})
                    </option>
                  );
                })
              ) : (
                <>
                  <option value="Sameer Khan">Sameer Khan (Master Barber)</option>
                  <option value="Arjun Das">Arjun Das (Senior Stylist)</option>
                  <option value="Rohan Sharma">Rohan Sharma (Beard Specialist)</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Section 3: Services Selection */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#d4af37] flex items-center gap-2">
              <Sparkles size={15} /> 2. Selected Services ({selectedServices.length})
            </h3>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {categoriesList.map(cat => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setServiceCategoryFilter(cat)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                    serviceCategoryFilter === cat
                      ? 'bg-[#d4af37] text-black font-bold border-[#d4af37]'
                      : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
                  }`}
                >
                  {cat}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setShowCustomService(!showCustomService)}
                className="text-xs px-2.5 py-1 rounded-lg border border-[#d4af37]/40 text-[#f5cf68] hover:bg-[#d4af37]/10 flex items-center gap-1"
              >
                <Plus size={12} /> Custom
              </button>
            </div>
          </div>

          {/* Custom Service Drawer if open */}
          {showCustomService && (
            <div className="mb-4 p-4 rounded-xl bg-[#141824] border border-[#d4af37]/30 animate-slide-up flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Custom Service (e.g. Beard Detan + Steam)"
                value={customServiceName}
                onChange={(e) => setCustomServiceName(e.target.value)}
                className="salon-input flex-1 min-w-[200px]"
              />
              <div className="relative w-36">
                <input
                  type="number"
                  placeholder="Price (₹)"
                  value={customServicePrice}
                  onChange={(e) => setCustomServicePrice(e.target.value)}
                  className="salon-input pl-8"
                />
                <span className="absolute left-3 top-3 text-gray-400 text-xs">₹</span>
              </div>
              <button
                type="button"
                onClick={handleAddCustomService}
                className="btn-gold py-2 px-4 text-xs"
              >
                Add Item
              </button>
            </div>
          )}

          {/* Services Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-h-80 overflow-y-auto pr-1">
            {filteredServices.map((service) => {
              const isSelected = selectedServices.some(s => s.id === service.id);
              return (
                <div
                  key={service.id}
                  onClick={() => toggleService(service)}
                  className={`service-chip ${isSelected ? 'selected' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-white leading-tight">
                      {service.name}
                    </span>
                    {isSelected && (
                      <span className="text-[#f5cf68] shrink-0">
                        <BadgeCheck size={16} />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3 text-[11px] text-gray-400 border-t border-white/5 pt-2">
                    <span className="text-xs font-mono font-bold text-[#f5cf68]">₹{service.price}</span>
                    <span>{service.durationMin} mins</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Currently Selected Service Chips preview */}
          {selectedServices.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-xs text-gray-400 font-medium">Selected:</span>
              {selectedServices.map(s => (
                <span
                  key={s.id}
                  className="text-xs bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#f5cf68] px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                >
                  {s.name} (₹{s.price})
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleService(s);
                    }}
                    className="hover:text-white font-bold ml-1"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: Payment, Billing & Preferences */}
        <div className="pt-2 border-t border-white/10">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#d4af37] mb-4 flex items-center gap-2">
            <CreditCard size={15} /> 3. Payment & Billing Calculation
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Payment Mode & Preferences */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <label className="salon-label">Payment Method</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PAYMENT_METHODS.map(method => (
                    <button
                      type="button"
                      key={method}
                      onClick={() => setPaymentMethod(method as any)}
                      className={`p-2.5 text-xs rounded-xl font-medium border text-center transition-all ${
                        paymentMethod === method
                          ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#f5cf68] font-bold shadow-[0_0_12px_rgba(212,175,55,0.2)]'
                          : 'bg-white/[0.03] border-white/10 text-gray-300 hover:border-white/25'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes / Grooming Preferences */}
              <div>
                <label className="salon-label flex items-center gap-1">
                  <FileText size={13} className="text-[#d4af37]" /> Hair / Beard Preference & Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Fade guard #2 on side, keep mustache thick, skin sensitive to aftershave..."
                  className="salon-input text-xs"
                />
              </div>
            </div>

            {/* Bill Calculation Box */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-[#121622] border border-[#d4af37]/30 space-y-3">
              <div className="flex justify-between text-xs text-gray-300">
                <span>Subtotal ({selectedServices.length} items):</span>
                <span className="font-mono font-semibold">₹{subtotal}</span>
              </div>

              {/* Discount */}
              <div className="flex items-center justify-between text-xs text-gray-300">
                <span className="flex items-center gap-1">
                  <Tag size={12} className="text-[#f5cf68]" /> Discount (₹):
                </span>
                <div className="w-24">
                  <input
                    type="number"
                    min="0"
                    max={subtotal}
                    value={discount || ''}
                    onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="0"
                    className="salon-input py-1 px-2 text-right font-mono text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-baseline justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider text-gray-400 font-bold block">Final Amount:</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Syncs to Google Sheets</span>
                </div>
                <div className="text-2xl font-black font-mono text-[#f5cf68] text-right">
                  ₹{finalAmount}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Connected to Beard Lounge Google Apps Script
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="btn-gold py-3 px-8 text-sm"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Saving to Google Sheets...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} /> Save Visit & Sync to Spreadsheet
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
