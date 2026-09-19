// "Installatie afronden": result, signal strength, connection test, photos, notes.
// Sends multipart to PUT /api/apartment/:id/has-monteur/complete.

import React, { useRef, useState } from 'react';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { Field, Input, Textarea, Switch } from '../ui/Field';
import axiosPrivate from '../../api/axios';
import { useNotification } from '../../context/NotificationProvider';
import { useError } from '../../context/ErrorProvider';
import { t } from '../../i18n';

type Result = 'completed' | 'issues' | 'not-home';

interface CompletionFormProps {
    flatId: string;
    onSaved: (flat: unknown) => void;
    onCancel?: () => void;
    existingPhotos?: string[];
}

const MAX_PHOTOS = 4;

const CompletionForm: React.FC<CompletionFormProps> = ({ flatId, onSaved, onCancel, existingPhotos = [] }) => {
    const { showSuccess } = useNotification();
    const { handleApiError } = useError();
    const [result, setResult] = useState<Result>('completed');
    const [signal, setSignal] = useState('');
    const [cable, setCable] = useState(true);
    const [tested, setTested] = useState(true);
    const [testResult, setTestResult] = useState('OK');
    const [notes, setNotes] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [saving, setSaving] = useState(false);
    const fileInput = useRef<HTMLInputElement>(null);

    const room = Math.max(0, MAX_PHOTOS - existingPhotos.length);

    const addFiles = (list: FileList | null) => {
        if (!list) return;
        setFiles((prev) => [...prev, ...Array.from(list)].slice(0, room));
    };

    const submit = async () => {
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('status', result);
            if (notes.trim()) fd.append('notes', notes.trim());
            if (result === 'completed') {
                fd.append('cableInstalled', String(cable));
                if (signal.trim()) fd.append('signalStrength', signal.trim().replace(',', '.'));
                fd.append('connectionTestPerformed', String(tested));
                if (tested) fd.append('connectionTestResult', testResult);
            }
            files.forEach((f) => fd.append('photos', f));
            const { data } = await axiosPrivate.put(`/api/apartment/${flatId}/has-monteur/complete`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            showSuccess(result === 'completed' ? 'Oplevering opgeslagen · flat staat op Opgeleverd' : 'Oplevering opgeslagen');
            onSaved(data);
        } catch (err) {
            handleApiError(err, 'Oplevering kon niet worden opgeslagen.');
        } finally {
            setSaving(false);
        }
    };

    const options: Array<{ value: Result; label: string; icon: string }> = [
        { value: 'completed', label: t('flat.result.completed'), icon: 'check_circle' },
        { value: 'issues', label: t('flat.result.issues'), icon: 'error' },
        { value: 'not-home', label: t('flat.result.notHome'), icon: 'door_front' },
    ];

    return (
        <div className="col gap-4">
            <div className="col gap-2">
                <span className="field__label">{t('flat.result')}</span>
                <div className="result-seg" role="radiogroup" aria-label={t('flat.result')}>
                    {options.map((o) => (
                        <button key={o.value} type="button" role="radio" aria-checked={result === o.value} className={`result-seg__item ${result === o.value ? 'is-active' : ''}`.trim()} onClick={() => setResult(o.value)}>
                            <Icon name={o.icon} />
                            {o.label}
                        </button>
                    ))}
                </div>
            </div>

            {result === 'completed' && (
                <div className="form-grid">
                    <Field label={t('flat.signalStrength')} hint="dBm, bijv. -18,4">
                        {(id) => <Input id={id} mono inputMode="decimal" value={signal} onChange={(e) => setSignal(e.target.value)} placeholder="-18,4" />}
                    </Field>
                    <div className="col gap-3" style={{ justifyContent: 'center' }}>
                        <Switch checked={cable} onChange={setCable} label={t('flat.cableInstalled')} />
                        <Switch checked={tested} onChange={setTested} label={t('flat.connectionTest')} />
                    </div>
                    {tested && (
                        <Field label="Testresultaat">
                            {(id) => <Input id={id} value={testResult} onChange={(e) => setTestResult(e.target.value)} placeholder="OK" />}
                        </Field>
                    )}
                </div>
            )}

            <div className="col gap-2">
                <span className="field__label">{t('flat.photos')} <span className="muted">({existingPhotos.length + files.length}/{MAX_PHOTOS})</span></span>
                <div className="photos">
                    {existingPhotos.map((p) => (
                        <span key={p} className="photo"><img src={p} alt="" /></span>
                    ))}
                    {files.map((f, i) => (
                        <span key={`${f.name}-${i}`} className="photo" title={f.name}>
                            <img src={URL.createObjectURL(f)} alt="" />
                        </span>
                    ))}
                    {files.length < room && (
                        <button type="button" className="photo photo--add" onClick={() => fileInput.current?.click()} aria-label="Foto toevoegen">
                            <Icon name="add_a_photo" />
                        </button>
                    )}
                </div>
                <input ref={fileInput} type="file" accept="image/*" capture="environment" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
            </div>

            <Field label={t('flat.notes')}>
                {(id) => <Textarea id={id} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} placeholder={result === 'not-home' ? 'Bijv. briefje achtergelaten, bewoner belt terug' : 'Bijzonderheden voor de planning'} />}
            </Field>

            <div className="row" style={{ justifyContent: 'flex-end' }}>
                {onCancel && <Button variant="secondary" onClick={onCancel} disabled={saving}>{t('common.cancel')}</Button>}
                <Button variant="primary" icon="task_alt" onClick={submit} loading={saving}>{t('flat.saveDelivery')}</Button>
            </div>
        </div>
    );
};

export default CompletionForm;
