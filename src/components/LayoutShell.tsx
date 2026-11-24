import React, { useState } from 'react';
import {
  Bell,
  BookOpen,
  Bot,
  Brain,
  Calculator,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  HeartHandshake,
  Home,
  Languages,
  Moon,
  Sun,
  TrendingUp,
  User,
  WifiOff,
  Wrench,
} from 'lucide-react';
import { LearnSubView, NavTab, ThemeMode } from '../types/app';
import { useOnlineStatus } from '../hooks/usePWAInstall';

interface LayoutShellProps {
  activeTab: NavTab;
  learnView: LearnSubView;
  theme: ThemeMode;
  userName: string;
  onNavigate: (tab: NavTab, subView?: LearnSubView) => void;
  onToggleTheme: () => void;
  children: React.ReactNode;
}

export const LayoutShell: React.FC<LayoutShellProps> = ({
  activeTab,
  learnView,
  theme,
  userName,
  onNavigate,
  onToggleTheme,
  children,
}) => {
  const isOnline = useOnlineStatus();
  // Tablet adaptive sidebar can expand/collapse
  const [tabletExpanded, setTabletExpanded] = useState(false);

  const bottomTabs: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'მთავარი', icon: <Home className="w-5 h-5 shrink-0" /> },
    { id: 'learn', label: 'სწავლა', icon: <BookOpen className="w-5 h-5 shrink-0" /> },
    { id: 'teacher', label: 'AI მასწ.', icon: <Bot className="w-5 h-5 shrink-0" /> },
    { id: 'progress', label: 'პროგრესი', icon: <TrendingUp className="w-5 h-5 shrink-0" /> },
    { id: 'profile', label: 'პროფილი', icon: <User className="w-5 h-5 shrink-0" /> },
  ];

  const sidebarLinks: {
    label: string;
    tab: NavTab;
    subView?: LearnSubView;
    icon: React.ReactNode;
  }[] = [
    { label: 'მთავარი', tab: 'home', icon: <Home className="w-4 h-4" /> },
    { label: 'მათემატიკა (0-დან)', tab: 'learn', subView: 'math', icon: <Calculator className="w-4 h-4" /> },
    { label: 'ინგლისური (ანბანიდან)', tab: 'learn', subView: 'english', icon: <Languages className="w-4 h-4" /> },
    { label: 'დღის დავალება', tab: 'learn', subView: 'assignments', icon: <CalendarCheck className="w-4 h-4" /> },
    { label: 'ტვინის ვარჯიში', tab: 'learn', subView: 'brain', icon: <Brain className="w-4 h-4" /> },
    { label: 'AI მასწავლებელი', tab: 'teacher', icon: <Bot className="w-4 h-4" /> },
    { label: 'ფსიქოლოგიური დამხმარე', tab: 'learn', subView: 'wellness', icon: <HeartHandshake className="w-4 h-4" /> },
    { label: 'შეხსენებები', tab: 'learn', subView: 'reminders', icon: <Bell className="w-4 h-4" /> },
    { label: 'პროგრესი და მიღწევები', tab: 'progress', icon: <TrendingUp className="w-4 h-4" /> },
    { label: 'პირადი ხელსაწყოები', tab: 'learn', subView: 'tools', icon: <Wrench className="w-4 h-4" /> },
    { label: 'პროფილი და პარამეტრები', tab: 'profile', icon: <User className="w-4 h-4" /> },
  ];

  const isLinkActive = (tab: NavTab, subView?: LearnSubView) => {
    if (tab !== activeTab) return false;
    if (tab === 'learn' && subView) {
      return learnView === subView;
    }
    if (tab === 'learn' && !subView) {
      return learnView === 'hub';
    }
    return true;
  };

  return (
    <div className="min-h-dvh bg-[#F4F7FB] text-slate-900 dark:bg-[#070D1F] dark:text-slate-100 flex flex-col md:flex-row overflow-x-clip">
      {/* Tablet (compact adaptive rail / expandable) & Desktop (permanent sidebar) */}
      <aside
        className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 bg-white dark:bg-[#0B142E] border-r border-slate-200 dark:border-slate-800/80 z-30 transition-[width] duration-200 ${
          tabletExpanded ? 'md:w-64' : 'md:w-20'
        } lg:w-64 xl:w-72`}
      >
        <div className="px-3.5 lg:px-5 py-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 text-left focus:outline-none min-w-0 min-h-[44px]"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              SL
            </div>
            <span
              className={`text-base lg:text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap truncate ${
                tabletExpanded ? 'inline' : 'hidden lg:inline'
              }`}
            >
              SmartLearn AI
            </span>
          </button>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'ღია თემაზე გადართვა' : 'მუქ თემაზე გადართვა'}
              className={`w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                tabletExpanded ? 'flex' : 'hidden lg:flex'
              }`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setTabletExpanded((e) => !e)}
              aria-label={tabletExpanded ? 'მენიუს ჩაკეცვა' : 'მენიუს გაშლა'}
              className="lg:hidden w-9 h-10 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"
            >
              {tabletExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 lg:px-3 py-3 space-y-1">
          {sidebarLinks.map((item) => {
            const active = isLinkActive(item.tab, item.subView);
            return (
              <button
                key={`${item.tab}_${item.subView || 'root'}`}
                type="button"
                title={item.label}
                onClick={() => onNavigate(item.tab, item.subView || 'hub')}
                className={`w-full min-h-[44px] px-3 py-2.5 rounded-xl flex items-center gap-3 text-sm font-medium transition-colors text-left ${
                  tabletExpanded ? 'justify-start' : 'justify-center lg:justify-start'
                } ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span
                  className={`truncate ${
                    tabletExpanded ? 'inline' : 'hidden lg:inline'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 lg:p-4 border-t border-slate-200 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
          {!tabletExpanded && (
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="თემის შეცვლა"
              className="lg:hidden w-full min-h-[44px] rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 mb-1"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}
          <div className={tabletExpanded ? 'block' : 'hidden lg:block'}>
            <div className="font-medium text-slate-700 dark:text-slate-200 truncate">
              {userName || 'მოსწავლე'}
            </div>
            <div className="mt-0.5 truncate">ლოკალური სტუმრის რეჟიმი</div>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header (< 768px) */}
      <header className="md:hidden sticky top-0 z-30 h-13 px-3 min-[360px]:px-4 bg-white/95 dark:bg-[#0B142E]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 min-h-[44px] min-w-0"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
            SL
          </div>
          <span className="font-bold text-sm min-[360px]:text-base tracking-tight text-slate-900 dark:text-white truncate">
            SmartLearn AI
          </span>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('learn', 'reminders')}
            aria-label="შეხსენებები"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Bell className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'ღია თემა' : 'მუქი თემა'}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        className={`flex-1 min-w-0 pb-24 md:pb-8 transition-[padding] duration-200 ${
          tabletExpanded ? 'md:pl-64' : 'md:pl-20'
        } lg:pl-64 xl:pl-72`}
      >
        {!isOnline && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-3 sm:px-4 py-2 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-center gap-2 text-center">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>ოფლაინ რეჟიმი — შენახული გაკვეთილები, თამაშები, გეგმა და პროგრესი მუშაობს ინტერნეტის გარეშე.</span>
          </div>
        )}
        <div className="w-full max-w-7xl mx-auto px-3 min-[360px]:px-4 sm:px-6 lg:px-8 2xl:px-10 py-4 sm:py-6 lg:py-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (< 768px) */}
      <nav
        aria-label="მთავარი ნავიგაცია"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 pb-safe bg-white/95 dark:bg-[#0B142E]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-5 items-center"
      >
        {bottomTabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onNavigate(tab.id, tab.id === 'learn' ? 'hub' : undefined)}
              className={`min-h-[44px] min-w-0 px-0.5 flex flex-col items-center justify-center gap-1 transition-colors ${
                active
                  ? 'text-blue-600 dark:text-cyan-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span className="text-[8.5px] min-[360px]:text-[10px] leading-none max-w-full truncate">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
