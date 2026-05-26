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
              updatedData[rowId].color = color;
              setData(updatedData);
              // TODO: sync to db
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
