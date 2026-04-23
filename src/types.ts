/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Gender = 'M' | 'F' | 'X';

export interface Person {
  id: string;
  name: string;
  nameLatin?: string;
  gender: Gender;
  birthYear: number;
  deathYear?: number;
  notes?: string;
  photoRef?: string;
  photoBlob?: string; // Data URL or object URL for local preview
  tags?: string[];
}

export type RelationType = 'parent' | 'spouse';
export type RelationRole = 'bio' | 'adopted' | 'step' | 'guardian' | 'married' | 'partner';

export interface Relation {
  id: string;
  from: string; // From parent or first spouse (lexicographically smaller for spouses)
  to: string;   // To child or second spouse
  type: RelationType;
  role?: RelationRole;
  startYear?: number;
  endYear?: number;
}

export interface MetaData {
  schemaVersion: number;
  title: string;
  roots: string[];
  defaultLocale: string;
  updatedAt: string;
}

export interface TreeData {
  people: Person[];
  relations: Relation[];
  meta: MetaData;
}

export interface Point {
  x: number;
  y: number;
}

export interface NodeLayout extends Point {
  id: string;
  width: number;
  height: number;
  gen: number;
  isCollapsed?: boolean;
  childCount?: number;
}

export interface TranslationStrings {
  toolbar: {
    search: {
      placeholder: string;
    };
    zoom: {
      in: string;
      out: string;
      reset: string;
    };
    io: {
      export: string;
      import: string;
      reset: string;
    };
  };
  panel: {
    details: string;
    birthDeath: string;
    gender: string;
    notes: string;
    relations: {
      parents: string;
      spouse: string;
      children: string;
    };
    actions: {
      edit: string;
      delete: string;
      addChild: string;
      addSpouse: string;
    };
  };
  common: {
    save: string;
    cancel: string;
    confirm: string;
    deleteConfirm: string;
    legend: string;
  };
}
