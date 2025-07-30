// Component for importing district data from Excel files with validation and error handling.

import React, {useState} from 'react'
import useAxiosPrivate from '../hooks/useAxiosPrivate'
import Button from '@mui/material/Button';
import {BounceLoader} from 'react-spinners';
const ImportDistrict = ({areaId, setNewDistrictUploaded, onDistrictCreated}) => {
    const axiosPrivate = useAxiosPrivate()
    const [selectedFile, setSelectedFile] = useState([])
    const [currentDistrict, setCurrentDistrict] = useState('')
    const [isImporting, setIsImporting] = useState(false)
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
            formData.append('areaId', areaId);
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
            await axiosPrivate.post('/api/district', formData, config)
            if (setNewDistrictUploaded) {
                setNewDistrictUploaded(prev => prev + 1)
            }
            setSelectedFile([])
            setCurrentDistrict('')
            if (onDistrictCreated) {
                onDistrictCreated()
            }
        } catch (error) {
            console.error('Import error:', error)
            alert('Error importing district')
        } finally {
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
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
            await axiosPrivate.put('/api/district', formData, config)
            setSelectedFile([])
            if (onDistrictCreated) {
                onDistrictCreated()
            }
        } catch (error) {
            console.error('Update error:', error)
            alert('Error updating district')
        } finally {
            setIsImporting(false)
        }
    }
    return (
        <>
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