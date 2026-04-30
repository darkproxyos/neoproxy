"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import KnowledgeGraphView from './KnowledgeGraphView';
import { useAesthetics } from '../AestheticProvider';

export default function Observatory() {
  const chartRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'genealogy' | 'architecture' | 'process' | 'sitemap' | 'evolution' | 'knowledge'>('genealogy');
  const { tokens } = useAesthetics();

  const fetchData = async () => {
    try {
      const res = await fetch('/api/npos/observatory');
      const json = await res.json();
      setData(json.data);
      setLoading(false);
    } catch (e) {
      console.error('Failed to fetch observatory data', e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!data || !chartRef.current || view === 'knowledge' || !tokens) return;

    const width = chartRef.current.clientWidth || 600;
    const height = 300;
    const svg = d3.select(chartRef.current);
    svg.selectAll("*").remove();

    if (view === 'genealogy') {
      renderGenealogy(svg, data.genealogy, width, height, tokens);
    } else if (view === 'architecture') {
      renderArchitecture(svg, data.architecture, width, height, tokens);
    } else if (view === 'process') {
      renderProcess(svg, data.structure, width, height, tokens);
    } else if (view === 'sitemap') {
      renderSitemap(svg, data.sitemap, width, height, tokens);
    } else if (view === 'evolution') {
      renderEvolution(svg, data.evolution, width, height, tokens);
    }

  }, [data, view, tokens]);

  function renderGenealogy(svg: any, genData: any, width: number, height: number, tokens: any) {
    const { nodes, links } = genData;
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id))
      .force("charge", d3.forceManyBody().strength(-100))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g").attr("stroke", tokens.palette.secondary).attr("stroke-opacity", 0.3).selectAll("line").data(links).join("line").attr("stroke-width", 1);
    const node = svg.append("g").selectAll("circle").data(nodes).join("circle").attr("r", 5).attr("fill", (d: any) => d.agent === 'trickzter' ? tokens.palette.accent : tokens.palette.primary);
    
    simulation.on("tick", () => {
      link.attr("x1", (d: any) => d.source.x).attr("y1", (d: any) => d.source.y).attr("x2", (d: any) => d.target.x).attr("y2", (d: any) => d.target.y);
      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);
    });
  }

  function renderArchitecture(svg: any, archData: any, width: number, height: number, tokens: any) {
    const { nodes, links } = archData;
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(80))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g").attr("stroke", tokens.palette.secondary).attr("stroke-opacity", 0.2).selectAll("line").data(links).join("line").attr("stroke-width", 2);
    
    const node = svg.append("g").selectAll("g").data(nodes).join("g");
    
    node.append("circle")
      .attr("r", (d: any) => d.group === '01' ? 10 : 7)
      .attr("fill", tokens.palette.background)
      .attr("stroke", (d: any) => d.group === '01' ? tokens.palette.accent : tokens.palette.primary)
      .attr("stroke-width", 2)
      .style("filter", `drop-shadow(0 0 5px ${tokens.lighting.glow})`);

    node.append("text")
      .text((d: any) => d.id.toUpperCase())
      .attr("fill", tokens.palette.primary)
      .attr("font-size", "8px")
      .attr("dx", 12)
      .attr("dy", 4)
      .style("font-family", "Space Mono")
      .style("opacity", 0.7);

    simulation.on("tick", () => {
      link.attr("x1", (d: any) => d.source.x).attr("y1", (d: any) => d.source.y).attr("x2", (d: any) => d.target.x).attr("y2", (d: any) => d.target.y);
      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });
  }

  function renderProcess(svg: any, procData: any, width: number, height: number, tokens: any) {
    const { stages } = procData;
    const stageWidth = width / stages.length;
    
    const g = svg.append("g").attr("transform", `translate(0, ${height / 2})`);

    const stageNodes = g.selectAll("g")
      .data(stages)
      .join("g")
      .attr("transform", (_d: any, i: number) => `translate(${i * stageWidth + stageWidth/2}, 0)`);

    stageNodes.append("rect")
      .attr("width", 80)
      .attr("height", 40)
      .attr("x", -40)
      .attr("y", -20)
      .attr("fill", (d: any) => d.status === 'ACTIVE' || d.status === 'PROCESSING' ? tokens.palette.primary + '22' : tokens.palette.background)
      .attr("stroke", (d: any) => d.status === 'ACTIVE' || d.status === 'PROCESSING' ? tokens.palette.primary : tokens.palette.secondary)
      .attr("stroke-width", tokens.geometry.borderWidth)
      .attr("rx", tokens.geometry.rounding)
      .attr("stroke-dasharray", (d: any) => d.status === 'PROCESSING' ? "4 2" : "none");

    stageNodes.append("text")
      .text((d: any) => d.label)
      .attr("text-anchor", "middle")
      .attr("dy", 4)
      .attr("fill", tokens.palette.primary)
      .style("font-size", "7px")
      .style("font-family", "Space Mono");
  }

  function renderSitemap(svg: any, sitemapData: any, width: number, height: number, tokens: any) {
    const root = d3.hierarchy(sitemapData);
    const tree = d3.tree().size([height - 40, width - 160]);
    tree(root);

    const g = svg.append("g").attr("transform", "translate(80, 20)");

    g.selectAll(".link")
      .data(root.links())
      .join("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", tokens.palette.secondary)
      .attr("stroke-opacity", 0.3)
      .attr("d", d3.linkHorizontal().x((d: any) => d.y).y((d: any) => d.x) as any);

    const node = g.selectAll(".node")
      .data(root.descendants())
      .join("g")
      .attr("transform", (d: any) => `translate(${d.y},${d.x})`);

    node.append("circle")
      .attr("r", 4)
      .attr("fill", (d: any) => d.children ? tokens.palette.primary : tokens.palette.accent);

    node.append("text")
      .attr("dy", "0.31em")
      .attr("x", (d: any) => d.children ? -8 : 8)
      .attr("text-anchor", (d: any) => d.children ? "end" : "start")
      .text((d: any) => d.data.name)
      .attr("fill", tokens.palette.primary)
      .style("font-size", "8px")
      .style("font-family", "Space Mono")
      .style("opacity", 0.8);
  }

  function renderEvolution(svg: any, evoData: any, width: number, height: number, tokens: any) {
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(evoData.map((d: any) => d.date))
      .range([0, chartWidth])
      .padding(0.1);

    const yValueMax = d3.max(evoData, (d: any) => d.count as number);
    const y = d3.scaleLinear()
      .domain([0, (yValueMax as number) || 1])
      .range([chartHeight, 0]);

    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x).tickSize(0).tickPadding(10))
      .attr("color", tokens.palette.secondary)
      .style("font-size", "6px");

    g.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .attr("color", tokens.palette.secondary)
      .style("font-size", "6px");

    g.selectAll(".bar")
      .data(evoData)
      .join("rect")
      .attr("class", "bar")
      .attr("x", (d: any) => x(d.date) as number)
      .attr("y", (d: any) => y(d.count))
      .attr("width", x.bandwidth())
      .attr("height", (d: any) => chartHeight - y(d.count))
      .attr("fill", "url(#bar-gradient)");

    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "bar-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    gradient.append("stop").attr("offset", "0%").attr("stop-color", tokens.palette.primary);
    gradient.append("stop").attr("offset", "100%").attr("stop-color", tokens.palette.accent);
  }

  if (loading) return <div className="opacity-50">INITIALIZING_OBSERVATORY...</div>;

  return (
    <div className="observatory-panel">
      <div className="metrics-row">
        <div className="obs-header">
            <div className="view-switcher">
                <button onClick={() => setView('genealogy')} className={view === 'genealogy' ? 'active' : ''}>GENEALOGY</button>
                <button onClick={() => setView('architecture')} className={view === 'architecture' ? 'active' : ''}>ARCHITECTURE</button>
                <button onClick={() => setView('process')} className={view === 'process' ? 'active' : ''}>PROCESS</button>
                <button onClick={() => setView('sitemap')} className={view === 'sitemap' ? 'active' : ''}>SITEMAP</button>
                <button onClick={() => setView('evolution')} className={view === 'evolution' ? 'active' : ''}>EVOLUTION</button>
                <button onClick={() => setView('knowledge')} className={view === 'knowledge' ? 'active' : ''}>KNOWLEDGE</button>
            </div>
            <span className={`status-tag ${data?.health.status.toLowerCase()}`}>
              SYSTEM_{data?.health.status}
            </span>
        </div>
        <div className="chart-container">
            {view === 'knowledge' ? (
                <KnowledgeGraphView data={data.knowledge} width={800} height={300} />
            ) : (
                <svg ref={chartRef} className="genealogy-svg" style={{ width: '100%', height: '300px' }} />
            )}
        </div>
      </div>

      <div className="trends-row">
        <div className="trend-item">
          <span className="label">DOMINANT_STYLE:</span>
          <span className="value" style={{ color: tokens?.palette.accent }}>{data?.trends.dominant_style.toUpperCase()}</span>
        </div>
        <div className="trend-item">
          <span className="label">AESTHETIC_RESONANCE:</span>
          <span className="value" style={{ color: tokens?.palette.primary }}>{(data?.trends.resonance_coherence * 100).toFixed(1)}%</span>
        </div>
        <div className="trend-item">
          <span className="label">META_ENTROPY:</span>
          <span className="value">{data?.trends.meta_entropy.toFixed(3)}</span>
        </div>
      </div>

      <style jsx>{`
        .observatory-panel {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .obs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .view-switcher {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .view-switcher button {
          background: rgba(123, 47, 255, 0.05);
          border: 1px solid #7b2fff22;
          color: #4a6080;
          font-family: 'Space Mono', monospace;
          font-size: 0.6rem;
          padding: 4px 10px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .view-switcher button:hover {
          background: rgba(0, 212, 255, 0.1);
          color: #00d4ff;
        }
        .view-switcher button.active {
          background: rgba(0, 212, 255, 0.15);
          border-color: #00d4ff;
          color: #00d4ff;
          box-shadow: 0 0 10px rgba(0, 212, 255, 0.1);
        }
        .status-tag {
          font-size: 0.6rem;
          padding: 2px 6px;
          border: 1px solid;
          font-family: 'Space Mono', monospace;
        }
        .status-tag.stable { color: #5ef0c0; border-color: #5ef0c044; }
        .status-tag.warning { color: #f0e05e; border-color: #f0e05e44; }
        .chart-container {
          background: radial-gradient(circle at center, rgba(10, 25, 45, 0.3) 0%, rgba(2, 4, 8, 0.5) 100%);
          border: 1px solid #1a2c42;
          border-radius: 4px;
          overflow: hidden;
          min-height: 300px;
        }
        .genealogy-svg {
          width: 100%;
          height: 300px;
        }
        .trends-row {
          display: flex;
          gap: 2rem;
          padding: 1rem;
          background: rgba(123, 47, 255, 0.05);
          border: 1px solid #7b2fff22;
        }
        .trend-item {
          display: flex;
          flex-direction: column;
        }
        .label { font-size: 0.55rem; color: #4a6080; }
        .value { font-size: 0.9rem; font-family: 'Space Mono', monospace; }
        .text-purple { color: #7b2fff; }
      `}</style>
    </div>
  );
}
