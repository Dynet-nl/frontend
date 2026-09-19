// Responsive helpers matching the shell breakpoints.

import { useEffect, useState } from 'react';

export const useMediaQuery = (query: string): boolean => {
    const get = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false);
    const [matches, setMatches] = useState<boolean>(get);

    useEffect(() => {
        if (!window.matchMedia) return undefined;
        const mql = window.matchMedia(query);
        const onChange = () => setMatches(mql.matches);
        onChange();
        if (mql.addEventListener) mql.addEventListener('change', onChange);
        else mql.addListener(onChange);
        return () => {
            if (mql.removeEventListener) mql.removeEventListener('change', onChange);
            else mql.removeListener(onChange);
        };
    }, [query]);

    return matches;
};

export const useIsPhone = (): boolean => useMediaQuery('(max-width: 767px)');
export const useIsRail = (): boolean => useMediaQuery('(max-width: 1279px)');
