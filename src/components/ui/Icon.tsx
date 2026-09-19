// Material Symbols Rounded icon (ligature font, loaded in index.html).

import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
    name: string;
    size?: 'dense' | 'default' | 'nav';
    fill?: boolean;
    label?: string;
}

const Icon: React.FC<IconProps> = ({ name, size = 'default', fill = false, label, className = '', ...rest }) => (
    <span
        className={`icon${size === 'dense' ? ' icon--dense' : size === 'nav' ? ' icon--nav' : ''}${fill ? ' icon--fill' : ''} ${className}`.trim()}
        aria-hidden={label ? undefined : true}
        aria-label={label}
        role={label ? 'img' : undefined}
        {...rest}
    >
        {name}
    </span>
);

export default Icon;
