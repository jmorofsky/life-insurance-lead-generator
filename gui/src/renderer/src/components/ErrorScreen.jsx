import WarningIcon from '../assets/warning.svg';


const bug_report_url = import.meta.env.RENDERER_VITE_BUG_REPORT_URL

export default function ErrorScreen({ error }) {
    return (
        <div className='w-screen h-screen flex flex-col justify-center items-center'>
            <div className='p-16 flex flex-col items-center border-10 border-neutral-300 rounded-lg shadow-xl text-neutral-800'>
                <img
                    src={WarningIcon}
                    className='w-30'
                />

                <h1 className='font-semibold text-2xl'>Something went wrong.</h1>
                <p>An error occurred on this page. Please restart the app.</p>

                <p>
                    If this continues to happen, you can submit a bug report&nbsp;
                    <a
                        href={bug_report_url}
                        title={bug_report_url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-blue-400 transition
                            hover:text-blue-300'
                    >
                        here ↗
                    </a>
                    .
                </p>

                <button
                    className='mt-6 px-2 py-1 cursor-pointer font-semibold rounded shadow-md shadow-neutral-300 border border-neutral-300 transition
                        hover:border-neutral-400
                        active:translate-y-px'
                    onClick={() => {
                        window.api.restart();
                    }}
                >
                    Restart Application
                </button>

                <pre className='mt-6 text-red-400'>{error}</pre>
            </div>
        </div>
    );
};
