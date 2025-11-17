import { Request, Response, NextFunction } from 'express';
import { createPresentationSchema } from '../middleware/presentation.validator';
import { Presentation, SharedPresentation } from '../models';
import { Op } from 'sequelize';

interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
    };
}

/**
 * Helper function to check if user has access to presentation
 */
const checkPresentationAccess = async (
    presentationId: string,
    userId: string,
    requiredAccess: 'read' | 'write' = 'read'
): Promise<{ hasAccess: boolean; presentation: any; accessLevel?: string }> => {
    const presentation = await Presentation.findByPk(presentationId);

    if (!presentation) {
        return { hasAccess: false, presentation: null };
    }

    // Owner has full access
    if (presentation.userId === userId) {
        return { hasAccess: true, presentation, accessLevel: 'owner' };
    }

    // Public presentations are read-only for non-owners
    if (presentation.isPublic) {
        if (requiredAccess === 'write') {
            return { hasAccess: false, presentation, accessLevel: 'read' };
        }
        return { hasAccess: true, presentation, accessLevel: 'read' };
    }

    // Check shared access
    const share = await SharedPresentation.findOne({
        where: {
            presentationId,
            sharedWithUserId: userId,
        },
    });

    if (!share) {
        return { hasAccess: false, presentation, accessLevel: null as unknown as undefined };
    }

    // Check if user has required access level
    if (requiredAccess === 'write' && share.accessLevel === 'read') {
        return { hasAccess: false, presentation, accessLevel: 'read' };
    }

    return { hasAccess: true, presentation, accessLevel: share.accessLevel };
};

export const createPresentationController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const { title, description } = req.body;
    const { id: userId } = req.user!;

    try {
        if (req.method !== 'POST') {
            return res.status(405).json({
                success: false,
                message: "Method not allowed"
            });
        }

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized access"
            });
        }

        const { error } = createPresentationSchema.validate({ title, description });
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        if (!title || title.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Title is required"
            });
        }

        const newPresentation = await Presentation.create({
            title: title.trim(),
            description: description?.trim() || null,
            userId,
            editorData: null,
            excalidrawData: null,
            isPublic: false,
            shareAccess: 'read',
        });

        return res.status(201).json({
            success: true,
            message: "Presentation created successfully",
            data: newPresentation,
        });
    } catch (error) {
        console.error('Create presentation error:', error);
        return res.status(500).json({
            success: false,
            message: "A server error occurred while creating the presentation.",
        });
    }
};

export const getAllPresentationsController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const { id: userId } = req.user!;
    const { page = 1, limit = 10, search } = req.query;

    try {
        if (req.method !== 'GET') {
            return res.status(405).json({
                success: false,
                message: "Method not allowed"
            });
        }

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized access",
            });
        }

        const whereClause: any = { userId };

        // Add search functionality
        if (search && typeof search === 'string') {
            whereClause[Op.or] = [
                { title: { [Op.iLike]: `%${search}%` } },
                { description: { [Op.iLike]: `%${search}%` } },
            ];
        }

        const { count, rows: presentations } = await Presentation.findAndCountAll({
            where: whereClause,
            limit: Number(limit),
            offset: (Number(page) - 1) * Number(limit),
            order: [['updatedAt', 'DESC']],
            attributes: ['id', 'title', 'description', 'isPublic', 'shareAccess', 'createdAt', 'updatedAt'],
        });

        return res.status(200).json({
            success: true,
            message: "Presentations fetched successfully",
            data: {
                presentations: presentations,
                totalItems: count,
                currentPage: Number(page),
                totalPages: Math.ceil(count / Number(limit)),
            }
        });
    } catch (error) {
        console.error('Get presentations error:', error);
        return res.status(500).json({
            success: false,
            message: "A server error occurred while fetching presentations.",
        });
    }
};

export const getPresentationByIdController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const { id: userId } = req.user!;
    const { id } = req.params;

    try {
        if (req.method !== 'GET') {
            return res.status(405).json({
                success: false,
                message: "Method not allowed"
            });
        }

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized access",
            });
        }

        const { hasAccess, presentation, accessLevel } = await checkPresentationAccess(id, userId, 'read');

        if (!hasAccess || !presentation) {
            return res.status(403).json({
                success: false,
                message: 'Access denied or presentation not found',
            });
        }

        return res.status(200).json({
            success: true,
            message: "Presentation fetched successfully",
            data: {
                ...presentation.toJSON(),
                accessLevel, // Include access level in response
            },
        });
    } catch (error) {
        console.error('Get presentation error:', error);
        return res.status(500).json({
            success: false,
            message: "A server error occurred while fetching the presentation.",
        });
    }
};

export const updatePresentationController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const { id: userId } = req.user!;
    const { id } = req.params;
    const { title, description, editorData, excalidrawData, isPublic, shareAccess } = req.body;

    try {
        if (req.method !== 'PUT') {
            return res.status(405).json({
                success: false,
                message: "Method not allowed"
            });
        }

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized access",
            });
        }

        if (title && title.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Title cannot be empty",
            });
        }

        const { hasAccess, presentation, accessLevel } = await checkPresentationAccess(id, userId, 'write');

        if (!hasAccess || !presentation) {
            return res.status(403).json({
                success: false,
                message: accessLevel === 'read'
                    ? 'You only have read access to this presentation'
                    : 'Access denied or presentation not found',
            });
        }

        const updateData: any = {};

        if (title !== undefined) updateData.title = title.trim();
        if (description !== undefined) updateData.description = description?.trim() || null;
        if (editorData !== undefined) updateData.editorData = editorData;
        if (excalidrawData !== undefined) updateData.excalidrawData = excalidrawData;

        // Only owner can change visibility and share access
        if (accessLevel === 'owner') {
            if (isPublic !== undefined) updateData.isPublic = isPublic;
            if (shareAccess !== undefined && ['read', 'write'].includes(shareAccess)) {
                updateData.shareAccess = shareAccess;
            }
        }

        await presentation.update(updateData);

        return res.status(200).json({
            success: true,
            message: "Presentation updated successfully",
            data: presentation,
        });

    } catch (error: unknown) {
        console.error('Update presentation error:', error);
        return res.status(500).json({
            success: false,
            message: "A server error occurred while updating the presentation.",
        });
    }
};

export const deletePresentationController = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const { id: userId } = req.user!;
    const { id } = req.params;

    try {
        if (req.method !== 'DELETE') {
            return res.status(405).json({
                success: false,
                message: 'Method not allowed'
            });
        }

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access',
            });
        }

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Bad request. Presentation ID is required"
            });
        }

        // Only owner can delete
        const presentation = await Presentation.findOne({
            where: { id, userId },
        });

        if (!presentation) {
            return res.status(404).json({
                success: false,
                message: 'Presentation not found or you do not have permission (only owner can delete)',
            });
        }

        await presentation.destroy();

        return res.status(200).json({
            success: true,
            message: "Presentation deleted successfully",
        });
    } catch (error: unknown) {
        console.error('Delete presentation error:', error);
        return res.status(500).json({
            success: false,
            message: "A server error occurred while deleting the presentation.",
        });
    }
};

export const duplicatePresentation = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (req.method !== 'POST') {
            return res.status(405).json({
                success: false,
                message: 'Method not allowed'
            });
        }

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        const { hasAccess, presentation } = await checkPresentationAccess(id, userId, 'read');

        if (!hasAccess || !presentation) {
            return res.status(403).json({
                success: false,
                message: 'Access denied or presentation not found',
            });
        }

        const duplicatedPresentation = await Presentation.create({
            title: `${presentation.title} (Copy)`,
            description: presentation.description,
            editorData: presentation.editorData,
            excalidrawData: presentation.excalidrawData,
            isPublic: false,
            shareAccess: 'read',
            userId, // New owner is the current user
        });

        return res.status(201).json({
            success: true,
            message: 'Presentation duplicated successfully',
            data: duplicatedPresentation,
        });
    } catch (error) {
        console.error('Duplicate presentation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to duplicate presentation',
        });
    }
};