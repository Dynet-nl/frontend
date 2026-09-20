// "Schouw afronden" for the technical surveyor: signature received, ready for HAS, notes.
// Writes the same technical-planning record the planners edit; the date stays untouched.

import React, { useState } from 'react';
import Button from '../ui/Button';
import { Field, Textarea, Switch } from '../ui/Field';
import axiosPrivate from '../../api/axios';
import { useNotification } from '../../context/NotificationProvider';
import { useError } from '../../context/ErrorProvider';
import { t } from '../../i18n';

interface SurveyCompletionFormProps {
    flatId: string;
    initialNotes?: string;
    onSaved: (flat: unknown) => void;
}

const SurveyCompletionForm: React.FC<SurveyCompletionFormProps> = ({ flatId, initialNotes = '', onSaved }) => {
    const { showSuccess } = useNotification();
    const { handleApiError } = useError();
    const [signed, setSigned] = useState(true);
    const [ready, setReady] = useState(true);
    const [notes, setNotes] = useState(initialNotes);
    const [saving, setSaving] = useState(false);

    const save = async () => {
        setSaving(true);
        try {
            const { data } = await axiosPrivate.put(`/api/apartment/${flatId}/technische-planning`, { signed, readyForSchouwer: ready, additionalNotes: notes });
            showSuccess(signed ? 'Schouw opgeslagen · getekend' : 'Schouw opgeslagen');
            onSaved(data);
        } catch (err) {
            handleApiError(err, 'Schouw kon niet worden opgeslagen.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="col gap-4">
            <div className="col gap-3">
                <Switch checked={signed} onChange={setSigned} label="Handtekening bewoner ontvangen (schouw getekend)" />
                <Switch checked={ready} onChange={setReady} label="Gereed voor HAS-installatie" />
            </div>
            <Field label={t('flat.notes')}>
                {(id) => <Textarea id={id} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} placeholder="Bijv. meterkast links van de voordeur, boren door betonvloer nodig" />}
            </Field>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
                <Button variant="primary" icon="draw" onClick={save} loading={saving}>Schouw opslaan</Button>
            </div>
        </div>
    );
};

export default SurveyCompletionForm;
