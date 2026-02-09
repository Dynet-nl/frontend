// Enhanced form component with validation, error handling, and improved user experience features.

import React, { useState, useCallback, FormEvent, ChangeEvent, ReactNode, ReactElement } from 'react';
import { debounce } from '../utils/helpers';
import { useNotification } from '../context/NotificationProvider';

type ValidationFunction = (value: unknown) => string | null | undefined;

interface ValidationSchema {
    [key: string]: ValidationFunction;
}

interface FormValues {
    [key: string]: unknown;
}

interface FormErrors {
    [key: string]: string | null | undefined;
}

interface FormTouched {
    [key: string]: boolean;
}

interface EnhancedFormProps {
    children: ReactNode;
    onSubmit: (values: FormValues) => Promise<void>;
    validationSchema?: ValidationSchema;
    className?: string;
    showSuccessMessage?: boolean;
    submitButtonText?: string;
    resetOnSuccess?: boolean;
}

interface ChildProps {
    name?: string;
    value?: unknown;
    error?: string | null;
    touched?: boolean;
    onChange?: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | unknown) => void;
    onBlur?: (e: unknown) => void;
}

const EnhancedForm: React.FC<EnhancedFormProps> = ({
    children,
    onSubmit,
    validationSchema = {},
    className = '',
    showSuccessMessage = true,
    submitButtonText = 'Submit',
    resetOnSuccess = true
}) => {
    const [values, setValues] = useState<FormValues>({});
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<FormTouched>({});
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const { showSuccess, showError } = useNotification();

    const debouncedValidate = useCallback(
        debounce((name: string, value: unknown) => {
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

    const handleInputChange = useCallback((name: string, value: unknown): void => {
        setValues(prev => ({
            ...prev,
            [name]: value
        }));
        if (touched[name]) {
            debouncedValidate(name, value);
        }
    }, [touched, debouncedValidate]);

    const handleInputBlur = useCallback((name: string): void => {
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

    const validateAll = useCallback((): boolean => {
        const newErrors: FormErrors = {};
        let isValid = true;

        Object.keys(validationSchema).forEach(name => {
            const error = validationSchema[name](values[name]);
            if (error) {
                newErrors[name] = error;
                isValid = false;
            }
        });

        setErrors(newErrors);
        setTouched(Object.keys(validationSchema).reduce((acc: FormTouched, key) => {
            acc[key] = true;
            return acc;
        }, {}));

        return isValid;
    }, [values, validationSchema]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
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
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            showError(`Submission failed: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const reset = useCallback((): void => {
        setValues({});
        setErrors({});
        setTouched({});
    }, []);

    const enhancedChildren = React.Children.map(children, child => {
        if (React.isValidElement<ChildProps>(child) && child.props.name) {
            const childName = child.props.name;
            return React.cloneElement(child as ReactElement<ChildProps>, {
                value: values[childName] || '',
                error: errors[childName],
                touched: touched[childName],
                onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | unknown) => {
                    const value = (e && typeof e === 'object' && 'target' in e)
                        ? (e as ChangeEvent<HTMLInputElement>).target.value
                        : e;
                    handleInputChange(childName, value);
                    child.props.onChange?.(e);
                },
                onBlur: (e: unknown) => {
                    handleInputBlur(childName);
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

interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    name: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
    error?: string | null;
    touched?: boolean;
    helpText?: string;
    className?: string;
}

export const EnhancedInput: React.FC<EnhancedInputProps> = ({
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
                aria-invalid={!!hasError}
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

interface EnhancedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    name: string;
    placeholder?: string;
    required?: boolean;
    error?: string | null;
    touched?: boolean;
    helpText?: string;
    rows?: number;
    className?: string;
}

export const EnhancedTextarea: React.FC<EnhancedTextareaProps> = ({
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
                aria-invalid={!!hasError}
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
