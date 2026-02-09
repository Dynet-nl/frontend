// Component displaying paginated building lists with filtering, search functionality, and role-based navigation.
// Refactored to use smaller, focused sub-components for better maintainability.

import React, { useState, useEffect, useCallback, useMemo, useContext, ChangeEvent, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BuildingSearchBar, BuildingFilterButtons, BuildingCard, Pagination } from './buildings';
import { calculateCompletionStatus } from '../utils/completionUtils';
import { filterBuildings, calculateFilterCounts } from '../utils/buildingFilters';
import { ConfirmModal, AlertModal } from './ui';
import '../styles/buildingsList.css';
import AuthContext from '../context/AuthProvider';
import { ROLES } from '../utils/constants';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import logger from '../utils/logger';

const BUILDINGS_PER_PAGE = 20;

interface Flat {
    _id: string;
    complexNaam?: string;
    fileUrl?: string;
    fcStatusHas?: string | number;
    technischePlanning?: {
        signature?: { fileUrl?: string };
        report?: { fileUrl?: string };
        appointmentBooked?: { date?: string; startTime?: string; endTime?: string };
        technischeSchouwerName?: string;
    };
    hasMonteur?: {
        signature?: { fileUrl?: string };
        report?: { fileUrl?: string };
        appointmentBooked?: { date?: string; startTime?: string; endTime?: string; type?: string };
        hasMonteurName?: string;
    };
    toevoeging?: string;
    zoeksleutel?: string;
    postcode?: string;
}

interface Building {
    _id: string;
    address: string;
    flats?: Flat[];
    fileUrl?: string;
    isBlocked?: boolean;
    blockReason?: string;
}

interface BuildingsListProps {
    buildings: Building[] | undefined;
    isLoading: boolean;
}

interface AlertModalState {
    isOpen: boolean;
    message: string;
}

interface ConfirmModalState {
    isOpen: boolean;
    building: Building | null;
}

interface BlockReasonModalState {
    isOpen: boolean;
    building: Building | null;
    reason: string;
}

const BuildingsList: React.FC<BuildingsListProps> = ({ buildings, isLoading }) => {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [filter, setFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const { auth: user } = useContext(AuthContext);
    const axiosPrivate = useAxiosPrivate();
    const queryClient = useQueryClient();

    // Modal state
    const [alertModal, setAlertModal] = useState<AlertModalState>({ isOpen: false, message: '' });
    const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({ isOpen: false, building: null });
    const [blockReasonModal, setBlockReasonModal] = useState<BlockReasonModalState>({ isOpen: false, building: null, reason: '' });

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, searchQuery, buildings]);

    // Handlers
    const handleSearch = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
        setSearchQuery(e.target.value.toLowerCase());
    }, []);

    const handleFilterChange = useCallback((newFilter: string): void => {
        setFilter(prev => prev === newFilter ? 'all' : newFilter);
    }, []);

    const clearAllFilters = useCallback((): void => {
        setFilter('all');
        setSearchQuery('');
    }, []);

    const handlePageChange = useCallback((page: number): void => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    // Role checks
    const isWerkvoorbereider = useMemo(() => {
        return user?.roles?.includes(ROLES.WERKVOORBEREIDER);
    }, [user]);

    // Building block/unblock handlers
    const handleBlockBuilding = useCallback(async (buildingId: string, reason: string): Promise<void> => {
        try {
            const response = await axiosPrivate.put(`/api/building/block/${buildingId}`, {
                reason: reason.trim()
            });
            if (response.data) {
                // Invalidate buildings query to trigger refetch
                queryClient.invalidateQueries({ queryKey: ['buildings'] });
                queryClient.invalidateQueries({ queryKey: ['district'] });
            }
        } catch (error) {
            logger.error('Error blocking building:', error);
            setAlertModal({ isOpen: true, message: 'Failed to block building. Please try again.' });
        }
    }, [axiosPrivate, queryClient]);

    const handleUnblockBuilding = useCallback(async (buildingId: string): Promise<void> => {
        try {
            const response = await axiosPrivate.put(`/api/building/unblock/${buildingId}`, {});
            if (response.data) {
                // Invalidate buildings query to trigger refetch
                queryClient.invalidateQueries({ queryKey: ['buildings'] });
                queryClient.invalidateQueries({ queryKey: ['district'] });
            }
        } catch (error) {
            logger.error('Error unblocking building:', error);
            setAlertModal({ isOpen: true, message: 'Failed to unblock building. Please try again.' });
        }
    }, [axiosPrivate, queryClient]);

    const toggleBlockBuilding = useCallback((building: Building): void => {
        if (building.isBlocked) {
            setConfirmModal({ isOpen: true, building });
        } else {
            setBlockReasonModal({ isOpen: true, building, reason: '' });
        }
    }, []);

    const handleConfirmUnblock = useCallback((): void => {
        if (confirmModal.building) {
            handleUnblockBuilding(confirmModal.building._id);
        }
        setConfirmModal({ isOpen: false, building: null });
    }, [confirmModal.building, handleUnblockBuilding]);

    const handleConfirmBlock = useCallback((): void => {
        if (blockReasonModal.building && blockReasonModal.reason.trim()) {
            handleBlockBuilding(blockReasonModal.building._id, blockReasonModal.reason);
        }
        setBlockReasonModal({ isOpen: false, building: null, reason: '' });
    }, [blockReasonModal, handleBlockBuilding]);

    // Computed values
    const filterCounts = useMemo(() => calculateFilterCounts(buildings || []), [buildings]);

    const filteredBuildings = useMemo(() => {
        return buildings ? filterBuildings(buildings, searchQuery, filter) : [];
    }, [buildings, searchQuery, filter]);

    const completionStatus = useMemo(() => {
        return calculateCompletionStatus(filteredBuildings);
    }, [filteredBuildings]);

    const totalPages = Math.ceil(filteredBuildings.length / BUILDINGS_PER_PAGE);

    const currentBuildings = useMemo(() => {
        const startIndex = (currentPage - 1) * BUILDINGS_PER_PAGE;
        return filteredBuildings.slice(startIndex, startIndex + BUILDINGS_PER_PAGE);
    }, [filteredBuildings, currentPage]);

    const hasActiveFilters = filter !== 'all' || searchQuery;

    const blockReasonMessage: ReactNode = (
        <div>
            <p>Enter reason for blocking "{blockReasonModal.building?.address}":</p>
            <textarea
                value={blockReasonModal.reason}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setBlockReasonModal(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter blocking reason..."
                style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    marginTop: '10px',
                    fontSize: '14px'
                }}
                autoFocus
            />
        </div>
    );

    return (
        <>
            {/* Search and Filters */}
            <div className="searchContainer">
                <BuildingSearchBar
                    searchQuery={searchQuery}
                    onSearch={handleSearch}
                />
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
                <div className="loadingContainer" style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#666'
                }}>
                    Loading buildings...
                </div>
            ) : (
                <div className="buildingsList">
                    {currentBuildings.map((building) => (
                        <BuildingCard
                            key={building._id}
                            building={building}
                            isWerkvoorbereider={isWerkvoorbereider}
                            onToggleBlock={toggleBlockBuilding}
                        />
                    ))}
                </div>
            )}

            {/* Pagination */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />

            {/* Alert Modal */}
            <AlertModal
                isOpen={alertModal.isOpen}
                title="Error"
                message={alertModal.message}
                onClose={() => setAlertModal({ isOpen: false, message: '' })}
            />

            {/* Confirm Unblock Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title="Unblock Building"
                message={`Are you sure you want to unblock "${confirmModal.building?.address}"?`}
                confirmText="Unblock"
                onConfirm={handleConfirmUnblock}
                onCancel={() => setConfirmModal({ isOpen: false, building: null })}
            />

            {/* Block Reason Modal */}
            {blockReasonModal.isOpen && (
                <ConfirmModal
                    isOpen={true}
                    title="Block Building"
                    message={blockReasonMessage}
                    confirmText="Block"
                    confirmVariant="danger"
                    onConfirm={handleConfirmBlock}
                    onCancel={() => setBlockReasonModal({ isOpen: false, building: null, reason: '' })}
                />
            )}
        </>
    );
};

export default BuildingsList;
