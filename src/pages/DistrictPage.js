import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import useAxiosPrivate from '../hooks/useAxiosPrivate'
import '../styles/districtPage.css'
import ImportDistrict from '../components/ImportDistrict'
import DistrictButtons from '../components/DistrictButtons'
import BuildingsList from '../components/BuildingsList'
import { BounceLoader } from 'react-spinners';

const DistrictPage = () => {
  const axiosPrivate = useAxiosPrivate()

  const [isLoading, setIsLoading] = useState(false);

  const { areaId } = useParams();

  const [districts, setDistricts] = useState([])
  const [currentDistrict, setCurrentDistrict] = useState({})
  const [buildings, setBuildings] = useState([])

  const [newDistrictUploaded, setNewDistrictUploaded] = useState(0)

  const getBuildings = async (id) => {
    setIsLoading(true);
    try {
      const cachedBuildings = sessionStorage.getItem(`buildingsData_${id}`);
      let buildingsData;
      if (cachedBuildings) {
        buildingsData = JSON.parse(cachedBuildings);
      } else {
        const response = await axiosPrivate.get(`/api/district/${id}`);
        buildingsData = response.data.buildings;
        sessionStorage.setItem(`buildingsData_${id}`, JSON.stringify(buildingsData));
      }
      setBuildings(buildingsData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDistricts = async () => {
    try {
      const response = await axiosPrivate.get(`/api/district/area/${areaId}`);
      const districtData = response.data;
      setDistricts(districtData);
      setCurrentDistrict(districtData[0])
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (areaId) {
      fetchDistricts();
    }
  }, [axiosPrivate, areaId]);

  useEffect(() => {
    const getDistrict = async () => {
      if (districts[0]) {
        await getBuildings(districts[0]._id)
      }
    }

    getDistrict()
  }, [districts])

  return (
    <div className='districtPageContainer' style={{ padding: '20px' }}>
      {isLoading && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', border: 0 }}>
          <BounceLoader color="#3498db" />
        </div>
      )}
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
