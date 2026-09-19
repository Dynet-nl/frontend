// The action cluster on a building row/card: Inplannen, block toggle, "more" menu.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LinkButton, IconButton } from '../ui/Button';
import Menu from '../ui/Menu';
import { t } from '../../i18n';
import { ROLES } from '../../utils/constants';
import { canSchedule, canScheduleHas, canScheduleTechnical, scheduleBuildingHref } from '../../utils/routes';
import type { BuildingSummary } from '../../utils/buildingSummary';

interface BuildingActionsProps {
    summary: BuildingSummary;
    roles: number[];
    onBlock: (summary: BuildingSummary) => void;
    onUnblock: (summary: BuildingSummary) => void;
    dense?: boolean;
}

const BuildingActions: React.FC<BuildingActionsProps> = ({ summary, roles, onBlock, onUnblock, dense = true }) => {
    const navigate = useNavigate();
    const b = summary.building;
    const mayBlock = roles.includes(ROLES.ADMIN) || roles.includes(ROLES.WERKVOORBEREIDER);
    const blocked = !!b.isBlocked;
    const size = dense ? 'dense' : 'default';
    const items = [
        { label: t('building.title'), icon: 'architecture', onSelect: () => navigate(`/building/${b._id}`) },
        ...(canScheduleTechnical(roles) && canScheduleHas(roles)
            ? [
                { label: `${t('scheduler.survey')} ${t('common.schedule').toLowerCase()}`, icon: 'search_check', onSelect: () => navigate(scheduleBuildingHref(b._id, roles, 'Technical')), disabled: blocked },
                { label: `${t('scheduler.has')} ${t('common.schedule').toLowerCase()}`, icon: 'construction', onSelect: () => navigate(scheduleBuildingHref(b._id, roles, 'HAS')), disabled: blocked },
            ]
            : []),
        ...(mayBlock
            ? [
                'separator' as const,
                blocked
                    ? { label: t('common.unblock'), icon: 'lock_open', onSelect: () => onUnblock(summary) }
                    : { label: t('common.block'), icon: 'block', onSelect: () => onBlock(summary), danger: true },
            ]
            : []),
    ];

    return (
        <div className="actions">
            {canSchedule(roles) && (
                blocked ? (
                    <span className="btn btn--accent btn--dense" aria-disabled="true" title={t('common.scheduleBlocked')}>
                        <span className="icon">event</span>
                        <span>{t('common.schedule')}</span>
                    </span>
                ) : (
                    <LinkButton to={scheduleBuildingHref(b._id, roles)} variant="accent" size={size} icon="event">
                        {t('common.schedule')}
                    </LinkButton>
                )
            )}
            {mayBlock && (
                <IconButton
                    icon={blocked ? 'lock' : 'lock_open'}
                    label={blocked ? t('common.unblock') : t('common.block')}
                    size={size}
                    onClick={() => (blocked ? onUnblock(summary) : onBlock(summary))}
                    style={blocked ? { color: 'var(--status-blocked-fg)' } : undefined}
                />
            )}
            <Menu items={items} />
        </div>
    );
};

export default BuildingActions;
