// Tests for RequireAuth component

import React from 'react';
import { screen, render } from '@testing-library/react';
import RequireAuth from '../../components/RequireAuth';
import { Routes, Route, MemoryRouter } from 'react-router-dom';

// Mock useAuth hook
jest.mock('../../hooks/useAuth', () => ({
    __esModule: true,
    default: jest.fn(),
}));

import useAuth from '../../hooks/useAuth';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const TestComponent = () => <div>Protected Content</div>;
const LoginPage = () => <div>Login Page</div>;
const UnauthorizedPage = () => <div>Unauthorized Page</div>;

const renderWithRouter = (initialPath: string, allowedRoles?: number[]) => {
    return render(
        <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                <Route element={<RequireAuth allowedRoles={allowedRoles} />}>
                    <Route path="/protected" element={<TestComponent />} />
                </Route>
            </Routes>
        </MemoryRouter>
    );
};

describe('RequireAuth', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render protected content when user is authenticated', () => {
        mockUseAuth.mockReturnValue({
            auth: { isAuthenticated: true, roles: [1] },
            setAuth: jest.fn(),
            logout: jest.fn(),
        });

        renderWithRouter('/protected');

        expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should redirect to login when user is not authenticated', () => {
        mockUseAuth.mockReturnValue({
            auth: {},
            setAuth: jest.fn(),
            logout: jest.fn(),
        });

        renderWithRouter('/protected');

        expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('should redirect to unauthorized when user lacks required role', () => {
        mockUseAuth.mockReturnValue({
            auth: { isAuthenticated: true, roles: [2] },
            setAuth: jest.fn(),
            logout: jest.fn(),
        });

        renderWithRouter('/protected', [1]); // Requires role 1, user has role 2

        expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
    });

    it('should allow access when user has at least one required role', () => {
        mockUseAuth.mockReturnValue({
            auth: { isAuthenticated: true, roles: [1, 2, 3] },
            setAuth: jest.fn(),
            logout: jest.fn(),
        });

        renderWithRouter('/protected', [2, 4]); // Requires role 2 or 4, user has role 2

        expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should allow access when no specific roles are required', () => {
        mockUseAuth.mockReturnValue({
            auth: { isAuthenticated: true, roles: [1] },
            setAuth: jest.fn(),
            logout: jest.fn(),
        });

        renderWithRouter('/protected'); // No specific roles required

        expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
});
