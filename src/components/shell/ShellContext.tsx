// Lets a page put things into the shell: breadcrumb, top-bar actions, a sidebar section
// (the district switcher) and the document title.
//
// Two contexts on purpose: pages only ever touch the (stable) setters, so publishing a new
// node into the shell never re-renders the page that published it.

import React, { createContext, useContext, useState, useMemo, useEffect, ReactNode } from 'react';

export interface Crumb {
    label: string;
    path?: string;
}

interface ShellValues {
    crumbs: Crumb[];
    actions: ReactNode;
    sidebarExtra: ReactNode;
}

interface ShellSetters {
    setCrumbs: (crumbs: Crumb[]) => void;
    setActions: (node: ReactNode) => void;
    setSidebarExtra: (node: ReactNode) => void;
}

const ValuesContext = createContext<ShellValues | undefined>(undefined);
const SettersContext = createContext<ShellSetters | undefined>(undefined);

export const ShellProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [crumbs, setCrumbs] = useState<Crumb[]>([]);
    const [actions, setActions] = useState<ReactNode>(null);
    const [sidebarExtra, setSidebarExtra] = useState<ReactNode>(null);
    const values = useMemo(() => ({ crumbs, actions, sidebarExtra }), [crumbs, actions, sidebarExtra]);
    const setters = useMemo(() => ({ setCrumbs, setActions, setSidebarExtra }), []);
    return (
        <SettersContext.Provider value={setters}>
            <ValuesContext.Provider value={values}>{children}</ValuesContext.Provider>
        </SettersContext.Provider>
    );
};

/** What the shell renders. Only AppShell should subscribe to this. */
export const useShell = (): ShellValues => {
    const ctx = useContext(ValuesContext);
    if (!ctx) throw new Error('useShell must be used within ShellProvider');
    return ctx;
};

const useSetters = (): ShellSetters => {
    const ctx = useContext(SettersContext);
    if (!ctx) throw new Error('ShellProvider is missing');
    return ctx;
};

/** Declare a page's breadcrumb + document title; cleared on unmount. */
export const usePageChrome = (crumbs: Crumb[], title?: string): void => {
    const { setCrumbs } = useSetters();
    const key = JSON.stringify(crumbs);
    useEffect(() => {
        setCrumbs(JSON.parse(key) as Crumb[]);
        document.title = title ? `${title} · Dynet` : 'Dynet';
        return () => setCrumbs([]);
    }, [key, title, setCrumbs]);
};

/** Render children into the top bar's action slot for the lifetime of the page. */
export const TopbarActions: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { setActions } = useSetters();
    useEffect(() => {
        setActions(children);
        return () => setActions(null);
    }, [children, setActions]);
    return null;
};

/** Render children as an extra sidebar section (e.g. the district switcher). */
export const SidebarSection: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { setSidebarExtra } = useSetters();
    useEffect(() => {
        setSidebarExtra(children);
        return () => setSidebarExtra(null);
    }, [children, setSidebarExtra]);
    return null;
};
