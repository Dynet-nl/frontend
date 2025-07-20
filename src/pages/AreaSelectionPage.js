import React, {useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import AreaForm from '../components/AreaForm';
import useAxiosPrivate from '../hooks/useAxiosPrivate';

const AreaSelectionPage = () => {
    const {cityId} = useParams();
    const [areas, setAreas] = useState([]);
    const axiosPrivate = useAxiosPrivate();

    const fetchAreas = async () => {
        try {
            const response = await axiosPrivate.get(`/api/area/${cityId}`);
            const areasWithDistricts = response.data.map(area => ({
                ...area,
                numberOfDistricts: area.districts.length
            }));
            setAreas(areasWithDistricts);
        } catch (error) {
            console.error('Failed to fetch areas:', error);
        }
    };

    useEffect(() => {
        if (cityId) {
            fetchAreas();
        }
    }, [axiosPrivate, cityId]);

    const handleAddArea = async (newArea) => {
        try {
            const response = await axiosPrivate.post(`/api/area/${cityId}`, newArea);
            const addedArea = response.data;

            const districtsResponse = await axiosPrivate.get(`/api/district/${addedArea._id}`);
            let numberOfDistricts = 0;
            if (districtsResponse.data && Array.isArray(districtsResponse.data)) {
                numberOfDistricts = districtsResponse.data.length;
            }

            addedArea.numberOfDistricts = numberOfDistricts;

            setAreas(prevAreas => [...prevAreas, addedArea]);
        } catch (error) {
            console.error('Failed to add area:', error);
        }
    };

    const handleDeleteArea = async (areaId) => {
        try {
            await axiosPrivate.delete(`/api/area/${areaId}`);
            setAreas(areas.filter(area => area._id !== areaId));
        } catch (error) {
            console.error('Failed to delete area:', error);
        }
    };

    return (
        <div style={{padding: '20px'}}>
            <h1>Add New Area</h1>
            <AreaForm cityId={cityId} onAddArea={handleAddArea}/>
            <div>
                <h2 style={{marginBottom: '20px'}}>Existing Areas</h2>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '20px'}}>
                    {areas.map((area) => (
                        <div key={area._id} style={{
                            position: 'relative',
                            width: '200px',
                            height: '200px',
                            border: '1px solid #ccc',
                            padding: '10px',
                            borderRadius: '5px',
                            overflow: 'hidden'
                        }}>
                            <button
                                onClick={() => handleDeleteArea(area._id)}
                                style={{
                                    padding: '5px',
                                    position: 'absolute',
                                    top: '5px',
                                    right: '5px',
                                    cursor: 'pointer'
                                }}
                            >
                                X
                            </button>
                            <Link to={`/district/${area._id}`} style={{textDecoration: 'none', color: 'inherit'}}>
                                <div style={{
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    paddingTop: '90px'
                                }}>{area.name}</div>
                                <br/>
                                <div style={{textAlign: 'center'}}>Districts: {area.numberOfDistricts}</div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AreaSelectionPage;
