/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Person, Relation, TranslationStrings, Gender, RelationRole } from '../types';
import { cn } from '../lib/utils';
import { X, UserPlus, UserMinus, Edit2, Trash2, Camera } from 'lucide-react';

interface SidePanelProps {
  person: Person | null;
  allPeople: Person[];
  relations: Relation[];
  t: TranslationStrings;
  locale: 'te' | 'en';
  onClose: () => void;
  onEdit: (id: string, updates: Partial<Person>) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onAddSpouse: (personId: string) => void;
  onSelectPerson: (id: string) => void;
}

export function SidePanel({
  person,
  allPeople,
  relations,
  t,
  locale,
  onClose,
  onEdit,
  onDelete,
  onAddChild,
  onAddSpouse,
  onSelectPerson
}: SidePanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Person>>({});

  if (!person) return null;

  const parents = relations
    .filter(r => r.to === person.id && r.type === 'parent')
    .map(r => allPeople.find(p => p.id === r.from))
    .filter(Boolean) as Person[];

  const spouses = relations
    .filter(r => (r.from === person.id || r.to === person.id) && r.type === 'spouse')
    .map(r => allPeople.find(p => p.id === (r.from === person.id ? r.to : r.from)))
    .filter(Boolean) as Person[];

  const children = relations
    .filter(r => r.from === person.id && r.type === 'parent')
    .map(r => allPeople.find(p => p.id === r.to))
    .filter(Boolean) as Person[];

  const displayName = locale === 'en' ? (person.nameLatin || person.name) : person.name;
  const displayLatin = locale === 'en' ? person.name : person.nameLatin;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setEditForm(prev => ({ ...prev, photoBlob: ev.target?.result as string, photoRef: file.name }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditInit = () => {
    setEditForm(person);
    setIsEditing(true);
  };

  const handleSave = () => {
    onEdit(person.id, editForm);
    setIsEditing(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 h-full w-[360px] bg-cream shadow-2xl z-50 flex flex-col border-l border-bark/20"
      >
        <div className="p-4 border-b border-bark/10 flex justify-between items-center bg-parchment/30">
          <h2 className="font-display font-bold text-lg text-bark uppercase tracking-wider">
            {t.panel.details}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-bark/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Avatar / Initials */}
          <div className="flex flex-col items-center space-y-4">
            <div 
              className="relative cursor-pointer group"
              onClick={() => !isEditing && handleEditInit()}
            >
              <div className={cn(
                "w-32 h-32 rounded-lg flex items-center justify-center text-4xl font-display font-bold border-4 border-gold shadow-2xl overflow-hidden bg-parchment transition-all duration-300",
                isEditing ? "ring-4 ring-gold/50" : "group-hover:scale-105"
              )}>
                {isEditing && editForm.photoBlob ? (
                  <img src={editForm.photoBlob} alt="" className="w-full h-full object-cover" />
                ) : (person.photoBlob || person.photoRef) ? (
                  <img src={person.photoBlob || person.photoRef} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-bark/20">{person.name.charAt(0)}</span>
                    {!isEditing && <Camera size={16} className="text-bark/10" />}
                  </div>
                )}
                
                {/* Overlay prompt in non-edit mode */}
                {!isEditing && !person.photoBlob && !person.photoRef && (
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-[10px] text-bark font-bold uppercase tracking-tighter bg-gold/80 px-2 py-1 rounded">Edit to Upload</span>
                  </div>
                )}
              </div>
              
              {isEditing && (
                <label className="absolute -bottom-2 -right-2 p-3 bg-gold text-bark rounded-full cursor-pointer shadow-2xl hover:brightness-110 transition-all border-2 border-parchment animate-bounce">
                  <Camera size={20} />
                  <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                </label>
              )}
            </div>
            
            {isEditing ? (
              <div className="w-full space-y-2">
                <input 
                  className="w-full p-2 border border-bark/20 rounded bg-white font-display text-center"
                  value={editForm.name}
                  placeholder={locale === 'te' ? "పేరు (Native)" : "Name (Native)"}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                />
                <input 
                  className="w-full p-2 border border-bark/20 rounded bg-white font-display text-center"
                  value={editForm.nameLatin || ''}
                  placeholder={locale === 'te' ? "పేరు (English)" : "Name (English)"}
                  onChange={e => setEditForm({ ...editForm, nameLatin: e.target.value })}
                />
              </div>
            ) : (
              <div className="text-center">
                <h3 className="text-2xl font-display font-bold text-bark">{displayName}</h3>
                <p className="text-sm text-bark/60 italic">{displayLatin}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Info Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-bark/40 font-bold">
                  {t.panel.birthDeath}
                </label>
                {isEditing ? (
                  <div className="flex gap-2">
                    <input 
                      type="number"
                      className="w-full p-1 border border-bark/20 rounded bg-white text-sm text-center"
                      value={editForm.birthYear}
                      onChange={e => setEditForm({ ...editForm, birthYear: parseInt(e.target.value) })}
                    />
                    <input 
                      type="number"
                      className="w-full p-1 border border-bark/20 rounded bg-white text-sm text-center"
                      value={editForm.deathYear || ''}
                      placeholder="Present"
                      onChange={e => setEditForm({ ...editForm, deathYear: e.target.value ? parseInt(e.target.value) : undefined })}
                    />
                  </div>
                ) : (
                  <p className="font-medium text-bark">
                    {person.birthYear} — {person.deathYear || 'Present'}
                  </p>
                )}
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-bark/40 font-bold">
                  {t.panel.gender}
                </label>
                {isEditing ? (
                  <select 
                    className="w-full p-1 border border-bark/20 rounded bg-white text-sm"
                    value={editForm.gender}
                    onChange={e => setEditForm({ ...editForm, gender: e.target.value as Gender })}
                  >
                    <option value="M">M</option>
                    <option value="F">F</option>
                    <option value="X">X</option>
                  </select>
                ) : (
                  <p className="font-medium text-bark">{person.gender}</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-bark/40 font-bold">
                {t.panel.notes}
              </label>
              {isEditing ? (
                <textarea 
                  className="w-full p-2 border border-bark/20 rounded bg-white text-sm min-h-[80px]"
                  value={editForm.notes || ''}
                  onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                />
              ) : (
                <p className="text-sm text-bark/80 leading-relaxed italic">
                  {person.notes || '—'}
                </p>
              )}
            </div>
          </div>

          {/* Relations Sections */}
          {!isEditing && (
            <div className="space-y-6 pt-4 border-t border-bark/10">
              <RelationSection 
                title={t.panel.relations.parents} 
                people={parents} 
                onSelect={onSelectPerson} 
              />
              <RelationSection 
                title={t.panel.relations.spouse} 
                people={spouses} 
                onSelect={onSelectPerson} 
                actionLabel={t.panel.actions.addSpouse}
                onAction={() => onAddSpouse(person.id)}
              />
              <RelationSection 
                title={t.panel.relations.children} 
                people={children} 
                onSelect={onSelectPerson} 
                actionLabel={t.panel.actions.addChild}
                onAction={() => onAddChild(person.id)}
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-parchment/20 border-t border-bark/10 flex flex-col gap-2">
          {isEditing ? (
            <div className="flex gap-2">
              <button 
                onClick={handleSave}
                className="flex-1 bg-bark text-cream py-2 px-4 rounded font-bold hover:bg-bark/90 transition-colors uppercase text-xs tracking-widest"
              >
                {t.common.save}
              </button>
              <button 
                onClick={() => setIsEditing(false)}
                className="flex-1 border border-bark/20 text-bark py-2 px-4 rounded font-bold hover:bg-white transition-colors uppercase text-xs tracking-widest"
              >
                {t.common.cancel}
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <button 
                  onClick={handleEditInit}
                  className="flex-1 flex items-center justify-center gap-2 bg-gold text-bark py-2 px-4 rounded font-bold hover:brightness-105 transition-colors uppercase text-xs tracking-widest"
                >
                  <Edit2 size={14} /> {t.panel.actions.edit}
                </button>
                <button 
                  onClick={() => {
                    if (window.confirm(t.common.deleteConfirm)) {
                      onDelete(person.id);
                      onClose();
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 border border-highlight-red text-highlight-red py-2 px-4 rounded font-bold hover:bg-highlight-red/5 transition-colors uppercase text-xs tracking-widest"
                >
                  <Trash2 size={14} /> {t.panel.actions.delete}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function RelationSection({ 
  title, 
  people, 
  onSelect, 
  actionLabel, 
  onAction 
}: { 
  title: string, 
  people: Person[], 
  onSelect: (id: string) => void,
  actionLabel?: string,
  onAction?: () => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h4 className="text-[10px] uppercase tracking-widest text-bark/40 font-bold">{title}</h4>
        {onAction && (
          <button 
            onClick={onAction}
            className="text-[10px] text-gold hover:text-gold/80 font-bold uppercase tracking-tighter"
          >
            + {actionLabel}
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {people.length > 0 ? (
          people.map(p => (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className="px-3 py-1 rounded-full bg-parchment/40 text-bark text-xs font-medium border border-bark/10 hover:bg-parchment/60 transition-colors"
            >
              {p.name}
            </button>
          ))
        ) : (
          <p className="text-xs text-bark/30 italic">None recorded</p>
        )}
      </div>
    </div>
  );
}

