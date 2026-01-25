// Page for configuring building layouts with blocks, floors, and cable management.

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import '../styles/mockupSchemas.css'
import '../styles/dynamicSchemas.css'
import useAxiosPrivate from '../hooks/useAxiosPrivate'
import ConditionalFullSchema from '../components/ConditionalFullSchema'
import { ConfirmModal, LoadingState, ErrorState } from '../components/ui'
import '../styles/buildingPage.css'
import { useNotification } from '../context/NotificationProvider'
import logger from '../utils/logger'

// Import all mockup schemas for block type selection
import LeftWing from '../mockupSchemas/LeftWing'
import RightWing from '../mockupSchemas/RightWing'
import NoStairs from '../mockupSchemas/NoStairs'
import LeftWingApart from '../mockupSchemas/LeftWingApart'
import RightWingApart from '../mockupSchemas/RightWingApart'
import LeftWingNoBG from '../mockupSchemas/LeftWingNoBG'
import RightWingNoBG from '../mockupSchemas/RightWingNoBG'
import LeftWingFlat from '../mockupSchemas/LeftWingFlat'
import RightWingFlat from '../mockupSchemas/RightWingFlat'
import DoubleNoBGsWing from '../mockupSchemas/DoubleNoBGsWing'
import DoubleNoLeftBGWing from '../mockupSchemas/DoubleNoLeftBGWing'
import DoubleNoRightBGWing from '../mockupSchemas/DoubleNoRightBGWing'

// Constants
const FLOOR_OPTIONS = [
    { value: '', label: 'Select floor' },
    { value: 0, label: 'BG' },
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
    { value: 4, label: '4' },
    { value: 5, label: '5' },
];

const INITIAL_BLOCK = {
    firstFloor: 0,
    topFloor: '',
    blockType: '',
    floors: [],
};

// All available block types organized by category
const BLOCK_TYPE_CATEGORIES = [
    {
        name: 'Standard Wings',
        types: [
            { value: 'leftWing', label: 'Left Wing', Component: LeftWing, icon: '⬅️' },
            { value: 'rightWing', label: 'Right Wing', Component: RightWing, icon: '➡️' },
            { value: 'noStairs', label: 'No Stairs', Component: NoStairs, icon: '🏢' },
        ]
    },
    {
        name: 'Apartment Blocks',
        types: [
            { value: 'leftWingApart', label: 'Left Apart', Component: LeftWingApart, icon: '🏠' },
            { value: 'rightWingApart', label: 'Right Apart', Component: RightWingApart, icon: '🏠' },
        ]
    },
    {
        name: 'No Background',
        types: [
            { value: 'leftWingNoBG', label: 'Left No BG', Component: LeftWingNoBG, icon: '◀️' },
            { value: 'rightWingNoBG', label: 'Right No BG', Component: RightWingNoBG, icon: '▶️' },
        ]
    },
    {
        name: 'Flat Layouts',
        types: [
            { value: 'leftWingFlat', label: 'Left Flat', Component: LeftWingFlat, icon: '📐' },
            { value: 'rightWingFlat', label: 'Right Flat', Component: RightWingFlat, icon: '📐' },
        ]
    },
    {
        name: 'Double Wings',
        types: [
            { value: 'doubleNoBGsWing', label: 'Double No BGs', Component: DoubleNoBGsWing, icon: '🔄' },
            { value: 'doubleNoLeftBGWing', label: 'Double No Left', Component: DoubleNoLeftBGWing, icon: '↔️' },
            { value: 'doubleNoRightBGWing', label: 'Double No Right', Component: DoubleNoRightBGWing, icon: '↔️' },
        ]
    },
];

// Flatten for easy lookup
const ALL_BLOCK_TYPES = BLOCK_TYPE_CATEGORIES.flatMap(cat => cat.types);

const BuildingListPage = () => {
    const params = useParams()
    const navigate = useNavigate()
    const axiosPrivate = useAxiosPrivate()
    const { showSuccess, showError } = useNotification()
    
    // Loading and error states
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isScheduling, setIsScheduling] = useState(false)
    
    // Building data
    const [building, setBuilding] = useState(null)
    const [isLayoutNew, setLayoutNew] = useState(true)
    
    // Form state
    const [formFields, setFormFields] = useState([{ ...INITIAL_BLOCK }])
    const [activeBlockIndex, setActiveBlockIndex] = useState(0)
    const [showBlockTypeModal, setShowBlockTypeModal] = useState(false)
    
    // Cable and schedule state
    const [currentCable, setCurrentCable] = useState('')
    const [currentCableFlats, setCurrentCableFlats] = useState([])
    const [schedules, setSchedules] = useState({})
    const [existingSchedules, setExistingSchedules] = useState([])
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    
    // Modal state
    const [removeBlockModal, setRemoveBlockModal] = useState({ isOpen: false, index: null })

    const fetchBuilding = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            const { data } = await axiosPrivate.get(`/api/building/${params.id}`)
            setBuilding(data)
            if (data.layout?.blocks?.length) {
                setFormFields(data.layout.blocks)
                setLayoutNew(false)
            }
            // Store existing schedules
            if (data.schedules?.length) {
                setExistingSchedules(data.schedules)
            }
            setHasUnsavedChanges(false)
        } catch (err) {
            logger.error('Failed to fetch building:', err)
            setError(err.response?.data?.message || 'Failed to load building data')
        } finally {
            setIsLoading(false)
        }
    }, [params.id, axiosPrivate])

    useEffect(() => {
        fetchBuilding()
    }, [fetchBuilding])

    // Calculate cable numbers automatically
    const cableNumbers = useMemo(() => {
        const cables = new Set()
        formFields.forEach(field => {
            field.floors?.forEach(floor => {
                if (floor.cableNumber) cables.add(floor.cableNumber)
            })
        })
        return Array.from(cables).sort((a, b) => a - b)
    }, [formFields])

    // Get block type info helper
    const getBlockTypeInfo = useCallback((blockType) => {
        return ALL_BLOCK_TYPES.find(t => t.value === blockType)
    }, [])

    // Select cable and find connected flats
    const selectCable = useCallback((cableNumber) => {
        setCurrentCable(cableNumber)
        const flatIds = []
        const flatDetails = []
        formFields.forEach(block => {
            block.floors?.forEach(floor => {
                if (floor.cableNumber === cableNumber && floor.flat) {
                    flatIds.push(floor.flat)
                    // Find flat details from building.flats
                    const flatInfo = building?.flats?.find(f => f._id === floor.flat)
                    if (flatInfo) {
                        flatDetails.push(flatInfo)
                    }
                }
            })
        })
        setCurrentCableFlats(flatDetails)
        setSchedules(prev => ({ ...prev, cableNumber, flats: flatIds }))
    }, [formFields, building?.flats])
    const handleFlatDetails = (event, index, parentIndex) => {
        let data = [...formFields]
        data[parentIndex].floors[index][event.target.name] =
            event.target.name === 'cableNumber' || event.target.name === 'cableLength'
                ? parseInt(event.target.value, 10)
                : event.target.value
        setFormFields(data)
        setHasUnsavedChanges(true)
    }
    const handleBlockType = (event, index) => {
        let data = [...formFields]
        if (data[index].blockType) {
            if (!isNaN(data[index].topFloor)) {
                let tempArray = []
                for (let i = data[index].firstFloor; i <= data[index].topFloor; i++) {
                    tempArray.push({
                        floor: i,
                    })
                }
                data[index].floors = [...tempArray]
            }
        }
        data[index][event.target.name] = event.target.value
        setFormFields(data)
        setHasUnsavedChanges(true)
    }
    const handleFloors = (event, index) => {
        let data = [...formFields]
        data[index][event.target.name] = Number(event.target.value)
        if (!isNaN(data[index].topFloor)) {
            let tempArray = []
            for (let i = data[index].firstFloor; i <= data[index].topFloor; i++) {
                tempArray.push({
                    floor: i,
                })
            }
            data[index].floors = [...tempArray]
        }
        setFormFields(data)
        setHasUnsavedChanges(true)
    }
    const submit = async (e) => {
        e.preventDefault()
        
        // Validation
        const hasInvalidBlocks = formFields.some(field => !field.blockType || field.topFloor === '')
        if (hasInvalidBlocks) {
            showError('Please complete all block configurations before saving.')
            return
        }
        
        setIsSaving(true)
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
            if (isLayoutNew) {
                await axiosPrivate.post(`/api/building/layout/${params.id}`, formFields, config)
                setLayoutNew(false)
                showSuccess('Layout created successfully!')
            } else {
                await axiosPrivate.put(`/api/building/layout/${params.id}`, formFields, config)
                showSuccess('Layout updated successfully!')
            }
            setHasUnsavedChanges(false)
        } catch (error) {
            logger.error('Failed to save layout:', error)
            showError(error.response?.data?.message || 'Failed to save layout. Please try again.')
        } finally {
            setIsSaving(false)
        }
    }
    const addFields = () => {
        setFormFields([...formFields, { ...INITIAL_BLOCK }])
    }
    
    const removeFields = (e, index) => {
        e.preventDefault()
        if (formFields.length === 1) {
            showError('You must have at least one block.')
            return
        }
        setRemoveBlockModal({ isOpen: true, index })
    }
    
    const confirmRemoveBlock = () => {
        const { index } = removeBlockModal
        if (index !== null) {
            const data = [...formFields]
            data.splice(index, 1)
            setFormFields(data)
        }
        setRemoveBlockModal({ isOpen: false, index: null })
    }

    
    const sendSchedule = async (e) => {
        e.preventDefault()
        
        // Validation
        if (!schedules.date || !schedules.from || !schedules.till) {
            showError('Please fill in all schedule fields.')
            return
        }
        if (!schedules.cableNumber || !schedules.flats?.length) {
            showError('Please select a cable number first.')
            return
        }
        
        setIsScheduling(true)
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
            await axiosPrivate.post(`/api/schedule/${params.id}`, schedules, config)
            showSuccess('Schedule created successfully!')
            // Reset schedule form
            setSchedules({ cableNumber: schedules.cableNumber, flats: schedules.flats })
        } catch (error) {
            logger.error('Failed to create schedule:', error)
            showError(error.response?.data?.message || 'Failed to create schedule. Please try again.')
        } finally {
            setIsScheduling(false)
        }
    }
    
    // Loading state
    if (isLoading) {
        return (
            <div className="buildingPageContainer">
                <LoadingState message="Loading building data..." />
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="buildingPageContainer">
                <ErrorState message={error} onRetry={fetchBuilding} retryText="Try Again" />
            </div>
        )
    }

    return (
        <div className="buildingPageContainer">
            <div className="page-header">
                <button className="btn btn-ghost" onClick={() => navigate(-1)}>
                    ← Back
                </button>
                <div className="page-title">
                    <h1>Building Layout Configuration</h1>
                    {building && (
                        <p className="building-address">
                            {building.address || building.name} {building.postcode && `• ${building.postcode}`}
                        </p>
                    )}
                </div>
                {hasUnsavedChanges && (
                    <span className="unsaved-indicator">⚠️ Unsaved changes</span>
                )}
            </div>
            
            {/* Block Tabs */}
            <div className="block-tabs">
                {formFields.map((form, i) => {
                    const typeInfo = getBlockTypeInfo(form.blockType)
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
                    )
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
                            <button 
                                className="btn btn-danger btn-sm"
                                onClick={(e) => removeFields(e, activeBlockIndex)}
                            >
                                Remove Block
                            </button>
                        )}
                    </div>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor={`topFloor-${activeBlockIndex}`}>Top Floor</label>
                            <select
                                id={`topFloor-${activeBlockIndex}`}
                                name="topFloor"
                                onChange={(event) => handleFloors(event, activeBlockIndex)}
                                value={formFields[activeBlockIndex].topFloor}
                                className="form-select"
                            >
                                {FLOOR_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label>Block Type</label>
                            <button
                                type="button"
                                className="btn btn-secondary block-type-selector"
                                onClick={() => setShowBlockTypeModal(true)}
                            >
                                {getBlockTypeInfo(formFields[activeBlockIndex].blockType)?.label || 'Select Type...'}
                            </button>
                        </div>
                    </div>

                    {/* Block Type Preview */}
                    {formFields[activeBlockIndex].blockType && (
                        <div className="block-preview">
                            <h4>Preview</h4>
                            <div className="preview-container">
                                {(() => {
                                    const typeInfo = getBlockTypeInfo(formFields[activeBlockIndex].blockType)
                                    if (typeInfo?.Component) {
                                        const PreviewComponent = typeInfo.Component
                                        return <PreviewComponent form={formFields[activeBlockIndex]} />
                                    }
                                    return <p>No preview available</p>
                                })()}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Block Type Selection Modal */}
            {showBlockTypeModal && (
                <div className="modal-overlay" onClick={() => setShowBlockTypeModal(false)}>
                    <div className="modal-content block-type-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Select Block Type</h3>
                            <button className="modal-close" onClick={() => setShowBlockTypeModal(false)}>×</button>
                        </div>
                        <div className="block-type-grid">
                            {BLOCK_TYPE_CATEGORIES.map(category => (
                                <div key={category.name} className="block-category">
                                    <h4>{category.name}</h4>
                                    <div className="category-types">
                                        {category.types.map(type => (
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
                                                        handleBlockType(e, activeBlockIndex)
                                                        setShowBlockTypeModal(false)
                                                    }}
                                                />
                                                <div className="type-preview">
                                                    <type.Component form={formFields[activeBlockIndex]} />
                                                </div>
                                                <span className="type-label">
                                                    {type.icon} {type.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Save Button */}
            <div className="button-group">
                <button 
                    className="btn btn-primary btn-lg" 
                    onClick={submit}
                    disabled={isSaving}
                >
                    {isSaving ? 'Saving...' : (isLayoutNew ? 'Create Layout' : 'Save Layout')}
                </button>
            </div>
            
            <h2>Completed Layout of the Building</h2>
            <p className="section-hint">Fill in flat details, cable numbers (CN) and cable lengths (CL) for each floor:</p>
            <div className="completeSchemaContainer">
                {formFields.map((form, index) => {
                    // Determine container class based on block type
                    const isWingType = [
                        'leftWing', 'rightWing',
                        'leftWingNoBG', 'rightWingNoBG',
                        'leftWingFlat', 'rightWingFlat',
                        'leftWingApart', 'rightWingApart'
                    ].includes(form.blockType)
                    const isNoStairsType = form.blockType === 'noStairs'
                    const isDoubleType = [
                        'doubleNoBGsWing', 'doubleNoLeftBGWing', 'doubleNoRightBGWing'
                    ].includes(form.blockType)
                    
                    return (
                        <div
                            key={`schema-${index}-${form.blockType}`}
                            className={`
                                ${isWingType ? 'wingContainer' : ''}
                                ${isNoStairsType ? 'noStairsContainer' : ''}
                                ${isDoubleType ? 'doubleContainer' : ''}
                            `.trim()}
                        >
                            <div className="block-label">Block {index + 1}</div>
                            <ConditionalFullSchema
                                form={form}
                                building={building}
                                parentIndex={index}
                                formFields={formFields}
                                handleFlatDetails={handleFlatDetails}
                            />
                        </div>
                    )
                })}
            </div>
            
            <div className="cablesContainer">
                <h3>Cable Management</h3>
                {cableNumbers.length === 0 ? (
                    <p className="empty-state">Configure floor details above to see cable numbers.</p>
                ) : (
                    <>
                        <p className="cable-hint">Click a cable to view connected flats:</p>
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
                        <h4>Connected Flats for Cable {currentCable}:</h4>
                        <div className="flats-list">
                            {currentCableFlats.map((flat, index) => (
                                <span key={`flat-${flat._id || flat}-${index}`} className="flat-badge">
                                    {flat.toevoeging || flat.adres || flat._id || flat}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Existing Schedules */}
                {existingSchedules.length > 0 && (
                    <div className="existing-schedules">
                        <h4>📅 Existing Schedules</h4>
                        <div className="schedules-list">
                            {existingSchedules.map((schedule, index) => (
                                <div key={schedule._id || index} className="schedule-item">
                                    <span className="schedule-cable">Cable {schedule.cableNumber}</span>
                                    <span className="schedule-date">
                                        {schedule.date ? new Date(schedule.date).toLocaleDateString() : 'No date'}
                                    </span>
                                    <span className="schedule-time">
                                        {schedule.from} - {schedule.till}
                                    </span>
                                    <span className="schedule-flats">
                                        {schedule.flats?.length || 0} flats
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {cableNumbers.length > 0 && (
                    <div className="schedule-card">
                        <h3 className="schedule-title">
                            <span>📅</span>
                            Schedule Installation
                        </h3>
                        <form onSubmit={sendSchedule} className="schedule-form">
                            <div className="schedule-form-grid">
                                <div className="form-group">
                                    <label htmlFor="date">📅 Installation Date</label>
                                    <input
                                        onChange={(e) => setSchedules({...schedules, date: e.target.value})}
                                        type="date"
                                        id="date"
                                        name="date"
                                        className="form-input"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="from">🕐 Start Time</label>
                                    <input
                                        onChange={(e) => setSchedules({...schedules, from: e.target.value})}
                                        type="time"
                                        id="from"
                                        name="from"
                                        className="form-input"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="till">🕐 End Time</label>
                                    <input
                                        onChange={(e) => setSchedules({...schedules, till: e.target.value})}
                                        type="time"
                                        id="till"
                                        name="till"
                                        className="form-input"
                                        required
                                    />
                                </div>
                            </div>
                            <button 
                                type="submit"
                                className="btn btn-primary"
                                disabled={isScheduling}
                            >
                                <span>✅</span>
                                {isScheduling ? 'Creating...' : 'Create Schedule'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
            
            {/* Confirm Remove Block Modal */}
            <ConfirmModal
                isOpen={removeBlockModal.isOpen}
                title="Remove Block"
                message="Are you sure you want to remove this block?"
                confirmText="Remove"
                confirmVariant="danger"
                onConfirm={confirmRemoveBlock}
                onCancel={() => setRemoveBlockModal({ isOpen: false, index: null })}
            />
        </div>
    )
}

export default BuildingListPage
