import React from 'react';

export interface VariantProps {
    name: string;
    children: React.ReactNode;
    className?: string;
}
export const Variant = ({ children, name, className }: VariantProps) => {
    return (
        <div data-codux-variant-name={name} className={className}>
            {children}
        </div>
    );
};
