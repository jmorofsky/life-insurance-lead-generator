import { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Leads from './components/Leads';


export default function App() {
  const [currentView, setCurrentView] = useState('Dashboard');
  const [data, setData] = useState([]);

  useEffect(() => {
    async function loadLeads() {
      const resp = await window.api.getLeads();
      setData(resp);
    };

    loadLeads();
  }, []);

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
          <Leads
            data={data}
            onColorChange={(rowId, color) => {
              const updatedData = [...data];
              updatedData[rowId].rowColor = color;

              // +1 because our SQLite IDs start at 1, while MRT's start at 0
              window.api.updateColor(rowId + 1, color);
              setData(updatedData);
            }}
          />
        }

        {currentView === 'Generate' &&
          <div>generate</div>
        }
      </div>
    </div>
  );
};
