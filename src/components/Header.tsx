import React, { useState, useEffect } from 'react';
import { Sun, Sparkles, MessageSquareText, Layers, RotateCcw, ShieldCheck, Timer, Shield, User as UserIcon, LogOut, LogIn } from 'lucide-react';
import { LifeBalanceIndex } from '../types';

interface HeaderProps {
  balanceIndex: LifeBalanceIndex;
  onOpenCoach: () => void;
  onOpenDecomposer: () => void;
  onOpenRules: () => void;
  onSelectPreset: (preset: 'student' | 'freelancer' | 'professional') => void;
  onResetData: () => void;
  activeFocusTaskTitle?: string;
  focusTimerSeconds?: number;
  isFocusRunning?: boolean;
  userName?: string;
  userEmail?: string | null;
  isAuthenticated?: boolean;
  onSignIn?: () => void;
  onTryGuest?: () => void;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  balanceIndex,
  onOpenCoach,
  onOpenDecomposer,
  onOpenRules,
  onSelectPreset,
  onResetData,
  activeFocusTaskTitle,
  focusTimerSeconds = 0,
  isFocusRunning = false,
  userName,
  userEmail,
  isAuthenticated = false,
  onSignIn,
  onTryGuest,
  onSignOut,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [presetOpen, setPresetOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTimerMinSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="border-b border-stone-200 bg-white/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand & Mission */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
            <Sun className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-stone-900">Araw AI</h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                Daily Life OS
              </span>
            </div>
            <p className="text-xs text-stone-700 hidden sm:block">
              Intelligent optimization for Work, School, Health & Financials
            </p>
          </div>
        </div>

        {/* Focus Timer banner if active */}
        {isFocusRunning && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
            <Timer className="w-4 h-4 text-amber-600 animate-pulse" />
            <span>Focus Sprint:</span>
            <span className="font-bold text-amber-700">{formatTimerMinSec(focusTimerSeconds)}</span>
            {activeFocusTaskTitle && (
              <span className="max-w-xs truncate text-stone-700">({activeFocusTaskTitle})</span>
            )}
          </div>
        )}

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Balance Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-100 border border-stone-200 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-stone-700 font-medium">Balance Index:</span>
            <span className="font-bold text-stone-900">{balanceIndex.overallScore}/100</span>
          </div>

          {/* Firebase Rules button */}
          <button
            onClick={onOpenRules}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1.5 transition-colors"
            title="View and copy Firestore security rules"
          >
            <Shield className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden sm:inline">Firebase Rules</span>
          </button>

          {/* Goal Decomposer button */}
          <button
            onClick={onOpenDecomposer}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Deconstruct Goal</span>
          </button>

          {/* 24/7 AI Coach trigger */}
          <button
            onClick={onOpenCoach}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white flex items-center gap-1.5 transition-all shadow-xs"
          >
            <MessageSquareText className="w-3.5 h-3.5 text-amber-400" />
            <span>24/7 AI Coach</span>
          </button>

          {/* Auth Button or User Profile */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-semibold text-stone-800"
              >
                <div className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center text-[10px] font-bold">
                  {(userName || 'U')[0].toUpperCase()}
                </div>
                <span className="hidden md:inline max-w-[100px] truncate">{userName || 'Account'}</span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-stone-200 py-1.5 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-stone-100">
                    <p className="font-bold text-stone-900">{userName || 'Active User'}</p>
                    <p className="text-[11px] text-stone-500 truncate">{userEmail || 'Signed In'}</p>
                  </div>
                  <button
                    onClick={() => {
                      onOpenRules();
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-stone-50 text-stone-700 flex items-center gap-1.5"
                  >
                    <Shield className="w-3.5 h-3.5 text-stone-500" />
                    <span>View Security Rules</span>
                  </button>
                  <button
                    onClick={() => {
                      onSignOut?.();
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 flex items-center gap-1.5 border-t border-stone-100"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onTryGuest}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                title="Try demo immediately with anonymous Firebase session"
              >
                Try Demo
              </button>
              <button
                onClick={onSignIn}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-stone-950 flex items-center gap-1 shadow-2xs transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
