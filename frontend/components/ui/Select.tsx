"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
    value: string;
    label: string;
    color?: string;
    icon?: React.ReactNode;
}

interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    error?: string;
    disabled?: boolean;
    className?: string;
    showIcon?: boolean;
}

export const Select: React.FC<SelectProps> = ({
    value,
    onChange,
    options,
    placeholder = 'Select an option',
    error,
    disabled = false,
    className = '',
    showIcon = true,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
    const [dropdownStyle, setDropdownStyle] = useState<{ top?: number; bottom?: number; left: number; width: number }>({ left: 0, width: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const selectedOption = options.find(opt => opt.value === value);

    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            // Check if click is outside both the container and the dropdown portal
            const isOutsideContainer = containerRef.current && !containerRef.current.contains(target);
            const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(target);
            
            if (isOutsideContainer && isOutsideDropdown) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Calculate dropdown position and coordinates
    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const dropdownHeight = Math.min(options.length * 48 + 16, 256 + 16); // max-h-64 + padding

            const position = spaceBelow < dropdownHeight && spaceAbove > dropdownHeight ? 'top' : 'bottom';
            setDropdownPosition(position);

            // Calculate position for portal
            const style = {
                left: rect.left,
                width: rect.width,
                ...(position === 'top'
                    ? { bottom: window.innerHeight - rect.top + 8 }
                    : { top: rect.bottom + 8 }
                ),
            };
            setDropdownStyle(style as any);
        }
    }, [isOpen, options.length]);

    const handleSelect = (optionValue: string) => {
        console.log(`[Select] Selected: ${optionValue}, Current: ${value}`);
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className={`relative w-full ${className}`}>
            {/* Trigger Button */}
            <button
                type="button"
                ref={triggerRef}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left font-medium ${disabled
                    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                    : error
                        ? 'border-red-300 bg-white hover:border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                        : isOpen
                            ? 'border-blue-500 bg-blue-50 focus:ring-2 focus:ring-blue-500/20'
                            : 'border-gray-200 bg-white hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                    }`}
            >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {selectedOption?.color && showIcon && (
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${selectedOption.color}`} />
                    )}
                    {selectedOption?.icon && showIcon && (
                        <div className="flex-shrink-0">{selectedOption.icon}</div>
                    )}
                    <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
                        {selectedOption?.label || placeholder}
                    </span>
                </div>
                <ChevronDown
                    size={18}
                    className={`flex-shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown Menu - Portal */}
            {isOpen && typeof window !== 'undefined' && createPortal(
                <div
                    ref={dropdownRef}
                    className="fixed z-50 bg-white border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden"
                    style={{
                        left: `${dropdownStyle.left}px`,
                        width: `${dropdownStyle.width}px`,
                        top: dropdownStyle.top ? `${dropdownStyle.top}px` : 'auto',
                        bottom: dropdownStyle.bottom ? `${dropdownStyle.bottom}px` : 'auto',
                    }}
                >
                    <div className="max-h-64 overflow-y-auto">
                        {options.map((option) => {
                            const isSelected = option.value === value;
                            return (
                                <button
                                    type="button"
                                    key={option.value}
                                    onClick={() => handleSelect(option.value)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-b border-gray-100 last:border-b-0 ${isSelected
                                        ? 'bg-blue-50 text-blue-900'
                                        : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    {option.color && showIcon && (
                                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${option.color}`} />
                                    )}
                                    {option.icon && showIcon && (
                                        <div className="flex-shrink-0">{option.icon}</div>
                                    )}
                                    <span className="flex-1 font-medium">{option.label}</span>
                                    {isSelected && (
                                        <Check size={18} className="flex-shrink-0 text-blue-600" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>,
                document.body
            )}

            {/* Error Message */}
            {error && (
                <p className="mt-1 text-sm text-red-600 font-medium">{error}</p>
            )}
        </div>
    );
};
