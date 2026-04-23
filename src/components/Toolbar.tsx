/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TranslationStrings, Person } from '../types';
import { 
  Search, 
  ZoomIn, 
  ZoomOut, 
  RefreshCcw, 
  Download, 
  Upload, 
  ChevronDown,
  Languages 
} from 'lucide-react';

interface ToolbarProps {
  t: TranslationStrings;
  locale: 'te' | 'en';
  onSetLocale: (locale: 'te' | 'en') => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onExport: () => void;
  onImport: () => void;
  onResetToFile: () => void;
  people: Person[];
  onSearch: (id: string) => void;
}

export function Toolbar({
  t,
  locale,
  onSetLocale,
  onZoomIn,
  onZoomOut,
  onResetView,
  onExport,
  onImport,
  onResetToFile,
  people,
  onSearch
}: ToolbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  const filteredPeople = people.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.nameLatin?.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="absolute top-4 left-4 z-40 flex flex-wrap gap-2 items-center pointer-events-none">
      {/* Search Box */}
      <div className="bg-cream/90 backdrop-blur rounded-full shadow-lg border border-bark/20 p-1 flex items-center gap-2 pointer-events-auto relative">
        <div className="pl-3 text-bark/40">
          <Search size={18} />
        </div>
        <input 
          type="text"
          placeholder={t.toolbar.search.placeholder}
          className="bg-transparent border-none focus:ring-0 text-bark text-sm w-48 font-body"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
        />
        
        {showResults && searchQuery && (
          <div className="absolute top-full left-0 mt-2 w-full bg-cream rounded-xl shadow-xl border border-bark/10 overflow-hidden">
            {filteredPeople.map(p => (
              <button
                key={p.id}
                className="w-full text-left p-3 hover:bg-parchment/30 transition-colors border-b border-bark/5 last:border-0"
                onClick={() => {
                  onSearch(p.id);
                  setSearchQuery('');
                  setShowResults(false);
                }}
              >
                <p className="text-sm font-bold text-bark">{p.name}</p>
                <p className="text-[10px] text-bark/50">{p.nameLatin}</p>
              </button>
            ))}
            {filteredPeople.length === 0 && (
              <div className="p-3 text-sm text-bark/40 italic text-center">No matches found</div>
            )}
          </div>
        )}
      </div>

      {/* Zoom Controls */}
      <div className="bg-cream/90 backdrop-blur rounded-full shadow-lg border border-bark/20 p-1 flex gap-1 pointer-events-auto">
        <ToolbarButton onClick={onZoomIn} icon={<ZoomIn size={18} />} tooltip={t.toolbar.zoom.in} />
        <ToolbarButton onClick={onZoomOut} icon={<ZoomOut size={18} />} tooltip={t.toolbar.zoom.out} />
        <ToolbarButton onClick={onResetView} icon={<RefreshCcw size={18} />} tooltip={t.toolbar.zoom.reset} />
      </div>

      {/* IO Controls */}
      <div className="bg-cream/90 backdrop-blur rounded-full shadow-lg border border-bark/20 p-1 flex gap-1 pointer-events-auto">
        <ToolbarButton onClick={onExport} icon={<Download size={18} />} tooltip={t.toolbar.io.export} />
        <ToolbarButton onClick={onImport} icon={<Upload size={18} />} tooltip={t.toolbar.io.import} />
        <ToolbarButton onClick={onResetToFile} icon={<RefreshCcw size={18} className="text-highlight-red" />} tooltip={t.toolbar.io.reset} />
      </div>

      {/* Language Toggle */}
      <div className="bg-cream/90 backdrop-blur rounded-full shadow-lg border border-bark/20 p-1 flex pointer-events-auto overflow-hidden">
        <button 
          onClick={() => onSetLocale('te')}
          className={`px-3 py-1 text-xs font-bold transition-colors ${locale === 'te' ? 'bg-gold text-bark' : 'text-bark/40 hover:bg-bark/5'}`}
        >
          తెలుగు
        </button>
        <button 
          onClick={() => onSetLocale('en')}
          className={`px-3 py-1 text-xs font-bold transition-colors ${locale === 'en' ? 'bg-gold text-bark' : 'text-bark/40 hover:bg-bark/5'}`}
        >
          EN
        </button>
      </div>
    </div>
  );
}

function ToolbarButton({ onClick, icon, tooltip }: { onClick: () => void, icon: React.ReactNode, tooltip: string }) {
  return (
    <button 
      onClick={onClick} 
      title={tooltip}
      className="p-2 hover:bg-bark/5 rounded-full text-bark/60 hover:text-bark transition-all"
    >
      {icon}
    </button>
  );
}
