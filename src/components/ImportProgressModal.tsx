// Live progress for a district import: Server-Sent Events from the API, with polling as a
// fallback when the event stream cannot be opened.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/importProgress.css';
import logger from '../utils/logger';
import axiosPrivate, { BASE_URL } from '../api/axios';

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

interface ImportProgressModalProps {
    importId: string;
    onComplete?: (data: ProgressData) => void;
    onError?: (error: string) => void;
    onCancel?: () => void;
}

const INITIAL_PROGRESS: ProgressData = {
    stage: 'initializing',
    message: 'Preparing import...',
    progress: 0,
    currentStep: 0,
    totalSteps: 10,
    stats: {},
    elapsed: 0,
    completed: false,
    failed: false,
};

const POLL_INTERVAL_MS = 1500;
const IMPORT_TIMEOUT_MS = 10 * 60 * 1000;
const COMPLETE_DELAY_MS = 1500;
const FAIL_DELAY_MS = 3000;

const STAGE_ICONS: Record<string, string> = {
    connected: '🔗',
    initializing: '🚀',
    reading: '📖',
    converting: '🔄',
    creating_district: '🏗️',
    processing_buildings: '🏢',
    saving: '💾',
    completed: '🎉',
    failed: '❌',
};

const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
};

const ImportProgressModal: React.FC<ImportProgressModalProps> = ({ importId, onComplete, onError, onCancel }) => {
    const [progress, setProgress] = useState<ProgressData>(INITIAL_PROGRESS);
    const [usePolling, setUsePolling] = useState<boolean>(false);
    const [isVisible, setIsVisible] = useState<boolean>(true);
    const startTimeRef = useRef<number>(Date.now());
    const finishedRef = useRef<boolean>(false);
    const eventSourceRef = useRef<EventSource | null>(null);

    // Latest callbacks without re-subscribing the stream on every parent render.
    const onCompleteRef = useRef(onComplete);
    const onErrorRef = useRef(onError);
    useEffect(() => {
        onCompleteRef.current = onComplete;
        onErrorRef.current = onError;
    }, [onComplete, onError]);

    const applyUpdate = useCallback((data: Partial<ProgressData>): void => {
        setProgress((prev) => {
            const next: ProgressData = { ...prev, ...data, elapsed: Date.now() - startTimeRef.current };
            if (!finishedRef.current && next.completed) {
                finishedRef.current = true;
                setTimeout(() => {
                    setIsVisible(false);
                    onCompleteRef.current?.(next);
                }, COMPLETE_DELAY_MS);
            } else if (!finishedRef.current && next.failed) {
                finishedRef.current = true;
                setTimeout(() => {
                    setIsVisible(false);
                    onErrorRef.current?.(next.error || 'Unknown error');
                }, FAIL_DELAY_MS);
            }
            return next;
        });
    }, []);

    // Server-Sent Events (cookies are sent because withCredentials is set)
    useEffect(() => {
        if (!importId || usePolling) return;

        const url = `${BASE_URL}/api/district/import-progress/${importId}`;
        logger.log('Connecting to import stream:', url);
        const eventSource = new EventSource(url, { withCredentials: true });
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event: MessageEvent) => {
            try {
                applyUpdate(JSON.parse(event.data) as Partial<ProgressData>);
            } catch (error) {
                logger.error('Error parsing progress data:', error);
            }
        };

        eventSource.onerror = () => {
            if (finishedRef.current) {
                eventSource.close();
                return;
            }
            if (eventSource.readyState === EventSource.CLOSED) {
                logger.warn('Progress stream closed - switching to polling');
                eventSource.close();
                setUsePolling(true);
            }
        };

        return () => {
            eventSource.close();
        };
    }, [importId, usePolling, applyUpdate]);

    // Polling fallback
    useEffect(() => {
        if (!usePolling || !importId) return;

        let cancelled = false;
        const poll = async (): Promise<void> => {
            try {
                const response = await axiosPrivate.get<Partial<ProgressData>>(`/api/district/import-status/${importId}`);
                if (!cancelled) applyUpdate(response.data);
            } catch (error) {
                const status = (error as { response?: { status?: number } }).response?.status;
                if (status === 404 && !cancelled) {
                    // Finished imports are only kept for a minute; treat "gone" as done.
                    applyUpdate({ completed: true, progress: 100, stage: 'completed', message: 'Import completed' });
                } else {
                    logger.error('Polling error:', error);
                }
            }
        };

        poll();
        const interval = setInterval(poll, POLL_INTERVAL_MS);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [usePolling, importId, applyUpdate]);

    // Hard timeout
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (!finishedRef.current) {
                applyUpdate({ failed: true, error: 'Import timed out after 10 minutes', message: 'Import timed out' });
            }
        }, IMPORT_TIMEOUT_MS);
        return () => clearTimeout(timeout);
    }, [applyUpdate]);

    const handleCancel = (): void => {
        eventSourceRef.current?.close();
        setIsVisible(false);
        onCancel?.();
    };

    if (!isVisible) return null;

    const stageIcon = STAGE_ICONS[progress.stage] || '⚙️';
    const stats = progress.stats || {};
    const statItems: Array<{ icon: string; label: string; value?: number; error?: boolean }> = [
        { icon: '📊', label: 'Rows', value: stats.totalRows },
        { icon: '🏢', label: 'Buildings', value: stats.buildings },
        { icon: '🏠', label: 'Apartments', value: stats.flats },
        { icon: '✨', label: 'New apartments', value: stats.newFlats },
        { icon: '🔁', label: 'Updated apartments', value: stats.updatedFlats },
        { icon: '❌', label: 'Errors', value: stats.errors, error: true },
    ].filter((item) => item.value !== undefined && item.value > 0);

    return (
        <div className="progress-modal-overlay">
            <div className="progress-modal" role="dialog" aria-modal="true" aria-label="District import progress">
                <div className="progress-header">
                    <h3>
                        <span className="progress-icon">{stageIcon}</span>
                        District Import Progress
                    </h3>
                    {!progress.completed && !progress.failed && (
                        <button className="cancel-btn" onClick={handleCancel} title="Close (the import keeps running on the server)">
                            ✕
                        </button>
                    )}
                </div>

                <div className="progress-content">
                    <div className="progress-bar-container">
                        <div className="progress-bar">
                            <div
                                className={`progress-fill ${progress.failed ? 'error' : progress.completed ? 'success' : ''}`}
                                style={{ width: `${progress.progress || 0}%` }}
                            />
                        </div>
                        <div className="progress-percentage">{Math.round(progress.progress || 0)}%</div>
                    </div>

                    <div className="progress-message">
                        <span className="stage-icon">{stageIcon}</span>
                        <span className="message-text">{progress.message}</span>
                    </div>

                    <div className="progress-details">
                        <div className="detail-row">
                            <span>Stage:</span>
                            <span className="detail-value">
                                {progress.stage?.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                            </span>
                        </div>
                        {progress.elapsed > 0 && (
                            <div className="detail-row">
                                <span>Elapsed:</span>
                                <span className="detail-value">{formatTime(progress.elapsed)}</span>
                            </div>
                        )}
                        {statItems.length > 0 && (
                            <div className="progress-stats">
                                <h4>Import Statistics:</h4>
                                <div className="stats-grid">
                                    {statItems.map((item) => (
                                        <div key={item.label} className={`stat-item ${item.error ? 'error' : ''}`}>
                                            <span className="stat-icon">{item.icon}</span>
                                            <span>
                                                {item.label}: {item.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {progress.completed && (
                        <div className="progress-success">
                            <div className="success-icon">🎉</div>
                            <div className="success-message">
                                Import completed successfully!
                                {progress.totalTime && <div className="completion-time">Completed in {formatTime(progress.totalTime)}</div>}
                            </div>
                        </div>
                    )}

                    {progress.failed && (
                        <div className="progress-error">
                            <div className="error-icon">❌</div>
                            <div className="error-message">Import failed: {progress.error || 'Unknown error'}</div>
                            <button className="retry-btn" onClick={handleCancel}>
                                Close
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImportProgressModal;
