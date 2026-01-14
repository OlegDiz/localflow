
import React, { useState, useEffect } from 'react';
import { Layout, Play, Edit3, Database, Github, Settings, Plus, FolderOpen, Terminal, Palette } from 'lucide-react';
import Playground from './components/Playground';
import Annotator from './components/Annotator';
import { Project } from './types';

type Theme = 'snow' | 'steel' | 'midnight' | 'ivory';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'playground' | 'annotate' | 'projects'>('playground');
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [theme, setTheme] = useState<Theme>('snow');

  useEffect(() => {
    const mockProject: Project = {
      id: 'proj_1',
      name: 'Industrial Safety',
      classes: ['Worker', 'Vest', 'Hardhat', 'Gloves'],
      images: [
        {
          id: 'img_1',
          name: 'worker_safety_01.jpg',
          url: 'https://images.unsplash.com/photo-1516216628859-9bccecab13ca?auto=format&fit=crop&q=80&w=1200',
          width: 1200, height: 800, annotations: [], status: 'unlabeled'
        },
        {
          id: 'img_2',
          name: 'site_overview.jpg',
          url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=1200',
          width: 1200, height: 800, annotations: [], status: 'unlabeled'
        }
      ]
    };
    setCurrentProject(mockProject);
  }, []);

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
        <div className="p-6 border-b border-app flex items-center gap-3">
          <div className="bg-app-accent p-1.5 rounded-md shadow-sm">
            <Terminal size={18} className="text-white" />
          </div>
          <span className="font-bold tracking-tight text-lg hidden md:block">LocalFlow</span>
        </div>

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

        {/* Theme Switcher "On the Side" */}
        <div className="p-4 border-t border-app">
          <div className="mb-4 hidden md:block">
            <p className="text-[10px] font-bold text-app-muted uppercase tracking-widest mb-3 flex items-center gap-2">
              <Palette size={12} /> Interface
            </p>
            <div className="flex gap-2">
              <ThemeOption active={theme === 'snow'} color="bg-zinc-200" onClick={() => setTheme('snow')} label="Snow" />
              <ThemeOption active={theme === 'steel'} color="bg-zinc-900" onClick={() => setTheme('steel')} label="Steel" />
              <ThemeOption active={theme === 'midnight'} color="bg-slate-950" onClick={() => setTheme('midnight')} label="Mid" />
              <ThemeOption active={theme === 'ivory'} color="bg-stone-200" border="border-amber-200" onClick={() => setTheme('ivory')} label="Warm" />
            </div>
          </div>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-app-muted hover:text-app hover:bg-panel transition-all text-sm font-medium">
            <Settings size={18} />
            <span className="hidden md:block">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'playground' && <Playground />}
        {activeTab === 'annotate' && <Annotator project={currentProject} setProject={setCurrentProject} />}
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
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
      active 
        ? 'bg-panel text-app-accent border border-app shadow-sm font-bold' 
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
