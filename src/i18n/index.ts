// Tiny i18n: t('key', { name }) with {placeholder} interpolation. Locale is 'nl' unless
// localStorage "dynet.locale" says otherwise; the English table is partial and falls back to Dutch.

import { strings, StringKey, Locale } from './strings';

const STORAGE_KEY = 'dynet.locale';

const readLocale = (): Locale => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'en' || saved === 'nl') return saved;
    } catch {
        /* storage unavailable */
    }
    return 'nl';
};

let current: Locale = readLocale();

export const getLocale = (): Locale => current;
export const setLocale = (locale: Locale): void => {
    current = locale;
    try { localStorage.setItem(STORAGE_KEY, locale); } catch { /* ignore */ }
};

type Params = Record<string, string | number | undefined>;

export const t = (key: StringKey, params?: Params): string => {
    const table = strings[current] as Partial<Record<StringKey, string>>;
    let text: string = table[key] ?? strings.nl[key] ?? key;
    if (params) {
        for (const [name, value] of Object.entries(params)) {
            text = text.replace(new RegExp(`\\{${name}\\}`, 'g'), value === undefined ? '' : String(value));
        }
    }
    return text;
};

export type { StringKey, Locale };
