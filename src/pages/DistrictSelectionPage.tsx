// Districts of an area: drag-and-drop priority order plus the building list of the selected district.

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
import type { Building, District, PaginatedResponse } from '../types/domain';
import { unwrapList } from '../types/domain';

interface DistrictsResponse extends PaginatedResponse<District> {
    area?: { _id: string; name: string } | null;
}

interface DistrictDetailResponse {
    buildings?: Building[];
}

// Short-lived in-memory cache so navigating back to a district is instant. Logout does a
// full page navigation, so nothing here survives a user switch.
interface CacheData {
    districts: Map<string, District[]>;
    areaNames: Map<string, string>;
    buildings: Map<string, Building[]>;
    timestamps: Map<string, number>;
}

const cache: CacheData = {
    districts: new Map(),
    areaNames: new Map(),
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
    const [areaName, setAreaName] = useState<string>(() => (areaId && cache.areaNames.get(areaId)) || '');

    const isAdmin = !!auth?.roles?.includes(ROLES.ADMIN);

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
                if (savedDistrict) return savedDistrict;
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
                requestAnimationFrame(() => window.scrollTo(0, position));
            }
        }
    }, [areaId]);

    const fetchDistricts = useCallback(async (): Promise<void> => {
        if (!areaId) return;
        const cacheKey = `districts_${areaId}`;
        if (isCacheValid(cacheKey) && cache.districts.has(cacheKey)) {
            const cachedDistricts = cache.districts.get(cacheKey)!;
            setDistricts(cachedDistricts);
            setIsLoadingDistricts(false);
            setCurrentDistrict((current) => current ?? (cachedDistricts.length > 0 ? restoreCurrentDistrict(cachedDistricts) : null));
            return;
        }
        try {
            setIsLoadingDistricts(true);
            const response = await axiosPrivate.get<DistrictsResponse | District[]>(`/api/district/area/${areaId}`, {
                params: { limit: 100, sortBy: 'priority', sortOrder: 'asc' },
            });
            const districtsData = unwrapList<District>(response.data);
            const name = !Array.isArray(response.data) ? response.data.area?.name : undefined;
            if (name) {
                cache.areaNames.set(areaId, name);
                setAreaName(name);
            }
            cache.districts.set(cacheKey, districtsData);
            cache.timestamps.set(cacheKey, Date.now());
            setDistricts(districtsData);
            setCurrentDistrict((current) => current ?? (districtsData.length > 0 ? restoreCurrentDistrict(districtsData) : null));
        } catch (error) {
            logger.error('Error fetching districts:', error);
            handleApiError(error, 'Failed to load districts.');
        } finally {
            setIsLoadingDistricts(false);
        }
    }, [areaId, axiosPrivate, restoreCurrentDistrict, handleApiError]);

    const fetchBuildings = useCallback(
        async (districtId: string): Promise<void> => {
            if (!districtId) {
                setBuildings([]);
                return;
            }
            const cacheKey = `buildings_${districtId}`;
            if (isCacheValid(cacheKey) && cache.buildings.has(cacheKey)) {
                setBuildings(cache.buildings.get(cacheKey)!);
                setIsLoadingBuildings(false);
                setTimeout(restoreScrollPosition, 10);
                return;
            }
            try {
                setIsLoadingBuildings(true);
                const response = await axiosPrivate.get<DistrictDetailResponse>(`/api/district/${districtId}`);
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
        [axiosPrivate, restoreScrollPosition, handleApiError]
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

    // Keep the list (and the cache) in sync after a building is blocked/unblocked.
    const handleBuildingChanged = useCallback(
        (updated: Building): void => {
            setBuildings((prev) => {
                const next = prev.map((b) => (b._id === updated._id ? { ...b, ...updated } : b));
                if (currentDistrict?._id) cache.buildings.set(`buildings_${currentDistrict._id}`, next);
                return next;
            });
        },
        [currentDistrict?._id]
    );

    const onDragEnd = async (result: DropResult): Promise<void> => {
        if (!result.destination || !isAdmin) return;
        const items = Array.from(districts);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        const reprioritised = items.map((district, index) => ({ ...district, priority: index + 1 }));
        setDistricts(reprioritised);
        try {
            await axiosPrivate.post('/api/district/reorder', {
                districts: reprioritised.map((district) => ({ id: district._id, priority: district.priority })),
            });
            const cacheKey = `districts_${areaId}`;
            cache.districts.set(cacheKey, reprioritised);
            cache.timestamps.set(cacheKey, Date.now());
        } catch (error) {
            logger.error('Failed to reorder districts', error);
            handleApiError(error, 'Failed to save the new district order.');
            cache.timestamps.delete(`districts_${areaId}`);
            fetchDistricts();
        }
    };

    useEffect(() => {
        const handleBeforeUnload = (): void => saveScrollPosition();
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            saveScrollPosition();
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [saveScrollPosition]);

    const isLoading = isLoadingDistricts || isLoadingBuildings;

    return (
        <div className="districtPageContainer" style={{ padding: '20px' }}>
            {isLoading && <LoadingSpinner overlay size="large" text="Loading..." />}
            <Breadcrumb
                items={[
                    { label: 'Cities', path: '/city' },
                    { label: areaName || 'Area', path: areaId ? `/area/${areaId}` : undefined },
                    { label: 'Districts' },
                ]}
            />
            <h1 style={{ marginBottom: '20px' }}>{areaName ? `Districts in ${areaName}` : 'Districts'}</h1>
            <div className="cacheStatus">
                <span>📊 Districts: {districts.length}</span>
                <span>🏢 Buildings: {buildings.length}</span>
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
                            gridTemplateColumns: isAdmin ? 'repeat(auto-fit, minmax(250px, 1fr))' : '1fr',
                            gap: '20px',
                            alignItems: 'start',
                        }}
                    >
                        {isAdmin && (
                            <div className="modern-action-card">
                                <div className="modern-action-card-icon" style={{ backgroundColor: '#e8f5e8' }}>
                                    🚀
                                </div>
                                <h3 className="modern-action-card-title">Import & Update</h3>
                                <p className="modern-action-card-description">
                                    Create a district from an Excel export, or update an existing district with a new weekly file.
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
                                    Open District Manager
                                </Link>
                            </div>
                        )}

                        <div className="modern-action-card">
                            <div className="modern-action-card-icon" style={{ backgroundColor: '#e8f4fd' }}>
                                📋
                            </div>
                            <h3 className="modern-action-card-title">Overview</h3>
                            <p className="modern-action-card-description">
                                {districts.length === 0
                                    ? 'No districts yet. An administrator can import one from an Excel file.'
                                    : `${districts.length} district${districts.length !== 1 ? 's' : ''} in this area${isAdmin ? '. Drag to change the priority order.' : '.'}`}
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
                        </div>
                    </div>
                </div>
            </div>
            <div style={{ marginTop: '20px' }}>
                <h2 style={{ marginBottom: '15px' }}>Current District: {currentDistrict?.name || (isLoadingDistricts ? 'Loading...' : '—')}</h2>
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="districts" isDropDisabled={!isAdmin}>
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
                <BuildingsList buildings={buildings} isLoading={isLoadingBuildings} onBuildingChanged={handleBuildingChanged} />
            </div>
        </div>
    );
};

export default DistrictSelectionPage;
