// Renders one building block (a "wing") from its ShapeSpec, either as a read-only preview
// or with a FlatInputDetails editor on every floor that holds a flat.

import React from 'react';
import FlatInputDetails from '../FlatInputDetails';
import { SHAPES, ShapeKey, ShapeSpec, ColumnSpec, FloorSpec } from './shapes';
import { Building, FlatDetailsHandler, FormField, MockupSchemaProps } from './types';

interface EditableProps {
    building: Building;
    parentIndex: number;
    formFields: FormField[];
    handleFlatDetails: FlatDetailsHandler;
}

interface BuildingSchemaProps extends MockupSchemaProps {
    shape: ShapeKey;
    /** Present = editable; absent = read-only preview. */
    editable?: EditableProps;
}

const resolveFloor = (column: ColumnSpec, index: number, count: number): FloorSpec => {
    if (index === 0 && column.first) return column.first;
    if (index === count - 1) return column.last;
    return column.middle;
};

const Lines: React.FC<{ classes: string[] }> = ({ classes }) => (
    <>
        {classes.map((className, i) => (
            <div key={i} className={className}></div>
        ))}
    </>
);

const Column: React.FC<{ column: ColumnSpec; floors: unknown[]; editable?: EditableProps }> = ({ column, floors, editable }) => (
    <div className="flatsContainer">
        {floors.map((_, index) => {
            const spec = resolveFloor(column, index, floors.length);
            if (spec.empty) {
                return (
                    <div key={index} className="emptyFlat">
                        <Lines classes={spec.lines} />
                    </div>
                );
            }
            return (
                <div key={index} className="flat">
                    {editable && (
                        <FlatInputDetails
                            index={index}
                            parentIndex={editable.parentIndex}
                            building={editable.building}
                            formFields={editable.formFields}
                            handleFlatDetails={editable.handleFlatDetails}
                        />
                    )}
                    <Lines classes={spec.lines} />
                </div>
            );
        })}
    </div>
);

const BuildingSchema: React.FC<BuildingSchemaProps> = ({ shape, form, editable }) => {
    const spec: ShapeSpec = SHAPES[shape];
    const floors = form?.floors ?? [];

    const block = (
        <div className="block">
            <div className={spec.reversed ? 'mainPart mainPartReversed' : 'mainPart'}>
                {spec.stairs === 'before' && <div className="stairs"></div>}
                {spec.columns.map((column, ci) => (
                    <React.Fragment key={ci}>
                        {ci > 0 && spec.stairs === 'between' && <div className="stairs"></div>}
                        <Column column={column} floors={floors} editable={editable} />
                    </React.Fragment>
                ))}
                {spec.wingLines && floors.length > 0 && <Lines classes={spec.wingLines} />}
            </div>
            <div className="basement"></div>
        </div>
    );

    return spec.outerWrapper ? <div>{block}</div> : block;
};

export default BuildingSchema;

/** A read-only preview component bound to one shape (used by the layout type picker). */
export const mockupFor = (shape: ShapeKey): React.FC<MockupSchemaProps> => {
    const Mockup: React.FC<MockupSchemaProps> = ({ form }) => <BuildingSchema shape={shape} form={form} />;
    Mockup.displayName = `Mockup(${shape})`;
    return Mockup;
};
