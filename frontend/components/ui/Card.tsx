import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
    return (
        <div
            className={`
        rounded-lg border bg-card text-card-foreground shadow-sm
        transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
        ${className}
      `}
            onClick={onClick}
        >
            {children}
        </div>
    );
};

export const CardHeader: React.FC<CardProps> = ({ children, className = '' }) => {
    return (
        <div className={`p-6 ${className}`}>
            {children}
        </div>
    );
};

export const CardContent: React.FC<CardProps> = ({ children, className = '' }) => {
    return (
        <div className={`p-6 pt-0 ${className}`}>
            {children}
        </div>
    );
};

export const CardTitle: React.FC<CardProps> = ({ children, className = '' }) => {
    return (
        <h3 className={`text-xl font-semibold ${className}`}>
            {children}
        </h3>
    );
};

export const CardDescription: React.FC<CardProps> = ({ children, className = '' }) => {
    return (
        <p className={`text-sm text-muted-foreground ${className}`}>
            {children}
        </p>
    );
};
