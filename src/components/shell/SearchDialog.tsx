// Top-bar search: buildings by address/postcode, flats by zoeksleutel/address/complex.
// Opens with the search button, ⌘K / Ctrl+K or "/" outside a text field.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosPrivate from '../../api/axios';
import Icon from '../ui/Icon';
import { KeyChip, Dot } from '../ui/Pill';
import { t } from '../../i18n';
import { flatLabel } from '../../types/domain';
import { deliveryStatus } from '../../utils/status';

interface DistrictRef {
    _id: string;
    name: string;
    priority?: number;
    area: { _id: string; name: string } | null;
}

interface BuildingHit {
    _id: string;
    address: string;
    postcode?: string;
    isBlocked: boolean;
    flats: number;
    district: DistrictRef | null;
}

interface FlatHit {
    _id: string;
    adres?: string;
    huisNummer?: string;
    toevoeging?: string;
    zoeksleutel?: string;
    complexNaam?: string;
    postcode?: string;
    fcStatusHas?: string;
    building?: string;
    district: DistrictRef | null;
}

interface SearchResult {
    buildings: BuildingHit[];
    flats: FlatHit[];
}

interface Row {
    key: string;
    to: string;
    node: React.ReactNode;
}

interface SearchDialogProps {
    open: boolean;
    onClose: () => void;
}

const SearchDialog: React.FC<SearchDialogProps> = ({ open, onClose }) => {
    const navigate = useNavigate();
    const [q, setQ] = useState('');
    const [result, setResult] = useState<SearchResult | null>(null);
    const [busy, setBusy] = useState(false);
    const [active, setActive] = useState(0);
    const input = useRef<HTMLInputElement>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const seq = useRef(0);

    useEffect(() => {
        if (open) {
            setQ('');
            setResult(null);
            setActive(0);
            setTimeout(() => input.current?.focus(), 0);
        }
    }, [open]);

    useEffect(() => {
        if (!open) return undefined;
        if (timer.current) clearTimeout(timer.current);
        const term = q.trim();
        if (term.length < 2) { setResult(null); setBusy(false); return undefined; }
        setBusy(true);
        timer.current = setTimeout(async () => {
            const id = ++seq.current;
            try {
                const { data } = await axiosPrivate.get<SearchResult>('/api/search', { params: { q: term, limit: 8 } });
                if (id === seq.current) { setResult(data); setActive(0); }
            } catch {
                if (id === seq.current) setResult({ buildings: [], flats: [] });
            } finally {
                if (id === seq.current) setBusy(false);
            }
        }, 220);
        return () => { if (timer.current) clearTimeout(timer.current); };
    }, [q, open]);

    const rows = useMemo<Row[]>(() => {
        if (!result) return [];
        const districtHref = (d: DistrictRef | null) => (d?.area ? `/district/${d.area._id}?district=${d._id}` : '/districts');
        return [
            ...result.buildings.map((b) => ({
                key: `b-${b._id}`,
                to: `/building/${b._id}`,
                node: (
                    <>
                        <Icon name="apartment" />
                        <span className="search__body">
                            <span className="search__title">{b.address}{b.isBlocked && <span className="pill pill--blocked" style={{ marginLeft: 8 }}>{t('common.blocked')}</span>}</span>
                            <span className="search__meta">{[b.postcode, b.district?.name, b.district?.area?.name, `${b.flats} ${b.flats === 1 ? 'flat' : 'flats'}`].filter(Boolean).join(' · ')}</span>
                        </span>
                        <button type="button" className="btn btn--ghost btn--dense" onClick={(e) => { e.stopPropagation(); navigate(districtHref(b.district)); onClose(); }}>
                            {t('nav.districts')}
                        </button>
                    </>
                ),
            })),
            ...result.flats.map((f) => {
                const status = deliveryStatus(f.fcStatusHas);
                return {
                    key: `f-${f._id}`,
                    to: `/apartment/${f._id}`,
                    node: (
                        <>
                            <Icon name="door_front" />
                            <span className="search__body">
                                <span className="search__title">
                                    <Dot family={status.family} title={status.label} /> {flatLabel(f)}
                                    {f.zoeksleutel && <KeyChip>{f.zoeksleutel}</KeyChip>}
                                </span>
                                <span className="search__meta">{[f.complexNaam, f.postcode, f.district?.name, f.district?.area?.name].filter(Boolean).join(' · ')}</span>
                            </span>
                        </>
                    ),
                };
            }),
        ];
    }, [result, navigate, onClose]);

    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { onClose(); return; }
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(rows.length - 1, a + 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
            if (e.key === 'Enter' && rows[active]) { navigate(rows[active].to); onClose(); }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, rows, active, navigate, onClose]);

    if (!open) return null;

    const term = q.trim();
    return (
        <div className="dialog-overlay search-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="dialog dialog--md search" role="dialog" aria-modal="true" aria-label={t('nav.search')}>
                <div className="search__input">
                    <Icon name={busy ? 'sync' : 'search'} className={busy ? 'is-spinning' : ''} />
                    <input
                        ref={input}
                        className="search__field"
                        placeholder="Zoek op adres, postcode, zoeksleutel of complex…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        aria-label={t('nav.search')}
                        autoComplete="off"
                        spellCheck={false}
                    />
                    <kbd className="key">esc</kbd>
                </div>
                <div className="search__results" role="listbox">
                    {term.length < 2 ? (
                        <div className="search__hint">Typ minstens twee tekens. Sneltoets: <kbd className="key">⌘K</kbd> of <kbd className="key">/</kbd></div>
                    ) : result && rows.length === 0 && !busy ? (
                        <div className="search__hint">Niets gevonden voor “{term}”.</div>
                    ) : (
                        <>
                            {result && result.buildings.length > 0 && <div className="search__group">{t('nav.buildings')}</div>}
                            {rows.slice(0, result?.buildings.length ?? 0).map((r, i) => (
                                <div key={r.key} role="option" aria-selected={active === i} className={`search__row ${active === i ? 'is-active' : ''}`.trim()} onMouseEnter={() => setActive(i)} onClick={() => { navigate(r.to); onClose(); }}>
                                    {r.node}
                                </div>
                            ))}
                            {result && result.flats.length > 0 && <div className="search__group">Flats</div>}
                            {rows.slice(result?.buildings.length ?? 0).map((r, j) => {
                                const i = (result?.buildings.length ?? 0) + j;
                                return (
                                    <div key={r.key} role="option" aria-selected={active === i} className={`search__row ${active === i ? 'is-active' : ''}`.trim()} onMouseEnter={() => setActive(i)} onClick={() => { navigate(r.to); onClose(); }}>
                                        {r.node}
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchDialog;
