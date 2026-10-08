import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Upload, Code, Shield, X, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { contractAPI } from '../services/api.js';
import toast from 'react-hot-toast';
import { ButtonSpinner, Spinner } from '../components/common/Spinner.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

const SAMPLE_CONTRACT = `// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

contract VulnerableBank {
    mapping(address => uint256) public balances;
    address public owner;

    constructor() {
        owner = tx.origin;
    }

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        // Vulnerability: state update after external call (reentrancy)
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        balances[msg.sender] -= amount;
    }

    function getRandomNumber() public view returns (uint256) {
        // Vulnerability: weak randomness
        return uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty)));
    }

    function emergencyWithdraw() public {
        // Vulnerability: missing access control
        selfdestruct(payable(msg.sender));
    }

    function approve(address spender, uint256 amount) public {
        // Vulnerability: front-running
        balances[spender] = amount;
    }
}`;

export default function Scanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const [tab, setTab] = useState('editor');
  const [code, setCode] = useState('');
  const [contractName, setContractName] = useState('');
  const [fileName, setFileName] = useState('');
  const [file, setFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanId, setScanId] = useState(null);
  const [scanStatus, setScanStatus] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Prefill from Template Library ("Scan this")
  useEffect(() => {
    const st = location.state;
    if (st?.code) {
      setCode(st.code);
      if (st.name) setContractName(st.name);
      toast.success('Template loaded into the editor');
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const pollRef = useRef(null);

  const pollScanStatus = useCallback((id) => {
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const { data } = await contractAPI.getStatus(id);
        setScanStatus(data.scan.status);

        if (data.scan.status === 'completed') {
          clearInterval(pollRef.current);
          setScanning(false);
          toast.success('Analysis complete!');
          navigate(`/scan/${id}`);
        } else if (data.scan.status === 'failed') {
          clearInterval(pollRef.current);
          setScanning(false);
          toast.error('Scan failed: ' + (data.scan.errorMessage || 'Unknown error'));
        } else if (attempts > 120) {
          clearInterval(pollRef.current);
          setScanning(false);
          toast.error('Scan timed out');
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }, 2000);
  }, [navigate]);

  const handleScan = async () => {
    const sourceCode = tab === 'editor' ? code : null;

    if (tab === 'editor' && !code.trim()) {
      toast.error('Please enter Solidity code');
      return;
    }
    if (tab === 'upload' && !file) {
      toast.error('Please upload a .sol file');
      return;
    }
    if (!contractName.trim()) {
      toast.error('Please enter a contract name');
      return;
    }

    setScanning(true);
    setScanStatus('pending');

    try {
      let response;
      if (tab === 'upload' && file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('contractName', contractName);
        response = await contractAPI.scan(formData);
      } else {
        response = await contractAPI.scan({ sourceCode, contractName, fileName: fileName || 'contract.sol' });
      }

      const id = response.data.scanId;
      setScanId(id);
      pollScanStatus(id);
    } catch (err) {
      setScanning(false);
      toast.error(err.response?.data?.message || 'Scan failed to start');
    }
  };

  const handleFile = (f) => {
    if (!f.name.endsWith('.sol')) {
      toast.error('Only .sol files are supported');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('File too large (max 5MB)');
      return;
    }
    setFile(f);
    setFileName(f.name);
    if (!contractName) setContractName(f.name.replace('.sol', ''));

    const reader = new FileReader();
    reader.onload = (e) => setCode(e.target.result);
    reader.readAsText(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const loadSample = () => {
    setCode(SAMPLE_CONTRACT);
    setContractName('VulnerableBank');
    toast.success('Sample contract loaded — it contains intentional vulnerabilities for demo purposes');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Scan Smart Contract</h2>
        <p className="text-muted mt-1">Upload or paste your Solidity contract for AI-powered vulnerability analysis</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <div className="card">
            <div className="flex border-b border-surface-200 dark:border-surface-700">
              <button
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'editor' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-muted hover:text-surface-700 dark:hover:text-surface-300'}`}
                onClick={() => setTab('editor')}
              >
                <Code className="w-4 h-4" />
                Code Editor
              </button>
              <button
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'upload' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-muted hover:text-surface-700 dark:hover:text-surface-300'}`}
                onClick={() => setTab('upload')}
              >
                <Upload className="w-4 h-4" />
                Upload File
              </button>
            </div>

            {tab === 'editor' ? (
              <div>
                <div className="flex items-center justify-between px-4 py-2 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                  <span className="text-xs font-mono text-muted">contract.sol</span>
                  <div className="flex items-center gap-2">
                    <button onClick={loadSample} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                      Load sample
                    </button>
                    {code && (
                      <button onClick={() => setCode('')} className="text-xs text-muted hover:text-danger-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <Editor
                  height="480px"
                  language="sol"
                  theme={isDark ? 'vs-dark' : 'light'}
                  value={code}
                  onChange={(val) => setCode(val || '')}
                  options={{
                    fontSize: 13,
                    fontFamily: 'JetBrains Mono, Fira Code, monospace',
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    lineNumbers: 'on',
                    renderLineHighlight: 'line',
                    padding: { top: 16, bottom: 16 },
                    tabSize: 2,
                    wordWrap: 'on',
                  }}
                />
              </div>
            ) : (
              <div className="p-6">
                <div
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                    dragging
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
                      : 'border-surface-300 dark:border-surface-600 hover:border-primary-400 hover:bg-surface-50 dark:hover:bg-surface-700/30'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" accept=".sol" className="hidden" onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
                  {file ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-900/30 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
                      </div>
                      <div>
                        <p className="font-medium text-surface-900 dark:text-surface-100">{file.name}</p>
                        <p className="text-sm text-muted">{(file.size / 1024).toFixed(1)} KB — Click to change</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setFile(null); setFileName(''); setCode(''); }} className="text-xs text-danger-600 hover:text-danger-700">
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <Upload className="w-10 h-10 text-surface-400" />
                      <div>
                        <p className="font-medium text-surface-700 dark:text-surface-300">Drop your .sol file here</p>
                        <p className="text-sm text-muted mt-1">or click to browse — max 5MB</p>
                      </div>
                    </div>
                  )}
                </div>

                {code && tab === 'upload' && (
                  <div className="mt-4 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                    <p className="text-xs font-mono text-muted">{code.split('\n').length} lines detected</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-4">Scan Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Contract Name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. MyToken"
                  value={contractName}
                  onChange={(e) => setContractName(e.target.value)}
                />
              </div>
              {tab === 'editor' && (
                <div>
                  <label className="label">File Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="contract.sol"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleScan}
              disabled={scanning}
              className="btn-primary w-full justify-center py-3 mt-5 text-base"
            >
              {scanning ? (
                <>
                  <ButtonSpinner />
                  {scanStatus === 'scanning' ? 'Analyzing...' : 'Starting scan...'}
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Analyze Contract
                </>
              )}
            </button>

            {scanning && (
              <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Spinner size="sm" />
                  <span className="text-sm font-medium text-primary-700 dark:text-primary-400">Analysis in progress</span>
                </div>
                <div className="space-y-1.5">
                  {[
                    { label: 'Static analysis', done: true },
                    { label: 'AI vulnerability review', done: scanStatus === 'scanning' },
                    { label: 'Generating report', done: false },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-primary-600 dark:text-primary-400">
                      {step.done ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-current opacity-40" />}
                      {step.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-3">Detects</h3>
            <div className="space-y-2">
              {[
                'Reentrancy Attack', 'Integer Overflow/Underflow', 'tx.origin Auth',
                'Timestamp Dependency', 'Delegatecall Misuse', 'Selfdestruct Misuse',
                'Front-Running', 'Weak Randomness', 'Access Control', 'Unchecked Calls',
                'DoS Vulnerabilities', 'Gas Optimization',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-secondary-500 flex-shrink-0" />
                  <span className="text-surface-700 dark:text-surface-300">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5 bg-warning-50 dark:bg-warning-900/10 border-warning-200 dark:border-warning-800">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-warning-800 dark:text-warning-300">Note</p>
                <p className="text-xs text-warning-700 dark:text-warning-400 mt-1">
                  This tool performs automated analysis and may not catch all vulnerabilities. Always conduct a professional audit before mainnet deployment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
