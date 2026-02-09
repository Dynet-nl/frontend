// Custom hook for managing scroll position restoration across route navigation.

import { useEffect, useRef, DependencyList } from 'react';
import logger from '../utils/logger';

interface ScrollRestorationResult {
    saveScrollPosition: () => void;
    restoreScrollPosition: () => void;
    currentScrollPosition: number;
}

const useScrollRestoration = (key: string, dependencies: DependencyList = []): ScrollRestorationResult => {
    const scrollPositionRef = useRef<number>(0);
    const storageKey = `scroll_${key}`;

    const saveScrollPosition = (): void => {
        try {
            const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
            localStorage.setItem(storageKey, scrollPosition.toString());
            scrollPositionRef.current = scrollPosition;
        } catch (error) {
            logger.warn('Failed to save scroll position:', error);
        }
    };

    const restoreScrollPosition = (): void => {
        try {
            const savedPosition = localStorage.getItem(storageKey);
            if (savedPosition && savedPosition !== '0') {
                const position = parseInt(savedPosition, 10);
                if (!isNaN(position)) {
                    requestAnimationFrame(() => {
                        window.scrollTo({
                            top: position,
                            behavior: 'instant' as ScrollBehavior,
                        });
                        logger.log(`📍 Scroll position restored: ${position}px`);
                    });
                }
            }
        } catch (error) {
            logger.warn('Failed to restore scroll position:', error);
        }
    };

    useEffect(() => {
        const handleBeforeUnload = (): void => {
            saveScrollPosition();
        };

        const handleScroll = (): void => {
            scrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('beforeunload', handleBeforeUnload);

        let scrollTimer: ReturnType<typeof setTimeout>;
        const handleScrollEnd = (): void => {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                saveScrollPosition();
            }, 100);
        };

        window.addEventListener('scroll', handleScrollEnd, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('scroll', handleScrollEnd);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            saveScrollPosition();
            clearTimeout(scrollTimer);
        };
    }, [storageKey]);

    useEffect(() => {
        const timer = setTimeout(() => {
            restoreScrollPosition();
        }, 100);
        return () => clearTimeout(timer);
    }, dependencies);

    return {
        saveScrollPosition,
        restoreScrollPosition,
        currentScrollPosition: scrollPositionRef.current,
    };
};

export default useScrollRestoration;
