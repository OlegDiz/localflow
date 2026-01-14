import React, { useState, useEffect } from 'react';
import { Play, Edit3, Database, Settings, Plus, FolderOpen, BoxSelect, Palette } from 'lucide-react';
import Playground from './components/Playground';
import Annotator from './components/Annotator';
import { Project, ProjectImage } from './types';

type Theme = 'snow' | 'steel' | 'midnight' | 'ivory';

const EXAMPLE_IMAGES: ProjectImage[] = [
  {
    id: 'ex_market',
    name: 'market_produce.jpg',
    url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200',
    width: 1200, height: 800, annotations: [], status: 'unlabeled'
  },
  {
    id: 'ex_traffic',
    name: 'city_traffic.jpg',
    url: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?auto=format&fit=crop&q=80&w=1200',
    width: 1200, height: 800, annotations: [], status: 'unlabeled'
  },
  {
    id: 'ex_workshop',
    name: 'workshop_tools.jpg',
    url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=1200',
    width: 1200, height: 800, annotations: [], status: 'unlabeled'
  },
  {
    id: 'ex_desk',
    name: 'office_desk.jpg',
    url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=1200',
    width: 1200, height: 800, annotations: [], status: 'unlabeled'
  }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'playground' | 'annotate' | 'projects'>('playground');
  const [currentProject, setCurrentProject] = useState<Project>({
    id: 'user_proj_1',
    name: 'My Local Dataset',
    classes: [],
    images: [] // Starts empty for user uploads
  });
  const [theme, setTheme] = useState<Theme>('snow');

  const getThemeClass = () => {
    switch (theme) {
      case 'steel': return 'theme-steel';
      case 'midnight': return 'theme-midnight';
      case 'ivory': return 'theme-ivory';
      default: return '';
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden font-sans selection:bg-indigo-500/30 ${getThemeClass()} app-container transition-colors duration-300`}>
      {/* Sidebar */}
      <aside className="w-16 md:w-64 bg-sidebar border-r border-app flex flex-col shrink-0 z-50">
        <button 
          onClick={() => setActiveTab('playground')}
          className="p-6 border-b border-app flex items-center gap-3 hover:bg-panel transition-colors text-left outline-none w-full"
        >
          <div className="bg-app-accent p-1.5 rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.3)] shrink-0">
            <img 
              src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/box-select.svg" 
              className="w-5 h-5 brightness-0 invert" 
              alt="Logo" 
            />
          </div>
          <span className="font-extrabold tracking-tighter text-xl hidden md:block">Local<span className="text-app-accent">Flow</span></span>
        </button>

        <nav className="flex-1 p-4 space-y-2">
          <NavItem 
            active={activeTab === 'playground'} 
            onClick={() => setActiveTab('playground')}
            icon={<Play size={18} />} 
            label="Playground" 
          />
          <NavItem 
            active={activeTab === 'annotate'} 
            onClick={() => setActiveTab('annotate')}
            icon={<Edit3 size={18} />} 
            label="Annotate" 
          />
          <NavItem 
            active={activeTab === 'projects'} 
            onClick={() => setActiveTab('projects')}
            icon={<Database size={18} />} 
            label="Datasets" 
          />
        </nav>

        {/* Theme Switcher */}
        <div className="p-4 border-t border-app">
          <div className="mb-4 hidden md:block">
            <p className="text-[10px] font-bold text-app-muted uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
              <Palette size={12} /> Interface
            </p>
            <div className="flex gap-2">
              <ThemeOption active={theme === 'snow'} color="bg-zinc-100" onClick={() => setTheme('snow')} label="Snow" />
              <ThemeOption active={theme === 'steel'} color="bg-zinc-900" onClick={() => setTheme('steel')} label="Steel" />
              <ThemeOption active={theme === 'midnight'} color="bg-slate-950" onClick={() => setTheme('midnight')} label="Mid" />
              <ThemeOption active={theme === 'ivory'} color="bg-stone-200" border="border-amber-200" onClick={() => setTheme('ivory')} label="Warm" />
            </div>
          </div>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-app-muted hover:text-app hover:bg-panel transition-all text-sm font-semibold">
            <Settings size={18} />
            <span className="hidden md:block">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'playground' && <Playground exampleImages={EXAMPLE_IMAGES} />}
        {activeTab === 'annotate' && <Annotator project={currentProject} setProject={setCurrentProject as any} />}
        {activeTab === 'projects' && (
          <div className="flex-1 flex items-center justify-center p-8 bg-panel">
            <div className="max-w-xl w-full space-y-8">
              <div className="text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-panel border border-app rounded-xl flex items-center justify-center text-app-accent shadow-sm">
                  <Database size={24} />
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Dataset Manager</h2>
                <p className="text-app-muted text-sm">Orchestrate your local computer vision pipelines.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <DashboardCard icon={<Plus />} title="New Project" subtitle="Create local workspace" />
                <DashboardCard icon={<FolderOpen />} title="Open Existing" subtitle="Load from filesystem" />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-semibold ${
      active 
        ? 'bg-panel text-app-accent border border-app shadow-sm' 
        : 'text-app-muted hover:text-app hover:bg-panel'
    }`}
  >
    {icon}
    <span className="hidden md:block">{label}</span>
  </button>
);

const ThemeOption = ({ active, color, border, onClick, label }: any) => (
  <button 
    onClick={onClick}
    title={label}
    className={`w-6 h-6 rounded-full ${color} ${border || 'border-app'} border-2 transition-all ${active ? 'scale-125 ring-2 ring-indigo-500/20 shadow-md ring-offset-2 ring-offset-[var(--bg-side)]' : 'opacity-60 hover:opacity-100 hover:scale-110'}`}
  />
);

const DashboardCard = ({ icon, title, subtitle }: any) => (
  <button className="flex flex-col items-center text-center gap-4 p-8 bg-sidebar border border-app rounded-2xl hover:border-app-accent hover:bg-panel transition-all group">
    <div className="p-3 bg-panel rounded-lg text-app-muted group-hover:text-app-accent transition-colors">
      {React.cloneElement(icon, { size: 28 })}
    </div>
    <div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-xs text-app-muted mt-1">{subtitle}</p>
    </div>
  </button>
);

export default App;
