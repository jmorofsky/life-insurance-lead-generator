import { useState, useMemo, useEffect } from 'react';
import {
    MaterialReactTable,
    useMaterialReactTable,
} from 'material-react-table';
import Spinner from './Spinner';
import Github from '@uiw/react-color-github';
import ColorResetIcon from '../assets/colorReset.svg';
import CloseIcon from '../assets/close.svg';


function getContrastColor(hexColor) {
    if (!hexColor) { return '#000' };

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

export default function LeadTable({ dataset, onColorChange }) {
    const [isRendering, setIsRendering] = useState(true);
    const [enableColor, setEnableColor] = useState(false);
    const [selectedColor, setSelectedColor] = useState(null);

    const data = dataset.data;

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsRendering(false);
        }, 10);

        return () => clearTimeout(timer);
    }, []);

    const columns = useMemo(() => dataset.columns.map(col => {
        if (col.pk || col.name === 'row_color') { return };

        const exceptions = ['and', 'or', 'the', 'of', 'in', 'to', 'a', 'an', 'for', 'but', 'by', 'with', 'at'];
        const formatted_name = col.name
            .split('_')
            .map((word, i) => {
                if (i === 0 || !exceptions.includes(word)) {
                    return word.charAt(0).toUpperCase() + word.slice(1);
                };

                return word;
            })
            .join(' ');

        switch (col.type) {
            case 'DATE':
                return {
                    header: formatted_name,
                    accessorFn: row => {
                        return row[col.name]?.split('T')[0];
                    }
                };

            case 'TEXT':
                return {
                    header: formatted_name,
                    accessorKey: col.name,
                    Cell: ({ renderedCellValue, row }) => useMemo(() => (
                        <>
                            {URL.canParse(row.original[col.name]) ?
                                <p>
                                    <a
                                        href={row.original[col.name]}
                                        title={row.original[col.name]}
                                        target='_blank'
                                        className='cursor-alias hover:underline'
                                        onClick={e => e.stopPropagation()}
                                    >
                                        {renderedCellValue.length > 22 ?
                                            `${renderedCellValue.slice(0, 22)} ...`
                                            :
                                            renderedCellValue
                                        }
                                    </a> ↗
                                </p>
                                :
                                renderedCellValue
                            }
                        </>
                    ), [])
                };

            default:
                return {
                    header: formatted_name,
                    accessorKey: col.name
                };
        };
    }).filter(Boolean), []);

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
        muiTableBodyCellProps: ({ row }) => {
            return {
                sx: {
                    color: getContrastColor(row.original.row_color)
                }
            };
        },
        muiTableBodyRowProps: ({ row }) => {
            const colorKey = data[row.id].row_color;

            return {
                sx: {
                    backgroundColor: colorKey ?? 'inherit',
                    cursor: enableColor ? 'pointer' : null,
                },
                onClick: e => {
                    if (!enableColor) { return };
                    onColorChange(dataset.name, row.id, selectedColor);
                }
            };
        },
        muiTablePaperProps: () => {
            return {
                sx: { height: '100%' }
            };
        },
        muiTableContainerProps: () => {
            return {
                sx: { height: '100%' }
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
            <div className='flex h-full'>
                <div className='m-auto w-fit'>
                    <Spinner size={45} />
                </div>
            </div>
        );
    };

    return <MaterialReactTable table={table} />;
};
