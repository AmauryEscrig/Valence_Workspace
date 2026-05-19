import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

export default function TradingChart({ data }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // 1. Instantiate the chart layout engine with fallback heights
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth || 600,
      height: 320, // Lock a fixed baseline height to force canvas visibility
      layout: {
        background: { color: '#000000' },
        textColor: '#9ca3af',
        fontFamily: 'monospace',
      },
      grid: {
        vertLines: { color: '#1f2937', style: 1 },
        horzLines: { color: '#1f2937', style: 1 },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: '#22d3ee', width: 1, style: 2 },
        horzLine: { color: '#22d3ee', width: 1, style: 2 },
      },
      timeScale: {
        borderColor: '#27272a',
        timeVisible: true,
        secondsVisible: true,
      },
      rightPriceScale: {
        borderColor: '#27272a',
        autoScale: true, // Force vertical axis to auto-scale around asset value
      },
    });

    const areaSeries = chart.addAreaSeries({
      lineColor: '#22d3ee',
      topColor: 'rgba(34, 211, 238, 0.20)',
      bottomColor: 'rgba(59, 130, 246, 0.00)',
      lineWidth: 2,
    });

    // 2. Safe unique-timestamp data handling
    if (data && data.length > 0) {
      areaSeries.setData(data);
    }

    seriesRef.current = areaSeries;
    chartRef.current = chart;

    // 3. Robust ResizeObserver for layout grids
    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || !chartRef.current) return;
      const { width, height } = entries[0].contentRect;
      chartRef.current.resize(width, height || 320);
    });
    
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []);

  // Sync data updates dynamically
  useEffect(() => {
    if (seriesRef.current && data && data.length > 0) {
      try {
        seriesRef.current.setData(data);
      } catch (err) {
        console.warn("Chart append warning:", err.message);
      }
    }
  }, [data]);

  return (
    <div 
      ref={chartContainerRef} 
      className="w-full h-full min-h-[320px] bg-black"
      style={{ position: 'relative' }} 
    />
  );
}