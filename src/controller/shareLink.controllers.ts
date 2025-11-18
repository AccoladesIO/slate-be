import { Request, Response, NextFunction } from 'express';
import ShareLink from '../models/shareLink.model';
import Presentation from '../models/presentation.model';
import User from '../models/user.model';
import { doHash, doHashValidation } from '../utils/hashing';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

/**
 * Create a shareable link for a presentation
 */
export const createShareLink = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: presentationId } = req.params;
    const userId = req.user?.id;
    const {
      accessLevel = 'read',
      password,
      expiresAt,
      expiresInDays,
      maxViews,
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Check if user owns the presentation
    const presentation = await Presentation.findOne({
      where: { id: presentationId, userId },
    });

    if (!presentation) {
      return res.status(404).json({
        success: false,
        message: 'Presentation not found or you do not have permission',
      });
    }

    // Calculate expiration date
    let expirationDate: Date | null = null;
    if (expiresAt) {
      expirationDate = new Date(expiresAt);
    } else if (expiresInDays) {
      expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + Number(expiresInDays));
    }

    // Hash password if provided
    let hashedPassword: string | null = null;
    if (password && password.trim().length > 0) {
      hashedPassword = await doHash(password, 12);
    }

    // Create share link
    const shareLink = await ShareLink.create({
      presentationId,
      accessLevel,
      password: hashedPassword,
      expiresAt: expirationDate,
      maxViews: maxViews || null,
      createdByUserId: userId,
      isActive: true,
    });

    // Return link without password hash
    const { password: _, ...linkData } = shareLink.toJSON();

    return res.status(201).json({
      success: true,
      message: 'Share link created successfully',
      data: {
        ...linkData,
        url: `${process.env.CLIENT_URL}/shared/${shareLink.token}`,
        hasPassword: !!hashedPassword,
      },
    });
  } catch (error) {
    console.error('Create share link error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create share link',
    });
  }
};

/**
 * Access presentation via share link
 */
export const accessViaShareLink = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Find share link
    const shareLink = await ShareLink.findOne({
      where: { token },
      include: [
        {
          model: Presentation,
          as: 'presentation',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email'],
            },
          ],
        },
      ],
    });

    if (!shareLink) {
      return res.status(404).json({
        success: false,
        message: 'Share link not found',
      });
    }

    // Check if link is valid
    if (!shareLink.isValid()) {
      const reason = !shareLink.isActive
        ? 'This link has been deactivated'
        : shareLink.expiresAt && new Date() > shareLink.expiresAt
        ? 'This link has expired'
        : 'This link has reached its maximum view limit';

      return res.status(403).json({
        success: false,
        message: reason,
      });
    }

    // Check password if required
    if (shareLink.password) {
      if (!password) {
        return res.status(401).json({
          success: false,
          message: 'Password required',
          requiresPassword: true,
        });
      }

      const isPasswordValid = await doHashValidation(password, shareLink.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect password',
          requiresPassword: true,
        });
      }
    }

    // Increment view count
    await shareLink.increment('viewCount');

    // Return presentation data
    const { password: _, ...linkData } = shareLink.toJSON();

    return res.status(200).json({
      success: true,
      data: {
        presentation: shareLink.presentation,
        accessLevel: shareLink.accessLevel,
        shareLink: linkData,
      },
    });
  } catch (error) {
    console.error('Access share link error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to access share link',
    });
  }
};

/**
 * Get all share links for a presentation
 */
export const getPresentationShareLinks = async (
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

    // Check if user owns the presentation
    const presentation = await Presentation.findOne({
      where: { id: presentationId, userId },
    });

    if (!presentation) {
      return res.status(404).json({
        success: false,
        message: 'Presentation not found or you do not have permission',
      });
    }

    // Get all share links
    const shareLinks = await ShareLink.findAll({
      where: { presentationId },
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
    });

    // Add status to each link
    const linksWithStatus = shareLinks.map((link: { toJSON: () => any; isValid: () => any; token: any; password: any; }) => ({
      ...link.toJSON(),
      isValid: link.isValid(),
      url: `${process.env.CLIENT_URL}/shared/${link.token}`,
      hasPassword: !!link.password,
    }));

    return res.status(200).json({
      success: true,
      data: linksWithStatus,
    });
  } catch (error) {
    console.error('Get share links error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch share links',
    });
  }
};

/**
 * Update a share link
 */
export const updateShareLink = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { linkId } = req.params;
    const userId = req.user?.id;
    const { accessLevel, password, expiresAt, maxViews, isActive } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Find share link and check ownership
    const shareLink = await ShareLink.findOne({
      where: { id: linkId },
      include: [
        {
          model: Presentation,
          as: 'presentation',
          where: { userId },
        },
      ],
    });

    if (!shareLink) {
      return res.status(404).json({
        success: false,
        message: 'Share link not found or you do not have permission',
      });
    }

    // Build update object
    const updateData: any = {};

    if (accessLevel !== undefined) updateData.accessLevel = accessLevel;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (maxViews !== undefined) updateData.maxViews = maxViews;

    // Update password if provided
    if (password !== undefined) {
      if (password && password.trim().length > 0) {
        updateData.password = await doHash(password, 12);
      } else {
        updateData.password = null;
      }
    }

    await shareLink.update(updateData);

    const { password: _, ...linkData } = shareLink.toJSON();

    return res.status(200).json({
      success: true,
      message: 'Share link updated successfully',
      data: {
        ...linkData,
        hasPassword: !!shareLink.password,
      },
    });
  } catch (error) {
    console.error('Update share link error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update share link',
    });
  }
};

/**
 * Delete/revoke a share link
 */
export const deleteShareLink = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { linkId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Find share link and check ownership
    const shareLink = await ShareLink.findOne({
      where: { id: linkId },
      include: [
        {
          model: Presentation,
          as: 'presentation',
          where: { userId },
        },
      ],
    });

    if (!shareLink) {
      return res.status(404).json({
        success: false,
        message: 'Share link not found or you do not have permission',
      });
    }

    await shareLink.destroy();

    return res.status(200).json({
      success: true,
      message: 'Share link deleted successfully',
    });
  } catch (error) {
    console.error('Delete share link error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete share link',
    });
  }
};

/**
 * Get share link analytics
 */
export const getShareLinkAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { linkId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Find share link and check ownership
    const shareLink = await ShareLink.findOne({
      where: { id: linkId },
      include: [
        {
          model: Presentation,
          as: 'presentation',
          where: { userId },
        },
      ],
    });

    if (!shareLink) {
      return res.status(404).json({
        success: false,
        message: 'Share link not found or you do not have permission',
      });
    }

    const analytics = {
      totalViews: shareLink.viewCount,
      maxViews: shareLink.maxViews,
      remainingViews: shareLink.maxViews ? shareLink.maxViews - shareLink.viewCount : null,
      expiresAt: shareLink.expiresAt,
      isExpired: shareLink.expiresAt ? new Date() > shareLink.expiresAt : false,
      isActive: shareLink.isActive,
      createdAt: shareLink.createdAt,
    };

    return res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
    });
  }
};