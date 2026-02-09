// Tests for UserLoginPage component

import React from 'react';
import { screen, fireEvent, waitFor, render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthProvider';
import { NotificationProvider } from '../../context/NotificationProvider';
import UserLoginPage from '../../pages/UserLoginPage';

// Mock axios
jest.mock('../../api/axios', () => ({
    axiosPublic: {
        post: jest.fn(),
    },
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
}));

import { axiosPublic } from '../../api/axios';

const mockAxiosPublic = axiosPublic as jest.Mocked<typeof axiosPublic>;

const renderLoginPage = () => {
    return render(
        <BrowserRouter>
            <AuthProvider>
                <NotificationProvider>
                    <UserLoginPage />
                </NotificationProvider>
            </AuthProvider>
        </BrowserRouter>
    );
};

describe('UserLoginPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
    });

    it('should render login form', () => {
        renderLoginPage();

        expect(screen.getByText('Welcome Back')).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should update input values when typing', () => {
        renderLoginPage();

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password/i);

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        expect(emailInput).toHaveValue('test@example.com');
        expect(passwordInput).toHaveValue('password123');
    });

    it('should show error message when fields are empty', async () => {
        renderLoginPage();

        const submitButton = screen.getByRole('button', { name: /sign in/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/please enter both email and password/i)).toBeInTheDocument();
        });
    });

    it('should handle successful login', async () => {
        mockAxiosPublic.post.mockResolvedValueOnce({
            data: { roles: [1, 2] },
        });

        renderLoginPage();

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password/i);

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        const submitButton = screen.getByRole('button', { name: /sign in/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(localStorage.getItem('roles')).toBe(JSON.stringify([1, 2]));
        });
    });

    it('should show error message for invalid credentials', async () => {
        mockAxiosPublic.post.mockRejectedValueOnce({
            response: { status: 401 },
        });

        renderLoginPage();

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password/i);

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

        const submitButton = screen.getByRole('button', { name: /sign in/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
        });
    });

    it('should show error message for server error', async () => {
        mockAxiosPublic.post.mockRejectedValueOnce({
            response: { status: 500 },
        });

        renderLoginPage();

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password/i);

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        const submitButton = screen.getByRole('button', { name: /sign in/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/server error/i)).toBeInTheDocument();
        });
    });

    it('should show error message when server is not responding', async () => {
        mockAxiosPublic.post.mockRejectedValueOnce({
            response: undefined,
        });

        renderLoginPage();

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password/i);

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        const submitButton = screen.getByRole('button', { name: /sign in/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/no server response/i)).toBeInTheDocument();
        });
    });
});
