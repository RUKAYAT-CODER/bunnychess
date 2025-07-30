import { Test, TestingModule } from '@nestjs/testing';
import { createTestingModule, mockRedis, cleanupTestData } from './setup';
import { SecurityService } from '../libs/common/src/security/security.service';
import { CacheService } from '../libs/common/src/cache/cache.service';

describe('SecurityService', () => {
    let service: SecurityService;

    beforeEach(async () => {
        const module: TestingModule = await createTestingModule([
            // Add any modules needed for testing
        ]).compile();

        service = module.get<SecurityService>(SecurityService);
    });

    afterEach(async () => {
        await cleanupTestData();
    });

    describe('hashPassword', () => {
        it('should hash a password correctly', async () => {
            const password = 'TestPassword123!';
            const hash = await service.hashPassword(password);

            expect(hash).toBeDefined();
            expect(hash).not.toBe(password);
            expect(hash.length).toBeGreaterThan(0);
        });

        it('should generate different hashes for the same password', async () => {
            const password = 'TestPassword123!';
            const hash1 = await service.hashPassword(password);
            const hash2 = await service.hashPassword(password);

            expect(hash1).not.toBe(hash2);
        });
    });

    describe('comparePassword', () => {
        it('should return true for correct password', async () => {
            const password = 'TestPassword123!';
            const hash = await service.hashPassword(password);
            const result = await service.comparePassword(password, hash);

            expect(result).toBe(true);
        });

        it('should return false for incorrect password', async () => {
            const password = 'TestPassword123!';
            const wrongPassword = 'WrongPassword123!';
            const hash = await service.hashPassword(password);
            const result = await service.comparePassword(wrongPassword, hash);

            expect(result).toBe(false);
        });
    });

    describe('validatePasswordStrength', () => {
        it('should validate strong password', () => {
            const password = 'StrongPass123!';
            const result = service.validatePasswordStrength(password);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject weak password', () => {
            const password = 'weak';
            const result = service.validatePasswordStrength(password);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should check for uppercase letter', () => {
            const password = 'lowercase123!';
            const result = service.validatePasswordStrength(password);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one uppercase letter');
        });

        it('should check for lowercase letter', () => {
            const password = 'UPPERCASE123!';
            const result = service.validatePasswordStrength(password);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one lowercase letter');
        });

        it('should check for number', () => {
            const password = 'NoNumbers!';
            const result = service.validatePasswordStrength(password);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one number');
        });

        it('should check for special character', () => {
            const password = 'NoSpecialChar123';
            const result = service.validatePasswordStrength(password);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one special character');
        });
    });

    describe('generateToken', () => {
        it('should generate tokens of specified length', () => {
            const length = 16;
            const token = service.generateToken(length);

            expect(token).toBeDefined();
            expect(token.length).toBe(length * 2); // hex encoding doubles the length
        });

        it('should generate different tokens', () => {
            const token1 = service.generateToken(16);
            const token2 = service.generateToken(16);

            expect(token1).not.toBe(token2);
        });
    });

    describe('isValidEmail', () => {
        it('should validate correct email formats', () => {
            const validEmails = [
                'test@example.com',
                'user.name@domain.co.uk',
                'user+tag@example.org',
            ];

            validEmails.forEach(email => {
                expect(service.isValidEmail(email)).toBe(true);
            });
        });

        it('should reject invalid email formats', () => {
            const invalidEmails = [
                'invalid-email',
                '@example.com',
                'user@',
                'user@.com',
                'user..name@example.com',
            ];

            invalidEmails.forEach(email => {
                expect(service.isValidEmail(email)).toBe(false);
            });
        });
    });

    describe('sanitizeInput', () => {
        it('should remove HTML tags', () => {
            const input = '<script>alert("xss")</script>';
            const sanitized = service.sanitizeInput(input);

            expect(sanitized).toBe('scriptalert("xss")/script');
        });

        it('should remove javascript protocol', () => {
            const input = 'javascript:alert("xss")';
            const sanitized = service.sanitizeInput(input);

            expect(sanitized).toBe('alert("xss")');
        });

        it('should remove event handlers', () => {
            const input = 'onclick="alert(\'xss\')"';
            const sanitized = service.sanitizeInput(input);

            expect(sanitized).toBe('"alert(\'xss\')"');
        });

        it('should trim whitespace', () => {
            const input = '  test input  ';
            const sanitized = service.sanitizeInput(input);

            expect(sanitized).toBe('test input');
        });
    });
}); 