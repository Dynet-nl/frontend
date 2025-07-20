// Scroll position restoration hook with localStorage persistence. Automatically saves scroll position and restores it when component remounts, enabling smooth navigation UX.
import { useEffect, useRef } from 'react';

const useScrollRestoration = (key, dependencies = []) => {
    const scrollPositionRef = useRef(0);
    const storageKey = `scroll_${key}`;

    const saveScrollPosition = () => {
        try {
            const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
            localStorage.setItem(storageKey, scrollPosition.toString());
            scrollPositionRef.current = scrollPosition;
        } catch (error) {
            console.warn('Failed to save scroll position:', error);
        }
    };

    const restoreScrollPosition = () => {
        try {
            const savedPosition = localStorage.getItem(storageKey);
            if (savedPosition && savedPosition !== '0') {
                const position = parseInt(savedPosition, 10);
                if (!isNaN(position)) {
                    requestAnimationFrame(() => {
                        window.scrollTo({
                            top: position,
                            behavior: 'instant'
                        });
                        console.log(`📍 Scroll position restored: ${position}px`);
                    });
                }
            }
        } catch (error) {
            console.warn('Failed to restore scroll position:', error);
        }
    };

    useEffect(() => {
        const handleBeforeUnload = () => {
            saveScrollPosition();
        };

        const handleScroll = () => {
            scrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('beforeunload', handleBeforeUnload);

        let scrollTimer;
        const handleScrollEnd = () => {
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
        currentScrollPosition: scrollPositionRef.current
    };
};

export default useScrollRestoration;
