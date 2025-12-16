// Search input component for filtering buildings by name or address

import React from 'react';

const BuildingSearchBar = ({ searchQuery, onSearch }) => {
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
