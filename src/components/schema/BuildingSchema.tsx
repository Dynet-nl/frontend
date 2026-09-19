// Renders one building block (a "wing") from its ShapeSpec as a readable column of floor
// slots with the cable run drawn beside it. Read-only when `editable` is absent; with
// `editable`, every slot that holds a flat gets a flat picker plus CN/CL inputs.

import React from 'react';
import Icon from '../ui/Icon';
import { SHAPES, ShapeKey, ShapeSpec, ColumnSpec, FloorSpec } from './shapes';
import { Building, FlatDetailsHandler, FormField, MockupSchemaProps, Floor, Flat } from './types';
import { flatLabel as domainFlatLabel } from '../../types/domain';

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

export const floorTag = (floor: Floor | undefined, index: number): string => {
    const n = typeof floor?.floor === 'number' ? floor.floor : index;
    return n === 0 ? 'BG' : `${n}e`;
};

const cableClass = (cn?: number | string): string => {
    const n = Number(cn);
    if (!cn || Number.isNaN(n) || n <= 0) return 'floor-slot__cable';
    return `floor-slot__cable floor-slot__cable--c${((n - 1) % 6) + 1}`;
};

const flatLabel = (flat: Flat): string => domainFlatLabel(flat) || flat._id;

const Slot: React.FC<{ spec: FloorSpec; floor: Floor | undefined; index: number; editable?: EditableProps; primary: boolean }> = ({ spec, floor, index, editable, primary }) => {
    const tag = floorTag(floor, index);
    if (spec.empty || !primary) {
        return (
            <div className="floor-slot floor-slot--empty" data-floor={index}>
                <span className="floor-slot__label">{tag}</span>
                <span className={spec.empty ? 'floor-slot__cable' : cableClass(floor?.cableNumber)} />
                <div className="floor-slot__box floor-slot__box--empty emptyFlat">
                    <Icon name={spec.empty ? 'block' : 'door_front'} />
                    <span>{spec.empty ? 'Geen flat op deze verdieping' : 'Zelfde verdieping'}</span>
                </div>
            </div>
        );
    }
    const flats = editable?.building.flats ?? [];
    const current = editable?.formFields[editable.parentIndex]?.floors?.[index];
    const selectedFlat = flats.find((f) => f._id === (current?.flat || floor?.flat));
    return (
        <div className="floor-slot" data-floor={index}>
            <span className="floor-slot__label">{tag}</span>
            <span className={cableClass(current?.cableNumber ?? floor?.cableNumber)} />
            <div className="floor-slot__box flat">
                <Icon name="door_front" />
                {editable ? (
                    <>
                        <select
                            id={`flat${editable.parentIndex}-${index}`}
                            name="flat"
                            className="select"
                            value={current?.flat || ''}
                            onChange={(e) => editable.handleFlatDetails(e, index, editable.parentIndex)}
                            aria-label={`Flat op ${tag}`}
                        >
                            <option value="">Kies flat…</option>
                            {flats.map((f) => (
                                <option key={f._id} value={f._id}>{flatLabel(f)}</option>
                            ))}
                        </select>
                        <label className="floor-slot__mini">
                            CN
                            <input name="cableNumber" type="number" min={0} className="input" value={current?.cableNumber ?? ''} onChange={(e) => editable.handleFlatDetails(e, index, editable.parentIndex)} aria-label={`Kabelnummer ${tag}`} />
                        </label>
                        <label className="floor-slot__mini">
                            CL
                            <input name="cableLength" type="number" min={0} className="input" value={current?.cableLength ?? ''} onChange={(e) => editable.handleFlatDetails(e, index, editable.parentIndex)} aria-label={`Kabellengte ${tag}`} />
                        </label>
                    </>
                ) : (
                    <>
                        <span className="truncate">{selectedFlat ? flatLabel(selectedFlat) : floor?.flat ? 'Flat' : '—'}</span>
                        <span className="floor-slot__mini">CN <span className="mono">{floor?.cableNumber ?? '—'}</span></span>
                        <span className="floor-slot__mini">CL <span className="mono">{floor?.cableLength ? `${floor.cableLength} m` : '—'}</span></span>
                    </>
                )}
            </div>
        </div>
    );
};

const Column: React.FC<{ column: ColumnSpec; floors: Floor[]; editable?: EditableProps; primary: boolean }> = ({ column, floors, editable, primary }) => (
    <div className="plan__column flatsContainer">
        {[...floors].map((_, i) => floors.length - 1 - i).map((index) => (
            <Slot key={index} spec={resolveFloor(column, index, floors.length)} floor={floors[index]} index={index} editable={editable} primary={primary} />
        ))}
        {floors.length > 0 && (
            <div className="floor-slot" data-floor="basement">
                <span className="floor-slot__label">KB</span>
                <span className="floor-slot__cable floor-slot__cable--c1" />
                <div className="floor-slot__box floor-slot__box--basement basement">
                    <Icon name="settings_input_component" />
                    <span>Kelder / invoer — kabelintrede vanaf de straat</span>
                </div>
            </div>
        )}
    </div>
);

const Stairs: React.FC = () => (
    <div className="plan__stairs stairs" title="Trappenhuis">
        <Icon name="stairs" />
    </div>
);

const BuildingSchema: React.FC<BuildingSchemaProps> = ({ shape, form, editable }) => {
    const spec: ShapeSpec = SHAPES[shape];
    const floors = form?.floors ?? [];
    const double = spec.columns.length > 1;
    const className = ['plan__wing mainPart', double ? 'plan__wing--double' : '', spec.reversed ? 'mainPartReversed' : ''].filter(Boolean).join(' ');

    if (double) {
        return (
            <div className={className} data-shape={shape}>
                <Column column={spec.columns[0]} floors={floors} editable={editable} primary />
                <Stairs />
                <Column column={spec.columns[1]} floors={floors} editable={editable} primary={false} />
            </div>
        );
    }
    const stairs = spec.stairs === 'before' ? <Stairs /> : null;
    return (
        <div className={className} data-shape={shape} style={stairs ? { gridTemplateColumns: spec.reversed ? '24px 1fr' : '1fr 24px' } : undefined}>
            {spec.reversed && stairs}
            <Column column={spec.columns[0]} floors={floors} editable={editable} primary />
            {!spec.reversed && stairs}
        </div>
    );
};

export default BuildingSchema;

/** A read-only preview component bound to one shape (used by the layout type picker). */
export const mockupFor = (shape: ShapeKey): React.FC<MockupSchemaProps> => {
    const Mockup: React.FC<MockupSchemaProps> = ({ form }) => <BuildingSchema shape={shape} form={form} />;
    Mockup.displayName = `Mockup(${shape})`;
    return Mockup;
};
