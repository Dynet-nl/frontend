// HAS Planning apartment detail page with inline editing for installation details and appointments. Integrates with UnifiedAppointmentScheduler and invalidates cache on updates.

import React, {useEffect, useState} from 'react';
import {useParams, Link} from 'react-router-dom';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import useAuth from '../hooks/useAuth';
import '../styles/tsApartmentDetails.css';

const calculateWeekNumber = (date) => {
    const currentDate = new Date(date);
    const startDate = new Date(currentDate.getFullYear(), 0, 1);
    const days = Math.floor((currentDate - startDate) / (24 * 60 * 60 * 1000));
    return Math.ceil(days / 7);
};

const HASPlanningApartmentDetailPage = () => {
    const params = useParams();
    const axiosPrivate = useAxiosPrivate();
    const {auth} = useAuth();

    const hasHASPlanningRole = auth?.roles?.includes(1959);

    const [isEditingHASAppointment, setIsEditingHASAppointment] = useState(false);
    const [availableHASMonteurs, setAvailableHASMonteurs] = useState([]);
    const [hasAppointmentData, setHASAppointmentData] = useState({
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        weekNumber: calculateWeekNumber(new Date()),
        type: 'HAS',
        hasMonteurName: ''
    });

    const [flat, setFlat] = useState({
        _id: '',
        zoeksleutel: '',
        soortBouw: '',
        adres: '',
        huisNummer: '',
        toevoeging: '',
        postcode: '',
        fcStatusHas: '',
        complexNaam: '',
        hasHASMonteur: false,
        createdAt: null,
        updatedAt: null,
        team: '',
        toelichtingStatus: '',
        hasMonteur: null,
        ipVezelwaarde: '',
        laswerkAP: '',
        laswerkDP: '',
        ap: '',
        dp: '',
        odf: '',
        odfPositie: '',
    });

    const fetchAvailableHASMonteurs = async () => {
        try {
            const response = await axiosPrivate.get('/api/users');
            const users = response.data;
            
            const hasMonteurs = users.filter(user => 
                user.roles && typeof user.roles === 'object' && 
                user.roles.HASMonteur === 2023
            );
            
            setAvailableHASMonteurs(hasMonteurs);
        } catch (error) {
            console.error('Error fetching HAS Monteurs:', error);
        }
    };

    useEffect(() => {
        const fetchApartment = async () => {
            try {
                const {data} = await axiosPrivate.get(`/api/apartment/${params.id}`);

                const today = new Date().toISOString().split('T')[0];

                setFlat({
                    _id: data._id,
                    zoeksleutel: data.zoeksleutel,
                    soortBouw: data.soortBouw,
                    adres: data.adres,
                    huisNummer: data.huisNummer,
                    toevoeging: data.toevoeging,
                    postcode: data.postcode,
                    fcStatusHas: data.fcStatusHas,
                    complexNaam: data.complexNaam,
                    hasHASMonteur: data.hasMonteur?.installation?.status === 'completed',
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt,
                    toelichtingStatus: data.toelichtingStatus || '',
                    team: data.team,
                    hasMonteur: data.hasMonteur || null,
                    ipVezelwaarde: data.ipVezelwaarde || '',
                    laswerkAP: data.laswerkAP || '',
                    laswerkDP: data.laswerkDP || '',
                    ap: data.ap || '',
                    dp: data.dp || '',
                    odf: data.odf || '',
                    odfPositie: data.odfPositie || '',
                });

                const hasAppointment = data.hasMonteur?.appointmentBooked || {};
                setHASAppointmentData({
                    date: hasAppointment.date ? new Date(hasAppointment.date).toISOString().split('T')[0] : today,
                    startTime: hasAppointment.startTime || '',
                    endTime: hasAppointment.endTime || '',
                    weekNumber: hasAppointment.date ? calculateWeekNumber(hasAppointment.date) : calculateWeekNumber(today),
                    type: hasAppointment.type || 'HAS',
                    hasMonteurName: data.hasMonteur?.hasMonteurName || ''
                });
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchApartment();
        fetchAvailableHASMonteurs();
    }, [params.id, axiosPrivate]);

    const handleHASAppointmentChange = (e) => {
        const {name, value} = e.target;
        setHASAppointmentData((prevData) => ({
            ...prevData,
            [name]: value,
            weekNumber: name === 'date' ? calculateWeekNumber(value) : prevData.weekNumber
        }));
    };

    const handleHASAppointmentSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axiosPrivate.put(`/api/apartment/${params.id}/has-monteur`, {
                appointmentBooked: {
                    date: hasAppointmentData.date,
                    startTime: hasAppointmentData.startTime,
                    endTime: hasAppointmentData.endTime,
                    weekNumber: hasAppointmentData.weekNumber,
                    type: hasAppointmentData.type
                },
                hasMonteurName: hasAppointmentData.hasMonteurName
            });

            if (response.data) {
                setFlat(response.data);

                if (response.data.hasMonteur?.appointmentBooked) {
                    setHASAppointmentData({
                        date: new Date(response.data.hasMonteur.appointmentBooked.date).toISOString().split('T')[0],
                        startTime: response.data.hasMonteur.appointmentBooked.startTime,
                        endTime: response.data.hasMonteur.appointmentBooked.endTime,
                        weekNumber: response.data.hasMonteur.appointmentBooked.weekNumber,
                        type: response.data.hasMonteur.appointmentBooked.type || 'HAS'
                    });
                }
            }

            setIsEditingHASAppointment(false);
            
            window.dispatchEvent(new CustomEvent('invalidate-buildings-cache'));
            
            alert('HAS Monteur appointment saved successfully!');
        } catch (error) {
            console.error('Error saving HAS Monteur appointment:', error);
            alert('Error saving appointment. Please try again.');
        }
    };

    return (
        <div className="ts-apartmentDetailsContainer">
            <h2 className="ts-apartmentTitle">
                {flat.adres} {flat.huisNummer}{flat.toevoeging}
                <span className={flat.fcStatusHas === "2" ? "greenCheckmark" : "redCheckmark"}>
                    &#10004;
                </span>
            </h2>

            <div className="ts-columns">
                <div className="ts-leftColumn">
                    <div className="ts-detailsGrid">
                        <div className="ts-planningHeader">
                            <h3>Flat Details</h3>
                        </div>
                        <div className="ts-detailItem">
                            <p><b>Address:</b> {flat.adres} {flat.huisNummer}{flat.toevoeging}</p>
                            <p><b>Postcode:</b> {flat.postcode}</p>
                            <p><b>Type:</b> {flat.soortBouw}</p>
                            <p><b>Complex Name:</b> {flat.complexNaam || 'N/A'}</p>
                            <p><b>Search Key:</b> {flat.zoeksleutel || 'N/A'}</p>
                            <p><b>Team:</b> {flat.team || 'N/A'}</p>
                            <p><b>Status HAS:</b>
                                <span
                                    className={flat.fcStatusHas === "2" ? "greenCheckmark" : "redCheckmark"}>&#10004;</span>
                            </p>
                            <p><b>Toelichting Status:</b> {flat.toelichtingStatus || 'N/A'}</p>
                            <p><b>IP Vezelwaarde:</b> {flat.ipVezelwaarde || 'N/A'}</p>
                            <p><b>Laswerk AP:</b> {flat.laswerkAP || 'N/A'}</p>
                            <p><b>Laswerk DP:</b> {flat.laswerkDP || 'N/A'}</p>
                            <p><b>AP:</b> {flat.ap || 'N/A'}</p>
                            <p><b>DP:</b> {flat.dp || 'N/A'}</p>
                            <p><b>ODF:</b> {flat.odf || 'N/A'}</p>
                            <p><b>ODF Positie:</b> {flat.odfPositie || 'N/A'}</p>
                        </div>

                        <div className="ts-timestamps">
                            <p><b>Created:</b> {flat.createdAt ? new Date(flat.createdAt).toLocaleString() : 'N/A'}</p>
                            <p><b>Last Updated:</b> {flat.updatedAt ? new Date(flat.updatedAt).toLocaleString() : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="ts-rightColumn">
                    <div className="ts-appointmentDetails">
                        <div className="ts-planningHeader">
                            <h3>HAS Monteur Appointment</h3>
                            <div className="ts-appointmentActions">
                                {hasHASPlanningRole && (
                                    <Link 
                                        to={`/has-appointment-scheduler/${flat._id}?mode=single&type=HAS`}
                                        className="ts-unifiedSchedulerButton"
                                        title="Use Unified Appointment Scheduler"
                                    >
                                        📅 Unified Scheduler
                                    </Link>
                                )}
                                {hasHASPlanningRole && (
                                    <button
                                        className="ts-editButton"
                                        onClick={() => setIsEditingHASAppointment(!isEditingHASAppointment)}
                                        aria-label={isEditingHASAppointment ? "Close editing" : "Edit HAS Monteur appointment"}
                                    >
                                        {isEditingHASAppointment ? (
                                            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor"
                                                 strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        ) : (
                                            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor"
                                                 strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                            </svg>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {isEditingHASAppointment && hasHASPlanningRole ? (
                            <form onSubmit={handleHASAppointmentSubmit} className="ts-form">
                                <div className="ts-formGroup">
                                    <label>Appointment Type:</label>
                                    <div className="ts-radioGroup">
                                        <label>
                                            <input
                                                type="radio"
                                                name="type"
                                                value="HAS"
                                                checked={hasAppointmentData.type === 'HAS'}
                                                onChange={handleHASAppointmentChange}
                                            />
                                            HAS
                                        </label>
                                        <label>
                                            <input
                                                type="radio"
                                                name="type"
                                                value="Storing"
                                                checked={hasAppointmentData.type === 'Storing'}
                                                onChange={handleHASAppointmentChange}
                                            />
                                            Storing
                                        </label>
                                    </div>
                                </div>
                                <div className="ts-formGroup">
                                    <label>Appointment Date:</label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={hasAppointmentData.date}
                                        onChange={handleHASAppointmentChange}
                                        className="ts-input"
                                        required
                                    />
                                </div>
                                <div className="ts-formGroup">
                                    <label>Start Time:</label>
                                    <input
                                        type="time"
                                        name="startTime"
                                        value={hasAppointmentData.startTime}
                                        onChange={handleHASAppointmentChange}
                                        className="ts-input"
                                        required
                                    />
                                </div>
                                <div className="ts-formGroup">
                                    <label>End Time:</label>
                                    <input
                                        type="time"
                                        name="endTime"
                                        value={hasAppointmentData.endTime}
                                        onChange={handleHASAppointmentChange}
                                        className="ts-input"
                                        required
                                    />
                                </div>
                                <div className="ts-formGroup">
                                    <label>Week Number:</label>
                                    <input
                                        type="number"
                                        name="weekNumber"
                                        value={hasAppointmentData.weekNumber || ''}
                                        readOnly
                                        className="ts-input"
                                    />
                                </div>
                                <div className="ts-formGroup">
                                    <label>HAS Monteur:</label>
                                    <select
                                        name="hasMonteurName"
                                        value={hasAppointmentData.hasMonteurName}
                                        onChange={handleHASAppointmentChange}
                                        className="ts-input"
                                        required
                                    >
                                        <option value="">Select a HAS Monteur</option>
                                        {availableHASMonteurs.map(person => (
                                            <option key={person._id} value={person.name}>
                                                {person.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button type="submit" className="ts-saveButton">
                                    Save Appointment
                                </button>
                            </form>
                        ) : (
                            <div className="ts-appointmentInfo">
                                {flat.hasMonteur?.appointmentBooked?.date ? (
                                    <>
                                        <p><strong>Appointment Type:</strong> {flat.hasMonteur.appointmentBooked.type}
                                        </p>
                                        <p>
                                            <strong>Date:</strong> {new Date(flat.hasMonteur.appointmentBooked.date).toLocaleDateString()}
                                        </p>
                                        <p>
                                            <strong>Time:</strong> {flat.hasMonteur.appointmentBooked.startTime} - {flat.hasMonteur.appointmentBooked.endTime}
                                        </p>
                                        <p><strong>Week:</strong> {flat.hasMonteur.appointmentBooked.weekNumber}</p>
                                        <p><strong>HAS Monteur:</strong> {flat.hasMonteur.hasMonteurName || 'Not assigned'}</p>
                                    </>
                                ) : (
                                    <p>No appointment scheduled</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HASPlanningApartmentDetailPage;