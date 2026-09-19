// Compact pager: ‹ 1 2 3 ›

import React from 'react';
import Icon from './Icon';

interface PaginationProps {
    page: number;
    totalPages: number;
    onChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onChange }) => {
    if (totalPages <= 1) return null;
    const pages: number[] = [];
    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
    for (let p = start; p <= Math.min(totalPages, start + 4); p++) pages.push(p);
    return (
        <nav className="pager" aria-label="Paginering">
            <button type="button" className="pager__btn" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Vorige">
                <Icon name="chevron_left" size="dense" />
            </button>
            {pages.map((p) => (
                <button key={p} type="button" className={`pager__btn ${p === page ? 'pager__btn--active' : ''}`.trim()} onClick={() => onChange(p)} aria-current={p === page ? 'page' : undefined}>
                    {p}
                </button>
            ))}
            <button type="button" className="pager__btn" disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Volgende">
                <Icon name="chevron_right" size="dense" />
            </button>
        </nav>
    );
};

export default Pagination;
