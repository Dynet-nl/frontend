// Main layout component providing consistent page structure, navigation, and user interface elements.

import {Outlet} from 'react-router-dom'
import Navbar from './Navbar'
const Layout = () => {
    return (
        <>
            <Navbar/>
            <Outlet/>
        </>
    )
}
export default Layout
