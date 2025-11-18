import { Router } from 'express';
import {
  createShareLink,
  accessViaShareLink,
  getPresentationShareLinks,
  updateShareLink,
  deleteShareLink,
  getShareLinkAnalytics,
} from '../controller/shareLink.controllers';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.post('/access/:token', accessViaShareLink);
// All other routes require authentication
router.use(authMiddleware);

router.post('/presentation/:id', createShareLink);
router.get('/presentation/:id', getPresentationShareLinks);
router.put('/:linkId', updateShareLink);
router.delete('/:linkId', deleteShareLink);
router.get('/:linkId/analytics', getShareLinkAnalytics);

export default router;