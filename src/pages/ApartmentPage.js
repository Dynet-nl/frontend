import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import '../styles/apartmentDetails.css';

const ApartmentPage = () => {
  const params = useParams()
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
  });


  useEffect(() => {
    const fetchApartment = async () => {
      try {
        const { data } = await axiosPrivate.get(`/api/apartment/${params.id}`);
        const flatData = data;

        console.log("apartment is ", data)
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
        });
      } catch (error) {
        console.error("Failed to fetch apartment details:", error);
      }
    };

    fetchApartment();
  }, [axiosPrivate, params.id]);

  const updateApartment = async () => {

    await axiosPrivate.put(`/api/apartment/${params.id}`, apartment)

    console.log(apartment)
  }

  const formatFieldName = (fieldName) => {
    return fieldName
      .replace(/([a-zA-Z])(\d+)/g, '$1 $2')
      .replace(/(\d+)([a-zA-Z])/g, '$1 $2')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const checkmark = apartment.FCStatusHAS === "2" ? (
    <span className="checkmark">&#10004;</span> // Unicode checkmark character
  ) : null;

  return (
    <div className="apartmentDetailsContainer">
      <h2 className="apartmentTitle">
        {apartment.adres} {apartment.huisNummer}{apartment.toevoeging} {checkmark}
      </h2>
      <div className="apartmentInfo">
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
    </div>
  );
}

export default ApartmentPage
