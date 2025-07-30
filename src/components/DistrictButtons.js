// Component displaying district navigation buttons with district-specific information and actions.

import React from 'react';
import Button from '@mui/material/Button';
import {Draggable} from 'react-beautiful-dnd';
import '../styles/districtButtons.css';
const DistrictButtons = ({districts = [], getBuildings, setCurrentDistrict}) => {
    const handleDistrictClick = (district) => {
        setCurrentDistrict(district);
        getBuildings(district._id);
    };
    return (
        <div className="districtButtonsContainer">
            {districts.length > 0 ? (
                districts.map((district, index) => (
                    <Draggable key={district._id} draggableId={district._id} index={index}>
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="draggableDistrict"
                            >
                                <div className="districtContent">
                                    <span>{district.name}</span>
                                    <Button
                                        onClick={() => handleDistrictClick(district)}
                                        style={{backgroundColor: 'green', color: 'white', marginLeft: '10px'}}
                                    >
                                        Show Now
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Draggable>
                ))
            ) : (
                <p>No districts available.</p>
            )}
        </div>
    );
};
export default DistrictButtons;
