import DashboardIcon from '../assets/dashboard.svg';
import LeadsIcon from '../assets/leads.svg';
import GenerateIcon from '../assets/generate.svg';
import GavelIcon from '../assets/gavel.svg';


export default function Sidebar({ currentView, onNavClick }) {
    const NavItem = ({ icon, title, style = 'light' }) => {
        const selected = currentView === title;

        const bgColor = style === 'light' ? 'bg-neutral-600' : 'bg-neutral-700'

        return (
            <div
                className={`flex flex-col gap-1 cursor-pointer h-fit w-full text-center py-2 pe-[3px] transition 
                    hover:bg-neutral-600 border-l-3 
                    ${selected ? `${bgColor} border-blue-400` : 'border-transparent'}`}
                onClick={() => {
                    if (title !== currentView) {
                        onNavClick(title);
                    };
                }}
            >
                <img src={icon} className='h-[40px]' />
                <strong>{title}</strong>
            </div>
        );
    };

    return (
        <div className='bg-neutral-800 text-white w-[100px] flex flex-col items-center gap-3 pt-4 shrink-0 select-none'>
            <NavItem
                icon={DashboardIcon}
                title='Dashboard'
            />

            <NavItem
                icon={LeadsIcon}
                title='Leads'
            />

            <NavItem
                icon={GenerateIcon}
                title='Generate'
            />

            <div
                className='w-full justify-end flex flex-col gap-3 grow-1 text-neutral-400'
            >
                <NavItem
                    icon={GavelIcon}
                    title='Legal'
                    style='dark'
                />
            </div>
        </div>
    );
};
