import { Schema, model, Document } from 'mongoose';

export interface IFileMetadata {
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface IInteraction {
  question: string;
  generatedCode: string;
  executionResult: Record<string, any> | null;
  chartData: Record<string, any> | null;
  narrative: Record<string, any> | null;
  timestamp: Date;
}

export interface ISession extends Document {
  sessionId: string;
  createdAt: Date;
  filesUploaded: IFileMetadata[];
  interactions: IInteraction[];
  dataProfile?: Record<string, any> | null;
}

const FileMetadataSchema = new Schema<IFileMetadata>({
  fileName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

const InteractionSchema = new Schema<IInteraction>({
  question: { type: String, required: true },
  generatedCode: { type: String, required: true },
  executionResult: { type: Schema.Types.Mixed, default: null },
  chartData: { type: Schema.Types.Mixed, default: null },
  narrative: { type: Schema.Types.Mixed, default: null },
  timestamp: { type: Date, default: Date.now }
});

const SessionSchema = new Schema<ISession>({
  sessionId: { type: String, required: true, unique: true, index: true },
  createdAt: { type: Date, default: Date.now },
  filesUploaded: { type: [FileMetadataSchema], default: [] },
  interactions: { type: [InteractionSchema], default: [] },
  dataProfile: { type: Schema.Types.Mixed, default: null }
});

export const Session = model<ISession>('Session', SessionSchema);
