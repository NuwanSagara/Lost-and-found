import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const badgeStyles = {
    'Strong Match': { background: 'rgba(81,207,102,0.15)', borderColor: '#51CF66', color: '#51CF66' },
    'Possible Match': { background: 'rgba(255,193,7,0.12)', borderColor: '#FFC107', color: '#FFC107' },
    'Weak Match': { background: 'rgba(255,107,53,0.12)', borderColor: '#FF6B35', color: '#FF6B35' },
    'Unlikely Match': {
        background: 'rgba(255,255,255,0.05)',
        borderColor: 'rgba(255,255,255,0.15)',
        color: '#F8F9FA',
    },
};

const barColors = {
    text: '#FF6B35',
    image: '#818CF8',
    meta: '#51CF66',
};

const clampScore = (value) => Math.max(0, Math.min(100, Number(value) || 0));

const MatchCard = ({ match, itemType, onStatusChange }) => {
    const { user } = useAuth();
    const [animatedScores, setAnimatedScores] = useState({ text: 0, image: 0, meta: 0 });
    const [pendingAction, setPendingAction] = useState('');
    const apiBaseUrl = (import.meta.env.VITE_API_URL || '').replace('/api', '');
    const scores = match.scores || {};
    const ai = match.ai || {};
    const badgeStyle = badgeStyles[match.label] || badgeStyles['Unlikely Match'];

    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimatedScores({
                text: clampScore(scores.text),
                image: clampScore(scores.image),
                meta: clampScore(scores.meta),
            });
        }, 80);

        return () => clearTimeout(timer);
    }, [scores.image, scores.meta, scores.text]);

    const handleAction = async (action) => {
        if (!user?.token) {
            return;
        }

        try {
            setPendingAction(action);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/matches/${match._id}/${action}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Action failed');
            }

            onStatusChange?.(match._id, action === 'confirm' ? 'confirmed' : 'rejected');
        } catch (error) {
            console.error(error);
        } finally {
            setPendingAction('');
        }
    };

    const renderBar = (label, value, colorKey) => (
        <div style={{ display: 'grid', gridTemplateColumns: '54px 1fr 42px', gap: '12px', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.72)', fontSize: '13px', fontWeight: 600 }}>{label}</span>
            <div style={{ height: '10px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div
                    style={{
                        width: `${value}%`,
                        height: '100%',
                        borderRadius: '999px',
                        background: barColors[colorKey],
                        transition: 'width 0.6s ease',
                    }}
                />
            </div>
            <span style={{ color: '#F8F9FA', fontSize: '12px', textAlign: 'right' }}>{Math.round(value)}%</span>
        </div>
    );

    const keyMatches = [...(ai.keyMatches || []), ...(ai.visualMatches || [])].slice(0, 5);
    const lostItem = match.lostItem || {};
    const foundItem = match.foundItem || {};

    return (
        <div
            style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '24px',
                padding: '24px',
                boxShadow: '0 24px 60px rgba(0,0,0,0.24)',
                backdropFilter: 'blur(18px)',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '18px' }}>
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        borderRadius: '999px',
                        border: `1px solid ${badgeStyle.borderColor}`,
                        background: badgeStyle.background,
                        color: badgeStyle.color,
                        padding: '8px 14px',
                        fontSize: '13px',
                        fontWeight: 700,
                    }}
                >
                    <span>{match.label}</span>
                    <span>{Math.round(Number(scores.final || 0))}%</span>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.42)', fontSize: '12px' }}>Status: {match.status}</span>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '18px' }}>
                    {[lostItem, foundItem].map((entry, index) => (
                        <div key={entry._id || index}>
                            <div style={{ aspectRatio: '1.15', borderRadius: '18px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', marginBottom: '10px' }}>
                                {entry.image?.url ? (
                                    <img src={`${apiBaseUrl}${entry.image.url}`} alt={entry.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : null}
                            </div>
                            <div style={{ color: '#F8F9FA', fontWeight: 700, fontSize: '14px' }}>{entry.title}</div>
                        </div>
                    ))}
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <div style={{ color: '#F8F9FA', fontWeight: 700, marginBottom: '8px' }}>Key Matches</div>
                    <div style={{ display: 'grid', gap: '8px' }}>
                        {keyMatches.length > 0 ? keyMatches.map((entry) => (
                            <div key={entry} style={{ color: 'rgba(255,255,255,0.72)', fontSize: '14px' }}>
                                {'\u2022'} {entry}
                            </div>
                        )) : (
                            <div style={{ color: 'rgba(255,255,255,0.48)', fontSize: '14px' }}>No extracted key matches available.</div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'grid', gap: '8px', marginBottom: '18px', color: 'rgba(255,255,255,0.72)', fontSize: '14px' }}>
                    <div>Lost: {lostItem.location?.name || 'Unknown location'}</div>
                    <div>Found: {foundItem.location?.name || 'Unknown location'}</div>
                    <div style={{ color: 'rgba(255,255,255,0.58)' }}>{ai.textReason || 'No text reasoning available.'}</div>
                    {ai.imageReason ? <div style={{ color: 'rgba(255,255,255,0.58)' }}>{ai.imageReason}</div> : null}
                    {ai.fallback ? <div style={{ color: '#FFC107' }}>Metadata-only fallback used because Claude was unavailable.</div> : null}
                    <div style={{ color: 'rgba(255,255,255,0.52)' }}>AI confidence: {ai.confidence || 'low'}</div>
                </div>

                <div style={{ marginBottom: '18px' }}>
                    <div style={{ color: '#F8F9FA', fontWeight: 700, marginBottom: '10px' }}>Score Breakdown</div>
                    <div style={{ display: 'grid', gap: '10px' }}>
                        {renderBar('Text', animatedScores.text, 'text')}
                        {renderBar('Image', animatedScores.image, 'image')}
                        {renderBar('Meta', animatedScores.meta, 'meta')}
                    </div>
                </div>

                {itemType === 'lost' ? (
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            onClick={() => handleAction('confirm')}
                            disabled={pendingAction !== '' || match.status === 'confirmed' || !user?.token}
                            style={{
                                flex: '1 1 180px',
                                minHeight: '46px',
                                borderRadius: '999px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #FF6B35, #FF8C5A)',
                                color: '#fff',
                                fontWeight: 700,
                                cursor: 'pointer',
                                opacity: pendingAction || match.status === 'confirmed' || !user?.token ? 0.75 : 1,
                            }}
                        >
                            {'\u2705'} This is mine!
                        </button>
                        <button
                            type="button"
                            onClick={() => handleAction('reject')}
                            disabled={pendingAction !== '' || match.status === 'rejected' || !user?.token}
                            style={{
                                flex: '1 1 180px',
                                minHeight: '46px',
                                borderRadius: '999px',
                                border: '1px solid rgba(255,255,255,0.12)',
                                background: 'rgba(255,255,255,0.04)',
                                color: '#F8F9FA',
                                fontWeight: 700,
                                cursor: 'pointer',
                                opacity: pendingAction || match.status === 'rejected' || !user?.token ? 0.75 : 1,
                            }}
                        >
                            {'\u2717'} Not mine
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default MatchCard;
