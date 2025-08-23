// Page displaying building lists with filtering, pagination, and building-specific actions.

import React, {useEffect, useState} from 'react'
import {useParams} from 'react-router-dom'
import '../styles/mockupSchemas.css'
import '../styles/dynamicSchemas.css'
import useAxiosPrivate from '../hooks/useAxiosPrivate'
import RightWing from '../mockupSchemas/RightWing'
import LeftWing from '../mockupSchemas/LeftWing'
import NoStairs from '../mockupSchemas/NoStairs'
import ConditionalFullSchema from '../components/ConditionalFullSchema'
import LeftWingNoBG from '../mockupSchemas/LeftWingNoBG'
import RightWingNoBG from '../mockupSchemas/RightWingNoBG'
import LeftWingFlat from '../mockupSchemas/LeftWingFlat'
import RightWingFlat from '../mockupSchemas/RightWingFlat'
import RightWingApart from '../mockupSchemas/RightWingApart'
import LeftWingApart from '../mockupSchemas/LeftWingApart'
import '../styles/buildingPage.css'
const BuildingListPage = () => {
    const params = useParams()
    const axiosPrivate = useAxiosPrivate()
    const [building, setBuilding] = useState({})
    const [isLayoutNew, setLayoutNew] = useState(true)
    const [cableNumbers, setCableNumbers] = useState([])
    const [currentCable, setCurrentCable] = useState('')
    const [currentCableFlats, setCurrentCableFlats] = useState([])
    const [schedules, setSchedules] = useState({
    })
    const [formFields, setFormFields] = useState([
        {
            firstFloor: 0,
            topFloor: '',
            blockType: '',
            floors: [],
        },
    ])
    useEffect(() => {
        const fetchBuilding = async () => {
            const config = {
                method: 'GET',
            }
            const {data} = await axiosPrivate.get(
                `/api/building/${params.id}`,
                config,
            )
            setBuilding(data)
            if (data.layout?.blocks.length) {
                setFormFields(data.layout.blocks)
                setLayoutNew(false)
            }
        }
        fetchBuilding()
    }, [params.id])
    useEffect(() => {
    }, [formFields, cableNumbers, currentCable, schedules, currentCableFlats])
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
        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
        }
        const {data} = isLayoutNew
            ? await axiosPrivate.post(
                `/api/building/layout/${params.id}`,
                formFields,
                config,
            )
            : await axiosPrivate.put(
                `/api/building/layout/${params.id}`,
                formFields,
                config,
            )
    }
    const addFields = () => {
        let object = {
            firstFloor: 0,
            topFloor: '',
            blockType: '',
            floors: [],
        }
        setFormFields([...formFields, object])
    }
    const removeFields = (e, index) => {
        e.preventDefault()
        let data = [...formFields]
        data.splice(index, 1)
        setFormFields(data)
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
                if (floor.cableNumber == cableNumber) {
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
        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
        }
        const {data} = await axiosPrivate.post(
            `/api/schedule/${params.id}`,
            schedules,
            config,
        )
    }
    return (
        <div className="buildingPageContainer">
            <h1>Building Page</h1>
            <form onSubmit={submit}>
                {formFields.map((form, i) => {
                    return (
                        <div style={{margin: '20px 0', backgroundColor: 'wheat'}} key={i}>
                            <h3>{i + 1} block</h3>
                            <div>
                                <label htmlFor="topFloor">Choose Top Floor</label>
                                <select
                                    id="topFloor"
                                    name="topFloor"
                                    placeholder="topFloor"
                                    onChange={(event) => handleFloors(event, i)}
                                    value={form.topFloor}
                                >
                                    <option value={''}></option>
                                    <option value={0}>BG</option>
                                    <option value={1}>1</option>
                                    <option value={2}>2</option>
                                    <option value={3}>3</option>
                                    <option value={4}>4</option>
                                    <option value={5}>5</option>
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
                            <button onClick={(e) => removeFields(e, i)}>Remove</button>
                        </div>
                    )
                })}
            </form>
            <button onClick={addFields}>Add More Block...</button>
            <br></br>
            <br></br>
            <br></br>
            <h2>Completed Layout of the Building</h2>
            <div className="completeSchemaContainer">
                {formFields.map((form, index) => (
                    <div
                        key={index}
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
                            key={index}
                            form={form}
                            building={building}
                            parentIndex={index}
                            formFields={formFields}
                            handleFlatDetails={handleFlatDetails}
                        />
                    </div>
                ))}
            </div>
            <button type="submit" onClick={submit}>
                {isLayoutNew ? 'Create Layout' : 'Update Layout'}
            </button>
            <div className="cablesContainer">
                <button onClick={getCableNumbers}>Show Cable Numbers</button>
                <div className="cableNumbersContainer">
                    {cableNumbers.map((cableNum, index) => {
                        return (
                            <button
                                className={cableNum === currentCable ? 'selectedCable' : ''}
                                key={index}
                                onClick={() => {
                                    setCurrentCable(cableNum)
                                    selectedFlats(cableNum)
                                }}
                            >
                                {cableNum}
                            </button>
                        )
                    })}
                </div>
                <div className="currentCableFlatsContainer">
                    {currentCableFlats.length > 0 &&
                        currentCableFlats.map((flat, index) => {
                            return <p key={index}>{flat}</p>
                        })}
                </div>
                {cableNumbers.length > 0 && (
                    <div style={{
                        background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                        border: '2px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '32px',
                        marginTop: '32px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
                    }}>
                        <h3 style={{
                            color: '#1e293b',
                            fontSize: '24px',
                            fontWeight: '600',
                            margin: '0 0 24px 0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <span style={{fontSize: '24px'}}>📅</span>
                            Schedule Installation
                        </h3>
                        <form onSubmit={sendSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{
                                display: 'grid',
                                gap: '20px',
                                gridTemplateColumns: '1fr',
                                '@media (min-width: 768px)': {
                                    gridTemplateColumns: '1fr 1fr 1fr'
                                }
                            }}>
                                <div>
                                    <label 
                                        htmlFor="date" 
                                        style={{
                                            display: 'block',
                                            marginBottom: '8px',
                                            color: '#374151',
                                            fontSize: '16px',
                                            fontWeight: '500'
                                        }}
                                    >
                                        📅 Installation Date
                                    </label>
                                    <input
                                        onChange={(e) => {
                                            setSchedules({...schedules, date: e.target.value})
                                        }}
                                        type="date"
                                        id="date"
                                        name="date"
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            border: '2px solid #e5e7eb',
                                            borderRadius: '10px',
                                            fontSize: '16px',
                                            fontFamily: 'inherit',
                                            transition: 'all 0.2s ease',
                                            backgroundColor: '#ffffff',
                                            color: '#374151',
                                            outline: 'none',
                                            boxSizing: 'border-box'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#667eea';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#e5e7eb';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label 
                                        htmlFor="from" 
                                        style={{
                                            display: 'block',
                                            marginBottom: '8px',
                                            color: '#374151',
                                            fontSize: '16px',
                                            fontWeight: '500'
                                        }}
                                    >
                                        🕐 Start Time
                                    </label>
                                    <input
                                        onChange={(e) => {
                                            setSchedules({...schedules, from: e.target.value})
                                        }}
                                        type="time"
                                        id="from"
                                        name="from"
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            border: '2px solid #e5e7eb',
                                            borderRadius: '10px',
                                            fontSize: '16px',
                                            fontFamily: 'inherit',
                                            transition: 'all 0.2s ease',
                                            backgroundColor: '#ffffff',
                                            color: '#374151',
                                            outline: 'none',
                                            boxSizing: 'border-box'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#667eea';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#e5e7eb';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label 
                                        htmlFor="till" 
                                        style={{
                                            display: 'block',
                                            marginBottom: '8px',
                                            color: '#374151',
                                            fontSize: '16px',
                                            fontWeight: '500'
                                        }}
                                    >
                                        🕐 End Time
                                    </label>
                                    <input
                                        onChange={(e) => {
                                            setSchedules({...schedules, till: e.target.value})
                                        }}
                                        type="time"
                                        id="till"
                                        name="till"
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            border: '2px solid #e5e7eb',
                                            borderRadius: '10px',
                                            fontSize: '16px',
                                            fontFamily: 'inherit',
                                            transition: 'all 0.2s ease',
                                            backgroundColor: '#ffffff',
                                            color: '#374151',
                                            outline: 'none',
                                            boxSizing: 'border-box'
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#667eea';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#e5e7eb';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                        required
                                    />
                                </div>
                            </div>
                            <button 
                                type="submit"
                                style={{
                                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '14px 28px',
                                    borderRadius: '10px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    justifyContent: 'center',
                                    alignSelf: 'flex-start'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            >
                                <span style={{fontSize: '18px'}}>✅</span>
                                Create Schedule
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}
export default BuildingListPage
