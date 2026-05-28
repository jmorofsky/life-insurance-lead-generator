import { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import LeadTable from './components/Leads';


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
          onColorChange={(rowId, color) => {
            const updatedLeads = [...marriageLeads];
            updatedLeads[rowId].rowColor = color;

            // +1 because our SQLite IDs start at 1, while MRT's start at 0
            window.api.updateColor(parseInt(rowId) + 1, color);
            loadMarriageLeads();
          }}
        />
      }

      {currentView === 'Generate' &&
        <div>generate</div>
      }

    </div>
  );
};
