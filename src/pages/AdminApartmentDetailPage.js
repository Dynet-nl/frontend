// Admin view for detailed apartment information with full editing capabilities and comprehensive data display.

import React, {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import {saveAs} from 'file-saver';
import {createEvent} from 'ics';
import '../styles/adminApartmentDetails.css';
const AdminApartmentDetailPage = () => {
    const params = useParams();
    const axiosPrivate = useAxiosPrivate();
    const [apartment, setApartment] = useState({
        _id: '',
        zoeksleutel: '',
        complexNaam: '',
        soortBouw: '',
        adres: '',
        huisNummer: '',
        toevoeging: '',
        kamer: '',
        postcode: '',
        achternaam: '',
        tel1: '',
        tel2: '',
        eMail: '',
        toestemming: '',
        HASDatum: '',
        dagdeel: '',
        team: '',
        FCStatusHAS: '',
        IPVezelwaarde: '',
        sorAanwezig: '',
        toelichtingStatus: '',
        typeNT: '',
        civielStatus: '',
        AP: '',
        DP: '',
        laswerkAP: '',
        laswerkDP: '',
        geschouwd: '',
        schouwAkkoord: '',
        schouwDatum: '',
        opmerkingSchouwer: '',
        schouwdatum1e: '',
        schouwdatum2e: '',
        schouwdatum3e: '',
        kast: '',
        ODF: '',
        ODFPositie: '',
        TKNummer: '',
        bezoekstatusTxt: '',
        HASDatum1e: '',
        HASDatum2e: '',
        HASDatum3e: '',
        redenNA: '',
        plaats: '',
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
                const {data} = await axiosPrivate.get(`/api/apartment/${params.id}`);
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
                    toestemming: flatData.toestemming,
                    HASDatum: flatData.HASDatum,
                    dagdeel: flatData.dagdeel,
                    team: flatData.team,
                    FCStatusHAS: flatData.FCStatusHAS,
                    IPVezelwaarde: flatData.IPVezelwaarde,
                    sorAanwezig: flatData.sorAanwezig,
                    toelichtingStatus: flatData.toelichtingStatus,
                    typeNT: flatData.typeNT,
                    civielStatus: flatData.civielStatus,
                    AP: flatData.AP,
                    DP: flatData.DP,
                    laswerkAP: flatData.laswerkAP,
                    laswerkDP: flatData.laswerkDP,
                    geschouwd: flatData.geschouwd,
                    schouwAkkoord: flatData.schouwAkkoord,
                    schouwDatum: flatData.schouwDatum,
                    opmerkingSchouwer: flatData.opmerkingSchouwer,
                    schouwdatum1e: flatData.schouwdatum1e,
                    schouwdatum2e: flatData.schouwdatum2e,
                    schouwdatum3e: flatData.schouwdatum3e,
                    kast: flatData.kast,
                    ODF: flatData.ODF,
                    ODFPositie: flatData.ODFPositie,
                    TKNummer: flatData.TKNummer,
                    bezoekstatusTxt: flatData.bezoekstatusTxt,
                    HASDatum1e: flatData.HASDatum1e,
                    HASDatum2e: flatData.HASDatum2e,
                    HASDatum3e: flatData.HASDatum3e,
                    redenNA: flatData.redenNA,
                    plaats: flatData.plaats,
                    telephone: flatData.technischePlanning?.telephone || '',
                    vveWocoName: flatData.technischePlanning?.vveWocoName || '',
                    technischeSchouwerName: flatData.technischePlanning?.technischeSchouwerName || '',
                    readyForSchouwer: flatData.technischePlanning?.readyForSchouwer || false,
                    signed: flatData.technischePlanning?.signed || false,
                    calledAlready: flatData.technischePlanning?.calledAlready || false,
                    timesCalled: flatData.technischePlanning?.timesCalled || 0,
                    appointmentDate: flatData.technischePlanning?.appointmentBooked?.date || '',
                    appointmentStartTime: flatData.technischePlanning?.appointmentBooked?.startTime || '',
                    appointmentEndTime: flatData.technischePlanning?.appointmentBooked?.endTime || '',
                    appointmentWeekNumber: flatData.technischePlanning?.appointmentBooked?.weekNumber || '',
                    additionalNotes: flatData.technischePlanning?.additionalNotes || '',
                    smsSent: flatData.technischePlanning?.smsSent || false,
                });
            } catch (error) {
                console.error("Failed to fetch apartment details:", error);
            }
        };
        fetchApartment();
    }, [axiosPrivate, params.id]);
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
    const handleExportToICS = () => {
        if (!apartment.appointmentDate || !apartment.appointmentStartTime) {
            console.error("Appointment date or start time is missing");
            return;
        }
        const startDate = apartment.appointmentDate.split('-');
        const startTime = apartment.appointmentStartTime.split(':');
        if (startDate.length !== 3 || startTime.length !== 2) {
            console.error("Invalid date or time format");
            return;
        }
        const event = {
            start: [
                parseInt(startDate[0], 10),
                parseInt(startDate[1], 10),
                parseInt(startDate[2], 10),
                parseInt(startTime[0], 10),
                parseInt(startTime[1], 10)
            ],
            duration: {hours: 1, minutes: 0},
            title: 'Appointment',
            description: apartment.additionalNotes || 'Appointment for the apartment.',
            location: `${apartment.adres} ${apartment.huisNummer}${apartment.toevoeging}`,
            status: 'CONFIRMED',
            busyStatus: 'BUSY',
            organizer: {name: 'Organizer', email: apartment.eMail},
            attendees: [{name: apartment.achternaam, email: apartment.eMail}]
        };
        createEvent(event, (error, value) => {
            if (error) {
                console.error('Error creating calendar event:', error);
                return;
            }
            const blob = new Blob([value], {type: 'text/calendar;charset=utf-8'});
            saveAs(blob, 'appointment.ics');
        });
    };
    const leftColumnFields = [
        'zoeksleutel', 'complexNaam', 'soortBouw', 'adres', 'huisNummer',
        'toevoeging', 'kamer', 'postcode', 'achternaam', 'tel1',
        'tel2', 'eMail', 'toestemming', 'HASDatum', 'dagdeel',
        'team', 'FCStatusHAS', 'IPVezelwaarde', 'sorAanwezig', 'toelichtingStatus',
        'typeNT', 'civielStatus', 'AP', 'DP', 'laswerkAP'
    ];
    const rightColumnFields = [
        'laswerkDP', 'geschouwd', 'schouwAkkoord', 'schouwDatum', 'opmerkingSchouwer',
        'schouwdatum1e', 'schouwdatum2e', 'schouwdatum3e', 'kast', 'ODF',
        'ODFPositie', 'TKNummer', 'bezoekstatusTxt', 'HASDatum1e', 'HASDatum2e',
        'HASDatum3e', 'redenNA', 'plaats', 'telephone', 'vveWocoName',
        'technischeSchouwerName', 'readyForSchouwer', 'signed', 'calledAlready',
        'timesCalled', 'appointmentDate', 'appointmentStartTime', 'appointmentEndTime',
        'appointmentWeekNumber', 'additionalNotes', 'smsSent'
    ];
    return (
        <div className="apartmentDetailsContainer">
            <h2 className="apartmentTitle">
                {apartment.adres} {apartment.huisNummer}{apartment.toevoeging} {checkmark}
            </h2>
            <div className="columns">
                <div className="leftColumn">
                    {leftColumnFields.map((key) => {
                        if (!apartment[key] && apartment[key] !== false && apartment[key] !== 0) return null;
                        let formattedValue = apartment[key];
                        if (key === 'HASDatum' || key.includes('Datum')) {
                            formattedValue = new Date(formattedValue).toLocaleDateString();
                        } else if (typeof formattedValue === 'boolean') {
                            formattedValue = formattedValue ? 'Yes' : 'No';
                        }
                        return (
                            <p key={key}><b>{formatFieldName(key)}:</b> {formattedValue}</p>
                        );
                    })}
                </div>
                <div className="rightColumn">
                    {rightColumnFields.map((key) => {
                        if (!apartment[key] && apartment[key] !== false && apartment[key] !== 0) return null;
                        let formattedValue = apartment[key];
                        if (key === 'HASDatum' || key.includes('Datum')) {
                            formattedValue = new Date(formattedValue).toLocaleDateString();
                        } else if (typeof formattedValue === 'boolean') {
                            formattedValue = formattedValue ? 'Yes' : 'No';
                        }
                        return (
                            <p key={key}><b>{formatFieldName(key)}:</b> {formattedValue}</p>
                        );
                    })}
                </div>
            </div>
            <button className="exportButton" onClick={handleExportToICS}>Export to Google Calendar</button>
        </div>
    );
}
export default AdminApartmentDetailPage;
