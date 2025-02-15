// import React, { useState, useEffect } from 'react';
// import { useParams } from 'react-router-dom';
// import useAxiosPrivate from '../hooks/useAxiosPrivate';
// import useAuth from '../hooks/useAuth';
// import '../styles/tsApartmentDetails.css';
//
// const TSPApartmentPage = () => {
//   const params = useParams();
//   const axiosPrivate = useAxiosPrivate();
//   const { auth } = useAuth();
//
//   const isTechnischePlanning = auth?.roles?.includes(1991);
//   const [isEditingPlanning, setIsEditingPlanning] = useState(false);
//   const [isEditingAppointment, setIsEditingAppointment] = useState(false);
//
//   const [flat, setFlat] = useState({
//     _id: '',
//     zoeksleutel: '',
//     soortBouw: '',
//     adres: '',
//     huisNummer: '',
//     toevoeging: '',
//     postcode: '',
//     FCStatusHAS: '',
//     complexNaam: '',
//     hasTechnischeSchouwer: false,
//     hasWerkvoorbereider: false,
//     hasHASPlanning: false,
//     hasHASMonteur: false,
//     createdAt: null,
//     updatedAt: null,
//     technischePlanning: null
//   });
//
//   const [formData, setFormData] = useState({
//     vveWocoName: '',
//     telephone: '',
//     technischeSchouwerName: '',
//     readyForSchouwer: false,
//     signed: false,
//     calledAlready: false,
//     timesCalled: 0,
//     appointmentBooked: {
//       date: null,
//       startTime: '',
//       endTime: '',
//       weekNumber: null,
//     },
//     additionalNotes: '',
//     smsSent: false
//   });
//
//   const [appointmentData, setAppointmentData] = useState({
//     date: '',
//     startTime: '',
//     endTime: '',
//     weekNumber: null
//   });
//
//   useEffect(() => {
//     const fetchApartment = async () => {
//       try {
//         const { data } = await axiosPrivate.get(`/api/apartment/${params.id}`);
//         console.log('Full flat data:', data);
//
//         const appointmentData = data.technischePlanning?.appointmentBooked;
//         console.log('Appointment data:', appointmentData);
//
//         if (appointmentData) {
//           setAppointmentData({
//             date: new Date(appointmentData.date).toISOString().split('T')[0],
//             startTime: appointmentData.startTime,
//             endTime: appointmentData.endTime,
//             weekNumber: appointmentData.weekNumber
//           });
//         }
//
//         setFlat({
//           _id: data._id,
//           zoeksleutel: data.zoeksleutel,
//           soortBouw: data.soortBouw,
//           adres: data.adres,
//           huisNummer: data.huisNummer,
//           toevoeging: data.toevoeging,
//           postcode: data.postcode,
//           FCStatusHAS: data.FCStatusHAS,
//           complexNaam: data.complexNaam,
//           hasTechnischeSchouwer: data.technischeSchouwer?.inspection?.status === 'completed',
//           hasWerkvoorbereider: !!(data.werkvoorbereider?.planning?.materials?.length ||
//             data.werkvoorbereider?.planning?.estimatedDuration),
//           hasHASMonteur: data.hasMonteur?.installation?.status === 'completed',
//           createdAt: data.createdAt,
//           updatedAt: data.updatedAt,
//           technischePlanning: data.technischePlanning || null,
//         });
//
//         if (data.technischePlanning) {
//           setFormData({
//             vveWocoName: data.technischePlanning.vveWocoName || '',
//             telephone: data.technischePlanning.telephone || '',
//             technischeSchouwerName: data.technischePlanning.technischeSchouwerName || '',
//             readyForSchouwer: data.technischePlanning.readyForSchouwer || false,
//             signed: data.technischePlanning.signed || false,
//             calledAlready: data.technischePlanning.calledAlready || false,
//             timesCalled: data.technischePlanning.timesCalled || 0,
//             appointmentBooked: data.technischePlanning.appointmentBooked || {
//               date: null,
//               startTime: '',
//               endTime: '',
//               weekNumber: null,
//             },
//             additionalNotes: data.technischePlanning.additionalNotes || '',
//             smsSent: data.technischePlanning.smsSent || false,
//           });
//         }
//       } catch (error) {
//         console.error('Error fetching data:', error);
//       }
//     };
//
//     fetchApartment();
//   }, [params.id, axiosPrivate]);
//
//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
//
//     if (name.includes('.')) {
//       const [parent, child] = name.split('.');
//       setFormData(prev => ({
//         ...prev,
//         [parent]: {
//           ...prev[parent],
//           [child]: type === 'number' ? Number(value) : value
//         }
//       }));
//     } else {
//       setFormData(prev => ({
//         ...prev,
//         [name]: type === 'checkbox' ? checked :
//           type === 'number' ? Number(value) : value
//       }));
//     }
//   };
//
//   const handleAppointmentChange = (e) => {
//     const { name, value } = e.target;
//     setAppointmentData((prevData) => ({
//       ...prevData,
//       [name]: value,
//       weekNumber: name === 'date' ? calculateWeekNumber(value) : prevData.weekNumber
//     }));
//   };
//
//   const calculateWeekNumber = (date) => {
//     const currentDate = new Date(date);
//     const startDate = new Date(currentDate.getFullYear(), 0, 1);
//     const days = Math.floor((currentDate - startDate) / (24 * 60 * 60 * 1000));
//     return Math.ceil(days / 7);
//   };
//
//   const handleAppointmentSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       await axiosPrivate.put(`/api/apartment/${params.id}/technische-planning`, {
//         appointmentBooked: appointmentData
//       });
//
//       const { data } = await axiosPrivate.get(`/api/apartment/${params.id}`);
//       if (data.technischePlanning?.appointmentBooked) {
//         setFlat(prev => ({
//           ...prev,
//           technischePlanning: {
//             ...prev.technischePlanning,
//             appointmentBooked: data.technischePlanning.appointmentBooked
//           },
//           updatedAt: new Date().toISOString() // Update the timestamp
//         }));
//       }
//       setIsEditingAppointment(false);
//       alert('Appointment saved successfully!');
//     } catch (error) {
//       console.error('Error saving appointment:', error);
//       alert('Error saving appointment. Please try again.');
//     }
//   };
//
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await axiosPrivate.put(`/api/apartment/${params.id}/technische-planning`, formData);
//       console.log('Updated TechnischePlanning:', response.data);
//
//       setFlat((prevFlat) => ({
//         ...prevFlat,
//         technischePlanning: response.data.technischePlanning,
//         updatedAt: new Date().toISOString() // Update the timestamp
//       }));
//
//       setIsEditingPlanning(false);
//       alert('Planning details saved successfully!');
//     } catch (error) {
//       console.error('Error saving planning details:', error);
//       alert('Error saving planning details');
//     }
//   };
//   const renderAppointmentDetails = () => {
//     if (!isTechnischePlanning) return null;
//
//     return (
//       <div className="ts-appointmentDetails">
//         <div className="ts-planningHeader">
//           <h3>Current Appointment</h3>
//           <button
//             className="ts-editButton"
//             onClick={() => setIsEditingAppointment(!isEditingAppointment)}
//             aria-label={isEditingAppointment ? "Close editing" : "Edit appointment"}
//           >
//             {isEditingAppointment ? (
//               <svg
//                 viewBox="0 0 24 24"
//                 width="24"
//                 height="24"
//                 stroke="currentColor"
//                 strokeWidth="2"
//                 fill="none"
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//               >
//                 <line x1="18" y1="6" x2="6" y2="18"></line>
//                 <line x1="6" y1="6" x2="18" y2="18"></line>
//               </svg>
//             ) : (
//               <svg
//                 viewBox="0 0 24 24"
//                 width="24"
//                 height="24"
//                 stroke="currentColor"
//                 strokeWidth="2"
//                 fill="none"
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//               >
//                 <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
//               </svg>
//             )}
//           </button>
//         </div>
//
//         {isEditingAppointment ? (
//           <form onSubmit={handleAppointmentSubmit} className="ts-form">
//             <div className="ts-formGroup">
//               <label>Appointment Date:</label>
//               <input
//                 type="date"
//                 name="date"
//                 value={appointmentData.date}
//                 onChange={handleAppointmentChange}
//                 className="ts-input"
//                 required
//               />
//             </div>
//             <div className="ts-formGroup">
//               <label>Start Time:</label>
//               <input
//                 type="time"
//                 name="startTime"
//                 value={appointmentData.startTime}
//                 onChange={handleAppointmentChange}
//                 className="ts-input"
//                 required
//               />
//             </div>
//             <div className="ts-formGroup">
//               <label>End Time:</label>
//               <input
//                 type="time"
//                 name="endTime"
//                 value={appointmentData.endTime}
//                 onChange={handleAppointmentChange}
//                 className="ts-input"
//                 required
//               />
//             </div>
//             <div className="ts-formGroup">
//               <label>Week Number:</label>
//               <input
//                 type="number"
//                 name="weekNumber"
//                 value={appointmentData.weekNumber || ''}
//                 readOnly
//                 className="ts-input"
//               />
//             </div>
//             <button type="submit" className="ts-saveButton">
//               Save Appointment
//             </button>
//           </form>
//         ) : (
//           <div className="ts-appointmentInfo">
//             {flat.technischePlanning?.appointmentBooked?.date ? (
//               <>
//                 <p><strong>Date:</strong> {new Date(flat.technischePlanning.appointmentBooked.date).toLocaleDateString()}</p>
//                 <p><strong>Time:</strong> {flat.technischePlanning.appointmentBooked.startTime} - {flat.technischePlanning.appointmentBooked.endTime}</p>
//                 <p><strong>Week:</strong> {flat.technischePlanning.appointmentBooked.weekNumber}</p>
//               </>
//             ) : (
//               <p>No appointment scheduled</p>
//             )}
//           </div>
//         )}
//       </div>
//     );
//   };
//
//   const renderPlanningDetails = () => {
//     if (!isTechnischePlanning) return null;
//
//     return (
//       <div className="ts-planningDetails">
//         <div className="ts-planningHeader">
//           <h3>Planning Details</h3>
//           <button
//             className="ts-editButton"
//             onClick={() => setIsEditingPlanning(!isEditingPlanning)}
//             aria-label={isEditingPlanning ? "Close editing" : "Edit planning details"}
//           >
//             {isEditingPlanning ? (
//               <svg
//                 viewBox="0 0 24 24"
//                 width="24"
//                 height="24"
//                 stroke="currentColor"
//                 strokeWidth="2"
//                 fill="none"
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//               >
//                 <line x1="18" y1="6" x2="6" y2="18"></line>
//                 <line x1="6" y1="6" x2="18" y2="18"></line>
//               </svg>
//             ) : (
//               <svg
//                 viewBox="0 0 24 24"
//                 width="24"
//                 height="24"
//                 stroke="currentColor"
//                 strokeWidth="2"
//                 fill="none"
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//               >
//                 <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
//               </svg>
//             )}
//           </button>
//         </div>
//
//         {isEditingPlanning ? (
//           <form onSubmit={handleSubmit}>
//             <div className="ts-formGroup">
//               <label>VVE/WOCO Name:</label>
//               <select
//                 name="vveWocoName"
//                 value={formData.vveWocoName}
//                 onChange={handleChange}
//               >
//                 <option value="">Select...</option>
//                 <option value="VVE">VVE</option>
//                 <option value="WOCO">WOCO</option>
//                 <option value="Punt Beherder">Punt Beherder</option>
//                 <option value="VGE">VGE</option>
//                 <option value="Huurder">Huurder</option>
//               </select>
//             </div>
//
//             <div className="ts-formGroup">
//               <label>Telephone:</label>
//               <input
//                 type="text"
//                 name="telephone"
//                 value={formData.telephone}
//                 onChange={handleChange}
//               />
//             </div>
//
//             <div className="ts-formGroup">
//               <label>Technische Schouwer:</label>
//               <input
//                 type="text"
//                 name="technischeSchouwerName"
//                 value={formData.technischeSchouwerName}
//                 onChange={handleChange}
//               />
//             </div>
//
//             <div className="ts-formGroup">
//               <label>
//                 <input
//                   type="checkbox"
//                   name="readyForSchouwer"
//                   checked={formData.readyForSchouwer}
//                   onChange={handleChange}
//                 />
//                 Ready for Schouwer
//               </label>
//             </div>
//
//             <div className="ts-formGroup">
//               <label>
//                 <input
//                   type="checkbox"
//                   name="signed"
//                   checked={formData.signed}
//                   onChange={handleChange}
//                 />
//                 Signed
//               </label>
//             </div>
//
//             <div className="ts-formGroup">
//               <label>Times Called:</label>
//               <input
//                 type="number"
//                 name="timesCalled"
//                 value={formData.timesCalled}
//                 onChange={handleChange}
//                 min="0"
//               />
//             </div>
//
//             <div className="ts-formGroup">
//               <label>Additional Notes:</label>
//               <textarea
//                 name="additionalNotes"
//                 value={formData.additionalNotes}
//                 onChange={handleChange}
//               />
//             </div>
//
//             <button type="submit" className="ts-saveButton">Save</button>
//           </form>
//         ) : (
//           <div className="ts-planningInfo">
//             <p><strong>VVE/WOCO Name:</strong> {formData.vveWocoName || 'Not set'}</p>
//             <p><strong>Telephone:</strong> {formData.telephone || 'Not set'}</p>
//             <p><strong>Technische Schouwer:</strong> {formData.technischeSchouwerName || 'Not set'}</p>
//             <p><strong>Ready for Schouwer:</strong> {formData.readyForSchouwer ? 'Yes' : 'No'}</p>
//             <p><strong>Signed:</strong> {formData.signed ? 'Yes' : 'No'}</p>
//             <p><strong>Times Called:</strong> {formData.timesCalled}</p>
//             <p><strong>Additional Notes:</strong> {formData.additionalNotes || 'No notes'}</p>
//           </div>
//         )}
//       </div>
//     );
//   };
//
//   return (
//     <div className="ts-apartmentDetailsContainer">
//       <h2 className="ts-apartmentTitle">
//         {flat.adres} {flat.huisNummer}{flat.toevoeging}
//         <span className={flat.FCStatusHAS === "2" ? "greenCheckmark" : "redCheckmark"}>
//           &#10004;
//         </span>
//       </h2>
//
//       <div className="ts-columns">
//         <div className="ts-leftColumn">
//           <div className="ts-detailsGrid">
//             <div className="ts-planningHeader">
//               <h3>Flat Details</h3>
//             </div>
//             <div className="ts-detailItem">
//               <p><b>Address:</b> {flat.adres} {flat.huisNummer}{flat.toevoeging}</p>
//               <p><b>Postcode:</b> {flat.postcode}</p>
//               <p><b>Type:</b> {flat.soortBouw}</p>
//               <p><b>Complex Name:</b> {flat.complexNaam || 'N/A'}</p>
//               <p><b>Search Key:</b> {flat.zoeksleutel || 'N/A'}</p>
//             </div>
//
//             <div className="ts-statusSection">
//               <h4>Status Overview</h4>
//               <div className="ts-statusGrid">
//                 <div className={`ts-statusItem ${flat.hasTechnischeSchouwer ? 'completed' : ''}`}>
//                   Technische Schouwer
//                 </div>
//                 <div className={`ts-statusItem ${flat.hasWerkvoorbereider ? 'completed' : ''}`}>
//                   Werkvoorbereider
//                 </div>
//                 <div className={`ts-statusItem ${flat.hasHASPlanning ? 'completed' : ''}`}>
//                   HAS Planning
//                 </div>
//                 <div className={`ts-statusItem ${flat.hasHASMonteur ? 'completed' : ''}`}>
//                   HAS Monteur
//                 </div>
//               </div>
//             </div>
//
//             <div className="ts-timestamps">
//               <p><b>Created:</b> {flat.createdAt ? new Date(flat.createdAt).toLocaleString() : 'N/A'}</p>
//               <p><b>Last Updated:</b> {flat.updatedAt ? new Date(flat.updatedAt).toLocaleString() : 'N/A'}</p>
//             </div>
//           </div>
//         </div>
//
//         <div className="ts-rightColumn">
//           {renderPlanningDetails()}
//           {renderAppointmentDetails()}
//         </div>
//       </div>
//     </div>
//   );
// };
//
// export default TSPApartmentPage;