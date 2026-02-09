// Main layout component providing consistent page structure, navigation, and user interface elements.

import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout: React.FC = () => {
    return (
        <>
            <Navbar />
            <main id="main-content">
                <Outlet />
            </main>
        </>
    );
};

export default Layout;
