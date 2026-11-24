import React, { useState } from 'react';
import { ArrowRight, BookOpen, Brain, Calculator, Check, Languages, Sparkles } from 'lucide-react';
import { KnowledgeLevel, SubjectFocus, UserProfile } from '../types/app';

interface OnboardingProps {
  initialProfile: UserProfile;
  onComplete: (updates: Partial<UserProfile>) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ initialProfile, onComplete }) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initialProfile.name || '');
  const [subjectFocus, setSubjectFocus] = useState<SubjectFocus>(initialProfile.subjectFocus || 'all');
  const [level, setLevel] = useState<KnowledgeLevel>(initialProfile.level || 'absolute_beginner');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(initialProfile.dailyGoalMinutes || 15);
  const [preferredReminderTime, setPreferredReminderTime] = useState<string>(
    initialProfile.preferredReminderTime || '18:00'
  );
  const [mainGoal, setMainGoal] = useState(initialProfile.mainGoal || '');
  const [error, setError] = useState('');

  const handleNext = () => {
    setError('');
    if (step === 0 && name.trim().length < 2) {
      setError('გთხოვ შეიყვანო შენი სახელი (მინიმუმ 2 სიმბოლო).');
      return;
    }
    if (step === 4 && mainGoal.trim().length < 3) {
      setError('ჩაწერე შენი მთავარი სასწავლო მიზანი ან აირჩიე ქვემოთ მოცემული ვარიანტი.');
      return;
    }
    if (step < 4) {
      setStep((s) => s + 1);
    } else {
      onComplete({
        name: name.trim(),
        subjectFocus,
        level,
        dailyGoalMinutes,
        preferredReminderTime,
        mainGoal: mainGoal.trim(),
        onboardingCompleted: true,
      });
    }
  };

  const subjectOptions: { id: SubjectFocus; title: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'all',
      title: 'ყველა მოდული ერთად',
      desc: 'მათემატიკა, ინგლისური და ტვინის ვარჯიში',
      icon: <Sparkles className="w-5 h-5 text-cyan-400" />,
    },
    {
      id: 'math',
      title: 'მათემატიკა (0-დან)',
      desc: 'რიცხვებიდან ფუნქციებამდე ეტაპობრივად',
      icon: <Calculator className="w-5 h-5 text-blue-400" />,
    },
    {
      id: 'english',
      title: 'ინგლისური (ანბანიდან)',
      desc: 'ასოები, სიტყვები, გრამატიკა და საუბარი',
      icon: <Languages className="w-5 h-5 text-purple-400" />,
    },
    {
      id: 'memory',
      title: 'მეხსიერება და ლოგიკა',
      desc: 'ყურადღების, ლოგიკისა და მეხსიერების თამაშები',
      icon: <Brain className="w-5 h-5 text-emerald-400" />,
    },
  ];

  const levelOptions: { id: KnowledgeLevel; title: string; desc: string }[] = [
    {
      id: 'absolute_beginner',
      title: 'სრული დამწყები (0-დან)',
      desc: 'ვიწყებ საფუძვლებიდან — ციფრები და ანბანი ნულიდან.',
    },
    {
      id: 'beginner',
      title: 'საბაზისო ცოდნა',
      desc: 'ვიცი მარტივი თვლა ან რამდენიმე ინგლისური სიტყვა.',
    },
    {
      id: 'intermediate',
      title: 'საშუალო დონე',
      desc: 'მინდა ცოდნის გამყარება, პრაქტიკა და უფრო რთული თემები.',
    },
  ];

  const goalPresets = [
    'ვისწავლო მათემატიკა და ინგლისური საფუძვლიანად ნულიდან',
    'ყოველდღე ვივარჯიშო 15 წუთი და ჩამოვიყალიბო სწავლის ჩვევა',
    'გავაუმჯობესო მეხსიერება, კონცენტრაცია და ლოგიკა',
  ];

  return (
    <div className="min-h-dvh bg-[#070D1F] text-slate-100 flex items-center justify-center p-3 min-[360px]:p-4 sm:p-6">
      <div className="w-full max-w-2xl rounded-2xl sm:rounded-3xl bg-[#0E1730] border border-slate-800/80 shadow-2xl p-4 min-[360px]:p-6 sm:p-8 lg:p-10">
        <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white truncate">SmartLearn AI</h1>
              <p className="text-xs text-slate-400">ნაბიჯი {step + 1} / 5 · პირადი სასწავლო პროფილი</p>
            </div>
          </div>
          <span className="text-xs text-cyan-400 font-medium tabular-nums shrink-0">
            {Math.round(((step + 1) / 5) * 100)}%
          </span>
        </div>

        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-6 sm:mb-8">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${((step + 1) / 5) * 100}%` }}
          />
        </div>

        {step === 0 && (
          <div className="space-y-4 sm:space-y-5">
            <div>
              <h2 className="text-fluid-title font-bold text-white mb-2">გამარჯობა! დავიწყოთ სწავლა</h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                SmartLearn AI დაგეხმარება ისწავლო მათემატიკა და ინგლისური სრული ნულიდან, ავარჯიშო გონება და
                დაგეგმო შენი ყოველდღიური განვითარება.
              </p>
            </div>
            <div>
              <label htmlFor="onb-name" className="block text-sm font-medium text-slate-200 mb-2">
                როგორ მოგმართოთ? (სახელი)
              </label>
              <input
                id="onb-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="მაგ: გიორგი, ნინო, გუჯა..."
                className="w-full min-h-[48px] rounded-xl bg-[#070D1F] border border-slate-700 px-4 py-3 text-base sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              მონაცემები უსაფრთხოდ ინახება ამ მოწყობილობაზე (ლოკალური სტუმრის რეჟიმი). შეგიძლია ნებისმიერ დროს
              ექსპორტი ან პროფილის რედაქტირება.
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-fluid-title font-bold text-white mb-2">რისი სწავლა გსურს?</h2>
              <p className="text-sm text-slate-300">
                აირჩიე მთავარი მიმართულება — სხვა მოდულებზე წვდომა მაინც ყოველთვის გექნება.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {subjectOptions.map((opt) => {
                const active = subjectFocus === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSubjectFocus(opt.id)}
                    className={`min-h-[72px] text-left rounded-2xl p-3.5 sm:p-4 border transition-colors flex items-start gap-3 min-w-0 ${
                      active
                        ? 'bg-blue-600/20 border-cyan-400 text-white'
                        : 'bg-[#070D1F] border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">{opt.icon}</div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-white break-words">{opt.title}</div>
                      <div className="text-xs text-slate-400 mt-1 break-words">{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-fluid-title font-bold text-white mb-2">რა არის შენი მიმდინარე დონე?</h2>
              <p className="text-sm text-slate-300">
                თუ არაფერი იცი, თამამად აირჩიე სრული დამწყები — ყველაფერს თავიდან აგიხსნით.
              </p>
            </div>
            <div className="space-y-3">
              {levelOptions.map((opt) => {
                const active = level === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLevel(opt.id)}
                    className={`w-full min-h-[64px] text-left rounded-2xl p-3.5 sm:p-4 border transition-colors flex items-center justify-between gap-3 ${
                      active
                        ? 'bg-purple-600/20 border-purple-400 text-white'
                        : 'bg-[#070D1F] border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-white break-words">{opt.title}</div>
                      <div className="text-xs text-slate-400 mt-1 break-words">{opt.desc}</div>
                    </div>
                    {active && <Check className="w-5 h-5 text-purple-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5 sm:space-y-6">
            <div>
              <h2 className="text-fluid-title font-bold text-white mb-2">დღიური დრო და შეხსენება</h2>
              <p className="text-sm text-slate-300">
                რამდენ წუთს დაუთმობ სწავლას ყოველდღე და რომელ საათზე გირჩევნია შეხსენება?
              </p>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-200 mb-3">დღიური სასწავლო მიზანი</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {[10, 15, 30, 45].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDailyGoalMinutes(mins)}
                    className={`min-h-[48px] rounded-xl border font-semibold text-sm tabular-nums transition-colors ${
                      dailyGoalMinutes === mins
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        : 'bg-[#070D1F] border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {mins} წუთი
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="onb-time" className="block text-sm font-medium text-slate-200 mb-2">
                შეხსენების სასურველი დრო
              </label>
              <input
                id="onb-time"
                type="time"
                value={preferredReminderTime}
                onChange={(e) => setPreferredReminderTime(e.target.value)}
                className="w-full min-[420px]:w-auto min-h-[48px] rounded-xl bg-[#070D1F] border border-slate-700 px-4 py-2 text-white font-mono-num focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-fluid-title font-bold text-white mb-2">რა არის შენი მთავარი მიზანი?</h2>
              <p className="text-sm text-slate-300">
                შეგიძლია ჩაწერო საკუთარი მიზანი ან აირჩიო მზა ვარიანტი.
              </p>
            </div>
            <textarea
              rows={3}
              value={mainGoal}
              onChange={(e) => setMainGoal(e.target.value)}
              placeholder="მაგ: მინდა 3 თვეში ვისწავლო გამართული საბაზისო ინგლისური და მათემატიკა..."
              className="w-full rounded-xl bg-[#070D1F] border border-slate-700 p-3.5 sm:p-4 text-base sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <div className="space-y-2">
              {goalPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMainGoal(preset)}
                  className="w-full min-h-[44px] text-left text-xs text-slate-300 hover:text-white bg-[#070D1F] hover:bg-slate-800/80 border border-slate-800 rounded-xl px-4 py-3 transition-colors break-words"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl bg-red-500/15 border border-red-500/40 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="mt-6 sm:mt-8 flex flex-col-reverse min-[420px]:flex-row items-stretch min-[420px]:items-center justify-between gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="min-h-[48px] px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 text-sm font-medium whitespace-nowrap text-center"
            >
              უკან
            </button>
          ) : (
            <div className="hidden min-[420px]:block" />
          )}

          <button
            type="button"
            onClick={handleNext}
            className="min-h-[48px] w-full min-[420px]:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 whitespace-nowrap"
          >
            <span>{step === 4 ? 'სწავლის დაწყება' : 'შემდეგი'}</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
};
