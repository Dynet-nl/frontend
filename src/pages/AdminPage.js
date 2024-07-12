import React, { useState, useEffect } from 'react';
import { Button, TextField, MenuItem, FormControl, InputLabel, Select } from '@mui/material';
import axiosPrivate from '../api/axios';
import Users from '../components/Users';

const AdminPage = () => {
  const [errors, setErrors] = useState({
    name: false,
    email: false,
    password: false,
    role: false,
  });

  const [userData, setUserData] = useState({
    name: '',
    email: '',
    password: '',
    roles: [],
  });

  const [roles, setRoles] = useState([]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await axiosPrivate.get('/api/users/roles');
        const data = response.data;
        setRoles(data);
      } catch (error) {
        console.error('Failed to fetch roles:', error);
      }
    };

    fetchRoles();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handleRoleChange = (e) => {
    const { value } = e.target;
    setUserData({ ...userData, roles: [value] }); // Set roles as an array of role names
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {
      name: !userData.name,
      email: !userData.email || !validateEmail(userData.email),
      password: !userData.password,
      role: !userData.roles.length,
    };

    setErrors(newErrors);

    const allFieldsFilled = !Object.values(newErrors).some((error) => error);
    if (allFieldsFilled) {
      console.log("Submitting user data:", userData);
      try {
        const response = await axiosPrivate.post('/api/users', userData);
        console.log('User added:', response.data);
        setUserData({ name: '', email: '', password: '', roles: [] });
      } catch (error) {
        console.error('Error adding user:', error.response ? error.response.data : error);
      }
    }
  };

  return (
    <div>
      <div>
        <Users />
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '300px', margin: 'auto' }}>
        <TextField
          label="Name"
          variant="outlined"
          name="name"
          value={userData.name}
          onChange={handleChange}
          error={errors.name}
          helperText={errors.name ? "Name is required" : ""}
        />

        <TextField
          label="Email"
          variant="outlined"
          name="email"
          type="email"
          value={userData.email}
          onChange={handleChange}
          error={errors.email}
          helperText={errors.email ? (userData.email ? "Invalid email format" : "Email is required") : ""}
        />

        <TextField
          label="Password"
          variant="outlined"
          name="password"
          type="password"
          value={userData.password}
          onChange={handleChange}
          error={errors.password}
          helperText={errors.password ? "Password is required" : ""}
        />

        <FormControl fullWidth>
          <InputLabel id="role-select-label">Role</InputLabel>
          <Select
            labelId="role-select-label"
            id="role-select"
            value={userData.roles[0] || ''}
            label="Role"
            name="roles"
            onChange={handleRoleChange}
          >
            <MenuItem value="" disabled>
              <em>Select a role</em>
            </MenuItem>
            {roles.map((role) => (
              <MenuItem key={role.value} value={role.role}>
                {role.role}
              </MenuItem>
            ))}
          </Select>
          {errors.role && <p style={{ color: 'red', fontSize: '0.75rem', margin: '3px 14px 0' }}>Role is required</p>}
        </FormControl>

        <Button type="submit" variant="contained" color="primary">
          Create User
        </Button>
      </form>
    </div>
  );
};

export default AdminPage;
