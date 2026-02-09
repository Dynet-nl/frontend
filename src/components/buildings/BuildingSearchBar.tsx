// Search input component for filtering buildings by name or address

import React, { ChangeEvent } from 'react';

interface BuildingSearchBarProps {
    searchQuery: string;
    onSearch: (e: ChangeEvent<HTMLInputElement>) => void;
}

const BuildingSearchBar: React.FC<BuildingSearchBarProps> = ({ searchQuery, onSearch }) => {
    return (
        <input
            type="text"
            placeholder="Search by Complex Naam or Address"
            value={searchQuery}
            onChange={onSearch}
            className="searchInput"
        />
    );
};

export default React.memo(BuildingSearchBar);
