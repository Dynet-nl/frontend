// 403 page.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '../i18n';
import Button from './ui/Button';
import Icon from './ui/Icon';

const Unauthorized: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div className="state state--center" style={{ maxWidth: 460 }} role="alert">
                <Icon name="lock" className="state__icon" />
                <div className="state__title">{t('state.forbidden.title')}</div>
                <div className="state__text">{t('state.forbidden.text')}</div>
                <div className="btn-group" style={{ marginTop: 4 }}>
                    <Button variant="secondary" icon="arrow_back" onClick={() => navigate(-1)}>{t('common.back')}</Button>
                    <Button variant="primary" onClick={() => navigate('/')}>{t('state.goHome')}</Button>
                </div>
            </div>
        </div>
    );
};

export default Unauthorized;
