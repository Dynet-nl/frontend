// Form fields: label + control + hint/error.

import React, { useId } from 'react';
import Icon from './Icon';

interface FieldProps {
    label?: string;
    hint?: string;
    error?: string;
    required?: boolean;
    className?: string;
    children: (id: string) => React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({ label, hint, error, required, className = '', children }) => {
    const id = useId();
    return (
        <div className={`field ${error ? 'field--error' : ''} ${className}`.trim()}>
            {label && (
                <label className="field__label" htmlFor={id}>
                    {label}
                    {required && <span aria-hidden="true"> *</span>}
                </label>
            )}
            {children(id)}
            {error ? (
                <div className="field__error" role="alert">
                    <Icon name="error" size="dense" />
                    {error}
                </div>
            ) : hint ? (
                <div className="field__hint">{hint}</div>
            ) : null}
        </div>
    );
};

type Size = 'default' | 'dense' | 'touch';
const sizeClass = (base: string, size?: Size) => (size && size !== 'default' ? `${base} ${base}--${size}` : base);

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
    size?: Size;
    mono?: boolean;
    icon?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ size, mono, icon, className = '', ...rest }, ref) => {
    const input = <input ref={ref} className={`${sizeClass('input', size)} ${mono ? 'input--mono' : ''} ${className}`.trim()} {...rest} />;
    if (!icon) return input;
    return (
        <div className="input-with-icon">
            <Icon name={icon} />
            {input}
        </div>
    );
});
Input.displayName = 'Input';

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
    size?: Size;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ size, className = '', children, ...rest }, ref) => (
    <select ref={ref} className={`${sizeClass('select', size)} ${className}`.trim()} {...rest}>
        {children}
    </select>
));
Select.displayName = 'Select';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className = '', ...rest }, ref) => (
    <textarea ref={ref} className={`textarea ${className}`.trim()} {...rest} />
));
Textarea.displayName = 'Textarea';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: React.ReactNode;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, className = '', ...rest }) => (
    <label className={`check-label ${className}`.trim()}>
        <input type="checkbox" className="checkbox" {...rest} />
        {label && <span>{label}</span>}
    </label>
);

interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, label, disabled }) => (
    <label className="check-label">
        <button type="button" role="switch" aria-checked={checked} className="switch" onClick={() => onChange(!checked)} disabled={disabled} aria-label={label} />
        {label && <span className="t-small">{label}</span>}
    </label>
);
