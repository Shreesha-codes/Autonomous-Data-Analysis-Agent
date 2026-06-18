import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import * as xlsx from 'xlsx';
import { Session } from '../models/Session';
import { profileDataset } from '../utils/profiler';

const router = Router();

// Multer memory storage configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /csv|xlsx|json/;
    const extname = filetypes.test(file.originalname.toLowerCase());
    const mimetype = filetypes.test(file.mimetype) || file.originalname.endsWith('.csv') || file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.json');
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only CSV, XLSX, and JSON file formats are supported!'));
  }
});

// Get all sessions
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessions = await Session.find().sort({ createdAt: -1 });
    res.json({ success: true, data: sessions });
  } catch (error) {
    next(error);
  }
});

// Get single session by sessionId
router.get('/:sessionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findOne({ sessionId });
    if (!session) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }
    res.json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
});

// Create new session
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, filesUploaded } = req.body;
    if (!sessionId) {
      res.status(400).json({ success: false, error: 'sessionId is required' });
      return;
    }
    const existingSession = await Session.findOne({ sessionId });
    if (existingSession) {
      res.status(400).json({ success: false, error: 'Session already exists' });
      return;
    }
    const session = new Session({
      sessionId,
      filesUploaded: filesUploaded || [],
      interactions: []
    });
    await session.save();
    res.status(201).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
});

// File upload and profiling endpoint
router.post('/:sessionId/upload', upload.single('file'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sessionId } = req.params;
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }

    const session = await Session.findOne({ sessionId });
    if (!session) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    const buffer = req.file.buffer;
    let parsedData: Record<string, any>[] = [];

    // Parse the file depending on extension
    const fileName = req.file.originalname.toLowerCase();
    if (fileName.endsWith('.json')) {
      const rawData = JSON.parse(buffer.toString('utf-8'));
      parsedData = Array.isArray(rawData) ? rawData : [rawData];
    } else if (fileName.endsWith('.csv') || fileName.endsWith('.xlsx')) {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      parsedData = xlsx.utils.sheet_to_json(worksheet);
    } else {
      res.status(400).json({ success: false, error: 'Unsupported file format' });
      return;
    }

    if (parsedData.length === 0) {
      res.status(400).json({ success: false, error: 'The uploaded file contains no data' });
      return;
    }

    // Run automatic data profiling engine
    const profile = profileDataset(parsedData);

    // Update session
    const fileMetadata = {
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedAt: new Date()
    };

    session.filesUploaded = [fileMetadata]; // single file for now
    session.dataProfile = profile;
    await session.save();

    res.json({ success: true, data: session });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'File upload or parsing failed' });
  }
});

// Add interaction to session
router.post('/:sessionId/interactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const { question, generatedCode, executionResult, chartData, narrative } = req.body;

    if (!question || !generatedCode) {
      res.status(400).json({ success: false, error: 'question and generatedCode are required' });
      return;
    }

    const session = await Session.findOne({ sessionId });
    if (!session) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    const interaction = {
      question,
      generatedCode,
      executionResult: executionResult || null,
      chartData: chartData || null,
      narrative: narrative || null,
      timestamp: new Date()
    };

    session.interactions.push(interaction);
    await session.save();

    res.json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
});

export default router;
