/**
 * Root application component with view routing.
 */

import React, { useState } from 'react';
import { Header } from './ui/components/Header';
import { LiveView } from './ui/views/LiveView';
import { HistoryView } from './ui/views/HistoryView';
import { SettingsView } from './ui/views/SettingsView';

type View = 'live' | 'history' | 'settings';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('live');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header currentView={currentView} onViewChange={setCurrentView} />
      <main style={{ flex: 1, overflow: 'hidden' }}>
        {currentView === 'live' && <LiveView />}
        {currentView === 'history' && <HistoryView />}
        {currentView === 'settings' && <SettingsView />}
      </main>
    </div>
  );
};

export default App;
