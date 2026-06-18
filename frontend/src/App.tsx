import React from 'react';
import { SessionProvider } from './context/SessionContext';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';

const App: React.FC = () => {
  return (
    <SessionProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans antialiased">
        <Sidebar />
        <MainContent />
      </div>
    </SessionProvider>
  );
};

export default App;
