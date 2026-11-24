import React, { useState } from 'react';
import {
  Check,
  Download,
  RefreshCw,
  Smartphone,
  Upload,
  User,
} from 'lucide-react';
import { AppData, KnowledgeLevel, SubjectFocus, UserProfile } from '../../types/app';
import { exportAppDataAsJson } from '../../services/storage';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface ProfileModuleProps {
  data: AppData;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onImportData: (imported: AppData) => void;
  onResetAccount: () => void;
}

export const ProfileModule: React.FC<ProfileModuleProps> = ({
  data,
  onUpdateProfile,
  onImportData,
  onResetAccount,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  const [name, setName] = useState(data.profile.name);
  const [subjectFocus, setSubjectFocus] = useState<SubjectFocus>(data.profile.subjectFocus);
  const [level, setLevel] = useState<KnowledgeLevel>(data.profile.level);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(data.profile.dailyGoalMinutes);
  const [preferredReminderTime, setPreferredReminderTime] = useState(
    data.profile.preferredReminderTime
  );
  const [mainGoal, setMainGoal] = useState(data.profile.mainGoal);
  const [savedBanner, setSavedBanner] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (name.trim().length < 2) {
      setErrorMsg('სახელი უნდა შეიცავდეს მინიმუმ 2 სიმბოლოს.');
      return;
    }
    onUpdateProfile({
      name: name.trim(),
      subjectFocus,
      level,
      dailyGoalMinutes,
      preferredReminderTime,
      mainGoal: mainGoal.trim(),
    });
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
  };

  const handleExport = () => {
    const json = exportAppDataAsJson(data);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartlearn-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const candidate = parsed.data || parsed;
        if (!candidate?.profile || !candidate?.mathProgress) {
          setErrorMsg('არასწორი სარეზერვო ფაილის ფორმატი.');
          return;
        }
        onImportData({
          ...candidate,
          profile: { ...candidate.profile, userId: data.profile.userId },
        });
        setSavedBanner(true);
      } catch {
        setErrorMsg('ფაილის წაკითხვა ვერ მოხერხდა.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-fluid-title font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <User className="w-6 h-6 text-blue-500 shrink-0" />
          <span>პროფილი და პარამეტრები</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 break-words">
          მომხმარებლის ID: <span className="font-mono-num break-all">{data.profile.userId}</span> · ლოკალური სტუმრის რეჟიმი
          (მონაცემები ინახება ამ მოწყობილობაზე და არ სინქრონიზდება სხვა მოწყობილობებთან).
        </p>
      </div>

      {/* Edit Profile Form */}
      <form
        onSubmit={handleSave}
        className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-4 min-[360px]:p-5 sm:p-6 space-y-4"
      >
        <h2 className="font-bold text-base text-slate-900 dark:text-white">პირადი სასწავლო პარამეტრები</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1">სახელი</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full min-h-[44px] rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-700 px-3.5 text-base sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">მთავარი მიმართულება</label>
            <select
              value={subjectFocus}
              onChange={(e) => setSubjectFocus(e.target.value as SubjectFocus)}
              className="w-full min-h-[44px] rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-700 px-3 text-sm"
            >
              <option value="all">ყველა მოდული</option>
              <option value="math">მათემატიკა</option>
              <option value="english">ინგლისური</option>
              <option value="memory">მეხსიერების ვარჯიში</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">ცოდნის დონე</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as KnowledgeLevel)}
              className="w-full min-h-[44px] rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-700 px-3 text-sm"
            >
              <option value="absolute_beginner">სრული დამწყები (0-დან)</option>
              <option value="beginner">საბაზისო</option>
              <option value="intermediate">საშუალო</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">დღიური მიზანი (წუთი)</label>
            <input
              type="number"
              min={5}
              max={180}
              value={dailyGoalMinutes}
              onChange={(e) => setDailyGoalMinutes(Number(e.target.value) || 15)}
              className="w-full min-h-[44px] rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-700 px-3.5 text-sm font-mono-num"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">შეხსენების სასურველი დრო</label>
            <input
              type="time"
              value={preferredReminderTime}
              onChange={(e) => setPreferredReminderTime(e.target.value)}
              className="w-full min-h-[44px] rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-700 px-3.5 text-sm font-mono-num"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">თემა და ხმები</label>
            <div className="flex flex-col min-[380px]:flex-row gap-2">
              <button
                type="button"
                onClick={() =>
                  onUpdateProfile({ theme: data.profile.theme === 'dark' ? 'light' : 'dark' })
                }
                className="flex-1 min-h-[44px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
              >
                თემა: {data.profile.theme === 'dark' ? 'მუქი' : 'ღია'}
              </button>
              <button
                type="button"
                onClick={() => onUpdateProfile({ soundEnabled: !data.profile.soundEnabled })}
                className="flex-1 min-h-[44px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
              >
                ხმა: {data.profile.soundEnabled ? 'ჩართული' : 'გამორთული'}
              </button>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium mb-1">მთავარი მიზანი</label>
            <input
              type="text"
              value={mainGoal}
              onChange={(e) => setMainGoal(e.target.value)}
              className="w-full min-h-[44px] rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-700 px-3.5 text-base sm:text-sm"
            />
          </div>
        </div>

        {errorMsg && <div className="text-xs text-red-500">{errorMsg}</div>}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="min-h-[44px] w-full min-[380px]:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
          >
            ცვლილებების შენახვა
          </button>
          {savedBanner && (
            <span className="text-xs text-emerald-500 font-medium flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>შენახულია</span>
            </span>
          )}
        </div>
      </form>

      {/* PWA Install & Data Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-5 space-y-3">
          <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-cyan-500" />
            <span>აპლიკაციის დაყენება (PWA)</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            დააყენე SmartLearn AI მთავარ ეკრანზე სწრაფი წვდომისა და ოფლაინ გამოყენებისთვის.
          </p>
          {isInstalled ? (
            <div className="text-xs font-semibold text-emerald-500">აპლიკაცია უკვე დაყენებულია.</div>
          ) : isInstallable ? (
            <button
              type="button"
              onClick={install}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-semibold"
            >
              აპლიკაციის დაყენება
            </button>
          ) : isIOS ? (
            <button
              type="button"
              onClick={() => setShowIOSModal(true)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
            >
              დაყენება iPhone / iPad-ზე
            </button>
          ) : (
            <div className="text-xs text-slate-500">
              გამოიყენე ბრაუზერის მენიუ („Install App“ / „Add to Home Screen“) დასაყენებლად.
            </div>
          )}
        </div>

        <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 p-4 min-[360px]:p-5 space-y-3">
          <h2 className="font-bold text-base text-slate-900 dark:text-white">მონაცემების მართვა</h2>
          <div className="flex flex-col min-[420px]:flex-row flex-wrap gap-2.5">
            <button
              type="button"
              onClick={handleExport}
              className="min-h-[44px] w-full min-[420px]:w-auto px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>მონაცემების ექსპორტი (JSON)</span>
            </button>

            <label className="min-h-[44px] w-full min-[420px]:w-auto px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer">
              <Upload className="w-4 h-4 shrink-0" />
              <span>აღდგენა ფაილიდან</span>
              <input type="file" accept="application/json" onChange={handleImportFile} className="hidden" />
            </label>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="min-h-[44px] w-full min-[420px]:w-auto px-4 py-2 rounded-xl border border-red-500/40 text-red-500 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                <span>პროფილისა და პროგრესის განულება</span>
              </button>
            ) : (
              <div className="rounded-xl bg-red-500/10 border border-red-500/40 p-3 space-y-2">
                <div className="text-xs text-red-600 dark:text-red-300 font-medium">
                  ნამდვილად გსურს ყველა მონაცემის წაშლა? ეს მოქმედება შეუქცევადია.
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmReset(false);
                      onResetAccount();
                    }}
                    className="min-h-[44px] px-3.5 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold"
                  >
                    დიახ, წაშლა
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs"
                  >
                    გაუქმება
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4">
          <div className="max-w-sm w-full max-h-[90dvh] overflow-y-auto rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-3">
            <h3 className="font-bold text-base">დაყენება iPhone / iPad-ზე</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              1. დააჭირე <strong>Share</strong> ღილაკს Safari-ს ქვედა პანელზე.
              <br />
              2. ჩამოშალე მენიუ და აირჩიე <strong>Add to Home Screen</strong>.
            </p>
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full min-h-[44px] rounded-xl bg-blue-600 text-white text-xs font-semibold"
            >
              დახურვა
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
