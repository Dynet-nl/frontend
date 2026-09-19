// Small dropdown menu anchored to a trigger (the "..." on rows).

import React, { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { IconButton } from './Button';

export interface MenuItem {
    label: string;
    icon?: string;
    onSelect: () => void;
    danger?: boolean;
    disabled?: boolean;
    title?: string;
}

interface MenuProps {
    items: (MenuItem | 'separator')[];
    label?: string;
    icon?: string;
    align?: 'left' | 'right';
    trigger?: (open: () => void) => React.ReactNode;
}

const Menu: React.FC<MenuProps> = ({ items, label = 'Meer', icon = 'more_horiz', align = 'right', trigger }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return undefined;
        const onDoc = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDoc);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    return (
        <div className="menu" ref={ref}>
            {trigger ? trigger(() => setOpen((o) => !o)) : <IconButton icon={icon} label={label} size="dense" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} />}
            {open && (
                <div className={`menu__list ${align === 'left' ? 'menu__list--left' : ''}`.trim()} role="menu">
                    {items.map((item, i) =>
                        item === 'separator' ? (
                            <div key={`sep-${i}`} className="menu__sep" />
                        ) : (
                            <button
                                key={item.label}
                                type="button"
                                role="menuitem"
                                className={`menu__item ${item.danger ? 'menu__item--danger' : ''}`.trim()}
                                disabled={item.disabled}
                                title={item.title}
                                onClick={() => {
                                    setOpen(false);
                                    item.onSelect();
                                }}
                            >
                                {item.icon && <Icon name={item.icon} />}
                                {item.label}
                            </button>
                        )
                    )}
                </div>
            )}
        </div>
    );
};

export default Menu;
