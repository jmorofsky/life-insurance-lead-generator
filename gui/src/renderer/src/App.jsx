import { useState, useEffect, useMemo } from 'react';
import UpdateBanner from './components/UpdateBanner';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import LeadTable from './components/Leads';
import Generate from './components/Generate';
import Legal from './components/Legal';


export default function App() {
  const [currentView, setCurrentView] = useState('Dashboard');
  const [marriageLeads, setMarriageLeads] = useState([]);

  useEffect(() => { loadMarriageLeads() }, []);

  async function loadMarriageLeads() {
    const marriageLeads = await window.api.getMarriageLeads();
    setMarriageLeads(marriageLeads);
  };

  return (
    <div className='flex h-screen w-screen overflow-hidden'>
      <Sidebar
        currentView={currentView}
        onNavClick={title => setCurrentView(title)}
      />

      <div className='h-full grow-1 min-w-0'>
        <UpdateBanner />

        {currentView === 'Dashboard' &&
          <Dashboard />
        }

        {currentView === 'Leads' &&
          <LeadTable
            data={marriageLeads}
            onColorChange={async (rowId, color) => {
              // +1 because our SQLite IDs start at 1, while MRT's start at 0
              await window.api.updateColor(parseInt(rowId) + 1, color);
              loadMarriageLeads();
            }}
          />
        }

        {currentView === 'Generate' &&
          <Generate
            onGenerate={async () => loadMarriageLeads()}
          />
        }

        {currentView === 'Legal' &&
          <Legal />
        }
      </div>
    </div>
  );
};
