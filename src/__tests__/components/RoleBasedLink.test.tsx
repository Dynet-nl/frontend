// Role -> route matrix for RoleBasedLink. Every path it produces must exist in App.tsx
// and be allowed for that role, otherwise the user lands on /unauthorized.

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RoleBasedLink from '../../components/RoleBasedLink';
import { ROLES } from '../../utils/constants';

jest.mock('../../hooks/useAuth', () => ({
    __esModule: true,
    default: jest.fn(),
}));

import useAuth from '../../hooks/useAuth';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const renderLink = (roles: number[], props: Omit<React.ComponentProps<typeof RoleBasedLink>, 'children'>) => {
    mockUseAuth.mockReturnValue({ auth: { isAuthenticated: true, roles }, setAuth: jest.fn(), logout: jest.fn() });
    return render(
        <MemoryRouter>
            <RoleBasedLink {...props}>link</RoleBasedLink>
        </MemoryRouter>
    );
};

const hrefOf = () => screen.getByText('link').closest('a')?.getAttribute('href');

describe('RoleBasedLink apartment links', () => {
    const cases: Array<[string, number, string]> = [
        ['Admin', ROLES.ADMIN, '/admin-apartment/f1'],
        ['TechnischePlanning', ROLES.TECHNICAL_PLANNING, '/planning-apartment/f1'],
        ['TechnischeSchouwer', ROLES.TECHNICAL_INSPECTOR, '/ts-apartment/f1'],
        ['HASPlanning', ROLES.HAS_PLANNING, '/has-planning-apartment/f1'],
        ['HASMonteur', ROLES.HAS_MONTEUR, '/hm-apartment/f1'],
        ['Werkvoorbereider', ROLES.WERKVOORBEREIDER, '/planning-apartment/f1'],
    ];

    it.each(cases)('%s goes to %s', (_name, role, expected) => {
        renderLink([role], { flatId: 'f1' });
        expect(hrefOf()).toBe(expected);
    });

    it('prefers the admin route when the user has several roles', () => {
        renderLink([ROLES.HAS_MONTEUR, ROLES.ADMIN], { flatId: 'f1' });
        expect(hrefOf()).toBe('/admin-apartment/f1');
    });
});

describe('RoleBasedLink schedule links', () => {
    it('sends HAS planners to the HAS scheduler', () => {
        renderLink([ROLES.HAS_PLANNING], { type: 'schedule', buildingId: 'b1' });
        expect(hrefOf()).toBe('/has-appointment-scheduler/b1?mode=building&type=HAS');
    });

    it('sends technical planners and werkvoorbereiders to the technical scheduler', () => {
        renderLink([ROLES.TECHNICAL_PLANNING], { type: 'schedule', buildingId: 'b1' });
        expect(hrefOf()).toBe('/appointment-scheduler/b1?mode=building&type=Technical');
        renderLink([ROLES.WERKVOORBEREIDER], { type: 'schedule', buildingId: 'b2' });
        expect(screen.getAllByText('link').pop()?.closest('a')?.getAttribute('href')).toBe('/appointment-scheduler/b2?mode=building&type=Technical');
    });

    it('sends admins to the scheduling selection screen', () => {
        renderLink([ROLES.ADMIN], { type: 'schedule', buildingId: 'b1' });
        expect(hrefOf()).toBe('/admin-scheduling-selection/b1?mode=building');
    });

    it('renders nothing for roles that cannot schedule', () => {
        renderLink([ROLES.HAS_MONTEUR], { type: 'schedule', buildingId: 'b1' });
        expect(screen.queryByText('link')).not.toBeInTheDocument();
    });

    it('renders a disabled element for a blocked building', () => {
        renderLink([ROLES.HAS_PLANNING], { type: 'schedule', buildingId: 'b1', building: { isBlocked: true, blockReason: 'Asbest' } });
        const el = screen.getByText('link');
        expect(el.closest('a')).toBeNull();
        expect(el.closest('div')?.getAttribute('title')).toContain('Asbest');
    });
});
