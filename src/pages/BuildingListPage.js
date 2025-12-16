// Page displaying building lists with filtering, pagination, and building-specific actions.

import React, {useEffect, useState, useCallback} from 'react'
import {useParams} from 'react-router-dom'
import '../styles/mockupSchemas.css'
import '../styles/dynamicSchemas.css'
import useAxiosPrivate from '../hooks/useAxiosPrivate'
import RightWing from '../mockupSchemas/RightWing'
import LeftWing from '../mockupSchemas/LeftWing'
import NoStairs from '../mockupSchemas/NoStairs'
import ConditionalFullSchema from '../components/ConditionalFullSchema'
import { ConfirmModal } from '../components/ui'
import '../styles/buildingPage.css'
import { useNotification } from '../context/NotificationProvider'
import logger from '../utils/logger'

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

const BuildingListPage = () => {
    const params = useParams()
    const axiosPrivate = useAxiosPrivate()
    const { showSuccess, showError } = useNotification()
    
    // Loading and error states
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isScheduling, setIsScheduling] = useState(false)
    
    const [building, setBuilding] = useState({})
    const [isLayoutNew, setLayoutNew] = useState(true)
    const [cableNumbers, setCableNumbers] = useState([])
    const [currentCable, setCurrentCable] = useState('')
    const [currentCableFlats, setCurrentCableFlats] = useState([])
    const [schedules, setSchedules] = useState({})
    const [formFields, setFormFields] = useState([{ ...INITIAL_BLOCK }])
    const [removeBlockModal, setRemoveBlockModal] = useState({ isOpen: false, index: null })

    const fetchBuilding = useCallback(async () => {
        setIsLoading(true)
        try {
            const { data } = await axiosPrivate.get(`/api/building/${params.id}`)
            setBuilding(data)
            if (data.layout?.blocks?.length) {
                setFormFields(data.layout.blocks)
                setLayoutNew(false)
            }
        } catch (error) {
            logger.error('Failed to fetch building:', error)
            showError('Failed to load building data. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }, [params.id, axiosPrivate, showError])

    useEffect(() => {
        fetchBuilding()
    }, [fetchBuilding])
    const handleFlatDetails = (event, index, parentIndex) => {
        let data = [...formFields]
        data[parentIndex].floors[index][event.target.name] =
            event.target.name === 'cableNumber' || event.target.name === 'cableLength'
                ? parseInt(event.target.value, 10)
                : event.target.value
        setFormFields(data)
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
    const getCableNumbers = () => {
        const tempArray = formFields.map((field) => {
            return field.floors.map((floor) => {
                return floor.cableNumber
            })
        })
        setCableNumbers([...new Set(tempArray.flat())])
    }
    const selectedFlats = (cableNumber) => {
        const tempArray = []
        formFields.forEach((formField) => {
            formField.floors.forEach((floor) => {
                if (floor.cableNumber === cableNumber) {
                    tempArray.push(floor.flat)
                }
            })
        })
        setCurrentCableFlats(tempArray)
        setSchedules({
            ...schedules,
            cableNumber, 
            flats: tempArray,
        })
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
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading building data...</p>
                </div>
            </div>
        )
    }
    return (
        <div className="buildingPageContainer">
            <h1>Building Page {building.name && `- ${building.name}`}</h1>
            <form onSubmit={submit}>
                {formFields.map((form, i) => {
                    return (
                        <div className="block-card" key={`block-${i}-${form.blockType}`}>
                            <h3>Block {i + 1}</h3>
                            <div className="form-group">
                                <label htmlFor={`topFloor-${i}`}>Choose Top Floor</label>
                                <select
                                    id={`topFloor-${i}`}
                                    name="topFloor"
                                    onChange={(event) => handleFloors(event, i)}
                                    value={form.topFloor}
                                    className="form-select"
                                >
                                    {FLOOR_OPTIONS.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="schemasContainer">
                                <div className="wingContainer">
                                    <label htmlFor={`leftWing${i}`}>
                                        <input
                                            id={`leftWing${i}`}
                                            type="checkbox"
                                            name="blockType"
                                            value="leftWing"
                                            checked={form.blockType === 'leftWing'}
                                            onChange={(e) => handleBlockType(e, i)}
                                        />
                                        <LeftWing form={form}/>
                                    </label>
                                </div>
                                <div className="noStairsContainer">
                                    <label htmlFor={`noStairs${i}`}>
                                        <input
                                            id={`noStairs${i}`}
                                            type="checkbox"
                                            name="blockType"
                                            value="noStairs"
                                            checked={form.blockType === 'noStairs'}
                                            onChange={(e) => handleBlockType(e, i)}
                                        />
                                        <NoStairs form={form}/>
                                    </label>
                                </div>
                                <div className="wingContainer">
                                    <label htmlFor={`rightWing${i}`}>
                                        <input
                                            id={`rightWing${i}`}
                                            type="checkbox"
                                            name="blockType"
                                            value="rightWing"
                                            checked={form.blockType === 'rightWing'}
                                            onChange={(e) => handleBlockType(e, i)}
                                        />
                                        <RightWing form={form}/>
                                    </label>
                                </div>
                            </div>
                            <button 
                                className="btn btn-danger"
                                onClick={(e) => removeFields(e, i)}
                                disabled={formFields.length === 1}
                            >
                                Remove Block
                            </button>
                        </div>
                    )
                })}
            </form>
            <div className="button-group">
                <button className="btn btn-secondary" onClick={addFields}>
                    + Add More Block
                </button>
                <button 
                    className="btn btn-primary" 
                    onClick={submit}
                    disabled={isSaving}
                >
                    {isSaving ? 'Saving...' : (isLayoutNew ? 'Create Layout' : 'Update Layout')}
                </button>
            </div>
            
            <h2>Completed Layout of the Building</h2>
            <div className="completeSchemaContainer">
                {formFields.map((form, index) => (
                    <div
                        key={`schema-${index}-${form.blockType}`}
                        className={`${form.blockType === 'leftWing' ||
                        form.blockType === 'rightWing' ||
                        form.blockType === 'leftWingNoBG' ||
                        form.blockType === 'rightWingNoBG' ||
                        form.blockType === 'leftWingFlat' ||
                        form.blockType === 'rightWingFlat'
                            ? 'wingContainer'
                            : ''
                        }
            ${form.blockType === 'noStairs' ? 'noStairsContainer' : ''}`}
                    >
                        <ConditionalFullSchema
                            form={form}
                            building={building}
                            parentIndex={index}
                            formFields={formFields}
                            handleFlatDetails={handleFlatDetails}
                        />
                    </div>
                ))}
            </div>
            
            <div className="cablesContainer">
                <button className="btn btn-secondary" onClick={getCableNumbers}>
                    Show Cable Numbers
                </button>
                <div className="cableNumbersContainer">
                    {cableNumbers.map((cableNum) => (
                        <button
                            className={`cable-btn ${cableNum === currentCable ? 'selectedCable' : ''}`}
                            key={`cable-${cableNum}`}
                            onClick={() => {
                                setCurrentCable(cableNum)
                                selectedFlats(cableNum)
                            }}
                        >
                            Cable {cableNum}
                        </button>
                    ))}
                </div>
                {currentCableFlats.length > 0 && (
                    <div className="currentCableFlatsContainer">
                        <h4>Connected Flats:</h4>
                        <div className="flats-list">
                            {currentCableFlats.map((flat, index) => (
                                <span key={`flat-${flat}-${index}`} className="flat-badge">{flat}</span>
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
