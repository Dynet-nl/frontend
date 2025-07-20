import React, {useState} from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

const AreaForm = ({cityId, onAddArea}) => {
    const [areaName, setAreaName] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await onAddArea({name: areaName, cityId: cityId});
            setAreaName('');
        } catch (error) {
            console.error('Error adding area:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{marginTop: '20px'}}>
            <div style={{marginBottom: '15px'}}>
                <TextField
                    id="areaName"
                    label="Area Name"
                    variant="outlined"
                    value={areaName}
                    onChange={(e) => setAreaName(e.target.value)}
                />
            </div>
            <Button type="submit" style={{marginTop: '20px', marginBottom: '20px'}}>Add Area</Button>
        </form>
    );
};

export default AreaForm;
