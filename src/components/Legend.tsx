/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TranslationStrings } from '../types';

interface LegendProps {
  t: TranslationStrings;
}

export function Legend({ t }: LegendProps) {
  return (
    <div className="absolute bottom-4 right-4 z-40 max-w-xs">
      <div className="bg-parchment/90 backdrop-blur-sm p-4 rounded-lg shadow-2xl border-2 border-gold/30 space-y-3">
        <div className="flex items-center justify-between border-b border-bark/10 pb-2">
          <span className="text-gold font-display font-bold uppercase tracking-widest text-[10px]">Family Tree Guide</span>
        </div>
        <p className="text-[12px] text-bark italic leading-relaxed">
          {t.common.legend}
        </p>
        <div className="text-[10px] text-bark/50 font-medium">
          Lineage starts at the <span className="text-bark font-bold underline decoration-gold/50">Trunk Base</span> and grows upwards into the canopy.
        </div>
      </div>
    </div>
  );
}
