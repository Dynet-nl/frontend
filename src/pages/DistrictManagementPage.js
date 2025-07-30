// Page for managing district information including building assignments and district data.

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import { BounceLoader } from 'react-spinners';
import '../styles/districtManagement.css';
const validateExcelFile = (file) => {
    const errors = [];
    const warnings = [];
    if (file.size > 50 * 1024 * 1024) {
        errors.push('File size exceeds 50MB limit');
    }
    const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
    ];
    if (!allowedTypes.includes(file.type)) {
        errors.push('File must be an Excel (.xlsx, .xls) or CSV file');
    }
    if (file.name.length > 255) {
        warnings.push('File name is very long, consider shortening it');
    }
    return { errors, warnings, isValid: errors.length === 0 };
};
const DistrictManagementPage = () => {
    const { areaId } = useParams();
    const axiosPrivate = useAxiosPrivate();
    const [selectedFile, setSelectedFile] = useState(null);
    const [districtName, setDistrictName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [validationResults, setValidationResults] = useState(null);
    const [importProgress, setImportProgress] = useState(null);
    const [importHistory, setImportHistory] = useState([]);
    const [dataPreview, setDataPreview] = useState(null);
    const [conflicts, setConflicts] = useState([]);
    const [operationType, setOperationType] = useState('create'); // 'create' or 'update'
    const fetchImportHistory = useCallback(async () => {
        try {
            const response = await axiosPrivate.get(`/api/district/import-history/${areaId}`);
            setImportHistory(response.data);
        } catch (error) {
            console.error('Error fetching import history:', error);
        }
    }, [axiosPrivate, areaId]);
    useEffect(() => {
        fetchImportHistory();
    }, [fetchImportHistory]);
    const handleFileSelect = (event) => {
        const file = event.target.files[0];
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
    const generateDataPreview = async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await axiosPrivate.post('/api/district/preview', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setDataPreview(response.data);
            if (operationType === 'update') {
                checkForConflicts(response.data);
            }
        } catch (error) {
            console.error('Error generating preview:', error);
            setValidationResults(prev => ({
                ...prev,
                errors: [...(prev?.errors || []), 'Failed to read file content']
            }));
        }
    };
    const checkForConflicts = async (previewData) => {
        try {
            const response = await axiosPrivate.post('/api/district/check-conflicts', {
                data: previewData,
                areaId
            });
            setConflicts(response.data.conflicts || []);
        } catch (error) {
            console.error('Error checking conflicts:', error);
        }
    };
    const handleImport = async () => {
        if (!selectedFile || !validationResults?.isValid) {
            return;
        }
        if (operationType === 'create' && !districtName.trim()) {
            alert('Please enter a district name');
            return;
        }
        setIsProcessing(true);
        setImportProgress({ stage: 'starting', progress: 0, message: 'Initializing import...' });
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('areaId', areaId);
            if (operationType === 'create') {
                formData.append('currentDistrict', districtName);
            }
            const endpoint = '/api/district/import-enhanced';
            const method = 'post'; // Always use POST for enhanced endpoint
            await axiosPrivate[method](endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setImportProgress({
                        stage: 'uploading',
                        progress,
                        message: `Uploading file... ${progress}%`
                    });
                }
            });
            setImportProgress({
                stage: 'processing',
                progress: 50,
                message: 'Processing data...'
            });
            setTimeout(() => {
                setImportProgress({
                    stage: 'saving',
                    progress: 80,
                    message: 'Saving to database...'
                });
            }, 1000);
            setTimeout(() => {
                setImportProgress({
                    stage: 'complete',
                    progress: 100,
                    message: `${operationType === 'create' ? 'District created' : 'District updated'} successfully!`
                });
                setSelectedFile(null);
                setDistrictName('');
                setValidationResults(null);
                setDataPreview(null);
                setConflicts([]);
                fetchImportHistory();
                setTimeout(() => {
                    setImportProgress(null);
                }, 3000);
            }, 2000);
        } catch (error) {
            console.error('Import error:', error);
            setImportProgress({
                stage: 'error',
                progress: 0,
                message: `Import failed: ${error.response?.data?.message || error.message}`
            });
        } finally {
            setIsProcessing(false);
        }
    };
    const renderValidationResults = () => {
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
    const renderDataPreview = () => {
        if (!dataPreview) return null;
        return (
            <div className="data-preview">
                <h3>📊 Data Preview</h3>
                <div className="preview-stats">
                    <span>Buildings: {dataPreview.buildingsCount}</span>
                    <span>Apartments: {dataPreview.apartmentsCount}</span>
                    <span>Columns: {dataPreview.columnsCount}</span>
                </div>
                {dataPreview.sampleData && (
                    <div className="preview-table">
                        <h4>Sample Data (first 5 rows):</h4>
                        <table>
                            <thead>
                                <tr>
                                    {dataPreview.columns?.map((col, index) => (
                                        <th key={index}>{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {dataPreview.sampleData.map((row, index) => (
                                    <tr key={index}>
                                        {dataPreview.columns?.map((col, colIndex) => (
                                            <td key={colIndex}>{row[col] || '-'}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };
    const renderConflicts = () => {
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
    const renderImportProgress = () => {
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
                            backgroundColor: importProgress.stage === 'error' ? '#dc3545' : '#28a745'
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
    const renderImportHistory = () => {
        if (importHistory.length === 0) return null;
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
                            <div className={`history-status ${item.status}`}>
                                {item.status}
                            </div>
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
                <button 
                    className={operationType === 'create' ? 'active' : ''}
                    onClick={() => setOperationType('create')}
                >
                    Create New District
                </button>
                <button 
                    className={operationType === 'update' ? 'active' : ''}
                    onClick={() => setOperationType('update')}
                >
                    Update Existing District
                </button>
            </div>
            <div className="main-content">
                <div className="upload-section">
                    <h2>
                        {operationType === 'create' ? '📁 Create New District' : '🔄 Update District Data'}
                    </h2>
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
                                <li>Required columns: Zoeksleutel, Adres, etc.</li>
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
