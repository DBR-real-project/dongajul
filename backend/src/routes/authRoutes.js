import express from 'express';
import { login } from '../controllers/authController.js';

const router = express.Router();

// POST /api/login
router.post('/login', login);

// 회원가입
router.post('/register', register);

export default router;