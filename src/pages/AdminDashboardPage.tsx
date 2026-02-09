// Admin dashboard page displaying system statistics, user management, and administrative tools.

import React, { useEffect, useState, FormEvent, ChangeEvent } from 'react';
import axiosPrivate from '../api/axios';
import logger from '../utils/logger';
import Users from '../components/Users';
import '../styles/login.css';
import '../styles/admin.css';
import { AxiosError } from 'axios';

interface FormErrors {
    name: boolean;
    email: boolean;
    password: boolean;
    role: boolean;
}

interface UserData {
    name: string;
    email: string;
    password: string;
    roles: string[];
    color: string;
}

interface Role {
    value: number;
    role: string;
}

const AdminDashboardPage: React.FC = () => {
    const [errors, setErrors] = useState<FormErrors>({
        name: false,
        email: false,
        password: false,
        role: false,
    });

    const [userData, setUserData] = useState<UserData>({
        name: '',
        email: '',
        password: '',
        roles: [],
        color: '#3498db',
    });

    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [userListKey, setUserListKey] = useState<number>(0);
    const [showCreateForm, setShowCreateForm] = useState<boolean>(false);

    useEffect(() => {
        const fetchRoles = async (): Promise<void> => {
            try {
                const response = await axiosPrivate.get<Role[]>('/api/users/roles');
                const data = response.data;
                setRoles(data);
            } catch (error) {
                logger.error('Failed to fetch roles:', error);
            }
        };
        fetchRoles();
    }, []);

    const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
        const { name, value } = e.target;
        setUserData({ ...userData, [name]: value });
    };

    const handleRoleChange = (e: ChangeEvent<HTMLSelectElement>): void => {
        const { value } = e.target;
        setUserData({ ...userData, roles: [value] });
    };

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setSuccessMessage('');
        setErrorMessage('');

        const newErrors: FormErrors = {
            name: !userData.name,
            email: !userData.email || !validateEmail(userData.email),
            password: !userData.password,
            role: !userData.roles.length,
        };
        setErrors(newErrors);

        const allFieldsFilled = !Object.values(newErrors).some((error) => error);
        if (allFieldsFilled) {
            try {
                setIsLoading(true);
                await axiosPrivate.post('/api/users', userData);
                setUserData({ name: '', email: '', password: '', roles: [], color: '#3498db' });
                setSuccessMessage('User created successfully!');
                setUserListKey((prev) => prev + 1);
                setShowCreateForm(false);
                setTimeout(() => setSuccessMessage(''), 3000);
            } catch (error) {
                const axiosError = error as AxiosError<{ message?: string }>;
                logger.error('Error adding user:', axiosError.response ? axiosError.response.data : error);
                setErrorMessage(axiosError.response?.data?.message || 'Failed to create user. Please try again.');
                setTimeout(() => setErrorMessage(''), 5000);
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="admin-dashboard">
            <div className="admin-container">
                <div className="admin-header">
                    <h1 className="admin-title">Admin Dashboard</h1>
                    <p className="admin-subtitle">Manage users and system settings</p>
                </div>

                <div className="admin-content">
                    <div className="admin-card users-main-card">
                        <div className="card-header">
                            <div className="card-header-content">
                                <div>
                                    <h2 className="card-title">User Management</h2>
                                    <p className="card-subtitle">Manage existing users and create new ones</p>
                                </div>
                                <button
                                    className={`toggle-create-btn ${showCreateForm ? 'active' : ''}`}
                                    onClick={() => setShowCreateForm(!showCreateForm)}
                                >
                                    {showCreateForm ? '− Cancel' : '+ Create User'}
                                </button>
                            </div>
                        </div>

                        {/* Collapsible Create Form */}
                        <div className={`create-form-container ${showCreateForm ? 'expanded' : ''}`}>
                            <div className="create-form-content">
                                <h3 className="create-form-title">Create New User</h3>
                                <form className="modern-form" onSubmit={handleSubmit}>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="name" className="form-label">
                                                Full Name
                                            </label>
                                            <input
                                                id="name"
                                                type="text"
                                                className="modern-input"
                                                placeholder="Enter full name"
                                                name="name"
                                                value={userData.name}
                                                onChange={handleChange}
                                                required
                                            />
                                            {errors.name && <span className="form-error">Name is required</span>}
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="email" className="form-label">
                                                Email Address
                                            </label>
                                            <input
                                                id="email"
                                                type="email"
                                                className="modern-input"
                                                placeholder="Enter email address"
                                                name="email"
                                                value={userData.email}
                                                onChange={handleChange}
                                                required
                                            />
                                            {errors.email && (
                                                <span className="form-error">
                                                    {userData.email ? 'Invalid email format' : 'Email is required'}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="password" className="form-label">
                                                Password
                                            </label>
                                            <input
                                                id="password"
                                                type="password"
                                                className="modern-input"
                                                placeholder="Enter password"
                                                name="password"
                                                value={userData.password}
                                                onChange={handleChange}
                                                required
                                            />
                                            {errors.password && <span className="form-error">Password is required</span>}
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="role" className="form-label">
                                                Role
                                            </label>
                                            <select
                                                id="role"
                                                className="modern-select"
                                                name="roles"
                                                value={userData.roles[0] || ''}
                                                onChange={handleRoleChange}
                                                required
                                            >
                                                <option value="" disabled>
                                                    Select a role
                                                </option>
                                                {roles.map((role) => (
                                                    <option key={role.value} value={role.role}>
                                                        {role.role}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.role && <span className="form-error">Role is required</span>}
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="color" className="form-label">
                                                User Color
                                            </label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <input
                                                    id="color"
                                                    type="color"
                                                    className="color-picker"
                                                    value={userData.color}
                                                    onChange={(e) => setUserData({ ...userData, color: e.target.value })}
                                                    style={{
                                                        width: '50px',
                                                        height: '40px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                    }}
                                                />
                                                <input
                                                    type="text"
                                                    className="modern-input"
                                                    value={userData.color}
                                                    onChange={(e) => setUserData({ ...userData, color: e.target.value })}
                                                    placeholder="#3498db"
                                                    pattern="^#[0-9A-Fa-f]{6}$"
                                                    title="Enter a valid hex color code (e.g., #3498db)"
                                                    style={{ flex: '1' }}
                                                />
                                                <div
                                                    style={{
                                                        width: '30px',
                                                        height: '30px',
                                                        backgroundColor: userData.color,
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px',
                                                    }}
                                                    title="Color preview"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {successMessage && <div className="success-message">✅ {successMessage}</div>}

                                    {errorMessage && <div className="error-message">❌ {errorMessage}</div>}

                                    <div className="form-actions">
                                        <button
                                            type="button"
                                            className="modern-button modern-button-secondary"
                                            onClick={() => setShowCreateForm(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button type="submit" className="modern-button modern-button-primary" disabled={isLoading}>
                                            {isLoading ? 'Creating User...' : 'Create User'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Users List */}
                        <div className="users-list-container">
                            <Users key={userListKey} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;
