"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function NeoProxyDashboard() {
  const ref1 = useRef(null);
  const ref2 = useRef(null);
  const ref3 = useRef(null);

  useEffect(() => {
    const archData = [
      { name: "Hardware", value: 15 },
      { name: "Daemons", value: 20 },
      { name: "API Kernel", value: 25 },
      { name: "UI Layer", value: 20 },
      { name: "Operator", value: 20 },
    ];

    const width = 300;
    const height = 300;
    const radius = Math.min(width, height) / 2;

    const svg1 = d3.select(ref1.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const pie = d3.pie().value((d) => d.value);
    const data_ready = pie(archData);

    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    svg1.selectAll("path")
      .data(data_ready)
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => color(d.data.name));

    const signalData = [
      { stage: "Login", value: 10 },
      { stage: "Action", value: 30 },
      { stage: "Reward", value: 50 },
      { stage: "Spend", value: 40 },
      { stage: "Retention", value: 60 },
    ];

    const svg2 = d3.select(ref2.current)
      .append("svg")
      .attr("width", 350)
      .attr("height", 300);

    const x = d3.scaleBand()
      .domain(signalData.map(d => d.stage))
      .range([0, 350])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([300, 0]);

    svg2.selectAll("rect")
      .data(signalData)
      .enter()
      .append("rect")
      .attr("x", d => x(d.stage))
      .attr("y", d => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", d => 300 - y(d.value))
      .attr("fill", "steelblue");

    const nodes = [
      { id: "Hardware" },
      { id: "Daemon" },
      { id: "Kernel" },
      { id: "UI" },
      { id: "Operator" },
    ];

    const links = [
      { source: "Hardware", target: "Kernel" },
      { source: "Kernel", target: "Daemon" },
      { source: "Daemon", target: "UI" },
      { source: "UI", target: "Operator" },
    ];

    const svg3 = d3.select(ref3.current)
      .append("svg")
      .attr("width", 400)
      .attr("height", 300);

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(80))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(200, 150));

    const link = svg3.selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#999");

    const node = svg3.selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", 10)
      .attr("fill", "orange");

    const label = svg3.selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .text(d => d.id)
      .attr("font-size", 10);

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

      label
        .attr("x", d => d.x + 12)
        .attr("y", d => d.y);
    });

  }, []);

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div><div ref={ref1}></div></div>
      <div><div ref={ref2}></div></div>
      <div className="md:col-span-2"><div ref={ref3}></div></div>
    </div>
  );
}
