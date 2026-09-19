// Page for configuring building layouts with blocks, floors, and cable management.
// Organized as a 3-step workflow: Define Structure → Map Floors & Cables → Review & Schedule.

import React, { useEffect, useState, useCallback, useMemo, ChangeEvent, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/mockupSchemas.css';
import '../styles/dynamicSchemas.css';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import ConditionalFullSchema from '../components/ConditionalFullSchema';
import { ConfirmModal, LoadingState, ErrorState } from '../components/ui';
import '../styles/buildingPage.css';
import { useNotification } from '../context/NotificationProvider';
import logger from '../utils/logger';

import { BLOCK_TYPE_CATEGORIES, ALL_BLOCK_TYPES } from '../constants/blockTypes';
import {
    BlockConfig,
    BlockTypeInfo,
    Building,
    Flat,
    Schedule,
    FLOOR_OPTIONS,
    INITIAL_BLOCK,
    buildFloors,
} from '../types/building';

const BuildingListPage: React.FC = () => {
    const params = useParams<{ id: string }>();
    const navigate = useNavigate();
    const axiosPrivate = useAxiosPrivate();
    const { showSuccess, showError } = useNotification();

    // Loading and error states
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isScheduling, setIsScheduling] = useState<boolean>(false);

    // Building data
    const [building, setBuilding] = useState<Building | null>(null);
    const [isLayoutNew, setLayoutNew] = useState<boolean>(true);

    // Form state
    const [formFields, setFormFields] = useState<BlockConfig[]>([{ ...INITIAL_BLOCK }]);
    const [activeBlockIndex, setActiveBlockIndex] = useState<number>(0);
    const [showBlockTypeModal, setShowBlockTypeModal] = useState<boolean>(false);

    // Cable and schedule state
    const [currentCable, setCurrentCable] = useState<number | string>('');
    const [currentCableFlats, setCurrentCableFlats] = useState<Flat[]>([]);
    const [schedules, setSchedules] = useState<Schedule>({});
    const [existingSchedules, setExistingSchedules] = useState<Schedule[]>([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

    // Modal state
    const [removeBlockModal, setRemoveBlockModal] = useState<{ isOpen: boolean; index: number | null }>({
        isOpen: false,
        index: null,
    });

    const fetchBuilding = useCallback(async (): Promise<void> => {
        setIsLoading(true);
        setError(null);
        try {
            const { data } = await axiosPrivate.get<Building>(`/api/building/${params.id}`);
            setBuilding(data);
            if (data.layout?.blocks?.length) {
                setFormFields(data.layout.blocks);
                setLayoutNew(false);
            }
            // Store existing schedules
            if (data.schedules?.length) {
                setExistingSchedules(data.schedules);
            }
            setHasUnsavedChanges(false);
        } catch (err) {
            const error = err as { response?: { data?: { message?: string } } };
            logger.error('Failed to fetch building:', err);
            setError(error.response?.data?.message || 'Failed to load building data');
        } finally {
            setIsLoading(false);
        }
    }, [params.id, axiosPrivate]);

    useEffect(() => {
        fetchBuilding();
    }, [fetchBuilding]);

    // Calculate cable numbers automatically
    const cableNumbers = useMemo(() => {
        const cables = new Set<number>();
        formFields.forEach((field) => {
            field.floors?.forEach((floor) => {
                if (floor.cableNumber) cables.add(floor.cableNumber);
            });
        });
        return Array.from(cables).sort((a, b) => a - b);
    }, [formFields]);

    // Get block type info helper
    const getBlockTypeInfo = useCallback((blockType: string): BlockTypeInfo | undefined => {
        return ALL_BLOCK_TYPES.find((t) => t.value === blockType);
    }, []);

    // Count how many floors have a flat assigned
    const assignedFloorCount = useMemo(() => {
        let assigned = 0;
        let total = 0;
        formFields.forEach((block) => {
            block.floors?.forEach((floor) => {
                total++;
                if (floor.flat) assigned++;
            });
        });
        return { assigned, total };
    }, [formFields]);

    // Select cable and find connected flats
    const selectCable = useCallback(
        (cableNumber: number): void => {
            setCurrentCable(cableNumber);
            const flatIds: string[] = [];
            const flatDetails: Flat[] = [];
            formFields.forEach((block) => {
                block.floors?.forEach((floor) => {
                    if (floor.cableNumber === cableNumber && floor.flat) {
                        flatIds.push(floor.flat);
                        // Find flat details from building.flats
                        const flatInfo = building?.flats?.find((f) => f._id === floor.flat);
                        if (flatInfo) {
                            flatDetails.push(flatInfo);
                        }
                    }
                });
            });
            setCurrentCableFlats(flatDetails);
            setSchedules((prev) => ({ ...prev, cableNumber, flats: flatIds }));
        },
        [formFields, building?.flats]
    );

    const handleFlatDetails = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>, index: number, parentIndex: number): void => {
        const { name, value } = event.target;
        const newValue = name === 'cableNumber' || name === 'cableLength' ? parseInt(value, 10) : value;

        setFormFields((prevFields) =>
            prevFields.map((block, bIdx) => {
                if (bIdx !== parentIndex) return block;
                return {
                    ...block,
                    floors: block.floors.map((floor, fIdx) => {
                        if (fIdx !== index) return floor;
                        return { ...floor, [name]: newValue };
                    }),
                };
            })
        );
        setHasUnsavedChanges(true);
    };

    const handleBlockType = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>, index: number): void => {
        const { name, value } = event.target;
        setFormFields((prevFields) =>
            prevFields.map((block, idx) => {
                if (idx !== index) return block;

                // Changing the layout type keeps flat/cable assignments for floors that still exist.
                const floors = buildFloors(block.firstFloor, block.topFloor, block.floors);
                return { ...block, [name]: value, floors };
            })
        );
        setHasUnsavedChanges(true);
    };

    const handleFloors = (event: ChangeEvent<HTMLSelectElement>, index: number): void => {
        const { name, value } = event.target;
        const numValue = Number(value);

        setFormFields((prevFields) =>
            prevFields.map((block, idx) => {
                if (idx !== index) return block;

                const firstFloor = name === 'firstFloor' ? numValue : block.firstFloor;
                const topFloor = name === 'topFloor' ? (value === '' ? '' : numValue) : block.topFloor;
                return { ...block, [name]: value === '' ? '' : numValue, floors: buildFloors(firstFloor, topFloor, block.floors) };
            })
        );
        setHasUnsavedChanges(true);
    };

    const submit = async (e: FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>): Promise<void> => {
        e.preventDefault();

        // Validation
        const hasInvalidBlocks = formFields.some((field) => !field.blockType || field.topFloor === '');
        if (hasInvalidBlocks) {
            showError('Please complete all block configurations before saving.');
            return;
        }

        setIsSaving(true);
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                },
            };
            if (isLayoutNew) {
                await axiosPrivate.post(`/api/building/layout/${params.id}`, formFields, config);
                setLayoutNew(false);
                showSuccess('Layout created successfully!');
            } else {
                await axiosPrivate.put(`/api/building/layout/${params.id}`, formFields, config);
                showSuccess('Layout updated successfully!');
            }
            setHasUnsavedChanges(false);
        } catch (err) {
            const error = err as { response?: { data?: { message?: string } } };
            logger.error('Failed to save layout:', err);
            showError(error.response?.data?.message || 'Failed to save layout. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const addFields = (): void => {
        setFormFields([...formFields, { ...INITIAL_BLOCK }]);
    };

    const removeFields = (e: React.MouseEvent<HTMLButtonElement>, index: number): void => {
        e.preventDefault();
        if (formFields.length === 1) {
            showError('You must have at least one block.');
            return;
        }
        setRemoveBlockModal({ isOpen: true, index });
    };

    const confirmRemoveBlock = (): void => {
        const { index } = removeBlockModal;
        if (index !== null) {
            const data = [...formFields];
            data.splice(index, 1);
            setFormFields(data);
        }
        setRemoveBlockModal({ isOpen: false, index: null });
    };

    const sendSchedule = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        // Validation
        if (!schedules.date || !schedules.from || !schedules.till) {
            showError('Please fill in all schedule fields.');
            return;
        }
        if (!schedules.cableNumber) {
            showError('Please select a cable number first.');
            return;
        }
        if (!schedules.flats?.length) {
            showError('No flats are connected to this cable. Assign flats to floors in Step 2 first.');
            return;
        }

        setIsScheduling(true);
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                },
            };
            await axiosPrivate.post(`/api/schedule/${params.id}`, schedules, config);
            showSuccess('Schedule created successfully!');
            // Reset schedule form
            setSchedules({ cableNumber: schedules.cableNumber, flats: schedules.flats });
        } catch (err) {
            const error = err as { response?: { data?: { message?: string } } };
            logger.error('Failed to create schedule:', err);
            showError(error.response?.data?.message || 'Failed to create schedule. Please try again.');
        } finally {
            setIsScheduling(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="buildingPageContainer">
                <LoadingState message="Loading building data..." />
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="buildingPageContainer">
                <ErrorState message={error} onRetry={fetchBuilding} retryText="Try Again" />
            </div>
        );
    }

    // Derived state for step readiness
    const hasBlocks = formFields.some((f) => f.blockType && f.topFloor !== '');
    const hasCables = cableNumbers.length > 0;

    return (
        <div className="buildingPageContainer">
            {/* ── Page Header ── */}
            <div className="page-header">
                <button className="btn btn-ghost" onClick={() => navigate(-1)}>
                    ← Back
                </button>
                <div className="page-title">
                    <h1>Building Layout Configuration</h1>
                    {building && (
                        <p className="building-address">
                            {building.address || building.name} {building.postcode && `· ${building.postcode}`}
                        </p>
                    )}
                </div>
                {hasUnsavedChanges && <span className="unsaved-indicator">Unsaved changes</span>}
            </div>

            {/* ── Building Overview Card ── */}
            {building && (
                <div className="building-overview">
                    <div className="overview-grid">
                        <div className="overview-item">
                            <span className="overview-label">Address</span>
                            <span className="overview-value">{building.address || building.name || '—'}</span>
                        </div>
                        <div className="overview-item">
                            <span className="overview-label">Postcode</span>
                            <span className="overview-value">{building.postcode || '—'}</span>
                        </div>
                        <div className="overview-item">
                            <span className="overview-label">Complex</span>
                            <span className="overview-value">{building.flats?.[0]?.complexNaam || '—'}</span>
                        </div>
                        <div className="overview-item">
                            <span className="overview-label">Flats</span>
                            <span className="overview-value">{building.flats?.length || 0} units</span>
                        </div>
                        <div className="overview-item">
                            <span className="overview-label">Blocks</span>
                            <span className="overview-value">{formFields.filter(f => f.blockType).length} configured</span>
                        </div>
                        <div className="overview-item">
                            <span className="overview-label">Cables</span>
                            <span className="overview-value">{cableNumbers.length} assigned</span>
                        </div>
                    </div>
                    {building.isBlocked && (
                        <div className="overview-blocked-banner">
                            This building is blocked{building.blockReason ? `: ${building.blockReason}` : ''}
                        </div>
                    )}
                </div>
            )}

            {/* ── Workflow Steps Overview ── */}
            <div className="steps-indicator">
                <div className={`step-dot ${hasBlocks ? 'completed' : 'active'}`}>
                    <span className="step-dot-number">1</span>
                    <span className="step-dot-label">Structure</span>
                </div>
                <div className="step-connector" />
                <div className={`step-dot ${hasCables ? 'completed' : hasBlocks ? 'active' : ''}`}>
                    <span className="step-dot-number">2</span>
                    <span className="step-dot-label">Floors & Cables</span>
                </div>
                <div className="step-connector" />
                <div className={`step-dot ${existingSchedules.length > 0 ? 'completed' : hasCables ? 'active' : ''}`}>
                    <span className="step-dot-number">3</span>
                    <span className="step-dot-label">Schedule</span>
                </div>
            </div>

            {/* ════════════════════════════════════════════
                STEP 1: Define Building Structure
            ════════════════════════════════════════════ */}
            <section className="step-section">
                <div className="step-header">
                    <div className="step-number">1</div>
                    <div>
                        <h2 className="step-title">Define Building Structure</h2>
                        <p className="step-description">
                            Add blocks to represent each wing or section of the building.
                            For each block, choose a layout type and set the highest floor.
                        </p>
                    </div>
                </div>

                {/* Block Tabs */}
                <div className="block-tabs">
                    {formFields.map((form, i) => {
                        const typeInfo = getBlockTypeInfo(form.blockType);
                        return (
                            <button
                                key={`tab-${i}`}
                                className={`block-tab ${activeBlockIndex === i ? 'active' : ''} ${!form.blockType ? 'incomplete' : ''}`}
                                onClick={() => setActiveBlockIndex(i)}
                            >
                                <span className="tab-icon">{typeInfo?.icon || '📦'}</span>
                                <span>Block {i + 1}</span>
                                {!form.blockType && <span className="tab-warning">!</span>}
                            </button>
                        );
                    })}
                    <button className="block-tab add-tab" onClick={addFields}>
                        <span>+</span>
                        <span>Add Block</span>
                    </button>
                </div>

                {/* Active Block Configuration */}
                {formFields[activeBlockIndex] && (
                    <div className="block-card active-block">
                        <div className="block-card-header">
                            <h3>Block {activeBlockIndex + 1} Configuration</h3>
                            {formFields.length > 1 && (
                                <button className="btn btn-danger btn-sm" onClick={(e) => removeFields(e, activeBlockIndex)}>
                                    Remove Block
                                </button>
                            )}
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor={`topFloor-${activeBlockIndex}`}>Highest Floor</label>
                                <p className="form-hint">Select the top floor of this block (BG = ground floor only)</p>
                                <select
                                    id={`topFloor-${activeBlockIndex}`}
                                    name="topFloor"
                                    onChange={(event) => handleFloors(event, activeBlockIndex)}
                                    value={formFields[activeBlockIndex].topFloor}
                                    className="form-select"
                                >
                                    {FLOOR_OPTIONS.map((option) => (
                                        <option key={String(option.value)} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Layout Type</label>
                                <p className="form-hint">Choose how this wing/section is physically laid out</p>
                                <button type="button" className="btn btn-secondary block-type-selector" onClick={() => setShowBlockTypeModal(true)}>
                                    {getBlockTypeInfo(formFields[activeBlockIndex].blockType)?.label || 'Select layout type...'}
                                </button>
                            </div>
                        </div>

                        {/* Block Type Preview */}
                        {formFields[activeBlockIndex].blockType && (
                            <div className="block-preview">
                                <h4>Preview</h4>
                                <div className="preview-container">
                                    {(() => {
                                        const typeInfo = getBlockTypeInfo(formFields[activeBlockIndex].blockType);
                                        if (typeInfo?.Component) {
                                            const PreviewComponent = typeInfo.Component;
                                            return <PreviewComponent form={formFields[activeBlockIndex]} />;
                                        }
                                        return <p>No preview available</p>;
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Save Button */}
                <div className="button-group">
                    <button className="btn btn-primary btn-lg" onClick={submit} disabled={isSaving}>
                        {isSaving ? 'Saving...' : isLayoutNew ? 'Save Layout' : 'Update Layout'}
                    </button>
                    {!hasBlocks && (
                        <span className="button-hint">Select a top floor and layout type above, then save.</span>
                    )}
                </div>
            </section>

            {/* Block Type Selection Modal */}
            {showBlockTypeModal && (
                <div className="modal-overlay" onClick={() => setShowBlockTypeModal(false)}>
                    <div className="modal-content block-type-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3>Select Layout Type</h3>
                                <p className="modal-subtitle">Choose the physical layout that matches this section of the building</p>
                            </div>
                            <button className="modal-close" onClick={() => setShowBlockTypeModal(false)}>
                                ×
                            </button>
                        </div>
                        <div className="block-type-grid">
                            {BLOCK_TYPE_CATEGORIES.map((category) => (
                                <div key={category.name} className="block-category">
                                    <h4>{category.name}</h4>
                                    <p className="category-description">{category.description}</p>
                                    <div className="category-types">
                                        {category.types.map((type) => (
                                            <label
                                                key={type.value}
                                                className={`block-type-option ${formFields[activeBlockIndex].blockType === type.value ? 'selected' : ''}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="blockType"
                                                    value={type.value}
                                                    checked={formFields[activeBlockIndex].blockType === type.value}
                                                    onChange={(e) => {
                                                        handleBlockType(e, activeBlockIndex);
                                                        setShowBlockTypeModal(false);
                                                    }}
                                                />
                                                <div className="type-preview">
                                                    <type.Component form={formFields[activeBlockIndex]} />
                                                </div>
                                                <span className="type-label">
                                                    {type.icon} {type.label}
                                                </span>
                                                <span className="type-description">{type.description}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════
                STEP 2: Map Floors to Flats & Cables
            ════════════════════════════════════════════ */}
            <section className="step-section">
                <div className="step-header">
                    <div className="step-number">2</div>
                    <div>
                        <h2 className="step-title">Map Floors to Flats & Cables</h2>
                        <p className="step-description">
                            For each floor in the building diagram below, assign the correct flat (apartment unit), a cable number (CN), and cable length (CL).
                            {building?.flats && building.flats.length > 0 && (
                                <span className="step-stat">
                                    {' '}{assignedFloorCount.assigned} of {assignedFloorCount.total} floors mapped so far.
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                {!hasBlocks ? (
                    <div className="step-empty-state">
                        <p>Complete Step 1 first — save at least one block with a layout type and floor range.</p>
                    </div>
                ) : (
                    <>
                        <div className="field-legend">
                            <span className="legend-item"><strong>Dropdown</strong> = Flat (apartment unit)</span>
                            <span className="legend-item"><strong>CN</strong> = Cable Number</span>
                            <span className="legend-item"><strong>CL</strong> = Cable Length (meters)</span>
                        </div>
                        <div className="completeSchemaContainer">
                            {formFields.map((form, index) => {
                                // Determine container class based on block type
                                const isWingType = [
                                    'leftWing',
                                    'rightWing',
                                    'leftWingNoBG',
                                    'rightWingNoBG',
                                    'leftWingFlat',
                                    'rightWingFlat',
                                    'leftWingApart',
                                    'rightWingApart',
                                ].includes(form.blockType);
                                const isNoStairsType = form.blockType === 'noStairs';
                                const isDoubleType = ['doubleNoBGsWing', 'doubleNoLeftBGWing', 'doubleNoRightBGWing'].includes(form.blockType);

                                return (
                                    <div
                                        key={`schema-${index}-${form.blockType}`}
                                        className={`
                                            ${isWingType ? 'wingContainer' : ''}
                                            ${isNoStairsType ? 'noStairsContainer' : ''}
                                            ${isDoubleType ? 'doubleContainer' : ''}
                                        `.trim()}
                                    >
                                        <div className="block-label">Block {index + 1} — {getBlockTypeInfo(form.blockType)?.label || 'Unconfigured'}</div>
                                        <ConditionalFullSchema
                                            form={form}
                                            building={building}
                                            parentIndex={index}
                                            formFields={formFields}
                                            handleFlatDetails={handleFlatDetails}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Save again after floor details are filled */}
                        <div className="button-group">
                            <button className="btn btn-primary" onClick={submit} disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </>
                )}
            </section>

            {/* ════════════════════════════════════════════
                STEP 3: Review Cables & Schedule Work
            ════════════════════════════════════════════ */}
            <section className="step-section">
                <div className="step-header">
                    <div className="step-number">3</div>
                    <div>
                        <h2 className="step-title">Review Cables & Schedule Installation</h2>
                        <p className="step-description">
                            View cable routing across the building, check which flats are connected to each cable, and create installation schedules.
                        </p>
                    </div>
                </div>

                <div className="cablesContainer">
                    <h3>Cable Overview</h3>
                    {!hasCables ? (
                        <div className="step-empty-state">
                            <p>
                                {!hasBlocks
                                    ? 'Complete Steps 1 and 2 first — no cable numbers have been assigned yet.'
                                    : 'No cable numbers assigned yet. Go to Step 2 and fill in the CN (Cable Number) fields for each floor.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="cable-hint">Click a cable to see which flats it connects and to schedule installation work:</p>
                            <div className="cableNumbersContainer">
                                {cableNumbers.map((cableNum) => (
                                    <button
                                        className={`cable-btn ${cableNum === currentCable ? 'selectedCable' : ''}`}
                                        key={`cable-${cableNum}`}
                                        onClick={() => selectCable(cableNum)}
                                    >
                                        Cable {cableNum}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    {currentCableFlats.length > 0 && (
                        <div className="currentCableFlatsContainer">
                            <h4>Flats connected to Cable {currentCable}:</h4>
                            <div className="flats-list">
                                {currentCableFlats.map((flat, index) => (
                                    <span key={`flat-${flat._id}-${index}`} className="flat-badge">
                                        {flat.toevoeging || flat.adres || flat._id}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Existing Schedules */}
                    {existingSchedules.length > 0 && (
                        <div className="existing-schedules">
                            <h4>Existing Schedules</h4>
                            <div className="schedules-list">
                                {existingSchedules.map((schedule, index) => (
                                    <div key={schedule._id || index} className="schedule-item">
                                        <span className="schedule-cable">Cable {schedule.cableNumber}</span>
                                        <span className="schedule-date">{schedule.date ? new Date(schedule.date).toLocaleDateString('nl-NL') : 'No date'}</span>
                                        <span className="schedule-time">
                                            {schedule.from} – {schedule.till}
                                        </span>
                                        <span className="schedule-flats">{schedule.flats?.length || 0} flats</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Schedule Form - only when a cable is selected */}
                    {hasCables && (
                        <div className="schedule-card">
                            <h3 className="schedule-title">
                                Schedule Installation
                                {currentCable && <span className="schedule-cable-tag"> — Cable {currentCable}</span>}
                            </h3>
                            {!currentCable ? (
                                <p className="schedule-select-hint">Select a cable above to schedule installation work for its connected flats.</p>
                            ) : (
                                <form onSubmit={sendSchedule} className="schedule-form">
                                    {currentCableFlats.length > 0 && (
                                        <div className="schedule-flats-preview">
                                            <span className="schedule-flats-label">Scheduling for {currentCableFlats.length} flat{currentCableFlats.length !== 1 ? 's' : ''}:</span>
                                            {currentCableFlats.map((flat, i) => (
                                                <span key={i} className="flat-badge small">{flat.toevoeging || flat.adres || flat._id}</span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="schedule-form-grid">
                                        <div className="form-group">
                                            <label htmlFor="date">Installation Date</label>
                                            <input
                                                onChange={(e) => setSchedules(prev => ({ ...prev, date: e.target.value }))}
                                                type="date"
                                                id="date"
                                                name="date"
                                                className="form-input"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="from">Start Time</label>
                                            <input
                                                onChange={(e) => setSchedules(prev => ({ ...prev, from: e.target.value }))}
                                                type="time"
                                                id="from"
                                                name="from"
                                                className="form-input"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="till">End Time</label>
                                            <input
                                                onChange={(e) => setSchedules(prev => ({ ...prev, till: e.target.value }))}
                                                type="time"
                                                id="till"
                                                name="till"
                                                className="form-input"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-primary" disabled={isScheduling}>
                                        {isScheduling ? 'Creating...' : 'Create Schedule'}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* Confirm Remove Block Modal */}
            <ConfirmModal
                open={removeBlockModal.isOpen}
                title="Remove Block"
                message="Are you sure you want to remove this block? Any floor details for this block will be lost."
                confirmText="Remove"
                variant="danger"
                onConfirm={confirmRemoveBlock}
                onClose={() => setRemoveBlockModal({ isOpen: false, index: null })}
            />
        </div>
    );
};

export default BuildingListPage;
