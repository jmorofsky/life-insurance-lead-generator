import { useState, useMemo } from 'react';
import {
    MaterialReactTable,
    useMaterialReactTable,
} from 'material-react-table';
import Github from '@uiw/react-color-github';
import ColorResetIcon from '../assets/colorReset.svg';
import CloseIcon from '../assets/close.svg';


export default function Leads({ data, onColorChange }) {
    const [enableColor, setEnableColor] = useState(false);
    const [selectedColor, setSelectedColor] = useState(null);

    const columns = useMemo(() => [
        {
            header: 'Name',
            accessorKey: 'name'
        },
        {
            header: 'Age',
            accessorKey: 'age'
        }
    ], []);

    const table = useMaterialReactTable({
        columns,
        data,
        enableStickyHeader: true,
        initialState: {
            density: 'compact',
            pagination: { pageIndex: 0, pageSize: 100 }
        },
        muiTablePaperProps: {
            sx: { minHeight: '100%' }
        },
        muiTableBodyRowProps: ({ row }) => {
            const colorKey = data[row.id].color;

            return {
                sx: {
                    backgroundColor: colorKey ?? 'inherit',
                    cursor: enableColor ? 'pointer' : null
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

    return <MaterialReactTable table={table} />;
};
