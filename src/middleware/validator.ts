import joi from 'joi';

export const signupSchema = joi.object({
    email: joi.string()
        .email({ tlds: { allow: ['com', 'net', 'org', 'edu', 'io'] } })
        .required(),

    password: joi.string()
        .required()
        .pattern(
            new RegExp(
                '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-={}\\[\\]:;"\'<>,.?/~`|\\\\]).{8,64}$'
            )
        )
        .messages({
            'string.pattern.base':
                'Password must contain at least one uppercase letter, one lowercase letter, one number, one special character, and be between 8–64 characters long.',
        }),

    name: joi.string().required()
});


export const signinSchema = joi.object({
    email: joi.string()
        .email({ tlds: { allow: ['com', 'net', 'org', 'edu', 'io'] } })
        .required(),

    password: joi.string()
        .required()
        .pattern(
            new RegExp(
                '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-={}\\[\\]:;"\'<>,.?/~`|\\\\]).{8,64}$'
            )
        )
        .messages({
            'string.pattern.base':
                'Password must contain at least one uppercase letter, one lowercase letter, one number, one special character, and be between 8–64 characters long.',
        }),
});


export const validationCodeSchema = joi.object({
    email: joi.string()
        .email({ tlds: { allow: ['com', 'net', 'org', 'edu', 'io'] } })
        .required(),
    code: joi.number()
        .required(),
});


export const changePasswordSchema = joi.object({
    newPassword: joi.string()
        .required()
        .pattern(
            new RegExp(
                '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-={}\\[\\]:;"\'<>,.?/~`|\\\\]).{8,64}$'
            )
        ),
    oldPassword: joi.string()
        .required()
        .pattern(
            new RegExp(
                '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-={}\\[\\]:;"\'<>,.?/~`|\\\\]).{8,64}$'
            )
        )
})

export const validateForgotPasswordCodeSchema = joi.object({
    email: joi.string()
        .email({ tlds: { allow: ['com', 'net', 'org', 'edu', 'io'] } })
        .required(),
    code: joi.number()
        .required(),
    newPassword: joi.string()
        .required()
        .pattern(
            new RegExp(
                '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-={}\\[\\]:;"\'<>,.?/~`|\\\\]).{8,64}$'
            )
        ),
});


