// Technical Planning apartment detail page with inline editing for planning details and appointments. Integrates with UnifiedAppointmentScheduler and invalidates cache on updates.

import React, {useEffect, useState} from 'react';
import {useParams, Link} from 'react-router-dom';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import '../styles/tsApartmentDetails.css';

const calculateWeekNumber = (date) => {
    const currentDate = new Date(date);
    const startDate = new Date(currentDate.getFullYear(), 0, 1);
    const days = Math.floor((currentDate - startDate) / (24 * 60 * 60 * 1000));
    return Math.ceil(days / 7);
};

const TechnicalPlanningApartmentDetailPage = () => {
    const params = useParams();
    const axiosPrivate = useAxiosPrivate();
    const [isEditingPlanning, setIsEditingPlanning] = useState(false);
    const [isEditingAppointment, setIsEditingAppointment] = useState(false);
    const [availableTechnischeSchouwers, setAvailableTechnischeSchouwers] = useState([]);

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
        hasTechnischeSchouwer: false,
        hasWerkvoorbereider: false,
        hasHASPlanning: false,
        hasHASMonteur: false,
        createdAt: null,
        updatedAt: null,
        team: '',
        ipVezelWaarde: 0,
        toelichtingStatus: '',
        odf: 0,
        odfPositie: 0,
        civielStatus: '',
        laswerkAP: '',
        laswerkDP: '',
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
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        weekNumber: calculateWeekNumber(new Date()),
        technischeSchouwerName: ''
    });

    const fetchAvailableTechnischeSchouwers = async () => {
        try {
            const response = await axiosPrivate.get('/api/users');
            const users = response.data;
            
            const technischeSchouwers = users.filter(user => 
                user.roles && typeof user.roles === 'object' && 
                user.roles.TechnischeSchouwer === 8687
            );
            
            setAvailableTechnischeSchouwers(technischeSchouwers);
        } catch (error) {
            console.error('Error fetching Technische Schouwers:', error);
        }
    };

    useEffect(() => {
        const fetchApartment = async () => {
            try {
                const {data} = await axiosPrivate.get(`/api/apartment/${params.id}`);

                const today = new Date().toISOString().split('T')[0];

                const appointmentData = data.technischePlanning?.appointmentBooked || {};
                setAppointmentData({
                    date: appointmentData.date ? new Date(appointmentData.date).toISOString().split('T')[0] : today,
                    startTime: appointmentData.startTime || '',
                    endTime: appointmentData.endTime || '',
                    weekNumber: appointmentData.date ? calculateWeekNumber(appointmentData.date) : calculateWeekNumber(today),
                    technischeSchouwerName: data.technischePlanning?.technischeSchouwerName || ''
                });

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
                    hasTechnischeSchouwer: data.technischeSchouwer?.inspection?.status === 'completed',
                    hasWerkvoorbereider: !!(data.werkvoorbereider?.planning?.materials?.length ||
                        data.werkvoorbereider?.planning?.estimatedDuration),
                    hasHASMonteur: data.hasMonteur?.installation?.status === 'completed',
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt,
                    toelichtingStatus: data.toelichtingStatus || '',
                    team: data.team,
                    IPVezelwaarde: parseFloat(data.ipVezelwaarde) || 0,
                    odf: parseFloat(data.odf) || 0,
                    odfPositie: parseFloat(data.odfPositie, 10) || 0,
                    civielStatus: data.civielStatus,
                    laswerkAP: data.laswerkAP,
                    laswerkDP: data.laswerkDP,
                    technischePlanning: data.technischePlanning || null,
                });

                if (data.technischePlanning) {
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
                        smsSent: data.technischePlanning.smsSent || false,
                    });
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchApartment();
        fetchAvailableTechnischeSchouwers();
    }, [params.id, axiosPrivate]);

    const handleChange = (e) => {
        const {name, value, type, checked} = e.target;

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
        const {name, value} = e.target;
        setAppointmentData((prevData) => ({
            ...prevData,
            [name]: value,
            weekNumber: name === 'date' ? calculateWeekNumber(value) : prevData.weekNumber
        }));
    };

    const handleAppointmentSubmit = async (e) => {
        e.preventDefault();
        try {
            await axiosPrivate.put(`/api/apartment/${params.id}/technische-planning`, {
                appointmentBooked: appointmentData,
                technischeSchouwerName: appointmentData.technischeSchouwerName
            });

            const {data} = await axiosPrivate.get(`/api/apartment/${params.id}`);
            if (data.technischePlanning?.appointmentBooked) {
                setFlat(prev => ({
                    ...prev,
                    technischePlanning: {
                        ...prev.technischePlanning,
                        appointmentBooked: data.technischePlanning.appointmentBooked
                    },
                    updatedAt: new Date().toISOString()
                }));
            }
            
            window.dispatchEvent(new CustomEvent('invalidate-buildings-cache'));
            
            setIsEditingAppointment(false);
            alert('Appointment saved successfully!');
        } catch (error) {
            console.error('Error saving appointment:', error);
            alert('Error saving appointment. Please try again.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axiosPrivate.put(`/api/apartment/${params.id}/technische-planning`, formData);

            setFlat((prevFlat) => ({
                ...prevFlat,
                technischePlanning: response.data.technischePlanning,
                updatedAt: new Date().toISOString()
            }));

            window.dispatchEvent(new CustomEvent('invalidate-buildings-cache'));

            setIsEditingPlanning(false);
            alert('Planning details saved successfully!');
        } catch (error) {
            console.error('Error saving planning details:', error);
            alert('Error saving planning details');
        }
    };

    return (
        <div className="ts-apartmentDetailsContainer">
            <h2 className="ts-apartmentTitle">
                {flat.adres} {flat.huisNummer}{flat.toevoeging}
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
                            </div>
                        </div>

                        <div className="ts-timestamps">
                            <p><b>Created:</b> {flat.createdAt ? new Date(flat.createdAt).toLocaleString() : 'N/A'}</p>
                            <p><b>Last Updated:</b> {flat.updatedAt ? new Date(flat.updatedAt).toLocaleString() : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="ts-rightColumn">
                    <div className="ts-planningDetails">
                        <div className="ts-planningHeader">
                            <h3>Planning Details</h3>
                            <button
                                className="ts-editButton"
                                onClick={() => setIsEditingPlanning(!isEditingPlanning)}
                                aria-label={isEditingPlanning ? "Close editing" : "Edit planning details"}
                            >
                                {isEditingPlanning ? (
                                    <svg
                                        viewBox="0 0 24 24"
                                        width="24"
                                        height="24"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                ) : (
                                    <svg
                                        viewBox="0 0 24 24"
                                        width="24"
                                        height="24"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                    </svg>
                                )}
                            </button>
                        </div>

                        {isEditingPlanning ? (
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
                        ) : (
                            <div className="ts-planningInfo">
                                <p><strong>VVE/WOCO Name:</strong> {formData.vveWocoName || 'Not set'}</p>
                                <p><strong>Telephone:</strong> {formData.telephone || 'Not set'}</p>
                                <p><strong>Technische Schouwer:</strong> {formData.technischeSchouwerName || 'Not set'}
                                </p>
                                <p><strong>Ready for Schouwer:</strong> {formData.readyForSchouwer ? 'Yes' : 'No'}</p>
                                <p><strong>Signed:</strong> {formData.signed ? 'Yes' : 'No'}</p>
                                <p><strong>Times Called:</strong> {formData.timesCalled}</p>
                                <p><strong>Additional Notes:</strong> {formData.additionalNotes || 'No notes'}</p>
                            </div>
                        )}
                    </div>

                    <div className="ts-appointmentDetails">
                        <div className="ts-planningHeader">
                            <h3>Appointment Details</h3>
                            <div className="ts-appointmentActions">
                                <Link 
                                    to={`/appointment-scheduler/${flat._id}?mode=single&type=Technical`}
                                    className="ts-unifiedSchedulerButton"
                                    title="Use Unified Appointment Scheduler"
                                >
                                    📅 Unified Scheduler
                                </Link>
                                <button
                                    className="ts-editButton"
                                    onClick={() => setIsEditingAppointment(!isEditingAppointment)}
                                    aria-label={isEditingAppointment ? "Close editing" : "Edit appointment"}
                                >
                                    {isEditingAppointment ? (
                                        <svg
                                            viewBox="0 0 24 24"
                                            width="24"
                                            height="24"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    ) : (
                                        <svg
                                            viewBox="0 0 24 24"
                                            width="24"
                                            height="24"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {isEditingAppointment ? (
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
                                <div className="ts-formGroup">
                                    <label>Technische Schouwer:</label>
                                    <select
                                        name="technischeSchouwerName"
                                        value={appointmentData.technischeSchouwerName}
                                        onChange={handleAppointmentChange}
                                        className="ts-input"
                                        required
                                    >
                                        <option value="">Select a Technische Schouwer</option>
                                        {availableTechnischeSchouwers.map(person => (
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
                                {flat.technischePlanning?.appointmentBooked?.date ? (
                                    <>
                                        <p>
                                            <strong>Date:</strong> {new Date(flat.technischePlanning.appointmentBooked.date).toLocaleDateString()}
                                        </p>
                                        <p>
                                            <strong>Time:</strong> {flat.technischePlanning.appointmentBooked.startTime} - {flat.technischePlanning.appointmentBooked.endTime}
                                        </p>
                                        <p><strong>Week:</strong> {flat.technischePlanning.appointmentBooked.weekNumber}
                                        </p>
                                        <p><strong>Technische Schouwer:</strong> {flat.technischePlanning.technischeSchouwerName || 'Not assigned'}</p>
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

export default TechnicalPlanningApartmentDetailPage;