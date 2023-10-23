import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

const ApartmentPage = () => {
  const params = useParams()

  const [apartment, setApartment] = useState({
    _id: '',
    zoeksleutel: '',
    soortBouw: '',
    adres: '',
    huisNummer: '',
    kamer: '',
    toevoeging: '',
    postcode: '',
    achternaam: '',
    stijgpunt: '',
  })

  useEffect(() => {
    console.log('params.id', params.id)
    const fetchApartment = async () => {
      const config = {
        method: 'GET',
      }

      const { data } = await axios.get(`/api/apartment/${params.id}`, config)

      console.log('data', data)
      setApartment({
        _id: data[0]._id,
        zoeksleutel: data[0].zoeksleutel,
        soortBouw: data[0].soortBouw,
        adres: data[0].adres,
        huisNummer: data[0].huisNummer,
        kamer: data[0].kamer,
        toevoeging: data[0].toevoeging,
        postcode: data[0].postcode,
        achternaam: data[0].achternaam,
        stijgpunt: data[0].stijgpunt,
      })
    }

    fetchApartment()
  }, [params.id])

  const updateApartment = async () => {
    const config = {
      method: 'PUT',
    }

    await axios.put(`/api/apartment/${params.id}`, apartment, config)

    console.log('update?')
  }

  return (
    <div>
      <h1>Apartment Page</h1>
      <h3>{apartment.zoeksleutel}</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          updateApartment()
        }}
      >
        <label>Stijgpunt: </label>
        <input
          value={apartment.stijgpunt}
          onChange={(e) => {
            setApartment({ ...apartment, stijgpunt: e.target.value })
          }}
        />
        <button type="Submit">Change</button>
      </form>
    </div>
  )
}

export default ApartmentPage
