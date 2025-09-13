// Component for displaying and managing user lists with role-based actions and user management features.

import {useEffect, useState} from 'react'
import useAxiosPrivate from '../hooks/useAxiosPrivate'
import {useLocation, useNavigate} from 'react-router-dom'

const Users = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    
    // Filter and search states
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage] = useState(6); // Show 6 users per page
    
    const axiosPrivate = useAxiosPrivate();
    const navigate = useNavigate();
    const location = useLocation();

    // Helper function to get role name from roles object
    const getUserRole = (rolesObj) => {
        if (!rolesObj || typeof rolesObj !== 'object') return 'No role';
        const roleKeys = Object.keys(rolesObj);
        return roleKeys.length > 0 ? roleKeys[0] : 'No role';
    };

    // Get role statistics
    const getRoleStats = () => {
        const stats = {
            all: users.length,
            Admin: 0,
            TechnischePlanning: 0,
            TechnischeSchouwer: 0,
            Werkvoorbereider: 0,
            HASPlanning: 0,
            HASMonteur: 0,
            'No role': 0
        };

        users.forEach(user => {
            const role = getUserRole(user.roles);
            if (stats.hasOwnProperty(role)) {
                stats[role]++;
            } else {
                stats['No role']++;
            }
        });

        return stats;
    };

    // Filter users based on active tab and search term
    useEffect(() => {
        let filtered = users;

        // Filter by role
        if (activeTab !== 'all') {
            filtered = users.filter(user => {
                const userRole = getUserRole(user.roles);
                return userRole === activeTab;
            });
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(user => 
                user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                getUserRole(user.roles).toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredUsers(filtered);
        setCurrentPage(1); // Reset to first page when filters change
    }, [users, activeTab, searchTerm]);

    // Pagination
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    const stats = getRoleStats();

    useEffect(() => {
        const controller = new AbortController();
        const getUsers = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await axiosPrivate.get('/api/users', {
                    signal: controller.signal,
                });
                setUsers(response.data);
            } catch (err) {
                console.error(err);
                if (err.response?.status === 401) {
                    navigate('/login', {state: {from: location}, replace: true});
                } else {
                    setError('Failed to load users');
                }
            } finally {
                setIsLoading(false);
            }
        };
        getUsers()
        return () => {
            controller.abort();
        };
    }, [axiosPrivate, navigate, location]);

    const handleEdit = (user) => {
        setEditingUser({
            ...user,
            password: '', // Don't pre-fill password
            roleToEdit: getUserRole(user.roles),
            color: user.color || '#3498db'
        });
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        setActionLoading('edit');
        try {
            const updateData = {
                name: editingUser.name,
                email: editingUser.email,
                roles: editingUser.roleToEdit ? [editingUser.roleToEdit] : [],
                color: editingUser.color || '#3498db'
            };
            
            // Only include password if it's not empty
            if (editingUser.password.trim()) {
                updateData.password = editingUser.password;
            }

            await axiosPrivate.put(`/api/users/${editingUser._id}`, updateData);
            
            // Update the user in the local state
            setUsers(users.map(user => 
                user._id === editingUser._id 
                    ? { ...user, ...updateData, roles: { [editingUser.roleToEdit]: user.roles[getUserRole(user.roles)] } }
                    : user
            ));
            
            setEditingUser(null);
        } catch (err) {
            console.error('Error updating user:', err);
            setError('Failed to update user');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (userId) => {
        setActionLoading('delete');
        try {
            await axiosPrivate.delete(`/api/users/${userId}`);
            setUsers(users.filter(user => user._id !== userId));
            setDeleteConfirm(null);
        } catch (err) {
            console.error('Error deleting user:', err);
            setError('Failed to delete user');
        } finally {
            setActionLoading(null);
        }
    };

    if (isLoading) {
        return (
            <div className="users-loading">
                <div className="loading-spinner"></div>
                <p>Loading users...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="users-error">
                <p className="error-message">{error}</p>
                <button 
                    className="modern-button modern-button-secondary"
                    onClick={() => window.location.reload()}
                >
                    Retry
                </button>
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="users-empty">
                <p className="empty-message">No users found</p>
            </div>
        );
    }

    return (
        <div className="users-container">
            {/* Search and Filter Controls */}
            <div className="users-controls">
                <div className="search-container">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search users by name, email, or role..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="search-icon">🔍</div>
                </div>

                {/* Role Tabs */}
                <div className="role-tabs">
                    <button 
                        className={`role-tab ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        All Users ({stats.all})
                    </button>
                    <button 
                        className={`role-tab ${activeTab === 'Admin' ? 'active' : ''}`}
                        onClick={() => setActiveTab('Admin')}
                    >
                        Admin ({stats.Admin})
                    </button>
                    <button 
                        className={`role-tab ${activeTab === 'TechnischePlanning' ? 'active' : ''}`}
                        onClick={() => setActiveTab('TechnischePlanning')}
                    >
                        Tech Planning ({stats.TechnischePlanning})
                    </button>
                    <button 
                        className={`role-tab ${activeTab === 'TechnischeSchouwer' ? 'active' : ''}`}
                        onClick={() => setActiveTab('TechnischeSchouwer')}
                    >
                        Tech Inspector ({stats.TechnischeSchouwer})
                    </button>
                    <button 
                        className={`role-tab ${activeTab === 'Werkvoorbereider' ? 'active' : ''}`}
                        onClick={() => setActiveTab('Werkvoorbereider')}
                    >
                        Werk. ({stats.Werkvoorbereider})
                    </button>
                    <button 
                        className={`role-tab ${activeTab === 'HASPlanning' ? 'active' : ''}`}
                        onClick={() => setActiveTab('HASPlanning')}
                    >
                        HAS Plan ({stats.HASPlanning})
                    </button>
                    <button 
                        className={`role-tab ${activeTab === 'HASMonteur' ? 'active' : ''}`}
                        onClick={() => setActiveTab('HASMonteur')}
                    >
                        HAS Mont ({stats.HASMonteur})
                    </button>
                </div>
            </div>

            {/* Results Summary */}
            <div className="results-summary">
                {searchTerm && (
                    <p className="search-results">
                        Found {filteredUsers.length} users matching "{searchTerm}"
                    </p>
                )}
                {activeTab !== 'all' && !searchTerm && (
                    <p className="filter-results">
                        Showing {filteredUsers.length} users with role: <strong>{activeTab}</strong>
                    </p>
                )}
            </div>
            {/* Edit Modal */}
            {editingUser && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Edit User</h3>
                            <button 
                                className="modal-close"
                                onClick={() => setEditingUser(null)}
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleSaveEdit} className="modal-form">
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    className="modern-input"
                                    value={editingUser.name}
                                    onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    className="modern-input"
                                    value={editingUser.email}
                                    onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Password (leave empty to keep current)</label>
                                <input
                                    type="password"
                                    className="modern-input"
                                    value={editingUser.password}
                                    onChange={(e) => setEditingUser({...editingUser, password: e.target.value})}
                                    placeholder="Enter new password or leave empty"
                                />
                            </div>
                            <div className="form-group">
                                <label>Role</label>
                                <select
                                    className="modern-select"
                                    value={editingUser.roleToEdit}
                                    onChange={(e) => setEditingUser({...editingUser, roleToEdit: e.target.value})}
                                    required
                                >
                                    <option value="">Select a role</option>
                                    <option value="Admin">Admin</option>
                                    <option value="TechnischePlanning">Technische Planning</option>
                                    <option value="TechnischeSchouwer">Technische Schouwer</option>
                                    <option value="Werkvoorbereider">Werkvoorbereider</option>
                                    <option value="HASPlanning">HAS Planning</option>
                                    <option value="HASMonteur">HAS Monteur</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>User Color</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input
                                        type="color"
                                        className="color-picker"
                                        value={editingUser.color || '#3498db'}
                                        onChange={(e) => setEditingUser({...editingUser, color: e.target.value})}
                                        style={{ 
                                            width: '50px', 
                                            height: '40px', 
                                            border: '1px solid #ddd', 
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    <input
                                        type="text"
                                        className="modern-input"
                                        value={editingUser.color || '#3498db'}
                                        onChange={(e) => setEditingUser({...editingUser, color: e.target.value})}
                                        placeholder="#3498db"
                                        pattern="^#[0-9A-Fa-f]{6}$"
                                        title="Enter a valid hex color code (e.g., #3498db)"
                                        style={{ flex: '1' }}
                                    />
                                    <div 
                                        style={{ 
                                            width: '30px', 
                                            height: '30px', 
                                            backgroundColor: editingUser.color || '#3498db',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px'
                                        }}
                                        title="Color preview"
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button 
                                    type="button"
                                    className="modern-button modern-button-secondary"
                                    onClick={() => setEditingUser(null)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="modern-button modern-button-primary"
                                    disabled={actionLoading === 'edit'}
                                >
                                    {actionLoading === 'edit' ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Delete User</h3>
                            <button 
                                className="modal-close"
                                onClick={() => setDeleteConfirm(null)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to delete user <strong>{deleteConfirm.name}</strong>?</p>
                            <p>This action cannot be undone.</p>
                        </div>
                        <div className="modal-actions">
                            <button 
                                className="modern-button modern-button-secondary"
                                onClick={() => setDeleteConfirm(null)}
                            >
                                Cancel
                            </button>
                            <button 
                                className="modern-button modern-button-danger"
                                onClick={() => handleDelete(deleteConfirm._id)}
                                disabled={actionLoading === 'delete'}
                            >
                                {actionLoading === 'delete' ? 'Deleting...' : 'Delete User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="users-grid">
                {currentUsers.map((user) => (
                    <div key={user._id} className="user-card">
                        <div className="user-info">
                            <div className="user-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div 
                                    className="user-color-indicator"
                                    style={{ 
                                        width: '16px', 
                                        height: '16px', 
                                        backgroundColor: user.color || '#3498db',
                                        border: '1px solid #ddd',
                                        borderRadius: '50%',
                                        flexShrink: 0
                                    }}
                                    title={`User color: ${user.color || '#3498db'}`}
                                />
                                {user?.name || 'Unknown User'}
                            </div>
                            <div className="user-email">{user.email}</div>
                            <div className="user-role">
                                <span className={`role-badge role-${getUserRole(user.roles).toLowerCase()}`}>
                                    {getUserRole(user.roles)}
                                </span>
                            </div>
                        </div>
                        <div className="user-actions">
                            <button 
                                className="action-button edit-button" 
                                title="Edit user"
                                onClick={() => handleEdit(user)}
                            >
                                ✏️
                            </button>
                            <button 
                                className="action-button delete-button" 
                                title="Delete user"
                                onClick={() => setDeleteConfirm(user)}
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button 
                        className="pagination-btn"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        ← Previous
                    </button>
                    
                    <div className="page-numbers">
                        {[...Array(totalPages)].map((_, index) => (
                            <button
                                key={index + 1}
                                className={`page-number ${currentPage === index + 1 ? 'active' : ''}`}
                                onClick={() => setCurrentPage(index + 1)}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>
                    
                    <button 
                        className="pagination-btn"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        Next →
                    </button>
                </div>
            )}

            {/* Empty State */}
            {filteredUsers.length === 0 && !isLoading && (
                <div className="users-empty">
                    <p className="empty-message">
                        {searchTerm || activeTab !== 'all' 
                            ? 'No users found matching your criteria' 
                            : 'No users found'
                        }
                    </p>
                    {(searchTerm || activeTab !== 'all') && (
                        <button 
                            className="modern-button modern-button-secondary"
                            onClick={() => {
                                setSearchTerm('');
                                setActiveTab('all');
                            }}
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
export default Users;
