/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Person, Relation } from '../types';

export function deriveGenerations(roots: string[], people: Person[], relations: Relation[]) {
  const genMap: Record<string, number> = {};
  const queue: { id: string, gen: number }[] = roots.map(id => ({ id, gen: 0 }));
  
  // Set initial 0 for roots
  roots.forEach(id => { genMap[id] = 0; });

  while (queue.length > 0) {
    const { id, gen } = queue.shift()!;

    // Find children
    const children = relations
      .filter(r => r.from === id && r.type === 'parent')
      .map(r => r.to);

    children.forEach(childId => {
      if (genMap[childId] === undefined || genMap[childId] < gen + 1) {
        genMap[childId] = gen + 1;
        queue.push({ id: childId, gen: gen + 1 });
      }
    });

    // Find spouses and ensure they are on the same generation
    const spouses = relations
      .filter(r => (r.from === id || r.to === id) && r.type === 'spouse')
      .map(r => r.from === id ? r.to : r.from);

    spouses.forEach(spouseId => {
      if (genMap[spouseId] === undefined) {
        genMap[spouseId] = gen;
        queue.push({ id: spouseId, gen });
      }
    });
  }

  return genMap;
}
