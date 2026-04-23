/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useTreeStore } from './store/treeStore';
import { useI18n } from './useI18n';
import { TreeCanvas } from './components/TreeCanvas';
import { SidePanel } from './components/SidePanel';
import { Toolbar } from './components/Toolbar';
import { Legend } from './components/Legend';
import { deriveGenerations } from './utils/generations';
import { computeLayout } from './utils/layout';
import { Person, Relation } from './types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function App() {
  const {
    people,
    relations,
    meta,
    locale,
    loading,
    error,
    addPerson,
    editPerson,
    deletePerson,
    addRelation,
    setAppLocale,
    resetToFile,
    updatePeople,
    updateRelations
  } = useTreeStore();

  const t = useI18n(locale);
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(1);

  // Compute generations and layout
  const genMap = useMemo(() => {
    if (!meta || people.length === 0) return {};
    return deriveGenerations(meta.roots, people, relations);
  }, [meta, people, relations]);

  const layout = useMemo(() => {
    return computeLayout(people, relations, genMap, collapsedNodes);
  }, [people, relations, genMap, collapsedNodes]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleCollapse = useCallback((id: string) => {
    setCollapsedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleAddChild = (parentId: string) => {
    const parent = people.find(p => p.id === parentId);
    if (!parent) return;

    const childId = addPerson({
      name: locale === 'te' ? 'కొత్త వ్యక్తి' : 'New Person',
      gender: 'X',
      birthYear: new Date().getFullYear(),
    });

    // Add relation from parent
    addRelation(parentId, childId, 'parent', 'bio');

    // Also add relation from parent's spouses
    const spouses = relations
      .filter(r => (r.from === parentId || r.to === parentId) && r.type === 'spouse')
      .map(r => r.from === parentId ? r.to : r.from);

    spouses.forEach(spouseId => {
      addRelation(spouseId, childId, 'parent', 'bio');
    });

    handleSelect(childId);
  };

  const handleAddSpouse = (personId: string) => {
    const person = people.find(p => p.id === personId);
    if (!person) return;

    const spouseId = addPerson({
      name: locale === 'te' ? 'కొత్త భాగస్వామి' : 'New Spouse',
      gender: person.gender === 'M' ? 'F' : 'M',
      birthYear: person.birthYear,
    });

    // Standardize: smaller ID is "from"
    const [from, to] = [personId, spouseId].sort();
    addRelation(from, to, 'spouse', 'married');

    handleSelect(spouseId);
  };

  const handleExport = async () => {
    const zip = new JSZip();
    
    // Clean people data for JSON export (remove blobs)
    const exportPeople = people.map(({ photoBlob, ...p }) => ({
      ...p,
      // If there's a blob, we record the intended path
      photoRef: photoBlob ? `assets/images/${p.id}.jpg` : p.photoRef
    }));

    zip.file('people.json', JSON.stringify(exportPeople, null, 2));
    zip.file('relations.json', JSON.stringify(relations, null, 2));
    zip.file('meta.json', JSON.stringify(meta, null, 2));
    
    // Add photos to the zip
    const imagesFolder = zip.folder('assets/images');
    for (const p of people) {
      if (p.photoBlob) {
        const base64Data = p.photoBlob.split(',')[1];
        if (base64Data) {
          imagesFolder?.file(`${p.id}.jpg`, base64Data, { base64: true });
        }
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'vamsha_vruksham_lineage.zip');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.zip';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.name.endsWith('.zip')) {
        const zip = await JSZip.loadAsync(file);
        const peopleJson = await zip.file('people.json')?.async('string');
        const relationsJson = await zip.file('relations.json')?.async('string');
        if (peopleJson && relationsJson) {
          updatePeople(JSON.parse(peopleJson));
          updateRelations(JSON.parse(relationsJson));
        }
      } else if (file.name.endsWith('.json')) {
        const text = await file.text();
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
          // Assume people if array, or check structure
          if (data.length > 0 && 'birthYear' in data[0]) {
             updatePeople(data);
          }
        }
      }
    };
    input.click();
  };

  if (loading || (!t && !error)) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-bark text-cream">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
          <p className="font-display tracking-widest uppercase italic">Loading Lineage...</p>
        </div>
      </div>
    );
  }

  if (error || !t) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-bark text-cream p-8">
        <div className="max-w-md w-full bg-cream rounded-xl p-8 text-bark shadow-2xl border-4 border-highlight-red">
          <h1 className="text-2xl font-display font-bold text-highlight-red mb-4">Initial Load Failed</h1>
          <p className="mb-6 font-body italic">{error || 'Failed to load interface strings.'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-bark text-cream py-3 rounded font-bold hover:bg-bark/90 transition-all uppercase tracking-widest text-sm"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden select-none">
      <Toolbar 
        t={t}
        locale={locale}
        onSetLocale={setAppLocale}
        onZoomIn={() => setZoom(z => Math.min(2.8, z + 0.1))}
        onZoomOut={() => setZoom(z => Math.max(0.3, z - 0.1))}
        onResetView={() => { setZoom(1); setSelectedId(null); }}
        onExport={handleExport}
        onImport={handleImport}
        onResetToFile={resetToFile}
        people={people}
        onSearch={handleSelect}
      />

      {/* THEMATIC TITLE BANNER */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none w-full max-w-2xl px-4">
        <div className="bg-banner/90 backdrop-blur-sm border-2 border-gold shadow-2xl rounded-lg p-3 text-center relative overflow-hidden">
          {/* Decorative Corners */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-bark/20" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-bark/20" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-bark/20" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-bark/20" />
          
          <h1 className="text-xl md:text-3xl font-display font-bold text-bark tracking-tight uppercase">
            {meta?.title || "Vamsha Vruksham"}
          </h1>
          <p className="text-[10px] md:text-xs font-body italic text-bark/60 mt-1 uppercase tracking-[0.2em]">
            {locale === 'te' ? "వంశ వృక్షము · శతమానం భవతి" : "Family Lineage · A Century of Heritage"}
          </p>
        </div>
      </div>

      <TreeCanvas 
        people={people}
        relations={relations}
        layout={layout}
        locale={locale}
        selectedId={selectedId}
        onSelect={handleSelect}
        onCollapse={handleCollapse}
        zoom={zoom}
      />

      <SidePanel 
        person={people.find(p => p.id === selectedId) || null}
        allPeople={people}
        relations={relations}
        t={t}
        locale={locale}
        onClose={() => setSelectedId(null)}
        onEdit={editPerson}
        onDelete={deletePerson}
        onAddChild={handleAddChild}
        onAddSpouse={handleAddSpouse}
        onSelectPerson={handleSelect}
      />

      <Legend t={t} />
    </div>
  );
}
