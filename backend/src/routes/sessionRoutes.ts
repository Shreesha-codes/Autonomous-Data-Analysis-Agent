import { Router, Request, Response, NextFunction } from 'express';
import { Session } from '../models/Session';

const router = Router();

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
