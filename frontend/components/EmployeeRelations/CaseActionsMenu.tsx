import { Menu, MenuItem, MenuButton, MenuItems, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { MoreVertical, Eye, Edit2, CheckCircle, Trash2 } from 'lucide-react';

interface CaseActionsMenuProps {
    caseId: string;
    onView?: () => void;
    onEdit?: () => void;
    onMarkComplete?: () => void;
    onDelete?: () => void;
}

export const CaseActionsMenu = ({
    caseId,
    onView,
    onEdit,
    onMarkComplete,
    onDelete
}: CaseActionsMenuProps) => {
    return (
        <Menu as="div" className="relative inline-block text-left z-50">
            <MenuButton className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                <MoreVertical className="w-5 h-5" />
            </MenuButton>

            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <MenuItems className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-xl bg-white shadow-2xl ring-1 ring-black/10 focus:outline-none border border-gray-200 z-[9999]">
                    <div className="px-1 py-1">
                        {onView && (
                            <MenuItem>
                                {({ focus }) => (
                                    <button
                                        onClick={onView}
                                        className={`${focus ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                                            } group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors`}
                                    >
                                        <Eye className="mr-3 h-4 w-4" />
                                        View Details
                                    </button>
                                )}
                            </MenuItem>
                        )}
                        {onEdit && (
                            <MenuItem>
                                {({ focus }) => (
                                    <button
                                        onClick={onEdit}
                                        className={`${focus ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                                            } group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors`}
                                    >
                                        <Edit2 className="mr-3 h-4 w-4" />
                                        Edit Case
                                    </button>
                                )}
                            </MenuItem>
                        )}
                        {onMarkComplete && (
                            <MenuItem>
                                {({ focus }) => (
                                    <button
                                        onClick={onMarkComplete}
                                        className={`${focus ? 'bg-green-50 text-green-700' : 'text-gray-700'
                                            } group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors`}
                                    >
                                        <CheckCircle className="mr-3 h-4 w-4" />
                                        Mark as Resolved
                                    </button>
                                )}
                            </MenuItem>
                        )}
                    </div>
                    {onDelete && (
                        <div className="px-1 py-1">
                            <MenuItem>
                                {({ focus }) => (
                                    <button
                                        onClick={onDelete}
                                        className={`${focus ? 'bg-red-50 text-red-700' : 'text-gray-700'
                                            } group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors`}
                                    >
                                        <Trash2 className="mr-3 h-4 w-4" />
                                        Delete Case
                                    </button>
                                )}
                            </MenuItem>
                        </div>
                    )}
                </MenuItems>
            </Transition>
        </Menu>
    );
};
