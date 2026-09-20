'use client';

import React, { useState } from 'react';
import { 
  History, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  Download, 
  Trash2, 
  User, 
  Phone, 
  Calendar, 
  CreditCard,
  IndianRupee,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { VisitData } from '@/types/salon';
import { deleteVisit } from '@/lib/salonApi';

interface HistoryListProps {
  visits: VisitData[];
  loading: boolean;
  onRefresh: () => void;
  onVisitDeleted: (billNo: string) => void;
  spreadsheetUrl: string;
}

export const HistoryList: React.FC<HistoryListProps> = ({ 
  visits, 
  loading, 
  onRefresh, 
  onVisitDeleted, 
  spreadsheetUrl 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today'>('all');
  const [deletingBillNo, setDeletingBillNo] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState('');

  const todayStr = new Date().toISOString().substring(0, 10);

  const filteredVisits = visits.filter(v => {
    const name = (v['Customer Name'] || '').toLowerCase();
    const phone = (v['Phone Number'] || '').toLowerCase();
    const bill = (v['Bill No'] || '').toLowerCase();
    const services = (v['Services'] || '').toLowerCase();
    const stylist = (v['Stylist / Barber'] || '').toLowerCase();
    const q = searchTerm.toLowerCase();

    const matchesSearch = name.includes(q) || phone.includes(q) || bill.includes(q) || services.includes(q) || stylist.includes(q);

    if (!matchesSearch) return false;

    if (dateFilter === 'today') {
      const visitDate = (v['Date'] || '').substring(0, 10);
      return visitDate === todayStr;
    }

    return true;
  });

  const handleDelete = async (billNo: string) => {
    if (!confirm(`Are you sure you want to delete bill #${billNo} from Google Sheets?`)) {
      return;
    }

    setDeletingBillNo(billNo);
    setActionMsg('');

    try {
      const res = await deleteVisit(billNo);
      if (res.success) {
        onVisitDeleted(billNo);
        setActionMsg(`Bill #${billNo} deleted successfully.`);
        setTimeout(() => setActionMsg(''), 4000);
      } else {
        alert(res.error || 'Failed to delete record from Google Sheets.');
      }
    } catch (e: any) {
      alert(e.message || 'Error communicating with Google Sheets');
    } finally {
      setDeletingBillNo(null);
    }
  };

  const exportToCSV = () => {
    if (filteredVisits.length === 0) return;

    const headers = ["Bill No", "Date", "Time", "Customer Name", "Phone Number", "Services", "Stylist", "Payment Method", "Final Amount (₹)", "Status"];
    const rows = filteredVisits.map(v => [
      `"${v['Bill No'] || ''}"`,
      `"${v['Date'] || ''}"`,
      `"${v['Time'] || ''}"`,
      `"${v['Customer Name'] || ''}"`,
      `"${v['Phone Number'] || ''}"`,
      `"${(v['Services'] || '').replace(/"/g, '""')}"`,
      `"${v['Stylist / Barber'] || ''}"`,
      `"${v['Payment Method'] || ''}"`,
      v['Final Amount (₹)'] || v['Total Amount (₹)'] || 0,
      `"${v['Status'] || 'Completed'}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Beard_Lounge_Visits_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate stats for current view
  const totalRevenue = filteredVisits.reduce((acc, v) => acc + (Number(v['Final Amount (₹)']) || Number(v['Total Amount (₹)']) || 0), 0);

  return (
    <div className="salon-card p-6 md:p-8 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#d4af37]/10 text-[#f5cf68]">
              <History size={18} />
            </span>
            <h2 className="text-xl font-bold text-white tracking-wide">Live Visit Records & Sync Feed</h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Displaying {filteredVisits.length} of {visits.length} records fetched from Google Sheets
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="btn-secondary py-2 px-3 text-xs"
            title="Reload from Google Sheets"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-[#f5cf68]' : ''} />
            {loading ? 'Fetching...' : 'Sync Now'}
          </button>

          <button
            type="button"
            onClick={exportToCSV}
            disabled={filteredVisits.length === 0}
            className="btn-secondary py-2 px-3 text-xs"
          >
            <Download size={14} /> Export CSV
          </button>

          {spreadsheetUrl && (
            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-gold py-2 px-3.5 text-xs inline-flex items-center gap-1.5"
            >
              Open Google Sheet <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 size={15} /> {actionMsg}
        </div>
      )}

      {/* Filter Toolbar & Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={15} className="absolute left-3.5 top-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer, phone, bill no, stylist..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="salon-input pl-10 py-2.5 text-xs bg-[#11141c]"
          />
        </div>

        {/* Date Filter Pills */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDateFilter('all')}
            className={`text-xs px-3 py-2 rounded-lg border transition-all ${
              dateFilter === 'all'
                ? 'bg-[#d4af37] text-black font-bold border-[#d4af37]'
                : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
            }`}
          >
            All Dates ({visits.length})
          </button>
          <button
            type="button"
            onClick={() => setDateFilter('today')}
            className={`text-xs px-3 py-2 rounded-lg border transition-all ${
              dateFilter === 'today'
                ? 'bg-[#d4af37] text-black font-bold border-[#d4af37]'
                : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
            }`}
          >
            Today Only
          </button>
        </div>

        {/* Mini Revenue Sum */}
        <div className="px-4 py-2 rounded-xl bg-[#121620] border border-[#d4af37]/30 text-right">
          <span className="text-[10px] text-gray-400 uppercase font-mono block">Filtered Revenue</span>
          <span className="text-base font-bold font-mono text-[#f5cf68]">₹{totalRevenue.toLocaleString()}</span>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="salon-table">
          <thead>
            <tr>
              <th>Bill No</th>
              <th>Date & Time</th>
              <th>Customer</th>
              <th>Stylist</th>
              <th>Services</th>
              <th>Payment</th>
              <th>Amount (₹)</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredVisits.length > 0 ? (
              filteredVisits.map((v, i) => {
                const bill = v['Bill No'] || `BL-${i + 1000}`;
                const name = v['Customer Name'] || 'Walk-in Guest';
                const phone = v['Phone Number'] || '';
                const date = v['Date'] || '';
                const time = v['Time'] || '';
                const stylist = v['Stylist / Barber'] || 'Stylist';
                const services = v['Services'] || 'Haircut';
                const payment = v['Payment Method'] || 'Cash';
                const amount = v['Final Amount (₹)'] || v['Total Amount (₹)'] || 0;

                return (
                  <tr key={i} className="group">
                    {/* Bill No */}
                    <td>
                      <span className="font-mono font-bold text-xs text-[#f5cf68] bg-[#d4af37]/10 px-2 py-1 rounded border border-[#d4af37]/30">
                        {bill}
                      </span>
                    </td>

                    {/* Date & Time */}
                    <td className="text-xs text-gray-300">
                      <div>{date}</div>
                      <div className="text-[11px] text-gray-500">{time}</div>
                    </td>

                    {/* Customer */}
                    <td>
                      <div className="font-semibold text-white text-xs">{name}</div>
                      {phone && (
                        <div className="text-[11px] text-gray-400 font-mono">
                          {phone}
                        </div>
                      )}
                    </td>

                    {/* Stylist */}
                    <td className="text-xs text-gray-300">
                      <span className="font-medium text-[#d4af37]">{stylist}</span>
                    </td>

                    {/* Services */}
                    <td className="max-w-xs">
                      <p className="text-xs text-gray-200 line-clamp-2" title={services}>
                        {services}
                      </p>
                    </td>

                    {/* Payment */}
                    <td>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-300">
                        {payment}
                      </span>
                    </td>

                    {/* Amount */}
                    <td>
                      <span className="font-mono font-bold text-sm text-[#f5cf68]">
                        ₹{amount}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(bill)}
                        disabled={deletingBillNo === bill}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete record from sheet"
                      >
                        {deletingBillNo === bill ? (
                          <RefreshCw size={14} className="animate-spin text-red-400" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-500 text-xs">
                  {loading ? (
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw size={24} className="animate-spin text-[#d4af37]" />
                      <span>Syncing records with Google Sheets...</span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold text-gray-400">No salon visits recorded yet.</p>
                      <p className="text-xs mt-1">Use the &apos;New Client Visit&apos; tab above to submit the first service entry!</p>
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
