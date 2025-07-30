// Component for inputting and managing individual apartment/flat details and information.

import React from 'react'
import '../styles/flatInputDetails.css'
const FlatInputDetails = ({
                              index,
                              parentIndex,
                              building,
                              handleFlatDetails,
                              formFields,
                          }) => {
    return (
        <div>
            <label htmlFor={`flat${index}`}></label>
            <select
                id={`flat${index}`}
                name="flat"
                onChange={(event) => {
                    handleFlatDetails(event, index, parentIndex)
                }}
                value={`${formFields[parentIndex]?.floors[index]?.flat}`}
            >
                <option value={''}></option>
                {building.flats.length > 0 &&
                    building.flats.map((flat, i) => {
                        return (
                            <option value={flat._id} key={i}>
                                {flat.toevoeging}
                            </option>
                        )
                    })}
            </select>
            <input
                id={`cableNumber${index}`}
                placeholder="CN"
                className="cableNumber"
                type="number"
                name="cableNumber"
                value={`${formFields[parentIndex]?.floors[index]?.cableNumber}`}
                onChange={(event) => {
                    handleFlatDetails(event, index, parentIndex)
                }}
            />
            <input
                id={`cableLength${index}`}
                placeholder="CL"
                className="cableLength"
                type="number"
                name="cableLength"
                value={`${formFields[parentIndex]?.floors[index]?.cableLength}`}
                onChange={(event) => {
                    handleFlatDetails(event, index, parentIndex)
                }}
            />
        </div>
    )
}
export default FlatInputDetails
