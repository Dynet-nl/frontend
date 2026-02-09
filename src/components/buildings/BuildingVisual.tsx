// Visual representation of a building with floor-by-floor completion status

import React from 'react';

interface Flat {
    fcStatusHas?: string | number;
    adres?: string;
    huisNummer?: string;
    toevoeging?: string;
}

interface BuildingVisualProps {
    flats: Flat[];
    typeString: string;
    completionPercentage: number;
}

const BuildingVisual: React.FC<BuildingVisualProps> = ({ flats, typeString, completionPercentage }) => {
    const generateBuildingStructure = (flats: Flat[], type: string): React.ReactNode => {
        const totalFlats = flats.length;
        const floorGroups: Record<number, Flat[]> = {};

        for (let i = 0; i < totalFlats; i++) {
            const floorNumber = i + 1;
            floorGroups[floorNumber] = [flats[i]];
        }

        const floors: React.ReactNode[] = [];
        const buildingWidth = type === 'Hoog bouw' ? 120 : type === 'Duplex' ? 100 : 80;
        const sortedFloorNumbers = Object.keys(floorGroups).map(Number).sort((a, b) => b - a);

        sortedFloorNumbers.forEach((floorNumber, index) => {
            const floorFlats = floorGroups[floorNumber];
            const completedFlatsOnFloor = floorFlats.filter(flat => flat.fcStatusHas === '2').length;
            const floorCompletionPercentage = (completedFlatsOnFloor / floorFlats.length) * 100;
            const isCompleted = floorCompletionPercentage === 100;
            const isPartiallyCompleted = floorCompletionPercentage > 0 && floorCompletionPercentage < 100;

            const floorHeight = type === 'Hoog bouw' ? 45 : type === 'Duplex' ? 40 : 35;

            floors.push(
                <div
                    key={floorNumber}
                    className={`buildingFloor ${isCompleted ? 'completed' : isPartiallyCompleted ? 'partial' : 'pending'}`}
                    style={{
                        height: `${floorHeight}px`,
                        width: `${buildingWidth}px`,
                        animationDelay: `${index * 0.2}s`
                    }}
                    title={`Floor ${floorNumber} - 1 flat - ${Math.round(floorCompletionPercentage)}% complete`}
                >
                    <div className="floorNumber">{floorNumber}</div>
                    <div className="floorWindows">
                        <div
                            className={`window ${floorFlats[0].fcStatusHas === '2' ? 'completed' : 'pending'}`}
                            style={{ animationDelay: `${index * 0.2}s` }}
                            title={`Flat: ${floorFlats[0].adres} ${floorFlats[0].huisNummer}${floorFlats[0].toevoeging}`}
                        />
                    </div>
                    <div className="floorProgress" style={{ width: `${floorCompletionPercentage}%` }} />
                </div>
            );
        });

        return (
            <div className="verticalBuilding">
                {floors}
                <div className="buildingFoundation" style={{ width: `${buildingWidth}px` }}>
                    <div className="foundationLabel">{`${type} (${totalFlats} flats)`}</div>
                </div>
            </div>
        );
    };

    return (
        <div className="buildingVisual">
            <div className={`buildingStructure ${typeString.toLowerCase().replace(' ', '')}`}>
                {generateBuildingStructure(flats, typeString)}
            </div>
            <div className="completionBadge" data-percentage={completionPercentage}>
                {completionPercentage}%
            </div>
        </div>
    );
};

export default React.memo(BuildingVisual);
