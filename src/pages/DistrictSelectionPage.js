// Main districts page with in-memory caching (5min expiry) and scroll position restoration. Manages district/building navigation and integrates with ImportDistrict for uploads.

import {useCallback, useEffect, useState} from 'react';
import {useParams, Link} from 'react-router-dom';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import useAuth from '../hooks/useAuth';
import '../styles/districtPage.css';
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
    const { auth } = useAuth();
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
                });
            }
        }
    }, [areaId]);

    const fetchDistricts = useCallback(async () => {
        const cacheKey = `districts_${areaId}`;
        
        if (isCacheValid(cacheKey) && cache.districts.has(cacheKey)) {
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
            const response = await axiosPrivate.get(`/api/district/area/${areaId}`);
            
            cache.districts.set(cacheKey, response.data);
            cache.timestamps.set(cacheKey, Date.now());
            
            setDistricts(response.data);
            
            if (!currentDistrict && response.data.length > 0) {
                setCurrentDistrict(response.data[0]);
            }
            
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
            const cachedBuildings = cache.buildings.get(cacheKey);
            setBuildings(cachedBuildings);
            setIsLoadingBuildings(false);
            
            setTimeout(restoreScrollPosition, 10);
            return;
        }

        try {
            setIsLoadingBuildings(true);
            const response = await axiosPrivate.get(`/api/district/${districtId}`);
            const buildingsData = response.data.buildings || [];
            
            cache.buildings.set(cacheKey, buildingsData);
            cache.timestamps.set(cacheKey, Date.now());
            
            setBuildings(buildingsData);
            
            setTimeout(restoreScrollPosition, 50);
            
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

    useEffect(() => {
        const handleCacheInvalidation = () => {
            cache.buildings.clear();
            cache.timestamps.clear();
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
            
            {/* Modern District Management Section */}
            <div className="modern-card" style={{marginBottom: '32px'}}>
                <div className="modern-card-header">
                    <h2 className="modern-card-title">
                        <span style={{fontSize: '20px', marginRight: '8px'}}>📁</span>
                        District Management
                    </h2>
                </div>
                <div className="modern-card-body">
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: auth?.roles?.includes(5150) ? 'repeat(auto-fit, minmax(250px, 1fr))' : '1fr',
                        gap: '20px',
                        alignItems: 'start'
                    }}>
                        {/* Enhanced District Management - Available for Admins */}
                        {auth?.roles?.includes(5150) && (
                            <div className="modern-action-card">
                                <div className="modern-action-card-icon" style={{backgroundColor: '#e8f5e8'}}>
                                    🚀
                                </div>
                                <h3 className="modern-action-card-title">Enhanced Management</h3>
                                <p className="modern-action-card-description">
                                    Advanced file validation, preview, conflict detection, and batch import features.
                                </p>
                                <div className="modern-action-card-features">
                                    <div className="modern-feature-tag">✅ File Validation</div>
                                    <div className="modern-feature-tag">🔍 Data Preview</div>
                                    <div className="modern-feature-tag">⚠️ Conflict Detection</div>
                                    <div className="modern-feature-tag">📊 Import History</div>
                                </div>
                                <Link 
                                    to={`/district-management/${areaId}`}
                                    className="modern-button modern-button-primary"
                                    style={{width: '100%', justifyContent: 'center'}}
                                >
                                    Open Enhanced Manager
                                </Link>
                            </div>
                        )}
                        
                        {/* Quick Actions - Available for All Users */}
                        <div className="modern-action-card">
                            <div className="modern-action-card-icon" style={{backgroundColor: '#e8f4fd'}}>
                                📋
                            </div>
                            <h3 className="modern-action-card-title">Quick Actions</h3>
                            <p className="modern-action-card-description">
                                {districts.length === 0 
                                    ? "No districts found. Use the enhanced manager to create your first district."
                                    : `Manage ${districts.length} district${districts.length !== 1 ? 's' : ''} with drag & drop reordering.`
                                }
                            </p>
                            <div className="modern-action-card-stats">
                                <div className="modern-stat-item">
                                    <span className="modern-stat-number">{districts.length}</span>
                                    <span className="modern-stat-label">Districts</span>
                                </div>
                                <div className="modern-stat-item">
                                    <span className="modern-stat-number">{buildings.length}</span>
                                    <span className="modern-stat-label">Buildings</span>
                                </div>
                            </div>
                            {auth?.roles?.includes(5150) ? (
                                <div className="modern-info-note">
                                    💡 As an admin, you have access to enhanced management features above.
                                </div>
                            ) : (
                                <div className="modern-info-note">
                                    ℹ️ Contact your administrator to create or import new districts.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
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