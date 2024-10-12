import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import '../styles/tsApartmentDetails.css';

const TSApartmentSchedulePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();

  const [building, setBuilding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedApartments, setSelectedApartments] = useState([]); // State to track selected apartments
  const [appointmentData, setAppointmentData] = useState({
    appointmentDate: '',
    appointmentStartTime: '',
    appointmentEndTime: '',
  }); // Store common appointment data for all selected flats
  const [flatAppointments, setFlatAppointments] = useState({}); // Store individual appointment data for each flat

  // Helper function to format the date in "YYYY-MM-DD"
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (`0${date.getMonth() + 1}`).slice(-2); // Add leading zero if needed
    const day = (`0${date.getDate()}`).slice(-2); // Add leading zero if needed
    return `${year}-${month}-${day}`;
  };

  // Fetch the building and apartment data, including appointment information
  const fetchBuilding = async () => {
    try {
      const { data } = await axiosPrivate.get(`/api/building/${id}`);
      setBuilding(data);

      // Set appointment data for flats with appointments
      const initialFlatAppointments = {};
      data.flats.forEach((flat) => {
        if (flat.technischePlanning?.appointmentBooked?.date) {
          initialFlatAppointments[flat._id] = {
            appointmentDate: formatDate(flat.technischePlanning.appointmentBooked.date),
            appointmentStartTime: flat.technischePlanning.appointmentBooked.startTime,
            appointmentEndTime: flat.technischePlanning.appointmentBooked.endTime,
          };
        }
      });

      setFlatAppointments(initialFlatAppointments);

      // Automatically select apartments that already have appointments
      const apartmentsWithAppointments = data.flats
        .filter(flat => flat.technischePlanning?.appointmentBooked?.date)
        .map(flat => flat._id);
        
      setSelectedApartments(apartmentsWithAppointments);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching building data', error);
    }
  };

  useEffect(() => {
    fetchBuilding();
  }, [id, axiosPrivate]);

  const handleApartmentSelection = (flatId) => {
    setSelectedApartments((prevSelected) =>
      prevSelected.includes(flatId)
        ? prevSelected.filter((id) => id !== flatId)
        : [...prevSelected, flatId]
    );
  };

  const handleAppointmentChange = (e) => {
    const { name, value } = e.target;
    setAppointmentData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    try {
      // Apply the appointment to the selected apartments
      await Promise.all(
        selectedApartments.map((flatId) =>
          axiosPrivate.put(`/api/apartment/${flatId}`, {
            technischePlanning: {
              appointmentBooked: {
                date: appointmentData.appointmentDate,
                startTime: appointmentData.appointmentStartTime,
                endTime: appointmentData.appointmentEndTime,
              },
            },
          })
        )
      );

      // Refetch building data to reflect the new appointments
      await fetchBuilding();

      alert('Appointment data saved for selected apartments successfully!');
    } catch (error) {
      console.error('Error saving appointment data:', error.response?.data || error.message);
      alert(`Error saving appointment: ${error.response?.data?.message || error.message}`);
    }
  };
    
  if (loading) return <div>Loading...</div>;

  return (
    <div className="ts-apartmentDetailsContainer">
      <h2>Apartment Schedule for {building.address}</h2>
      <div className="ts-columns">
        <div className="ts-leftColumn">
          <h3>Select Apartments for Appointment</h3>
          {building.flats.map((flat) => (
            <div key={flat._id} className="ts-apartmentDetails">
              <label>
                <input
                  type="checkbox"
                  checked={selectedApartments.includes(flat._id)}
                  onChange={() => handleApartmentSelection(flat._id)}
                />
                {flat.adres} {flat.huisNummer}{flat.toevoeging}
              </label>
              {selectedApartments.includes(flat._id) && flatAppointments[flat._id] && (
                <div className="appointmentDetails">
                  <div className="ts-formGroup">
                    <label>Appointment Date:</label>
                    <input
                      type="date"
                      name="appointmentDate"
                      value={flatAppointments[flat._id].appointmentDate || ''}
                      readOnly
                      className="ts-input"
                    />
                  </div>
                  <div className="ts-formGroup">
                    <label>Appointment Start Time:</label>
                    <input
                      type="time"
                      name="appointmentStartTime"
                      value={flatAppointments[flat._id].appointmentStartTime || ''}
                      readOnly
                      className="ts-input"
                    />
                  </div>
                  <div className="ts-formGroup">
                    <label>Appointment End Time:</label>
                    <input
                      type="time"
                      name="appointmentEndTime"
                      value={flatAppointments[flat._id].appointmentEndTime || ''}
                      readOnly
                      className="ts-input"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="ts-rightColumn">
          <h3>Set Appointment Details</h3>
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
            <button type="submit" className="ts-saveButton">Save Appointment</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TSApartmentSchedulePage;
