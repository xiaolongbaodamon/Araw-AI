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

  return (
    <div className="space-y-6">
      {/* Wellness Guardian Manifesto Card */}
      <div className="rounded-2xl bg-white border border-stone-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Active Wellness Guardian</span>
              </span>
              <span className="text-xs text-stone-600">Combating Digital Burnout</span>
            </div>
            <h2 className="text-lg font-bold text-stone-900">
              Health, Screen Limits & Recovery Shield
            </h2>
            <p className="text-xs text-stone-600 max-w-xl">
              "While other apps race to keep people addicted to screens, Araw AI is designed to help you log off. Success is measured in lives improved, not screen time."
            </p>
          </div>

          <button
            onClick={() => setBreathingActive(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors"
          >
            <Wind className="w-4 h-4" />
            <span>1-Minute Nervous System Reset</span>
          </button>
        </div>
      </div>

      {/* Health Vitals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Screen Time & Continuous Focus */}
        <div className="rounded-xl bg-white border border-stone-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-amber-600" />
              <span>Screen Time</span>
            </span>
            <span className="text-[10px] text-stone-600 font-medium">Logged Today</span>
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

        {/* Metric 3: Sleep Duration */}
        <div className="rounded-xl bg-white border border-stone-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <Moon className="w-4 h-4 text-indigo-600" />
              <span>Rest & Sleep</span>
            </span>
            <span className="text-[10px] text-stone-600">Last Night</span>
          </div>

          <div>
            <div className="text-2xl font-bold text-stone-900">
              {health.sleepHours} hrs
            </div>
            <div className="text-xs text-stone-600 mt-0.5">
              {health.sleepHours >= 7 ? 'Full REM & cellular recharge' : 'Deficit noted by AI Coach'}
            </div>
          </div>

          <div className="flex items-center gap-1 pt-1">
            {[6, 6.5, 7, 7.5, 8, 8.5].map((hours) => (
              <button
                key={hours}
                onClick={() => onUpdateHealth({ sleepHours: hours })}
                className={`flex-1 py-1 rounded text-[11px] font-medium transition-colors ${
                  health.sleepHours === hours
                    ? 'bg-indigo-600 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {hours}
              </button>
            ))}
          </div>
        </div>

        {/* Metric 4: Energy Level Selector */}
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
