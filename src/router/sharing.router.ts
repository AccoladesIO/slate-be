import { Router } from 'express';
import {
  sharePresentation,
  revokeAccess,
  getPresentationShares,
  getSharedWithMe,
  updatePresentationVisibility,
  getPublicPresentations,
} from '../controller/sharing.controllers';
import { authMiddleware } from '../middleware/auth';
// share by email
const router = Router();

// Public route - no auth required
router.get('/public', getPublicPresentations);

// All other routes require authentication
router.use(authMiddleware);

router.get('/shared-with-me', getSharedWithMe);
router.post('/:id/share', sharePresentation);
router.delete('/:id/revoke', revokeAccess);
router.get('/:id/shares', getPresentationShares);
router.patch('/:id/visibility', updatePresentationVisibility);

export default router;