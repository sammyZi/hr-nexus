import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface DropdownOption {
    value: string;
    label: string;
}

interface DropdownProps {
    options: DropdownOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    color?: 'indigo' | 'blue' | 'green' | 'rose' | 'orange' | 'purple' | 'gray';
    disabled?: boolean;
}

export const Dropdown = ({
    options,
    value,
    onChange,
    placeholder = 'Select an option',
    className = '',
    color = 'indigo',
    disabled = false
}: DropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    const colorClasses = {
        indigo: {
            focus: 'focus:ring-indigo-500 focus:border-indigo-500',
            hover: 'hover:bg-indigo-50',
            selected: 'bg-indigo-50 text-indigo-700',
            ring: 'ring-indigo-100'
        },
        blue: {
            focus: 'focus:ring-blue-500 focus:border-blue-500',
            hover: 'hover:bg-blue-50',
            selected: 'bg-blue-50 text-blue-700',
            ring: 'ring-blue-100'
        },
        green: {
            focus: 'focus:ring-green-500 focus:border-green-500',
            hover: 'hover:bg-green-50',
            selected: 'bg-green-50 text-green-700',
            ring: 'ring-green-100'
        },
        rose: {
            focus: 'focus:ring-rose-500 focus:border-rose-500',
            hover: 'hover:bg-rose-50',
            selected: 'bg-rose-50 text-rose-700',
            ring: 'ring-rose-100'
        },
        orange: {
            focus: 'focus:ring-orange-500 focus:border-orange-500',
            hover: 'hover:bg-orange-50',
            selected: 'bg-orange-50 text-orange-700',
            ring: 'ring-orange-100'
        },
        purple: {
            focus: 'focus:ring-purple-500 focus:border-purple-500',
            hover: 'hover:bg-purple-50',
            selected: 'bg-purple-50 text-purple-700',
            ring: 'ring-purple-100'
        },
        gray: {
            focus: 'focus:ring-gray-500 focus:border-gray-500',
            hover: 'hover:bg-gray-50',
            selected: 'bg-gray-50 text-gray-700',
            ring: 'ring-gray-100'
        }
    };

    const colors = colorClasses[color];

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    w-full flex items-center justify-between px-4 py-2.5 
                    bg-white border border-gray-200 rounded-xl
                    text-sm font-medium text-gray-700
                    transition-all duration-200 outline-none
                    ${!disabled ? `hover:border-gray-300 ${colors.focus} focus:ring-4 focus:${colors.ring}` : 'opacity-50 cursor-not-allowed'}
                    ${isOpen ? `border-gray-300 ring-4 ${colors.ring}` : ''}
                `}
            >
                <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
                    {selectedOption?.label || placeholder}
                </span>
                <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-60 overflow-y-auto py-1">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`
                                    w-full px-4 py-2.5 text-left text-sm font-medium
                                    transition-colors duration-150
                                    ${option.value === value
                                        ? colors.selected
                                        : `text-gray-700 ${colors.hover}`
                                    }
                                `}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
