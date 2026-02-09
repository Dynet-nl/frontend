// Component for inputting and managing individual apartment/flat details per floor.
// Shows: Flat selector, Cable Number (CN), Cable Length (CL).
// Rendered inside building floor plan diagrams — must stay compact and inline.

import React, { ChangeEvent } from 'react';
import '../styles/flatInputDetails.css';

interface Floor {
    flat?: string;
    cableNumber?: number | string;
    cableLength?: number | string;
}

interface FormField {
    floors?: Floor[];
}

interface Flat {
    _id: string;
    toevoeging?: string;
    adres?: string;
    huisNummer?: string;
}

interface Building {
    flats: Flat[];
}

interface FlatInputDetailsProps {
    index: number;
    parentIndex: number;
    building: Building;
    handleFlatDetails: (event: ChangeEvent<HTMLSelectElement | HTMLInputElement>, index: number, parentIndex: number) => void;
    formFields: FormField[];
}

const getFlatLabel = (flat: Flat): string => {
    if (flat.toevoeging) return flat.toevoeging;
    if (flat.adres && flat.huisNummer) return `${flat.huisNummer}`;
    return 'BG';
};

const FlatInputDetails: React.FC<FlatInputDetailsProps> = ({
    index,
    parentIndex,
    building,
    handleFlatDetails,
    formFields,
}) => {
    const currentFlat = formFields[parentIndex]?.floors?.[index]?.flat || '';
    const currentCN = formFields[parentIndex]?.floors?.[index]?.cableNumber || '';
    const currentCL = formFields[parentIndex]?.floors?.[index]?.cableLength || '';

    return (
        <div>
            <select
                id={`flat${parentIndex}-${index}`}
                name="flat"
                className="flatInputSelect"
                onChange={(event) => handleFlatDetails(event, index, parentIndex)}
                value={`${currentFlat}`}
            >
                <option value="">Flat</option>
                {building.flats.length > 0 &&
                    building.flats.map((flat, i) => (
                        <option value={flat._id} key={i}>
                            {getFlatLabel(flat)}
                        </option>
                    ))}
            </select>
            <input
                id={`cableNumber${parentIndex}-${index}`}
                placeholder="CN"
                className="cableNumber"
                type="number"
                name="cableNumber"
                value={`${currentCN}`}
                onChange={(event) => handleFlatDetails(event, index, parentIndex)}
            />
            <input
                id={`cableLength${parentIndex}-${index}`}
                placeholder="CL"
                className="cableLength"
                type="number"
                name="cableLength"
                value={`${currentCL}`}
                onChange={(event) => handleFlatDetails(event, index, parentIndex)}
            />
        </div>
    );
};

export default FlatInputDetails;
