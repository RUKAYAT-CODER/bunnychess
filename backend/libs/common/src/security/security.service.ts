import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class SecurityService {
    private readonly logger = new Logger(SecurityService.name);
    private readonly saltRounds = 12;

    /**
     * Hash a password using bcrypt
     */
    async hashPassword(password: string): Promise<string> {
        try {
            return await bcrypt.hash(password, this.saltRounds);
        } catch (error) {
            this.logger.error('Error hashing password', error);
            throw new Error('Failed to hash password');
        }
    }

    /**
     * Compare a password with its hash
     */
    async comparePassword(password: string, hash: string): Promise<boolean> {
        try {
            return await bcrypt.compare(password, hash);
        } catch (error) {
            this.logger.error('Error comparing password', error);
            return false;
        }
    }

    /**
     * Generate a random token
     */
    generateToken(length: number = 32): string {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Generate a secure random string
     */
    generateSecureString(length: number = 16): string {
        return crypto.randomBytes(length).toString('base64url');
    }

    /**
     * Hash a string using SHA-256
     */
    hashString(input: string): string {
        return crypto.createHash('sha256').update(input).digest('hex');
    }

    /**
     * Validate password strength
     */
    validatePasswordStrength(password: string): {
        isValid: boolean;
        errors: string[];
    } {
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
     * Sanitize user input to prevent XSS
     */
    sanitizeInput(input: string): string {
        return input
            .replace(/[<>]/g, '') // Remove < and >
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, '') // Remove event handlers
            .trim();
    }

    /**
     * Validate email format
     */
    isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Generate a password reset token
     */
    generatePasswordResetToken(): string {
        return this.generateSecureString(32);
    }

    /**
     * Generate a verification token
     */
    generateVerificationToken(): string {
        return this.generateSecureString(24);
    }
} 