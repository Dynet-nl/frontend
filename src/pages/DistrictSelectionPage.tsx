// Page for selecting districts within an area for navigation and organization.

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import logger from '../utils/logger';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import useAuth from '../hooks/useAuth';
import '../styles/districtPage.css';
import DistrictButtons from '../components/DistrictButtons';
import BuildingsList from '../components/BuildingsList';
import LoadingSpinner from '../components/LoadingSpinner';
import Breadcrumb from '../components/Breadcrumb';
import { useError } from '../context/ErrorProvider';
import { DragDropContext, Droppable, DropResult, DroppableProvided } from 'react-beautiful-dnd';
import { ROLES } from '../utils/constants';

interface District {
    _id: string;
    name: string;
    priority?: number;
}

interface Building {
    _id: string;
    address?: string;
    name?: string;
}

interface CacheData {
    districts: Map<string, District[]>;
    buildings: Map<string, Building[]>;
    timestamps: Map<string, number>;
}

const cache: CacheData = {
    districts: new Map(),
    buildings: new Map(),
    timestamps: new Map(),
};

const CACHE_DURATION = 5 * 60 * 1000;

const isCacheValid = (key: string): boolean => {
    const timestamp = cache.timestamps.get(key);
    return Boolean(timestamp && Date.now() - timestamp < CACHE_DURATION);
};

const DistrictSelectionPage: React.FC = () => {
    const axiosPrivate = useAxiosPrivate();
    const { auth } = useAuth();
    const { areaId } = useParams<{ areaId: string }>();
    const { handleApiError } = useError();

    const [districts, setDistricts] = useState<District[]>([]);
    const [currentDistrict, setCurrentDistrict] = useState<District | null>(null);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [isLoadingDistricts, setIsLoadingDistricts] = useState<boolean>(true);
    const [isLoadingBuildings, setIsLoadingBuildings] = useState<boolean>(false);
    const [areaName, setAreaName] = useState<string>('');

    const saveScrollPosition = useCallback((): void => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        localStorage.setItem(`scroll_district_${areaId}`, scrollTop.toString());
    }, [areaId]);

    const saveCurrentDistrict = useCallback(
        (district: District): void => {
            if (district?._id) {
                localStorage.setItem(`currentDistrict_${areaId}`, district._id);
            }
        },
        [areaId]
    );

    const restoreCurrentDistrict = useCallback(
        (districtList: District[]): District => {
            const savedDistrictId = localStorage.getItem(`currentDistrict_${areaId}`);
            if (savedDistrictId && districtList.length > 0) {
                const savedDistrict = districtList.find((d) => d._id === savedDistrictId);
                if (savedDistrict) {
                    return savedDistrict;
                }
            }
            return districtList[0];
        },
        [areaId]
    );

    const restoreScrollPosition = useCallback((): void => {
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

    const fetchDistricts = useCallback(async (): Promise<void> => {
        const cacheKey = `districts_${areaId}`;
        if (isCacheValid(cacheKey) && cache.districts.has(cacheKey)) {
            const cachedDistricts = cache.districts.get(cacheKey)!;
            setDistricts(cachedDistricts);
            setIsLoadingDistricts(false);
            if (!currentDistrict && cachedDistricts.length > 0) {
                const restoredDistrict = restoreCurrentDistrict(cachedDistricts);
                setCurrentDistrict(restoredDistrict);
            }
            return;
        }
        try {
            setIsLoadingDistricts(true);
            const response = await axiosPrivate.get<{ data: District[]; pagination?: unknown } | District[]>(`/api/district/area/${areaId}`);
            // Handle both paginated response { data: [...] } and legacy array response
            const districtsData = Array.isArray(response.data) ? response.data : response.data.data;
            cache.districts.set(cacheKey, districtsData);
            cache.timestamps.set(cacheKey, Date.now());
            setDistricts(districtsData);
            if (!currentDistrict && districtsData.length > 0) {
                const restoredDistrict = restoreCurrentDistrict(districtsData);
                setCurrentDistrict(restoredDistrict);
            }
        } catch (error) {
            logger.error('Error fetching districts:', error);
            handleApiError(error, 'Failed to load districts.');
        } finally {
            setIsLoadingDistricts(false);
        }
    }, [areaId, axiosPrivate, currentDistrict, restoreCurrentDistrict]);

    const fetchBuildings = useCallback(
        async (districtId: string): Promise<void> => {
            if (!districtId) {
                setBuildings([]);
                return;
            }
            const cacheKey = `buildings_${districtId}`;
            if (isCacheValid(cacheKey) && cache.buildings.has(cacheKey)) {
                const cachedBuildings = cache.buildings.get(cacheKey)!;
                setBuildings(cachedBuildings);
                setIsLoadingBuildings(false);
                setTimeout(restoreScrollPosition, 10);
                return;
            }
            try {
                setIsLoadingBuildings(true);
                const response = await axiosPrivate.get<{ buildings: Building[] }>(`/api/district/${districtId}`);
                const buildingsData = response.data.buildings || [];
                cache.buildings.set(cacheKey, buildingsData);
                cache.timestamps.set(cacheKey, Date.now());
                setBuildings(buildingsData);
                setTimeout(restoreScrollPosition, 50);
            } catch (error) {
                logger.error('Error fetching buildings:', error);
                handleApiError(error, 'Failed to load buildings.');
                setBuildings([]);
            } finally {
                setIsLoadingBuildings(false);
            }
        },
        [axiosPrivate, restoreScrollPosition]
    );

    useEffect(() => {
        fetchDistricts();
    }, [fetchDistricts]);

    useEffect(() => {
        if (currentDistrict?._id) {
            fetchBuildings(currentDistrict._id);
        }
    }, [currentDistrict?._id, fetchBuildings]);

    const getBuildings = useCallback(
        async (id: string): Promise<void> => {
            saveScrollPosition();
            const newDistrict = districts.find((district) => district._id === id);
            if (newDistrict) {
                setCurrentDistrict(newDistrict);
                saveCurrentDistrict(newDistrict);
            }
        },
        [districts, saveScrollPosition, saveCurrentDistrict]
    );

    useEffect(() => {
        const handleCacheInvalidation = (): void => {
            cache.buildings.clear();
            cache.timestamps.clear();
        };
        window.addEventListener('invalidate-buildings-cache', handleCacheInvalidation);
        return () => {
            window.removeEventListener('invalidate-buildings-cache', handleCacheInvalidation);
        };
    }, []);

    const onDragEnd = async (result: DropResult): Promise<void> => {
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
            logger.error('Failed to reorder districts', error);
            fetchDistricts();
        }
    };

    useEffect(() => {
        const handleBeforeUnload = (): void => {
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
        <div className="districtPageContainer" style={{ padding: '20px' }}>
            {isLoading && (
                <LoadingSpinner overlay size="large" text="Loading..." />
            )}
            <Breadcrumb
                items={[
                    { label: 'Cities', path: '/city' },
                    { label: areaName || 'Area', path: areaId ? `/area/${areaId}` : undefined },
                    { label: 'Districts' },
                ]}
            />
            <h1 style={{ marginBottom: '20px' }}>Districts Page</h1>
            <div className="cacheStatus">
                <span>📊 Districts: {districts.length} loaded</span>
                <span>🏢 Buildings: {buildings.length} loaded</span>
                {!isLoadingDistricts && !isLoadingBuildings && <span>⚡ Cached - instant loading enabled</span>}
                {isLoadingBuildings && <span className="loadingIndicator">⟳ Loading buildings...</span>}
            </div>

            <div className="modern-card" style={{ marginBottom: '32px' }}>
                <div className="modern-card-header">
                    <h2 className="modern-card-title">
                        <span style={{ fontSize: '20px', marginRight: '8px' }}>📁</span>
                        District Management
                    </h2>
                </div>
                <div className="modern-card-body">
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: auth?.roles?.includes(ROLES.ADMIN) ? 'repeat(auto-fit, minmax(250px, 1fr))' : '1fr',
                            gap: '20px',
                            alignItems: 'start',
                        }}
                    >
                        {auth?.roles?.includes(ROLES.ADMIN) && (
                            <div className="modern-action-card">
                                <div className="modern-action-card-icon" style={{ backgroundColor: '#e8f5e8' }}>
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
                                    style={{ width: '100%', justifyContent: 'center' }}
                                >
                                    Open Enhanced Manager
                                </Link>
                            </div>
                        )}

                        <div className="modern-action-card">
                            <div className="modern-action-card-icon" style={{ backgroundColor: '#e8f4fd' }}>
                                📋
                            </div>
                            <h3 className="modern-action-card-title">Quick Actions</h3>
                            <p className="modern-action-card-description">
                                {districts.length === 0
                                    ? 'No districts found. Use the enhanced manager to create your first district.'
                                    : `Manage ${districts.length} district${districts.length !== 1 ? 's' : ''} with drag & drop reordering.`}
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
                            {auth?.roles?.includes(ROLES.ADMIN) ? (
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
            <div style={{ marginTop: '20px' }}>
                <h2 style={{ marginBottom: '15px' }}>Current District Name: {currentDistrict?.name || 'Loading...'}</h2>
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="districts">
                        {(provided: DroppableProvided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef}>
                                <DistrictButtons
                                    districts={districts}
                                    getBuildings={getBuildings}
                                    setCurrentDistrict={setCurrentDistrict}
                                    currentDistrict={currentDistrict}
                                    buildings={buildings}
                                />
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
                <BuildingsList buildings={buildings} isLoading={isLoadingBuildings} />
            </div>
        </div>
    );
};

export default DistrictSelectionPage;
