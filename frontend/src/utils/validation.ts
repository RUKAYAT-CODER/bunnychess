export interface ValidationRule {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => boolean | string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export class ValidationUtils {
    /**
     * Validate email format
     */
    static isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate password strength
     */
    static validatePassword(password: string): ValidationResult {
        const errors: string[] = [];

        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }

        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }

        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }

        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }

        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Validate username
     */
    static validateUsername(username: string): ValidationResult {
        const errors: string[] = [];

        if (username.length < 3) {
            errors.push('Username must be at least 3 characters long');
        }

        if (username.length > 20) {
            errors.push('Username must be less than 20 characters long');
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            errors.push('Username can only contain letters, numbers, underscores, and hyphens');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Validate chess move format
     */
    static validateChessMove(move: string): ValidationResult {
        const errors: string[] = [];

        // Chess move format: e2e4, e7e8q (promotion), O-O (kingside castling), O-O-O (queenside castling)
        const movePattern = /^([a-h][1-8][a-h][1-8][qrbn]?|O-O|O-O-O)$/;

        if (!movePattern.test(move)) {
            errors.push('Invalid chess move format. Use algebraic notation (e.g., e2e4, e7e8q, O-O)');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Validate game time format
     */
    static validateGameTime(time: string): ValidationResult {
        const errors: string[] = [];

        // Format: "10+0", "5+3", "3+2", etc.
        const timePattern = /^(\d+)\+(\d+)$/;
        const match = time.match(timePattern);

        if (!match) {
            errors.push('Invalid time format. Use format like "10+0" (minutes+increment)');
            return {
                isValid: false,
                errors,
            };
        }

        const minutes = parseInt(match[1]);
        const increment = parseInt(match[2]);

        if (minutes < 1 || minutes > 60) {
            errors.push('Game time must be between 1 and 60 minutes');
        }

        if (increment < 0 || increment > 30) {
            errors.push('Time increment must be between 0 and 30 seconds');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Generic validation function
     */
    static validate(value: any, rules: ValidationRule): ValidationResult {
        const errors: string[] = [];

        // Required check
        if (rules.required && (!value || value.toString().trim() === '')) {
            errors.push('This field is required');
            return { isValid: false, errors };
        }

        // Skip other validations if value is empty and not required
        if (!value || value.toString().trim() === '') {
            return { isValid: true, errors };
        }

        const stringValue = value.toString();

        // Min length check
        if (rules.minLength && stringValue.length < rules.minLength) {
            errors.push(`Minimum length is ${rules.minLength} characters`);
        }

        // Max length check
        if (rules.maxLength && stringValue.length > rules.maxLength) {
            errors.push(`Maximum length is ${rules.maxLength} characters`);
        }

        // Pattern check
        if (rules.pattern && !rules.pattern.test(stringValue)) {
            errors.push('Invalid format');
        }

        // Custom validation
        if (rules.custom) {
            const customResult = rules.custom(value);
            if (typeof customResult === 'string') {
                errors.push(customResult);
            } else if (!customResult) {
                errors.push('Invalid value');
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Sanitize user input
     */
    static sanitizeInput(input: string): string {
        return input
            .replace(/[<>]/g, '') // Remove < and >
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, '') // Remove event handlers
            .trim();
    }

    /**
     * Format validation errors for display
     */
    static formatErrors(errors: string[]): string {
        return errors.join(', ');
    }
} 