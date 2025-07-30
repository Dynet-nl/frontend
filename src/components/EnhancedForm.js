// Enhanced form component with validation, error handling, and improved user experience features.

import React, { useState, useCallback } from 'react';
import { validators, debounce } from '../utils/helpers';
import { useNotification } from '../context/NotificationProvider';
const EnhancedForm = ({ 
    children, 
    onSubmit, 
    validationSchema = {}, 
    className = '',
    showSuccessMessage = true,
    submitButtonText = 'Submit',
    resetOnSuccess = true
}) => {
    const [values, setValues] = useState({});
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showSuccess, showError } = useNotification();
    const debouncedValidate = useCallback(
        debounce((name, value) => {
            if (validationSchema[name]) {
                const error = validationSchema[name](value);
                setErrors(prev => ({
                    ...prev,
                    [name]: error
                }));
            }
        }, 300),
        [validationSchema]
    );
    const handleInputChange = useCallback((name, value) => {
        setValues(prev => ({
            ...prev,
            [name]: value
        }));
        if (touched[name]) {
            debouncedValidate(name, value);
        }
    }, [touched, debouncedValidate]);
    const handleInputBlur = useCallback((name) => {
        setTouched(prev => ({
            ...prev,
            [name]: true
        }));
        if (validationSchema[name]) {
            const error = validationSchema[name](values[name]);
            setErrors(prev => ({
                ...prev,
                [name]: error
            }));
        }
    }, [values, validationSchema]);
    const validateAll = useCallback(() => {
        const newErrors = {};
        let isValid = true;
        Object.keys(validationSchema).forEach(name => {
            const error = validationSchema[name](values[name]);
            if (error) {
                newErrors[name] = error;
                isValid = false;
            }
        });
        setErrors(newErrors);
        setTouched(Object.keys(validationSchema).reduce((acc, key) => {
            acc[key] = true;
            return acc;
        }, {}));
        return isValid;
    }, [values, validationSchema]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        const isValid = validateAll();
        if (!isValid) {
            showError('Please fix the errors before submitting');
            return;
        }
        setIsSubmitting(true);
        try {
            await onSubmit(values);
            if (showSuccessMessage) {
                showSuccess('Form submitted successfully!');
            }
            if (resetOnSuccess) {
                setValues({});
                setErrors({});
                setTouched({});
            }
        } catch (error) {
            showError(`Submission failed: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };
    const reset = useCallback(() => {
        setValues({});
        setErrors({});
        setTouched({});
    }, []);
    const enhancedChildren = React.Children.map(children, child => {
        if (React.isValidElement(child) && child.props.name) {
            return React.cloneElement(child, {
                value: values[child.props.name] || '',
                error: errors[child.props.name],
                touched: touched[child.props.name],
                onChange: (e) => {
                    const value = e.target ? e.target.value : e;
                    handleInputChange(child.props.name, value);
                    child.props.onChange?.(e);
                },
                onBlur: (e) => {
                    handleInputBlur(child.props.name);
                    child.props.onBlur?.(e);
                }
            });
        }
        return child;
    });
    return (
        <form 
            className={`enhanced-form ${className}`} 
            onSubmit={handleSubmit}
            noValidate
        >
            {enhancedChildren}
            <div className="enhanced-form-actions">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="modern-button modern-button-primary"
                >
                    {isSubmitting ? (
                        <>
                            <span className="modern-spinner"></span>
                            Submitting...
                        </>
                    ) : (
                        submitButtonText
                    )}
                </button>
                <button
                    type="button"
                    onClick={reset}
                    disabled={isSubmitting}
                    className="modern-button modern-button-secondary"
                >
                    Reset
                </button>
            </div>
        </form>
    );
};
export const EnhancedInput = ({ 
    label, 
    name, 
    type = 'text', 
    placeholder = '', 
    required = false,
    error,
    touched,
    helpText,
    className = '',
    ...props 
}) => {
    const hasError = error && touched;
    return (
        <div className={`enhanced-input-group ${className}`}>
            {label && (
                <label 
                    htmlFor={name} 
                    className={`enhanced-label ${required ? 'required' : ''}`}
                >
                    {label}
                    {required && <span className="required-indicator">*</span>}
                </label>
            )}
            <input
                id={name}
                name={name}
                type={type}
                placeholder={placeholder}
                className={`enhanced-input ${hasError ? 'error' : ''}`}
                aria-describedby={`${name}-help ${name}-error`}
                aria-invalid={hasError}
                required={required}
                {...props}
            />
            {helpText && (
                <small id={`${name}-help`} className="enhanced-help-text">
                    {helpText}
                </small>
            )}
            {hasError && (
                <div id={`${name}-error`} className="enhanced-error-text" role="alert">
                    {error}
                </div>
            )}
        </div>
    );
};
export const EnhancedTextarea = ({ 
    label, 
    name, 
    placeholder = '', 
    required = false,
    error,
    touched,
    helpText,
    rows = 4,
    className = '',
    ...props 
}) => {
    const hasError = error && touched;
    return (
        <div className={`enhanced-input-group ${className}`}>
            {label && (
                <label 
                    htmlFor={name} 
                    className={`enhanced-label ${required ? 'required' : ''}`}
                >
                    {label}
                    {required && <span className="required-indicator">*</span>}
                </label>
            )}
            <textarea
                id={name}
                name={name}
                placeholder={placeholder}
                rows={rows}
                className={`enhanced-input enhanced-textarea ${hasError ? 'error' : ''}`}
                aria-describedby={`${name}-help ${name}-error`}
                aria-invalid={hasError}
                required={required}
                {...props}
            />
            {helpText && (
                <small id={`${name}-help`} className="enhanced-help-text">
                    {helpText}
                </small>
            )}
            {hasError && (
                <div id={`${name}-error`} className="enhanced-error-text" role="alert">
                    {error}
                </div>
            )}
        </div>
    );
};
export default EnhancedForm;
