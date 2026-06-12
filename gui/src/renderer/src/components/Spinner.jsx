export default function Spinner({ size }) {
    return (
        <svg
            className='animate-spin'
            style={{ width: `${size}px`, height: `${size}px` }}
            fill='none'
            viewBox='0 0 24 24'
        >
            <defs>
                <linearGradient
                    id='spinner-gradient'
                    x1='0%'
                    y1='0%'
                    x2='100%'
                    y2='100%'
                >
                    <stop
                        offset='0%'
                        stopColor='oklch(70.7% 0.165 254.624)'
                    />

                    <stop
                        offset='100%'
                        stopColor='oklch(70.2% 0.183 293.541)'
                    />
                </linearGradient>
            </defs>

            <circle
                className='opacity-25'
                cx='12'
                cy='12'
                r='10'
                stroke='#9ca3af'
                strokeWidth='4'
            />

            <path
                className='opacity-75'
                fill={`url(#spinner-gradient)`}
                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
            />
        </svg>
    );
};
