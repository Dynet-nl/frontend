// Main districts page with in-memory caching (5min expiry) and scroll position restoration. Manages district/building navigation and integrates with ImportDistrict for uploads.

import {useCallback, useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import '../styles/districtPage.css';
import ImportDistrict from '../components/ImportDistrict';
import DistrictButtons from '../components/DistrictButtons';
import BuildingsList from '../components/BuildingsList';
import {BounceLoader} from 'react-spinners';
import {DragDropContext, Droppable} from 'react-beautiful-dnd';

const cache = {
    districts: new Map(),
    buildings: new Map(),
    timestamps: new Map()
};

const CACHE_DURATION = 5 * 60 * 1000;

const isCacheValid = (key) => {
    const timestamp = cache.timestamps.get(key);
    return timestamp && (Date.now() - timestamp < CACHE_DURATION);
};

const DistrictSelectionPage = () => {
    const axiosPrivate = useAxiosPrivate();
    const {areaId} = useParams();
    const [districts, setDistricts] = useState([]);
    const [currentDistrict, setCurrentDistrict] = useState(null);
    const [buildings, setBuildings] = useState([]);
    const [isLoadingDistricts, setIsLoadingDistricts] = useState(true);
    const [isLoadingBuildings, setIsLoadingBuildings] = useState(false);

    const saveScrollPosition = useCallback(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        localStorage.setItem(`scroll_district_${areaId}`, scrollTop.toString());
    }, [areaId]);

    const restoreScrollPosition = useCallback(() => {
        const savedPosition = localStorage.getItem(`scroll_district_${areaId}`);
        if (savedPosition && savedPosition !== '0') {
            const position = parseInt(savedPosition, 10);
            if (!isNaN(position)) {
                requestAnimationFrame(() => {
                    window.scrollTo(0, position);
                    console.log(`📍 Scroll position restored: ${position}px`);
                });
            }
        }
    }, [areaId]);

    const fetchDistricts = useCallback(async () => {
        const cacheKey = `districts_${areaId}`;
        
        if (isCacheValid(cacheKey) && cache.districts.has(cacheKey)) {
            console.log('📦 Using cached districts');
            const cachedDistricts = cache.districts.get(cacheKey);
            setDistricts(cachedDistricts);
            setIsLoadingDistricts(false);
            
            if (!currentDistrict && cachedDistricts.length > 0) {
                setCurrentDistrict(cachedDistricts[0]);
            }
            return;
        }

        try {
            setIsLoadingDistricts(true);
            console.log('🌐 Fetching districts from API');
            const response = await axiosPrivate.get(`/api/district/area/${areaId}`);
            
            cache.districts.set(cacheKey, response.data);
            cache.timestamps.set(cacheKey, Date.now());
            
            setDistricts(response.data);
            
            if (!currentDistrict && response.data.length > 0) {
                setCurrentDistrict(response.data[0]);
            }
            
            console.log('✅ Districts cached and loaded');
        } catch (error) {
            console.error('Error fetching districts:', error);
        } finally {
            setIsLoadingDistricts(false);
        }
    }, [areaId, axiosPrivate, currentDistrict]);

    const fetchBuildings = useCallback(async (districtId) => {
        if (!districtId) {
            setBuildings([]);
            return;
        }

        const cacheKey = `buildings_${districtId}`;
        
        if (isCacheValid(cacheKey) && cache.buildings.has(cacheKey)) {
            console.log('📦 Using cached buildings');
            const cachedBuildings = cache.buildings.get(cacheKey);
            setBuildings(cachedBuildings);
            setIsLoadingBuildings(false);
            
            setTimeout(restoreScrollPosition, 10);
            return;
        }

        try {
            setIsLoadingBuildings(true);
            console.log('🌐 Fetching buildings from API');
            const response = await axiosPrivate.get(`/api/district/${districtId}`);
            const buildingsData = response.data.buildings || [];
            
            cache.buildings.set(cacheKey, buildingsData);
            cache.timestamps.set(cacheKey, Date.now());
            
            setBuildings(buildingsData);
            
            setTimeout(restoreScrollPosition, 50);
            
            console.log('✅ Buildings cached and loaded');
        } catch (error) {
            console.error('Error fetching buildings:', error);
            setBuildings([]);
        } finally {
            setIsLoadingBuildings(false);
        }
    }, [axiosPrivate, restoreScrollPosition]);

    useEffect(() => {
        fetchDistricts();
    }, [fetchDistricts]);

    useEffect(() => {
        if (currentDistrict?._id) {
            fetchBuildings(currentDistrict._id);
        }
    }, [currentDistrict?._id, fetchBuildings]);

    const getBuildings = useCallback(async (id) => {
        saveScrollPosition();
        
        const newDistrict = districts.find(district => district._id === id);
        if (newDistrict) {
            setCurrentDistrict(newDistrict);
        }
    }, [districts, saveScrollPosition]);

    const handleDistrictChange = useCallback(async () => {
        cache.districts.clear();
        cache.buildings.clear();
        cache.timestamps.clear();
        
        await fetchDistricts();
    }, [fetchDistricts]);

    useEffect(() => {
        const handleCacheInvalidation = () => {
            cache.buildings.clear();
            cache.timestamps.clear();
            console.log('🗑️ Buildings cache invalidated');
        };
        
        window.addEventListener('invalidate-buildings-cache', handleCacheInvalidation);
        return () => {
            window.removeEventListener('invalidate-buildings-cache', handleCacheInvalidation);
        };
    }, []);

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
            
            const cacheKey = `districts_${areaId}`;
            cache.districts.set(cacheKey, items);
            cache.timestamps.set(cacheKey, Date.now());
            
        } catch (error) {
            console.error('Failed to reorder districts', error);
            fetchDistricts();
        }
    };

    useEffect(() => {
        const handleBeforeUnload = () => {
            saveScrollPosition();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            saveScrollPosition();
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [saveScrollPosition]);

    const isLoading = isLoadingDistricts || isLoadingBuildings;

    return (
        <div className="districtPageContainer" style={{padding: '20px'}}>
            {isLoading && (
                <div style={{position: 'absolute', top: '50%', left: '50%', border: 0}}>
                    <BounceLoader color="#3498db"/>
                </div>
            )}
            <h1 style={{marginBottom: '20px'}}>Districts Page</h1>
            
            <div className="cacheStatus">
                <span>📊 Districts: {districts.length} loaded</span>
                <span>🏢 Buildings: {buildings.length} loaded</span>
                {!isLoadingDistricts && !isLoadingBuildings && (
                    <span>⚡ Cached - instant loading enabled</span>
                )}
                {isLoadingBuildings && (
                    <span className="loadingIndicator">⟳ Loading buildings...</span>
                )}
            </div>
            
            <ImportDistrict
                areaId={areaId}
                onDistrictCreated={handleDistrictChange}
                style={{marginBottom: '20px'}}
            />
            <div style={{marginTop: '20px'}}>
                <h2 style={{marginBottom: '15px'}}>Current District Name: {currentDistrict?.name || 'Loading...'}</h2>
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
                <BuildingsList buildings={buildings} isLoading={isLoadingBuildings}/>
            </div>
        </div>
    );
};

export default DistrictSelectionPage;