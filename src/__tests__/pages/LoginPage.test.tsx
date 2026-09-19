// Tests for LoginPage: default form, validation, success, and the three failure states.

import React from 'react';
import { screen, fireEvent, waitFor, render, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthProvider';
import { NotificationProvider } from '../../context/NotificationProvider';
import LoginPage from '../../pages/LoginPage';

jest.mock('../../api/axios', () => ({
    __esModule: true,
    default: { get: jest.fn(), interceptors: { response: { use: jest.fn(), eject: jest.fn() } } },
    axiosPublic: { post: jest.fn() },
    setUnauthorizedHandler: jest.fn(),
    BASE_URL: 'http://localhost:5500',
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
}));

import { axiosPublic } from '../../api/axios';

const mockAxiosPublic = axiosPublic as jest.Mocked<typeof axiosPublic>;

const renderLoginPage = () =>
    render(
        <BrowserRouter>
            <AuthProvider>
                <NotificationProvider>
                    <LoginPage />
                </NotificationProvider>
            </AuthProvider>
        </BrowserRouter>
    );

const fill = (email = 'test@example.com', password = 'password123') => {
    fireEvent.change(screen.getByLabelText(/e-mailadres/i), { target: { value: email } });
    fireEvent.change(screen.getByLabelText(/wachtwoord/i), { target: { value: password } });
};

describe('LoginPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
    });

    it('renders the sign-in form', () => {
        renderLoginPage();
        expect(screen.getByRole('heading', { name: 'Inloggen' })).toBeInTheDocument();
        expect(screen.getByLabelText(/e-mailadres/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/wachtwoord/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Inloggen' })).toBeInTheDocument();
    });

    it('keeps typed values', () => {
        renderLoginPage();
        fill();
        expect(screen.getByLabelText(/e-mailadres/i)).toHaveValue('test@example.com');
        expect(screen.getByLabelText(/wachtwoord/i)).toHaveValue('password123');
    });

    it('asks for both fields when empty', async () => {
        renderLoginPage();
        fireEvent.click(screen.getByRole('button', { name: 'Inloggen' }));
        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Vul je e-mailadres en wachtwoord in.'));
        expect(mockAxiosPublic.post).not.toHaveBeenCalled();
    });

    it('stores roles and navigates on success', async () => {
        mockAxiosPublic.post.mockResolvedValueOnce({ data: { roles: [5150], name: 'admin' } });
        renderLoginPage();
        fill();
        fireEvent.click(screen.getByRole('button', { name: 'Inloggen' }));
        await waitFor(() => expect(localStorage.getItem('roles')).toBe(JSON.stringify([5150])));
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });

    it('shows the invalid-credentials message on 401', async () => {
        mockAxiosPublic.post.mockRejectedValueOnce({ response: { status: 401 } });
        renderLoginPage();
        fill('test@example.com', 'wrong');
        fireEvent.click(screen.getByRole('button', { name: 'Inloggen' }));
        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('E-mailadres of wachtwoord klopt niet.'));
    });

    it('shows the locked-out state on 429', async () => {
        mockAxiosPublic.post.mockRejectedValueOnce({ response: { status: 429 } });
        renderLoginPage();
        fill();
        fireEvent.click(screen.getByRole('button', { name: 'Inloggen' }));
        await waitFor(() => expect(screen.getByText('Te veel inlogpogingen')).toBeInTheDocument());
        expect(screen.getByRole('button', { name: 'Inloggen' })).toBeDisabled();
    });

    it('shows the server error message on 500', async () => {
        mockAxiosPublic.post.mockRejectedValueOnce({ response: { status: 500 } });
        renderLoginPage();
        fill();
        fireEvent.click(screen.getByRole('button', { name: 'Inloggen' }));
        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('De server gaf een fout.'));
    });

    it('switches to the waking state and retries when there is no response', async () => {
        jest.useFakeTimers();
        mockAxiosPublic.post.mockRejectedValueOnce({ response: undefined }).mockResolvedValueOnce({ data: { roles: [1991] } });
        renderLoginPage();
        fill();
        fireEvent.click(screen.getByRole('button', { name: 'Inloggen' }));
        await waitFor(() => expect(screen.getByText(/De server start op/)).toBeInTheDocument());
        expect(screen.getByRole('button', { name: /Verbinden/ })).toBeInTheDocument();
        await act(async () => { jest.advanceTimersByTime(4100); });
        await waitFor(() => expect(mockAxiosPublic.post).toHaveBeenCalledTimes(2));
        await waitFor(() => expect(localStorage.getItem('roles')).toBe(JSON.stringify([1991])));
        jest.useRealTimers();
    });
});
