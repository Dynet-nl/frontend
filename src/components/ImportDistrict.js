// Component for importing district data from Excel files with validation and error handling.

import React, { useState, useEffect } from 'react'
import useAxiosPrivate from '../hooks/useAxiosPrivate'
import Button from '@mui/material/Button';
import { BounceLoader } from 'react-spinners';
import ImportProgressModal from './ImportProgressModal';
const ImportDistrict = ({areaId, setNewDistrictUploaded, onDistrictCreated}) => {
    const axiosPrivate = useAxiosPrivate()
    const [selectedFile, setSelectedFile] = useState([])
    const [currentDistrict, setCurrentDistrict] = useState('')
    const [isImporting, setIsImporting] = useState(false)
    
    // Progress tracking states
    const [activeImportId, setActiveImportId] = useState(null)
    const [showProgressModal, setShowProgressModal] = useState(false)

    // Add page leave protection during imports
    useEffect(() => {
        if (!activeImportId) return;

        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = 'District import is in progress. Leaving this page will cancel the import. Are you sure?';
            return e.returnValue;
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [activeImportId]);
    const send = async (file, districtName) => {
        if (!file || !districtName) {
            alert('Please select a file and enter a district name')
            return
        }
        setIsImporting(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('currentDistrict', districtName)
            formData.append('areaId', areaId)
            formData.append('operationType', 'create')
            
            console.log('🚀 [ImportDistrict] Starting enhanced import with progress tracking...')
            
            const response = await axiosPrivate.post('/api/district/import-enhanced', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            
            console.log('📡 [ImportDistrict] Received import ID:', response.data.importId)
            
            // Start progress tracking
            setActiveImportId(response.data.importId)
            setShowProgressModal(true)
            
        } catch (error) {
            console.error('❌ [ImportDistrict] Error starting import:', error)
            alert(`Import failed: ${error.response?.data?.message || error.message}`)
            setIsImporting(false)
        }
    }
    const sendToUpdate = async (file) => {
        if (!file) {
            alert('Please select a file')
            return
        }
        setIsImporting(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('areaId', areaId)
            formData.append('operationType', 'update')
            
            console.log('🚀 [ImportDistrict] Starting enhanced update with progress tracking...')
            
            const response = await axiosPrivate.post('/api/district/import-enhanced', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            
            console.log('📡 [ImportDistrict] Received import ID:', response.data.importId)
            
            // Start progress tracking
            setActiveImportId(response.data.importId)
            setShowProgressModal(true)
            
        } catch (error) {
            console.error('❌ [ImportDistrict] Error starting update:', error)
            alert(`Update failed: ${error.response?.data?.message || error.message}`)
            setIsImporting(false)
        }
    }

    const handleProgressComplete = (result) => {
        console.log('🎉 [ImportDistrict] Import completed successfully:', result)
        
        if (setNewDistrictUploaded) {
            setNewDistrictUploaded(prev => prev + 1)
        }
        setSelectedFile([])
        setCurrentDistrict('')
        
        if (onDistrictCreated) {
            onDistrictCreated()
        }
        
        // Clear progress tracking
        setActiveImportId(null)
        setShowProgressModal(false)
        setIsImporting(false)
        
        alert('District import completed successfully!')
    }

    const handleProgressError = (error) => {
        console.error('❌ [ImportDistrict] Import failed:', error)
        
        // Clear progress tracking
        setActiveImportId(null)
        setShowProgressModal(false)
        setIsImporting(false)
        
        alert(`Import failed: ${error}`)
    }

    const handleProgressCancel = () => {
        console.log('⏹️ [ImportDistrict] Import cancelled by user')
        
        // Clear progress tracking
        setActiveImportId(null)
        setShowProgressModal(false)
        setIsImporting(false)
    }
    return (
        <>
            {/* Progress Modal */}
            {showProgressModal && activeImportId && (
                <ImportProgressModal
                    importId={activeImportId}
                    onComplete={handleProgressComplete}
                    onError={handleProgressError}
                    onCancel={handleProgressCancel}
                />
            )}
            
            <div style={{padding: '20px', marginBottom: '30px'}}>
                <h2 style={{marginBottom: '20px'}}>Create District</h2>
                <div style={{marginBottom: '15px'}}>
                    <label htmlFor="import" style={{marginRight: '10px'}}>Import Excel File </label>
                    <input
                        id="import"
                        name="import"
                        type="file"
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                        style={{marginRight: '10px'}}
                        disabled={isImporting}
                    />
                </div>
                <div style={{marginBottom: '20px'}}>
                    <label htmlFor="currentDistrict" style={{marginRight: '10px'}}>Enter District Name </label>
                    <input
                        name="currentDistrict"
                        value={currentDistrict}
                        onChange={(e) => setCurrentDistrict(e.target.value)}
                        style={{marginRight: '10px', padding: '5px'}}
                        disabled={isImporting}
                    />
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <Button
                        onClick={() => send(selectedFile, currentDistrict)}
                        style={{padding: '5px 15px'}}
                        disabled={isImporting}
                    >
                        Create Data
                    </Button>
                    {isImporting && <BounceLoader size={24} color="#3498db"/>}
                </div>
            </div>
            <div style={{padding: '20px'}}>
                <h2 style={{marginBottom: '20px'}}>Update District</h2>
                <div style={{marginBottom: '20px'}}>
                    <label htmlFor="update" style={{marginRight: '10px'}}>Import Excel File </label>
                    <input
                        id="update"
                        name="update"
                        type="file"
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                        style={{marginRight: '10px'}}
                        disabled={isImporting}
                    />
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <Button
                        onClick={() => sendToUpdate(selectedFile)}
                        style={{padding: '5px 15px'}}
                        disabled={isImporting}
                    >
                        Update Data
                    </Button>
                    {isImporting && <BounceLoader size={24} color="#3498db"/>}
                </div>
            </div>
        </>
    )
}
export default ImportDistrict