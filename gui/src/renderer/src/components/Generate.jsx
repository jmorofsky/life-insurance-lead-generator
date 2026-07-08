import { useState, useEffect } from 'react';
import Spinner from './Spinner';
import WifiOffIcon from '../assets/wifiOff.svg';


const Footer = ({ isOnline, loading, onGenerateClick }) => {
    const activeClass = 'flex items-center justify-center gap-2 relative overflow-hidden pl-[8px] pr-[11px] py-1 rounded-sm font-medium transition-colors duration-200 shadow-lg shadow-neutral-300 border border-neutral-300 cursor-pointer hover:border-neutral-400 active:translate-y-px';
    const loadingClass = 'flex items-center justify-center gap-2 relative overflow-hidden pl-[8px] pr-[11px] py-1 rounded-sm font-medium transition-colors duration-200 shadow-lg shadow-neutral-300 border border-neutral-300';

    return (
        <div className='h-16 absolute bottom-0 left-[100px] right-0 shadow-2xl shadow-black border-t border-neutral-300 flex justify-end'>
            <div className='flex items-center px-3 gap-5'>
                {isOnline ?
                    <button
                        disabled={loading}
                        onClick={onGenerateClick}
                        className={loading ? loadingClass : activeClass}
                    >
                        {loading ?
                            <Spinner size={16} />
                            :
                            <span className='animate-sparkle inline-block pl-[3px]'>✦</span>
                        }
                        Generate
                    </button>
                    :
                    <div className='border-b-2 border-blue-300 border-dashed rounded-lg p-1 select-none font-medium text-neutral-700 flex gap-3 items-center'>
                        <img src={WifiOffIcon} className='h-[20px]' />
                        You are offline.
                    </div>
                }
            </div>
        </div>
    );
};

export default function Generate({ onGenerate }) {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    async function triggerPythonGenerate() {
        setLoading(true);

        const resp = await window.api.generate();
        if (resp.status !== 'success' && resp.error) {
            setError(resp.error);
        };

        onGenerate();
        setLoading(false);
    };

    return (
        <div>
            {error && <p>{error}</p>}

            <Footer
                isOnline={isOnline}
                loading={loading}
                onGenerateClick={triggerPythonGenerate}
            />
        </div>
    );
};
