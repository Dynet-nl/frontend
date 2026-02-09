// Reusable form input component with validation feedback.

import React, { useState, useEffect } from 'react';
import { ValidationRule, validateField } from '../utils/validation';
import '../styles/formInput.css';

interface FormInputProps {
    id: string;
    name: string;
    label: string;
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
    placeholder?: string;
    rules?: ValidationRule[];
    disabled?: boolean;
    required?: boolean;
    autoComplete?: string;
    className?: string;
    showValidation?: boolean;
    validateOnBlur?: boolean;
    validateOnChange?: boolean;
    externalError?: string;
}

const FormInput: React.FC<FormInputProps> = ({
    id,
    name,
    label,
    type = 'text',
    value,
    onChange,
    onBlur,
    placeholder,
    rules = [],
    disabled = false,
    required = false,
    autoComplete,
    className = '',
    showValidation = true,
    validateOnBlur = true,
    validateOnChange = false,
    externalError,
}) => {
    const [touched, setTouched] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [isValid, setIsValid] = useState(true);

    const validate = (val: string): void => {
        if (rules.length === 0) {
            setIsValid(true);
            setErrors([]);
            return;
        }

        const result = validateField(val, rules);
        setIsValid(result.isValid);
        setErrors(result.errors);
    };

    useEffect(() => {
        if (externalError) {
            setErrors([externalError]);
            setIsValid(false);
            setTouched(true);
        }
    }, [externalError]);

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>): void => {
        setTouched(true);
        if (validateOnBlur && showValidation) {
            validate(value);
        }
        onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        onChange(e);
        if (validateOnChange && touched && showValidation) {
            validate(e.target.value);
        } else if (touched && !isValid) {
            // Re-validate to clear errors when user starts typing
            validate(e.target.value);
        }
    };

    const showError = showValidation && touched && !isValid && errors.length > 0;
    const showSuccess = showValidation && touched && isValid && value.length > 0 && rules.length > 0;

    return (
        <div className={`form-input-wrapper ${className}`}>
            <label htmlFor={id} className="form-input-label">
                {label}
                {required && <span className="form-input-required">*</span>}
            </label>
            <div className="form-input-container">
                <input
                    id={id}
                    name={name}
                    type={type}
                    value={value}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    autoComplete={autoComplete}
                    className={`form-input ${showError ? 'form-input-error' : ''} ${showSuccess ? 'form-input-success' : ''}`}
                    aria-invalid={showError}
                    aria-describedby={showError ? `${id}-error` : undefined}
                />
                {showSuccess && (
                    <span className="form-input-icon form-input-icon-success">✓</span>
                )}
                {showError && (
                    <span className="form-input-icon form-input-icon-error">!</span>
                )}
            </div>
            {showError && (
                <div id={`${id}-error`} className="form-input-errors" role="alert">
                    {errors.map((error, index) => (
                        <p key={index} className="form-input-error-message">
                            {error}
                        </p>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FormInput;
