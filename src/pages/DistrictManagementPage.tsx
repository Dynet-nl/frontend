// Page for managing district information including building assignments and district data.

import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { useParams } from 'react-router-dom';
import logger from '../utils/logger';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import { BounceLoader } from 'react-spinners';
import SimpleProgressModal from '../components/SimpleProgressModal';
import '../styles/districtManagement.css';

interface ValidationResult {
    errors: string[];
    warnings: string[];
    isValid: boolean;
}

interface BuildingPreview {
    buildingIdentifier: string;
    address: string;
    houseNumber: string;
    flatCount: number;
    sampleFlats: Array<{ zoeksleutel: string }>;
}

interface DataPreviewStats {
    totalBuildings?: number;
    totalFlats?: number;
    validRows?: number;
    buildingsWithMultipleFlats?: number;
    columnsCount?: number;
}

interface DataPreviewValidation {
    warnings?: string[];
    stats?: {
        columnsCount?: number;
    };
}

interface DataPreview {
    stats?: DataPreviewStats;
    preview?: Record<string, string | number>[];
    buildingPreview?: BuildingPreview[];
    validation?: DataPreviewValidation;
}

interface Conflict {
    address: string;
    changedFields: string[];
}

interface ImportHistoryItem {
    districtName: string;
    operation: string;
    timestamp: string;
    status: string;
}

interface ImportProgress {
    message: string;
    progress: number;
    stage: string;
}

const validateExcelFile = (file: File): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (file.size > 50 * 1024 * 1024) {
        errors.push('File size exceeds 50MB limit');
    }

    const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
    if (!allowedTypes.includes(file.type)) {
        errors.push('File must be an Excel (.xlsx, .xls) or CSV file');
    }

    if (file.name.length > 255) {
        warnings.push('File name is very long, consider shortening it');
    }

    return { errors, warnings, isValid: errors.length === 0 };
};

const DistrictManagementPage: React.FC = () => {
    const { areaId } = useParams<{ areaId: string }>();
    const axiosPrivate = useAxiosPrivate();

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [districtName, setDistrictName] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [validationResults, setValidationResults] = useState<ValidationResult | null>(null);
    const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
    const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>([]);
    const [dataPreview, setDataPreview] = useState<DataPreview | null>(null);
    const [conflicts, setConflicts] = useState<Conflict[]>([]);
    const [operationType, setOperationType] = useState<'create' | 'update'>('create');

    // Simple progress states
    const [showProgressModal, setShowProgressModal] = useState<boolean>(false);
    const [progressPercent, setProgressPercent] = useState<number>(0);
    const [progressMessage, setProgressMessage] = useState<string>('Starting import...');

    const fetchImportHistory = useCallback(async (): Promise<void> => {
        try {
            const response = await axiosPrivate.get<{ history: ImportHistoryItem[] }>(`/api/district/import-history/${areaId}`);
            setImportHistory(response.data.history || []);
        } catch (error) {
            logger.error('Error fetching import history:', error);
            setImportHistory([]);
        }
    }, [axiosPrivate, areaId]);

    useEffect(() => {
        fetchImportHistory();
    }, [fetchImportHistory]);

    const generateDataPreview = async (file: File): Promise<void> => {
        logger.log('🔄 Generating preview for file:', file.name, file.type);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('areaId', areaId || '');

            logger.log('📤 Sending preview request to /api/district/preview');
            const response = await axiosPrivate.post<DataPreview>('/api/district/preview', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            logger.log('📥 Preview response received:', response.data);
            setDataPreview(response.data);

            if (operationType === 'update') {
                checkForConflicts(response.data);
            }
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            logger.error('❌ Error generating preview:', err.response?.data || err.message);
            setValidationResults((prev) => ({
                ...prev,
                errors: [...(prev?.errors || []), `Failed to read file content: ${err.response?.data?.message || err.message}`],
                warnings: prev?.warnings || [],
                isValid: false,
            }));
        }
    };

    const checkForConflicts = async (previewData: DataPreview): Promise<void> => {
        try {
            const response = await axiosPrivate.post<{ conflicts: Conflict[] }>('/api/district/check-conflicts', {
                data: previewData,
                areaId,
            });
            setConflicts(response.data.conflicts || []);
        } catch (error) {
            logger.error('Error checking conflicts:', error);
        }
    };

    const handleFileSelect = (event: ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0];
        if (!file) {
            setSelectedFile(null);
            setValidationResults(null);
            return;
        }
        setSelectedFile(file);
        const validation = validateExcelFile(file);
        setValidationResults(validation);
        if (validation.isValid) {
            generateDataPreview(file);
        }
    };

    const handleImport = async (): Promise<void> => {
        if (!selectedFile || !validationResults?.isValid) {
            return;
        }
        if (operationType === 'create' && !districtName.trim()) {
            alert('Please enter a district name');
            return;
        }

        // Show progress modal and simulate progress
        setShowProgressModal(true);
        setProgressPercent(0);
        setProgressMessage('Starting import...');
        setIsProcessing(true);

        try {
            // Simulate progress steps
            const progressSteps = [
                { percent: 10, message: 'Uploading file...' },
                { percent: 30, message: 'Validating data...' },
                { percent: 50, message: 'Processing buildings...' },
                { percent: 80, message: 'Saving to database...' },
                { percent: 100, message: 'Import completed!' },
            ];

            // Show progress updates
            for (let i = 0; i < progressSteps.length - 1; i++) {
                setProgressPercent(progressSteps[i].percent);
                setProgressMessage(progressSteps[i].message);
                await new Promise((resolve) => setTimeout(resolve, 500));
            }

            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('areaId', areaId || '');
            formData.append('operationType', operationType);
            if (operationType === 'create') {
                formData.append('currentDistrict', districtName);
            }

            logger.log('🚀 [Import] Starting enhanced import with progress tracking...');

            const response = await axiosPrivate.post('/api/district/import-enhanced', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            // Final progress step
            setProgressPercent(100);
            setProgressMessage('Import completed successfully!');

            logger.log('✅ [Import] Import completed:', response.data);

            // Reset form state after delay
            setTimeout(() => {
                setSelectedFile(null);
                setDistrictName('');
                setValidationResults(null);
                setDataPreview(null);
                setShowProgressModal(false);
                setIsProcessing(false);
                fetchImportHistory(); // Refresh history
            }, 2000);
        } catch (error) {
            const err = error as { response?: { data?: { error?: string } }; message?: string };
            logger.error('❌ [Import] Error during import:', error);
            setProgressMessage(`Import failed: ${err.response?.data?.error || err.message}`);

            setTimeout(() => {
                setShowProgressModal(false);
                setIsProcessing(false);
            }, 3000);
        }
    };

    const renderValidationResults = (): React.ReactNode => {
        if (!validationResults) return null;
        return (
            <div className="validation-results">
                {validationResults.errors.length > 0 && (
                    <div className="validation-errors">
                        <h4>❌ Errors (must be fixed):</h4>
                        <ul>
                            {validationResults.errors.map((error, index) => (
                                <li key={index}>{error}</li>
                            ))}
                        </ul>
                    </div>
                )}
                {validationResults.warnings.length > 0 && (
                    <div className="validation-warnings">
                        <h4>⚠️ Warnings:</h4>
                        <ul>
                            {validationResults.warnings.map((warning, index) => (
                                <li key={index}>{warning}</li>
                            ))}
                        </ul>
                    </div>
                )}
                {validationResults.isValid && (
                    <div className="validation-success">
                        <h4>✅ File validation passed</h4>
                    </div>
                )}
            </div>
        );
    };

    const renderDataPreview = (): React.ReactNode => {
        if (!dataPreview) return null;

        logger.log('🔍 Rendering preview with data:', dataPreview);

        // Extract data from backend response structure
        const stats = dataPreview.stats || {};
        const preview = dataPreview.preview || [];
        const buildingPreview = dataPreview.buildingPreview || [];
        const validation = dataPreview.validation || {};

        const totalBuildings = stats.totalBuildings || 0;
        const totalFlats = stats.totalFlats || stats.validRows || 0;
        const buildingsWithMultiple = stats.buildingsWithMultipleFlats || 0;

        logger.log('📊 [Frontend] Accurate building statistics from backend:');
        logger.log(`🏢 Total buildings: ${totalBuildings}`);
        logger.log(`🏠 Total flats: ${totalFlats}`);
        logger.log(`🏢+ Buildings with multiple flats: ${buildingsWithMultiple}`);
        logger.log(`📊 Average flats per building: ${totalBuildings > 0 ? Math.round(totalFlats / totalBuildings) : 0}`);

        if (buildingPreview.length > 0) {
            logger.log(
                '🏢 Sample buildings:',
                buildingPreview
                    .slice(0, 5)
                    .map((b) => `${b.buildingIdentifier} → ${b.address} ${b.houseNumber} (${b.flatCount} flats)`)
            );
        }

        // Get available columns from the first preview item
        const columns =
            preview.length > 0
                ? Object.keys(preview[0]).filter((key) => !key.startsWith('_') && key !== 'building' && key !== 'district')
                : [];

        return (
            <div className="data-preview">
                <h3>📊 Data Preview</h3>
                <div className="preview-stats">
                    <span>🏢 Buildings: {totalBuildings}</span>
                    <span>🏠 Apartments: {totalFlats}</span>
                    <span>📋 Columns: {validation.stats?.columnsCount || 0}</span>
                    <span>🏢+ Multi-unit: {buildingsWithMultiple}</span>
                </div>

                {buildingPreview.length > 0 && (
                    <div className="preview-table">
                        <h4>🏢 Building Preview (first 5 buildings):</h4>
                        <table>
                            <thead>
                                <tr>
                                    <th>Building ID</th>
                                    <th>Address</th>
                                    <th>Apartments</th>
                                    <th>Sample Units</th>
                                </tr>
                            </thead>
                            <tbody>
                                {buildingPreview.slice(0, 5).map((building, index) => (
                                    <tr key={index}>
                                        <td>
                                            <code>{building.buildingIdentifier}</code>
                                        </td>
                                        <td>
                                            {building.address} {building.houseNumber}
                                        </td>
                                        <td>
                                            <strong>{building.flatCount}</strong>
                                        </td>
                                        <td>
                                            {building.sampleFlats.map((flat, i) => (
                                                <div key={i} style={{ fontSize: '0.9em', color: '#666' }}>
                                                    {flat.zoeksleutel}
                                                </div>
                                            ))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {preview.length > 0 && (
                    <div className="preview-table">
                        <h4>🏠 Apartment Preview (first 5 rows):</h4>
                        <table>
                            <thead>
                                <tr>
                                    {columns.map((col, index) => (
                                        <th key={index}>{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {preview.slice(0, 5).map((row, index) => (
                                    <tr key={index}>
                                        {columns.map((col, colIndex) => (
                                            <td key={colIndex}>{row[col] || '-'}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {validation.warnings && validation.warnings.length > 0 && (
                    <div className="preview-warnings">
                        <h4>⚠️ Warnings:</h4>
                        <ul>
                            {validation.warnings.map((warning, index) => (
                                <li key={index}>{warning}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    const renderConflicts = (): React.ReactNode => {
        if (conflicts.length === 0) return null;
        return (
            <div className="conflicts-section">
                <h3>⚠️ Data Conflicts Detected</h3>
                <p>The following apartments already exist and will be updated:</p>
                <div className="conflicts-list">
                    {conflicts.map((conflict, index) => (
                        <div key={index} className="conflict-item">
                            <strong>{conflict.address}</strong>
                            <span>Changes: {conflict.changedFields.join(', ')}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderImportProgress = (): React.ReactNode => {
        if (!importProgress) return null;
        return (
            <div className="import-progress">
                <div className="progress-header">
                    <h3>{importProgress.message}</h3>
                    <span>{importProgress.progress}%</span>
                </div>
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{
                            width: `${importProgress.progress}%`,
                            backgroundColor: importProgress.stage === 'error' ? '#dc3545' : '#28a745',
                        }}
                    />
                </div>
                {importProgress.stage === 'error' && (
                    <div className="progress-error">
                        <p>Please check the file format and try again.</p>
                    </div>
                )}
            </div>
        );
    };

    const renderImportHistory = (): React.ReactNode => {
        if (!Array.isArray(importHistory) || importHistory.length === 0) return null;
        return (
            <div className="import-history">
                <h3>📋 Recent Imports</h3>
                <div className="history-list">
                    {importHistory.slice(0, 5).map((item, index) => (
                        <div key={index} className="history-item">
                            <div className="history-info">
                                <strong>{item.districtName}</strong>
                                <span>{item.operation}</span>
                                <span>{new Date(item.timestamp).toLocaleString()}</span>
                            </div>
                            <div className={`history-status ${item.status}`}>{item.status}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="district-management-container">
            <h1>District Management</h1>
            <div className="operation-selector">
                <button className={operationType === 'create' ? 'active' : ''} onClick={() => setOperationType('create')}>
                    Create New District
                </button>
                <button className={operationType === 'update' ? 'active' : ''} onClick={() => setOperationType('update')}>
                    Update Existing District
                </button>
            </div>

            {/* Simple Progress Modal */}
            <SimpleProgressModal
                isVisible={showProgressModal}
                progress={progressPercent}
                message={progressMessage}
                onClose={() => {
                    if (progressPercent >= 100 || progressMessage.includes('failed')) {
                        setShowProgressModal(false);
                        setIsProcessing(false);
                    }
                }}
            />
            <div className="main-content">
                <div className="upload-section">
                    <h2>{operationType === 'create' ? '📁 Create New District' : '🔄 Update District Data'}</h2>
                    {operationType === 'create' && (
                        <div className="district-name-input">
                            <label htmlFor="districtName">District Name:</label>
                            <input
                                id="districtName"
                                type="text"
                                value={districtName}
                                onChange={(e) => setDistrictName(e.target.value)}
                                placeholder="Enter district name..."
                                disabled={isProcessing}
                            />
                        </div>
                    )}
                    <div className="file-input-section">
                        <label htmlFor="fileInput">Select Excel File:</label>
                        <input
                            id="fileInput"
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileSelect}
                            disabled={isProcessing}
                        />
                        {selectedFile && (
                            <div className="file-info">
                                <span>📎 {selectedFile.name}</span>
                                <span>Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                        )}
                    </div>
                    {renderValidationResults()}
                    {renderDataPreview()}
                    {renderConflicts()}
                    <div className="action-buttons">
                        <button
                            onClick={handleImport}
                            disabled={!validationResults?.isValid || isProcessing || (operationType === 'create' && !districtName.trim())}
                            className="import-button"
                        >
                            {isProcessing && <BounceLoader size={16} color="#fff" />}
                            {operationType === 'create' ? 'Create District' : 'Update District'}
                        </button>
                        <button
                            onClick={() => {
                                setSelectedFile(null);
                                setValidationResults(null);
                                setDataPreview(null);
                                setConflicts([]);
                                setDistrictName('');
                            }}
                            disabled={isProcessing}
                            className="reset-button"
                        >
                            Reset
                        </button>
                    </div>
                    {renderImportProgress()}
                </div>
                <div className="sidebar">
                    {renderImportHistory()}
                    <div className="help-section">
                        <h3>💡 Help</h3>
                        <div className="help-content">
                            <h4>File Requirements:</h4>
                            <ul>
                                <li>Excel (.xlsx, .xls) or CSV format</li>
                                <li>Maximum size: 50MB</li>
                                <li>Required columns: Opdrachtnummer, Volledig adres, etc.</li>
                            </ul>
                            <h4>Weekly Update Process:</h4>
                            <ol>
                                <li>Receive Excel file on Sunday</li>
                                <li>Use "Update District" mode</li>
                                <li>Review conflicts before proceeding</li>
                                <li>Check import history for verification</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DistrictManagementPage;
