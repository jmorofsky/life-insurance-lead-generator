import { useState, useEffect, useMemo } from 'react';
import UpdateBanner from './components/UpdateBanner';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Leads from './components/Leads';
import LeadTable from './components/LeadTable';
import Generate from './components/Generate';
import Legal from './components/Legal';


export default function App() {
  const [currentView, setCurrentView] = useState('Dashboard');
  const [currentDataset, setCurrentDataset] = useState(null); // null | array
  const [datasets, setDatasets] = useState([]);

  useEffect(() => { loadAllDatasets() }, []);

  async function loadAllDatasets() {
    const datasets = await window.api.getAllDatasets();
    setDatasets(datasets);
  };

  async function loadDataset(table_name) {
    const dataset = await window.api.getDataset(table_name);
    setCurrentDataset(dataset);
  };

  return (
    <div className='flex h-screen w-screen overflow-hidden'>
      <Sidebar
        currentView={currentView}
        onNavClick={title => {
          setCurrentDataset(null);
          setCurrentView(title);
        }}
      />

      <div className='h-full grow-1 min-w-0'>
        <UpdateBanner />

        {currentView === 'Dashboard' &&
          <Dashboard />
        }

        {currentView === 'Leads' &&
          <>
            {currentDataset ?
              <LeadTable
                dataset={currentDataset}
                onColorChange={async (table_name, rowId, color) => {
                  // +1 because our SQLite IDs start at 1, while MRT's start at 0
                  await window.api.updateColor(table_name, parseInt(rowId) + 1, color);
                  loadDataset(table_name);
                }}
              />
              :
              <Leads
                datasets={datasets}
                onDatasetClick={async table_name => loadDataset(table_name)}
              />
            }
          </>
        }

        {currentView === 'Generate' &&
          <Generate
            onGenerate={async () => loadAllDatasets()}
          />
        }

        {currentView === 'Legal' &&
          <Legal />
        }
      </div>
    </div>
  );
};
