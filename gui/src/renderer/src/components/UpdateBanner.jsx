import { useState, useEffect } from 'react';


export default function UpdateBanner() {
    const [error, setError] = useState(false);
    const [updateReady, setUpdateReady] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        window.api.onUpdateError(() => {
            setError(true);
        });

        window.api.onUpdateDownloaded(() => {
            setUpdateReady(true);
        });
    }, []);

    function installUpdate() {
        if (!updateReady || error) { return };
        window.api.startInstall();
    };

    if (dismissed) { return null };

    if (error) {
        return (
            <div className='absolute left-[100px] right-0 h-7 bg-red-300 border-b border-red-400 text-center shadow-2xs shadow-neutral-300 text-sm'>
                <p className='p-1'>
                    An error occurred while downloading application updates.
                </p>

                <span
                    onClick={() => setDismissed(true)}
                    className='absolute top-[5px] right-[10px] select-none cursor-pointer text-neutral-700 text-xs'
                >
                    ✕
                </span>
            </div>
        );
    };

    if (updateReady) {
        return (
            <div className='absolute left-[100px] right-0 h-7 bg-blue-300 border-b border-blue-400 text-center shadow-2xs shadow-neutral-300 text-sm'>
                <p className='p-1'>
                    A new application version is available.&nbsp;
                    <span
                        onClick={installUpdate}
                        className='font-semibold underline cursor-pointer transition
                        hover:text-white'
                    >
                        Restart
                    </span>
                    &nbsp;to install.
                </p>

                <span
                    onClick={() => setDismissed(true)}
                    className='absolute top-[5px] right-[10px] select-none cursor-pointer text-neutral-700 text-xs'
                >
                    ✕
                </span>
            </div>
        );
    };
};
