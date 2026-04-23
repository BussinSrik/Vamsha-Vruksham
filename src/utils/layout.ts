/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NodeLayout, Person, Relation } from '../types';

const BASE_WIDTH = 140;
const BASE_HEIGHT = 80;
const GEN_HEIGHT = 220;
const MIN_NODE_GAP = 30;
const SPOUSE_GAP = 10;

export function computeLayout(
  people: Person[],
  relations: Relation[],
  genMap: Record<string, number>,
  collapsedNodes: Set<string>
): Record<string, NodeLayout> {
  const layout: Record<string, NodeLayout> = {};
  const gens: Record<number, string[]> = {};

  // Group by generation
  Object.entries(genMap).forEach(([id, gen]) => {
    if (!gens[gen]) gens[gen] = [];
    gens[gen].push(id);
  });

  const maxGen = Math.max(...Object.values(genMap), 0);

  // Simple layout with spouse grouping
  Object.entries(gens).forEach(([genStr, ids]) => {
    const gen = parseInt(genStr);
    const scale = Math.max(0.7, 1.2 - gen * 0.15);
    const width = BASE_WIDTH * scale;
    const height = BASE_HEIGHT * scale;
    
    // Sort IDs to put spouses together
    const sortedIds: string[] = [];
    const processed = new Set<string>();

    ids.forEach(id => {
      if (processed.has(id)) return;
      sortedIds.push(id);
      processed.add(id);
      
      const spouse = relations.find(r => (r.from === id || r.to === id) && r.type === 'spouse');
      if (spouse) {
        const spouseId = spouse.from === id ? spouse.to : spouse.from;
        if (ids.includes(spouseId) && !processed.has(spouseId)) {
          sortedIds.push(spouseId);
          processed.add(spouseId);
        }
      }
    });

    // Calculate total width with spouse grouping
    let currentX = 0;
    const xOffsets: Record<string, number> = {};
    
    for (let i = 0; i < sortedIds.length; i++) {
        const id = sortedIds[i];
        const hasNextSpouse = i < sortedIds.length - 1 && relations.some(r => r.type === 'spouse' && ((r.from === id && r.to === sortedIds[i+1]) || (r.from === sortedIds[i+1] && r.to === id)));
        
        xOffsets[id] = currentX;
        
        if (hasNextSpouse) {
            currentX += width + SPOUSE_GAP;
        } else {
            currentX += width + MIN_NODE_GAP;
        }
    }

    const rowWidth = currentX - (sortedIds.length > 0 ? MIN_NODE_GAP : 0);
    
    sortedIds.forEach((id) => {
      // Bottom-up: gen 0 is at the bottom, higher gen is at the top
      const x = xOffsets[id] - rowWidth / 2;
      const y = (gen) * -GEN_HEIGHT + 600; 

      layout[id] = {
        id,
        x,
        y,
        width,
        height,
        gen,
        isCollapsed: collapsedNodes.has(id),
        childCount: relations.filter(r => r.from === id && r.type === 'parent').length
      };
    });
  });

  return layout;
}
