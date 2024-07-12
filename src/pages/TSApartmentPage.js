import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import '../styles/tsApartmentDetails.css';

const TSPApartmentPage = () => {
  const params = useParams();
  const axiosPrivate = useAxiosPrivate();

  const [apartment, setApartment] = useState({
    _id: '',
    zoeksleutel: '',
    soortBouw: '',
    adres: '',
    huisNummer: '',
    toevoeging: '',
    postcode: '',
    achternaam: '',
    tel1: '',
    tel2: '',
    eMail: '',
    FCStatusHAS: '',
  });

  const [formData, setFormData] = useState({
    telephone: '',
    vveWocoName: '',
    technischeSchouwerName: '',
    readyForSchouwer: false,
    signed: false,
    calledAlready: false,
    timesCalled: 0,
    appointmentDate: '',
    appointmentStartTime: '',
    appointmentEndTime: '',
    appointmentWeekNumber: '',
    additionalNotes: '',
    smsSent: false,
  });

  useEffect(() => {
    const fetchApartment = async () => {
      try {
        const { data } = await axiosPrivate.get(`/api/apartment/${params.id}`);
        const flatData = data;
        
        setApartment({
          _id: flatData._id,
          zoeksleutel: flatData.zoeksleutel,
          complexNaam: flatData.complexNaam,
          soortBouw: flatData.soortBouw,
          adres: flatData.adres,
          huisNummer: flatData.huisNummer,
          toevoeging: flatData.toevoeging,
          kamer: flatData.kamer,
          postcode: flatData.postcode,
          achternaam: flatData.achternaam,
          tel1: flatData.tel1,
          tel2: flatData.tel2,
          eMail: flatData.eMail,
          FCStatusHAS: flatData.FCStatusHAS,
        });

        if (flatData.technischePlanning) {
          setFormData({
            ...formData,
            ...flatData.technischePlanning,
            appointmentDate: flatData.technischePlanning.appointmentBooked?.date || '',
            appointmentStartTime: flatData.technischePlanning.appointmentBooked?.startTime || '',
            appointmentEndTime: flatData.technischePlanning.appointmentBooked?.endTime || '',
            appointmentWeekNumber: flatData.technischePlanning.appointmentBooked?.weekNumber || '',
          });
        }
      } catch (error) {
        console.error('Error fetching flat data', error);
      }
    };

    fetchApartment();
  }, [params.id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedData = {
        ...formData,
        appointmentBooked: {
          date: formData.appointmentDate,
          startTime: formData.appointmentStartTime,
          endTime: formData.appointmentEndTime,
          weekNumber: formData.appointmentWeekNumber,
        },
      };
      await axiosPrivate.put(`/api/apartment/${params.id}`, { technischePlanning: updatedData });
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

  const checkmark = (
    <span className={apartment.FCStatusHAS === "2" ? "greenCheckmark" : "redCheckmark"}>
      &#10004;
    </span>
  );

  return (
    <div className="ts-apartmentDetailsContainer">
      <h2 className="ts-apartmentTitle">
        {apartment.adres} {apartment.huisNummer}{apartment.toevoeging} {checkmark}
      </h2>
      <div className="ts-columns">
        <div className="ts-leftColumn">
          {Object.entries(apartment).map(([key, value]) => {
            if (!value) return null;

            let formattedValue = value;
            if (key === 'HASDatum' || key.includes('Datum')) {
              formattedValue = new Date(value).toLocaleDateString();
            }

            return (
              <p key={key}><b>{formatFieldName(key)}:</b> {formattedValue}</p>
            );
          })}
        </div>
        <div className="ts-rightColumn">
          <form onSubmit={handleSubmit}>
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
              <label>Name of VVE/WOCO:</label>
              <input
                type="text"
                name="vveWocoName"
                value={formData.vveWocoName}
                onChange={handleChange}
              />
            </div>
            <div className="ts-formGroup">
              <label>Technische Schouwer Name:</label>
              <input
                type="text"
                name="technischeSchouwerName"
                value={formData.technischeSchouwerName}
                onChange={handleChange}
              />
            </div>
            <div className="ts-formGroup">
              <label>Ready for Schouwer:</label>
              <input
                type="checkbox"
                name="readyForSchouwer"
                checked={formData.readyForSchouwer}
                onChange={handleChange}
              />
            </div>
            <div className="ts-formGroup">
              <label>Signed:</label>
              <input
                type="checkbox"
                name="signed"
                checked={formData.signed}
                onChange={handleChange}
              />
            </div>
            <div className="ts-formGroup">
              <label>Called Already:</label>
              <input
                type="checkbox"
                name="calledAlready"
                checked={formData.calledAlready}
                onChange={handleChange}
              />
            </div>
            <div className="ts-formGroup">
              <label>Times Called:</label>
              <input
                type="number"
                name="timesCalled"
                value={formData.timesCalled}
                onChange={handleChange}
              />
            </div>
            <div className="ts-formGroup">
              <label>Appointment Date:</label>
              <input
                type="date"
                name="appointmentDate"
                value={formData.appointmentDate}
                onChange={handleChange}
              />
            </div>
            <div className="ts-formGroup">
              <label>Appointment Start Time:</label>
              <input
                type="time"
                name="appointmentStartTime"
                value={formData.appointmentStartTime}
                onChange={handleChange}
              />
            </div>
            <div className="ts-formGroup">
              <label>Appointment End Time:</label>
              <input
                type="time"
                name="appointmentEndTime"
                value={formData.appointmentEndTime}
                onChange={handleChange}
              />
            </div>
            <div className="ts-formGroup">
              <label>Appointment Week Number:</label>
              <input
                type="number"
                name="appointmentWeekNumber"
                value={formData.appointmentWeekNumber}
                onChange={handleChange}
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
            <div className="ts-formGroup">
              <label>SMS Sent:</label>
              <input
                type="checkbox"
                name="smsSent"
                checked={formData.smsSent}
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
