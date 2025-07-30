import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsStrongPassword(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isStrongPassword',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    if (typeof value !== 'string') {
                        return false;
                    }

                    // Password must be at least 8 characters long
                    if (value.length < 8) {
                        return false;
                    }

                    // Must contain at least one uppercase letter
                    if (!/[A-Z]/.test(value)) {
                        return false;
                    }

                    // Must contain at least one lowercase letter
                    if (!/[a-z]/.test(value)) {
                        return false;
                    }

                    // Must contain at least one number
                    if (!/\d/.test(value)) {
                        return false;
                    }

                    // Must contain at least one special character
                    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
                        return false;
                    }

                    return true;
                },
                defaultMessage(args: ValidationArguments) {
                    return `${args.property} must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character`;
                },
            },
        });
    };
} 