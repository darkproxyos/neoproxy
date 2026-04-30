'use client';

import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { useAesthetics } from '../AestheticProvider';

interface Props {
  data: {
    nodes: any[];
    links: any[];
  };
  width: number;
  height: number;
}

export default function KnowledgeGraphView({ data, width, height }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { tokens } = useAesthetics();

  useEffect(() => {
    if (!svgRef.current || !data || !tokens) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-250))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .attr("stroke", tokens.palette.secondary)
      .attr("stroke-opacity", 0.4)
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("stroke-width", tokens.geometry.borderWidth === '0px' ? 1 : 2);

    const node = svg.append("g")
      .selectAll("g")
      .data(data.nodes)
      .join("g")
      .call(d3.drag<any, any>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    node.append("circle")
      .attr("r", (d: any) => {
        if (d.type === 'CONCEPT') return 14;
        if (d.type === 'DOCUMENT') return 8;
        return 6;
      })
      .attr("fill", (d: any) => {
        if (d.type === 'CONCEPT') return tokens.palette.background;
        if (d.type === 'DOCUMENT') return tokens.palette.accent;
        return tokens.palette.primary;
      })
      .attr("stroke", (d: any) => {
        if (d.type === 'CONCEPT') return tokens.palette.primary;
        return tokens.palette.secondary;
      })
      .attr("stroke-width", tokens.geometry.borderWidth === '0px' ? 1 : 2)
      .style("filter", `drop-shadow(0 0 5px ${tokens.lighting.glow})`);

    node.append("text")
      .text((d: any) => d.name)
      .attr("dx", 18)
      .attr("dy", 4)
      .attr("fill", tokens.palette.primary)
      .style("font-size", "10px")
      .style("font-family", "Space Mono")
      .style("opacity", 0.8);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

  }, [data, width, height]);

  return <svg ref={svgRef} width={width} height={height} style={{ background: 'transparent' }} />;
}
