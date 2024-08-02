import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import '../styles/districtPage.css';
import ImportDistrict from '../components/ImportDistrict';
import DistrictButtons from '../components/DistrictButtons';
import BuildingsList from '../components/BuildingsList';
import { BounceLoader } from 'react-spinners';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';

const DistrictPage = () => {
  const axiosPrivate = useAxiosPrivate();
  const { areaId } = useParams();

  const [isLoading, setIsLoading] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [currentDistrict, setCurrentDistrict] = useState({});
  const [buildings, setBuildings] = useState([]);
  const [newDistrictUploaded, setNewDistrictUploaded] = useState(0);

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
      console.error('Error fetching buildings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDistricts = async () => {
    try {
      const response = await axiosPrivate.get(`/api/district/area/${areaId}`);
      const districtData = response.data;
      setDistricts(districtData);
      setCurrentDistrict(districtData[0] || {});
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  useEffect(() => {
    if (areaId) {
      fetchDistricts();
    }
  }, [axiosPrivate, areaId]);

  useEffect(() => {
    const getDistrict = async () => {
      if (districts.length > 0) {
        await getBuildings(districts[0]._id);
      }
    };

    getDistrict();
  }, [districts]);

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(districts);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setDistricts(items);

    try {
      await axiosPrivate.post('/api/district/reorder', {
        districts: items.map((district, index) => ({
          id: district._id,
          priority: index + 1,
        })),
      });
    } catch (error) {
      console.error('Failed to reorder districts', error);
    }
  };

  return (
    <div className="districtPageContainer" style={{ padding: '20px' }}>
      {isLoading && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', border: 0 }}>
          <BounceLoader color="#3498db" />
        </div>
      )}
      <h1 style={{ marginBottom: '20px' }}>Districts Page</h1>
      <ImportDistrict areaId={areaId} setNewDistrictUploaded={setNewDistrictUploaded} style={{ marginBottom: '20px' }} />
      <div style={{ marginTop: '20px' }}>
        <h2 style={{ marginBottom: '15px' }}>Current District Name: {currentDistrict.name}</h2>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="districts">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                <DistrictButtons
                  districts={districts}
                  getBuildings={getBuildings}
                  setCurrentDistrict={setCurrentDistrict}
                />
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        <BuildingsList buildings={buildings} />
      </div>
    </div>
  );
};

export default DistrictPage;
