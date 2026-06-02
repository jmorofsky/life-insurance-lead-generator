import { useState } from 'react';


export default function Generate() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function triggerPythonGenerate() {
        setLoading(true);

        const resp = await window.api.generate();
        console.log(resp);
        if (resp.status !== 'success' && resp.error) {
            setError(resp.error);
        };
        // TODO: reload leads
        setLoading(false);
    };

    return (
        <>
            <button
                className='m-auto border p-2 rounded-lg select-none cursor-pointer'
                onClick={triggerPythonGenerate}
                disabled={loading}
            >
                generate
            </button>

            <p>{error || ''}</p>
        </>
    );
};
