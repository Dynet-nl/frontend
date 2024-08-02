import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import '../styles/tsApartmentDetails.css';

const TSApartmentSchedulePage = () => {
  const { id } = useParams();
  const axiosPrivate = useAxiosPrivate();

  const [building, setBuilding] = useState(null);
  const [formData, setFormData] = useState({});
  const [appointmentData, setAppointmentData] = useState({
    appointmentDate: '',
    appointmentStartTime: '',
    appointmentEndTime: '',
    appointmentWeekNumber: '',
    fileUrl: '', // Added to hold the file URL
  });
  const [selectedFile, setSelectedFile] = useState(null); // State for file
  const [uploadProgress, setUploadProgress] = useState(0); // State for upload progress
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBuilding = async () => {
      try {
        const { data } = await axiosPrivate.get(`/api/building/${id}`);
        setBuilding(data);

        const initialFormData = data.flats.reduce((acc, flat) => {
          acc[flat._id] = {
            telephone: flat.tel1 || '',
            eMail: flat.eMail || '',
            additionalNotes: flat.technischePlanning?.additionalNotes || '',
            fileUrl: flat.fileUrl || '', // Added to hold the file URL
          };
          return acc;
        }, {});
        setFormData(initialFormData);

        setAppointmentData({
          appointmentDate: data.appointmentDate || '',
          appointmentStartTime: data.appointmentStartTime || '',
          appointmentEndTime: data.appointmentEndTime || '',
          appointmentWeekNumber: data.appointmentWeekNumber || '',
          fileUrl: data.fileUrl || '', // Added to hold the file URL
        });

        setLoading(false);
      } catch (error) {
        console.error('Error fetching building data', error);
      }
    };

    fetchBuilding();
  }, [id, axiosPrivate]);

  const handleChange = (e, flatId) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [flatId]: {
        ...formData[flatId],
        [name]: value,
      },
    });
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const getWeekNumber = (dateString) => {
    const date = new Date(dateString);
    const firstJan = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date - firstJan) / (24 * 60 * 60 * 1000));
    return Math.ceil((date.getDay() + 1 + days) / 7);
  };

  const handleAppointmentChange = (e) => {
    const { name, value } = e.target;
    const updatedAppointmentData = { ...appointmentData, [name]: value };

    if (name === 'appointmentDate') {
      const weekNumber = getWeekNumber(value);
      updatedAppointmentData.appointmentWeekNumber = weekNumber;
    }

    setAppointmentData(updatedAppointmentData);
  };

  const handleSubmit = async (e, flatId) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('telephone', formData[flatId].telephone);
      data.append('eMail', formData[flatId].eMail);
      data.append('additionalNotes', formData[flatId].additionalNotes);

      const response = await axiosPrivate.put(`/api/apartment/${flatId}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update the formData with the file URL from the response
      setFormData((prevFormData) => ({
        ...prevFormData,
        [flatId]: {
          ...prevFormData[flatId],
          fileUrl: response.data.fileUrl,
        },
      }));

      alert('Data saved successfully!');
    } catch (error) {
      console.error('Error saving data', error);
      alert('Error saving data');
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file to upload.');
      return;
    }

    try {
      const data = new FormData();
      data.append('file', selectedFile);

      const response = await axiosPrivate.put(`/api/building/appointment/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      setAppointmentData((prevAppointmentData) => ({
        ...prevAppointmentData,
        fileUrl: response.data.fileUrl,
      }));

      alert('File uploaded successfully!');
    } catch (error) {
      console.error('Error uploading file', error);
      alert('Error uploading file');
    }
  };

  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...appointmentData,
        fileUrl: appointmentData.fileUrl,
      };

      await axiosPrivate.put(`/api/building/appointment/${id}`, data);

      alert('Appointment data saved successfully!');
    } catch (error) {
      console.error('Error saving appointment data', error);
      alert('Error saving appointment data');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="ts-apartmentDetailsContainer">
      <h2>Apartment Schedule for {building.address}</h2>
      <div className="ts-columns">
        <div className="ts-leftColumn">
          {building.flats.map((flat) => (
            <div key={flat._id} className="ts-apartmentDetails">
              <h3>{flat.adres} {flat.huisNummer}{flat.toevoeging}</h3>
              <form onSubmit={(e) => handleSubmit(e, flat._id)} className="ts-form">
                <div className="ts-formGroup">
                  <label>Telephone:</label>
                  <input
                    type="text"
                    name="telephone"
                    value={formData[flat._id]?.telephone || ''}
                    onChange={(e) => handleChange(e, flat._id)}
                    className="ts-input"
                  />
                </div>
                <div className="ts-formGroup">
                  <label>Email:</label>
                  <input
                    type="email"
                    name="eMail"
                    value={formData[flat._id]?.eMail || ''}
                    onChange={(e) => handleChange(e, flat._id)}
                    className="ts-input"
                  />
                </div>
                <div className="ts-formGroup">
                  <label>Additional Notes:</label>
                  <textarea
                    name="additionalNotes"
                    value={formData[flat._id]?.additionalNotes || ''}
                    onChange={(e) => handleChange(e, flat._id)}
                    className="ts-textarea"
                  />
                </div>
                {formData[flat._id]?.fileUrl && (
                  <div className="ts-formGroup">
                    <a href={formData[flat._id].fileUrl} download className="ts-downloadLink">Download File</a>
                  </div>
                )}
                <button type="submit" className="ts-saveButton">Save</button>
              </form>
            </div>
          ))}
        </div>
        <div className="ts-rightColumn">
          <h3>Building Appointment Details</h3>
          <form onSubmit={handleAppointmentSubmit} className="ts-form">
            <div className="ts-formGroup">
              <label>Appointment Date:</label>
              <input
                type="date"
                name="appointmentDate"
                value={appointmentData.appointmentDate}
                onChange={handleAppointmentChange}
                className="ts-input"
              />
            </div>
            <div className="ts-formGroup">
              <label>Appointment Start Time:</label>
              <input
                type="time"
                name="appointmentStartTime"
                value={appointmentData.appointmentStartTime}
                onChange={handleAppointmentChange}
                className="ts-input"
              />
            </div>
            <div className="ts-formGroup">
              <label>Appointment End Time:</label>
              <input
                type="time"
                name="appointmentEndTime"
                value={appointmentData.appointmentEndTime}
                onChange={handleAppointmentChange}
                className="ts-input"
              />
            </div>
            <div className="ts-formGroup">
              <label>Appointment Week Number:</label>
              <input
                type="number"
                name="appointmentWeekNumber"
                value={appointmentData.appointmentWeekNumber}
                readOnly
                className="ts-input"
              />
            </div>
            <div className="ts-formGroup">
              <label>Upload File:</label>
              <input
                type="file"
                name="file"
                onChange={handleFileChange}
                className="ts-input"
              />
              <button type="button" onClick={handleFileUpload} className="ts-uploadButton">Upload</button>
              {uploadProgress > 0 && (
                <div className="ts-progress">
                  <div className="ts-progressBar" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              )}
            </div>
            {appointmentData.fileUrl && (
              <div className="ts-formGroup">
                <a href={appointmentData.fileUrl} download className="ts-downloadLink">Download File</a>
                <p>Uploaded to: {appointmentData.fileUrl}</p>
              </div>
            )}
            <button type="submit" className="ts-saveButton">Save Appointment</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TSApartmentSchedulePage;
