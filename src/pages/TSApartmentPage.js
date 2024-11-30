import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import useAuth from '../hooks/useAuth';
import '../styles/tsApartmentDetails.css';

const TSPApartmentPage = () => {
  const params = useParams();
  const axiosPrivate = useAxiosPrivate();
  const { auth } = useAuth();

  const isTechnischePlanning = auth?.roles?.includes(1991);

  const [flat, setFlat] = useState({
    _id: '',
    zoeksleutel: '',
    soortBouw: '',
    adres: '',
    huisNummer: '',
    toevoeging: '',
    postcode: '',
    FCStatusHAS: '',
    complexNaam: '',
    hasTechnischeSchouwer: false,
    hasWerkvoorbereider: false,
    hasHASPlanning: false,
    hasHASMonteur: false,
    createdAt: null,
    updatedAt: null,
    technischePlanning: null
  });

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

  const [appointmentData, setAppointmentData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    weekNumber: null
  });

  useEffect(() => {
    const fetchApartment = async () => {
      try {
        const { data } = await axiosPrivate.get(`/api/apartment/${params.id}`);
        console.log('Full flat data:', data);
        
        const appointmentData = data.technischePlanning?.appointmentBooked;
        console.log('Appointment data:', appointmentData);
  
        setFlat({
          _id: data._id,
          zoeksleutel: data.zoeksleutel,
          soortBouw: data.soortBouw,
          adres: data.adres,
          huisNummer: data.huisNummer,
          toevoeging: data.toevoeging,
          postcode: data.postcode,
          FCStatusHAS: data.FCStatusHAS,
          complexNaam: data.complexNaam,
          hasTechnischeSchouwer: data.technischeSchouwer?.inspection?.status === 'completed',
          hasWerkvoorbereider: !!(data.werkvoorbereider?.planning?.materials?.length || 
                               data.werkvoorbereider?.planning?.estimatedDuration),
          hasHASMonteur: data.hasMonteur?.installation?.status === 'completed',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          technischePlanning: data.technischePlanning || null
        });
  
        if (isTechnischePlanning && data.technischePlanning) {
          setFormData({
            vveWocoName: data.technischePlanning.vveWocoName || '',
            telephone: data.technischePlanning.telephone || '',
            technischeSchouwerName: data.technischePlanning.technischeSchouwerName || '',
            readyForSchouwer: data.technischePlanning.readyForSchouwer || false,
            signed: data.technischePlanning.signed || false,
            calledAlready: data.technischePlanning.calledAlready || false,
            timesCalled: data.technischePlanning.timesCalled || 0,
            appointmentBooked: data.technischePlanning.appointmentBooked || {
              date: null,
              startTime: '',
              endTime: '',
              weekNumber: null,
            },
            additionalNotes: data.technischePlanning.additionalNotes || '',
            smsSent: data.technischePlanning.smsSent || false
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
  
    fetchApartment();
  }, [params.id, axiosPrivate, isTechnischePlanning]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'number' ? Number(value) : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : 
               type === 'number' ? Number(value) : value
      }));
    }
  };

  const handleAppointmentChange = (e) => {
    const { name, value } = e.target;
    setAppointmentData((prevData) => ({
      ...prevData,
      [name]: value,
      weekNumber: name === 'date' ? calculateWeekNumber(value) : prevData.weekNumber
    }));
  };

  const calculateWeekNumber = (date) => {
    const currentDate = new Date(date);
    const startDate = new Date(currentDate.getFullYear(), 0, 1);
    const days = Math.floor((currentDate - startDate) / (24 * 60 * 60 * 1000));
    return Math.ceil(days / 7);
  };

  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosPrivate.put(`/api/apartment/${params.id}/technische-planning`, {
        appointmentBooked: {
          date: appointmentData.date,
          startTime: appointmentData.startTime,
          endTime: appointmentData.endTime,
          weekNumber: appointmentData.weekNumber
        }
      });
      const { data } = await axiosPrivate.get(`/api/apartment/${params.id}`);
      if (data.technischePlanning?.appointmentBooked) {
        setFormData(prev => ({
          ...prev,
          appointmentBooked: {
            date: new Date(data.technischePlanning.appointmentBooked.date).toISOString().split('T')[0],
            startTime: data.technischePlanning.appointmentBooked.startTime,
            endTime: data.technischePlanning.appointmentBooked.endTime,
            weekNumber: data.technischePlanning.appointmentBooked.weekNumber
          }
        }));
      }
      alert('Appointments saved successfully!');
    } catch (error) {
      console.error('Error saving appointments:', error);
      alert('Error saving appointments. Please try again.');
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

  return (
    <div className="ts-apartmentDetailsContainer">
      <h2 className="ts-apartmentTitle">
        {flat.adres} {flat.huisNummer}{flat.toevoeging}
        <span className={flat.FCStatusHAS === "2" ? "greenCheckmark" : "redCheckmark"}>
          &#10004;
        </span>
      </h2>

      <div className="ts-columns">
        <div className="ts-leftColumn">
          <h3>Flat Details</h3>
          <div className="ts-detailsGrid">
            <div className="ts-detailItem">
              <p><b>Address:</b> {flat.adres} {flat.huisNummer}{flat.toevoeging}</p>
              <p><b>Postcode:</b> {flat.postcode}</p>
              <p><b>Type:</b> {flat.soortBouw}</p>
              <p><b>Complex Name:</b> {flat.complexNaam || 'N/A'}</p>
              <p><b>Search Key:</b> {flat.zoeksleutel || 'N/A'}</p>
              
              {flat.technischePlanning?.appointmentBooked?.date && (
                <div className="ts-appointmentInfo">
                  <h4>Current Appointment</h4>
                  <p><b>Date:</b> {new Date(flat.technischePlanning.appointmentBooked.date).toLocaleDateString()}</p>
                  <p><b>Time:</b> {flat.technischePlanning.appointmentBooked.startTime} - {flat.technischePlanning.appointmentBooked.endTime}</p>
                  <p><b>Week:</b> {flat.technischePlanning.appointmentBooked.weekNumber}</p>
                </div>
              )}
            </div>

            <div className="ts-statusSection">
              <h4>Status Overview</h4>
              <div className="ts-statusGrid">
                <div className={`ts-statusItem ${flat.hasTechnischeSchouwer ? 'completed' : ''}`}>
                  Technische Schouwer
                </div>
                <div className={`ts-statusItem ${flat.hasWerkvoorbereider ? 'completed' : ''}`}>
                  Werkvoorbereider
                </div>
                <div className={`ts-statusItem ${flat.hasHASPlanning ? 'completed' : ''}`}>
                  HAS Planning
                </div>
                <div className={`ts-statusItem ${flat.hasHASMonteur ? 'completed' : ''}`}>
                  HAS Monteur
                </div>
              </div>
            </div>

            <div className="ts-timestamps">
              <p><b>Created:</b> {flat.createdAt ? new Date(flat.createdAt).toLocaleString() : 'N/A'}</p>
              <p><b>Last Updated:</b> {flat.updatedAt ? new Date(flat.updatedAt).toLocaleString() : 'N/A'}</p>
            </div>
          </div>
        </div>

        {isTechnischePlanning && (
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
                <label>Additional Notes:</label>
                <textarea
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleChange}
                />
              </div>

              <button type="submit" className="ts-saveButton">Save</button>
            </form>

            <h3>Set Appointment Details</h3>
            <form onSubmit={handleAppointmentSubmit} className="ts-form">
              <div className="ts-formGroup">
                <label>Appointment Date:</label>
                <input
                  type="date"
                  name="date"
                  value={appointmentData.date}
                  onChange={handleAppointmentChange}
                  className="ts-input"
                  required
                />
              </div>
              <div className="ts-formGroup">
                <label>Start Time:</label>
                <input
                  type="time"
                  name="startTime"
                  value={appointmentData.startTime}
                  onChange={handleAppointmentChange}
                  className="ts-input"
                  required
                />
              </div>
              <div className="ts-formGroup">
                <label>End Time:</label>
                <input
                  type="time"
                  name="endTime"
                  value={appointmentData.endTime}
                  onChange={handleAppointmentChange}
                  className="ts-input"
                  required
                />
              </div>
              <div className="ts-formGroup">
                <label>Week Number:</label>
                <input
                  type="number"
                  name="weekNumber"
                  value={appointmentData.weekNumber || ''}
                  readOnly
                  className="ts-input"
                />
              </div>
              <button type="submit" className="ts-saveButton">
                Save Appointment
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default TSPApartmentPage;