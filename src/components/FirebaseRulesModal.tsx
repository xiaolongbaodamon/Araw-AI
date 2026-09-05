import React, { useState } from 'react';
import { X, Shield, Copy, Check, ExternalLink, Code } from 'lucide-react';

interface FirebaseRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseRulesModal: React.FC<FirebaseRulesModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const rulesContent = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // 1. Global default-deny catch-all to prevent unmapped access
    match /{document=**} {
      allow read, write: if false;
    }

    // Helper functions
    function isValidId(id) {
      return id is string && id.size() > 0 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\\\-]+$');
    }

    function incoming() {
      return request.resource.data;
    }

    function existing() {
      return resource.data;
    }

    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    // Entity validation blueprints
    function isValidUserProfile(data) {
      return data.keys().hasAll(['userId', 'name', 'role', 'onboardingCompleted', 'createdAt'])
        && data.userId == request.auth.uid
        && data.name is string && data.name.size() > 0 && data.name.size() <= 100
        && data.role in ['student', 'professional', 'freelancer', 'other']
        && data.onboardingCompleted is bool
        && data.createdAt is string && data.createdAt.size() <= 50
        && (!('dailyWorkTargetMinutes' in data) || (data.dailyWorkTargetMinutes is number && data.dailyWorkTargetMinutes >= 0 && data.dailyWorkTargetMinutes <= 1440))
        && (!('dailyBudget' in data) || (data.dailyBudget is number && data.dailyBudget >= 0 && data.dailyBudget <= 10000000))
        && (!('weeklyBudget' in data) || (data.weeklyBudget is number && data.weeklyBudget >= 0 && data.weeklyBudget <= 50000000))
        && (!('monthlyBudget' in data) || (data.monthlyBudget is number && data.monthlyBudget >= 0 && data.monthlyBudget <= 100000000))
        && (!('monthlySavingsTarget' in data) || (data.monthlySavingsTarget is number && data.monthlySavingsTarget >= 0 && data.monthlySavingsTarget <= 100000000))
        && (!('currency' in data) || (data.currency is string && data.currency.size() <= 5))
        && (!('wakeTime' in data) || (data.wakeTime is string && data.wakeTime.size() <= 10))
        && (!('bedTime' in data) || (data.bedTime is string && data.bedTime.size() <= 10))
        && (!('primaryGoal' in data) || (data.primaryGoal is string && data.primaryGoal.size() <= 300));
    }

    function isValidTask(data, userId) {
      return data.keys().hasAll(['userId', 'title', 'category', 'completed'])
        && data.userId == userId && data.userId == request.auth.uid
        && data.title is string && data.title.size() > 0 && data.title.size() <= 200
        && data.category in ['work', 'school']
        && data.completed is bool
        && (!('taskType' in data) || data.taskType in ['work_task', 'schoolwork', 'assignment', 'project', 'exam_prep', 'deliverable', 'other'])
        && (!('priority' in data) || data.priority in ['urgent', 'high', 'medium', 'low'])
        && (!('tag' in data) || (data.tag is string && data.tag.size() <= 50))
        && (!('estimatedMinutes' in data) || (data.estimatedMinutes is number && data.estimatedMinutes >= 0 && data.estimatedMinutes <= 1440))
        && (!('dueDate' in data) || (data.dueDate is string && data.dueDate.size() <= 50))
        && (!('dueTime' in data) || (data.dueTime is string && data.dueTime.size() <= 20))
        && (!('createdAt' in data) || (data.createdAt is string && data.createdAt.size() <= 50));
    }

    function isValidHealth(data, userId) {
      return data.keys().hasAll(['userId', 'date'])
        && data.userId == userId && data.userId == request.auth.uid
        && data.date is string && data.date.size() <= 20
        && (!('screenTimeMinutes' in data) || (data.screenTimeMinutes is number && data.screenTimeMinutes >= 0))
        && (!('continuousWorkMinutes' in data) || (data.continuousWorkMinutes is number && data.continuousWorkMinutes >= 0))
        && (!('waterGlasses' in data) || (data.waterGlasses is number && data.waterGlasses >= 0))
        && (!('targetWaterGlasses' in data) || (data.targetWaterGlasses is number && data.targetWaterGlasses >= 0))
        && (!('sleepHours' in data) || (data.sleepHours is number && data.sleepHours >= 0 && data.sleepHours <= 24))
        && (!('sleepQuality' in data) || (data.sleepQuality is string && data.sleepQuality.size() <= 20))
        && (!('bedTime' in data) || (data.bedTime is string && data.bedTime.size() <= 10))
        && (!('wakeTime' in data) || (data.wakeTime is string && data.wakeTime.size() <= 10))
        && (!('breaksTakenToday' in data) || (data.breaksTakenToday is number && data.breaksTakenToday >= 0));
    }

    function isValidTransaction(data, userId) {
      return data.keys().hasAll(['userId', 'amount', 'type', 'category'])
        && data.userId == userId && data.userId == request.auth.uid
        && data.amount is number && data.amount > 0 && data.amount <= 100000000
        && data.type in ['expense', 'savings']
        && data.category is string && data.category.size() > 0 && data.category.size() <= 100
        && (!('note' in data) || (data.note is string && data.note.size() <= 200))
        && (!('date' in data) || (data.date is string && data.date.size() <= 20));
    }

    // User Profile Document
    match /users/{userId} {
      allow get: if isOwner(userId) && isValidId(userId);
      allow create: if isOwner(userId) && isValidId(userId) && isValidUserProfile(incoming());
      allow update: if isOwner(userId) && isValidId(userId) && isValidUserProfile(incoming()) && incoming().userId == existing().userId;
      allow delete: if isOwner(userId) && isValidId(userId);

      // Tasks Subcollection
      match /tasks/{taskId} {
        allow get, list: if isOwner(userId);
        allow create: if isOwner(userId) && isValidId(taskId) && isValidTask(incoming(), userId);
        allow update: if isOwner(userId) && isValidId(taskId) && isValidTask(incoming(), userId) && incoming().userId == existing().userId;
        allow delete: if isOwner(userId) && isValidId(taskId);
      }

      // Health Log Subcollection
      match /health/{dateId} {
        allow get, list: if isOwner(userId);
        allow create, update: if isOwner(userId) && isValidId(dateId) && isValidHealth(incoming(), userId);
        allow delete: if isOwner(userId) && isValidId(dateId);
      }

      // Financial Transactions Subcollection
      match /transactions/{transactionId} {
        allow get, list: if isOwner(userId);
        allow create: if isOwner(userId) && isValidId(transactionId) && isValidTransaction(incoming(), userId);
        allow update: if isOwner(userId) && isValidId(transactionId) && isValidTransaction(incoming(), userId) && incoming().userId == existing().userId;
        allow delete: if isOwner(userId) && isValidId(transactionId);
      }
    }
  }
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(rulesContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 my-6 flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Firestore Security Rules for <span className="font-mono text-amber-700">arawai-5bf06</span>
              </h3>
              <p className="text-xs text-stone-500">
                Hardened Zero-Trust ABAC rules protecting user privacy across work, health, and finances.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-3 overflow-y-auto flex-1 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 flex items-start gap-2">
            <Code className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Instructions: </span>
              Copy these rules and paste them into your{' '}
              <a
                href="https://console.firebase.google.com/project/arawai-5bf06/firestore/rules"
                target="_blank"
                rel="noreferrer"
                className="font-bold underline text-amber-900 inline-flex items-center gap-0.5"
              >
                Firebase Console &gt; Firestore &gt; Rules <ExternalLink className="w-3 h-3 inline" />
              </a>
              . Then click <strong>Publish</strong>.
            </div>
          </div>

          <div className="relative">
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Rules</span>
                </>
              )}
            </button>
            <pre className="p-4 rounded-xl bg-stone-950 text-stone-200 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-96 border border-stone-800">
              {rulesContent}
            </pre>
          </div>
        </div>

        <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
