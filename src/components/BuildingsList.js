// Component displaying paginated building lists with filtering, search functionality, and role-based navigation.
// Refactored to use smaller, focused sub-components for better maintainability.

import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
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

const BuildingsList = ({ buildings, isLoading }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const { auth: user } = useContext(AuthContext);
    const axiosPrivate = useAxiosPrivate();
    
    // Modal state
    const [alertModal, setAlertModal] = useState({ isOpen: false, message: '' });
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, building: null });
    const [blockReasonModal, setBlockReasonModal] = useState({ isOpen: false, building: null, reason: '' });

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, searchQuery, buildings]);

    // Handlers
    const handleSearch = useCallback((e) => {
        setSearchQuery(e.target.value.toLowerCase());
    }, []);

    const handleFilterChange = useCallback((newFilter) => {
        setFilter(prev => prev === newFilter ? 'all' : newFilter);
    }, []);

    const clearAllFilters = useCallback(() => {
        setFilter('all');
        setSearchQuery('');
    }, []);

    const handlePageChange = useCallback((page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    // Role checks
    const isWerkvoorbereider = useMemo(() => {
        return user?.roles?.includes(ROLES.WERKVOORBEREIDER);
    }, [user]);

    // Building block/unblock handlers
    const handleBlockBuilding = useCallback(async (buildingId, reason) => {
        try {
            const response = await axiosPrivate.put(`/api/building/block/${buildingId}`, {
                reason: reason.trim()
            });
            if (response.data) {
                window.location.reload();
            }
        } catch (error) {
            logger.error('Error blocking building:', error);
            setAlertModal({ isOpen: true, message: 'Failed to block building. Please try again.' });
        }
    }, [axiosPrivate]);

    const handleUnblockBuilding = useCallback(async (buildingId) => {
        try {
            const response = await axiosPrivate.put(`/api/building/unblock/${buildingId}`, {});
            if (response.data) {
                window.location.reload();
            }
        } catch (error) {
            logger.error('Error unblocking building:', error);
            setAlertModal({ isOpen: true, message: 'Failed to unblock building. Please try again.' });
        }
    }, [axiosPrivate]);

    const toggleBlockBuilding = useCallback((building) => {
        if (building.isBlocked) {
            setConfirmModal({ isOpen: true, building });
        } else {
            setBlockReasonModal({ isOpen: true, building, reason: '' });
        }
    }, []);
    
    const handleConfirmUnblock = useCallback(() => {
        if (confirmModal.building) {
            handleUnblockBuilding(confirmModal.building._id);
        }
        setConfirmModal({ isOpen: false, building: null });
    }, [confirmModal.building, handleUnblockBuilding]);
    
    const handleConfirmBlock = useCallback(() => {
        if (blockReasonModal.building && blockReasonModal.reason.trim()) {
            handleBlockBuilding(blockReasonModal.building._id, blockReasonModal.reason);
        }
        setBlockReasonModal({ isOpen: false, building: null, reason: '' });
    }, [blockReasonModal, handleBlockBuilding]);

    // Computed values
    const filterCounts = useMemo(() => calculateFilterCounts(buildings), [buildings]);
    
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
                    message={
                        <div>
                            <p>Enter reason for blocking "{blockReasonModal.building?.address}":</p>
                            <textarea
                                value={blockReasonModal.reason}
                                onChange={(e) => setBlockReasonModal(prev => ({ ...prev, reason: e.target.value }))}
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
                    }
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
