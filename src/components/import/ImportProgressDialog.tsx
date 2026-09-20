// Live progress of a district import: Server-Sent Events from the API, polling as fallback.
// The import keeps running on the server if this dialog is closed.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { ProgressBar } from '../ui/Panel';
import axiosPrivate, { BASE_URL } from '../../api/axios';
import logger from '../../utils/logger';
import { t } from '../../i18n';
import type { StringKey } from '../../i18n';

export interface ImportStats {
    totalRows?: number;
    buildings?: number;
    flats?: number;
    newBuildings?: number;
    updatedBuildings?: number;
    newFlats?: number;
    updatedFlats?: number;
    processedBuildings?: number;
    errors?: number;
}

export interface ProgressData {
    stage: string;
    message: string;
    progress: number;
    currentStep: number;
    totalSteps: number;
    stats: ImportStats;
    elapsed: number;
    completed: boolean;
    failed: boolean;
    error?: string;
    totalTime?: number;
}

interface ImportProgressDialogProps {
    importId: string;
    onComplete?: (data: ProgressData) => void;
    onError?: (error: string) => void;
    onCancel?: () => void;
}

const INITIAL: ProgressData = { stage: 'initializing', message: 'Voorbereiden…', progress: 0, currentStep: 0, totalSteps: 10, stats: {}, elapsed: 0, completed: false, failed: false };
const POLL_MS = 1500;
const TIMEOUT_MS = 10 * 60 * 1000;

const STAGES = ['reading', 'converting', 'creating_district', 'processing_buildings', 'saving', 'completed'] as const;
const STAGE_ICON: Record<string, string> = { reading: 'description', converting: 'transform', creating_district: 'grid_view', processing_buildings: 'apartment', saving: 'save', completed: 'flag', failed: 'error' };

const ImportProgressDialog: React.FC<ImportProgressDialogProps> = ({ importId, onComplete, onError, onCancel }) => {
    const [progress, setProgress] = useState<ProgressData>(INITIAL);
    const [mode, setMode] = useState<'sse' | 'poll'>('sse');
    const doneRef = useRef(false);
    const onCompleteRef = useRef(onComplete);
    const onErrorRef = useRef(onError);
    useEffect(() => { onCompleteRef.current = onComplete; onErrorRef.current = onError; }, [onComplete, onError]);

    const apply = useCallback((update: Partial<ProgressData>) => {
        setProgress((prev) => {
            const next = { ...prev, ...update, stats: { ...prev.stats, ...(update.stats || {}) } };
            if (!doneRef.current && next.completed) { doneRef.current = true; setTimeout(() => onCompleteRef.current?.(next), 1200); }
            if (!doneRef.current && next.failed) { doneRef.current = true; setTimeout(() => onErrorRef.current?.(next.error || 'Onbekende fout'), 2500); }
            return next;
        });
    }, []);

    // SSE
    useEffect(() => {
        if (mode !== 'sse') return undefined;
        let source: EventSource | null = null;
        try {
            source = new EventSource(`${BASE_URL}/api/district/import-progress/${importId}`, { withCredentials: true });
        } catch (err) {
            logger.error('EventSource failed', err);
            setMode('poll');
            return undefined;
        }
        source.onmessage = (e) => {
            try { apply(JSON.parse(e.data)); } catch (err) { logger.error('Bad progress payload', err); }
        };
        source.onerror = () => {
            if (source?.readyState === EventSource.CLOSED && !doneRef.current) setMode('poll');
        };
        return () => source?.close();
    }, [importId, mode, apply]);

    // Polling fallback + timeout
    useEffect(() => {
        if (mode !== 'poll') return undefined;
        let cancelled = false;
        const started = Date.now();
        const tick = async () => {
            if (cancelled || doneRef.current) return;
            if (Date.now() - started > TIMEOUT_MS) { apply({ failed: true, error: 'Time-out: geen voortgang ontvangen' }); return; }
            try {
                const { data } = await axiosPrivate.get<Partial<ProgressData>>(`/api/district/import-status/${importId}`);
                apply(data);
            } catch (err) {
                const s = (err as { response?: { status?: number } }).response?.status;
                if (s === 404) { apply({ completed: true, progress: 100, stage: 'completed', message: 'Import voltooid' }); return; }
            }
            if (!cancelled) setTimeout(tick, POLL_MS);
        };
        tick();
        return () => { cancelled = true; };
    }, [mode, importId, apply]);

    const stageIndex = progress.failed ? -1 : Math.max(0, STAGES.indexOf(progress.stage as typeof STAGES[number]));
    const stats = progress.stats || {};
    const live = [
        { k: t('import.progress.rows'), v: stats.totalRows },
        { k: t('import.progress.buildings'), v: stats.processedBuildings ?? stats.buildings },
        { k: t('import.progress.flats'), v: stats.flats },
        { k: t('import.progress.new'), v: stats.newFlats },
        { k: t('import.progress.changed'), v: stats.updatedFlats },
        { k: t('import.progress.errors'), v: stats.errors, warn: (stats.errors ?? 0) > 0 },
    ];

    return (
        <Modal
            open
            onClose={() => onCancel?.()}
            title={progress.completed ? t('import.done') : progress.failed ? t('import.failed') : t('import.progress.title')}
            subtitle={progress.completed ? 'De import is afgerond en het district is bijgewerkt.' : progress.failed ? 'De import is teruggedraaid; het district is ongewijzigd.' : progress.message}
            closeOnOverlayClick={false}
            closeOnEscape={false}
            size="medium"
            footer={
                progress.completed || progress.failed ? (
                    <Button variant="primary" onClick={() => (progress.completed ? onCompleteRef.current?.(progress) : onCancel?.())}>{t('common.close')}</Button>
                ) : (
                    <Button variant="secondary" onClick={() => onCancel?.()}>Op de achtergrond doorgaan</Button>
                )
            }
        >
            <div className="stages">
                {STAGES.map((s, i) => {
                    const state = progress.failed && i === stageIndex + 1 ? 'fail' : progress.completed ? 'done' : i < stageIndex ? 'done' : i === stageIndex ? 'now' : 'todo';
                    return (
                        <span key={s} className={`stage ${state === 'done' ? 'stage--done' : state === 'now' ? 'stage--now' : state === 'fail' ? 'stage--fail' : ''}`.trim()}>
                            <Icon name={state === 'done' ? 'check' : state === 'now' ? 'sync' : STAGE_ICON[s] || 'schedule'} />
                            {t(`import.stage.${s}` as StringKey)}
                        </span>
                    );
                })}
                {progress.failed && <span className="stage stage--fail"><Icon name="error" />{t('import.stage.failed')}</span>}
            </div>
            <div className="col gap-1">
                <ProgressBar value={progress.progress} size="lg" warn={progress.failed} />
                <span className="t-caption muted mono">{Math.round(progress.progress)}% · {Math.round((progress.elapsed || 0) / 1000)}s{progress.totalTime ? ` · totaal ${Math.round(progress.totalTime / 1000)}s` : ''}</span>
            </div>
            <div className="live-stats">
                {live.map((s) => (
                    <div key={s.k} className="mini-stat">
                        <span className="t-overline">{s.k}</span>
                        <span className="mini-stat__v" style={s.warn ? { color: 'var(--danger)' } : undefined}>{s.v ?? '—'}</span>
                    </div>
                ))}
            </div>
            {progress.failed && progress.error && (
                <div className="callout callout--danger"><Icon name="error" /><div>{progress.error}</div></div>
            )}
            <p className="t-caption muted">{t('import.progress.note')}</p>
        </Modal>
    );
};

export default ImportProgressDialog;
