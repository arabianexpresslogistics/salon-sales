'use client';

import React, { useState, useEffect } from 'react';
import { 
  Scissors, 
  User, 
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
  BadgeCheck
} from 'lucide-react';
import { VisitData, EmployeeData, SalonServiceItem } from '@/types/salon';
import { SALON_SERVICES, SERVICE_CATEGORIES, PAYMENT_METHODS, CUSTOMER_CATEGORIES } from '@/lib/constants';
import { addVisit } from '@/lib/salonApi';

interface CustomerFormProps {
  employees: EmployeeData[];
  onSuccess: (newVisit: VisitData) => void;
  spreadsheetUrl: string;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({ employees, onSuccess, spreadsheetUrl }) => {
  const generateBillNo = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `BL-${randomSuffix}`;
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
  const [paymentMethod, setPaymentMethod] = useState<VisitData['Payment Method']>('KNet');
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

  useEffect(() => {
    if (employees.length > 0 && !stylist) {
      setStylist(employees[0]['Employee Name'] || employees[0].name || '');
    }
  }, [employees, stylist]);

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
      category: 'Other',
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
    if (selectedServices.length === 0) {
      setErrorMsg('Please select at least one service.');
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
      "Service": servicesText,
      "Services": servicesText,
      "Employee Name": stylist,
      "Stylist / Barber": stylist,
      "Created By": stylist,
      "Payment Method": paymentMethod,
      "Amount": finalAmount,
      "Total Amount (KD)": subtotal,
      "Discount (KD)": discount,
      "Final Amount (KD)": finalAmount,
      "Note": notes.trim(),
      "Status": status,
      "Timestamp": new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    try {
      const res = await addVisit(visitPayload);
      if (res.success || res.billNo) {
        onSuccess(visitPayload);
        setSuccessToast(true);

        setBillNo(generateBillNo());
        setTime(getCurrentTime());
        setCustomerName('');
        setPhoneNumber('');
        setSelectedServices([SALON_SERVICES[0]]);
        setDiscount(0);
        setNotes('');

        setTimeout(() => setSuccessToast(false), 4000);
      } else {
        setErrorMsg(res.error || 'Failed to submit visit to Google Sheets.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with Google Apps Script.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredServices = serviceCategoryFilter === 'All' 
    ? SALON_SERVICES 
    : SALON_SERVICES.filter(s => s.category === serviceCategoryFilter);

  return (
    <div className="space-y-4">
      {successToast && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>Visit saved and synced to Google Sheets (#{billNo})</span>
          </div>
          {spreadsheetUrl && (
            <a href={spreadsheetUrl} target="_blank" rel="noreferrer" className="underline ml-2">
              View Sheet &rarr;
            </a>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-[#111622] border border-white/10 rounded-xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/5 text-xs">
          <span className="font-semibold text-white">Client Visit Entry</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-mono">Bill #{billNo}</span>
            <button 
              type="button" 
              onClick={() => setBillNo(generateBillNo())}
              className="text-gray-400 hover:text-white"
            >
              <RefreshCw size={11} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">Customer Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. John Doe"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#0b0f17] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          <div>
            <label className="block text-[11px] text-gray-400 mb-1">Phone Number</label>
            <input
              type="tel"
              placeholder="e.g. 98765432"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#0b0f17] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          <div>
            <label className="block text-[11px] text-gray-400 mb-1">Staff / Barber</label>
            <select
              value={stylist}
              onChange={(e) => setStylist(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#0b0f17] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#d4af37]"
            >
              {employees.map((emp, i) => (
                <option key={i} value={emp['Employee Name'] || emp.name}>
                  {emp['Employee Name'] || emp.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Services Selection */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white">Select Services ({selectedServices.length})</span>
            <button
              type="button"
              onClick={() => setShowCustomService(!showCustomService)}
              className="text-[11px] text-[#f5cf68] hover:underline flex items-center gap-1"
            >
              <Plus size={11} /> Custom Item
            </button>
          </div>

          <div className="flex flex-wrap gap-1 pb-1">
            {SERVICE_CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setServiceCategoryFilter(cat)}
                className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${
                  serviceCategoryFilter === cat
                    ? 'bg-white/20 text-white font-medium'
                    : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {showCustomService && (
            <div className="p-2.5 rounded-lg bg-[#0b0f17] border border-[#d4af37]/30 flex gap-2 items-center">
              <input
                type="text"
                placeholder="Service Name"
                value={customServiceName}
                onChange={(e) => setCustomServiceName(e.target.value)}
                className="flex-1 px-2.5 py-1.5 text-xs bg-[#111622] border border-white/10 rounded text-white"
              />
              <input
                type="number"
                placeholder="KD"
                step="0.5"
                value={customServicePrice}
                onChange={(e) => setCustomServicePrice(e.target.value)}
                className="w-20 px-2.5 py-1.5 text-xs bg-[#111622] border border-white/10 rounded text-white font-mono"
              />
              <button
                type="button"
                onClick={handleAddCustomService}
                className="px-3 py-1.5 bg-[#d4af37] text-black text-xs font-semibold rounded"
              >
                Add
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto pr-1">
            {filteredServices.map((service) => {
              const isSelected = selectedServices.some(s => s.id === service.id);
              return (
                <div
                  key={service.id}
                  onClick={() => toggleService(service)}
                  className={`p-2.5 rounded-lg border cursor-pointer select-none text-xs flex justify-between items-center transition-colors ${
                    isSelected
                      ? 'bg-[#d4af37]/15 border-[#d4af37] text-white'
                      : 'bg-[#0b0f17] border-white/5 text-gray-300 hover:border-white/20'
                  }`}
                >
                  <span className="truncate pr-1">{service.name}</span>
                  <span className="font-mono font-semibold text-[#f5cf68] shrink-0">
                    {service.price} KD
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment & Summary */}
        <div className="pt-2 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">Payment Method</label>
            <div className="grid grid-cols-3 gap-1">
              {PAYMENT_METHODS.map(method => (
                <button
                  type="button"
                  key={method}
                  onClick={() => setPaymentMethod(method as any)}
                  className={`py-1.5 px-1 text-[11px] rounded transition-colors text-center ${
                    paymentMethod === method
                      ? 'bg-[#d4af37] text-black font-semibold'
                      : 'bg-[#0b0f17] text-gray-400 hover:text-white border border-white/5'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4">
            <div className="text-right">
              <span className="text-[11px] text-gray-400 block">Total Amount</span>
              <span className="text-lg font-bold font-mono text-[#f5cf68]">{finalAmount} KD</span>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="py-2.5 px-5 bg-[#d4af37] hover:bg-[#c49f27] text-black text-xs font-semibold rounded-lg transition-colors disabled:opacity-40"
            >
              {submitting ? 'Saving...' : 'Submit Entry'}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {errorMsg}
          </div>
        )}
      </form>
    </div>
  );
};

