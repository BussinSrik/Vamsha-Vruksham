/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { Person, Relation, NodeLayout, Point } from '../types';
import { cn } from '../lib/utils';

interface TreeCanvasProps {
  people: Person[];
  relations: Relation[];
  layout: Record<string, NodeLayout>;
  locale: 'te' | 'en';
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCollapse: (id: string) => void;
  zoom: number;
}

export function TreeCanvas({ 
  people, 
  relations, 
  layout, 
  locale,
  selectedId, 
  onSelect, 
  onCollapse,
  zoom 
}: TreeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  const panX = useMotionValue(0);
  const panY = useMotionValue(0);
  
  // Spring for smooth transitions if needed
  const springX = useSpring(panX, { stiffness: 300, damping: 30 });
  const springY = useSpring(panY, { stiffness: 300, damping: 30 });

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        setDimensions({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height
        });
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const getLineage = useCallback((startId: string) => {
    const lineage = new Set<string>([startId]);
    const queue = [startId];
    
    // Descendants
    while(queue.length > 0) {
      const id = queue.shift()!;
      relations.filter(r => r.from === id && r.type === 'parent').forEach(r => {
        if (!lineage.has(r.to)) {
          lineage.add(r.to);
          queue.push(r.to);
        }
      });
    }

    // Ancestors
    queue.push(startId);
    while(queue.length > 0) {
      const id = queue.shift()!;
      relations.filter(r => r.to === id && r.type === 'parent').forEach(r => {
        if (!lineage.has(r.from)) {
          lineage.add(r.from);
          queue.push(r.from);
        }
      });
    }

    return lineage;
  }, [relations]);

  const lineageIds = useMemo(() => {
    if (!hoveredId) return new Set<string>();
    return getLineage(hoveredId);
  }, [hoveredId, getLineage]);

  const handleDrag = (_: any, info: { delta: { x: number, y: number } }) => {
    panX.set(panX.get() + info.delta.x);
    panY.set(panY.get() + info.delta.y);
  };

  const getPerson = (id: string) => people.find(p => p.id === id);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative overflow-hidden bg-parchment cursor-grab active:cursor-grabbing"
    >
      <motion.div
        drag
        dragConstraints={containerRef}
        onDrag={handleDrag}
        style={{ 
          x: panX, 
          y: panY, 
          scale: zoom,
          transformOrigin: 'center' 
        }}
        className="absolute inset-0"
      >
        <svg 
          width={2000} 
          height={2000} 
          viewBox="-1000 -1000 2000 2000"
          className="w-full h-full pointer-events-none"
        >
          {/* ILLUSTRATED BANYAN BACKDROP */}
          <g opacity="0.3">
            {/* Massive Deep Trunk */}
            <path d="M -300,1000 Q 0,600 300,1000" fill="#3a2311" />
            <rect x="-120" y="300" width="240" height="700" fill="#3a2311" />
            
            {/* Intricate branching system matching the reference */}
            <path d="M -100,500 C -500,450 -800,400 -1200,200" stroke="#3a2311" strokeWidth="80" fill="none" strokeLinecap="round" />
            <path d="M 100,500 C 500,450 800,400 1200,200" stroke="#3a2311" strokeWidth="80" fill="none" strokeLinecap="round" />
            <path d="M -80,400 C -400,350 -600,100 -600,-300" stroke="#3a2311" strokeWidth="50" fill="none" strokeLinecap="round" />
            <path d="M 80,400 C 400,350 600,100 600,-300" stroke="#3a2311" strokeWidth="50" fill="none" strokeLinecap="round" />
            <path d="M 0,350 Q 0,100 0,-1200" stroke="#3a2311" strokeWidth="40" fill="none" />

            {/* Aerial Roots */}
            <path d="M -400,330 Q -410,600 -400,900" stroke="#3a2311" strokeWidth="8" fill="none" opacity="0.6" />
            <path d="M 400,330 Q 410,600 400,900" stroke="#3a2311" strokeWidth="8" fill="none" opacity="0.6" />

            {/* Lush Foliage Clusters */}
            <g className="foliage">
              <circle cx="-1200" cy="100" r="400" fill="var(--color-leaf)" opacity="0.2" />
              <circle cx="1200" cy="100" r="400" fill="var(--color-leaf)" opacity="0.2" />
              <circle cx="-600" cy="-400" r="450" fill="var(--color-leaf)" opacity="0.2" />
              <circle cx="600" cy="-400" r="450" fill="var(--color-leaf)" opacity="0.2" />
              <circle cx="0" cy="-1000" r="600" fill="var(--color-leaf)" opacity="0.2" />
            </g>
          </g>

          {/* Edges */}
          {relations.map(rel => {
            const from = layout[rel.from];
            const to = layout[rel.to];
            if (!from || !to) return null;

            const isHighlighted = hoveredId && lineageIds.has(rel.from) && lineageIds.has(rel.to);
            const edgeColor = isHighlighted ? 'var(--color-highlight-amber)' : 'var(--color-bark)';
            const edgeWidth = isHighlighted ? 3 : 2;

            if (rel.type === 'parent') {
              // Bézier curves for parent-child (Bottom-up: parent is below child)
              const d = `M ${from.x},${from.y - from.height/2} C ${from.x},${from.y - 120} ${to.x},${to.y + 120} ${to.x},${to.y + to.height/2}`;
              return (
                <path 
                  key={rel.id} 
                  d={d} 
                  stroke={edgeColor} 
                  strokeWidth={edgeWidth} 
                  fill="none" 
                  opacity={isHighlighted ? 1 : 0.6}
                  className="transition-all duration-300"
                />
              );
            } else {
              // Horizontal bar for spouses - Thematic Golden Connection
              const spouseColor = isHighlighted ? 'var(--color-highlight-amber)' : 'var(--color-gold)';
              return (
                <line 
                  key={rel.id}
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={spouseColor}
                  strokeWidth="6"
                  strokeLinecap="round"
                  opacity="0.8"
                  className="transition-all duration-300"
                />
              );
            }
          })}

          {/* Nodes */}
          {Object.values(layout).map(node => {
            const person = getPerson(node.id);
            if (!person) return null;

            const isSelected = selectedId === node.id;
            const isHighlighted = hoveredId ? lineageIds.has(node.id) : true;
            const isLeaf = node.gen > 1; // Ancestors are framed, others are leaves
            const name = locale === 'en' ? (person.nameLatin || person.name) : person.name;

            return (
              <g 
                key={node.id} 
                transform={`translate(${node.x},${node.y})`}
                className="pointer-events-auto cursor-pointer transition-opacity duration-300"
                style={{ opacity: isHighlighted ? 1 : 0.35 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(node.id);
                }}
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {!isLeaf ? (
                  /* TRADITIONAL RECTANGULAR FRAME FOR ANCESTORS */
                  <g>
                    <rect x={-node.width/2 + 4} y={-node.height/2 + 4} width={node.width} height={node.height} rx="8" fill="black" opacity="0.2" />
                    <rect x={-node.width/2} y={-node.height/2} width={node.width} height={node.height} rx="8" fill="var(--color-gold)" stroke="var(--color-bark)" strokeWidth="2" />
                    <rect x={-node.width/2 + 6} y={-node.height/2 + 6} width={node.width - 12} height={node.height - 35} rx="4" fill="var(--color-parchment)" />
                    
                    <defs>
                      <clipPath id={`clip-${person.id}`}>
                        <rect x={-node.width/2 + 8} y={-node.height/2 + 8} width={node.width - 16} height={node.height - 39} rx="2" />
                      </clipPath>
                    </defs>
                    {(person.photoBlob || person.photoRef) ? (
                      <image 
                        href={person.photoBlob || person.photoRef} 
                        x={-node.width/2 + 8} y={-node.height/2 + 8} width={node.width - 16} height={node.height - 39}
                        clipPath={`url(#clip-${person.id})`} preserveAspectRatio="xMidYMid slice"
                      />
                    ) : (
                      <rect x={-node.width/2 + 8} y={-node.height/2 + 8} width={node.width - 16} height={node.height - 39} fill="var(--color-bark)" opacity="0.05" />
                    )}

                    <path d={`M ${-node.width/2 - 5},${node.height/2 - 25} L ${node.width/2 + 5},${node.height/2 - 25} L ${node.width/2},${node.height/2 + 5} L ${-node.width/2},${node.height/2 + 5} Z`} fill="var(--color-banner)" stroke="var(--color-bark)" strokeWidth="1" />
                    <text textAnchor="middle" dy={node.height/2 - 5} className="font-display font-bold text-[10px] fill-bark select-none uppercase tracking-tighter">
                      {name}
                    </text>
                  </g>
                ) : (
                  /* ARTISANAL LEAF SHAPE FOR BRANCHES */
                  <g>
                    <path d="M 0,-40 C 20,-30 40,0 0,40 C -40,0 -20,-30 0,-40" fill="var(--color-leaf)" stroke="#3a2b1a" strokeWidth="1.5" opacity="0.9" transform={`scale(${node.width/80})`} />
                    <text textAnchor="middle" dy="5" className="font-display font-bold text-[11px] fill-white select-none pointer-events-none drop-shadow-md">
                      {name}
                    </text>
                  </g>
                )}

                {isSelected && (
                  <rect x={-node.width/2 - 10} y={-node.height/2 - 10} width={node.width + 20} height={node.height + 20} rx="12" fill="none" stroke="var(--color-gold)" strokeWidth="3" strokeDasharray="6 3" />
                )}

                {/* Collapse/Expand Control */}
                {node.childCount && node.childCount > 0 && node.gen > 0 && (
                  <g 
                    transform={`translate(0, ${node.height/2 + 10})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCollapse(node.id);
                    }}
                  >
                    <circle r="10" fill="var(--color-gold)" stroke="var(--color-parchment)" strokeWidth="2" />
                    <text textAnchor="middle" dy="4" className="fill-bark font-bold text-[12px] select-none">
                      {node.isCollapsed ? `+${node.childCount}` : '−'}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </motion.div>
    </div>
  );
}
