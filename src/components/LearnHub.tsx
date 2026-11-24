import React from 'react';
import {
  ArrowRight,
  Bell,
  Brain,
  Calculator,
  CalendarCheck,
  HeartHandshake,
  Languages,
  Wrench,
} from 'lucide-react';
import { LearnSubView } from '../types/app';

interface LearnHubProps {
  onSelect: (subView: LearnSubView) => void;
}

export const LearnHub: React.FC<LearnHubProps> = ({ onSelect }) => {
  const modules: {
    id: LearnSubView;
    title: string;
    desc: string;
    icon: React.ReactNode;
    accent: string;
  }[] = [
    {
      id: 'math',
      title: 'მათემატიკა (ნულიდან)',
      desc: '6 საფეხური: რიცხვები, მიმატება, გამოკლება, გამრავლება, გაყოფა, წილადები, ალგებრა და გრაფიკები.',
      icon: <Calculator className="w-6 h-6 text-blue-500" />,
      accent: 'bg-blue-500/15',
    },
    {
      id: 'english',
      title: 'ინგლისური (ანბანიდან)',
      desc: '26 ასო გამოთქმით, თემატური სიტყვები გამეორების სისტემით, წინადადებები, გრამატიკა და დიალოგები.',
      icon: <Languages className="w-6 h-6 text-purple-500" />,
      accent: 'bg-purple-500/15',
    },
    {
      id: 'assignments',
      title: 'დღის დავალებები',
      desc: 'პერსონალური ყოველდღიური გეგმა, პროგრესის შენახვა, შეფასება და შეცდომების ანალიზი.',
      icon: <CalendarCheck className="w-6 h-6 text-cyan-500" />,
      accent: 'bg-cyan-500/15',
    },
    {
      id: 'brain',
      title: 'ტვინის ვარჯიში',
      desc: 'ინტერაქტიული თამაშები მეხსიერების, ლოგიკის, ყურადღებისა და მოტორიკის გასავარჯიშებლად.',
      icon: <Brain className="w-6 h-6 text-emerald-500" />,
      accent: 'bg-emerald-500/15',
    },
    {
      id: 'wellness',
      title: 'ფსიქოლოგიური დამხმარე',
      desc: 'განწყობის მონიტორინგი, სუნთქვის ტაიმერი, პირადი დღიური და მშვიდი მხარდაჭერა.',
      icon: <HeartHandshake className="w-6 h-6 text-emerald-500" />,
      accent: 'bg-emerald-500/15',
    },
    {
      id: 'reminders',
      title: 'შეხსენებების სისტემა',
      desc: 'სასწავლო განრიგი, ჩუმი საათები, შეტყობინების ხმები და Web Push პარამეტრები.',
      icon: <Bell className="w-6 h-6 text-blue-500" />,
      accent: 'bg-blue-500/15',
    },
    {
      id: 'tools',
      title: 'პირადი განვითარების ხელსაწყოები',
      desc: 'დღის გეგმა, ჩვევების ტრეკერი, პომოდორო ტაიმერი, კალკულატორი და ჩანაწერები.',
      icon: <Wrench className="w-6 h-6 text-purple-500" />,
      accent: 'bg-purple-500/15',
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-fluid-title font-bold text-slate-900 dark:text-white">სასწავლო და განვითარების ცენტრი</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          აირჩიე სასურველი მიმართულება და გააგრძელე ეტაპობრივი სწავლა.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
        {modules.map((mod) => (
          <button
            key={mod.id}
            type="button"
            onClick={() => onSelect(mod.id)}
            className="min-h-[104px] text-left rounded-2xl bg-white dark:bg-[#0E1730] border border-slate-200 dark:border-slate-800/80 hover:border-blue-500/60 p-4 sm:p-5 flex items-start justify-between gap-3 sm:gap-4 transition-colors min-w-0"
          >
            <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
              <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ${mod.accent} flex items-center justify-center shrink-0`}>
                {mod.icon}
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white break-words">
                  {mod.title}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed break-words">
                  {mod.desc}
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
          </button>
        ))}
      </div>
    </div>
  );
};
