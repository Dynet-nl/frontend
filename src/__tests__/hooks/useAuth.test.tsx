// Tests for useAuth hook

import { renderHook, act } from '@testing-library/react';
import React, { ReactNode } from 'react';
import { AuthProvider } from '../../context/AuthProvider';
import useAuth from '../../hooks/useAuth';

const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
);

describe('useAuth', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('should return initial auth state', () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        expect(result.current.auth).toEqual({});
        expect(typeof result.current.setAuth).toBe('function');
        expect(typeof result.current.logout).toBe('function');
    });

    it('should update auth state when setAuth is called', () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        act(() => {
            result.current.setAuth({
                isAuthenticated: true,
                roles: [1, 2],
                email: 'test@example.com',
            });
        });

        expect(result.current.auth.isAuthenticated).toBe(true);
        expect(result.current.auth.roles).toEqual([1, 2]);
        expect(result.current.auth.email).toBe('test@example.com');
    });

    it('should load initial auth from localStorage if roles exist', () => {
        localStorage.setItem('roles', JSON.stringify([1, 2]));

        const { result } = renderHook(() => useAuth(), { wrapper });

        expect(result.current.auth.isAuthenticated).toBe(true);
        expect(result.current.auth.roles).toEqual([1, 2]);
    });

    it('should clear localStorage when logout is called', () => {
        localStorage.setItem('roles', JSON.stringify([1]));

        const { result } = renderHook(() => useAuth(), { wrapper });

        // Mock window.location.href
        const originalLocation = window.location;
        delete (window as { location?: Location }).location;
        window.location = { ...originalLocation, href: '' } as Location;

        act(() => {
            result.current.logout();
        });

        expect(localStorage.getItem('roles')).toBeNull();
        expect(result.current.auth).toEqual({});

        window.location = originalLocation;
    });

    it('should throw error when used outside AuthProvider', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        expect(() => {
            renderHook(() => useAuth());
        }).toThrow('useAuth must be used within an AuthProvider');

        consoleSpy.mockRestore();
    });
});
