import { useState, useMemo, useEffect } from 'react';
import {
    MaterialReactTable,
    useMaterialReactTable,
} from 'material-react-table';
import Spinner from './Spinner';
import Compact from '@uiw/react-color-compact';
import BackArrowIcon from '../assets/arrow_back.svg';
import ColorResetIcon from '../assets/colorReset.svg';
import CloseIcon from '../assets/close.svg';
import DeleteIcon from '../assets/delete.svg';


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

export default function LeadTable({ dataset, onBackArrowClick, onColorChange, onRowDelete }) {
    /**
    @param {object} dataset {
        name {str}: table_name
        columns {array}: PRAGMA table_info
        data {array}: data rows
    }
    */

    const [isRendering, setIsRendering] = useState(true);
    const [selectedTool, setSelectedTool] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);

    const data = dataset.data;

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsRendering(false);
        }, 10);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (selectedTool !== 'color' && selectedColor) {
            setSelectedColor(null);
        };
    }, [selectedTool]);

    const columns = useMemo(() => dataset.columns.map(col => {
        if (col.pk || col.name === 'row_color') { return };

        const formatted_name = col.name.replace('_', ' ');

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
                                        {renderedCellValue.length > 20 ?
                                            `${renderedCellValue.slice(0, 20)} ...`
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
                    cursor: selectedTool ? 'cell' : 'pointer',
                },
                onClick: e => {
                    if (!selectedTool) { return };

                    const row_id = parseInt(row.original.id);

                    switch (selectedTool) {
                        case 'color':
                            onColorChange(dataset.name, row_id, selectedColor);
                            break;
                        case 'delete':
                            onRowDelete(dataset.name, row_id);
                            break;
                        default:
                            return;
                    };
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
            <div className='flex gap-2'>
                <img
                    src={BackArrowIcon}
                    className='self-start cursor-pointer w-6 p-1 rounded transition 
                        hover:bg-neutral-200'
                    onClick={onBackArrowClick}
                />

                <div className='flex items-center'>
                    <div>
                        <Compact
                            color={selectedColor}
                            onChange={color => {
                                setSelectedTool('color');
                                setSelectedColor(color.hex);
                            }}
                            style={{
                                width: '245px',
                                boxShadow: 'rgb(0 0 0 / 15%) 0px 0px 0px 1px, rgb(0 0 0 / 15%) 0px 8px 16px'
                            }}
                            rectRender={props => {
                                if (props.color !== '#AB149E') { return };

                                return (
                                    <button
                                        className='cursor-pointer transition text-neutral-500 hover:text-black'
                                        title="Clear selection."
                                        style={{
                                            width: 15,
                                            height: 15,
                                            lineHeight: '10px'
                                        }}
                                        onClick={e => {
                                            e.stopPropagation();
                                            setSelectedColor(null);
                                            setSelectedTool(null);
                                        }}
                                    >
                                        ✕
                                    </button>
                                );
                            }}
                        />
                    </div>

                    <div className='flex flex-col gap-1 ml-2'>
                        <div className='flex gap-2'>

                        </div>

                        <div>
                            <img
                                src={DeleteIcon}
                                className={`cursor-pointer p-1 rounded border transition
                                    hover:border-red-300 
                                    ${selectedTool === 'delete' ?
                                        'bg-red-50 border-red-300'
                                        :
                                        'border-transparent'
                                    }
                                `}
                                title='Delete lead.'
                                onClick={() => {
                                    if (selectedTool === 'delete') {
                                        setSelectedTool(null);
                                    } else {
                                        setSelectedTool('delete');
                                    };
                                }}
                            />
                        </div>
                    </div>
                </div>
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

    return <MaterialReactTable table={table} key={data.length} />;
};
