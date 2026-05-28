import { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import LeadTable from './components/Leads';
import Generate from './components/Generate';


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

      {currentView === 'Dashboard' &&
        <div>dashboard</div>
      }

      {currentView === 'Leads' &&
        <LeadTable
          data={marriageLeads}
          onColorChange={async (rowId, color) => {
            // +1 because our SQLite IDs start at 1, while MRT's start at 0
            await indow.api.updateColor(parseInt(rowId) + 1, color);
            loadMarriageLeads();
          }}
        />
      }

      {currentView === 'Generate' &&
        <Generate />
      }
    </div>
  );
};
