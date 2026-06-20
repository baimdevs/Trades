'use client';

import React, { useState, useEffect } from 'react';

export default function PremiumCryptoTerminal() {
  // ==========================================
  // 1. STATE DEKLARASI (HARUS DI PALING ATAS)
  // ==========================================
  
  // --- AUTHENTICATION STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  
  // --- CORE SYSTEM STATE ---
  const [currency, setCurrency] = useState('USD'); 
  const [balanceUSD, setBalanceUSD] = useState(384950.00); // Saldo awal Sultan
  const [nxsHolding, setNxsHolding] = useState(4250.75); 
  const [nxsPrice, setNxsPrice] = useState(142.65); 
  const [priceDirection, setPriceDirection] = useState('up');
  const [priceChange24h, setPriceChange24h] = useState('+8.45%');
  
  // --- FORM PANEL STATE ---
  const [p2pAddress, setP2pAddress] = useState('');
  const [p2pAmount, setP2pAmount] = useState('');
  const [txLoading, setTxLoading] = useState(false);

  // --- LEDGER TRANSAKSI STATE ---
  const [transactions, setTransactions] = useState([
    { id: 1, type: 'Deposit P2P Node', amount: '+1,500 NXS', status: 'Success', date: '2026-06-20 14:24' },
    { id: 2, type: 'Staking Reward', amount: '+12.45 NXS', status: 'Success', date: '2026-06-19 00:00' },
    { id: 3, type: 'Beli Instant', amount: '+500 NXS', status: 'Success', date: '2026-06-18 11:05' }
  ]);

  // ==========================================
  // 2. LOGIKA SINKRONISASI VERCEL KV STORAGE
  // ==========================================

  // Ambil data permanen dari Server saat berhasil Login
  useEffect(() => {
    async function fetchServerData() {
      try {
        const response = await fetch('/api/data');
        const data = await response.json();
        
        setBalanceUSD(data.balanceUSD);
        setNxsHolding(data.nxsHolding);
        if (data.transactions) setTransactions(data.transactions);
      } catch (error) {
        console.error("Gagal sinkronisasi data dengan server.");
      }
    }
    
    if (isLoggedIn) {
      fetchServerData();
    }
  }, [isLoggedIn]);

  // Kirim data ter-update ke Server
  const saveToServer = async (newBalance, newHolding, newTx) => {
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          balanceUSD: newBalance,
          nxsHolding: newHolding,
          transactions: newTx
        })
      });
    } catch (error) {
      console.error("Gagal menyimpan data ke server.");
    }
  };

  // ==========================================
  // 3. EFFECT SIMULASI PERGERAKAN HARGA KOIN
  // ==========================================
  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(() => {
      setNxsPrice((prevPrice) => {
        const volatility = 0.0006; 
        const randomShift = Math.random() - 0.47; // Bias naik
        const nextPrice = prevPrice * (1 + randomShift * volatility);
        
        setPriceDirection(nextPrice > prevPrice ? 'up' : 'down');
        return parseFloat(nextPrice.toFixed(2));
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // ==========================================
  // 4. ACTION FUNCTIONS (LOGIK HAMPIR NYATA)
  // ==========================================
  
  const KURS = 16200;
  const formatValue = (val, isCrypto = false) => {
    if (isCrypto) return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    if (currency === 'IDR') {
      return 'Rp ' + (val * KURS).toLocaleString('id-ID', { maximumFractionDigits: 0 });
    }
    return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setAuthLoading(true);
    
    setTimeout(() => {
      if (password === 'admin123') {
        setIsLoggedIn(true);
      } else {
        alert('❌ AKSES DITOLAK: Kunci Enkripsi Terminal Salah atau IP Anda Terdeteksi.');
      }
      setAuthLoading(false);
    }, 1500);
  };

  const handleInstantBuy = () => {
    const cost = 10000; 
    if (balanceUSD >= cost) {
      const nxsBought = cost / nxsPrice;
      const updatedBalance = balanceUSD - cost;
      const updatedHolding = nxsHolding + nxsBought;
      const newTx = [
        { 
          id: Date.now(), 
          type: 'Beli Instant', 
          amount: `+${nxsBought.toFixed(2)} NXS`, 
          status: 'Success', 
          date: new Date().toISOString().replace('T', ' ').substring(0, 16) 
        },
        ...transactions
      ];

      setBalanceUSD(updatedBalance);
      setNxsHolding(updatedHolding);
      setTransactions(newTx);

      // Kirim ke database Vercel KV
      saveToServer(updatedBalance, updatedHolding, newTx);
    } else {
      alert('❌ Saldo USD tidak mencukupi.');
    }
  };

  const handleP2pSubmit = (e) => {
    e.preventDefault();
    setTxLoading(true);

    setTimeout(() => {
      const amount = parseFloat(p2pAmount);
      if (amount && nxsHolding >= amount) {
        const updatedHolding = nxsHolding - amount;
        const newTx = [
          { 
            id: Date.now(), 
            type: 'Transfer P2P', 
            amount: `-${amount} NXS`, 
            status: 'Success', 
            date: new Date().toISOString().replace('T', ' ').substring(0, 16) 
          },
          ...transactions
        ];

        setNxsHolding(updatedHolding);
        setTransactions(newTx);
        
        // Kirim ke database Vercel KV
        saveToServer(balanceUSD, updatedHolding, newTx);

        setP2pAmount('');
        setP2pAddress('');
        alert('🚀 P2P Broadcast Success: Aset telah terkirim via Inter-Node Jaringan.');
      } else {
        alert('❌ Gagal: Saldo NXS Token Anda tidak mencukupi.');
      }
      setTxLoading(false);
    }, 2000);
  };

  const handleWithdrawBlocked = () => {
    alert('⚠️ TRANSACTION LOCK: Penarikan dinonaktifkan sementara untuk akun Demo/Sandbox Network. Hubungi Node Administrator.');
  };

  // ==========================================
  // 5. RENDERING VIEW SYSTEM
  // ==========================================
  
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans antialiased bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
        <div className="bg-slate-900/80 border border-slate-800/80 p-8 rounded-3xl w-full max-w-md text-center shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-2xl flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-cyan-500/20">
            NX
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">NEXUS SECURE TERMINAL</h2>
          <p className="text-xs text-slate-400 mt-1 mb-8">Decentralized Asset Management Vault v2.4</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="text-left">
              <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block mb-1.5 ml-1">Access Passkey</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3.5 text-center text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors font-mono tracking-widest placeholder:tracking-normal placeholder:text-slate-700"
              />
            </div>
            <button 
              type="submit"
              disabled={authLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 text-slate-950 font-bold text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-md active:scale-[0.99] disabled:opacity-50 flex items-center justify-center">
              {authLoading ? 'Verifying Node Signature...' : 'Unlock Terminal Access'}
            </button>
          </form>
          <p className="text-[9px] text-slate-600 mt-8 font-mono">Secured by AES-256 Protocol Network</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 md:p-6 font-sans antialiased">
      <div className="max-w-7xl mx-auto space-y-5">
        
        {/* TOP NAVBAR */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl px-5 py-3.5 flex justify-between items-center backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center font-black text-xs text-slate-950">NX</div>
            <div>
              <span className="font-bold tracking-wide text-xs md:text-sm text-white uppercase">NEXUS ENTERPRISE</span>
              <span className="hidden md:inline-block ml-2 text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded-md font-bold">SANDBOX NODE #01</span>
            </div>
          </div>
          
          <div className="bg-slate-950/80 p-0.5 rounded-xl border border-slate-800/80 flex">
            <button 
              onClick={() => setCurrency('USD')} 
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${currency === 'USD' ? 'bg-slate-900 text-cyan-400 border border-slate-800 shadow-md' : 'text-slate-400'}`}>
              USD ($)
            </button>
            <button 
              onClick={() => setCurrency('IDR')} 
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${currency === 'IDR' ? 'bg-slate-900 text-cyan-400 border border-slate-800 shadow-md' : 'text-slate-400'}`}>
              IDR (Rp)
            </button>
          </div>
        </div>

        {/* LAYOUT HUB */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          <div className="lg:col-span-2 space-y-5">
            {/* PORTFOLIO CARD */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 rounded-3xl shadow-xl">
              <div className="absolute right-0 top-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Estimated Net Worth Portfolio</p>
                  <h1 className="text-3xl md:text-4xl font-black text-white mt-1.5 font-mono tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text">
                    {formatValue(balanceUSD + (nxsHolding * nxsPrice))}
                  </h1>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  {priceChange24h}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-800/60">
                <div>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Fiat Currency Balance</p>
                  <p className="text-base font-bold text-slate-200 mt-0.5 font-mono">{formatValue(balanceUSD)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Crypto Asset Valuation</p>
                  <p className="text-base font-bold text-cyan-400 mt-0.5 font-mono">{formatValue(nxsHolding * nxsPrice)}</p>
                </div>
              </div>
            </div>

            {/* LIVE MARKET PANEL */}
            <div className="bg-slate-900/50 border border-slate-900 rounded-3xl p-5">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <img 
                    src="https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=120&auto=format&fit=crop" 
                    alt="NXS" 
                    className="w-10 h-10 rounded-xl object-cover border border-cyan-500/20 shadow-md shadow-cyan-500/5"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm text-white tracking-wide">Nexus Ecosystem Token</h3>
                      <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">NXS</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{formatValue(nxsHolding, true)} NXS Allocated</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-mono font-bold transition-all duration-300 ${priceDirection === 'up' ? 'text-emerald-400' : 'text-rose-500'}`}>
                    ${nxsPrice.toLocaleString()}
                  </p>
                  <span className="text-[9px] font-mono text-slate-500">Spread: 0.00%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleInstantBuy}
                  className="py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 font-bold text-xs uppercase text-slate-950 transition-all shadow-md active:scale-95">
                  Instant Purchase Demo (-$10,000)
                </button>
                <button 
                  onClick={handleWithdrawBlocked}
                  className="py-3 rounded-xl bg-slate-950/50 border border-rose-500/30 font-bold text-xs uppercase text-rose-400 hover:bg-rose-950/10 transition-all active:scale-95">
                  Withdrawal System Lock
                </button>
              </div>
            </div>

            {/* TRANSACTION LEDGER */}
            <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-5">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-4">Core Node Transaction Ledger</h4>
              <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center p-3 bg-slate-900/60 border border-slate-800/40 rounded-xl">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-slate-200">{tx.type}</p>
                      <p className="text-[10px] font-mono text-slate-500">{tx.date}</p>
                    </div>
                    <div className="text-right space-y-0.5">
                      <p className={`text-xs font-mono font-bold ${tx.amount.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>{tx.amount}</p>
                      <span className="text-[9px] px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium font-mono">{tx.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT ROW: P2P PANEL */}
          <div className="space-y-5">
            <div className="bg-slate-900/60 border border-slate-900 rounded-3xl p-5 relative overflow-hidden">
              <div className="mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                  <h3 className="font-bold text-sm text-white tracking-wide">Secure P2P Node Router</h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">Mengirim aset secara berantai langsung ke alamat Address luar.</p>
              </div>

              <form onSubmit={handleP2pSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block mb-1.5">Destination Core Wallet Address</label>
                  <input 
                    type="text" 
                    value={p2pAddress}
                    onChange={(e) => setP2pAddress(e.target.value)}
                    placeholder="0x94fC...B81A"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block mb-1.5">Asset Payload Quantity (NXS)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={p2pAmount}
                    onChange={(e) => setP2pAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={txLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-md active:scale-[0.98]">
                  {txLoading ? 'Broadcasting to Mainnet...' : 'Initiate Secure P2P Dispatch'}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-800/60 text-[10px] font-mono space-y-2 text-slate-500">
                <div className="flex justify-between">
                  <span>Network Fee:</span>
                  <span className="text-slate-300">0.0000 NXS (Waived)</span>
                </div>
                <div className="flex justify-between">
                  <span>Encryption Node Hash:</span>
                  <span className="text-cyan-500 select-all">SHA-256/NXS-V2</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
         }
