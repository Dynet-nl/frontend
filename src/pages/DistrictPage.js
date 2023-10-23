import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useAxiosPrivate from '../hooks/useAxiosPrivate'
import '../styles/districtPage.css'
import ImportDistrict from '../components/ImportDistrict'
import DistrictButtons from '../components/DistrictButtons'
import BuildingsList from '../components/BuildingsList'

const DistrictPage = () => {
  // const navigate = useNavigate()

  const axiosPrivate = useAxiosPrivate()
  const navigate = useNavigate()
  const location = useLocation()

  const [districts, setDistricts] = useState([])
  const [currentDistrict, setCurrentDistrict] = useState({})

  const [buildings, setBuildings] = useState([])

  const getBuildings = async (id) => {
    const { data } = await axiosPrivate.get(`/api/district/${id}`)
    setBuildings(data.buildings)
    // console.log('currentDistrict', currentDistrict)
  }

  // every time we upload a new excel file, we want to initiate a request to get all cities/districts
  const [newDistrictUploaded, setNewDistrictUploaded] = useState(0)

  useEffect(() => {
    // let isMounted = true
    // const controller = new AbortController()

    const fetchDistricts = async () => {
      try {
        const { data } = await axiosPrivate.get(`/api/district`, {
          // signal: controller.signal,
        })
        // isMounted &&
        setDistricts(data)
        // console.log('first data', data)
      } catch (error) {
        console.error(error)
        // navigate('/login', { state: { from: location }, replace: true })
      }
    }
    fetchDistricts()

    // return () => {
    //   isMounted = false
    //   controller.abort()
    // }

    // every time we upload a new excel file, we want to initiate a request to get all cities/districts
    // set in ImportDistrict component
  }, [newDistrictUploaded])

  // we should create a custom hook that doesn't run at initial render
  useEffect(() => {
    // runs only one time and only after we get all the district names,
    // invokes getBuildings, by default the first District in the array as an argument,
    // sets the name of the current District to the first District of the array as well
    const getDistrict = async () => {
      if (districts[0]) {
        await getBuildings(districts[0]._id)
        setCurrentDistrict(districts[0])
      }
    }
    getDistrict()
  }, [districts])

  return (
    <div className='districtPageContainer'>
      <h1>Districts Page</h1>
      <ImportDistrict setNewDistrictUploaded={setNewDistrictUploaded} />
      <div>
        <h2>Current District Name: {currentDistrict.name}</h2>
        <DistrictButtons
          districts={districts}
          getBuildings={getBuildings}
          setCurrentDistrict={setCurrentDistrict}
        />
        <BuildingsList buildings={buildings} />
      </div>
    </div>
  )
}

export default DistrictPage
