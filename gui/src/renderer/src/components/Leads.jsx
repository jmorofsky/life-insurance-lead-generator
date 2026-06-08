import { useState, useMemo, useEffect } from 'react';
import {
    MaterialReactTable,
    useMaterialReactTable,
} from 'material-react-table';
import Github from '@uiw/react-color-github';
import ColorResetIcon from '../assets/colorReset.svg';
import CloseIcon from '../assets/close.svg';


function getContrastColor(hexColor) {
    if (!hexColor) return '#000';

    const hex = hexColor.replace('#', '');

    const fullHex = hex.length === 3 ?
        hex.split('').map(char => char + char).join('')
        :
        hex;

    const r = parseInt(fullHex.substring(0, 2), 16);
    const g = parseInt(fullHex.substring(2, 4), 16);
    const b = parseInt(fullHex.substring(4, 6), 16);

    // YIQ brightness formula
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? '#000' : '#fff';
};

export default function LeadTable({ data, onColorChange }) {
    const [isRendering, setIsRendering] = useState(true);
    const [enableColor, setEnableColor] = useState(false);
    const [selectedColor, setSelectedColor] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsRendering(false);
        }, 10);

        return () => clearTimeout(timer);
    }, []);

    const columns = useMemo(() => [
        {
            header: 'Source',
            accessorKey: 'source',
            Cell: ({ renderedCellValue, row }) => useMemo(() => (
                <span>
                    <a
                        href={row.original.source_url}
                        target='_blank'
                        title={row.original.source_url}
                        className='cursor-alias hover:underline'
                    >
                        {renderedCellValue}
                    </a> ↗
                </span>
            ), [])
        },
        {
            header: 'Spouse1 First',
            accessorKey: 'spouse1_first'
        },
        {
            header: 'Spouse1 Middle',
            accessorKey: 'spouse1_middle'
        },
        {
            header: 'Spouse1 Last',
            accessorKey: 'spouse1_last'
        },
        {
            header: 'Spouse1 DoB',
            accessorKey: 'spouse1_dob'
        },
        {
            header: 'Spouse2 First',
            accessorKey: 'spouse2_first'
        },
        {
            header: 'Spouse2 Middle',
            accessorKey: 'spouse2_middle'
        },
        {
            header: 'Spouse2 Last',
            accessorKey: 'spouse2_last'
        },
        {
            header: 'Spouse2 DoB',
            accessorKey: 'spouse2_dob'
        },
        {
            header: 'Married Last Name',
            accessorKey: 'married_last_name'
        },
        {
            header: 'License Date',
            accessorKey: 'license_date'
        },
        {
            header: 'License Number',
            accessorKey: 'license_number'
        },
        {
            header: 'Wedding Date',
            accessorKey: 'wedding_date'
        },
        {
            header: 'Wedding County',
            accessorKey: 'wedding_county'
        },
        {
            header: 'Wedding State',
            accessorKey: 'wedding_state'
        },
        {
            header: 'Generated Date',
            accessorFn: (row) => {
                return row.scraped_at.split('T')[0]
            }
        },
        {
            header: 'Score',
            accessorKey: 'score'
        }
    ], []);

    const table = useMaterialReactTable({
        columns,
        data,
        enableStickyHeader: true,
        enableStickyFooter: true,
        autoResetPageIndex: false,
        enableRowVirtualization: true,
        enableColumnVirtualization: true,
        initialState: {
            density: 'compact',
            pagination: { pageIndex: 0, pageSize: 100 }
        },
        muiTablePaperProps: {
            sx: {
                minHeight: '100%', flexGrow: 1
            }
        },
        muiTableBodyCellProps: ({ row }) => {
            return {
                sx: {
                    color: getContrastColor(row.original.rowColor)
                }
            };
        },
        muiTableBodyRowProps: ({ row }) => {
            const colorKey = data[row.id].rowColor;

            return {
                sx: {
                    backgroundColor: colorKey ?? 'inherit',
                    cursor: enableColor ? 'pointer' : null,
                },
                onClick: e => {
                    if (!enableColor) { return };
                    onColorChange(row.id, selectedColor);
                }
            };
        },
        renderTopToolbarCustomActions: ({ table }) => (
            <div className='flex gap-2 items-center'>
                <Github
                    color={selectedColor}
                    onChange={color => {
                        setEnableColor(true);
                        setSelectedColor(color.hex);
                    }}
                    style={{ width: '412px' }}
                />

                <img
                    src={ColorResetIcon}
                    onClick={() => {
                        setEnableColor(true);
                        setSelectedColor(null);
                    }}
                    className={`cursor-pointer p-1 rounded border transition
                        hover:border-neutral-400
                        ${enableColor && selectedColor === null ?
                            'bg-neutral-200 border-neutral-400'
                            :
                            'border-transparent'
                        }`
                    }
                    title='#FFFFFF'
                />

                <img
                    src={CloseIcon}
                    onClick={() => {
                        setEnableColor(false);
                        setSelectedColor(null);
                    }}
                    className='cursor-pointer'
                    title='Clear color selection.'
                />
            </div>
        )
    });

    if (isRendering) {
        return (
            <div className='m-auto'>
                <svg
                    class='animate-spin size-10'
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
            </div>
        );
    };

    return <MaterialReactTable table={table} />;
};
