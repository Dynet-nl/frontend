// Paginated building list with search, filters and (for Werkvoorbereider/Admin) block/unblock.

import React, { useState, useEffect, useCallback, useMemo, ChangeEvent, ReactNode } from 'react';
import { BuildingSearchBar, BuildingFilterButtons, BuildingCard, Pagination } from './buildings';
import { calculateCompletionStatus } from '../utils/completionUtils';
import { filterBuildings, calculateFilterCounts } from '../utils/buildingFilters';
import { ConfirmModal, AlertModal } from './ui';
import '../styles/buildingsList.css';
import useAuth from '../hooks/useAuth';
import { ROLES } from '../utils/constants';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import logger from '../utils/logger';
import type { Building } from '../types/domain';

const BUILDINGS_PER_PAGE = 20;

interface BuildingsListProps {
    buildings: Building[] | undefined;
    isLoading: boolean;
    /** Called with the updated building after a successful block/unblock so the parent list stays in sync. */
    onBuildingChanged?: (building: Building) => void;
}

interface BlockResponse {
    building: Pick<Building, '_id' | 'address' | 'isBlocked' | 'blockReason'>;
}

const BuildingsList: React.FC<BuildingsListProps> = ({ buildings, isLoading, onBuildingChanged }) => {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [filter, setFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const { auth } = useAuth();
    const axiosPrivate = useAxiosPrivate();

    // Modal state
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [unblockTarget, setUnblockTarget] = useState<Building | null>(null);
    const [blockTarget, setBlockTarget] = useState<Building | null>(null);
    const [blockReason, setBlockReason] = useState<string>('');

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, searchQuery, buildings]);

    const handleSearch = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
        setSearchQuery(e.target.value.toLowerCase());
    }, []);

    const handleFilterChange = useCallback((newFilter: string): void => {
        setFilter((prev) => (prev === newFilter ? 'all' : newFilter));
    }, []);

    const clearAllFilters = useCallback((): void => {
        setFilter('all');
        setSearchQuery('');
    }, []);

    const handlePageChange = useCallback((page: number): void => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const canBlock = useMemo(
        () => !!auth?.roles?.some((role) => role === ROLES.WERKVOORBEREIDER || role === ROLES.ADMIN),
        [auth]
    );

    const applyBlockResult = useCallback(
        (original: Building, result: BlockResponse['building']): void => {
            onBuildingChanged?.({ ...original, isBlocked: result.isBlocked, blockReason: result.blockReason ?? '' });
        },
        [onBuildingChanged]
    );

    const handleBlockBuilding = useCallback(
        async (building: Building, reason: string): Promise<void> => {
            try {
                const response = await axiosPrivate.put<BlockResponse>(`/api/building/block/${building._id}`, { reason: reason.trim() });
                applyBlockResult(building, response.data.building);
            } catch (error) {
                logger.error('Error blocking building:', error);
                setAlertMessage('Failed to block building. Please try again.');
            }
        },
        [axiosPrivate, applyBlockResult]
    );

    const handleUnblockBuilding = useCallback(
        async (building: Building): Promise<void> => {
            try {
                const response = await axiosPrivate.put<BlockResponse>(`/api/building/unblock/${building._id}`, {});
                applyBlockResult(building, response.data.building);
            } catch (error) {
                logger.error('Error unblocking building:', error);
                setAlertMessage('Failed to unblock building. Please try again.');
            }
        },
        [axiosPrivate, applyBlockResult]
    );

    const toggleBlockBuilding = useCallback((building: Building): void => {
        if (building.isBlocked) {
            setUnblockTarget(building);
        } else {
            setBlockTarget(building);
            setBlockReason('');
        }
    }, []);

    const handleConfirmUnblock = useCallback((): void => {
        if (unblockTarget) handleUnblockBuilding(unblockTarget);
        setUnblockTarget(null);
    }, [unblockTarget, handleUnblockBuilding]);

    const handleConfirmBlock = useCallback((): void => {
        if (blockTarget && blockReason.trim()) {
            handleBlockBuilding(blockTarget, blockReason);
            setBlockTarget(null);
            setBlockReason('');
        }
    }, [blockTarget, blockReason, handleBlockBuilding]);

    // Computed values
    const filterCounts = useMemo(() => calculateFilterCounts(buildings || []), [buildings]);

    const filteredBuildings = useMemo(
        () => (buildings ? filterBuildings(buildings, searchQuery, filter) : []),
        [buildings, searchQuery, filter]
    );

    const completionStatus = useMemo(() => calculateCompletionStatus(filteredBuildings), [filteredBuildings]);

    const totalPages = Math.ceil(filteredBuildings.length / BUILDINGS_PER_PAGE);

    const currentBuildings = useMemo(() => {
        const startIndex = (currentPage - 1) * BUILDINGS_PER_PAGE;
        return filteredBuildings.slice(startIndex, startIndex + BUILDINGS_PER_PAGE);
    }, [filteredBuildings, currentPage]);

    const hasActiveFilters = filter !== 'all' || searchQuery !== '';

    const blockReasonMessage: ReactNode = (
        <div>
            <p>Enter reason for blocking "{blockTarget?.address}":</p>
            <textarea
                value={blockReason}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setBlockReason(e.target.value)}
                placeholder="Enter blocking reason..."
                style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    marginTop: '10px',
                    fontSize: '14px',
                }}
                autoFocus
            />
        </div>
    );

    return (
        <>
            {/* Search and Filters */}
            <div className="searchContainer">
                <BuildingSearchBar searchQuery={searchQuery} onSearch={handleSearch} />
                <BuildingFilterButtons
                    currentFilter={filter}
                    filterCounts={filterCounts}
                    onFilterChange={handleFilterChange}
                    onClearAll={clearAllFilters}
                    hasActiveFilters={hasActiveFilters}
                />
                <div className="resultsCount">
                    <strong>{filteredBuildings.length}</strong> results found
                    {isLoading && <span className="loadingIndicator"> • Refreshing...</span>}
                </div>
            </div>

            {/* Completion Status */}
            <div className="completionPercentage">
                {`Completion Status: ${completionStatus.completedFlats} / ${completionStatus.totalFlats} (${completionStatus.percentage}%)`}
            </div>

            {/* Buildings List */}
            {isLoading && !buildings ? (
                <div className="loadingContainer" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                    Loading buildings...
                </div>
            ) : (
                <div className="buildingsList">
                    {currentBuildings.map((building) => (
                        <BuildingCard
                            key={building._id}
                            building={building}
                            isWerkvoorbereider={canBlock}
                            onToggleBlock={toggleBlockBuilding}
                        />
                    ))}
                </div>
            )}

            {/* Pagination */}
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />

            <AlertModal open={alertMessage !== null} title="Error" message={alertMessage ?? ''} onClose={() => setAlertMessage(null)} />

            <ConfirmModal
                open={unblockTarget !== null}
                title="Unblock Building"
                message={`Are you sure you want to unblock "${unblockTarget?.address}"?`}
                confirmText="Unblock"
                variant="primary"
                onConfirm={handleConfirmUnblock}
                onClose={() => setUnblockTarget(null)}
            />

            <ConfirmModal
                open={blockTarget !== null}
                title="Block Building"
                message={blockReasonMessage}
                confirmText="Block"
                variant="danger"
                onConfirm={handleConfirmBlock}
                onClose={() => {
                    setBlockTarget(null);
                    setBlockReason('');
                }}
            />
        </>
    );
};

export default BuildingsList;
