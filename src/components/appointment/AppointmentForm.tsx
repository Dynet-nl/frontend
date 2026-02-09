// Form component for entering appointment details (date, time, personnel selection)

import React, { FormEvent, ChangeEvent } from 'react';

interface AppointmentData {
    date: string;
    startTime: string;
    endTime: string;
    weekNumber: number | string;
    type?: string;
    hasMonteurName?: string;
    technischeSchouwerName?: string;
    complaintDetails?: string;
}

interface Personnel {
    _id: string;
    name: string;
}

interface AppointmentFormProps {
    appointmentData: AppointmentData;
    onAppointmentChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
    onCancel?: () => void;
    availablePersonnel?: Personnel[];
    isHASScheduling?: boolean;
    loading?: boolean;
    canSubmit?: boolean;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
    appointmentData,
    onAppointmentChange,
    onSubmit,
    onCancel,
    availablePersonnel = [],
    isHASScheduling = false,
    loading = false,
    canSubmit = true
}) => {
    return (
        <div className="usc-appointmentForm">
            <h3>Set {isHASScheduling ? 'HAS' : 'Technical Planning'} Appointment Details</h3>
            <form onSubmit={onSubmit}>
                {/* Appointment Type (HAS only) */}
                {isHASScheduling && (
                    <div className="usc-formGroup">
                        <label>Appointment Type:</label>
                        <div className="usc-radioGroup">
                            {['HAS', 'Storing', 'Complaint'].map(type => (
                                <label key={type} className="usc-radioLabel">
                                    <input
                                        type="radio"
                                        name="type"
                                        value={type}
                                        checked={appointmentData.type === type}
                                        onChange={onAppointmentChange}
                                    />
                                    {type}
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Complaint Details (HAS Complaint only) */}
                {isHASScheduling && appointmentData.type === 'Complaint' && (
                    <div className="usc-formGroup">
                        <label>Complaint Details:</label>
                        <textarea
                            name="complaintDetails"
                            value={appointmentData.complaintDetails || ''}
                            onChange={onAppointmentChange}
                            className="usc-textarea"
                            rows={4}
                            placeholder="Enter complaint details"
                            required={appointmentData.type === 'Complaint'}
                        />
                    </div>
                )}

                {/* Date */}
                <div className="usc-formGroup">
                    <label>Appointment Date:</label>
                    <input
                        type="date"
                        name="date"
                        value={appointmentData.date}
                        onChange={onAppointmentChange}
                        className="usc-input"
                        required
                    />
                </div>

                {/* Time Range */}
                <div className="usc-formRow">
                    <div className="usc-formGroup">
                        <label>Start Time:</label>
                        <input
                            type="time"
                            name="startTime"
                            value={appointmentData.startTime}
                            onChange={onAppointmentChange}
                            className="usc-input"
                            required
                        />
                    </div>
                    <div className="usc-formGroup">
                        <label>End Time:</label>
                        <input
                            type="time"
                            name="endTime"
                            value={appointmentData.endTime}
                            onChange={onAppointmentChange}
                            className="usc-input"
                            required
                        />
                    </div>
                </div>

                {/* Week Number (readonly) */}
                <div className="usc-formGroup">
                    <label>Week Number:</label>
                    <input
                        type="number"
                        name="weekNumber"
                        value={appointmentData.weekNumber || ''}
                        readOnly
                        className="usc-input usc-readonly"
                    />
                </div>

                {/* Personnel Selection */}
                <div className="usc-formGroup">
                    <label>
                        {isHASScheduling ? 'HAS Monteur:' : 'Technische Schouwer:'}
                    </label>
                    <select
                        name={isHASScheduling ? 'hasMonteurName' : 'technischeSchouwerName'}
                        value={isHASScheduling ? appointmentData.hasMonteurName || '' : appointmentData.technischeSchouwerName || ''}
                        onChange={onAppointmentChange}
                        className="usc-select"
                        required
                    >
                        <option value="">
                            Select a {isHASScheduling ? 'HAS Monteur' : 'Technische Schouwer'}
                        </option>
                        {availablePersonnel.map(person => (
                            <option key={person._id} value={person.name}>
                                {person.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Action Buttons */}
                <div className="usc-buttonGroup">
                    <button
                        type="submit"
                        className="usc-saveButton"
                        disabled={loading || !canSubmit}
                    >
                        {loading ? 'Saving...' : 'Save Appointment'}
                    </button>
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="usc-cancelButton"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default AppointmentForm;
