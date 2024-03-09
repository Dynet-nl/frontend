import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import useAxiosPrivate from '../hooks/useAxiosPrivate'
import '../styles/districtPage.css'
import ImportDistrict from '../components/ImportDistrict'
import DistrictButtons from '../components/DistrictButtons'
import BuildingsList from '../components/BuildingsList'

const DistrictPage = () => {
  const { areaId } = useParams();

  const axiosPrivate = useAxiosPrivate()
  const navigate = useNavigate()
  const location = useLocation()

  const [districts, setDistricts] = useState([])
  const [currentDistrict, setCurrentDistrict] = useState({})

  const [buildings, setBuildings] = useState([])

  const getBuildings = async (id) => {
    const response = await axiosPrivate.get(`/api/district/${id}`)
    setBuildings(response.data.buildings)
  }

  // every time we upload a new excel file, we want to initiate a request to get all cities/districts
  const [newDistrictUploaded, setNewDistrictUploaded] = useState(0)

  // let isMounted = true
  // const controller = new AbortController()

  const fetchDistricts = async () => {
    try {
      const response = await axiosPrivate.get(`/api/district/area/${areaId}`);
      const districtData = response.data; // Extract data from the response
      setDistricts(districtData);
    } catch (error) {
      console.error(error)
    }
  }
  // fetchDistricts()
  // every time we upload a new excel file, we want to initiate a request to get all cities/districts
  // set in ImportDistrict component

  useEffect(() => {
    if (areaId) {
      console.log("What is area id? ", areaId)
      fetchDistricts();
    }
  }, [axiosPrivate, areaId]);

  // we should create a custom hook that doesn't run at initial render
  // useEffect(() => {
  //   // runs only one time and only after we get all the district names,
  //   // invokes getBuildings, by default the first District in the array as an argument,
  //   // sets the name of the current District to the first District of the array as well
  //   const getDistrict = async () => {
  //     if (districts[0]) {
  //       await getBuildings(districts[0]._id)
  //       setCurrentDistrict(districts[0])
  //     }
  //   }

  //   getDistrict()
  // }, [districts])

  return (
    <div className='districtPageContainer' style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>Districts Page</h1>
      <ImportDistrict areaId={areaId} setNewDistrictUploaded={setNewDistrictUploaded} style={{ marginBottom: '20px' }} />
      <div style={{ marginTop: '20px' }}>
        <h2 style={{ marginBottom: '15px' }}>Current District Name: {currentDistrict.name}</h2>
        <DistrictButtons
          districts={districts}
          getBuildings={getBuildings}
          setCurrentDistrict={setCurrentDistrict}
          style={{ marginBottom: '15px' }}
        />
        <BuildingsList buildings={buildings} />
      </div>
    </div>
  )

}

export default DistrictPage
