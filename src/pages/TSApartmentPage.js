import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import '../styles/tsApartmentDetails.css';

const TSPApartmentPage = () => {
  const params = useParams();
  const axiosPrivate = useAxiosPrivate();

  // Separate state for flat and technischePlanning data
  const [flat, setFlat] = useState({
    _id: '',
    zoeksleutel: '',
    soortBouw: '',
    adres: '',
    huisNummer: '',
    toevoeging: '',
    postcode: '',
    FCStatusHAS: '',
  });

  // Form state for technischePlanning fields
  const [formData, setFormData] = useState({
    vveWocoName: '',
    telephone: '',
    technischeSchouwerName: '',
    readyForSchouwer: false,
    signed: false,
    calledAlready: false,
    timesCalled: 0,
    appointmentBooked: {
      date: null,
      startTime: '',
      endTime: '',
      weekNumber: null,
    },
    additionalNotes: '',
    smsSent: false
  });

  useEffect(() => {
    const fetchApartment = async () => {
      try {
        const { data } = await axiosPrivate.get(`/api/apartment/${params.id}`);
        
        // Set flat data
        setFlat({
          _id: data._id,
          zoeksleutel: data.zoeksleutel,
          soortBouw: data.soortBouw,
          adres: data.adres,
          huisNummer: data.huisNummer,
          toevoeging: data.toevoeging,
          postcode: data.postcode,
          FCStatusHAS: data.FCStatusHAS,
        });

        // Set technischePlanning data if it exists
        if (data.technischePlanning) {
          setFormData({
            vveWocoName: data.technischePlanning.vveWocoName || '',
            telephone: data.technischePlanning.telephone || '',
            technischeSchouwerName: data.technischePlanning.technischeSchouwerName || '',
            readyForSchouwer: data.technischePlanning.readyForSchouwer || false,
            signed: data.technischePlanning.signed || false,
            calledAlready: data.technischePlanning.calledAlready || false,
            timesCalled: data.technischePlanning.timesCalled || 0,
            appointmentBooked: {
              date: data.technischePlanning.appointmentBooked?.date || null,
              startTime: data.technischePlanning.appointmentBooked?.startTime || '',
              endTime: data.technischePlanning.appointmentBooked?.endTime || '',
              weekNumber: data.technischePlanning.appointmentBooked?.weekNumber || null,
            },
            additionalNotes: data.technischePlanning.additionalNotes || '',
            smsSent: data.technischePlanning.smsSent || false
          });
        }
      } catch (error) {
        console.error('Error fetching apartment data', error);
      }
    };

    fetchApartment();
  }, [params.id, axiosPrivate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Handle nested appointmentBooked fields
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'number' ? Number(value) : value
        }
      }));
    } else {
      // Handle regular fields
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : 
               type === 'number' ? Number(value) : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosPrivate.put(`/api/apartment/${params.id}/technische-planning`, formData);
      alert('Data saved successfully!');
    } catch (error) {
      console.error('Error saving data', error);
      alert('Error saving data');
    }
  };

  const formatFieldName = (fieldName) => {
    return fieldName
      .replace(/([a-zA-Z])(\d+)/g, '$1 $2')
      .replace(/(\d+)([a-zA-Z])/g, '$1 $2')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <div className="ts-apartmentDetailsContainer">
      <h2 className="ts-apartmentTitle">
        {flat.adres} {flat.huisNummer}{flat.toevoeging}
        <span className={flat.FCStatusHAS === "2" ? "greenCheckmark" : "redCheckmark"}>
          &#10004;
        </span>
      </h2>

      <div className="ts-columns">
        {/* Left Column - Flat Information */}
        <div className="ts-leftColumn">
          <h3>Flat Details</h3>
          <p><b>Address:</b> {flat.adres} {flat.huisNummer}{flat.toevoeging}</p>
          <p><b>Postcode:</b> {flat.postcode}</p>
          <p><b>Type:</b> {flat.soortBouw}</p>
        </div>

        {/* Right Column - TechnischePlanning Form */}
        <div className="ts-rightColumn">
          <h3>Planning Details</h3>
          <form onSubmit={handleSubmit}>
            <div className="ts-formGroup">
              <label>VVE/WOCO Name:</label>
              <select
                name="vveWocoName"
                value={formData.vveWocoName}
                onChange={handleChange}
              >
                <option value="">Select...</option>
                <option value="VVE">VVE</option>
                <option value="WOCO">WOCO</option>
                <option value="Punt Beherder">Punt Beherder</option>
                <option value="VGE">VGE</option>
                <option value="Huurder">Huurder</option>
              </select>
            </div>

            <div className="ts-formGroup">
              <label>Telephone:</label>
              <input
                type="text"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
              />
            </div>

            <div className="ts-formGroup">
              <label>Technische Schouwer:</label>
              <input
                type="text"
                name="technischeSchouwerName"
                value={formData.technischeSchouwerName}
                onChange={handleChange}
              />
            </div>

            <div className="ts-formGroup">
              <label>
                <input
                  type="checkbox"
                  name="readyForSchouwer"
                  checked={formData.readyForSchouwer}
                  onChange={handleChange}
                />
                Ready for Schouwer
              </label>
            </div>

            <div className="ts-formGroup">
              <label>
                <input
                  type="checkbox"
                  name="signed"
                  checked={formData.signed}
                  onChange={handleChange}
                />
                Signed
              </label>
            </div>

            <div className="ts-formGroup">
              <label>Times Called:</label>
              <input
                type="number"
                name="timesCalled"
                value={formData.timesCalled}
                onChange={handleChange}
                min="0"
              />
            </div>

            <div className="ts-formGroup">
              <label>Appointment Date:</label>
              <input
                type="date"
                name="appointmentBooked.date"
                value={formData.appointmentBooked.date ? new Date(formData.appointmentBooked.date).toISOString().split('T')[0] : ''}
                onChange={handleChange}
              />
            </div>

            <div className="ts-formGroup">
              <label>Start Time:</label>
              <input
                type="time"
                name="appointmentBooked.startTime"
                value={formData.appointmentBooked.startTime}
                onChange={handleChange}
              />
            </div>

            <div className="ts-formGroup">
              <label>End Time:</label>
              <input
                type="time"
                name="appointmentBooked.endTime"
                value={formData.appointmentBooked.endTime}
                onChange={handleChange}
              />
            </div>

            <div className="ts-formGroup">
              <label>Week Number:</label>
              <input
                type="number"
                name="appointmentBooked.weekNumber"
                value={formData.appointmentBooked.weekNumber || ''}
                onChange={handleChange}
                min="1"
                max="53"
              />
            </div>

            <div className="ts-formGroup">
              <label>Additional Notes:</label>
              <textarea
                name="additionalNotes"
                value={formData.additionalNotes}
                onChange={handleChange}
              />
            </div>

            <button type="submit" className="ts-saveButton">Save</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TSPApartmentPage;