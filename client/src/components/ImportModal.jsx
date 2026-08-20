import React, { useState } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle, Brain, Terminal, Layers } from 'lucide-react';
import api from '../services/api';
import useToast from '../hooks/useToast';

export const ImportModal = ({
  isOpen,
  onClose,
  activeProjectId,
  projects = [],
  onImportComplete,
  isDark = true
}) => {
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [step, setStep] = useState(1); // 1: Select File, 2: Column Mapping, 3: Destination Selector
  const [columnMap, setColumnMap] = useState({
    externalId: '',
    summary: '',
    steps: '',
    expectedResult: '',
    priority: '',
    module: ''
  });
  const [importDestination, setImportDestination] = useState('workload'); // 'workload' | 'lab'
  const [targetProjectId, setTargetProjectId] = useState(activeProjectId || '');
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);

    // Read file header preview
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.split('\n').filter(Boolean);
        if (lines.length > 0) {
          const firstLine = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
          setHeaders(firstLine);
          // Pre-populate column mappings if names match
          const newMap = { ...columnMap };
          firstLine.forEach((h) => {
            const lower = h.toLowerCase();
            if (lower.includes('id') || lower.includes('key')) newMap.externalId = h;
            if (lower.includes('title') || lower.includes('summary') || lower.includes('name')) newMap.summary = h;
            if (lower.includes('step') || lower.includes('action')) newMap.steps = h;
            if (lower.includes('expected') || lower.includes('result')) newMap.expectedResult = h;
            if (lower.includes('prio')) newMap.priority = h;
            if (lower.includes('module') || lower.includes('tab') || lower.includes('feature')) newMap.module = h;
          });
          setColumnMap(newMap);
          setRows(lines.slice(1));
          setStep(2);
        }
      } catch (err) {
        toast.error('Failed to parse file header.');
      }
    };
    reader.readAsText(selected);
  };

  const handleConfirmImport = async () => {
    if (!columnMap.summary) {
      toast.warning('Please map at least the "Test Case Title / Summary" column.');
      return;
    }
    setUploading(true);
    try {
      const parsedCases = rows.map((line, idx) => {
        const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
        const getVal = (colName) => {
          const colIdx = headers.indexOf(colName);
          return colIdx >= 0 ? cols[colIdx] || '' : '';
        };

        return {
          key: getVal(columnMap.externalId) || `IMP_${Date.now()}_${idx}`,
          summary: getVal(columnMap.summary) || `Imported Scenario ${idx + 1}`,
          steps: getVal(columnMap.steps) || '1. Perform test action',
          expectedResult: getVal(columnMap.expectedResult) || 'Expected behavior observed',
          priority: getVal(columnMap.priority)?.toUpperCase() || 'MEDIUM',
          module: getVal(columnMap.module) || 'Imported',
          status: 'UNEXECUTED'
        };
      });

      const projectId = targetProjectId || activeProjectId;

      if (importDestination === 'workload') {
        await api.post('/test-cases/batch', { projectId, testCases: parsedCases });
        toast.success(`Imported ${parsedCases.length} scenarios into workload!`);
      } else {
        toast.success(`Loaded ${parsedCases.length} scenarios into Scenario Lab!`);
      }

      if (onImportComplete) {
        onImportComplete(parsedCases, importDestination);
      }

      onClose();
      setStep(1);
      setFile(null);
    } catch (err) {
      toast.error('Import failed. Please verify file format.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className={`w-full max-w-xl p-6 rounded-3xl border-2 shadow-2xl ${
        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
      }`}>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black">Import Excel / CSV Scenarios</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Bulk import test cases from Excel spreadsheet or CSV exports
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Select File */}
        {step === 1 && (
          <div className="space-y-4">
            <label className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDark ? 'border-slate-700 hover:border-indigo-500 bg-slate-800/40' : 'border-slate-300 hover:border-indigo-500 bg-slate-50'
            }`}>
              <Upload className="w-10 h-10 text-indigo-400 mb-3 animate-bounce" />
              <span className="font-bold text-sm">Click or Drag Excel / CSV File Here</span>
              <span className="text-xs opacity-60 mt-1">Supports .csv, .xlsx, .xls exports</span>
              <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === 2 && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="text-xs font-semibold text-indigo-400 flex items-center gap-2">
              <Brain className="w-4 h-4" /> AI Column Mapper — Select header columns for import
            </div>

            {[
              { field: 'externalId', label: 'Test Case ID / Key', req: false },
              { field: 'summary', label: 'Test Case Title / Summary', req: true },
              { field: 'steps', label: 'Test Action Steps', req: false },
              { field: 'expectedResult', label: 'Expected Behavior', req: false },
              { field: 'priority', label: 'Priority Column', req: false },
              { field: 'module', label: 'Module / Feature Tag', req: false },
            ].map(({ field, label, req }) => (
              <div key={field} className="space-y-1">
                <label className="block text-xs font-bold uppercase opacity-70">
                  {label} {req && <span className="text-rose-400">*</span>}
                </label>
                <select
                  value={columnMap[field]}
                  onChange={(e) => setColumnMap({ ...columnMap, [field]: e.target.value })}
                  className={`w-full px-3 py-2 text-sm rounded-xl border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  <option value="">-- Select Column --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}

            <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
              <button onClick={() => setStep(1)} className="px-4 py-2 text-sm font-semibold hover:bg-white/10 rounded-xl">
                Back
              </button>
              <button onClick={() => setStep(3)} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-md">
                Next: Select Destination
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Destination Selector */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider opacity-70">Select Destination</label>

              <div
                onClick={() => setImportDestination('workload')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  importDestination === 'workload'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-slate-800/40 border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input type="radio" checked={importDestination === 'workload'} onChange={() => setImportDestination('workload')} />
                  <div>
                    <p className="font-bold text-sm">Import directly to Active Workload</p>
                    <p className="text-xs opacity-70">Saves test cases directly to database for execution tracking.</p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setImportDestination('lab')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  importDestination === 'lab'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-slate-800/40 border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input type="radio" checked={importDestination === 'lab'} onChange={() => setImportDestination('lab')} />
                  <div>
                    <p className="font-bold text-sm">Import to Scenario Lab for Editing</p>
                    <p className="text-xs opacity-70">Loads test cases into Scenario Lab as editable drafts.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button onClick={() => setStep(2)} className="px-4 py-2 text-sm font-semibold hover:bg-white/10 rounded-xl">
                Back
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={uploading}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-md disabled:opacity-50"
              >
                {uploading ? 'Importing...' : 'Confirm & Complete Import'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportModal;
