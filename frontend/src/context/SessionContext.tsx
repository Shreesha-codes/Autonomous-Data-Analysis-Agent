import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface IFileMetadata {
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export interface IInteraction {
  question: string;
  generatedCode: string;
  executionResult: any;
  chartData: any;
  narrative: any;
  timestamp: string;
}

export interface ISession {
  sessionId: string;
  createdAt: string;
  filesUploaded: IFileMetadata[];
  interactions: IInteraction[];
  dataProfile?: Record<string, any> | null;
}

interface SessionContextType {
  sessions: ISession[];
  activeSession: ISession | null;
  loading: boolean;
  error: string | null;
  fetchSessions: () => Promise<void>;
  fetchSessionById: (sessionId: string) => Promise<void>;
  createSession: (sessionId: string, filesUploaded?: IFileMetadata[]) => Promise<ISession | null>;
  addInteraction: (
    sessionId: string,
    interactionData: Omit<IInteraction, 'timestamp'>
  ) => Promise<void>;
  uploadFile: (sessionId: string, file: File) => Promise<boolean>;
  setActiveSession: (session: ISession | null) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const API_BASE = 'http://localhost:5000/api/sessions';

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<ISession[]>([]);
  const [activeSession, setActiveSessionState] = useState<ISession | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE);
      const json = await res.json();
      if (json.success) {
        setSessions(json.data);
      } else {
        setError(json.error || 'Failed to fetch sessions');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to connect to the backend server');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionById = async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${sessionId}`);
      const json = await res.json();
      if (json.success) {
        setActiveSessionState(json.data);
      } else {
        setError(json.error || 'Failed to fetch session');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch session');
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (sessionId: string, filesUploaded?: IFileMetadata[]): Promise<ISession | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, filesUploaded })
      });
      const json = await res.json();
      if (json.success) {
        setSessions(prev => [json.data, ...prev]);
        setActiveSessionState(json.data);
        return json.data;
      } else {
        setError(json.error || 'Failed to create session');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to create session');
    } finally {
      setLoading(false);
    }
    return null;
  };

  const addInteraction = async (
    sessionId: string,
    interactionData: Omit<IInteraction, 'timestamp'>
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${sessionId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interactionData)
      });
      const json = await res.json();
      if (json.success) {
        // Update both the active session and the sessions history list
        setActiveSessionState(json.data);
        setSessions(prev => prev.map(s => s.sessionId === sessionId ? json.data : s));
      } else {
        setError(json.error || 'Failed to add interaction');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to add interaction');
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (sessionId: string, file: File): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/${sessionId}/upload`, {
        method: 'POST',
        body: formData
      });
      const json = await res.json();
      if (json.success) {
        setActiveSessionState(json.data);
        setSessions(prev => prev.map(s => s.sessionId === sessionId ? json.data : s));
        return true;
      } else {
        setError(json.error || 'Failed to upload file');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to backend failed during upload');
    } finally {
      setLoading(false);
    }
    return false;
  };

  const setActiveSession = (session: ISession | null) => {
    setActiveSessionState(session);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <SessionContext.Provider
      value={{
        sessions,
        activeSession,
        loading,
        error,
        fetchSessions,
        fetchSessionById,
        createSession,
        addInteraction,
        uploadFile,
        setActiveSession
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSessions = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSessions must be used within a SessionProvider');
  }
  return context;
};
