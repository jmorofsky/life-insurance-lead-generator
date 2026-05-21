import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Leads from './components/Leads';


export default function App() {
  const [currentView, setCurrentView] = useState('Dashboard');

  return (
    <div className='flex h-screen overflow-hidden'>
      <Sidebar
        currentView={currentView}
        onNavClick={title => setCurrentView(title)}
      />

      <div className='grow'>
        {currentView === 'Dashboard' &&
          <div>dashboard</div>
        }

        {currentView === 'Leads' &&
          <Leads />
        }

        {currentView === 'Generate' &&
          <div>generate</div>
        }
      </div>
    </div>
  );
};
