import { useState, useEffect } from 'react';


const format = [
    {
        start: 0,
        end: 5,
        name: 'midnight',
        gradient: ['#475569', '#818cf8', '#c7d2fe']
    },
    {
        start: 5,
        end: 7,
        name: 'dawn',
        gradient: ['#c084fc', '#f472b6', '#fb923c']
    },
    {
        start: 7,
        end: 12,
        name: 'morning',
        gradient: ['#f59e0b', '#fbbf24', '#93c5fd']
    },
    {
        start: 12,
        end: 17,
        name: 'afternoon',
        gradient: ['#0ea5e9', '#38bdf8', '#fde047']
    },
    {
        start: 17,
        end: 20,
        name: 'evening',
        gradient: ['#f97316', '#f472b6', '#a855f7']
    },
    {
        start: 20,
        end: 24,
        name: 'night',
        gradient: ['#818cf8', '#6366f1', '#a78bfa']
    },
];

const now = new Date();
const h = now.getHours();
const timeOfDay = format.find(x => h >= x.start && h < x.end) || format[0];
const gr = `linear-gradient(90deg, ${timeOfDay.gradient.join(', ')})`;

export default function Clock() {
    const [time, setTime] = useState(new Date().toLocaleTimeString());

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date().toLocaleTimeString());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className='text-neutral-700 select-none w-fit'>
            <p className='font-mono font-bold text-sm text-end relative top-[6px]'>
                {time}
            </p>

            <p className='text-xl font-semibold'>
                {['midnight', 'dawn'].includes(timeOfDay.name) ?
                    'it\'s'
                    :
                    'good'
                }&nbsp;

                <span
                    className='font-bold text-5xl'
                    style={{ color: 'transparent', background: gr + 'text' }}
                >
                    {timeOfDay.name.toUpperCase()}
                </span>
            </p>
        </div>
    );
};
