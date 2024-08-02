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
    eMail: '',
    FCStatusHAS: '',
    additionalNotes: '',
  });

  const [formData, setFormData] = useState({
    achternaam: '',
    tel1: '',
    eMail: '',
    additionalNotes: '',
  });

  useEffect(() => {
    const fetchApartment = async () => {
      try {
        const { data } = await axiosPrivate.get(`/api/apartment/${params.id}`);
        setApartment({
          _id: data._id,
          zoeksleutel: data.zoeksleutel,
          soortBouw: data.soortBouw,
          adres: data.adres,
          huisNummer: data.huisNummer,
          toevoeging: data.toevoeging,
          postcode: data.postcode,
          achternaam: data.achternaam,
          tel1: data.tel1,
          eMail: data.eMail,
          FCStatusHAS: data.FCStatusHAS,
          additionalNotes: data.technischePlanning?.additionalNotes || '',
        });
        setFormData({
          achternaam: data.achternaam,
          tel1: data.tel1,
          eMail: data.eMail,
          additionalNotes: data.technischePlanning?.additionalNotes || '',
        });
      } catch (error) {
        console.error('Error fetching apartment data', error);
      }
    };

    fetchApartment();
  }, [params.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedData = {
        ...formData,
        technischePlanning: {
          additionalNotes: formData.additionalNotes,
        },
      };
      await axiosPrivate.put(`/api/apartment/${params.id}`, updatedData);
      setApartment((prevApartment) => ({
        ...prevApartment,
        ...formData,
      }));
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
            if (!value || key === '_id' || key === 'zoeksleutel' || key === 'soortBouw' || key === 'huisNummer' || key === 'toevoeging' || key === 'postcode' || key === 'FCStatusHAS') return null;
            return (
              <p key={key}><b>{formatFieldName(key)}:</b> {value}</p>
            );
          })}
        </div>
        <div className="ts-rightColumn">
          <form onSubmit={handleSubmit}>
            <div className="ts-formGroup">
              <label>Name:</label>
              <select
                name="achternaam"
                value={formData.achternaam}
                onChange={handleChange}
              >
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
                name="tel1"
                value={formData.tel1}
                onChange={handleChange}
              />
            </div>
            <div className="ts-formGroup">
              <label>Email:</label>
              <input
                type="email"
                name="eMail"
                value={formData.eMail}
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
            <button type="submit" className="ts-saveButton">Save</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TSPApartmentPage;
