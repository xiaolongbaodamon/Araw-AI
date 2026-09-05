import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Droplets,
  Moon,
  Zap,
  Eye,
  Wind,
  Coffee,
  CheckCircle,
  Clock,
  Sparkles,
  Play,
  Square,
  Bed,
  Sun,
  AlertTriangle,
  Heart,
} from 'lucide-react';
import { HealthState } from '../types';

interface HealthGuardianProps {
  health: HealthState;
  onUpdateHealth: (updates: Partial<HealthState>) => void;
  onTakeScreenBreak: () => void;
}

export const HealthGuardian: React.FC<HealthGuardianProps> = ({
  health,
  onUpdateHealth,
  onTakeScreenBreak,
}) => {
  // Box breathing exercise modal state
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale');
  const [breathTimer, setBreathTimer] = useState(4);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);

  // Sleep hours state
  const [sleepInput, setSleepInput] = useState<string>(String(health.sleepHours || 7));
  const [bedTime, setBedTime] = useState<string>(health.bedTime || '23:00');
  const [wakeTime, setWakeTime] = useState<string>(health.wakeTime || '06:30');
  const [sleepQuality, setSleepQuality] = useState<'poor' | 'fair' | 'good' | 'optimal'>(
    health.sleepQuality || 'good'
  );

  // Keep local sleepInput in sync if prop changes
  useEffect(() => {
    setSleepInput(String(health.sleepHours || 7));
  }, [health.sleepHours]);

  // Box breathing cycle effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (breathingActive) {
      interval = setInterval(() => {
        setBreathTimer((prev) => {
          if (prev > 1) return prev - 1;

          // Phase transition
          setBreathPhase((currentPhase) => {
            if (currentPhase === 'Inhale') return 'Hold';
            if (currentPhase === 'Hold') return 'Exhale';
            if (currentPhase === 'Exhale') return 'Rest';
            setCyclesCompleted((c) => c + 1);
            return 'Inhale';
          });
          return 4;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [breathingActive]);

  const handleSaveSleep = (hours: number, quality?: 'poor' | 'fair' | 'good' | 'optimal') => {
    const validHours = Math.max(0, Math.min(24, Math.round(hours * 10) / 10));
    setSleepInput(String(validHours));
    onUpdateHealth({
      sleepHours: validHours,
      sleepQuality: quality || sleepQuality,
      bedTime,
      wakeTime,
    });
  };

  const handleCalculateFromTimes = () => {
    if (!bedTime || !wakeTime) return;
    const [bH, bM] = bedTime.split(':').map(Number);
    const [wH, wM] = wakeTime.split(':').map(Number);
    let diffMinutes = (wH * 60 + wM) - (bH * 60 + bM);
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60; // crossed midnight
    }
    const calculatedHours = Math.round((diffMinutes / 60) * 10) / 10;
    handleSaveSleep(calculatedHours);
  };

  const addWater = () => {
    if (health.waterGlasses < 15) {
      onUpdateHealth({ waterGlasses: health.waterGlasses + 1 });
    }
  };

  const removeWater = () => {
    if (health.waterGlasses > 0) {
      onUpdateHealth({ waterGlasses: health.waterGlasses - 1 });
    }
  };

  const setEnergy = (level: 1 | 2 | 3 | 4 | 5) => {
    onUpdateHealth({ energyLevel: level });
  };

  const formatMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const isOverScreenLimit = health.continuousWorkMinutes >= 75;
  const isSleepDeficit = health.sleepHours < 7.0;

  return (
    <div className="space-y-6">
      {/* Health & Sleep Header */}
      <div className="rounded-2xl bg-white border border-stone-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-stone-900">
              Health & Sleep
            </h2>
            <p className="text-xs text-stone-500 max-w-xl">
              Log daily sleep hours, hydration, and screen time breaks.
            </p>
          </div>

          <button
            onClick={() => setBreathingActive(true)}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Wind className="w-4 h-4 text-emerald-400" />
            <span>Breathing Exercise</span>
          </button>
        </div>
      </div>

      {/* DEDICATED SLEEP HOURS INPUT & RECOVERY LOG */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-stone-900 text-white p-5 lg:p-6 shadow-sm border border-indigo-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-indigo-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Sleep & Rest Hours Log</h3>
                {isSleepDeficit ? (
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-900/60 border border-amber-500/40 px-2 py-0.5 rounded">
                    Deficit: {Math.round((7.5 - health.sleepHours) * 10) / 10}h below baseline
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-900/60 border border-emerald-500/40 px-2 py-0.5 rounded">
                    Optimal Rest ({health.sleepHours} hrs)
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-200">
                Log how many hours you slept last night so the AI coach can adjust your work capacity and study sprints.
              </p>
            </div>
          </div>

          {/* Current Logged Pill */}
          <div className="text-right">
            <div className="text-2xl font-bold font-mono text-white">
              {health.sleepHours} <span className="text-sm font-normal text-indigo-300">hrs</span>
            </div>
            <div className="text-[10px] text-indigo-300">Current Logged Rest</div>
          </div>
        </div>

        {/* Input Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Box 1: Direct Number Input & Stepper */}
          <div className="bg-indigo-950/60 border border-indigo-800/60 rounded-xl p-4 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-indigo-200">
              Hours Slept Last Night
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSaveSleep((health.sleepHours || 7) - 0.5)}
                className="w-9 h-9 rounded-lg bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-base flex items-center justify-center transition-colors border border-indigo-700"
                title="Minus 30 mins"
              >
                -
              </button>
              <div className="flex-1 relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="24"
                  value={sleepInput}
                  onChange={(e) => setSleepInput(e.target.value)}
                  onBlur={(e) => handleSaveSleep(parseFloat(e.target.value) || 7)}
                  className="w-full text-center text-xl font-bold font-mono py-1.5 rounded-lg bg-indigo-900/80 border border-indigo-600 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <span className="absolute right-3 top-2.5 text-xs text-indigo-300 font-medium pointer-events-none">
                  hrs
                </span>
              </div>
              <button
                onClick={() => handleSaveSleep((health.sleepHours || 7) + 0.5)}
                className="w-9 h-9 rounded-lg bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-base flex items-center justify-center transition-colors border border-indigo-700"
                title="Plus 30 mins"
              >
                +
              </button>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-1.5 pt-1">
              {[5, 6, 6.5, 7, 7.5, 8, 8.5, 9].map((hrs) => (
                <button
                  key={hrs}
                  onClick={() => handleSaveSleep(hrs)}
                  className={`flex-1 py-1 rounded text-[11px] font-mono font-medium transition-colors ${
                    health.sleepHours === hrs
                      ? 'bg-amber-400 text-stone-950 font-bold shadow-xs'
                      : 'bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200'
                  }`}
                >
                  {hrs}h
                </button>
              ))}
            </div>
          </div>

          {/* Box 2: Bedtime & Wake Time auto-calc */}
          <div className="bg-indigo-950/60 border border-indigo-800/60 rounded-xl p-4 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-indigo-200">
              Bedtime & Wake Clock
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-indigo-300 flex items-center gap-1 mb-1">
                  <Moon className="w-3 h-3" /> Slept at
                </span>
                <input
                  type="time"
                  value={bedTime}
                  onChange={(e) => setBedTime(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg bg-indigo-900/80 border border-indigo-700 text-xs text-white font-mono"
                />
              </div>
              <div>
                <span className="text-[10px] text-indigo-300 flex items-center gap-1 mb-1">
                  <Sun className="w-3 h-3" /> Woke up at
                </span>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg bg-indigo-900/80 border border-indigo-700 text-xs text-white font-mono"
                />
              </div>
            </div>

            <button
              onClick={handleCalculateFromTimes}
              className="w-full py-1.5 rounded-lg bg-indigo-800 hover:bg-indigo-700 text-indigo-100 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
            >
              <span>Auto-Calculate Hours from Clock</span>
            </button>
          </div>

          {/* Box 3: Sleep Quality & AI Recommendation */}
          <div className="bg-indigo-950/60 border border-indigo-800/60 rounded-xl p-4 space-y-2.5 flex flex-col justify-between">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-indigo-200 mb-1.5">
                Sleep Quality Rating
              </label>
              <div className="grid grid-cols-4 gap-1">
                {(['poor', 'fair', 'good', 'optimal'] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setSleepQuality(q);
                      handleSaveSleep(health.sleepHours, q);
                    }}
                    className={`py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                      sleepQuality === q
                        ? 'bg-amber-400 text-stone-950'
                        : 'bg-indigo-900/60 text-indigo-300 hover:bg-indigo-800'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-indigo-900/80 border border-indigo-700/80 text-[11px] text-indigo-200 leading-relaxed">
              <span className="font-bold text-amber-300">AI Cognitive Impact: </span>
              {isSleepDeficit
                ? 'Sleep debt detected. Limit continuous high-demand study to 25m blocks and prioritize a 15m afternoon recharge.'
                : 'Optimal cellular restoration. Prefrontal cortex ready for complex problem-solving and long-form study.'}
            </div>
          </div>
        </div>
      </div>

      {/* Health Vitals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Screen Time & Continuous Focus */}
        <div className="rounded-xl bg-white border border-stone-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-amber-600" />
              <span>Screen Time</span>
            </span>
            <span className="text-[10px] text-stone-500 font-medium">Logged Today</span>
          </div>

          <div>
            <div className="text-2xl font-bold text-stone-900">
              {formatMins(health.screenTimeMinutes)}
            </div>
            <div className="text-xs text-stone-600 mt-0.5">
              Continuous focus: <span className="font-semibold text-stone-900">{health.continuousWorkMinutes}m</span>
            </div>
          </div>

          {/* Alert if too long */}
          {isOverScreenLimit ? (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <span className="font-bold">Break Required:</span> You've crossed 75 continuous minutes. Eye muscles need 20ft reset.
            </div>
          ) : (
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs">
              Healthy optical rhythm. Break taken every 60-90m.
            </div>
          )}

          <button
            onClick={onTakeScreenBreak}
            className="w-full py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>Record 5m Screen Break</span>
          </button>
        </div>

        {/* Metric 2: Hydration Tracker */}
        <div className="rounded-xl bg-white border border-stone-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-blue-600" />
              <span>Hydration</span>
            </span>
            <span className="text-xs font-semibold text-blue-600">
              {health.waterGlasses}/{health.targetWaterGlasses} glasses
            </span>
          </div>

          <div>
            <div className="text-2xl font-bold text-stone-900">
              {Math.round((health.waterGlasses / health.targetWaterGlasses) * 100)}%
            </div>
            <div className="w-full bg-stone-100 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, (health.waterGlasses / health.targetWaterGlasses) * 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={removeWater}
              className="flex-1 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-xs font-medium text-stone-700"
            >
              - 1 Glass
            </button>
            <button
              onClick={addWater}
              className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
            >
              + 1 Glass
            </button>
          </div>
        </div>

        {/* Metric 3: Energy Level Selector */}
        <div className="rounded-xl bg-white border border-stone-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Energy State</span>
            </span>
            <span className="text-xs font-bold text-amber-700">
              {health.energyLevel === 5
                ? 'Peak'
                : health.energyLevel === 4
                ? 'High'
                : health.energyLevel === 3
                ? 'Steady'
                : health.energyLevel === 2
                ? 'Low'
                : 'Depleted'}
            </span>
          </div>

          <div className="text-2xl font-bold text-stone-900">
            {health.energyLevel} / 5
          </div>

          <div className="flex items-center gap-1 pt-1">
            {([1, 2, 3, 4, 5] as const).map((level) => (
              <button
                key={level}
                onClick={() => setEnergy(level)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  health.energyLevel === level
                    ? 'bg-amber-500 text-stone-950 shadow-2xs scale-105'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-stone-500">
            {health.energyLevel <= 2 ? 'Lighter cognitive load recommended' : 'High alertness for deep work'}
          </div>
        </div>
      </div>

      {/* Box Breathing Guided Modal */}
      {breathingActive && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-5 border border-stone-200 shadow-2xl">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                Parasympathetic Nervous System Calibrator
              </span>
              <h3 className="text-xl font-bold text-stone-900 mt-2">
                4-4-4-4 Box Breathing
              </h3>
              <p className="text-xs text-stone-600">
                Regulates heart rate variability and clears optical tension.
              </p>
            </div>

            {/* Pulsing Breathing Circle */}
            <div className="relative py-6 flex items-center justify-center">
              <div
                className={`w-36 h-36 rounded-full flex flex-col items-center justify-center transition-all duration-1000 shadow-inner ${
                  breathPhase === 'Inhale'
                    ? 'scale-115 bg-emerald-100 border-4 border-emerald-400'
                    : breathPhase === 'Hold'
                    ? 'scale-110 bg-amber-100 border-4 border-amber-400'
                    : breathPhase === 'Exhale'
                    ? 'scale-90 bg-blue-100 border-4 border-blue-400'
                    : 'scale-95 bg-stone-100 border-4 border-stone-300'
                }`}
              >
                <span className="text-sm uppercase font-bold tracking-widest text-stone-800">
                  {breathPhase}
                </span>
                <span className="text-3xl font-mono font-bold text-stone-900 mt-1">
                  {breathTimer}s
                </span>
              </div>
            </div>

            <div className="text-xs text-stone-600">
              Completed cycles: <span className="font-bold text-stone-900">{cyclesCompleted}</span>
            </div>

            <button
              onClick={() => {
                setBreathingActive(false);
                onTakeScreenBreak();
              }}
              className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition-colors"
            >
              Finish Reset & Log Break
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
