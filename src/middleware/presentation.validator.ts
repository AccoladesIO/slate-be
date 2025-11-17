import joi from 'joi';

export const createPresentationSchema = joi.object({
    title: joi.string().required().max(255),
    description: joi.string().allow(null, '').max(5000),
})

export const registerPresentationSchema = joi.object({
    title: joi.string().required().max(255),
    description: joi.string().allow(null, '').max(5000),
    editorData: joi.object().optional().allow(null),
    excalidrawData: joi.object().optional().allow(null),
    isPublic: joi.boolean().optional(),
    shareAccess: joi.string().valid('read', 'write').optional(),
});