'use client';

import React, { useState } from 'react';
import {
  GraduationCap,
  ShieldCheck,
  UserCheck,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  KeyRound,
  Sparkles,
  Building2,
  Users2,
} from 'lucide-react';
import { authService, AuthSession } from '@/lib/auth/auth-service';
import { store } from '@/lib/storage/store';

interface LoginViewProps {
  onLoginSuccess: (session: AuthSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const rateCheck = authService.checkRateLimit(username);
    if (!rateCheck.allowed) {
      setRateLimitSeconds(rateCheck.remainingSeconds || 60);
      setErrorMsg(`Too many failed login attempts. Please wait ${rateCheck.remainingSeconds}s.`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await store.authenticateUser(username, password);
      if (!res) {
        authService.recordFailedAttempt(username);
        setErrorMsg('Invalid username or password, or account is disabled.');
        setIsLoading(false);
        return;
      }

      authService.clearFailedAttempts(username);

      const session: AuthSession = {
        user: {
          id: res.user.id,
          name: res.user.name,
          username: res.user.username,
          role: res.user.role,
          status: res.user.status,
          email: res.user.email,
        },
        scope: res.scope,
        token: `session_${res.user.id}_${Date.now()}`,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      };

      authService.setSession(session);
      store.recordAuditLog({
        user_id: res.user.id,
        username: res.user.username,
        user_role: res.user.role,
        action: 'LOGIN',
        entity_type: 'AUTH',
        metadata: { role: res.user.role, scope: res.scope ? `${res.scope.department_code}_${res.scope.section_name}` : 'GLOBAL' },
      });

      onLoginSuccess(session);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (presetUser: string, presetPass: string) => {
    setUsername(presetUser);
    setPassword(presetPass);
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await store.authenticateUser(presetUser, presetPass);
      if (res) {
        const session: AuthSession = {
          user: {
            id: res.user.id,
            name: res.user.name,
            username: res.user.username,
            role: res.user.role,
            status: res.user.status,
            email: res.user.email,
          },
          scope: res.scope,
          token: `session_${res.user.id}_${Date.now()}`,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        };
        authService.setSession(session);
        store.recordAuditLog({
          user_id: res.user.id,
          username: res.user.username,
          user_role: res.user.role,
          action: 'LOGIN',
          entity_type: 'AUTH',
          metadata: { role: res.user.role, scope: res.scope ? `${res.scope.department_code}_${res.scope.section_name}` : 'GLOBAL' },
        });
        onLoginSuccess(session);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Quick login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100 font-sans">
      {/* Background Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-xl shadow-blue-500/30 text-white mb-3 ring-4 ring-blue-500/20">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            CounselAI
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30">
              Enterprise RBAC
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">
            Role-Based Academic Intervention & Early Risk Intelligence
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Sign In to Workspace</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your authorized credentials to access your portal
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin or counselor.cse2d"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Switcher Section */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Quick Demo Switcher
              </span>
              <span className="text-[10px] text-slate-500">One-click login</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {/* Admin Demo Button */}
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'change-me-immediately')}
                className="w-full text-left p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center text-xs font-bold border border-purple-500/30">
                    AD
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors">
                      Administrator (admin)
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Institution-wide Full Control & Configuration
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-medium border border-purple-500/30">
                  ADMIN
                </span>
              </button>

              {/* Counselor A (CSE 2D) */}
              <button
                type="button"
                onClick={() => handleQuickLogin('counselor.cse2d', 'change-me-immediately')}
                className="w-full text-left p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center text-xs font-bold border border-blue-500/30">
                    C1
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors">
                      Dr. Ravi Kumar (counselor.cse2d)
                    </p>
                    <p className="text-[10px] text-slate-400">
                      CSE • Year 2 • Section D (Counselor 1 of 2)
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-medium border border-blue-500/30">
                  CSE 2-D
                </span>
              </button>

              {/* Counselor B (CSE 2D) */}
              <button
                type="button"
                onClick={() => handleQuickLogin('counselor2.cse2d', 'change-me-immediately')}
                className="w-full text-left p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center text-xs font-bold border border-teal-500/30">
                    C2
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white group-hover:text-teal-400 transition-colors">
                      Prof. Ananya Sharma (counselor2.cse2d)
                    </p>
                    <p className="text-[10px] text-slate-400">
                      CSE • Year 2 • Section D (Counselor 2 of 2 - Shared Scope)
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-medium border border-teal-500/30">
                  CSE 2-D
                </span>
              </button>

              {/* Counselor C (ECE 3A) */}
              <button
                type="button"
                onClick={() => handleQuickLogin('counselor.ece3a', 'change-me-immediately')}
                className="w-full text-left p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs font-bold border border-amber-500/30">
                    C3
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white group-hover:text-amber-400 transition-colors">
                      Dr. Vikram Patel (counselor.ece3a)
                    </p>
                    <p className="text-[10px] text-slate-400">
                      ECE • Year 3 • Section A (Separate Department Scope)
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30">
                  ECE 3-A
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Security Footer Notice */}
        <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Backend enforces scope isolation. Zero client-side permission trust.</span>
        </div>
      </div>
    </div>
  );
};
