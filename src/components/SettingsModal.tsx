'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  ExternalLink, 
  Check, 
  Copy, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  FileCode2,
  Lock
} from 'lucide-react';
import { getScriptUrl, setCustomScriptUrl, getSpreadsheetUrl, setSpreadsheetUrl, fetchVisits } from '@/lib/salonApi';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onConfigSaved }) => {
  const [scriptUrl, setScriptUrlInput] = useState('');
  const [sheetUrl, setSheetUrlInput] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [copiedScript, setCopiedScript] = useState(false);
  const [showScriptCode, setShowScriptCode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setScriptUrlInput(getScriptUrl());
      setSheetUrlInput(getSpreadsheetUrl());
      setTestStatus('idle');
      setTestMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setCustomScriptUrl(scriptUrl);
    setSpreadsheetUrl(sheetUrl);
    if (onConfigSaved) onConfigSaved();
    onClose();
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('Pinging Google Apps Script endpoint...');
    try {
      // Temporarily save to test
      setCustomScriptUrl(scriptUrl);
      const res = await fetchVisits();
      if (res.success || Array.isArray(res.visits)) {
        setTestStatus('success');
        setTestMessage(`Connected successfully! Found ${res.visits ? res.visits.length : 0} existing visit entries.`);
      } else {
        setTestStatus('error');
        setTestMessage(res.error || 'Connection failed. Ensure script is deployed with "Anyone" access.');
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(err.message || 'Failed to reach Google Script.');
    }
  };

  const sampleScriptCode = `// Beard Lounge Premium Salon - Google Apps Script
const SHEET_NAME = "Visits";
const EMPLOYEES_SHEET_NAME = "Employees";
const USERS_SHEET_NAME = "Users";
const HEADER_ROW = 1;
const ID_COLUMN = "Bill No";

function doGet(e) {
  return jsonResponse(getAllVisits());
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const action = body.action;
  if (action === "login") return jsonResponse(checkLogin(body.username, body.password));
  if (action === "getEmployees") return jsonResponse(getEmployees());
  if (action === "addVisit") return jsonResponse(addVisit(body.data));
  if (action === "updateVisit") return jsonResponse(updateVisit(body.billNo, body.data));
  if (action === "deleteVisit") return jsonResponse(deleteVisit(body.billNo));
  if (action === "addEmployee") return jsonResponse(addEmployee(body.data));
  return jsonResponse({ success: false, error: "Unknown action" });
}`;

  const copyScriptCode = () => {
    navigator.clipboard.writeText(sampleScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="modal-overlay">
      <div className="salon-card animate-slide-up w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 relative">
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#f5cf68]">
            <Database size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Google Sheets Integration</h2>
            <p className="text-xs text-gray-400">Configure Webhook & Direct Spreadsheet Access</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Script URL */}
          <div>
            <label className="salon-label flex items-center justify-between">
              <span>Google Apps Script Web App URL</span>
              <span className="text-[11px] text-[#f5cf68] font-normal">Active Sync Endpoint</span>
            </label>
            <input 
              type="text" 
              className="salon-input font-mono text-xs" 
              value={scriptUrl} 
              onChange={(e) => setScriptUrlInput(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Data entered in customer and employee forms is posted to this URL and appended to your Google Sheet.
            </p>
          </div>

          {/* Direct Spreadsheet URL */}
          <div>
            <label className="salon-label flex items-center justify-between">
              <span>Direct Google Spreadsheet URL</span>
              {sheetUrl && (
                <a 
                  href={sheetUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-xs text-[#f5cf68] hover:underline flex items-center gap-1"
                >
                  Open Sheet <ExternalLink size={12} />
                </a>
              )}
            </label>
            <input 
              type="text" 
              className="salon-input font-mono text-xs" 
              value={sheetUrl} 
              onChange={(e) => setSheetUrlInput(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/.../edit"
            />
          </div>

          {/* Test Connection Button */}
          <div className="pt-2">
            <div className="flex flex-wrap items-center gap-3">
              <button 
                type="button"
                onClick={handleTestConnection} 
                disabled={testStatus === 'testing'}
                className="btn-secondary text-xs py-2 px-3"
              >
                <RefreshCw size={14} className={testStatus === 'testing' ? 'animate-spin text-[#f5cf68]' : ''} />
                {testStatus === 'testing' ? 'Testing Connection...' : 'Test Sheet Connection'}
              </button>

              <button
                type="button"
                onClick={() => setShowScriptCode(!showScriptCode)}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10"
              >
                <FileCode2 size={14} className="text-[#f5cf68]" />
                {showScriptCode ? 'Hide Code.gs' : 'View Code.gs Script'}
              </button>
            </div>

            {testStatus === 'success' && (
              <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{testMessage}</span>
              </div>
            )}

            {testStatus === 'error' && (
              <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{testMessage}</span>
              </div>
            )}
          </div>

          {/* Script Code Viewer */}
          {showScriptCode && (
            <div className="mt-4 p-4 rounded-xl bg-[#090b0f] border border-white/10 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 font-mono">Google Apps Script (Code.gs)</span>
                <button 
                  onClick={copyScriptCode}
                  className="btn-secondary py-1 px-2.5 text-xs text-[#f5cf68] border-[#f5cf68]/40"
                >
                  {copiedScript ? <Check size={12} /> : <Copy size={12} />}
                  {copiedScript ? 'Copied' : 'Copy Script'}
                </button>
              </div>
              <pre className="text-gray-300 font-mono text-[11px] overflow-x-auto max-h-48 p-2 rounded bg-black/40">
                {sampleScriptCode}
              </pre>
            </div>
          )}

          {/* Default Credentials Reference */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 flex items-start gap-3">
            <Lock size={16} className="text-[#f5cf68] mt-0.5 shrink-0" />
            <div className="text-xs text-gray-300">
              <span className="font-semibold text-white">Default Admin Credentials:</span>
              <div className="mt-1 flex gap-4 font-mono text-gray-400">
                <span>Username: <strong className="text-[#f5cf68]">beardlounge</strong></span>
                <span>Password: <strong className="text-[#f5cf68]">Beard@123</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-white/10">
          <button 
            type="button" 
            onClick={onClose} 
            className="btn-secondary text-sm py-2 px-4"
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleSave} 
            className="btn-gold text-sm py-2 px-5"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
