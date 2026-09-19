// Users (Admin): table with role filter, inline edit panel, create, 8 curated colours.
// Self-delete and removing your own Admin role are blocked here and by the API.

import React, { useEffect, useMemo, useState } from 'react';
import useAuth from '../hooks/useAuth';
import axiosPrivate from '../api/axios';
import { useApi } from '../hooks/useApi';
import { useNotification } from '../context/NotificationProvider';
import { useError } from '../context/ErrorProvider';
import { usePageChrome } from '../components/shell/ShellContext';
import { t } from '../i18n';
import { PERSON_COLORS, personColor } from '../utils/status';
import { unwrapList, PaginatedResponse } from '../types/domain';
import { Button, IconButton, Input, Panel, Field, Checkbox, Avatar, Pill, Chip, Icon, ErrorState, SkeletonRows, EmptyState, ConfirmModal } from '../components/ui';

interface User {
    _id: string;
    name?: string;
    email?: string;
    color?: string;
    roles?: Record<string, number>;
}

const ROLE_NAMES = ['Admin', 'TechnischePlanning', 'TechnischeSchouwer', 'Werkvoorbereider', 'HASPlanning', 'HASMonteur'] as const;
type RoleName = typeof ROLE_NAMES[number];

interface FormState {
    name: string;
    email: string;
    password: string;
    roles: RoleName[];
    color: string;
}

const emptyForm = (): FormState => ({ name: '', email: '', password: '', roles: [], color: PERSON_COLORS[0] });
const rolesOf = (u: User): RoleName[] => ROLE_NAMES.filter((r) => u.roles && u.roles[r] !== undefined && u.roles[r] !== null);

const UsersPage: React.FC = () => {
    const { auth } = useAuth();
    const { showSuccess } = useNotification();
    const { handleApiError } = useError();
    usePageChrome([{ label: t('users.title') }], t('users.title'));

    const { data, loading, error, reload } = useApi<PaginatedResponse<User> | User[]>('/api/users', { params: { limit: 500 } });
    const users = useMemo(() => unwrapList<User>(data ?? undefined), [data]);

    const [query, setQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<RoleName | 'all'>('all');
    const [editing, setEditing] = useState<User | 'new' | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm());
    const [saving, setSaving] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<User | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (editing === 'new') setForm(emptyForm());
        else if (editing) setForm({ name: editing.name ?? '', email: editing.email ?? '', password: '', roles: rolesOf(editing), color: personColor(editing.color, 0) });
    }, [editing]);

    const counts = useMemo(() => {
        const c: Record<string, number> = { all: users.length };
        ROLE_NAMES.forEach((r) => { c[r] = users.filter((u) => rolesOf(u).includes(r)).length; });
        return c;
    }, [users]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return users.filter((u) => (roleFilter === 'all' || rolesOf(u).includes(roleFilter)) && (!q || (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || rolesOf(u).some((r) => r.toLowerCase().includes(q))));
    }, [users, query, roleFilter]);

    const isSelf = (u: User) => !!u.email && u.email === auth.email;

    const save = async () => {
        setSaving(true);
        try {
            const payload: Record<string, unknown> = { name: form.name.trim(), email: form.email.trim(), roles: form.roles, color: form.color };
            if (form.password) payload.password = form.password;
            if (editing === 'new') {
                await axiosPrivate.post('/api/users', payload);
            } else if (editing) {
                await axiosPrivate.put(`/api/users/${editing._id}`, payload);
            }
            showSuccess(t('users.saved'));
            setEditing(null);
            await reload();
        } catch (err) {
            handleApiError(err, 'Gebruiker kon niet worden opgeslagen.');
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        if (!pendingDelete) return;
        setDeleting(true);
        try {
            await axiosPrivate.delete(`/api/users/${pendingDelete._id}`);
            showSuccess(t('users.deleted'));
            setPendingDelete(null);
            if (editing && editing !== 'new' && editing._id === pendingDelete._id) setEditing(null);
            await reload();
        } catch (err) {
            handleApiError(err, 'Gebruiker kon niet worden verwijderd.');
        } finally {
            setDeleting(false);
        }
    };

    const toggleRole = (r: RoleName) => setForm((f) => ({ ...f, roles: f.roles.includes(r) ? f.roles.filter((x) => x !== r) : [...f.roles, r] }));
    const editingSelf = editing && editing !== 'new' && isSelf(editing);
    const valid = form.name.trim().length >= 2 && /\S+@\S+\.\S+/.test(form.email) && form.roles.length > 0 && (editing !== 'new' || form.password.length >= 8) && (!form.password || (form.password.length >= 8 && /[A-Za-z]/.test(form.password) && /\d/.test(form.password)));

    if (loading && !data) return <SkeletonRows rows={6} />;
    if (error && !data) return <ErrorState onRetry={reload} />;

    return (
        <div className="page">
            <header className="page__header">
                <div className="page__title-block">
                    <h1 className="t-title-l">{t('users.title')}</h1>
                    <p className="page__subtitle t-small">{t('users.subtitle', { n: users.length })}</p>
                </div>
                <div className="page__actions">
                    <Button variant="primary" icon="person_add" onClick={() => setEditing('new')}>{t('users.add')}</Button>
                </div>
            </header>

            <div className="district__toolbar">
                <div className="district__search"><Input icon="search" placeholder={t('users.searchPlaceholder')} value={query} onChange={(e) => setQuery(e.target.value)} /></div>
                <div className="chips chips--scroll">
                    <Chip active={roleFilter === 'all'} count={counts.all} onClick={() => setRoleFilter('all')}>{t('common.all')}</Chip>
                    {ROLE_NAMES.map((r) => <Chip key={r} active={roleFilter === r} count={counts[r]} onClick={() => setRoleFilter(r)}>{r}</Chip>)}
                </div>
            </div>

            <div className={`users ${editing ? '' : 'users--single'}`.trim()}>
                <div className="table-wrap table-wrap--scroll">
                    {visible.length === 0 ? (
                        <EmptyState icon="group" title="Geen gebruikers voor dit filter" />
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>{t('users.col.name')}</th>
                                    <th>{t('users.col.email')}</th>
                                    <th>{t('users.col.roles')}</th>
                                    <th aria-label="Acties" />
                                </tr>
                            </thead>
                            <tbody>
                                {visible.map((u, i) => (
                                    <tr key={u._id} className={`is-clickable ${editing && editing !== 'new' && editing._id === u._id ? 'is-selected' : ''}`.trim()} onClick={() => setEditing(u)}>
                                        <td>
                                            <span className="row">
                                                <Avatar name={u.name} color={u.color} index={i} />
                                                <span style={{ fontWeight: 600 }}>{u.name || '—'}</span>
                                                {isSelf(u) && <span className="t-caption muted">({t('users.you')})</span>}
                                            </span>
                                        </td>
                                        <td className="t-small secondary">{u.email}</td>
                                        <td>
                                            <span className="row row--wrap gap-1">
                                                {rolesOf(u).map((r) => <Pill key={r} family="role">{r}</Pill>)}
                                                {rolesOf(u).length === 0 && <Pill family="blocked" icon="person_off">Geen rol</Pill>}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="actions" onClick={(e) => e.stopPropagation()}>
                                                <IconButton icon="edit" label={t('common.edit')} size="dense" onClick={() => setEditing(u)} />
                                                <IconButton icon="delete" label={t('common.delete')} size="dense" disabled={isSelf(u)} title={isSelf(u) ? t('users.selfDelete') : t('common.delete')} onClick={() => setPendingDelete(u)} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {editing && (
                    <Panel
                        title={editing === 'new' ? t('users.create') : t('users.edit', { name: editing.name ?? '' })}
                        icon={editing === 'new' ? 'person_add' : 'manage_accounts'}
                        actions={<IconButton icon="close" label={t('common.close')} size="dense" onClick={() => setEditing(null)} />}
                        footer={
                            <>
                                {editing !== 'new' && !editingSelf && <Button variant="danger" icon="delete" onClick={() => setPendingDelete(editing)}>{t('common.delete')}</Button>}
                                <span className="ml-auto row">
                                    <Button variant="secondary" onClick={() => setEditing(null)} disabled={saving}>{t('common.cancel')}</Button>
                                    <Button variant="primary" onClick={save} loading={saving} disabled={!valid}>{t('common.save')}</Button>
                                </span>
                            </>
                        }
                    >
                        <div className="col gap-3">
                            <Field label={t('users.name')} required>{(id) => <Input id={id} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} autoFocus />}</Field>
                            <Field label={t('users.email')} required>{(id) => <Input id={id} type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />}</Field>
                            <Field label={t('users.password')} required={editing === 'new'} hint={t('users.passwordHint')}>
                                {(id) => <Input id={id} type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />}
                            </Field>
                            <div className="col gap-2">
                                <span className="field__label">{t('users.roles')}</span>
                                <div className="role-checks">
                                    {ROLE_NAMES.map((r) => (
                                        <Checkbox key={r} label={r} checked={form.roles.includes(r)} onChange={() => toggleRole(r)} disabled={!!editingSelf && r === 'Admin'} />
                                    ))}
                                </div>
                                {editingSelf && <span className="t-caption muted">{t('users.selfDelete')}</span>}
                            </div>
                            <div className="col gap-2">
                                <span className="field__label">{t('users.color')}</span>
                                <div className="swatches" role="radiogroup" aria-label={t('users.color')}>
                                    {PERSON_COLORS.map((c) => (
                                        <button key={c} type="button" role="radio" aria-checked={form.color.toLowerCase() === c.toLowerCase()} className={`swatch ${form.color.toLowerCase() === c.toLowerCase() ? 'is-active' : ''}`.trim()} style={{ background: c }} onClick={() => setForm((f) => ({ ...f, color: c }))} title={c} />
                                    ))}
                                </div>
                                <span className="t-caption muted">{t('users.colorHint')}</span>
                                <span className="row t-small"><Avatar name={form.name || '?'} color={form.color} size="md" /> <Icon name="event" className="muted" /> zo ziet deze persoon eruit in de agenda</span>
                            </div>
                        </div>
                    </Panel>
                )}
            </div>

            <ConfirmModal
                open={!!pendingDelete}
                onClose={() => setPendingDelete(null)}
                onConfirm={remove}
                title={t('users.deleteTitle')}
                message={t('users.deleteText', { name: pendingDelete?.name ?? pendingDelete?.email ?? '' })}
                confirmText={t('common.delete')}
                loading={deleting}
            />
        </div>
    );
};

export default UsersPage;
