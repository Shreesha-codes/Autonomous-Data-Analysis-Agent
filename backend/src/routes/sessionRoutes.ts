import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import * as xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import { Session } from '../models/Session';
import { profileDataset } from '../utils/profiler';
import { generateCodeFromQuery } from '../utils/llm';
import { executePythonCode } from '../utils/sandbox';

const router = Router();

// In-memory fallback database for offline sandbox testing
const memorySessions: any[] = [];

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

// Ensure uploads folder exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Get all sessions
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json({ success: true, data: memorySessions });
      return;
    }
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
    if (mongoose.connection.readyState !== 1) {
      const session = memorySessions.find(s => s.sessionId === sessionId);
      if (!session) {
        res.status(404).json({ success: false, error: 'Session not found (Memory)' });
        return;
      }
      res.json({ success: true, data: session });
      return;
    }
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
    if (mongoose.connection.readyState !== 1) {
      const existing = memorySessions.find(s => s.sessionId === sessionId);
      if (existing) {
        res.status(400).json({ success: false, error: 'Session already exists (Memory)' });
        return;
      }
      const session = {
        sessionId,
        createdAt: new Date(),
        filesUploaded: filesUploaded || [],
        interactions: [],
        dataProfile: null
      };
      memorySessions.unshift(session);
      res.status(201).json({ success: true, data: session });
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

    let session: any = null;
    if (mongoose.connection.readyState !== 1) {
      session = memorySessions.find(s => s.sessionId === sessionId);
    } else {
      session = await Session.findOne({ sessionId });
    }

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

    // Write file to local uploads directory
    const filePath = path.join(uploadsDir, `${sessionId}_${req.file.originalname}`);
    fs.writeFileSync(filePath, buffer);

    // Run automatic data profiling engine
    const profile = profileDataset(parsedData);

    // Update session
    const fileMetadata = {
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedAt: new Date(),
      filePath
    };

    if (mongoose.connection.readyState !== 1) {
      session.filesUploaded = [fileMetadata];
      session.dataProfile = profile;
    } else {
      session.filesUploaded = [fileMetadata];
      session.dataProfile = profile;
      await session.save();
    }

    res.json({ success: true, data: session });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'File upload failed' });
  }
});

// Stepper-integrated execution endpoint with correction loop
router.post('/:sessionId/query', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { question } = req.body;

    if (!question) {
      res.status(400).json({ success: false, error: 'question is required' });
      return;
    }

    let session: any = null;
    if (mongoose.connection.readyState !== 1) {
      session = memorySessions.find(s => s.sessionId === sessionId);
    } else {
      session = await Session.findOne({ sessionId });
    }

    if (!session) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    if (!session.filesUploaded || session.filesUploaded.length === 0) {
      res.status(400).json({ success: false, error: 'No dataset uploaded for this session yet' });
      return;
    }

    const fileMeta = session.filesUploaded[0];
    const filePath = fileMeta.filePath || path.join(uploadsDir, `${sessionId}_${fileMeta.fileName}`);

    const logs: { status: string; message: string; timestamp: string }[] = [];

    logs.push({
      status: 'translating',
      message: 'Translating plain English query to Pandas code...',
      timestamp: new Date().toISOString()
    });

    let attempt = 0;
    const maxAttempts = 3;
    let success = false;
    let code = '';
    let narrativeSummary = '';
    let keyInsights: string[] = [];
    let limitations: string[] = [];
    let nextSteps: string[] = [];
    let chartConfig: any = null;
    let stdout = '';
    let stderr = '';

    while (attempt < maxAttempts && !success) {
      attempt++;
      if (attempt > 1) {
        logs.push({
          status: 'correcting',
          message: `Error caught. Retrying code patch self-correction (Attempt ${attempt - 1}/3)...`,
          timestamp: new Date().toISOString()
        });
      }

      // Generate Python code
      const llmResult = await generateCodeFromQuery(
        question,
        session.dataProfile,
        filePath,
        attempt > 1 ? code : undefined,
        attempt > 1 ? stderr : undefined,
        session.interactions
      );

      code = llmResult.code;
      narrativeSummary = llmResult.narrativeSummary;
      keyInsights = llmResult.keyInsights;
      limitations = llmResult.limitations;
      nextSteps = llmResult.nextSteps;
      chartConfig = llmResult.chartConfig;

      logs.push({
        status: 'executing',
        message: `Executing generated code in isolated environment (Attempt ${attempt})...`,
        timestamp: new Date().toISOString()
      });

      // Run sandbox execution
      const execution = await executePythonCode(code, sessionId);
      stdout = execution.stdout;
      stderr = execution.stderr;

      if (execution.success && !stderr) {
        success = true;
        logs.push({
          status: 'completed',
          message: 'Code sandbox execution completed successfully!',
          timestamp: new Date().toISOString()
        });
      } else {
        console.warn(`[Self-Correction Loop] Attempt ${attempt} failed with stderr:`, stderr);
      }
    }

    if (!success) {
      logs.push({
        status: 'failed',
        message: `Self-correction loop failed after ${maxAttempts} attempts.`,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        success: false,
        error: 'Execution sandbox failed after self-correction retries.',
        logs,
        failedCode: code,
        stderr
      });
      return;
    }

    // Attempt to parse stdout as JSON
    let executionResult: any = null;
    try {
      executionResult = JSON.parse(stdout);
    } catch {
      executionResult = { rawStdout: stdout };
    }

    // Add successfully executed interaction to session
    const interaction = {
      question,
      generatedCode: code,
      executionResult,
      chartData: {
        chartType: chartConfig?.chartType || 'bar',
        chartTitle: chartConfig?.chartTitle || 'Query Analysis',
        xAxisLabel: chartConfig?.xAxisLabel || 'x',
        yAxisLabel: chartConfig?.yAxisLabel || 'y',
        data: Array.isArray(executionResult) ? executionResult : []
      },
      narrative: {
        summary: narrativeSummary,
        keyInsights,
        limitations,
        nextSteps
      },
      timestamp: new Date()
    };

    if (mongoose.connection.readyState !== 1) {
      session.interactions.push(interaction);
    } else {
      session.interactions.push(interaction);
      await session.save();
    }

    res.json({
      success: true,
      data: session,
      logs,
      interaction
    });
  } catch (error) {
    next(error);
  }
});

export default router;
