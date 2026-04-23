/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { TranslationStrings } from './types';

export function useI18n(locale: 'te' | 'en') {
  const [t, setT] = useState<TranslationStrings | null>(null);

  useEffect(() => {
    fetch(`data/i18n/${locale}.json`)
      .then(res => res.json())
      .then(data => setT(data))
      .catch(err => console.error("Failed to load i18n", err));
  }, [locale]);

  return t;
}
