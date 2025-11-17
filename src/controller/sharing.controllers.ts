import { Request, Response, NextFunction } from 'express';
import Presentation from '../models/presentation.model';
import SharedPresentation from '../models/sharedPresentation.model';
import User from '../models/user.model';
import { Op } from 'sequelize';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

/**
 * Share presentation with a specific user
 */
export const sharePresentation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: presentationId } = req.params;
    const { email, accessLevel = 'read' } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    if (!['read', 'write'].includes(accessLevel)) {
      return res.status(400).json({
        success: false,
        message: 'Access level must be either "read" or "write"',
      });
    }

    // Check if presentation exists and user is the owner
    const presentation = await Presentation.findOne({
      where: { id: presentationId, userId },
    });

    if (!presentation) {
      return res.status(404).json({
        success: false,
        message: 'Presentation not found or you do not have permission',
      });
    }

    // Find user to share with
    const userToShareWith = await User.findOne({ where: { email } });

    if (!userToShareWith) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email',
      });
    }

    // Prevent sharing with yourself
    if (userToShareWith.id === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot share presentation with yourself',
      });
    }

    // Check if already shared
    const existingShare = await SharedPresentation.findOne({
      where: {
        presentationId,
        sharedWithUserId: userToShareWith.id,
      },
    });

    if (existingShare) {
      // Update existing share
      await existingShare.update({ accessLevel });

      return res.status(200).json({
        success: true,
        message: 'Share access updated successfully',
        data: existingShare,
      });
    }

    // Create new share
    const share = await SharedPresentation.create({
      presentationId,
      sharedWithUserId: userToShareWith.id,
      sharedByUserId: userId,
      accessLevel,
    });

    return res.status(201).json({
      success: true,
      message: 'Presentation shared successfully',
      data: share,
    });
  } catch (error) {
    console.error('Share presentation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to share presentation',
    });
  }
};

/**
 * Remove user access to a presentation
 */
export const revokeAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: presentationId } = req.params;
    const { userId: userIdToRevoke } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!userIdToRevoke) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    // Check if presentation exists and user is the owner
    const presentation = await Presentation.findOne({
      where: { id: presentationId, userId },
    });

    if (!presentation) {
      return res.status(404).json({
        success: false,
        message: 'Presentation not found or you do not have permission',
      });
    }

    // Find and delete the share
    const share = await SharedPresentation.findOne({
      where: {
        presentationId,
        sharedWithUserId: userIdToRevoke,
      },
    });

    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Share not found',
      });
    }

    await share.destroy();

    return res.status(200).json({
      success: true,
      message: 'Access revoked successfully',
    });
  } catch (error) {
    console.error('Revoke access error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to revoke access',
    });
  }
};

/**
 * Get all users who have access to a presentation
 */
export const getPresentationShares = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: presentationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Check if presentation exists and user is the owner
    const presentation = await Presentation.findOne({
      where: { id: presentationId, userId },
    });

    if (!presentation) {
      return res.status(404).json({
        success: false,
        message: 'Presentation not found or you do not have permission',
      });
    }

    // Get all shares
    const shares = await SharedPresentation.findAll({
      where: { presentationId },
      include: [
        {
          model: User,
          as: 'sharedWith',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      data: shares,
    });
  } catch (error) {
    console.error('Get shares error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch shares',
    });
  }
};

/**
 * Get all presentations shared with the current user
 */
export const getSharedWithMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: shares } = await SharedPresentation.findAndCountAll({
      where: { sharedWithUserId: userId },
      include: [
        {
          model: Presentation,
          as: 'presentation',
          attributes: ['id', 'title', 'description', 'isPublic', 'createdAt', 'updatedAt'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email'],
            },
          ],
        },
      ],
      limit: Number(limit),
      offset: offset,
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      data: {
        shares,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get shared with me error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch shared presentations',
    });
  }
};

/**
 * Update presentation visibility (public/private)
 */
export const updatePresentationVisibility = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: presentationId } = req.params;
    const { isPublic } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (typeof isPublic !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isPublic must be a boolean',
      });
    }

    // Check if presentation exists and user is the owner
    const presentation = await Presentation.findOne({
      where: { id: presentationId, userId },
    });

    if (!presentation) {
      return res.status(404).json({
        success: false,
        message: 'Presentation not found or you do not have permission',
      });
    }

    await presentation.update({ isPublic });

    return res.status(200).json({
      success: true,
      message: `Presentation is now ${isPublic ? 'public' : 'private'}`,
      data: presentation,
    });
  } catch (error) {
    console.error('Update visibility error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update visibility',
    });
  }
};

/**
 * Get all public presentations
 */
export const getPublicPresentations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereClause: any = { isPublic: true };

    // Add search functionality
    if (search && typeof search === 'string') {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows: presentations } = await Presentation.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
      limit: Number(limit),
      offset: offset,
      order: [['updatedAt', 'DESC']],
      attributes: ['id', 'title', 'description', 'isPublic', 'createdAt', 'updatedAt'],
    });

    return res.status(200).json({
      success: true,
      data: {
        presentations,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get public presentations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch public presentations',
    });
  }
};