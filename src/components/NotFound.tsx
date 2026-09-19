// 404 page.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '../i18n';
import { EmptyState } from './ui/StateDisplay';
import Button from './ui/Button';

const NotFound: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <EmptyState
                icon="explore_off"
                title={t('state.notFound.title')}
                text={t('state.notFound.text')}
                center
                action={
                    <div className="btn-group">
                        <Button variant="secondary" icon="arrow_back" onClick={() => navigate(-1)}>{t('common.back')}</Button>
                        <Button variant="primary" onClick={() => navigate('/')}>{t('state.goHome')}</Button>
                    </div>
                }
            />
        </div>
    );
};

export default NotFound;
