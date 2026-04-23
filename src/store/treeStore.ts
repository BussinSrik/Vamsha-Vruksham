/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { Person, Relation, MetaData, TreeData, Gender, RelationType, RelationRole } from '../types';

const STORAGE_KEY_PEOPLE = 'vv:people';
const STORAGE_KEY_RELATIONS = 'vv:relations';
const STORAGE_KEY_META = 'vv:meta';
const STORAGE_KEY_LOCALE = 'vv:locale';

// Simple monotonic ID generator
const generateId = (prefix: string) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = prefix + '_';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export function useTreeStore() {
  const [people, setPeople] = useState<Person[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [locale, setLocale] = useState<'te' | 'en'>('te');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (forceReload = false) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch meta first to check version
      const metaRes = await fetch('data/meta.json');
      if (!metaRes.ok) throw new Error('Failed to fetch meta.json');
      const metaData = await metaRes.json();

      const cachedMeta = localStorage.getItem(STORAGE_KEY_META);
      let shouldForce = forceReload;
      
      if (cachedMeta) {
        const parsedCachedMeta = JSON.parse(cachedMeta);
        if (metaData.updatedAt !== parsedCachedMeta.updatedAt) {
          shouldForce = true;
        }
      }

      const cachedPeople = localStorage.getItem(STORAGE_KEY_PEOPLE);
      const cachedRelations = localStorage.getItem(STORAGE_KEY_RELATIONS);
      const cachedLocale = localStorage.getItem(STORAGE_KEY_LOCALE) as 'te' | 'en' | null;

      if (!shouldForce && cachedPeople && cachedRelations && cachedMeta) {
        setPeople(JSON.parse(cachedPeople));
        setRelations(JSON.parse(cachedRelations));
        setMeta(JSON.parse(cachedMeta));
        if (cachedLocale) setLocale(cachedLocale);
        setLoading(false);
        return;
      }

      // Fetch the rest
      const [peopleRes, relationsRes] = await Promise.all([
        fetch('data/people.json'),
        fetch('data/relations.json')
      ]);

      if (!peopleRes.ok || !relationsRes.ok) {
        throw new Error('Failed to fetch data files.');
      }

      const peopleData = await peopleRes.json();
      const relationsData = await relationsRes.json();

      setPeople(peopleData);
      setRelations(relationsData);
      setMeta(metaData);
      setLocale(metaData.defaultLocale || 'te');
      setLoading(false);

      // Cache initial load
      localStorage.setItem(STORAGE_KEY_PEOPLE, JSON.stringify(peopleData));
      localStorage.setItem(STORAGE_KEY_RELATIONS, JSON.stringify(relationsData));
      localStorage.setItem(STORAGE_KEY_META, JSON.stringify(metaData));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error loading data');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updatePeople = (newPeople: Person[]) => {
    setPeople(newPeople);
    localStorage.setItem(STORAGE_KEY_PEOPLE, JSON.stringify(newPeople));
  };

  const updateRelations = (newRelations: Relation[]) => {
    setRelations(newRelations);
    localStorage.setItem(STORAGE_KEY_RELATIONS, JSON.stringify(newRelations));
  };

  const setAppLocale = (newLocale: 'te' | 'en') => {
    setLocale(newLocale);
    localStorage.setItem(STORAGE_KEY_LOCALE, newLocale);
  };

  const addPerson = (person: Omit<Person, 'id'>) => {
    const id = generateId('p');
    const newPerson = { ...person, id };
    updatePeople([...people, newPerson]);
    return id;
  };

  const editPerson = (id: string, updates: Partial<Person>) => {
    updatePeople(people.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePerson = (id: string) => {
    // Cascade remove relations
    updatePeople(people.filter(p => p.id !== id));
    updateRelations(relations.filter(r => r.from !== id && r.to !== id));
  };

  const addRelation = (from: string, to: string, type: RelationType, role?: RelationRole) => {
    const id = generateId('r');
    const newRelation: Relation = { id, from, to, type, role };
    updateRelations([...relations, newRelation]);
    return id;
  };

  const resetToFile = () => {
    localStorage.removeItem(STORAGE_KEY_PEOPLE);
    localStorage.removeItem(STORAGE_KEY_RELATIONS);
    localStorage.removeItem(STORAGE_KEY_META);
    loadData(true);
  };

  return {
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
  };
}
