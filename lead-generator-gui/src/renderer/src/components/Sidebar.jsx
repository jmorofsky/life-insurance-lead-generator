import DashboardIcon from '../assets/dashboard.svg';
import LeadsIcon from '../assets/leads.svg';
import GenerateIcon from '../assets/generate.svg';


export default function Sidebar({ currentView, onNavClick }) {
    const NavItem = ({ icon, activeIcon, title }) => {
        const selected = currentView === title;

        return (
            <div
                className={`flex flex-col gap-1 cursor-pointer h-fit w-full text-center py-2 pe-[3px] transition 
                    hover:bg-neutral-600 border-l-3 
                    ${selected ? 'bg-neutral-600 border-blue-400' : 'border-transparent'}`}
                onClick={() => onNavClick(title)}
            >
                <img src={icon} className='h-[40px]' />
                <strong>{title}</strong>
            </div>
        );
    };

    return (
        <div className='bg-neutral-800 text-white w-[100px] flex flex-col items-center gap-3 pt-4'>
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
        </div>
    );
};
