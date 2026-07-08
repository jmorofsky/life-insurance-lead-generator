import { useRef, useEffect } from 'react';


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

export default function Modal({ isOpen, onClose, children, size = 'md' }) {
    const dialogRef = useRef(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) { return };

        if (isOpen) {
            dialog.showModal();
        } else {
            dialog.close();
        };
    }, [isOpen]);

    function handleCancel(e) {
        e.preventDefault();
        onClose();
    };

    return (
        <dialog
            ref={dialogRef}
            onCancel={handleCancel}
            onClick={handleCancel}
            className={`m-auto ${sizeClasses[size]} max-h-[90vh] overflow-hidden rounded-md border border-neutral-500 shadow-lg shadow-neutral-500 transition-[opacity,transform] duration-200 ease-in opacity-100 scale-100
                backdrop:bg-black/35 backdrop:transition-opacity backdrop:duration-200 backdrop:ease-in
                starting:opacity-0 starting:scale-95 starting:backdrop:opacity-0`}
        >
            <div
                className='w-full'
                onClick={e => e.stopPropagation()}
            >
                {children}
            </div>
        </dialog>
    );
};
