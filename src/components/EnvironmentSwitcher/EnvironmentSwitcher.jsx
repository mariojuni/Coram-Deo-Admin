import React, { useState } from 'react';
import { BUILD_ENV, currentActiveFirebaseEnv, reinitFirebaseForEnv } from '../../firebase';
import { setSavedEnvironment, getAllowedEnvironments } from '../../config/environments';

/**
 * EnvironmentSwitcher — visible only in staging builds.
 * Shows the current active Firebase environment as a badge in the bottom-right corner.
 * Clicking it opens a small dropdown to switch environments.
 * After switching, the page reloads to cleanly reset all Firebase listeners.
 */
export default function EnvironmentSwitcher() {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [activeEnv, setActiveEnv] = useState(currentActiveFirebaseEnv);

  // Only render in staging builds
  if (BUILD_ENV === 'production') return null;

  const allowed = getAllowedEnvironments();
  const isProd = activeEnv === 'production';

  const handleSwitch = async (targetEnv) => {
    if (targetEnv === activeEnv || switching) return;
    setSwitching(true);
    setOpen(false);
    try {
      setSavedEnvironment(targetEnv);
      await reinitFirebaseForEnv(targetEnv);
      setActiveEnv(targetEnv);
      // Full reload to cleanly reset all React state and Firebase listeners
      window.location.reload();
    } catch (e) {
      console.error('[EnvSwitcher] Failed to switch environment:', e);
      setSwitching(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999, fontFamily: 'system-ui, sans-serif' }}>
      {/* Dropdown options */}
      {open && (
        <div style={{
          position: 'absolute',
          bottom: '110%',
          right: 0,
          background: '#1e1e2e',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10,
          padding: '6px 0',
          minWidth: 180,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          <div style={{ padding: '6px 14px 4px', fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Switch Environment
          </div>
          {allowed.map((env) => (
            <button
              key={env}
              onClick={() => handleSwitch(env)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                background: 'none',
                border: 'none',
                cursor: env === activeEnv ? 'default' : 'pointer',
                padding: '8px 14px',
                color: env === activeEnv ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.55)',
                fontSize: 13,
                fontWeight: env === activeEnv ? 700 : 400,
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (env !== activeEnv) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: env === 'production' ? '#f87171' : '#34d399',
                display: 'inline-block',
                flexShrink: 0,
              }} />
              {env === 'production' ? '🔴 Production' : '🟢 Staging'}
              {env === activeEnv && (
                <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Active</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Badge trigger button */}
      <button
        onClick={() => !switching && setOpen(o => !o)}
        title={switching ? 'Switching environment…' : `Active: ${activeEnv} — click to switch`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          background: isProd ? 'rgba(239,68,68,0.9)' : 'rgba(251,191,36,0.9)',
          color: isProd ? 'white' : '#1a1a1a',
          border: 'none',
          borderRadius: 20,
          cursor: switching ? 'wait' : 'pointer',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(4px)',
          transition: 'opacity 0.2s',
          opacity: switching ? 0.6 : 1,
        }}
      >
        <span style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: isProd ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.5)',
          display: 'inline-block',
          animation: 'pulse 2s infinite',
        }} />
        {switching ? 'Switching…' : (isProd ? 'PROD' : 'STAGING')}
        <span style={{ fontSize: 9, opacity: 0.7 }}>▲</span>
      </button>
    </div>
  );
}
