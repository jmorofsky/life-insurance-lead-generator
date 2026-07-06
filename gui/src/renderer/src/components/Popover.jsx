const sizeClasses = {
    '3xs': 'w-3xs',
    '2xs': 'w-2xs',
    xs: 'w-xs',
    sm: 'w-sm',
    md: 'w-md',
    lg: 'w-lg',
    xl: 'w-xl',
    '2xl': 'w-2xl',
    '3xl': 'w-3xl',
    '4xl': 'w-4xl',
    '5xl': 'w-5xl',
    '6xl': 'w-6xl',
    '7xl': 'w-7xl'
};

export default function Popover({ children, size = 'xs' }) {
    return (
        <>
            <button
                popoverTarget='popover'
                style={{ anchorName: '--popover' }}
                className='text-xs text-center pe-px inline-block text-white rounded-full bg-blue-500 w-4 select-none cursor-pointer ps-[2px]
                    hover:bg-blue-600'
            >
                ?
            </button>

            <div
                id='popover'
                popover='auto'
                style={{
                    top: 'auto',
                    right: 'auto',
                    margin: '0',
                    bottom: 'anchor(top)',
                    left: 'anchor(center)',
                    transform: 'translateX(-50%)',
                    marginBottom: '12px'
                }}
                className={`${sizeClasses[size]} overflow-visible p-2 border border-neutral-400 shadow shadow-md shadow-neutral-400 text-neutral-800 font-normal`}
            >
                {children}
            </div>
        </>
    );
};
