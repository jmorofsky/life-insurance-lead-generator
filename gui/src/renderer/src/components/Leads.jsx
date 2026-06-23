import LeadTable from './LeadTable';


export default function Leads({ datasets, onDatasetClick }) {
    return (
        <>
            <h1 className='pl-4 py-4 text-2xl font-semibold border-b-1 border-neutral-300 shadow-lg'>
                Lead Datasets
            </h1>

            <div className='p-6 flex flex-wrap gap-8'>
                {datasets.map(dataset => {
                    // dataset names follow a convention of leads_{table_name}
                    const name = dataset.table_name.slice(6).replace('_', ' ');
                    const [year, month, day] = dataset.created_at.split(' ')[0].split('-');
                    const created_at = `${month}/${day}/${year}`;

                    return (
                        <div
                            key={dataset.id}
                            className='w-75 border border-neutral-400 rounded shadow-lg shadow-neutral-500 cursor-pointer transition
                                hover:scale-102'
                            onClick={() => onDatasetClick(dataset.table_name)}
                        >
                            <p className='p-2 font-semibold text-xl bg-linear-to-r from-blue-300 to-fuchsia-300'>
                                {name}
                            </p>

                            <div className='p-4'>
                                <p className='text-neutral-700 text-sm'>
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
                    );
                })}
            </div>
        </>
    );
};
