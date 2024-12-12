import { Router } from 'express';
import AppController from '../controllers/AppController.js';
import UsersController from '../controllers/UsersController.js';

const router = Router();

// AppController routes
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

// UsersController route
router.post('/users', UsersController.postNew);

export default router;
