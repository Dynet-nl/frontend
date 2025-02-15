import {useEffect, useState} from 'react'
import useAxiosPrivate from '../hooks/useAxiosPrivate'
import {useLocation, useNavigate} from 'react-router-dom'

const Users = () => {
    const [users, setUsers] = useState([]);
    const axiosPrivate = useAxiosPrivate();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const controller = new AbortController();

        const getUsers = async () => {
            try {
                const response = await axiosPrivate.get('/api/users', {
                    signal: controller.signal,
                });
                setUsers(response.data);
            } catch (err) {
                console.error(err);
                navigate('/login', {state: {from: location}, replace: true});
            }
        };

        getUsers()

        return () => {
            controller.abort();
        };
    }, [axiosPrivate, navigate, location]);

    return (
        <article style={{padding: '20px'}}>
            <h1 style={{marginBottom: '20px'}}>Users List</h1>
            {users.length > 0 ? (
                <ul style={{paddingLeft: '20px', listStyleType: 'disc'}}>
                    {users.map((user) => (
                        <li key={user._id} style={{marginBottom: '10px'}}>{user.email}</li>
                    ))}
                </ul>
            ) : (
                <p>No users to display</p>
            )}
        </article>
    );

};

export default Users;
