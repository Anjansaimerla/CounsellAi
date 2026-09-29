import {
  AuditAction,
  CounselorAssignment,
  CounselorScope,
  Department,
  EntityStatus,
  AcademicYear,
  Section,
  User,
  UserRole,
} from '@/types';
import { hashPassword, verifyPassword } from './password';

export interface AuthSession {
  user: {
    id: string;
    name: string;
    username: string;
    role: UserRole;
    status: EntityStatus;
    email?: string;
  };
  scope?: CounselorScope | null;
  token: string;
  expiresAt: number;
}

const SESSION_STORAGE_KEY = 'counsellai_auth_session_v1';
const LOGIN_ATTEMPTS_KEY = 'counsellai_login_attempts_v1';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 1 minute lockout

export class AuthService {
  private currentSession: AuthSession | null = null;
  private subscribers: Array<(session: AuthSession | null) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadSession();
    }
  }

  public subscribe(callback: (session: AuthSession | null) => void): () => void {
    this.subscribers.push(callback);
    callback(this.currentSession);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== callback);
    };
  }

  private notify() {
    for (const sub of this.subscribers) {
      sub(this.currentSession);
    }
  }

  public getSession(): AuthSession | null {
    if (this.currentSession) {
      if (Date.now() > this.currentSession.expiresAt) {
        this.logout('Session expired');
        return null;
      }
    }
    return this.currentSession;
  }

  public isAuthenticated(): boolean {
    return Boolean(this.getSession());
  }

  public isAdmin(): boolean {
    const session = this.getSession();
    return session?.user.role === 'ADMIN';
  }

  public isCounselor(): boolean {
    const session = this.getSession();
    return session?.user.role === 'COUNSELLOR';
  }

  public getActiveScope(): CounselorScope | null {
    const session = this.getSession();
    return session?.scope || null;
  }

  private loadSession() {
    try {
      const data = localStorage.getItem(SESSION_STORAGE_KEY);
      if (data) {
        const parsed: AuthSession = JSON.parse(data);
        if (Date.now() < parsed.expiresAt) {
          this.currentSession = parsed;
        } else {
          localStorage.removeItem(SESSION_STORAGE_KEY);
          this.currentSession = null;
        }
      }
    } catch (e) {
      console.error('Failed to load auth session:', e);
      this.currentSession = null;
    }
  }

  private saveSession(session: AuthSession | null) {
    if (typeof window === 'undefined') return;
    if (session) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
    this.currentSession = session;
    this.notify();
  }

  public setSession(session: AuthSession) {
    this.saveSession(session);
  }

  public logout(reason?: string) {
    this.saveSession(null);
  }

  // Rate Limiting on Login Attempts
  public checkRateLimit(username: string): { allowed: boolean; remainingSeconds?: number } {
    if (typeof window === 'undefined') return { allowed: true };
    try {
      const attemptsData = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
      if (!attemptsData) return { allowed: true };

      const records: Record<string, { count: number; lockedUntil?: number }> =
        JSON.parse(attemptsData);
      const userRecord = records[username.toLowerCase()];

      if (!userRecord) return { allowed: true };

      if (userRecord.lockedUntil && Date.now() < userRecord.lockedUntil) {
        const remainingSeconds = Math.ceil((userRecord.lockedUntil - Date.now()) / 1000);
        return { allowed: false, remainingSeconds };
      }

      return { allowed: true };
    } catch {
      return { allowed: true };
    }
  }

  public recordFailedAttempt(username: string) {
    if (typeof window === 'undefined') return;
    try {
      const key = username.toLowerCase();
      const attemptsData = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
      const records: Record<string, { count: number; lockedUntil?: number }> = attemptsData
        ? JSON.parse(attemptsData)
        : {};

      const current = records[key] || { count: 0 };
      current.count += 1;

      if (current.count >= MAX_LOGIN_ATTEMPTS) {
        current.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
      }

      records[key] = current;
      localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(records));
    } catch (e) {
      console.error('Error recording failed attempt:', e);
    }
  }

  public clearFailedAttempts(username: string) {
    if (typeof window === 'undefined') return;
    try {
      const key = username.toLowerCase();
      const attemptsData = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
      if (attemptsData) {
        const records = JSON.parse(attemptsData);
        delete records[key];
        localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(records));
      }
    } catch (e) {
      console.error('Error clearing failed attempts:', e);
    }
  }
}

export const authService = new AuthService();
