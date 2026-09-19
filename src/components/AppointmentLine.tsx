// "21 sep · 08:00–09:30 · Schouw · james" — reused in tables, cards, detail pages.

import React from 'react';
import Icon from './ui/Icon';
import { fmtDayMonth, fmtRange } from '../utils/format';
import { hasTypeStatus } from '../utils/status';
import { t } from '../i18n';
import type { AppointmentBooked } from '../types/domain';

interface AppointmentLineProps {
    kind: 'technical' | 'has';
    appointment?: AppointmentBooked | null;
    person?: string;
    showType?: boolean;
    /** Render "Geen afspraak" when there is none. */
    empty?: boolean;
}

const AppointmentLine: React.FC<AppointmentLineProps> = ({ kind, appointment, person, showType = true, empty = true }) => {
    if (!appointment?.date) {
        return empty ? <span className="appt appt--none">{t('common.noAppointment')}</span> : null;
    }
    const type = kind === 'has' ? hasTypeStatus(appointment.type) : null;
    return (
        <span className="appt">
            <Icon name={kind === 'has' ? 'construction' : 'search_check'} />
            <span className="appt__time">{fmtDayMonth(appointment.date)}</span>
            <span className="appt__sep">·</span>
            <span className="appt__time">{fmtRange(appointment.startTime, appointment.endTime)}</span>
            {showType && (
                <>
                    <span className="appt__sep">·</span>
                    <span>{kind === 'has' ? type?.label : 'Schouw'}</span>
                </>
            )}
            {person && (
                <>
                    <span className="appt__sep">·</span>
                    <span className="truncate">{person}</span>
                </>
            )}
        </span>
    );
};

export default AppointmentLine;
