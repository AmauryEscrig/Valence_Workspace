import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Brush } from 'recharts';

// =========================================================================
// SUB-COMPONENT: DOM ROW
// =========================================================================
const DomRow = memo(({ price, bidQty, askQty, theme }) => {
  const [flash, setFlash] = useState(null);
  const prevBid = useRef(bidQty);
  const prevAsk = useRef(askQty);

  useEffect(() => {
    let isFlashing = false;
    if (bidQty > 0 && bidQty !== prevBid.current) { setFlash('bid'); isFlashing = true; } 
    else if (askQty > 0 && askQty !== prevAsk.current) { setFlash('ask'); isFlashing = true; }

    prevBid.current = bidQty; prevAsk.current = askQty;
    if (isFlashing) {
      const timer = setTimeout(() => setFlash(null), 150);
      return () => clearTimeout(timer);
    }
  }, [bidQty, askQty]);

  const isBid = bidQty > 0;
  const isAsk = askQty > 0;

  return (
    <div className={`flex text-center text-[10px] select-none h-5 border-b font-mono transition-colors ${theme === 'dark' ? 'border-zinc-900/30' : 'border-gray-200'}`}>
      <div className={`w-1/3 flex items-center justify-center border-r transition-colors duration-75 ${theme === 'dark' ? 'border-zinc-800/50' : 'border-gray-200'} ${
        flash === 'bid' ? 'bg-yellow-400 text-black font-bold' :
        isBid ? (theme === 'dark' ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-700 font-semibold') : 'text-transparent'
      }`}>
        {isBid ? bidQty : '0'}
      </div>
      <div className={`w-1/3 flex items-center justify-center font-bold border-x transition-colors ${
        theme === 'dark' ? 'bg-zinc-900/80 text-slate-300 border-zinc-950' : 'bg-gray-100 text-gray-700 border-gray-300'
      }`}>
        {price}
      </div>
      <div className={`w-1/3 flex items-center justify-center border-l transition-colors duration-75 ${theme === 'dark' ? 'border-zinc-800/50' : 'border-gray-200'} ${
        flash === 'ask' ? 'bg-yellow-400 text-black font-bold' :
        isAsk ? (theme === 'dark' ? 'bg-red-900/40 text-red-400' : 'bg-red-100 text-red-700 font-semibold') : 'text-transparent'
      }`}>
        {isAsk ? askQty : '0'}
      </div>
    </div>
  );
});

// =========================================================================
// SUB-COMPONENT: VOLUME ROW
// =========================================================================
const VolumeRow = memo(({ qty, isBid, maxVol, theme }) => {
  const width = Math.min((qty / maxVol) * 100, 100);
  return (
    <div className={`flex items-center h-5 border-b font-mono transition-colors ${theme === 'dark' ? 'border-zinc-900/30' : 'border-gray-200'}`}>
      <div className={`w-1/2 h-full flex items-center justify-end border-r pr-1 transition-colors ${theme === 'dark' ? 'border-zinc-800/50' : 'border-gray-200'}`}>
        {!isBid && qty > 0 && (
          <div className="flex items-center w-full justify-end">
            <span className={`text-[9px] mr-1.5 ${theme === 'dark' ? 'text-red-500/70' : 'text-red-500'}`}>-{qty}</span>
            <div className={`h-2.5 rounded-sm ${theme === 'dark' ? 'bg-red-600/80' : 'bg-red-500'}`} style={{ width: `${width}%` }}></div>
          </div>
        )}
      </div>
      <div className="w-1/2 h-full flex items-center justify-start pl-1">
        {isBid && qty > 0 && (
          <div className="flex items-center w-full justify-start">
            <div className={`h-2.5 rounded-sm ${theme === 'dark' ? 'bg-emerald-500/80' : 'bg-emerald-500'}`} style={{ width: `${width}%` }}></div>
            <span className={`text-[9px] ml-1.5 ${theme === 'dark' ? 'text-emerald-500/70' : 'text-emerald-600'}`}>+{qty}</span>
          </div>
        )}
      </div>
    </div>
  );
});

// =========================================================================
// SUB-COMPONENT: VERTICAL EXECUTION STRIP 
// =========================================================================
const ExecutionStrip = memo(({ theme }) => {
  const isDark = theme === 'dark';
  
  const selectCls = `w-full text-[10px] py-1 px-1 border rounded shadow-sm outline-none font-bold cursor-pointer ${
    isDark ? 'bg-zinc-800 border-zinc-700 text-slate-300 hover:bg-zinc-700' : 'bg-gradient-to-b from-white to-gray-200 border-gray-400 text-gray-800 hover:from-gray-100 hover:to-gray-300'
  }`;
  
  const presetBtnCls = `flex items-center justify-center font-bold text-[11px] py-0.5 border shadow-sm cursor-pointer transition-colors ${
    isDark ? 'bg-zinc-700 border-zinc-600 text-slate-300 hover:bg-zinc-600' : 'bg-gradient-to-b from-gray-100 to-gray-300 border-gray-400 text-gray-700 hover:from-gray-200 hover:to-gray-400'
  }`;

  const inputCls = `w-full text-center font-bold text-[12px] py-0.5 outline-none shadow-inner border ${
    isDark ? 'bg-black border-zinc-700 text-slate-200' : 'bg-white border-gray-400 text-black'
  }`;

  const riskBlockCls = `flex items-center justify-between px-2 py-1.5 border shadow-sm rounded-sm ${
    isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-300'
  }`;
  
  const riskInputCls = `w-10 text-right bg-transparent outline-none font-bold text-[10px] ${
    isDark ? 'text-slate-200' : 'text-black'
  }`;
  
  const riskLabelCls = `text-[9px] font-bold ${isDark ? 'text-slate-400' : 'text-gray-500'}`;

  return (
    <div className="flex-1 flex flex-col p-1 space-y-1 overflow-y-auto select-none font-sans custom-scrollbar">
      {/* Top Controls */}
      <select className={selectCls}><option>VAL.USD</option></select>
      <label className={`flex items-center space-x-1 pl-0.5 text-[9px] font-bold cursor-pointer ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
        <input type="checkbox" className="accent-blue-500 w-3 h-3 cursor-pointer" /><span>Filter</span>
      </label>
      <select className={selectCls}><option>Limit</option><option>Stop</option></select>
      <select className={selectCls}><option>Day</option><option>GTC</option></select>

      {/* Quantity & Position Viewer */}
      <div className={`flex flex-col border rounded shadow-sm overflow-hidden ${isDark ? 'border-blue-800' : 'border-blue-500'}`}>
         <div className={`text-center font-bold py-1 text-[13px] cursor-pointer text-white ${isDark ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-500 hover:bg-blue-400'}`} title="Total Pos Size">
           12
         </div>
         <input type="text" value="0" readOnly title="Order Qty" className={`w-full text-center py-1 text-[12px] font-bold outline-none ${isDark ? 'bg-black text-white border-t border-zinc-700' : 'bg-white text-black border-t border-gray-300'}`} />
      </div>

      {/* Preset Qty Grid */}
      <div className="grid grid-cols-2 gap-1">
         {[1, 5, 10, 50, 100, 'CLR'].map(val => (<div key={val} className={presetBtnCls}>{val}</div>))}
      </div>

      {/* Price Input & Fetcher */}
      <div className="flex space-x-1">
         <input type="text" value="0.00" readOnly className={`flex-1 ${inputCls}`} />
         <div className={`px-2 flex items-center justify-center border rounded shadow-sm text-[9px] font-bold cursor-pointer transition-colors ${
           isDark ? 'bg-zinc-700 border-zinc-600 hover:bg-zinc-600 text-cyan-400' : 'bg-gray-200 border-gray-400 hover:bg-gray-300 text-cyan-700'
         }`}>
           MID
         </div>
      </div>

      {/* Cancel Order Block */}
      <div className="flex flex-col space-y-0 text-white font-bold text-[10px]">
         <div className="relative flex items-center justify-start pl-2 py-1 cursor-pointer border shadow-sm rounded-t bg-[#cc3333] hover:bg-[#ff4444] border-[#992222]">
           CXL S <span className="absolute right-1 top-0.5 text-[7px] opacity-80">30</span>
         </div>
         <div className={`relative flex items-center justify-start pl-2 py-1 cursor-pointer border-x border-b shadow-sm ${isDark ? 'bg-zinc-600 hover:bg-zinc-500 border-zinc-700' : 'bg-[#aaaaaa] hover:bg-[#bbbbbb] border-[#888888] text-gray-900'}`}>
           CXL All <span className="absolute right-1 top-0.5 text-[7px] opacity-80">66</span>
         </div>
         <div className="relative flex items-center justify-start pl-2 py-1 cursor-pointer border-x border-b shadow-sm rounded-b bg-[#3388cc] hover:bg-[#4499dd] border-[#226699]">
           CXL B <span className="absolute right-1 top-0.5 text-[7px] opacity-80">36</span>
         </div>
      </div>

      {/* Market Execution Block */}
      <div className="flex flex-col space-y-0 text-white font-bold text-[10px]">
         <div className="relative flex items-center justify-start pl-2 py-1 cursor-pointer border shadow-sm rounded-t bg-red-600 hover:bg-red-500 border-red-800">
           MKT S
         </div>
         <div className={`relative flex items-center justify-start pl-2 py-1 cursor-pointer border-x border-b shadow-sm ${isDark ? 'bg-zinc-600 hover:bg-zinc-500 border-zinc-700' : 'bg-[#aaaaaa] hover:bg-[#bbbbbb] border-[#888888] text-gray-900'}`}>
           FLAT ALL
         </div>
         <div className="relative flex items-center justify-start pl-2 py-1 cursor-pointer border-x border-b shadow-sm rounded-b bg-[#3388cc] hover:bg-[#4499dd] border-[#226699]">
           MKT B
         </div>
      </div>

      {/* ================= VERTICALLY STACKED RISK MANAGEMENT ================= */}
      <div className={`mt-auto flex flex-col space-y-1 pt-2 border-t ${isDark ? 'border-zinc-800' : 'border-gray-300'}`}>
        
        {/* Risk % */}
        <div className={riskBlockCls}>
           <div className="flex items-center space-x-1.5">
             <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-cyan-500' : 'bg-cyan-600'}`}></div>
             <span className={riskLabelCls}>RSK%</span>
           </div>
           <div className="flex space-x-1.5 items-center">
              <input type="text" defaultValue="0.1" className={riskInputCls} />
              <div className={`px-1.5 py-0.5 rounded-sm border shadow-sm cursor-pointer font-bold text-[8px] ${
                 isDark ? 'bg-zinc-700 border-zinc-600 text-slate-300 hover:bg-zinc-600' : 'bg-gray-200 border-gray-400 text-gray-700 hover:bg-gray-300'
              }`}>CALC</div>
           </div>
        </div>

        {/* Stop Loss */}
        <div className={riskBlockCls}>
           <div className="flex items-center space-x-1.5">
             <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-cyan-500' : 'bg-cyan-600'}`}></div>
             <span className={riskLabelCls}>SL (pip)</span>
           </div>
           <input type="text" defaultValue="5" className={riskInputCls} />
        </div>

        {/* Slippage */}
        <div className={riskBlockCls}>
           <div className="flex items-center space-x-1.5">
             <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-zinc-600' : 'bg-gray-300'}`}></div>
             <span className={riskLabelCls}>SLIP (pip)</span>
           </div>
           <input type="text" defaultValue="1" className={riskInputCls} />
        </div>

        {/* Take Profit */}
        <div className={riskBlockCls}>
           <div className="flex items-center space-x-1.5">
             <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-cyan-500' : 'bg-cyan-600'}`}></div>
             <span className={riskLabelCls}>TP (pip)</span>
           </div>
           <input type="text" defaultValue="5" className={riskInputCls} />
        </div>

        {/* Max Spread */}
        <div className={riskBlockCls}>
           <div className="flex items-center space-x-1.5">
             <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-cyan-500' : 'bg-cyan-600'}`}></div>
             <span className={riskLabelCls}>MAX SPR</span>
           </div>
           <input type="text" defaultValue="1" className={riskInputCls} />
        </div>

        {/* Action Toggles - Stacked */}
        <div className="flex flex-col space-y-1 pt-0.5 pb-1">
           <div className={`w-full flex items-center justify-center py-1.5 rounded-sm border shadow-sm cursor-pointer font-bold text-[9px] transition-colors ${
             isDark ? 'bg-cyan-900/40 border-cyan-800 text-cyan-400' : 'bg-cyan-100 border-cyan-300 text-cyan-700'
           }`}>
             1-CLICK: ON
           </div>
           <div className={`w-full flex items-center justify-center py-1.5 rounded-sm border shadow-sm cursor-pointer font-bold text-[9px] transition-colors ${
             isDark ? 'bg-zinc-800 border-zinc-700 text-slate-500 hover:text-slate-300' : 'bg-white border-gray-300 text-gray-500 hover:text-gray-700'
           }`}>
             TOP: OFF
           </div>
        </div>

      </div>
    </div>
  );
});

// =========================================================================
// ISOLATED COMPONENT: LIVE TICKER FEED 
// =========================================================================
const LiveTickerFeed = memo(({ theme, isConnected, midPriceRef }) => {
  const [feed, setFeed] = useState([]);

  useEffect(() => {
    const tickerInterval = setInterval(() => {
      if (midPriceRef.current && isConnected) {
        const isBuy = Math.random() > 0.5;
        const qty = Math.floor(Math.random() * 40) + 1;
        const priceOffset = (Math.random() * 0.40 - 0.20); 
        const price = (midPriceRef.current + priceOffset).toFixed(2);
        const id = Math.floor(10000 + Math.random() * 90000);
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        setFeed(prev => {
          const newFeed = [{ id, time, isBuy, qty, price }, ...prev];
          return newFeed.slice(0, 40);
        });
      }
    }, 200);
    return () => clearInterval(tickerInterval);
  }, [isConnected, midPriceRef]);

  return (
    <div className="space-y-[2px]">
      {feed.map((tick) => (
        <div key={tick.id} className="flex justify-between items-center text-[10px] font-mono tracking-wide">
          <span className={theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}>{tick.time}</span>
          <span className="font-bold">
            <span className={theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}>{tick.qty}</span>
            <span className={`mx-1 ${theme === 'dark' ? 'text-slate-600' : 'text-gray-400'}`}>@</span>
            <span className={tick.isBuy ? 'text-emerald-500' : 'text-red-500'}>${tick.price}</span>
          </span>
        </div>
      ))}
    </div>
  );
});

// =========================================================================
// ISOLATED COMPONENT: PRICE WAVE CHART 
// =========================================================================
const PriceWaveChart = memo(({ theme, midPriceRef }) => {
  const [chartData, setChartData] = useState([]);
  const isDark = theme === 'dark';

  useEffect(() => {
    const chartInterval = setInterval(() => {
      if (midPriceRef.current !== null) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const newPoint = { time, price: midPriceRef.current };
        setChartData(prev => {
          if (prev.length > 200) return [...prev.slice(1), newPoint]; 
          return [...prev, newPoint];
        });
      }
    }, 300);
    return () => clearInterval(chartInterval);
  }, [midPriceRef]);

  if (chartData.length === 0) {
    return <div className="h-full w-full flex items-center justify-center text-slate-600">AWAITING MATRIX TICK...</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="cyanGlowDark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.15}/><stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="cyanGlowLight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0891b2" stopOpacity={0.15}/><stop offset="95%" stopColor="#0891b2" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="1 4" stroke={isDark ? '#1f2937' : '#e5e7eb'} />
        <XAxis dataKey="time" stroke={isDark ? '#4b5563' : '#9ca3af'} tickLine={false} />
        <YAxis stroke={isDark ? '#4b5563' : '#9ca3af'} domain={['auto', 'auto']} tickLine={false} />
        <Tooltip contentStyle={{ backgroundColor: isDark ? '#09090b' : '#ffffff', borderColor: isDark ? '#27272a' : '#e5e7eb', color: isDark ? '#22d3ee' : '#0e7490' }} />
        <Area type="monotone" dataKey="price" stroke={isDark ? '#22d3ee' : '#0891b2'} strokeWidth={1.5} fillOpacity={1} fill={isDark ? 'url(#cyanGlowDark)' : 'url(#cyanGlowLight)'} isAnimationActive={false} />
        <Brush dataKey="time" height={15} stroke={isDark ? '#22d3ee' : '#0891b2'} fill={isDark ? '#09090b' : '#f3f4f6'} travellerWidth={12} tickFormatter={() => ''} />
      </AreaChart>
    </ResponsiveContainer>
  );
});

// =========================================================================
// ISOLATED COMPONENT: DEPTH MOUNTAIN CHART 
// =========================================================================
const DepthMountainChart = memo(({ theme, bids, asks }) => {
  const isDark = theme === 'dark';

  const depthData = useMemo(() => {
    const topBids = [...bids].slice(0, 40).sort((a,b) => b[0] - a[0]);
    const topAsks = [...asks].slice(0, 40).sort((a,b) => a[0] - b[0]);
    
    let cumBid = 0;
    const bidPoints = [];
    topBids.forEach(([p, q]) => {
       cumBid += q;
       bidPoints.push({ price: p.toFixed(2), bidVol: cumBid, askVol: 0 });
    });
    bidPoints.reverse(); 

    let cumAsk = 0;
    const askPoints = [];
    topAsks.forEach(([p, q]) => {
       cumAsk += q;
       askPoints.push({ price: p.toFixed(2), bidVol: 0, askVol: cumAsk });
    });

    return [...bidPoints, ...askPoints];
  }, [bids, asks]);

  if (depthData.length === 0) {
    return <div className="h-full w-full flex items-center justify-center text-slate-600">AWAITING LIQUIDITY...</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={depthData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
         <defs>
           <linearGradient id="bidGlow" x1="0" y1="0" x2="0" y2="1">
             <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
           </linearGradient>
           <linearGradient id="askGlow" x1="0" y1="0" x2="0" y2="1">
             <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
           </linearGradient>
         </defs>
         <CartesianGrid strokeDasharray="1 4" stroke={isDark ? '#1f2937' : '#e5e7eb'} vertical={false} />
         <XAxis dataKey="price" stroke={isDark ? '#4b5563' : '#9ca3af'} tickLine={false} />
         <YAxis stroke={isDark ? '#4b5563' : '#9ca3af'} tickLine={false} />
         <Tooltip contentStyle={{ backgroundColor: isDark ? '#09090b' : '#ffffff', borderColor: isDark ? '#27272a' : '#e5e7eb' }} />
         <Area type="stepBefore" dataKey="bidVol" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#bidGlow)" isAnimationActive={false} />
         <Area type="stepAfter" dataKey="askVol" stroke="#ef4444" strokeWidth={1.5} fillOpacity={1} fill="url(#askGlow)" isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
});

// =========================================================================
// SUB-COMPONENT: OMS & RISK BLOTTER (02C)
// =========================================================================
const OMSBlotter = memo(({ theme, currentPrice }) => {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('POSITIONS');

  const posQty = 75;
  const posEntry = 99.85;
  const rawPnl = currentPrice ? ((currentPrice - posEntry) * posQty).toFixed(2) : "0.00";
  const isProfit = parseFloat(rawPnl) >= 0;

  const thCls = `px-2 py-1.5 text-left font-bold tracking-wider border-b ${isDark ? 'border-zinc-800 text-slate-500 bg-zinc-900/50' : 'border-gray-300 text-gray-500 bg-gray-200'}`;
  const tdCls = `px-2 py-1 border-b ${isDark ? 'border-zinc-800/50 text-slate-300' : 'border-gray-200 text-gray-700'}`;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className={`flex border-b text-[10px] font-bold tracking-wider ${isDark ? 'border-zinc-800' : 'border-gray-300'}`}>
        {['POSITIONS', 'OPEN ORDERS (2)'].map(tab => (
          <div key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 cursor-pointer transition-colors ${
              activeTab === tab ? (isDark ? 'text-cyan-400 border-b-2 border-cyan-400 bg-zinc-900/50' : 'text-cyan-700 border-b-2 border-cyan-600 bg-white') : (isDark ? 'text-slate-500 hover:text-slate-300 hover:bg-zinc-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100')
            }`}>
            {tab}
          </div>
        ))}
      </div>
      <div className={`flex-1 overflow-y-auto text-[10px] font-mono ${isDark ? 'bg-black' : 'bg-white'}`}>
        {activeTab === 'POSITIONS' && (
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr><th className={thCls}>SYM</th><th className={thCls}>SIDE</th><th className={thCls}>QTY</th><th className={thCls}>ENTRY</th><th className={thCls}>U-PNL</th><th className={thCls}></th></tr>
            </thead>
            <tbody>
              <tr className={`hover:${isDark ? 'bg-zinc-900' : 'bg-gray-50'}`}>
                <td className={`${tdCls} font-bold ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>VAL.USD</td>
                <td className={`${tdCls} text-emerald-500 font-bold`}>LONG</td>
                <td className={tdCls}>{posQty}</td>
                <td className={tdCls}>${posEntry.toFixed(2)}</td>
                <td className={`${tdCls} font-bold ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>{isProfit ? '+' : ''}${rawPnl}</td>
                <td className={tdCls}><button className={`px-2 py-0.5 rounded border text-[9px] font-bold ${isDark ? 'bg-zinc-800 border-zinc-600 hover:bg-zinc-700' : 'bg-gray-200 border-gray-400 hover:bg-gray-300'}`}>FLAT</button></td>
              </tr>
            </tbody>
          </table>
        )}
        {activeTab === 'OPEN ORDERS (2)' && (
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr><th className={thCls}>ID</th><th className={thCls}>SIDE</th><th className={thCls}>QTY</th><th className={thCls}>PRICE</th><th className={thCls}>STATUS</th><th className={thCls}></th></tr>
            </thead>
            <tbody>
              <tr className={`hover:${isDark ? 'bg-zinc-900' : 'bg-gray-50'}`}>
                <td className={tdCls}>#99201</td><td className={`${tdCls} text-emerald-500 font-bold`}>BUY</td><td className={tdCls}>50</td><td className={tdCls}>$99.50</td><td className={`${tdCls} text-yellow-500`}>WRK</td>
                <td className={tdCls}><button className="text-red-500 hover:text-red-400 font-bold">CXL</button></td>
              </tr>
              <tr className={`hover:${isDark ? 'bg-zinc-900' : 'bg-gray-50'}`}>
                <td className={tdCls}>#99202</td><td className={`${tdCls} text-red-500 font-bold`}>SELL</td><td className={tdCls}>25</td><td className={tdCls}>$100.80</td><td className={`${tdCls} text-yellow-500`}>WRK</td>
                <td className={tdCls}><button className="text-red-500 hover:text-red-400 font-bold">CXL</button></td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
});

// =========================================================================
// SUB-COMPONENT: COMMS TURRET (02D)
// =========================================================================
const TradingTurret = memo(({ theme }) => {
  const isDark = theme === 'dark';
  const hardwareBg = isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-[#e5e7eb] border-[#d1d5db]';
  const screenBg = 'bg-black border-zinc-800 text-white'; 

  const LineBtn = ({ color, title, sub }) => (
    <div className={`bg-${color}-700/80 hover:bg-${color}-600 cursor-pointer border border-${color}-800 rounded-sm px-1.5 py-0.5 flex flex-col shadow-sm mb-1`}>
      <span className="text-[9px] font-bold truncate leading-tight">{title}</span>
      {sub && <span className="text-[7px] text-${color}-200 opacity-70 truncate leading-tight">{sub}</span>}
    </div>
  );

  return (
    <div className={`flex-1 rounded border-y-[3px] border-x shadow-xl p-2 flex space-x-2 ${hardwareBg} overflow-hidden font-sans`}>
      
      {/* LEFT SCREEN MODULE (Global Desks) */}
      <div className="flex-1 flex space-x-1">
        <div className="flex flex-col justify-around py-1">
           {[1,2,3,4].map(i => <div key={`ls-${i}`} className={`w-2.5 h-1.5 rounded-sm shadow-inner ${isDark ? 'bg-zinc-700' : 'bg-gray-400'}`}></div>)}
        </div>
        <div className={`flex-1 rounded shadow-inner border-2 flex flex-col p-1 ${screenBg}`}>
           <div className="text-[7px] text-slate-400 font-bold text-center border-b border-zinc-800 mb-1 pb-0.5 tracking-widest uppercase">GLOBAL HOOT</div>
           <LineBtn color="green" title="LDN Desk" sub="7002" />
           <LineBtn color="blue" title="NYC Quant" sub="+1 212-555" />
           <LineBtn color="blue" title="Darkpool C" sub="VOICE" />
           <div className="mt-auto">
             <LineBtn color="red" title="HOTLINE" />
           </div>
        </div>
      </div>

      {/* RIGHT SCREEN MODULE (Contacts & Intercom) */}
      <div className="flex-1 flex space-x-1">
        <div className={`flex-1 rounded shadow-inner border-2 flex flex-col p-1 ${screenBg}`}>
           <div className="text-[7px] text-slate-400 font-bold text-center border-b border-zinc-800 mb-1 pb-0.5 tracking-widest uppercase">CORP LINES</div>
           <LineBtn color="orange" title="Shared Lines" />
           <LineBtn color="orange" title="Corp Contacts" />
           <div className="bg-zinc-900/80 text-slate-400 text-[8px] p-1 mt-auto mb-0.5 rounded border border-zinc-800 h-8 flex items-center justify-center text-center leading-none animate-pulse">
             AWAITING<br/>INBOUND
           </div>
        </div>
        <div className="flex flex-col justify-around py-1">
           {[1,2,3,4].map(i => <div key={`rs-${i}`} className={`w-2.5 h-1.5 rounded-sm shadow-inner ${isDark ? 'bg-zinc-700' : 'bg-gray-400'}`}></div>)}
        </div>
      </div>

      {/* KEYPAD & HARDWARE CONTROLS */}
      <div className="w-[85px] flex flex-col space-y-1.5 justify-center pl-1">
        <div className="grid grid-cols-3 gap-1">
          {['1','2','3','4','5','6','7','8','9','*','0','#'].map(k => (
            <div key={k} className={`h-4 flex items-center justify-center rounded-sm shadow-sm text-[9px] font-bold cursor-pointer transition-colors ${
              isDark ? 'bg-[#27272a] text-slate-300 border-b border-[#111] hover:bg-[#3f3f46]' : 'bg-gray-100 text-gray-700 border-b border-gray-300 hover:bg-white'
            }`}>
              {k}
            </div>
          ))}
        </div>
        <div className="flex space-x-1 pt-1">
           <div className="flex-1 h-5 rounded shadow bg-green-600 hover:bg-green-500 border-b-2 border-green-800 cursor-pointer flex items-center justify-center text-white text-[10px]">☏</div>
           <div className="flex-1 h-5 rounded shadow bg-red-600 hover:bg-red-500 border-b-2 border-red-800 cursor-pointer flex items-center justify-center text-white text-[10px]">☎</div>
        </div>
      </div>
      
    </div>
  );
});

// =========================================================================
// MAIN APP COMPONENT
// =========================================================================
export default function App() {
  const [theme, setTheme] = useState('dark');
  const [isConnected, setIsConnected] = useState(false);
  
  const [bids, setBids] = useState([]);
  const [asks, setAsks] = useState([]);
  
  const latestMarketData = useRef({ bids: [], asks: [] });
  const latestMidPriceRef = useRef(null);
  const isDark = theme === 'dark';

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    const ws = new WebSocket('ws://127.0.0.1:8080');
    ws.onopen = () => setIsConnected(true);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        latestMarketData.current = data;
        
        if (data.asks && data.asks.length > 0 && data.bids && data.bids.length > 0) {
          latestMidPriceRef.current = parseFloat(((data.asks[0][0] + data.bids[0][0]) / 2).toFixed(2));
        }
      } catch (e) {}
    };
    ws.onclose = () => { setIsConnected(false); setBids([]); setAsks([]); };

    const uiRenderInterval = setInterval(() => {
      const data = latestMarketData.current;
      if (data.bids) setBids(data.bids);
      if (data.asks) setAsks(data.asks);
    }, 150);

    return () => { ws.close(); clearInterval(uiRenderInterval); };
  }, []);

  const askMap = new Map(asks.map(([p, q]) => [p.toFixed(2), q]));
  const bidMap = new Map(bids.map(([p, q]) => [p.toFixed(2), q]));

  const bestAsk = asks.length > 0 ? asks[0][0] : 100.05;
  const bestBid = bids.length > 0 ? bids[0][0] : 99.95;
  const tickSize = 0.05;

  const askLadder = [];
  for (let i = 17; i >= 0; i--) {
    const p = (bestAsk + (i * tickSize)).toFixed(2);
    askLadder.push({ price: p, askQty: askMap.get(p) || 0, bidQty: 0 });
  }

  const bidLadder = [];
  for (let i = 0; i <= 17; i++) {
    const p = (bestBid - (i * tickSize)).toFixed(2);
    bidLadder.push({ price: p, askQty: 0, bidQty: bidMap.get(p) || 0 });
  }

  const maxVol = Math.max(1, ...askLadder.map(l => l.askQty), ...bidLadder.map(l => l.bidQty));

  return (
    <div className={`h-screen w-screen flex flex-col font-mono text-xs select-none transition-colors duration-300 ${isDark ? 'bg-black text-slate-300' : 'bg-gray-200 text-slate-800'}`}>
      
      {/* MENU BAR */}
      <div className={`flex justify-between items-center px-3 py-1.5 uppercase tracking-wider text-[11px] border-b transition-colors ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-300'}`}>
        <div className="flex items-center space-x-4">
          <span className={`font-bold tracking-widest text-sm ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>VALENCE CORE v1.0</span>
          <button onClick={toggleTheme} className={`px-3 py-1 rounded border text-[9px] font-bold tracking-widest transition-colors ${
              isDark ? 'border-zinc-700 text-slate-400 hover:bg-zinc-800 hover:text-cyan-400' : 'border-gray-300 text-gray-500 hover:bg-gray-100 hover:text-cyan-700'
          }`}>
            {isDark ? 'LIGHT THEME' : 'DARK THEME'}
          </button>
          <span className={isDark ? 'text-slate-500' : 'text-gray-400'}>|</span>
          <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>EXCH: SECURE_LOCAL_DEV</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className={isDark ? 'text-slate-500' : 'text-gray-500'}>NET_LOOP:</span>
            <span className={isConnected ? (isDark ? 'text-cyan-400' : 'text-cyan-600') : "text-rose-500 font-bold animate-pulse"}>
              {isConnected ? "RUNNING" : "OFFLINE"}
            </span>
          </div>
          <span className={isDark ? 'text-slate-500' : 'text-gray-400'}>|</span>
          <div className="flex items-center space-x-1">
            <span className={isDark ? 'text-slate-500' : 'text-gray-500'}>GATE_INTERVAL:</span>
            <span className={isDark ? 'text-cyan-400' : 'text-cyan-600'}>300ms</span>
          </div>
        </div>
      </div>

      {/* MONITOR MATRIX */}
      <div className={`flex-1 grid grid-cols-12 gap-px p-px overflow-hidden transition-colors ${isDark ? 'bg-zinc-800' : 'bg-gray-300'}`}>
        
        {/* ========================================================= */}
        {/* LEFT COLUMN COMPOSITE (COL-SPAN-4)                        */}
        {/* ========================================================= */}
        <div className={`col-span-4 flex border overflow-hidden transition-colors ${isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-gray-200'}`}>
          <div className={`w-[40%] flex flex-col p-2 border-r overflow-hidden transition-colors ${isDark ? 'bg-[#030303] border-zinc-900' : 'bg-gray-50 border-gray-200'}`}>
            <div className={`font-bold border-b pb-1 mb-1 uppercase tracking-wide text-[10px] ${isDark ? 'text-cyan-400 border-zinc-800' : 'text-cyan-700 border-gray-300'}`}>[01A] DOM LADDER</div>
            <div className={`flex text-[9px] border-b pb-1 mb-1 text-center tracking-widest ${isDark ? 'text-slate-500 border-zinc-800' : 'text-gray-500 border-gray-300'}`}>
              <div className="w-1/3">BID</div><div className={`w-1/3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>PRICE</div><div className="w-1/3">ASK</div>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden text-[10px]">
              {askLadder.map((level) => (<DomRow key={`ask-${level.price}`} price={level.price} bidQty={0} askQty={level.askQty} theme={theme} />))}
              <div className={`h-6 my-1 border-y flex justify-center items-center text-[10px] shrink-0 transition-colors ${isDark ? 'border-cyan-900/50 bg-cyan-950/20 text-slate-400' : 'border-cyan-200 bg-cyan-50 text-gray-500'}`}>
                <span className="mr-2">SPREAD:</span>
                <span className={`font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>{asks.length && bids.length ? `$${(asks[0][0] - bids[0][0]).toFixed(2)}` : "..."}</span>
              </div>
              {bidLadder.map((level) => (<DomRow key={`bid-${level.price}`} price={level.price} bidQty={level.bidQty} askQty={0} theme={theme} />))}
            </div>
          </div>

          <div className={`w-[40%] flex flex-col p-2 border-r overflow-hidden transition-colors ${isDark ? 'bg-[#030303] border-zinc-900' : 'bg-gray-50 border-gray-200'}`}>
            <div className={`font-bold border-b pb-1 mb-1 uppercase tracking-wide text-[10px] ${isDark ? 'text-blue-400 border-zinc-800' : 'text-blue-700 border-gray-300'}`}>[01B] DELTA</div>
            <div className={`flex text-[9px] border-b pb-1 mb-1 text-center tracking-widest ${isDark ? 'text-slate-500 border-zinc-800' : 'text-gray-500 border-gray-300'}`}>
              <div className="w-full">ASK (-) | BID (+)</div>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden text-[10px]">
              {askLadder.map((level) => (<VolumeRow key={`vol-ask-${level.price}`} qty={level.askQty} isBid={false} maxVol={maxVol} theme={theme} />))}
              <div className="h-6 my-1 border-y border-transparent flex justify-center items-center shrink-0"></div>
              {bidLadder.map((level) => (<VolumeRow key={`vol-bid-${level.price}`} qty={level.bidQty} isBid={true} maxVol={maxVol} theme={theme} />))}
            </div>
          </div>

          <div className={`w-[20%] flex flex-col overflow-hidden transition-colors ${isDark ? 'bg-[#0a0a0c]' : 'bg-gray-100'}`}>
             <ExecutionStrip theme={theme} />
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN COMPOSITE (COL-SPAN-8)                       */}
        {/* ========================================================= */}
        <div className={`col-span-8 flex flex-col border overflow-hidden transition-colors ${isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-gray-200'}`}>
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* ROW 1: 02A (Price Wave) & 02B (Liquidity Depth Mountain) */}
            <div className={`h-1/2 flex border-b overflow-hidden transition-colors ${isDark ? 'border-zinc-900' : 'border-gray-200'}`}>
              <div className={`w-1/2 flex flex-col p-3 border-r overflow-hidden transition-colors ${isDark ? 'border-zinc-900' : 'border-gray-200'}`}>
                <div className={`font-bold border-b pb-1 mb-2 uppercase tracking-wide text-[10px] ${isDark ? 'text-blue-400 border-zinc-800' : 'text-blue-700 border-gray-300'}`}>
                  [02A] MID-MARKET PRICE WAVE
                </div>
                <div className={`flex-1 rounded border p-2 text-[10px] min-h-0 transition-colors ${isDark ? 'bg-black border-zinc-900' : 'bg-white border-gray-200'}`}>
                  <PriceWaveChart theme={theme} midPriceRef={latestMidPriceRef} />
                </div>
              </div>
              <div className="w-1/2 flex flex-col p-3 overflow-hidden">
                <div className={`font-bold border-b pb-1 mb-2 uppercase tracking-wide text-[10px] ${isDark ? 'text-blue-400 border-zinc-800' : 'text-blue-700 border-gray-300'}`}>
                  [02B] LIQUIDITY DEPTH MOUNTAIN
                </div>
                <div className={`flex-1 rounded border p-2 text-[10px] min-h-0 transition-colors ${isDark ? 'bg-black border-zinc-900' : 'bg-white border-gray-200'}`}>
                   <DepthMountainChart theme={theme} bids={bids} asks={asks} />
                </div>
              </div>
            </div>

            {/* ROW 2: 02C (OMS) & 02D (Turret) */}
            <div className="h-1/2 flex overflow-hidden">
              <div className={`w-1/2 flex flex-col p-3 border-r overflow-hidden transition-colors ${isDark ? 'border-zinc-900' : 'border-gray-200'}`}>
                <div className={`font-bold border-b pb-1 mb-2 uppercase tracking-wide text-[10px] ${isDark ? 'text-blue-400 border-zinc-800' : 'text-blue-700 border-gray-300'}`}>
                  [02C] OMS & RISK BLOTTER
                </div>
                <div className={`flex-1 rounded border flex flex-col overflow-hidden transition-colors ${isDark ? 'bg-black border-zinc-900' : 'bg-white border-gray-200'}`}>
                  <OMSBlotter theme={theme} currentPrice={bids.length ? bids[0][0] : null} />
                </div>
              </div>

              <div className="w-1/2 flex flex-col p-3 overflow-hidden">
                <div className={`font-bold border-b pb-1 mb-2 uppercase tracking-wide text-[10px] ${isDark ? 'text-blue-400 border-zinc-800' : 'text-blue-700 border-gray-300'}`}>
                  [02D] COMMS TURRET
                </div>
                <div className={`flex-1 rounded border flex flex-col overflow-hidden transition-colors p-1 ${isDark ? 'bg-black border-zinc-900' : 'bg-gray-200 border-gray-300'}`}>
                  <TradingTurret theme={theme} />
                </div>
              </div>
            </div>
            
          </div>

          {/* LOWER LOGGERS - 03A & 03B */}
          <div className={`h-[140px] flex border-t overflow-hidden transition-colors ${isDark ? 'border-zinc-900' : 'border-gray-200'}`}>
            <div className={`w-1/2 flex flex-col p-3 border-r transition-colors ${isDark ? 'border-zinc-900' : 'border-gray-200'}`}>
              <div className={`font-bold border-b pb-0.5 mb-1.5 uppercase tracking-wide text-[10px] ${isDark ? 'text-slate-400 border-zinc-800' : 'text-gray-500 border-gray-300'}`}>
                [03A] BATCH LAYER METRICS
              </div>
              <div className={`rounded border p-2 flex-1 font-mono text-[11px] space-y-0.5 overflow-y-auto transition-colors ${isDark ? 'bg-black border-zinc-900 text-cyan-500/80' : 'bg-gray-100 border-gray-300 text-cyan-800'}`}>
                <div>&gt; VECTOR STATUS: UI TICKING ON DISCRETE 150ms METRONOME</div>
                <div>&gt; DATA BUS: DECOUPLED BACKGROUND REFS ENABLED</div>
              </div>
            </div>
            <div className="w-1/2 flex flex-col p-3">
              <div className={`font-bold border-b pb-0.5 mb-1.5 uppercase tracking-wide text-[10px] ${isDark ? 'text-slate-400 border-zinc-800' : 'text-gray-500 border-gray-300'}`}>
                [03B] LIVE ORDER TICKER
              </div>
              <div className={`rounded border p-2 flex-1 overflow-y-auto transition-colors ${isDark ? 'bg-black border-zinc-900' : 'bg-gray-100 border-gray-300'}`}>
                <LiveTickerFeed theme={theme} isConnected={isConnected} midPriceRef={latestMidPriceRef} />
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}