import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsValidChessMove(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isValidChessMove',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    if (typeof value !== 'string') {
                        return false;
                    }

                    // Chess move format: e2e4, e7e8q (promotion), O-O (kingside castling), O-O-O (queenside castling)
                    const movePattern = /^([a-h][1-8][a-h][1-8][qrbn]?|O-O|O-O-O)$/;

                    return movePattern.test(value);
                },
                defaultMessage(args: ValidationArguments) {
                    return `${args.property} must be a valid chess move in algebraic notation (e.g., e2e4, e7e8q, O-O)`;
                },
            },
        });
    };
} 