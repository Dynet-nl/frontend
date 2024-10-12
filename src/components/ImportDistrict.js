import React from 'react'
import { useState } from 'react'
import useAxiosPrivate from '../hooks/useAxiosPrivate'
import Button from '@mui/material/Button';

const ImportDistrict = ({ areaId, setNewDistrictUploaded }) => {
  const axiosPrivate = useAxiosPrivate()
  const [selectedFile, setSelectedFile] = useState([])
  const [currentDistrict, setCurrentDistrict] = useState('')

  const send = async (file, districtName) => {
    // setNewDistrictUploaded(false) // think of a better way, when we upload two files one after another, we should get them in the list of districts
    const formData = new FormData()
    formData.append('file', file)
    formData.append('currentDistrict', districtName)
    formData.append('areaId', areaId);

    console.log('file', file)

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
    const { data } = await axiosPrivate.post('/api/district', formData, config)
    setNewDistrictUploaded((prev) => prev + 1)
    console.log('post data', data)
  }

  const sendToUpdate = async (file) => {
    const formData = new FormData()
    formData.append('file', file)

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
    const { data } = await axiosPrivate.put('/api/district', formData, config)
    console.log('put data', data)
  }

  return (
    <>
      <div style={{ padding: '20px', marginBottom: '30px' }}>
        <h2 style={{ marginBottom: '20px' }}>Create District</h2>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="import" style={{ marginRight: '10px' }}>Import Excel File </label>
          <input
            id="import"
            name="import"
            type="file"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            style={{ marginRight: '10px' }}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="currentDistrict" style={{ marginRight: '10px' }}>Enter District Name </label>
          <input
            name="currentDistrict"
            value={currentDistrict}
            onChange={(e) => setCurrentDistrict(e.target.value)}
            style={{ marginRight: '10px', padding: '5px' }}
          ></input>
        </div>
        <Button onClick={() => send(selectedFile, currentDistrict)} style={{ padding: '5px 15px' }}>
          Create Data
        </Button>
      </div>

      <div style={{ padding: '20px' }}>
        <h2 style={{ marginBottom: '20px' }}>Update District</h2>
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="update" style={{ marginRight: '10px' }}>Import Excel File </label>
          <input
            id="update"
            name="update"
            type="file"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            style={{ marginRight: '10px' }}
          />
        </div>
        <Button onClick={() => sendToUpdate(selectedFile)} style={{ padding: '5px 15px' }}>Update Data</Button>
      </div>
    </>
  )
}

export default ImportDistrict