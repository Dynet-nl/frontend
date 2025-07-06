import {useCallback, useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import '../styles/districtPage.css';
import ImportDistrict from '../components/ImportDistrict';
import DistrictButtons from '../components/DistrictButtons';
import BuildingsList from '../components/BuildingsList';
import {BounceLoader} from 'react-spinners';
import {DragDropContext, Droppable} from 'react-beautiful-dnd';

const DistrictPage = () => {
    const axiosPrivate = useAxiosPrivate();
    const {areaId} = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const [districts, setDistricts] = useState([]);
    const [currentDistrict, setCurrentDistrict] = useState({});
    const [buildings, setBuildings] = useState([]);
    const [newDistrictUploaded, setNewDistrictUploaded] = useState(0);

    const getBuildings = useCallback(async (id) => {
        setIsLoading(true);
        try {
            const response = await axiosPrivate.get(`/api/district/${id}`);
            const buildingsData = response.data.buildings;
            setBuildings(buildingsData);
        } catch (error) {
            console.error('Error fetching buildings:', error);
        } finally {
            setIsLoading(false);
        }
    }, [axiosPrivate]);

    const fetchDistricts = useCallback(async () => {
        try {
            const response = await axiosPrivate.get(`/api/district/area/${areaId}`);
            const districtData = response.data;
            setDistricts(districtData);

            
            if (!currentDistrict?._id || districtData[0]?._id !== currentDistrict._id) {
                setCurrentDistrict(districtData[0] || {});
            }
        } catch (error) {
            console.error('Error fetching districts:', error);
        }
    }, [axiosPrivate, areaId, currentDistrict?._id]);

    
    const handleDistrictChange = useCallback(async () => {
        await fetchDistricts();
        if (currentDistrict?._id) {
            await getBuildings(currentDistrict._id);
        }
    }, [fetchDistricts, getBuildings, currentDistrict?._id]);

    useEffect(() => {
        if (areaId) {
            fetchDistricts();
        }
    }, [areaId, fetchDistricts]);

    useEffect(() => {
        if (currentDistrict?._id) {
            getBuildings(currentDistrict._id);
        }
    }, [currentDistrict?._id, getBuildings]);

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
        <div className="districtPageContainer" style={{padding: '20px'}}>
            {isLoading && (
                <div style={{position: 'absolute', top: '50%', left: '50%', border: 0}}>
                    <BounceLoader color="#3498db"/>
                </div>
            )}
            <h1 style={{marginBottom: '20px'}}>Districts Page</h1>
            <ImportDistrict
                areaId={areaId}
                setNewDistrictUploaded={setNewDistrictUploaded}
                onDistrictCreated={handleDistrictChange}
                style={{marginBottom: '20px'}}
            />
            <div style={{marginTop: '20px'}}>
                <h2 style={{marginBottom: '15px'}}>Current District Name: {currentDistrict.name}</h2>
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
                <BuildingsList buildings={buildings}/>
            </div>
        </div>
    );
};

export default DistrictPage;