// Page shell: sidebar with role-filtered navigation, top bar with breadcrumb + actions,
// bottom bar on phones.

import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeProvider';
import { useShell } from './ShellContext';
import { ROLES, getRoleName } from '../../utils/constants';
import { t } from '../../i18n';
import Icon from '../ui/Icon';
import Menu from '../ui/Menu';
import { IconButton } from '../ui/Button';
import { Avatar } from '../ui/Pill';
import { fmtWeekday, isoWeek } from '../../utils/format';
import { useIsPhone, useIsRail } from '../../hooks/useMediaQuery';

interface NavItem {
    to: string;
    label: string;
    icon: string;
    roles?: number[];
    end?: boolean;
}

interface NavGroup {
    title: string;
    items: NavItem[];
}

const LAST_AREA_KEY = 'dynet.lastArea';
export const rememberArea = (areaId: string): void => {
    try { localStorage.setItem(LAST_AREA_KEY, areaId); } catch { /* ignore */ }
};
export const lastArea = (): string | null => {
    try { return localStorage.getItem(LAST_AREA_KEY); } catch { return null; }
};

const AppShell: React.FC = () => {
    const { auth, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { crumbs, actions, sidebarExtra } = useShell();
    const location = useLocation();
    const navigate = useNavigate();
    const isPhone = useIsPhone();
    const isRail = useIsRail();
    const [expanded, setExpanded] = useState(false);

    const roles = auth.roles ?? [];
    const has = (...allowed: number[]) => allowed.some((r) => roles.includes(r));
    const isAdmin = has(ROLES.ADMIN);
    const fieldRole = has(ROLES.TECHNICAL_INSPECTOR, ROLES.HAS_MONTEUR) && !has(ROLES.ADMIN, ROLES.TECHNICAL_PLANNING, ROLES.HAS_PLANNING);

    useEffect(() => { setExpanded(false); }, [location.pathname]);

    const agendaPath = has(ROLES.TECHNICAL_PLANNING) && !has(ROLES.HAS_PLANNING, ROLES.HAS_MONTEUR, ROLES.TECHNICAL_INSPECTOR) ? '/agenda' : has(ROLES.ADMIN) && !has(ROLES.HAS_PLANNING) ? '/agenda' : '/has-agenda';

    const allGroups: NavGroup[] = [
        {
            title: t('nav.work'),
            items: [
                { to: '/', label: fieldRole ? t('nav.today') : t('nav.home'), icon: fieldRole ? 'today' : 'home', end: true },
                { to: '/city', label: t('nav.cities'), icon: 'location_city' },
                { to: '/districts', label: t('nav.districts'), icon: 'grid_view' },
            ],
        },
        {
            title: t('nav.planning'),
            items: [
                { to: '/agenda', label: t('nav.technicalAgenda'), icon: 'calendar_month', roles: [ROLES.ADMIN, ROLES.TECHNICAL_PLANNING] },
                { to: '/has-agenda', label: t('nav.hasAgenda'), icon: 'event', roles: [ROLES.ADMIN, ROLES.HAS_PLANNING, ROLES.TECHNICAL_INSPECTOR, ROLES.HAS_MONTEUR] },
            ],
        },
        {
            title: t('nav.admin'),
            items: [
                { to: '/dashboard', label: t('nav.overview'), icon: 'monitoring', roles: [ROLES.ADMIN] },
                { to: '/district-management', label: t('nav.districtImport'), icon: 'upload_file', roles: [ROLES.ADMIN] },
                { to: '/admin', label: t('nav.users'), icon: 'group', roles: [ROLES.ADMIN] },
            ],
        },
    ];
    const groups = allGroups
        .map((g) => ({ ...g, items: g.items.filter((i) => !i.roles || has(...i.roles)) }))
        .filter((g) => g.items.length > 0);

    const isActive = (item: NavItem) => {
        if (item.end) return location.pathname === item.to;
        if (item.to === '/city') return /^\/(city|area)/.test(location.pathname);
        if (item.to === '/districts') return /^\/(district\/|building\/|districts)/.test(location.pathname);
        if (item.to === '/district-management') return location.pathname.startsWith('/district-management');
        return location.pathname.startsWith(item.to);
    };

    const roleLabel = roles.map(getRoleName).join(', ');
    const now = new Date();

    const sidebar = (
        <aside className={`sidebar ${expanded ? 'sidebar--expanded' : ''}`.trim()} aria-label="Navigatie">
            <Link to="/" className="sidebar__brand">
                <img src={`${process.env.PUBLIC_URL}/dynetLogo.png`} alt="" />
                <span>Dynet</span>
            </Link>
            {groups.map((group) => (
                <nav className="sidebar__group" key={group.title} aria-label={group.title}>
                    <div className="t-overline sidebar__group-title">{group.title}</div>
                    {group.items.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={`sidebar__item ${isActive(item) ? 'is-active' : ''}`.trim()}
                            aria-current={isActive(item) ? 'page' : undefined}
                            title={item.label}
                        >
                            <Icon name={item.icon} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
            ))}
            {sidebarExtra}
            <div className="sidebar__footer">
                <Menu
                    align="left"
                    trigger={(open) => (
                        <button type="button" className="sidebar__user" onClick={open} aria-haspopup="menu" title={auth.name}>
                            <Avatar name={auth.name} index={roles[0] ? roles[0] % 8 : 7} />
                            <span className="col">
                                <span className="sidebar__user-name truncate">{auth.name || auth.email || '—'}</span>
                                <span className="sidebar__user-role truncate">{roleLabel}</span>
                            </span>
                            <Icon name="unfold_more" />
                        </button>
                    )}
                    items={[
                        { label: theme === 'dark' ? 'Licht thema' : 'Donker thema', icon: theme === 'dark' ? 'light_mode' : 'dark_mode', onSelect: toggleTheme },
                        'separator',
                        { label: t('nav.logout'), icon: 'logout', onSelect: logout },
                    ]}
                />
            </div>
        </aside>
    );

    const bottomItems: NavItem[] = [
        { to: '/', label: fieldRole ? t('nav.today') : t('nav.home'), icon: fieldRole ? 'today' : 'home', end: true },
        { to: '/districts', label: t('nav.districts'), icon: 'grid_view' },
        { to: agendaPath, label: t('nav.agenda'), icon: 'calendar_month' },
    ];

    return (
        <div className="shell">
            {(!isPhone || expanded) && sidebar}
            {isPhone && expanded && <div className="sidebar-scrim" onClick={() => setExpanded(false)} />}
            <div className="shell__main">
                <header className="topbar">
                    {(isRail || isPhone) && (
                        <IconButton className="topbar__toggle" icon={expanded ? 'menu_open' : 'menu'} label="Menu" onClick={() => setExpanded((e) => !e)} />
                    )}
                    <nav className="topbar__crumbs" aria-label="Kruimelpad">
                        {crumbs.map((c, i) => {
                            const last = i === crumbs.length - 1;
                            return (
                                <React.Fragment key={`${c.label}-${i}`}>
                                    {i > 0 && <span className="sep">/</span>}
                                    {last || !c.path ? <span className="current">{c.label}</span> : <Link to={c.path}>{c.label}</Link>}
                                </React.Fragment>
                            );
                        })}
                    </nav>
                    <div className="topbar__actions">
                        {actions}
                        <span className="topbar__date">{fmtWeekday(now)} · wk {isoWeek(now)}</span>
                        {isAdmin && !isPhone && <IconButton icon="search" label={t('nav.search')} onClick={() => navigate('/city')} />}
                        <IconButton icon={theme === 'dark' ? 'light_mode' : 'dark_mode'} label={t('nav.theme')} onClick={toggleTheme} />
                    </div>
                </header>
                <main id="main-content" className="content">
                    <Outlet />
                </main>
            </div>
            {isPhone && (
                <nav className="bottombar" aria-label="Navigatie">
                    {bottomItems.map((item) => (
                        <NavLink key={item.to} to={item.to} className={`bottombar__item ${isActive(item) || (item.to === agendaPath && /agenda/.test(location.pathname)) ? 'is-active' : ''}`.trim()}>
                            <Icon name={item.icon} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
            )}
        </div>
    );
};

export default AppShell;
