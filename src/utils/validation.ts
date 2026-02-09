// Form validation utilities for consistent validation across the application.

export interface ValidationRule {
    validate: (value: string) => boolean;
    message: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

// Common validation rules
export const required = (fieldName: string): ValidationRule => ({
    validate: (value: string) => value.trim().length > 0,
    message: `${fieldName} is required`,
});

export const minLength = (min: number, fieldName: string): ValidationRule => ({
    validate: (value: string) => value.length >= min,
    message: `${fieldName} must be at least ${min} characters`,
});

export const maxLength = (max: number, fieldName: string): ValidationRule => ({
    validate: (value: string) => value.length <= max,
    message: `${fieldName} must be no more than ${max} characters`,
});

export const email = (): ValidationRule => ({
    validate: (value: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    },
    message: 'Please enter a valid email address',
});

export const password = (): ValidationRule => ({
    validate: (value: string) => {
        // At least 8 characters, one uppercase, one lowercase, one number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        return passwordRegex.test(value);
    },
    message: 'Password must be at least 8 characters with uppercase, lowercase, and a number',
});

export const numeric = (fieldName: string): ValidationRule => ({
    validate: (value: string) => !isNaN(Number(value)) && value.trim() !== '',
    message: `${fieldName} must be a valid number`,
});

export const positiveNumber = (fieldName: string): ValidationRule => ({
    validate: (value: string) => {
        const num = Number(value);
        return !isNaN(num) && num > 0;
    },
    message: `${fieldName} must be a positive number`,
});

export const pattern = (regex: RegExp, message: string): ValidationRule => ({
    validate: (value: string) => regex.test(value),
    message,
});

export const matches = (otherValue: string, fieldName: string): ValidationRule => ({
    validate: (value: string) => value === otherValue,
    message: `${fieldName} does not match`,
});

// Validate a single field against multiple rules
export const validateField = (value: string, rules: ValidationRule[]): ValidationResult => {
    const errors: string[] = [];

    for (const rule of rules) {
        if (!rule.validate(value)) {
            errors.push(rule.message);
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// Validate multiple fields
export interface FieldValidation {
    value: string;
    rules: ValidationRule[];
}

export interface FormValidationResult {
    isValid: boolean;
    errors: Record<string, string[]>;
    firstError: string | null;
}

export const validateForm = (fields: Record<string, FieldValidation>): FormValidationResult => {
    const errors: Record<string, string[]> = {};
    let firstError: string | null = null;

    for (const [fieldName, field] of Object.entries(fields)) {
        const result = validateField(field.value, field.rules);
        if (!result.isValid) {
            errors[fieldName] = result.errors;
            if (!firstError) {
                firstError = result.errors[0];
            }
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        firstError,
    };
};
