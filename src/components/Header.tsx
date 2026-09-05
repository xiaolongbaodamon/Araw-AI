import React, { useState, useEffect } from 'react';
import { Sparkles, MessageSquareText, Layers, RotateCcw, ShieldCheck, Timer, User as UserIcon, LogOut, LogIn } from 'lucide-react';
import { LifeBalanceIndex } from '../types';
import { BrandMark } from './BrandMark';

interface HeaderProps {
  balanceIndex: LifeBalanceIndex;
  onOpenCoach: () => void;
  onOpenDecomposer: () => void;
  onOpenRules?: () => void;
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
    <header className="border-b border-[#d8e1da] bg-[#fbfdfb]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[4.5rem] flex items-center justify-between gap-4">
        {/* Brand & Mission */}
        <div className="flex items-center gap-3">
          <BrandMark />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[#17352a]">Araw</h1>
            <p className="hidden sm:block text-[10px] uppercase tracking-[0.16em] text-[#748378] font-bold">Personal operating system</p>
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
          {isAuthenticated ? (
            <>
              {/* Live Balance Pill */}
                  <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#edf5ee] border border-[#d5e5d8] text-xs">
                    <ShieldCheck className="w-4 h-4 text-[#2f7657]" />
                    <span className="text-[#53665a] font-medium">Balance</span>
                    <span className="font-bold text-[#17352a]">{balanceIndex.overallScore}<span className="text-[#7b8a80] font-medium">/100</span></span>
              </div>

              {/* Goal Decomposer button */}
              <button
                onClick={onOpenDecomposer}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-[#f1f6f1] text-[#53665a] border border-[#d4dfd6] flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Break Down Goal</span>
              </button>

              {/* Coach trigger */}
              <button
                onClick={onOpenCoach}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#17352a] hover:bg-[#234b3b] text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <MessageSquareText className="w-3.5 h-3.5 text-amber-400" />
                <span>Coach</span>
              </button>

              {/* User Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-[#d4dfd6] hover:bg-[#f1f6f1] text-xs font-semibold text-[#294638] transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-[#17352a] text-lime-300 flex items-center justify-center text-[11px] font-bold">
                    {(userName || 'U')[0].toUpperCase()}
                  </div>
                  <span className="hidden md:inline max-w-[120px] truncate">{userName || 'Account'}</span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 text-xs animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 border-b border-stone-100">
                      <p className="font-bold text-stone-900 truncate">{userName || 'Active User'}</p>
                      <p className="text-[11px] text-stone-500 truncate">{userEmail || 'Signed In'}</p>
                    </div>

                    <div className="border-t border-stone-100 py-1">
                      <button
                        onClick={() => {
                          onResetData();
                          setUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-stone-50 text-stone-700 flex items-center gap-2 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
                        <span>Reset Workspace Records</span>
                      </button>
                    </div>

                    <div className="border-t border-stone-100 pt-1">
                      <button
                        onClick={() => {
                          onSignOut?.();
                          setUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 font-semibold flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
};
