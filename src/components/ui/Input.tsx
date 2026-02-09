// Reusable Input component with consistent styling, labels, and error states
// Usage: <Input label="Email" type="email" error={errors.email} />

import React, { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import './Input.css';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string;
    error?: string;
    helperText?: string;
    icon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            type = 'text',
            placeholder,
            value,
            onChange,
            onBlur,
            error,
            helperText,
            required = false,
            disabled = false,
            readOnly = false,
            icon = null,
            className = '',
            id,
            name,
            ...props
        },
        ref
    ) => {
        const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;

        const inputClasses = ['ui-input__field', error && 'ui-input__field--error', icon && 'ui-input__field--with-icon', className]
            .filter(Boolean)
            .join(' ');

        return (
            <div className="ui-input">
                {label && (
                    <label htmlFor={inputId} className="ui-input__label">
                        {label}
                        {required && <span className="ui-input__required">*</span>}
                    </label>
                )}
                <div className="ui-input__wrapper">
                    {icon && <span className="ui-input__icon">{icon}</span>}
                    <input
                        ref={ref}
                        id={inputId}
                        name={name}
                        type={type}
                        placeholder={placeholder}
                        value={value}
                        onChange={onChange}
                        onBlur={onBlur}
                        disabled={disabled}
                        readOnly={readOnly}
                        required={required}
                        className={inputClasses}
                        aria-invalid={!!error}
                        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
                        {...props}
                    />
                </div>
                {error && (
                    <span id={`${inputId}-error`} className="ui-input__error" role="alert">
                        {error}
                    </span>
                )}
                {helperText && !error && (
                    <span id={`${inputId}-helper`} className="ui-input__helper">
                        {helperText}
                    </span>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
