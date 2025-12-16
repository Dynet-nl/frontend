// Progress bar component for district import with real-time updates

import React, { useState, useEffect, useRef } from 'react';
import '../styles/importProgress.css';
import logger from '../utils/logger';

const ImportProgressModal = ({ importId, onComplete, onError, onCancel }) => {
    const [progress, setProgress] = useState({
        stage: 'initializing',
        message: 'Preparing import...',
        progress: 0,
        currentStep: 0,
        totalSteps: 10,
        stats: {},
        elapsed: 0,
        completed: false,
        failed: false
    });
    
    const [isVisible, setIsVisible] = useState(true);
    const [usePolling, setUsePolling] = useState(false);
    const eventSourceRef = useRef(null);
    const startTimeRef = useRef(Date.now());
    const timeoutRef = useRef(null);
    const pollingRef = useRef(null);

    useEffect(() => {
        if (!importId) return;

        logger.log('Connecting to import stream:', importId);
        
        // Use relative URL to match the current origin
        const progressUrl = `/api/district/import-progress/${importId}`;
        
        logger.log('Using SSE URL:', progressUrl);
        const eventSource = new EventSource(progressUrl);
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                logger.log('Progress update:', data);
                
                setProgress(prevProgress => ({
                    ...prevProgress,
                    ...data,
                    elapsed: Date.now() - startTimeRef.current
                }));

                // Handle completion
                if (data.completed) {
                    logger.log('Import completed successfully');
                    setTimeout(() => {
                        setIsVisible(false);
                        onComplete && onComplete(data);
                    }, 2000);
                }

                // Handle failure
                if (data.failed) {
                    logger.error('Import failed:', data.error);
                    setTimeout(() => {
                        setIsVisible(false);
                        onError && onError(data.error);
                    }, 3000);
                }
            } catch (error) {
                logger.error('Error parsing progress data:', error);
            }
        };

        eventSource.onopen = (event) => {
            logger.log('EventSource connected successfully');
        };

        eventSource.onerror = (error) => {
            logger.error('EventSource error:', error);
            
            if (eventSource.readyState === EventSource.CONNECTING) {
                logger.warn('Failed to connect - still trying...');
            } else if (eventSource.readyState === EventSource.CLOSED) {
                logger.warn('Connection closed by server - switching to polling');
                eventSource.close();
                setUsePolling(true);
            }
        };

        // Add timeout fallback in case connection never works
        timeoutRef.current = setTimeout(() => {
            logger.warn('Import timeout reached (10 minutes)');
            setProgress(prev => ({
                ...prev,
                failed: true,
                message: 'Import timed out - please check backend logs'
            }));
            
            setTimeout(() => {
                setIsVisible(false);
                onError && onError('Import timed out');
            }, 3000);
        }, 10 * 60 * 1000); // 10 minutes

        return () => {
            if (eventSource) {
                eventSource.close();
            }
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        };
    }, [importId, onComplete, onError]);

    // Polling fallback when SSE fails
    useEffect(() => {
        if (!usePolling || !importId) return;

        logger.log('Starting polling fallback for:', importId);

        const pollProgress = async () => {
            try {
                const response = await fetch(`/api/district/import-status/${importId}`);
                if (response.ok) {
                    const data = await response.json();
                    logger.log('Polled update:', data);
                    
                    setProgress(prevProgress => ({
                        ...prevProgress,
                        ...data,
                        elapsed: Date.now() - startTimeRef.current
                    }));

                    // Handle completion
                    if (data.completed) {
                        logger.log('Import completed via polling');
                        clearInterval(pollingRef.current);
                        setTimeout(() => {
                            setIsVisible(false);
                            onComplete && onComplete(data);
                        }, 2000);
                    }

                    // Handle failure
                    if (data.failed) {
                        logger.error('Import failed via polling:', data.error);
                        clearInterval(pollingRef.current);
                        setTimeout(() => {
                            setIsVisible(false);
                            onError && onError(data.error);
                        }, 3000);
                    }
                } else if (response.status === 404) {
                    // Import not found - might be completed
                    logger.log('Import not found - assuming completed');
                    clearInterval(pollingRef.current);
                    setProgress(prev => ({ ...prev, completed: true, progress: 100 }));
                    setTimeout(() => {
                        setIsVisible(false);
                        onComplete && onComplete({ message: 'Import completed' });
                    }, 2000);
                }
            } catch (error) {
                logger.error('Polling error:', error);
            }
        };

        pollingRef.current = setInterval(pollProgress, 1000); // Poll every second
        pollProgress(); // Initial poll

        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        };
    }, [usePolling, importId, onComplete, onError]);

    const handleCancel = () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }
        setIsVisible(false);
        onCancel && onCancel();
    };

    const formatTime = (milliseconds) => {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }
        return `${seconds}s`;
    };

    const getStageIcon = (stage) => {
        const icons = {
            connected: '🔗',
            initializing: '🚀',
            validating: '✅',
            reading: '📖',
            converting: '🔄',
            creating_district: '🏗️',
            processing_buildings: '🏢',
            validating_data: '🔍',
            saving: '💾',
            completed: '🎉',
            failed: '❌'
        };
        return icons[stage] || '⚙️';
    };

    if (!isVisible) return null;

    return (
        <div className="progress-modal-overlay">
            <div className="progress-modal">
                <div className="progress-header">
                    <h3>
                        <span className="progress-icon">
                            {getStageIcon(progress.stage)}
                        </span>
                        District Import Progress
                    </h3>
                    {!progress.completed && !progress.failed && (
                        <button 
                            className="cancel-btn"
                            onClick={handleCancel}
                            title="Cancel import"
                        >
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
                            ></div>
                        </div>
                        <div className="progress-percentage">
                            {Math.round(progress.progress || 0)}%
                        </div>
                    </div>

                    <div className="progress-message">
                        <span className="stage-icon">{getStageIcon(progress.stage)}</span>
                        <span className="message-text">{progress.message}</span>
                    </div>

                    <div className="progress-details">
                        <div className="detail-row">
                            <span>Stage:</span>
                            <span className="detail-value">
                                {progress.stage?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                {progress.totalSteps && (
                                    <span className="step-indicator">
                                        ({progress.currentStep}/{progress.totalSteps})
                                    </span>
                                )}
                            </span>
                        </div>
                        
                        {progress.elapsed > 0 && (
                            <div className="detail-row">
                                <span>Elapsed:</span>
                                <span className="detail-value">{formatTime(progress.elapsed)}</span>
                            </div>
                        )}

                        {progress.stats && Object.keys(progress.stats).length > 0 && (
                            <div className="progress-stats">
                                <h4>Import Statistics:</h4>
                                <div className="stats-grid">
                                    {progress.stats.totalRows > 0 && (
                                        <div className="stat-item">
                                            <span className="stat-icon">📊</span>
                                            <span>Total Rows: {progress.stats.totalRows}</span>
                                        </div>
                                    )}
                                    {progress.stats.buildings > 0 && (
                                        <div className="stat-item">
                                            <span className="stat-icon">🏢</span>
                                            <span>Buildings: {progress.stats.buildings}</span>
                                        </div>
                                    )}
                                    {progress.stats.flats > 0 && (
                                        <div className="stat-item">
                                            <span className="stat-icon">🏠</span>
                                            <span>Apartments: {progress.stats.flats}</span>
                                        </div>
                                    )}
                                    {progress.stats.processedBuildings > 0 && (
                                        <div className="stat-item">
                                            <span className="stat-icon">✅</span>
                                            <span>Processed: {progress.stats.processedBuildings}</span>
                                        </div>
                                    )}
                                    {progress.stats.errors > 0 && (
                                        <div className="stat-item error">
                                            <span className="stat-icon">❌</span>
                                            <span>Errors: {progress.stats.errors}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {progress.completed && (
                        <div className="progress-success">
                            <div className="success-icon">🎉</div>
                            <div className="success-message">
                                Import completed successfully!
                                {progress.totalTime && (
                                    <div className="completion-time">
                                        Completed in {formatTime(progress.totalTime)}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {progress.failed && (
                        <div className="progress-error">
                            <div className="error-icon">❌</div>
                            <div className="error-message">
                                Import failed: {progress.error || 'Unknown error'}
                            </div>
                            <button 
                                className="retry-btn"
                                onClick={handleCancel}
                            >
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