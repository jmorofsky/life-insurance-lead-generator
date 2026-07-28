import { useEffect, useState } from 'react';
import { animations } from '@formkit/drag-and-drop';
import { useDragAndDrop } from '@formkit/drag-and-drop/react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import LeadTable from './LeadTable';
import Modal from './Modal';
import Popover from './Popover';
import AddCircleIcon from '../assets/add_circle_white.svg';
import RenameIcon from '../assets/rename.svg';
import CopyIcon from '../assets/copy.svg';
import DeleteIcon from '../assets/delete_red.svg';


const static_tables = ['leads_Marriage'];  // these tables can't be edited or deleted
const reserved_columns = ['id', 'row_color'];  // these column names are reserved

const context_item_class = 'flex justify-between px-1 rounded-sm text-neutral-800 cursor-pointer hover:bg-blue-200';
const context_item_class_danger = 'flex justify-between px-1 rounded-sm text-red-500 cursor-pointer hover:bg-red-100';

const name_regex = /^[A-Za-z0-9 _:-]+$/;

export default function Leads({
    datasets, onDatasetClick, onDatasetCreate, onDatasetDelete, onDatasetClone, onDatasetEdit
}) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(null);  // dataset id | null
    const [showEditModal, setShowEditModal] = useState(null);  // dataset id | null

    return (
        <div className='h-full flex flex-col'>
            <h1 className='pl-4 py-4 text-2xl font-semibold border-b-1 border-neutral-300 shadow-lg'>
                Lead Datasets
            </h1>

            <div className='p-6 flex flex-wrap gap-8 overflow-y-auto'>
                {datasets.map(dataset => {
                    // dataset names follow a convention of leads_{table_name}
                    const name = dataset.table_name.slice(6).replaceAll('_', ' ');
                    const [year, month, day] = dataset.created_at.split(' ')[0].split('-');
                    const created_at = `${month}/${day}/${year}`;

                    return (
                        <div key={dataset.id}>
                            <ContextMenu.Root>
                                <ContextMenu.Trigger>
                                    <div
                                        className='w-75 h-fit border border-neutral-400 rounded shadow-lg shadow-neutral-500 cursor-pointer transition
                                            hover:scale-102'
                                        onClick={() => onDatasetClick(dataset.table_name)}
                                    >
                                        <p
                                            className='p-2 font-semibold text-xl bg-linear-to-r from-blue-300 to-fuchsia-300'
                                            style={{ wordBreak: 'break-word' }}
                                        >
                                            {name}
                                        </p>

                                        <div className='p-4'>
                                            <p
                                                className='text-neutral-700 text-sm min-h-10'
                                                style={{ wordBreak: 'break-word' }}
                                            >
                                                {dataset.description}
                                            </p>

                                            <p className='mt-4'>
                                                <strong>{dataset.row_count}</strong>
                                                {dataset.row_count == 1 ?
                                                    <> Lead</>
                                                    :
                                                    <> Leads</>
                                                }
                                            </p>

                                            <p className='text-neutral-700 text-xs text-right'>
                                                Created on {created_at}
                                            </p>
                                        </div>
                                    </div>
                                </ContextMenu.Trigger>

                                <ContextMenu.Portal>
                                    <ContextMenu.Content className='flex flex-col gap-1 p-2 border border-neutral-400 bg-white rounded-md shadow-md shadow-neutral-400 text-sm select-none w-30'>
                                        {!static_tables.includes(dataset.table_name) &&
                                            <ContextMenu.Item
                                                className={context_item_class}
                                                onClick={() => setShowEditModal(dataset.id)}
                                            >
                                                Edit <img src={RenameIcon} className='w-4' />
                                            </ContextMenu.Item>
                                        }

                                        <ContextMenu.Item
                                            className={context_item_class}
                                            onClick={async () => {
                                                await window.api.cloneDataset(dataset);
                                                await onDatasetClone();
                                            }}
                                        >
                                            Clone <img src={CopyIcon} className='w-4' />
                                        </ContextMenu.Item>

                                        {!static_tables.includes(dataset.table_name) &&
                                            <ContextMenu.Item
                                                className={context_item_class_danger}
                                                onClick={() => setShowDeleteModal(dataset.id)}
                                            >
                                                Delete <img src={DeleteIcon} className='w-4' />
                                            </ContextMenu.Item>
                                        }
                                    </ContextMenu.Content>
                                </ContextMenu.Portal>
                            </ContextMenu.Root>

                            <Modal
                                isOpen={dataset.id === showEditModal}
                                onClose={() => setShowEditModal(null)}
                                size='lg'
                            >
                                <EditDataset
                                    datasets={datasets}
                                    dataset={dataset}
                                    onCancel={() => setShowEditModal(null)}
                                    onEdit={() => {
                                        setShowEditModal(null);
                                        onDatasetEdit();
                                    }}
                                />
                            </Modal>

                            <Modal
                                isOpen={dataset.id === showDeleteModal}
                                onClose={() => setShowDeleteModal(null)}
                                size='md'
                            >
                                <div className='p-4'>
                                    Are you sure you want to permanently delete dataset&nbsp;
                                    <code
                                        className='font-semibold text-blue-500'
                                        style={{ wordBreak: 'break-word' }}
                                    >
                                        {name}
                                    </code>?

                                    {!!dataset.row_count &&
                                        <>
                                            <code className='font-semibold text-blue-500'> {dataset.row_count} </code>
                                            {dataset.row_count == 1 ?
                                                <>lead </>
                                                :
                                                <>leads </>
                                            }
                                            will also be deleted.
                                        </>
                                    }

                                    <span className='font-semibold'> This cannot be undone.</span>
                                </div>

                                <div className='h-12 min-h-12 shadow-2xl shadow-black border-t border-neutral-300 flex items-center justify-end select-none'>
                                    <button
                                        className='px-2 py-1 me-5 rounded-sm font-medium transition-colors duration-200 shadow-lg shadow-neutral-300 border border-neutral-300 cursor-pointer 
                                            hover:border-neutral-400 
                                            active:translate-y-px'
                                        onClick={() => setShowDeleteModal(null)}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        className='me-3 flex items-center justify-center gap-2 relative overflow-hidden pl-[8px] pr-[11px] py-1 rounded-sm font-medium transition-colors duration-200 shadow-lg shadow-neutral-300 border border-neutral-300 cursor-pointer 
                                            hover:border-neutral-400 
                                            active:translate-y-px'
                                        onClick={async () => {
                                            await window.api.deleteDataset(dataset.id, dataset.table_name);
                                            await onDatasetDelete();

                                            setShowDeleteModal(null);
                                        }}
                                    >
                                        <span className='inline-block pl-[3px] text-red-400'>🞛</span>
                                        Delete
                                    </button>
                                </div>
                            </Modal>
                        </div>
                    );
                })}
            </div>

            <div className='absolute z-1 right-6 bottom-6 select-none'>
                <img
                    src={AddCircleIcon}
                    title="Add new dataset."
                    className='w-10 rounded-full cursor-pointer shadow-md shadow-neutral-400 bg-blue-300 transition
                        hover:scale-110 hover:rotate-45
                        active:translate-y-px'
                    onClick={() => setShowCreateModal(true)}
                />
            </div>

            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                size='2xl'
            >
                <CreateDataset
                    datasets={datasets}
                    onCancel={() => setShowCreateModal(false)}
                    onCreate={() => {
                        setShowCreateModal(false);
                        onDatasetCreate();
                    }}
                />
            </Modal>
        </div>
    );
};


function EditDataset({ datasets, dataset, onCancel, onEdit }) {
    const [name, setName] = useState(dataset.table_name.slice(6).replaceAll('_', ' '));
    const [description, setDescription] = useState(dataset.description);
    const [validationError, setValidationError] = useState(null);

    function resetState() {
        setName(dataset.table_name.slice(6).replaceAll('_', ' '));
        setDescription(dataset.description);
        setValidationError(null);
    };
    
    function validateForm() {
        if (!name) {
            setValidationError("Dataset name is required.");
            return;
        };

        if (name.length < 3 || name.length > 50) {
            setValidationError("Dataset name must be between 3 and 50 characters long.");
            return;
        };

        if (!name_regex.test(name)) {
            setValidationError("Dataset name contains an invalid character.");
            return;
        };

        if (datasets.find(d => d.table_name.toLowerCase() === `leads_${name}`.toLowerCase() && d.id !== dataset.id )) {
            setValidationError("A dataset with that name already exists.");
            return;
        };

        if (description.length > 100) {
            setValidationError("Dataset description must be less than 100 characters long.");
            return;
        };

        return true;
    };

    return (
        <div className='flex flex-col'>
            <h1 className='p-4 text-2xl font-semibold shadow-lg shadow-neutral-300 border-b border-neutral-300'>
                Edit Dataset
            </h1>

            <div className='p-6'>
                <label
                    htmlFor='input-dataset-name'
                    className='text-neutral-800 font-medium'
                >
                    Name:
                </label><br />

                <input
                    id='input-dataset-name'
                    type='text'
                    className='p-2 border border-neutral-300 rounded-md w-full mb-4'
                    placeholder='Dataset Name'
                    value={name}
                    maxLength={50}
                    onChange={e => setName(e.target.value)}
                />

                <label
                    htmlFor='input-dataset-description'
                    className='text-neutral-800 font-medium'
                >
                    Description:
                </label><br />

                <input
                    id='input-dataset-description'
                    type='text'
                    className='p-2 border border-neutral-300 rounded-md w-full'
                    placeholder='Dataset Description'
                    value={description}
                    maxLength={100}
                    onChange={e => setDescription(e.target.value)}
                />
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
                        onClick={() => {
                            resetState();
                            onCancel();
                        }}
                    >
                        Cancel
                    </button>

                    <button
                        className='flex items-center justify-center gap-2 relative overflow-hidden pl-[8px] pr-[11px] py-1 rounded-sm font-medium transition-colors duration-200 shadow-lg shadow-neutral-300 border border-neutral-300 cursor-pointer 
                                hover:border-neutral-400 
                                active:translate-y-px'
                        onClick={async () => {
                            if (!validateForm()) { return };

                            await window.api.editDataset(dataset, name, description);
                            onEdit();
                        }}
                    >
                        <span className='animate-sparkle inline-block pl-[3px]'>✦</span>
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};


const defaultColumns = [{
    id: 0,
    title: '',
    type: '',
    required: false
}];

function CreateDataset({ datasets, onCancel, onCreate }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [validationError, setValidationError] = useState(null);

    const [containerRef, columns, setColumns] = useDragAndDrop(structuredClone(defaultColumns), {
        dragHandle: '.drag-handle',
        plugins: [animations()]
    });

    function resetState() {
        setName('');
        setDescription('');
        setValidationError(null);
        setColumns(structuredClone(defaultColumns));
    };

    function validateForm() {
        if (!name) {
            setValidationError("Dataset name is required.");
            return;
        };

        if (name.length < 3 || name.length > 50) {
            setValidationError("Dataset name must be between 3 and 50 characters long.");
            return;
        };

        if (!name_regex.test(name)) {
            setValidationError("Dataset name contains an invalid character.");
            return;
        };

        if (datasets.find(dataset => dataset.table_name.toLowerCase() === `leads_${name}`.toLowerCase())) {
            setValidationError("A dataset with that name already exists.");
            return;
        };

        if (description.length > 100) {
            setValidationError("Dataset description must be less than 100 characters long.");
            return;
        };

        if (!columns.length) {
            setValidationError("Dataset must have at least one column.");
            return;
        };

        for (const column of columns) {
            if (!column.title) {
                setValidationError("Each column must have a name.");
                return;
            };

            if (column.title < 3) {
                setValidationError("Column names must be at least 3 characters long.");
                return;
            };

            if (!name_regex.test(column.title)) {
                setValidationError(`Column name ${column.title} contains an invalid character.`);
                return;
            };

            if (reserved_columns.includes(column.title)) {
                setValidationError(`Column name ${column.title} is reserved.`);
                return;
            };

            if (columns.find(c => c.id !== column.id && c.title === column.title)) {
                setValidationError("Column names must be unique.");
                return;
            };
        };

        return true;
    };

    return (
        <div className='flex flex-col max-h-[90vh]'>
            <h1 className='p-4 text-2xl font-semibold shadow-lg shadow-neutral-300 border-b border-neutral-300'>
                Create Empty Dataset
            </h1>

            <div className='p-6 overflow-y-auto h-[90%]'>
                <div className='flex gap-4'>
                    <div className='w-[50%]'>
                        <label
                            htmlFor='input-dataset-name'
                            className='text-neutral-800 font-medium'
                        >
                            Name:
                        </label><br />

                        <input
                            id='input-dataset-name'
                            type='text'
                            className='p-2 border border-neutral-300 rounded-md w-full'
                            placeholder='Dataset Name'
                            value={name}
                            maxLength={50}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>

                    <div className='w-[50%]'>
                        <label
                            htmlFor='input-dataset-description'
                            className='text-neutral-800 font-medium'
                        >
                            Description:
                        </label><br />

                        <input
                            id='input-dataset-description'
                            type='text'
                            className='p-2 border border-neutral-300 rounded-md w-full'
                            placeholder='Dataset Description'
                            value={description}
                            maxLength={100}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>
                </div>

                <table className='mt-4 w-full table-auto border border-neutral-300'>
                    <thead className='bg-blue-50'>
                        <tr className='text-left text-neutral-800 cursor-default'>
                            <th>{/* drag handle */}</th>

                            <th className='font-medium py-2'>Column Title:</th>

                            <th className='font-medium'>Column Type:</th>

                            <th className='font-medium relative'>
                                <span className='me-3'>Required:</span>

                                <Popover size='3xs'>
                                    Required columns must have a value when creating or editing rows.
                                </Popover>
                            </th>

                            <th>{/* delete button */}</th>
                        </tr>
                    </thead>

                    <tbody ref={containerRef}>
                        {columns.map((col, i) => (
                            <tr
                                key={col.id}
                                className='border-y border-neutral-300'
                            >
                                <td className='select-none ps-4 pe-2'>
                                    <span className='drag-handle w-fit cursor-grab
                                        active:cursor-grabbing'
                                    >
                                        ⋮⋮
                                    </span>
                                </td>

                                <td className='py-2 pe-4'>
                                    <input
                                        type='text'
                                        className='p-2 border border-neutral-300 rounded-md w-full'
                                        placeholder='Title'
                                        value={col.title}
                                        maxLength={50}
                                        onChange={e => {
                                            const updatedColumns = [...columns];

                                            updatedColumns[i].title = e.target.value;
                                            setColumns(updatedColumns);
                                        }}
                                    />
                                </td>

                                <td className='pe-4'>
                                    <select
                                        className='p-2 border border-neutral-300 rounded-md w-full'
                                        value={col.type}
                                        onChange={e => {
                                            const updatedColumns = [...columns];

                                            updatedColumns[i].type = e.target.value;
                                            setColumns(updatedColumns);
                                        }}
                                    >
                                        <option value='text'>Text</option>
                                        <option value='date'>Date</option>
                                        <option value='integer'>Integer</option>
                                        <option value='decimal'>Decimal</option>
                                        <option value='double'>Percentage</option>
                                    </select>
                                </td>

                                <td>
                                    <input
                                        type='checkbox'
                                        className='mt-[8px] w-4 h-4 accent-blue-500 cursor-pointer'
                                        checked={col.required}
                                        onChange={e => {
                                            const updatedColumns = [...columns];

                                            updatedColumns[i].required = e.target.checked;
                                            setColumns(updatedColumns);
                                        }}
                                    />
                                </td>

                                <td className='ps-4 pe-3'>
                                    <span
                                        title="Delete this column."
                                        className='text-neutral-400 cursor-pointer select-none transition
                                            hover:text-neutral-800'
                                        onClick={e => {
                                            if (columns.length <= 1) { return };

                                            const updatedColumns = [...columns];
                                            updatedColumns.splice(i, 1);

                                            setColumns(updatedColumns);
                                        }}
                                    >
                                        ✕
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className='flex justify-end me-[22px] mt-4'>
                    <span
                        title="Add new column."
                        className='w-fit rotate-45 text-sm cursor-pointer text-neutral-400 select-none transition
                            hover:text-neutral-800'
                        onClick={() => setColumns([...columns, {
                            id: Date.now().toString(),
                            title: '',
                            type: '',
                            required: false
                        }])}
                    >
                        ✕
                    </span>
                </div>
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
                        onClick={() => {
                            resetState();
                            onCancel();
                        }}
                    >
                        Cancel
                    </button>

                    <button
                        className='flex items-center justify-center gap-2 relative overflow-hidden pl-[8px] pr-[11px] py-1 rounded-sm font-medium transition-colors duration-200 shadow-lg shadow-neutral-300 border border-neutral-300 cursor-pointer 
                                hover:border-neutral-400 
                                active:translate-y-px'
                        onClick={async () => {
                            if (!validateForm()) { return };

                            const schema_json = {
                                name: name,
                                description: description || null,
                                columns: columns
                            };
                            await window.api.createDataset(schema_json);

                            resetState();
                            onCreate();
                        }}
                    >
                        <span className='animate-sparkle inline-block pl-[3px]'>✦</span>
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};
