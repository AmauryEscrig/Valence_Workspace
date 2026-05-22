import React, { useState, useEffect, useRef, memo, useMemo, useCallback } from 'react';
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Brush } from 'recharts';

// =========================================================================
// ISOLATED COMPONENT: HEADER CLOCKS 
// =========================================================================
const HeaderClocks = memo(({ isDark }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getClockInfo = (tz, openHour, closeHour) => {
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: false });
    const timeString = formatter.format(time);
    const hour = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false }).format(time), 10);
    const isOpen = hour >= openHour && hour < closeHour;
    return { timeString, isOpen };
  };

  const nyc = getClockInfo('America/New_York', 9, 16);
  const ldn = getClockInfo('Europe/London', 8, 16);
  const ams = getClockInfo('Europe/Amsterdam', 9, 17);

  const ClockWidget = ({ label, info }) => (
    <div className={`flex items-center space-x-1.5 px-2 py-0.5 rounded border shadow-inner ${isDark ? 'bg-black border-zinc-800' : 'bg-gray-100 border-gray-300'}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${info.isOpen ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-red-500'}`}></div>
      <span className={`font-bold text-[9px] ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{label}</span>
      <span className={`text-[10px] ${isDark ? 'text-slate-300' : 'text-gray-800'}`}>{info.timeString}</span>
    </div>
  );

  return (
    <div className="flex space-x-2">
      <ClockWidget label="LDN" info={ldn} />
      <ClockWidget label="AMS" info={ams} />
      <ClockWidget label="NYC" info={nyc} />
    </div>
  );
});

// =========================================================================
// SUB-COMPONENT: DOM ROW & VOLUME ROW (HEATMAP & DELTA STACKING)
// =========================================================================
const DomRow = memo(({ price, bidQty, askQty, maxVol, theme, openOrders }) => {
  const [flash, setFlash] = useState(null);
  const prevBid = useRef(bidQty);
  const prevAsk = useRef(askQty);

  const ordersAtLevel = openOrders.filter(o => o.price.toFixed(2) === price);
  const hasBuyLmt = ordersAtLevel.some(o => o.side === 'BUY' && o.type === 'LMT');
  const hasSellLmt = ordersAtLevel.some(o => o.side === 'SELL' && o.type === 'LMT');
  
  const isSL = ordersAtLevel.some(o => o.type === 'SL');
  const isTP = ordersAtLevel.some(o => o.type === 'TP');

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

  const intensity = maxVol > 0 ? ((isBid ? bidQty : askQty) / maxVol) : 0;
  const heatBg = {
     backgroundColor: isBid 
       ? `rgba(16, 185, 129, ${theme === 'dark' ? intensity * 0.4 : intensity * 0.2})` 
       : isAsk 
       ? `rgba(239, 68, 68, ${theme === 'dark' ? intensity * 0.4 : intensity * 0.2})` 
       : 'transparent'
  };

  let rowBorder = theme === 'dark' ? 'border-zinc-900/30' : 'border-gray-200';
  if (hasBuyLmt) rowBorder = theme === 'dark' ? 'border-l-2 border-emerald-500 bg-emerald-900/40' : 'border-l-2 border-emerald-500 bg-emerald-100';
  if (hasSellLmt) rowBorder = theme === 'dark' ? 'border-r-2 border-red-500 bg-red-900/40' : 'border-r-2 border-red-500 bg-red-100';

  let riskOverlay = "";
  if (isSL) riskOverlay = theme === 'dark' ? 'border-y border-dashed border-orange-500/50 bg-orange-900/20' : 'border-y border-dashed border-orange-500/50 bg-orange-100';
  if (isTP) riskOverlay = theme === 'dark' ? 'border-y border-dashed border-cyan-500/50 bg-cyan-900/20' : 'border-y border-dashed border-cyan-500/50 bg-cyan-100';

  return (
    <div style={(!hasBuyLmt && !hasSellLmt && !isSL && !isTP) ? heatBg : {}} className={`flex text-center text-[10px] select-none h-5 border-b font-mono transition-colors ${rowBorder} ${riskOverlay}`}>
      <div className={`w-1/3 flex items-center justify-center border-r transition-colors duration-75 ${theme === 'dark' ? 'border-zinc-800/50' : 'border-gray-200'} ${flash === 'bid' ? 'bg-yellow-400 text-black font-bold' : isBid ? (theme === 'dark' ? 'text-blue-400' : 'text-blue-700 font-semibold') : 'text-transparent'}`}>
        {hasBuyLmt ? <span className="text-white font-bold">{ordersAtLevel.find(o=>o.side==='BUY' && o.type==='LMT')?.qty}</span> : (isBid ? bidQty : '0')}
      </div>
      <div className={`w-1/3 flex items-center justify-center font-bold border-x transition-colors ${hasBuyLmt ? 'text-emerald-400' : hasSellLmt ? 'text-red-400' : isSL ? 'text-orange-400 opacity-90' : isTP ? 'text-cyan-400 opacity-90' : (theme === 'dark' ? 'bg-zinc-900/80 text-slate-300 border-zinc-950' : 'bg-gray-100 text-gray-700 border-gray-300')}`}>
        {price}
      </div>
      <div className={`w-1/3 flex items-center justify-center border-l transition-colors duration-75 ${theme === 'dark' ? 'border-zinc-800/50' : 'border-gray-200'} ${flash === 'ask' ? 'bg-yellow-400 text-black font-bold' : isAsk ? (theme === 'dark' ? 'text-red-400' : 'text-red-700 font-semibold') : 'text-transparent'}`}>
        {hasSellLmt ? <span className="text-white font-bold">{ordersAtLevel.find(o=>o.side==='SELL' && o.type==='LMT')?.qty}</span> : (isAsk ? askQty : '0')}
      </div>
    </div>
  );
});

const VolumeRow = memo(({ price, qty, isBid, maxVol, theme, openOrders, algoDelta }) => {
  const width = Math.min((qty / maxVol) * 100, 100);
  const userVol = openOrders.filter(o => o.price.toFixed(2) === price && o.type === 'LMT').reduce((sum, o) => sum + o.qty, 0);
  const userWidth = Math.min((userVol / maxVol) * 100, 100);
  const algoVol = algoDelta[price] || 0;
  const algoWidth = Math.min((algoVol / maxVol) * 100, 100);

  return (
    <div className={`flex items-center h-5 border-b font-mono transition-colors ${theme === 'dark' ? 'border-zinc-900/30' : 'border-gray-200'}`}>
      <div className={`w-1/2 h-full flex items-center justify-end border-r pr-1 transition-colors ${theme === 'dark' ? 'border-zinc-800/50' : 'border-gray-200'}`}>
        {!isBid && qty > 0 && (
          <div className="flex items-center w-full justify-end">
            <span className={`text-[9px] mr-1.5 ${theme === 'dark' ? 'text-red-500/70' : 'text-red-500'}`}>-{qty}</span>
            <div className={`relative h-2.5 rounded-sm overflow-hidden ${theme === 'dark' ? 'bg-red-600/50' : 'bg-red-400'}`} style={{ width: `${width}%` }}>
               {algoVol > 0 && <div className="absolute right-0 top-0 h-full bg-purple-500 shadow-[0_0_5px_#a855f7]" style={{ width: `${(algoWidth/width)*100}%` }}></div>}
               {userVol > 0 && <div className="absolute right-0 top-0 h-full bg-cyan-400 shadow-[0_0_5px_#22d3ee]" style={{ width: `${(userWidth/width)*100}%` }}></div>}
            </div>
          </div>
        )}
      </div>
      <div className="w-1/2 h-full flex items-center justify-start pl-1">
        {isBid && qty > 0 && (
          <div className="flex items-center w-full justify-start">
            <div className={`relative h-2.5 rounded-sm overflow-hidden ${theme === 'dark' ? 'bg-emerald-500/50' : 'bg-emerald-400'}`} style={{ width: `${width}%` }}>
               {algoVol > 0 && <div className="absolute left-0 top-0 h-full bg-purple-500 shadow-[0_0_5px_#a855f7]" style={{ width: `${(algoWidth/width)*100}%` }}></div>}
               {userVol > 0 && <div className="absolute left-0 top-0 h-full bg-cyan-400 shadow-[0_0_5px_#22d3ee]" style={{ width: `${(userWidth/width)*100}%` }}></div>}
            </div>
            <span className={`text-[9px] ml-1.5 ${theme === 'dark' ? 'text-emerald-500/70' : 'text-emerald-600'}`}>+{qty}</span>
          </div>
        )}
      </div>
    </div>
  );
});

// =========================================================================
// SUB-COMPONENT: VERTICAL EXECUTION STRIP (DIRECTIONAL LOCKING INCLUDED)
// =========================================================================
const ExecutionStrip = memo(({ theme, execMode, setExecMode, algoStrategy, setAlgoStrategy, executeTrade, cancelOrders, triggerAlgo, account, riskParams, setRiskParams, bestBid, bestAsk }) => {
  const isDark = theme === 'dark';
  const [orderQty, setOrderQty] = useState(10);
  const [orderPrice, setOrderPrice] = useState(bestBid ? bestBid.toFixed(2) : "100.00");
  
  // Directional Lock Logic
  const buyingPower = account.equity - account.usedMargin;
  const netQty = account.positions.reduce((acc, p) => acc + (p.side === 'BUY' ? p.qty : -p.qty), 0);
  
  // You can buy if you have cash OR if you are short (buying covers the short and frees margin)
  const buyLocked = buyingPower <= 0 && netQty >= 0; 
  // You can sell if you have cash OR if you are long (selling covers the long and frees margin)
  const sellLocked = buyingPower <= 0 && netQty <= 0; 
  
  const selectCls = `w-full text-[10px] py-1 px-1 border rounded shadow-sm outline-none font-bold cursor-pointer ${isDark ? 'bg-zinc-800 border-zinc-700 text-slate-300 hover:bg-zinc-700' : 'bg-gradient-to-b from-white to-gray-200 border-gray-400 text-gray-800'}`;
  const presetBtnCls = `flex items-center justify-center font-bold text-[11px] py-0.5 border shadow-sm cursor-pointer transition-colors ${isDark ? 'bg-zinc-700 border-zinc-600 text-slate-300 hover:bg-zinc-600' : 'bg-gradient-to-b from-gray-100 to-gray-300 border-gray-400 text-gray-700 hover:bg-gray-200'}`;
  
  const handleQtyClick = (val) => {
    if (val === 'CLR') setOrderQty(0);
    else setOrderQty(prev => prev + val);
  };

  const handleRiskChange = (field, type, value) => {
    setRiskParams(prev => ({ ...prev, [field]: { ...prev[field], [type]: value } }));
  };

  const RiskRow = ({ label, field }) => (
    <div className={`flex items-center justify-between px-1.5 py-1 border shadow-sm rounded-sm transition-colors ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-300'}`}>
      <label className="flex items-center space-x-1.5 cursor-pointer">
        <input type="checkbox" checked={riskParams[field].enabled} onChange={(e) => handleRiskChange(field, 'enabled', e.target.checked)} className="accent-cyan-500 cursor-pointer" />
        <span className={`text-[9px] font-bold ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{label}</span>
      </label>
      <input type="number" value={riskParams[field].value} onChange={(e) => handleRiskChange(field, 'value', Number(e.target.value))} disabled={!riskParams[field].enabled} className={`w-12 text-right bg-transparent outline-none font-bold text-[10px] ${!riskParams[field].enabled ? 'opacity-30' : ''} ${isDark ? 'text-slate-200' : 'text-black'}`} />
    </div>
  );

  const bidDecimal = bestBid ? bestBid.toFixed(2).split('.')[1] : '--';
  const askDecimal = bestAsk ? bestAsk.toFixed(2).split('.')[1] : '--';

  const getClosestDecimal = (side, type) => {
     const orders = account.openOrders.filter(o => o.side === side && o.type === type);
     if (orders.length === 0) return '00';
     const closest = orders.sort((a,b) => side === 'BUY' ? b.price - a.price : a.price - b.price)[0];
     return closest.price.toFixed(2).split('.')[1];
  };

  return (
    <div className="flex-1 flex flex-col p-1 space-y-1 overflow-y-auto select-none font-sans custom-scrollbar">
      {(buyLocked || sellLocked) && <div className="bg-red-900/80 border border-red-500 text-red-200 text-[9px] font-bold text-center py-1 rounded shadow mb-1 animate-pulse">BUYING POWER EXHAUSTED</div>}

      <div className={`flex rounded border p-0.5 mb-0.5 text-[8px] font-bold shadow-inner ${isDark ? 'bg-black border-zinc-800' : 'bg-gray-300 border-gray-400'}`}>
        <div onClick={() => setExecMode('DIRECT')} className={`flex-1 text-center py-1 cursor-pointer rounded-sm transition-colors ${execMode === 'DIRECT' ? (isDark ? 'bg-cyan-900/60 text-cyan-400 shadow' : 'bg-white text-cyan-700 shadow') : (isDark ? 'text-slate-500' : 'text-gray-500')}`}>DIR</div>
        <div onClick={() => setExecMode('ALGO')} className={`flex-1 text-center py-1 cursor-pointer rounded-sm transition-colors ${execMode === 'ALGO' ? (isDark ? 'bg-purple-900/60 text-purple-400 shadow' : 'bg-white text-purple-700 shadow') : (isDark ? 'text-slate-500' : 'text-gray-500')}`}>ALGO</div>
        <div onClick={() => setExecMode('MACRO')} className={`flex-1 text-center py-1 cursor-pointer rounded-sm transition-colors ${execMode === 'MACRO' ? (isDark ? 'bg-amber-900/60 text-amber-400 shadow' : 'bg-white text-amber-700 shadow') : (isDark ? 'text-slate-500' : 'text-gray-500')}`}>MACRO</div>
      </div>

      {execMode !== 'MACRO' ? (
        <div className="flex flex-col space-y-1">
          <select className={selectCls}><option>VAL.USD</option></select>
          <label className={`flex items-center space-x-1 pl-0.5 text-[9px] font-bold cursor-pointer ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
            <input type="checkbox" className="accent-blue-500 w-3 h-3 cursor-pointer" /><span>Filter</span>
          </label>

          <div className={`flex flex-col border rounded shadow-sm overflow-hidden mt-1 ${isDark ? 'border-blue-800' : 'border-blue-500'}`}>
             <div className={`text-center font-bold py-1 text-[13px] text-white ${isDark ? 'bg-blue-600' : 'bg-blue-500'}`}>QTY</div>
             <input type="number" value={orderQty} onChange={(e) => setOrderQty(Number(e.target.value))} className={`w-full text-center py-1 text-[12px] font-bold outline-none ${isDark ? 'bg-black text-white border-t border-zinc-700' : 'bg-white text-black border-t border-gray-300'}`} />
          </div>

          <div className="grid grid-cols-2 gap-1 mb-1">
             {[1, 5, 10, 50, 100, 'CLR'].map(val => (<div key={val} onClick={() => handleQtyClick(val)} className={presetBtnCls}>{val}</div>))}
          </div>

          {execMode === 'ALGO' && (
            <div className="flex space-x-1 mb-1">
               <select className={`flex-1 ${selectCls} ${isDark ? 'text-purple-300 border-purple-900/50' : 'text-purple-800 border-purple-300'}`} value={algoStrategy} onChange={e => setAlgoStrategy(e.target.value)}>
                  <option value="TWAP">TWAP</option><option value="VWAP">VWAP</option><option value="ICEBERG">ICEBERG</option>
               </select>
            </div>
          )}

          <div className="flex space-x-1 mb-1">
             <input type="number" step="0.05" value={orderPrice} onChange={(e) => setOrderPrice(e.target.value)} className={`flex-1 text-center font-bold text-[12px] py-1 outline-none shadow-inner border rounded-sm ${isDark ? 'bg-black border-zinc-700 text-slate-200' : 'bg-white border-gray-400 text-black'}`} />
             <div onClick={() => setOrderPrice(bestBid.toFixed(2))} className={`px-2 flex items-center justify-center border rounded-sm shadow-sm text-[9px] font-bold cursor-pointer transition-colors ${isDark ? 'bg-zinc-700 border-zinc-600 hover:bg-zinc-600 text-cyan-400' : 'bg-gray-200 border-gray-400 text-cyan-700'}`}>MID</div>
          </div>

          <div className="flex flex-col space-y-0.5 text-white font-bold text-[9px]">
             <div className="grid grid-cols-2 gap-0.5">
               <div onClick={() => cancelOrders('BUY', 'LMT')} className="relative flex items-center justify-center py-1 cursor-pointer rounded-sm border shadow-sm bg-[#3388cc] hover:bg-[#4499dd] border-[#226699]">
                 CXL B-LMT <span className="absolute right-1 top-0.5 text-[7px] opacity-80">{getClosestDecimal('BUY', 'LMT')}</span>
               </div>
               <div onClick={() => cancelOrders('SELL', 'LMT')} className="relative flex items-center justify-center py-1 cursor-pointer rounded-sm border shadow-sm bg-[#cc3333] hover:bg-[#ff4444] border-[#992222]">
                 CXL S-LMT <span className="absolute right-1 top-0.5 text-[7px] opacity-80">{getClosestDecimal('SELL', 'LMT')}</span>
               </div>
               <div onClick={() => cancelOrders('BUY', 'STP')} className="relative flex items-center justify-center py-1 cursor-pointer rounded-sm border shadow-sm bg-[#3388cc] hover:bg-[#4499dd] border-[#226699]">
                 CXL B-STP <span className="absolute right-1 top-0.5 text-[7px] opacity-80">{getClosestDecimal('BUY', 'STP')}</span>
               </div>
               <div onClick={() => cancelOrders('SELL', 'STP')} className="relative flex items-center justify-center py-1 cursor-pointer rounded-sm border shadow-sm bg-[#cc3333] hover:bg-[#ff4444] border-[#992222]">
                 CXL S-STP <span className="absolute right-1 top-0.5 text-[7px] opacity-80">{getClosestDecimal('SELL', 'STP')}</span>
               </div>
             </div>
             <div onClick={() => cancelOrders('ALL', 'ALL')} className={`flex items-center justify-center py-1 cursor-pointer rounded-sm border shadow-sm ${isDark ? 'bg-zinc-600 hover:bg-zinc-500 border-zinc-700' : 'bg-[#aaaaaa] hover:bg-[#bbbbbb] border-[#888888] text-gray-900'}`}>
               CXL ALL OPEN
             </div>
          </div>

          <div className="grid grid-cols-2 gap-0.5 text-white font-bold text-[10px] pt-1">
             <div onClick={() => !buyLocked && executeTrade('BUY', orderQty, 'LMT', Number(orderPrice))} className={`flex items-center justify-center py-1.5 cursor-pointer rounded-sm border shadow-sm ${buyLocked ? 'bg-zinc-800 border-zinc-900 opacity-50 text-slate-500 cursor-not-allowed' : 'bg-cyan-700 hover:bg-cyan-600 border-cyan-800'}`}>
               LMT B <span className="ml-1 text-[8px] opacity-70">.{orderPrice.toString().split('.')[1] || '00'}</span>
             </div>
             <div onClick={() => !sellLocked && executeTrade('SELL', orderQty, 'LMT', Number(orderPrice))} className={`flex items-center justify-center py-1.5 cursor-pointer rounded-sm border shadow-sm ${sellLocked ? 'bg-zinc-800 border-zinc-900 opacity-50 text-slate-500 cursor-not-allowed' : 'bg-orange-700 hover:bg-orange-600 border-orange-800'}`}>
               LMT S <span className="ml-1 text-[8px] opacity-70">.{orderPrice.toString().split('.')[1] || '00'}</span>
             </div>
          </div>

          <div className="flex flex-col space-y-0 text-white font-bold text-[11px] pt-0.5">
             <div onClick={() => !sellLocked && (execMode === 'ALGO' ? triggerAlgo('SELL', orderQty, algoStrategy) : executeTrade('SELL', orderQty, 'MKT'))} className={`relative flex items-center justify-between px-2 py-2 cursor-pointer border shadow-sm rounded-t transition-all ${sellLocked ? 'bg-zinc-800 border-zinc-900 opacity-50 text-slate-500 cursor-not-allowed' : execMode === 'ALGO' ? 'bg-purple-700/80 border-purple-900 hover:bg-purple-600 text-purple-100' : 'bg-red-600 hover:bg-red-500 border-red-800'}`}>
               <span>{execMode === 'ALGO' ? 'ARM S [ALGO]' : 'MKT S'}</span>
               {execMode !== 'ALGO' && !sellLocked && <span className="text-[9px] opacity-80">.{bidDecimal}</span>}
             </div>
             <div onClick={() => executeTrade('FLAT', 0, 'MKT')} className={`relative flex items-center justify-center py-1.5 cursor-pointer border-x border-b shadow-sm transition-all text-[9px] ${isDark ? 'bg-zinc-600 hover:bg-zinc-500 border-zinc-700 text-white' : 'bg-[#aaaaaa] hover:bg-[#bbbbbb] border-[#888888] text-gray-900'}`}>
               {execMode === 'ALGO' ? 'HALT ALGO' : 'FLAT ALL POSITIONS'}
             </div>
             <div onClick={() => !buyLocked && (execMode === 'ALGO' ? triggerAlgo('BUY', orderQty, algoStrategy) : executeTrade('BUY', orderQty, 'MKT'))} className={`relative flex items-center justify-between px-2 py-2 cursor-pointer border-x border-b shadow-sm rounded-b transition-all ${buyLocked ? 'bg-zinc-800 border-zinc-900 opacity-50 text-slate-500 cursor-not-allowed' : execMode === 'ALGO' ? 'bg-purple-700/80 border-purple-900 hover:bg-purple-600 text-purple-100' : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-800'}`}>
               <span>{execMode === 'ALGO' ? 'ARM B [ALGO]' : 'MKT B'}</span>
               {execMode !== 'ALGO' && !buyLocked && <span className="text-[9px] opacity-80">.{askDecimal}</span>}
             </div>
          </div>

          <div className={`flex flex-col space-y-1 pt-2 border-t mt-2 ${isDark ? 'border-zinc-800' : 'border-gray-300'}`}>
            <RiskRow label="RSK %" field="rsk" />
            <RiskRow label="SL (tick)" field="sl" />
            <RiskRow label="TP (tick)" field="tp" />
          </div>

        </div>
      ) : (
        <div className="flex flex-col space-y-2 mt-2 h-full">
           <div className={`text-[10px] font-bold text-center border-b pb-1 mb-1 ${isDark ? 'text-amber-500 border-zinc-800' : 'text-amber-700 border-gray-300'}`}>EXECUTION PLAYBOOK</div>
           <div onClick={() => !buyLocked && executeTrade('BUY', 100, 'MKT')} className={`flex flex-col p-1.5 border rounded shadow-sm cursor-pointer hover:scale-[1.02] transition-transform ${buyLocked ? 'opacity-50 grayscale' : ''} ${isDark ? 'bg-[#1a1500] border-amber-900/50' : 'bg-amber-50 border-amber-200'}`}>
             <span className={`font-bold text-[10px] ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>1. SCALP BURST</span>
             <span className={`text-[8px] ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>BUY 100 @ MKT | SL -2 | TP +5</span>
           </div>
           <div onClick={() => !sellLocked && triggerAlgo('SELL', 500, 'TWAP')} className={`flex flex-col p-1.5 border rounded shadow-sm cursor-pointer hover:scale-[1.02] transition-transform ${sellLocked ? 'opacity-50 grayscale' : ''} ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-gray-100 border-gray-300'}`}>
             <span className={`font-bold text-[10px] ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>2. FADE BREAKOUT</span>
             <span className={`text-[8px] ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>SELL 500 @ TWAP | SLIP 2</span>
           </div>
        </div>
      )}
    </div>
  );
});

// =========================================================================
// SUB-COMPONENT: OMS & RISK BLOTTER (CASH BASIS UPDATE)
// =========================================================================
const OMSBlotter = memo(({ theme, account, execMode }) => {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('POSITIONS');

  useEffect(() => {
    if (execMode === 'ALGO') setActiveTab('ALGO QUEUES');
  }, [execMode]);

  const thCls = `px-2 py-1.5 text-left font-bold tracking-wider border-b ${isDark ? 'border-zinc-800 text-slate-500 bg-zinc-900/50' : 'border-gray-300 text-gray-500 bg-gray-200'}`;
  const tdCls = `px-2 py-1 border-b ${isDark ? 'border-zinc-800/50 text-slate-300' : 'border-gray-200 text-gray-700'}`;
  
  const buyingPower = account.equity - account.usedMargin;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className={`flex border-b text-[10px] font-bold tracking-wider ${isDark ? 'border-zinc-800' : 'border-gray-300'}`}>
        {['ACCOUNTING', 'POSITIONS', 'OPEN ORDERS', 'ALGO QUEUES'].map(tab => (
          <div key={tab} onClick={() => setActiveTab(tab)} className={`px-2 py-1.5 cursor-pointer transition-colors ${
              activeTab === tab ? (isDark ? 'text-cyan-400 border-b-2 border-cyan-400 bg-zinc-900/50' : 'text-cyan-700 border-b-2 border-cyan-600 bg-white') : (isDark ? 'text-slate-500 hover:text-slate-300 hover:bg-zinc-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100')
            }`}>
            {tab}
          </div>
        ))}
      </div>
      <div className={`flex-1 overflow-y-auto text-[10px] font-mono ${isDark ? 'bg-black' : 'bg-white'}`}>
        
        {/* ACCOUNTING MODULE */}
        {activeTab === 'ACCOUNTING' && (
          <div className="p-3 flex flex-col h-full space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className={`p-2 border rounded shadow-inner ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-50 border-gray-300'}`}>
                  <div className={`text-[9px] font-bold mb-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>TOTAL EQUITY</div>
                  <div className={`text-lg font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>${account.equity.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                  <div className={`text-[9px] mt-1 font-bold ${account.totalPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    Open PnL: {account.totalPnL >= 0 ? '+' : ''}${account.totalPnL.toFixed(2)}
                  </div>
                </div>
                <div className={`p-2 border rounded shadow-inner flex flex-col justify-center ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-50 border-gray-300'}`}>
                  <div className="flex justify-between items-end mb-1">
                    <span className={`text-[9px] font-bold ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>BUYING POWER</span>
                    <span className={`font-bold ${buyingPower < 0 ? 'text-red-500' : (isDark ? 'text-slate-300' : 'text-gray-700')}`}>${buyingPower.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className={`h-2.5 rounded-sm overflow-hidden border shadow-inner ${isDark ? 'bg-zinc-800 border-zinc-950' : 'bg-gray-200 border-gray-400'}`}>
                     <div className={`h-full transition-all duration-300 ${account.marginUtilization > 80 ? 'bg-red-500' : 'bg-cyan-500'}`} style={{width: `${Math.min(account.marginUtilization, 100)}%`}}></div>
                  </div>
                  <div className={`text-[8px] mt-1 opacity-70 flex justify-between ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                     <span>UTILIZATION: {account.marginUtilization.toFixed(1)}%</span>
                     <span>NO LEVERAGE (1:1)</span>
                  </div>
                </div>
             </div>

             <div className="flex-1 border rounded flex flex-col overflow-hidden">
                <div className={`px-2 py-1 text-[9px] font-bold border-b ${isDark ? 'bg-zinc-900 border-zinc-800 text-slate-400' : 'bg-gray-200 border-gray-300 text-gray-600'}`}>TRADE AUDIT TRAIL</div>
                <div className="flex-1 overflow-y-auto">
                   <table className="w-full whitespace-nowrap">
                     <tbody>
                       {account.history.length === 0 && <tr><td className="p-2 text-center opacity-50">NO TRADES EXECUTED</td></tr>}
                       {[...account.history].reverse().map((trade, i) => (
                         <tr key={i} className={`hover:${isDark ? 'bg-zinc-900' : 'bg-gray-50'}`}>
                           <td className={tdCls}>{trade.time}</td>
                           <td className={`${tdCls} font-bold ${trade.side.includes('BUY') ? 'text-emerald-500' : (trade.side.includes('SELL') ? 'text-red-500' : 'text-cyan-500')}`}>{trade.side}</td>
                           <td className={tdCls}>{trade.qty}</td>
                           <td className={tdCls}>${trade.price.toFixed(2)}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

        {/* POSITIONS TABLE */}
        {activeTab === 'POSITIONS' && (
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr><th className={thCls}>SYM</th><th className={thCls}>SIDE</th><th className={thCls}>QTY</th><th className={thCls}>ENTRY</th><th className={thCls}>U-PNL</th></tr>
            </thead>
            <tbody>
              {account.positions.length === 0 && <tr><td colSpan="5" className="p-2 text-center opacity-50">FLAT BOOK</td></tr>}
              {account.positions.map((pos) => (
                <tr key={pos.id} className={`hover:${isDark ? 'bg-zinc-900' : 'bg-gray-50'}`}>
                  <td className={`${tdCls} font-bold ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>VAL.USD</td>
                  <td className={`${tdCls} font-bold ${pos.side === 'BUY' ? 'text-emerald-500' : 'text-red-500'}`}>{pos.side === 'BUY' ? 'LONG' : 'SHORT'}</td>
                  <td className={tdCls}>{pos.qty}</td>
                  <td className={tdCls}>${pos.entry.toFixed(2)}</td>
                  <td className={`${tdCls} font-bold ${pos.upnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{pos.upnl >= 0 ? '+' : ''}{pos.upnl.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* OPEN ORDERS (LMT/STP/SL/TP) TABLE */}
        {activeTab === 'OPEN ORDERS' && (
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr><th className={thCls}>ID</th><th className={thCls}>SIDE</th><th className={thCls}>TYPE</th><th className={thCls}>QTY</th><th className={thCls}>PRICE</th></tr>
            </thead>
            <tbody>
              {account.openOrders.length === 0 && <tr><td colSpan="5" className="p-2 text-center opacity-50">NO WORKING ORDERS</td></tr>}
              {account.openOrders.map((ord) => (
                <tr key={ord.id} className={`hover:${isDark ? 'bg-zinc-900' : 'bg-gray-50'}`}>
                  <td className={tdCls}>#{ord.id}</td>
                  <td className={`${tdCls} font-bold ${ord.side === 'BUY' ? 'text-emerald-500' : 'text-red-500'}`}>{ord.side}</td>
                  <td className={`${tdCls} font-bold ${ord.type === 'SL' ? 'text-orange-400' : ord.type === 'TP' ? 'text-cyan-400' : (isDark ? 'text-slate-300' : 'text-gray-700')}`}>{ord.type}</td>
                  <td className={tdCls}>{ord.qty}</td>
                  <td className={`${tdCls} font-bold`}>${ord.price.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ALGO QUEUES */}
        {activeTab === 'ALGO QUEUES' && (
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr><th className={thCls}>ID</th><th className={thCls}>TYPE</th><th className={thCls}>SIDE</th><th className={thCls}>PROGRESS</th><th className={thCls}>STATUS</th></tr>
            </thead>
            <tbody>
              {account.algoQueues.length === 0 && <tr><td colSpan="5" className="p-2 text-center opacity-50">ALGO ENGINE WAITING FOR ARM SIGNAL</td></tr>}
              {[...account.algoQueues].reverse().map((algo) => {
                const progress = (algo.filled / algo.total) * 100;
                return (
                  <tr key={algo.id} className={`hover:${isDark ? 'bg-zinc-900' : 'bg-gray-50'}`}>
                    <td className={tdCls}>{algo.id}</td>
                    <td className={`${tdCls} font-bold ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>{algo.type}</td>
                    <td className={`${tdCls} font-bold ${algo.side === 'BUY' ? 'text-emerald-500' : 'text-red-500'}`}>{algo.side}</td>
                    <td className={`${tdCls} w-48`}>
                       <div className="flex items-center space-x-2">
                         <span className={`text-[9px] font-bold opacity-80 w-12 text-right ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{algo.filled}/{algo.total}</span>
                         <div className={`flex-1 h-2.5 rounded-sm overflow-hidden border shadow-inner ${isDark ? 'bg-zinc-800 border-zinc-900' : 'bg-gray-200 border-gray-300'}`}>
                           <div className={`h-full transition-all duration-300 ${algo.status === 'COMPLETED' ? 'bg-emerald-500' : (isDark ? 'bg-purple-500' : 'bg-purple-600')}`} style={{width: `${progress}%`}}></div>
                         </div>
                       </div>
                    </td>
                    <td className={`${tdCls} font-bold ${algo.status === 'COMPLETED' ? 'text-emerald-500' : 'text-cyan-400'}`}>{algo.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
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
    }, 500);
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
// ISOLATED COMPONENTS: CHARTS (WITH EXECUTION MARKERS & GLOBAL VWAP)
// =========================================================================
const PriceWaveChart = memo(({ theme, midPriceRef, latestFills, cumulativeAlgoVwap, globalMarketStats }) => {
  const [chartData, setChartData] = useState([]);
  const isDark = theme === 'dark';

  useEffect(() => {
    const chartInterval = setInterval(() => {
      if (midPriceRef.current !== null) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        const buyMark = latestFills.current.buys.length > 0 ? latestFills.current.buys[latestFills.current.buys.length - 1] : null;
        const sellMark = latestFills.current.sells.length > 0 ? latestFills.current.sells[latestFills.current.sells.length - 1] : null;
        
        const algoVwap = cumulativeAlgoVwap.current.vol > 0 ? (cumulativeAlgoVwap.current.dollars / cumulativeAlgoVwap.current.vol).toFixed(2) : null;
        const globalVwap = globalMarketStats.current.vol > 0 ? (globalMarketStats.current.dollars / globalMarketStats.current.vol).toFixed(2) : null;
        
        setChartData(prev => {
          const newPoint = { time, price: midPriceRef.current, buyMark, sellMark, algoVwap, globalVwap };
          if (prev.length > 200) return [...prev.slice(1), newPoint]; 
          return [...prev, newPoint];
        });
        
        latestFills.current = { buys: [], sells: [] };
      }
    }, 1000);
    return () => clearInterval(chartInterval);
  }, [midPriceRef, latestFills, cumulativeAlgoVwap, globalMarketStats]);

  if (chartData.length === 0) return <div className="h-full w-full flex items-center justify-center text-slate-600">AWAITING MATRIX TICK...</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="cyanGlowDark" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3ee" stopOpacity={0.15}/><stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/></linearGradient>
          <linearGradient id="cyanGlowLight" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0891b2" stopOpacity={0.15}/><stop offset="95%" stopColor="#0891b2" stopOpacity={0}/></linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="1 4" stroke={isDark ? '#1f2937' : '#e5e7eb'} />
        <XAxis dataKey="time" stroke={isDark ? '#4b5563' : '#9ca3af'} tickLine={false} />
        <YAxis stroke={isDark ? '#4b5563' : '#9ca3af'} domain={['auto', 'auto']} tickLine={false} />
        <Tooltip contentStyle={{ backgroundColor: isDark ? '#09090b' : '#ffffff', borderColor: isDark ? '#27272a' : '#e5e7eb', color: isDark ? '#22d3ee' : '#0e7490' }} />
        
        <Area type="monotone" dataKey="price" stroke={isDark ? '#22d3ee' : '#0891b2'} strokeWidth={1.5} fillOpacity={1} fill={isDark ? 'url(#cyanGlowDark)' : 'url(#cyanGlowLight)'} isAnimationActive={false} />
        
        {/* Global VWAP (Permanent Yellow Ribbon) */}
        <Line type="monotone" dataKey="globalVwap" stroke="#eab308" strokeWidth={2} dot={false} strokeDasharray="5 5" isAnimationActive={false} />
        
        {/* Algo VWAP (Purple Ribbon) */}
        <Line type="monotone" dataKey="algoVwap" stroke="#a855f7" strokeWidth={2} dot={false} strokeDasharray="3 3" isAnimationActive={false} />
        
        <Line type="monotone" dataKey="buyMark" stroke="none" dot={{ stroke: '#10b981', strokeWidth: 2, fill: '#064e3b', r: 4 }} isAnimationActive={false} />
        <Line type="monotone" dataKey="sellMark" stroke="none" dot={{ stroke: '#ef4444', strokeWidth: 2, fill: '#7f1d1d', r: 4 }} isAnimationActive={false} />

        <Brush dataKey="time" height={15} stroke={isDark ? '#22d3ee' : '#0891b2'} fill={isDark ? '#09090b' : '#f3f4f6'} travellerWidth={12} tickFormatter={() => ''} />
      </ComposedChart>
    </ResponsiveContainer>
  );
});

const DepthMountainChart = memo(({ theme, bids, asks }) => {
  const isDark = theme === 'dark';

  const depthData = useMemo(() => {
    const topBids = [...bids].slice(0, 40).sort((a,b) => b[0] - a[0]);
    const topAsks = [...asks].slice(0, 40).sort((a,b) => a[0] - b[0]);
    
    let cumBid = 0, bidPoints = [];
    topBids.forEach(([p, q]) => { cumBid += q; bidPoints.push({ price: p.toFixed(2), bidVol: cumBid, darkBidVol: cumBid * 1.8, askVol: 0, darkAskVol: 0 }); });
    bidPoints.reverse(); 

    let cumAsk = 0, askPoints = [];
    topAsks.forEach(([p, q]) => { cumAsk += q; askPoints.push({ price: p.toFixed(2), bidVol: 0, darkBidVol: 0, askVol: cumAsk, darkAskVol: cumAsk * 1.8 }); });

    return [...bidPoints, ...askPoints];
  }, [bids, asks]);

  if (depthData.length === 0) return <div className="h-full w-full flex items-center justify-center text-slate-600">AWAITING LIQUIDITY...</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={depthData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
         <defs>
           <linearGradient id="bidGlow" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
           <linearGradient id="askGlow" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
           <linearGradient id="darkBidGlow" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
           <linearGradient id="darkAskGlow" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
         </defs>
         <CartesianGrid strokeDasharray="1 4" stroke={isDark ? '#1f2937' : '#e5e7eb'} vertical={false} />
         <XAxis dataKey="price" stroke={isDark ? '#4b5563' : '#9ca3af'} tickLine={false} />
         <YAxis stroke={isDark ? '#4b5563' : '#9ca3af'} tickLine={false} />
         <Tooltip contentStyle={{ backgroundColor: isDark ? '#09090b' : '#ffffff', borderColor: isDark ? '#27272a' : '#e5e7eb' }} />
         <Area type="stepBefore" dataKey="darkBidVol" stroke="#10b981" strokeWidth={1} strokeDasharray="3 3" fillOpacity={1} fill="url(#darkBidGlow)" isAnimationActive={false} />
         <Area type="stepAfter" dataKey="darkAskVol" stroke="#ef4444" strokeWidth={1} strokeDasharray="3 3" fillOpacity={1} fill="url(#darkAskGlow)" isAnimationActive={false} />
         <Area type="stepBefore" dataKey="bidVol" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#bidGlow)" isAnimationActive={false} />
         <Area type="stepAfter" dataKey="askVol" stroke="#ef4444" strokeWidth={1.5} fillOpacity={1} fill="url(#askGlow)" isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
});

// =========================================================================
// SUB-COMPONENT: COMMS TURRET (FULL CAPACITY & LCD KEYPAD)
// =========================================================================
const TradingTurret = memo(({ theme }) => {
  const isDark = theme === 'dark';
  const hardwareBg = isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-[#e5e7eb] border-[#d1d5db]';
  const screenBg = 'bg-black border-zinc-800 text-white'; 
  
  const [dialed, setDialed] = useState("");
  const [callState, setCallState] = useState("IDLE");

  const handleKey = (k) => {
     if (callState !== "IDLE") return;
     if (k === 'CLR') setDialed('');
     else setDialed(p => p.length < 15 ? p + k : p);
  };

  const handleCall = () => { if(dialed) { setCallState("CALLING..."); setTimeout(() => setCallState("CONNECTED"), 1500); } };
  const handleHangup = () => { setCallState("IDLE"); setDialed(""); };

  const LineBtn = ({ color, title, sub }) => (
    <div className={`bg-${color}-700/80 hover:bg-${color}-600 cursor-pointer border border-${color}-800 rounded-sm px-1.5 py-0.5 flex flex-col shadow-sm mb-1`}>
      <span className="text-[9px] font-bold truncate leading-tight">{title}</span>
      {sub && <span className="text-[7px] text-${color}-200 opacity-70 truncate leading-tight">{sub}</span>}
    </div>
  );

  return (
    <div className={`flex-1 rounded border-y-[3px] border-x shadow-xl p-2 flex space-x-2 ${hardwareBg} overflow-hidden font-sans`}>
      <div className="flex-1 flex space-x-1">
        <div className="flex flex-col justify-around py-1">{[1,2,3,4].map(i => <div key={`ls-${i}`} className={`w-2.5 h-1.5 rounded-sm shadow-inner ${isDark ? 'bg-zinc-700' : 'bg-gray-400'}`}></div>)}</div>
        <div className={`flex-1 rounded shadow-inner border-2 flex flex-col p-1 ${screenBg}`}>
           <div className="text-[7px] text-slate-400 font-bold text-center border-b border-zinc-800 mb-1 pb-0.5 tracking-widest uppercase">GLOBAL HOOT</div>
           <div className="overflow-y-auto space-y-1 pr-1 custom-scrollbar">
             <LineBtn color="green" title="LDN Desk" sub="7002" />
             <LineBtn color="blue" title="NYC Quant" sub="+1 212-555" />
             <LineBtn color="purple" title="Darkpool C" sub="DIRECT" />
             <LineBtn color="blue" title="HK Algo" sub="8004" />
           </div>
           <div className="mt-auto pt-1"><LineBtn color="red" title="HOTLINE" /></div>
        </div>
      </div>
      <div className="flex-1 flex space-x-1">
        <div className={`flex-1 rounded shadow-inner border-2 flex flex-col p-1 ${screenBg}`}>
           <div className="text-[7px] text-slate-400 font-bold text-center border-b border-zinc-800 mb-1 pb-0.5 tracking-widest uppercase">CORP LINES</div>
           <div className="overflow-y-auto space-y-1 pr-1 custom-scrollbar">
             <LineBtn color="orange" title="Shared Lines" />
             <LineBtn color="zinc" title="Tokyo Macro" sub="EXT 44" />
             <LineBtn color="zinc" title="Options Desk" sub="EXT 12" />
             <LineBtn color="zinc" title="Risk Dept" sub="EXT 99" />
             <LineBtn color="zinc" title="Prime Broker" sub="EXTERNAL" />
           </div>
        </div>
        <div className="flex flex-col justify-around py-1">{[1,2,3,4].map(i => <div key={`rs-${i}`} className={`w-2.5 h-1.5 rounded-sm shadow-inner ${isDark ? 'bg-zinc-700' : 'bg-gray-400'}`}></div>)}</div>
      </div>
      <div className="w-[85px] flex flex-col space-y-1 justify-center pl-1">
        {/* Mock LCD Screen */}
        <div className="bg-black border-2 border-zinc-700 rounded mb-1 px-1 h-8 flex flex-col justify-center items-end text-green-400 font-mono text-[9px] shadow-inner overflow-hidden relative">
           {callState === "CALLING..." && <div className="absolute top-0 left-1 animate-pulse text-[7px] text-yellow-500">DIALING</div>}
           {callState === "CONNECTED" && <div className="absolute top-0 left-1 animate-pulse text-[7px] text-green-500">LIVE</div>}
           <div className="tracking-widest truncate w-full text-right">{dialed || "___"}</div>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {['1','2','3','4','5','6','7','8','9','CLR','0','#'].map(k => (
            <div key={k} onClick={() => handleKey(k)} className={`h-4 flex items-center justify-center rounded-sm shadow-sm text-[8px] font-bold cursor-pointer transition-colors ${isDark ? 'bg-[#27272a] text-slate-300 border-b border-[#111] hover:bg-[#3f3f46]' : 'bg-gray-100 text-gray-700 border-b border-gray-300 hover:bg-white'}`}>{k}</div>
          ))}
        </div>
        <div className="flex space-x-1 pt-1">
           <div onClick={handleCall} className="flex-1 h-5 rounded shadow bg-green-600 hover:bg-green-500 border-b-2 border-green-800 cursor-pointer flex items-center justify-center text-white text-[10px]">☏</div>
           <div onClick={handleHangup} className="flex-1 h-5 rounded shadow bg-red-600 hover:bg-red-500 border-b-2 border-red-800 cursor-pointer flex items-center justify-center text-white text-[10px]">☎</div>
        </div>
      </div>
    </div>
  );
});

// =========================================================================
// MAIN APP COMPONENT (SIMULATION GATEWAY CORE)
// =========================================================================
export default function App() {
  const [theme, setTheme] = useState('dark');
  const [isConnected, setIsConnected] = useState(false);
  const [corrAlert, setCorrAlert] = useState(false);
  
  const [bids, setBids] = useState([]);
  const [asks, setAsks] = useState([]);
  
  const [execMode, setExecMode] = useState('DIRECT'); 
  const [algoStrategy, setAlgoStrategy] = useState('TWAP');

  const [riskParams, setRiskParams] = useState({
    rsk: { enabled: true, value: 0.1 },
    sl: { enabled: true, value: 5 }, 
    tp: { enabled: true, value: 5 }
  });

  const latestMarketData = useRef({ bids: [], asks: [] });
  const latestMidPriceRef = useRef(null);
  const latestFills = useRef({ buys: [], sells: [] });
  
  // VWAP Tracking
  const cumulativeAlgoVwap = useRef({ vol: 0, dollars: 0 });
  const globalMarketStats = useRef({ vol: 15000, dollars: 15000 * 100.00 }); // Base init to stabilize line
  const algoDeltaProfile = useRef({}); 
  
  const [account, setAccount] = useState({
    balance: 100000,
    usedMargin: 0,
    equity: 100000,
    marginUtilization: 0,
    totalPnL: 0,
    positions: [],
    history: [],
    algoQueues: [],
    openOrders: [] 
  });

  const isDark = theme === 'dark';
  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const TICK_SIZE = 0.05;

  // =========================================================================
  // GATEWAY EXECUTION LOGIC
  // =========================================================================
  const executeTrade = useCallback((side, qty, type = 'MKT', price = null) => {
    if (qty <= 0 && side !== 'FLAT') return;
    
    const currentAsk = latestMarketData.current.asks[0] ? latestMarketData.current.asks[0][0] : 100.05;
    const currentBid = latestMarketData.current.bids[0] ? latestMarketData.current.bids[0][0] : 99.95;
    const execPrice = side === 'BUY' ? currentAsk : currentBid;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const slOffset = riskParams.sl.enabled ? riskParams.sl.value * TICK_SIZE : null;
    const tpOffset = riskParams.tp.enabled ? riskParams.tp.value * TICK_SIZE : null;

    setAccount(prev => {
      let newPositions = [...prev.positions];
      let newHistory = [...prev.history];
      let newOpenOrders = [...prev.openOrders];

      const buyingPower = prev.equity - prev.usedMargin;
      const netQty = newPositions.reduce((acc, p) => acc + (p.side === 'BUY' ? p.qty : -p.qty), 0);

      if (side === 'FLAT') {
        let realizedPnL = 0;
        newPositions.forEach(pos => {
          const exitPrice = pos.side === 'BUY' ? currentBid : currentAsk;
          realizedPnL += (pos.side === 'BUY' ? (exitPrice - pos.entry) : (pos.entry - exitPrice)) * pos.qty;
          newHistory.push({ time: timeStr, side: `CLOSE ${pos.side}`, qty: pos.qty, price: exitPrice });
          latestFills.current[pos.side === 'BUY' ? 'sells' : 'buys'].push(exitPrice);
        });
        return { ...prev, balance: prev.balance + realizedPnL, equity: prev.balance + realizedPnL, usedMargin: 0, marginUtilization: 0, totalPnL: 0, positions: [], openOrders: [], algoQueues: [], history: newHistory };
      }

      if (type === 'LMT' || type === 'STP') {
         newOpenOrders.push({ id: Math.floor(Math.random() * 9000), side, type, qty, price: price || execPrice, slOffset, tpOffset });
         return { ...prev, openOrders: newOpenOrders };
      }

      // Directional Lock Enforcement for Direct MKT execution
      const notional = qty * execPrice;
      if (side === 'BUY' && buyingPower < notional && netQty >= 0) return prev; 
      if (side === 'SELL' && buyingPower < notional && netQty <= 0) return prev;

      const posId = Math.floor(Math.random() * 9000);
      const existingPos = newPositions.find(p => p.side === side);
      
      if (existingPos) {
          existingPos.qty += qty;
          existingPos.entry = ((existingPos.entry * (existingPos.qty - qty)) + (execPrice * qty)) / existingPos.qty;
      } else {
          newPositions.push({ id: posId, side, qty, entry: execPrice, upnl: 0 });
      }
      
      newHistory.push({ time: timeStr, side, qty, price: execPrice });
      latestFills.current[side === 'BUY' ? 'buys' : 'sells'].push(execPrice);

      const exitSide = side === 'BUY' ? 'SELL' : 'BUY';
      if (slOffset) newOpenOrders.push({ id: Math.floor(Math.random() * 9000), side: exitSide, type: 'SL', qty, price: side === 'BUY' ? execPrice - slOffset : execPrice + slOffset, linkedPos: existingPos ? existingPos.id : posId });
      if (tpOffset) newOpenOrders.push({ id: Math.floor(Math.random() * 9000), side: exitSide, type: 'TP', qty, price: side === 'BUY' ? execPrice + tpOffset : execPrice - tpOffset, linkedPos: existingPos ? existingPos.id : posId });

      const totalMargin = newPositions.reduce((acc, pos) => acc + (pos.qty * pos.entry), 0);
      return { ...prev, positions: newPositions, openOrders: newOpenOrders, history: newHistory, usedMargin: totalMargin };
    });
  }, [riskParams]);

  // ALGO TRIGGER NOW ACCEPTS RISK PARAMS
  const triggerAlgo = useCallback((side, totalQty, strategy) => {
    if (totalQty <= 0) return;
    const slOffset = riskParams.sl.enabled ? riskParams.sl.value * TICK_SIZE : null;
    const tpOffset = riskParams.tp.enabled ? riskParams.tp.value * TICK_SIZE : null;
    const newAlgo = { id: `#ALG-${Math.floor(1000 + Math.random()*9000)}`, type: strategy, side, total: totalQty, filled: 0, status: 'WORKING', slOffset, tpOffset };
    setAccount(prev => ({ ...prev, algoQueues: [...prev.algoQueues, newAlgo] }));
  }, [riskParams]);

  const cancelOrders = useCallback((side, type) => {
    setAccount(prev => {
       if (side === 'ALL') return { ...prev, openOrders: [] };
       const remaining = prev.openOrders.filter(o => !(o.side === side && o.type === type));
       return { ...prev, openOrders: remaining };
    });
  }, []);

  // =========================================================================
  // MATCHING ENGINE & PNL METRONOME
  // =========================================================================
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
      const currentMid = latestMidPriceRef.current;
      const currentAsk = data.asks && data.asks.length > 0 ? data.asks[0][0] : null;
      const currentBid = data.bids && data.bids.length > 0 ? data.bids[0][0] : null;
      
      if (data.bids) setBids(data.bids);
      if (data.asks) setAsks(data.asks);
      if (Math.random() > 0.95) { setCorrAlert(true); setTimeout(() => setCorrAlert(false), 2000); }

      if (currentMid && currentAsk && currentBid) {
          
          // Simulate Global Market Volume for VWAP Tracker
          const tickVol = Math.floor(Math.random() * 100) + 10;
          globalMarketStats.current.vol += tickVol;
          globalMarketStats.current.dollars += tickVol * currentMid;

          setAccount(prev => {
              let updatedPositions = [...prev.positions];
              let updatedHistory = [...prev.history];
              let updatedAlgos = [...prev.algoQueues];
              let updatedOpenOrders = [...prev.openOrders];
              let realizedBalanceAcc = prev.balance;
              let requiresUpdate = false;
              const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

              // 1. LOB Engine (LMT, SL, TP)
              const remainingOrders = [];
              updatedOpenOrders.forEach(ord => {
                 let triggered = false;
                 let execPrice = ord.price;

                 if (ord.type === 'LMT') {
                    if (ord.side === 'BUY' && currentAsk <= ord.price) { triggered = true; execPrice = currentAsk; }
                    if (ord.side === 'SELL' && currentBid >= ord.price) { triggered = true; execPrice = currentBid; }
                 } else if (ord.type === 'SL') {
                    if (ord.side === 'BUY' && currentAsk >= ord.price) { triggered = true; execPrice = currentAsk; }
                    if (ord.side === 'SELL' && currentBid <= ord.price) { triggered = true; execPrice = currentBid; }
                 } else if (ord.type === 'TP') {
                    if (ord.side === 'BUY' && currentAsk <= ord.price) { triggered = true; }
                    if (ord.side === 'SELL' && currentBid >= ord.price) { triggered = true; }
                 }

                 if (triggered) {
                    requiresUpdate = true;
                    latestFills.current[ord.side === 'BUY' ? 'buys' : 'sells'].push(execPrice);
                    
                    if (ord.type === 'LMT') {
                        const posId = Math.floor(Math.random() * 9000);
                        updatedPositions.push({ id: posId, side: ord.side, qty: ord.qty, entry: execPrice, upnl: 0 });
                        updatedHistory.push({ time: timeStr, side: `LMT ${ord.side}`, qty: ord.qty, price: execPrice });
                        
                        const exitSide = ord.side === 'BUY' ? 'SELL' : 'BUY';
                        if (ord.slOffset) remainingOrders.push({ id: Math.floor(Math.random()*9000), side: exitSide, type: 'SL', qty: ord.qty, price: ord.side === 'BUY' ? execPrice - ord.slOffset : execPrice + ord.slOffset, linkedPos: posId });
                        if (ord.tpOffset) remainingOrders.push({ id: Math.floor(Math.random()*9000), side: exitSide, type: 'TP', qty: ord.qty, price: ord.side === 'BUY' ? execPrice + ord.tpOffset : execPrice - ord.tpOffset, linkedPos: posId });
                    } else if (ord.type === 'SL' || ord.type === 'TP') {
                        const posIndex = updatedPositions.findIndex(p => p.id === ord.linkedPos);
                        if (posIndex !== -1) {
                            const pos = updatedPositions[posIndex];
                            const pnl = pos.side === 'BUY' ? (execPrice - pos.entry) * pos.qty : (pos.entry - execPrice) * pos.qty;
                            realizedBalanceAcc += pnl;
                            updatedPositions.splice(posIndex, 1);
                            updatedHistory.push({ time: timeStr, side: `${ord.type} ${ord.side}`, qty: ord.qty, price: execPrice });
                            ord.resolvePos = ord.linkedPos; 
                        }
                    }
                 } else {
                    remainingOrders.push(ord);
                 }
              });

              const resolvedPositions = updatedOpenOrders.filter(o => o.resolvePos).map(o => o.resolvePos);
              updatedOpenOrders = remainingOrders.filter(o => !resolvedPositions.includes(o.linkedPos));

              // 2. Algo Queues (Now appending OCO Risk dynamically)
              updatedAlgos = updatedAlgos.map(algo => {
                  if (algo.status === 'WORKING') {
                      requiresUpdate = true;
                      const sliceAmount = Math.min(Math.floor(Math.random() * 15) + 5, algo.total - algo.filled);
                      algo.filled += sliceAmount;
                      const execPrice = algo.side === 'BUY' ? currentAsk : currentBid;
                      
                      cumulativeAlgoVwap.current.vol += sliceAmount;
                      cumulativeAlgoVwap.current.dollars += sliceAmount * execPrice;
                      latestFills.current[algo.side === 'BUY' ? 'buys' : 'sells'].push(execPrice);
                      const pStr = execPrice.toFixed(2);
                      algoDeltaProfile.current[pStr] = (algoDeltaProfile.current[pStr] || 0) + sliceAmount;

                      updatedHistory.push({ time: timeStr, side: `ALGO ${algo.side}`, qty: sliceAmount, price: execPrice });
                      
                      let targetPosId;
                      const existingPos = updatedPositions.find(p => p.side === algo.side);
                      if (existingPos) {
                          existingPos.qty += sliceAmount;
                          existingPos.entry = ((existingPos.entry * (existingPos.qty - sliceAmount)) + (execPrice * sliceAmount)) / existingPos.qty;
                          targetPosId = existingPos.id;
                      } else {
                          targetPosId = Math.floor(Math.random() * 9000);
                          updatedPositions.push({ id: targetPosId, side: algo.side, qty: sliceAmount, entry: execPrice, upnl: 0 });
                      }

                      // Dynamic Algo OCO Adjustments
                      if (algo.slOffset || algo.tpOffset) {
                          const exitSide = algo.side === 'BUY' ? 'SELL' : 'BUY';
                          const posRef = existingPos || updatedPositions[updatedPositions.length-1];
                          
                          // Purge old OCOs for this algo position to avoid DOM clutter
                          updatedOpenOrders = updatedOpenOrders.filter(o => o.linkedPos !== targetPosId || (o.type !== 'SL' && o.type !== 'TP'));
                          
                          // Spawn fresh OCOs matching new accumulated size and updated average entry price
                          if (algo.slOffset) updatedOpenOrders.push({ id: Math.floor(Math.random()*9000), side: exitSide, type: 'SL', qty: posRef.qty, price: algo.side === 'BUY' ? posRef.entry - algo.slOffset : posRef.entry + algo.slOffset, linkedPos: targetPosId });
                          if (algo.tpOffset) updatedOpenOrders.push({ id: Math.floor(Math.random()*9000), side: exitSide, type: 'TP', qty: posRef.qty, price: algo.side === 'BUY' ? posRef.entry + algo.tpOffset : posRef.entry - algo.tpOffset, linkedPos: targetPosId });
                      }

                      if (algo.filled >= algo.total) algo.status = 'COMPLETED';
                  }
                  return algo;
              });

              // 3. Mark-to-Market PnL
              let currentTotalPnL = 0;
              updatedPositions = updatedPositions.map(pos => {
                  const pnl = pos.side === 'BUY' ? (currentBid - pos.entry) * pos.qty : (pos.entry - currentAsk) * pos.qty;
                  currentTotalPnL += pnl;
                  return { ...pos, upnl: pnl };
              });

              if (!requiresUpdate && prev.positions.length === 0) return prev; 

              const currentEquity = realizedBalanceAcc + currentTotalPnL;
              const totalMargin = updatedPositions.reduce((acc, pos) => acc + (pos.qty * pos.entry), 0);
              const util = currentEquity > 0 ? (totalMargin / currentEquity) * 100 : 100;

              return { ...prev, balance: realizedBalanceAcc, algoQueues: updatedAlgos, openOrders: updatedOpenOrders, positions: updatedPositions, history: updatedHistory, usedMargin: totalMargin, totalPnL: currentTotalPnL, equity: currentEquity, marginUtilization: util };
          });
      }
    }, 150);

    return () => { ws.close(); clearInterval(uiRenderInterval); };
  }, []);

  const askMap = new Map(asks.map(([p, q]) => [p.toFixed(2), q]));
  const bidMap = new Map(bids.map(([p, q]) => [p.toFixed(2), q]));
  const bestAsk = asks.length > 0 ? asks[0][0] : 100.05;
  const bestBid = bids.length > 0 ? bids[0][0] : 99.95;

  const askLadder = [];
  for (let i = 17; i >= 0; i--) {
    const p = (bestAsk + (i * TICK_SIZE)).toFixed(2);
    askLadder.push({ price: p, askQty: askMap.get(p) || 0, bidQty: 0 });
  }

  const bidLadder = [];
  for (let i = 0; i <= 17; i++) {
    const p = (bestBid - (i * TICK_SIZE)).toFixed(2);
    bidLadder.push({ price: p, askQty: 0, bidQty: bidMap.get(p) || 0 });
  }

  const maxVol = Math.max(1, ...askLadder.map(l => l.askQty), ...bidLadder.map(l => l.bidQty));

  return (
    <div className={`h-screen w-screen flex flex-col font-mono text-xs select-none transition-colors duration-300 ${isDark ? 'bg-black text-slate-300' : 'bg-gray-200 text-slate-800'}`}>
      
      {/* MENU BAR */}
      <div className={`flex justify-between items-center px-3 py-1.5 uppercase tracking-wider text-[11px] border-b transition-colors ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-300'}`}>
        <div className="flex items-center space-x-4">
          <span className={`font-bold tracking-widest text-sm ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>VALENCE CORE v1.0</span>
          <button onClick={toggleTheme} className={`px-3 py-1 rounded border text-[9px] font-bold tracking-widest transition-colors ${isDark ? 'border-zinc-700 text-slate-400 hover:bg-zinc-800 hover:text-cyan-400' : 'border-gray-300 text-gray-500 hover:bg-gray-100 hover:text-cyan-700'}`}>
            {isDark ? 'LIGHT THEME' : 'DARK THEME'}
          </button>
          <span className={isDark ? 'text-slate-500' : 'text-gray-400'}>|</span>
          <HeaderClocks isDark={isDark} />
        </div>
        
        <div className={`flex items-center space-x-2 px-3 py-0.5 rounded border transition-colors ${corrAlert ? 'bg-amber-900/80 border-amber-500 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : (isDark ? 'bg-black border-zinc-700 text-slate-500' : 'bg-gray-100 border-gray-300 text-gray-500')}`}>
            <span className="font-bold text-[9px]">CORR-TRACK:</span>
            <span>BTC.USD</span>
            <span className={corrAlert ? 'text-white font-bold' : ''}>+0.42%</span>
            {corrAlert && <span className="animate-ping absolute right-1/2 w-2 h-2 rounded-full bg-amber-400"></span>}
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
            <span className={isDark ? 'text-cyan-400' : 'text-cyan-600'}>150ms</span>
          </div>
        </div>
      </div>

      {/* MONITOR MATRIX */}
      <div className={`flex-1 grid grid-cols-12 gap-px p-px overflow-hidden transition-colors ${isDark ? 'bg-zinc-800' : 'bg-gray-300'}`}>
        
        <div className={`col-span-4 flex border overflow-hidden transition-colors ${isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-gray-200'}`}>
          <div className={`w-[40%] flex flex-col p-2 border-r overflow-hidden transition-colors ${isDark ? 'bg-[#030303] border-zinc-900' : 'bg-gray-50 border-gray-200'}`}>
            <div className={`font-bold border-b pb-1 mb-1 uppercase tracking-wide text-[10px] ${isDark ? 'text-cyan-400 border-zinc-800' : 'text-cyan-700 border-gray-300'}`}>[01A] DOM LADDER</div>
            <div className={`flex text-[9px] border-b pb-1 mb-1 text-center tracking-widest ${isDark ? 'text-slate-500 border-zinc-800' : 'text-gray-500 border-gray-300'}`}>
              <div className="w-1/3">BID</div><div className={`w-1/3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>PRICE</div><div className="w-1/3">ASK</div>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden text-[10px]">
              {askLadder.map((level) => (<DomRow key={`ask-${level.price}`} price={level.price} bidQty={0} askQty={level.askQty} maxVol={maxVol} theme={theme} openOrders={account.openOrders} />))}
              <div className={`h-6 my-1 border-y flex justify-center items-center text-[10px] shrink-0 transition-colors ${isDark ? 'border-cyan-900/50 bg-cyan-950/20 text-slate-400' : 'border-cyan-200 bg-cyan-50 text-gray-500'}`}>
                <span className="mr-2">SPREAD:</span>
                <span className={`font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>{asks.length && bids.length ? `$${(asks[0][0] - bids[0][0]).toFixed(2)}` : "..."}</span>
              </div>
              {bidLadder.map((level) => (<DomRow key={`bid-${level.price}`} price={level.price} bidQty={level.bidQty} askQty={0} maxVol={maxVol} theme={theme} openOrders={account.openOrders} />))}
            </div>
          </div>

          <div className={`w-[40%] flex flex-col p-2 border-r overflow-hidden transition-colors ${isDark ? 'bg-[#030303] border-zinc-900' : 'bg-gray-50 border-gray-200'}`}>
            <div className={`font-bold border-b pb-1 mb-1 uppercase tracking-wide text-[10px] ${isDark ? 'text-blue-400 border-zinc-800' : 'text-blue-700 border-gray-300'}`}>[01B] DELTA</div>
            <div className={`flex text-[9px] border-b pb-1 mb-1 text-center tracking-widest ${isDark ? 'text-slate-500 border-zinc-800' : 'text-gray-500 border-gray-300'}`}>
              <div className="w-full">ASK (-) | BID (+)</div>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden text-[10px]">
              {askLadder.map((level) => (<VolumeRow key={`vol-ask-${level.price}`} price={level.price} qty={level.askQty} isBid={false} maxVol={maxVol} theme={theme} openOrders={account.openOrders} algoDelta={algoDeltaProfile.current} />))}
              <div className="h-6 my-1 border-y border-transparent flex justify-center items-center shrink-0"></div>
              {bidLadder.map((level) => (<VolumeRow key={`vol-bid-${level.price}`} price={level.price} qty={level.bidQty} isBid={true} maxVol={maxVol} theme={theme} openOrders={account.openOrders} algoDelta={algoDeltaProfile.current} />))}
            </div>
          </div>

          <div className={`w-[20%] flex flex-col overflow-hidden transition-colors ${isDark ? 'bg-[#0a0a0c]' : 'bg-gray-100'}`}>
             <ExecutionStrip theme={theme} execMode={execMode} setExecMode={setExecMode} algoStrategy={algoStrategy} setAlgoStrategy={setAlgoStrategy} executeTrade={executeTrade} cancelOrders={cancelOrders} triggerAlgo={triggerAlgo} account={account} riskParams={riskParams} setRiskParams={setRiskParams} bestBid={bestBid} bestAsk={bestAsk} />
          </div>
        </div>

        <div className={`col-span-8 flex flex-col border overflow-hidden transition-colors ${isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-gray-200'}`}>
          <div className="flex-1 flex flex-col overflow-hidden">
            
            <div className={`h-1/2 flex border-b overflow-hidden transition-colors ${isDark ? 'border-zinc-900' : 'border-gray-200'}`}>
              <div className={`w-1/2 flex flex-col p-3 border-r overflow-hidden transition-colors ${isDark ? 'border-zinc-900' : 'border-gray-200'}`}>
                <div className={`font-bold border-b pb-1 mb-2 uppercase tracking-wide text-[10px] ${isDark ? 'text-blue-400 border-zinc-800' : 'text-blue-700 border-gray-300'}`}>[02A] MID-MARKET PRICE WAVE</div>
                <div className={`flex-1 rounded border p-2 text-[10px] min-h-0 transition-colors ${isDark ? 'bg-black border-zinc-900' : 'bg-white border-gray-200'}`}>
                  <PriceWaveChart theme={theme} midPriceRef={latestMidPriceRef} latestFills={latestFills} cumulativeAlgoVwap={cumulativeAlgoVwap} globalMarketStats={globalMarketStats} />
                </div>
              </div>
              <div className="w-1/2 flex flex-col p-3 overflow-hidden">
                <div className={`font-bold border-b pb-1 mb-2 uppercase tracking-wide text-[10px] flex justify-between ${isDark ? 'text-blue-400 border-zinc-800' : 'text-blue-700 border-gray-300'}`}>
                  <span>[02B] LIQUIDITY DEPTH MOUNTAIN</span>
                  <span className={`text-[8px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>SYNTHETIC POOL: ON</span>
                </div>
                <div className={`flex-1 rounded border p-2 text-[10px] min-h-0 transition-colors ${isDark ? 'bg-black border-zinc-900' : 'bg-white border-gray-200'}`}>
                   <DepthMountainChart theme={theme} bids={bids} asks={asks} />
                </div>
              </div>
            </div>

            <div className="h-1/2 flex overflow-hidden">
              <div className={`w-1/2 flex flex-col p-3 border-r overflow-hidden transition-colors ${isDark ? 'border-zinc-900' : 'border-gray-200'}`}>
                <div className={`font-bold border-b pb-1 mb-2 uppercase tracking-wide text-[10px] ${isDark ? 'text-blue-400 border-zinc-800' : 'text-blue-700 border-gray-300'}`}>[02C] OMS & ACCOUNTING BLOTTER</div>
                <div className={`flex-1 rounded border flex flex-col overflow-hidden transition-colors ${isDark ? 'bg-black border-zinc-900' : 'bg-white border-gray-200'}`}>
                  <OMSBlotter theme={theme} account={account} execMode={execMode} />
                </div>
              </div>

              <div className="w-1/2 flex flex-col p-3 overflow-hidden">
                <div className={`font-bold border-b pb-1 mb-2 uppercase tracking-wide text-[10px] ${isDark ? 'text-blue-400 border-zinc-800' : 'text-blue-700 border-gray-300'}`}>[02D] COMMS TURRET</div>
                <div className={`flex-1 rounded border flex flex-col overflow-hidden transition-colors p-1 ${isDark ? 'bg-black border-zinc-900' : 'bg-gray-200 border-gray-300'}`}>
                  <TradingTurret theme={theme} />
                </div>
              </div>
            </div>
            
          </div>

          <div className={`h-[140px] flex border-t overflow-hidden transition-colors ${isDark ? 'border-zinc-900' : 'border-gray-200'}`}>
            <div className={`w-1/2 flex flex-col p-3 border-r transition-colors ${isDark ? 'border-zinc-900' : 'border-gray-200'}`}>
              <div className={`font-bold border-b pb-0.5 mb-1.5 uppercase tracking-wide text-[10px] ${isDark ? 'text-slate-400 border-zinc-800' : 'text-gray-500 border-gray-300'}`}>[03A] BATCH LAYER METRICS</div>
              <div className={`rounded border p-2 flex-1 font-mono text-[11px] space-y-0.5 overflow-y-auto transition-colors ${isDark ? 'bg-black border-zinc-900 text-cyan-500/80' : 'bg-gray-100 border-gray-300 text-cyan-800'}`}>
                <div>&gt; BUYING POWER: DIRECTIONAL LOCKING ACTIVE (CAN ALWAYS CLOSE EXPOSURE)</div>
                <div>&gt; ALGO LOGIC: DYNAMIC OCO RESIZING ACTIVE</div>
                <div>&gt; LOB ENGINE: VWAP TRACKING AND DELTA OVERLAYS INJECTED</div>
                <div>&gt; RISK ENGINE: CASH-BASIS ACCOUNTING ENFORCED (NO LEVERAGE)</div>
              </div>
            </div>
            <div className="w-1/2 flex flex-col p-3">
              <div className={`font-bold border-b pb-0.5 mb-1.5 uppercase tracking-wide text-[10px] ${isDark ? 'text-slate-400 border-zinc-800' : 'text-gray-500 border-gray-300'}`}>[03B] LIVE ORDER TICKER</div>
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