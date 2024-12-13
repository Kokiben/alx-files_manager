import { Router } from 'express';
import AppController from '../controllers/AppController.js';
import AuthController from '../controllers/AuthController.js';
import UsersController from '../controllers/UsersController.js';
import FilesController from '../controllers/FilesController.js';

const router = Router();

// AppController routes
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

// AuthController and UsersController routes
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe);

// FilesController routes
router.post('/files', FilesController.postUpload);  // Upload a file
router.get('/files/:id', FilesController.getShow);  // Show a file by ID
router.get('/files', FilesController.getIndex);  // List all files
router.put('/files/:id/publish', FilesController.putPublish);  // Publish a file
router.put('/files/:id/unpublish', FilesController.putUnpublish);  // Unpublish a file

export default router;
