// Component displayed when users navigate to non-existent routes (404 error page).

import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div>
            <h1>NotFound</h1>
            <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
    );
};

export default NotFound;
