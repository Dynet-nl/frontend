import React from 'react'
import { useState } from 'react'

import useAxiosPrivate from '../hooks/useAxiosPrivate'

const ImportDistrict = ({ setNewDistrictUploaded }) => {
  const axiosPrivate = useAxiosPrivate()
  const [selectedFile, setSelectedFile] = useState([])
  const [currentDistrict, setCurrentDistrict] = useState('')

  const send = async (file, districtName) => {
    // setNewDistrictUploaded(false) // think of a better way, when we upload two files one after another, we should get them in the list of districts
    const formData = new FormData()
    formData.append('file', file)
    formData.append('currentDistrict', districtName)

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
      <div>
        <h2>Create District</h2>
        <div>
          <label htmlFor="import">Import Excel File </label>
          <input
            id="import"
            name="import"
            type="file"
            onChange={(e) => setSelectedFile(e.target.files[0])}
          />
        </div>
        <br />
        <div>
          <label htmlFor="currentDistrict">Enter District Name </label>
          <input
            name="currentDistrict"
            value={currentDistrict}
            onChange={(e) => setCurrentDistrict(e.target.value)}
          ></input>
        </div>
        <button onClick={() => send(selectedFile, currentDistrict)}>
          Create Data
        </button>
      </div>

      <div>
        <h2>Update District</h2>
        <div>
          <label htmlFor="update">Import Excel File </label>
          <input
            id="update"
            name="update"
            type="file"
            onChange={(e) => setSelectedFile(e.target.files[0])}
          />
        </div>
        <button onClick={() => sendToUpdate(selectedFile)}>Update Data</button>
      </div>
    </>
  )
}

export default ImportDistrict
