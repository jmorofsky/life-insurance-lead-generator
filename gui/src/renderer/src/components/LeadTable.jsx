import { useState, useMemo, useEffect } from 'react';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import Spinner from './Spinner';
import Compact from '@uiw/react-color-compact';
import BackArrowIcon from '../assets/arrow_back.svg';
import ColorResetIcon from '../assets/colorReset.svg';
import CloseIcon from '../assets/close.svg';
import EditIcon from '../assets/edit.svg';
import DeleteIcon from '../assets/delete.svg';
import AddCircleIcon from '../assets/add_circle.svg';


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

export default function LeadTable({
    dataset, onBackArrowClick, onColorChange, onRowCreate, onCellUpdate, onRowDelete
}) {
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
    const [validationError, setValidationError] = useState(null);

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

    function validateRow(values) {
        for (const col of Object.keys(values)) {
            if (!values[col]) {
                const match = dataset.columns.find(c => c.name === col);

                if (match && match.notnull) {
                    return `${col} is required.`;
                };
            };
        };

        return 'success';
    };

    const columns = useMemo(() => dataset.columns.map(col => {
        if (col.pk || col.name === 'row_color') { return };

        // by convention, a column type of 'DOUBLE' indicates a percentage
        switch (col.type) {
            case 'TEXT':
                return {
                    header: col.name,
                    accessorKey: col.name,
                    Cell: ({ renderedCellValue, row }) => (
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
                    )
                };

            default:
                return {
                    header: col.name,
                    accessorKey: col.name
                };
        };
    }).filter(Boolean), [dataset.columns]);

    const table = useMaterialReactTable({
        columns,
        data,
        enableEditing: selectedTool === 'edit',
        editDisplayMode: 'cell',
        createDisplayMode: 'modal',
        enableStickyHeader: true,
        enableStickyFooter: true,
        autoResetPageIndex: false,
        enableRowVirtualization: true,
        enableColumnVirtualization: true,
        initialState: {
            density: 'compact',
            pagination: { pageIndex: 0, pageSize: 100 }
        },
        renderCreateRowDialogContent: ({ table, row, internalEditComponents }) => (
            <>
                <h1 className='p-2 text-xl font-semibold border-b border-neutral-500 shadow-lg'>
                    Add Lead
                </h1>

                <div className='p-2 pb-4 flex flex-col gap-3 overflow-y-scroll'>
                    {internalEditComponents}
                </div>

                <div className='h-12 min-h-12 shadow-2xl shadow-black border-t border-neutral-300 flex items-center justify-between'>
                    <p className='px-3 text-red-400 font-mono font-semibold text-sm'>
                        {validationError}
                    </p>

                    <div className='flex px-3 gap-5 select-none'>
                        <button
                            className='px-2 py-1 rounded-sm font-medium transition-colors duration-200 shadow-lg shadow-neutral-300 border border-neutral-300 cursor-pointer
                                hover:border-neutral-400 
                                active:translate-y-px'
                            onClick={() => table.setCreatingRow(null)}
                        >
                            Cancel
                        </button>

                        <button
                            className='flex items-center justify-center gap-2 relative overflow-hidden pl-[8px] pr-[11px] py-1 rounded-sm font-medium transition-colors duration-200 shadow-lg shadow-neutral-300 border border-neutral-300 cursor-pointer
                                hover:border-neutral-400 
                                active:translate-y-px'
                            onClick={async () => {
                                const result = validateRow(row._valuesCache);

                                if (result === 'success') {
                                    await onRowCreate(dataset.name, row._valuesCache);
                                    table.setCreatingRow(null);
                                } else {
                                    setValidationError(result);
                                };
                            }}
                        >
                            <span className='animate-sparkle inline-block pl-[3px]'>✦</span>
                            Save
                        </button>
                    </div>
                </div>
            </>
        ),
        muiEditRowDialogProps: {
            sx: {
                '& .MuiPaper-root:focus': {
                    outline: 'none'
                }
            }
        },
        muiEditTextFieldProps: ({ cell, row }) => ({
            onBlur: e => {
                if (selectedTool !== 'edit') { return };

                const row_id = parseInt(row.original.id);
                const value = e.target.value.trim() || null;

                onCellUpdate(dataset.name, row_id, cell.column.id, value);
            },
            sx: {
                '& .MuiInputBase-input': {
                    color: getContrastColor(row.original.row_color),
                }
            }
        }),
        muiTableBodyCellProps: ({ row }) => ({
            sx: {
                color: getContrastColor(row.original.row_color)
            }
        }),
        muiTableBodyRowProps: ({ row }) => {
            const colorKey = row.original.row_color ?? '#fff';

            return {
                sx: {
                    backgroundColor: colorKey ?? 'inherit',
                    cursor: selectedTool ? 'pointer' : null
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
        muiTablePaperProps: {
            sx: { height: '100%' }
        },
        muiTableContainerProps: {
            sx: {
                height: '100%',
                contain: 'strict',
                willChange: 'transform'
            }
        },
        renderTopToolbarCustomActions: ({ table }) => (
            <div className='flex gap-2'>
                <img
                    src={BackArrowIcon}
                    className='self-start cursor-pointer w-6 p-1 rounded transition 
                        hover:bg-neutral-200'
                    onClick={onBackArrowClick}
                />

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
                                className='cursor-pointer transition text-neutral-500 
                                    hover:text-black'
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

                <div className='flex flex-col justify-center gap-1'>
                    <div className='flex'>
                        <img
                            src={EditIcon}
                            className={`cursor-pointer w-10 p-2 rounded-full transition border
                                hover:bg-neutral-100
                                ${selectedTool === 'edit' ?
                                    'bg-neutral-100 border-neutral-400'
                                    :
                                    'border-transparent'
                                }
                            `}
                            title="Edit lead."
                            onClick={() => {
                                if (selectedTool === 'edit') {
                                    setSelectedTool(null);
                                } else {
                                    setSelectedTool('edit');
                                };
                            }}
                        />

                        <img
                            src={DeleteIcon}
                            className={`cursor-pointer w-10 p-2 rounded-full transition border
                                hover:bg-red-50
                                ${selectedTool === 'delete' ?
                                    'bg-red-50 border-red-300'
                                    :
                                    'border-transparent'
                                }
                            `}
                            title="Delete lead."
                            onClick={() => {
                                if (selectedTool === 'delete') {
                                    setSelectedTool(null);
                                } else {
                                    setSelectedTool('delete');
                                };
                            }}
                        />
                    </div>

                    <img
                        src={AddCircleIcon}
                        className={`cursor-pointer w-10 p-2 rounded-full transition
                            hover:bg-neutral-100
                        `}
                        title="Add new lead."
                        onClick={() => {
                            setValidationError(null);
                            setSelectedTool(null);
                            table.setCreatingRow(true);
                        }}
                    />
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

    return <MaterialReactTable table={table} />;
};
