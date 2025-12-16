// Reusable Input component with consistent styling, labels, and error states
// Usage: <Input label="Email" type="email" error={errors.email} />

import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import './Input.css';

const Input = forwardRef(({
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
}, ref) => {
    const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    const inputClasses = [
        'ui-input__field',
        error && 'ui-input__field--error',
        icon && 'ui-input__field--with-icon',
        className
    ].filter(Boolean).join(' ');

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
});

Input.displayName = 'Input';

Input.propTypes = {
    label: PropTypes.string,
    type: PropTypes.string,
    placeholder: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    error: PropTypes.string,
    helperText: PropTypes.string,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    readOnly: PropTypes.bool,
    icon: PropTypes.node,
    className: PropTypes.string,
    id: PropTypes.string,
    name: PropTypes.string,
};

export default Input;
