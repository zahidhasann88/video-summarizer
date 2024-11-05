import express from 'express';
import { summarizeVideo } from '../controllers/summarizeController';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/summarize', upload.single('file'), summarizeVideo);

export default router;
