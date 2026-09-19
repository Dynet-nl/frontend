// Edit the technical-planning record of a flat (phone, VvE, surveyor, call log, notes).
// Appointments are booked in the scheduler; this dialog does not touch the date.

import React, { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Field, Input, Select, Textarea, Switch } from '../ui/Field';
import axiosPrivate from '../../api/axios';
import { usePersonnel } from '../../hooks/usePersonnel';
import { useNotification } from '../../context/NotificationProvider';
import { useError } from '../../context/ErrorProvider';
import { t } from '../../i18n';

export interface TechnicalPlanningRecord {
    telephone?: string;
    vveWocoName?: string;
    technischeSchouwerName?: string;
    readyForSchouwer?: boolean;
    signed?: boolean;
    calledAlready?: boolean;
    timesCalled?: number;
    smsSent?: boolean;
    additionalNotes?: string;
}

interface TechnicalPlanningDialogProps {
    open: boolean;
    flatId: string;
    initial?: TechnicalPlanningRecord | null;
    onClose: () => void;
    onSaved: (flat: unknown) => void;
    /** Field roles may not see the telephone; hide the field then. */
    showTelephone: boolean;
}

const TechnicalPlanningDialog: React.FC<TechnicalPlanningDialogProps> = ({ open, flatId, initial, onClose, onSaved, showTelephone }) => {
    const { people } = usePersonnel('TechnischeSchouwer');
    const { showSuccess } = useNotification();
    const { handleApiError } = useError();
    const [form, setForm] = useState<TechnicalPlanningRecord>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setForm({
                telephone: initial?.telephone ?? '',
                vveWocoName: initial?.vveWocoName ?? '',
                technischeSchouwerName: initial?.technischeSchouwerName ?? '',
                readyForSchouwer: !!initial?.readyForSchouwer,
                signed: !!initial?.signed,
                timesCalled: initial?.timesCalled ?? 0,
                smsSent: !!initial?.smsSent,
                additionalNotes: initial?.additionalNotes ?? '',
            });
        }
    }, [open, initial]);

    const set = <K extends keyof TechnicalPlanningRecord>(key: K, value: TechnicalPlanningRecord[K]) => setForm((f) => ({ ...f, [key]: value }));

    const save = async () => {
        setSaving(true);
        try {
            const payload: TechnicalPlanningRecord = {
                vveWocoName: form.vveWocoName,
                technischeSchouwerName: form.technischeSchouwerName,
                readyForSchouwer: form.readyForSchouwer,
                signed: form.signed,
                timesCalled: form.timesCalled ?? 0,
                calledAlready: (form.timesCalled ?? 0) > 0,
                smsSent: form.smsSent,
                additionalNotes: form.additionalNotes,
            };
            if (showTelephone) payload.telephone = form.telephone;
            const { data } = await axiosPrivate.put(`/api/apartment/${flatId}/technische-planning`, payload);
            showSuccess('Technische planning opgeslagen');
            onSaved(data);
            onClose();
        } catch (err) {
            handleApiError(err, 'Opslaan is niet gelukt.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={t('flat.editPlanning')}
            size="medium"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={saving}>{t('common.cancel')}</Button>
                    <Button variant="primary" onClick={save} loading={saving}>{t('common.save')}</Button>
                </>
            }
        >
            <div className="form-grid">
                {showTelephone && (
                    <Field label={t('flat.phone')}>
                        {(id) => <Input id={id} mono value={form.telephone ?? ''} onChange={(e) => set('telephone', e.target.value)} placeholder="06 12345678" maxLength={40} />}
                    </Field>
                )}
                <Field label={t('flat.vve')}>
                    {(id) => <Input id={id} value={form.vveWocoName ?? ''} onChange={(e) => set('vveWocoName', e.target.value)} />}
                </Field>
                <Field label={t('flat.surveyor')}>
                    {(id) => (
                        <Select id={id} value={form.technischeSchouwerName ?? ''} onChange={(e) => set('technischeSchouwerName', e.target.value)}>
                            <option value="">{t('scheduler.pick')}</option>
                            {people.map((p) => <option key={p._id} value={p.name}>{p.name}</option>)}
                            {form.technischeSchouwerName && !people.some((p) => p.name === form.technischeSchouwerName) && <option value={form.technischeSchouwerName}>{form.technischeSchouwerName}</option>}
                        </Select>
                    )}
                </Field>
                <Field label={t('flat.called')} hint="Aantal belpogingen">
                    {(id) => <Input id={id} type="number" min={0} value={form.timesCalled ?? 0} onChange={(e) => set('timesCalled', Math.max(0, parseInt(e.target.value || '0', 10)))} />}
                </Field>
                <div className="col gap-3">
                    <Switch checked={!!form.readyForSchouwer} onChange={(v) => set('readyForSchouwer', v)} label={t('flat.readyForSurvey')} />
                    <Switch checked={!!form.smsSent} onChange={(v) => set('smsSent', v)} label={t('flat.smsSent')} />
                    <Switch checked={!!form.signed} onChange={(v) => set('signed', v)} label={t('flat.status.signed')} />
                </div>
                <div className="span-2">
                    <Field label={t('flat.notes')}>
                        {(id) => <Textarea id={id} value={form.additionalNotes ?? ''} onChange={(e) => set('additionalNotes', e.target.value)} maxLength={2000} placeholder="Bijv. bewoner werkt tot 16:00, liefst afspraak na 17:00" />}
                    </Field>
                </div>
            </div>
        </Modal>
    );
};

export default TechnicalPlanningDialog;
