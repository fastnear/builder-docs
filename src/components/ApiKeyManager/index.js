import React, { useState, useEffect } from 'react';
import { translate } from '@docusaurus/Translate';
import styles from './styles.module.css';

const PORTAL_AUTH_EVENT = 'fastnear:authchange';

function dispatchPortalAuthChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(PORTAL_AUTH_EVENT));
  }
}

/**
 * ApiKeyManager component for managing FastNear API keys
 * 
 * This component allows users to set and manage their API key
 * which will be used across all RPC documentation pages
 */
export default function ApiKeyManager() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load API key from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem('fastnear:apiKey') || localStorage.getItem('fastnear_api_key');
      if (storedKey) {
        setApiKey(storedKey);
        // Migrate to new key format if needed
        if (localStorage.getItem('fastnear_api_key') && !localStorage.getItem('fastnear:apiKey')) {
          localStorage.setItem('fastnear:apiKey', storedKey);
        }
      }
    }
  }, []);

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fastnear:apiKey', apiKey);
      localStorage.removeItem('fastnear_api_key');
      dispatchPortalAuthChange();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleClear = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fastnear:apiKey');
      localStorage.removeItem('fastnear_api_key');
      dispatchPortalAuthChange();
      setApiKey('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className={styles.container} data-markdown-skip>
      <h3>
        {translate({
          id: 'fastnear.apiKeyManager.heading',
          message: 'API Key Configuration',
        })}
      </h3>
      <p className={styles.description}>
        {translate({
          id: 'fastnear.apiKeyManager.description',
          message:
            'Set your FastNear API key here. It will be automatically included in all RPC documentation examples.',
        })}
      </p>
      
      <div className={styles.inputGroup}>
        <input
          type={showKey ? 'text' : 'password'}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={translate({
            id: 'fastnear.apiKeyManager.placeholder',
            message: 'Enter your FastNear API key',
          })}
          className={styles.input}
        />
        <button
          onClick={() => setShowKey(!showKey)}
          className={styles.toggleButton}
          type="button"
        >
          {showKey
            ? translate({
                id: 'fastnear.apiKeyManager.hide',
                message: 'Hide',
              })
            : translate({
                id: 'fastnear.apiKeyManager.show',
                message: 'Show',
              })}
        </button>
      </div>

      <div className={styles.buttonGroup}>
        <button onClick={handleSave} className={styles.saveButton}>
          {translate({
            id: 'fastnear.apiKeyManager.save',
            message: 'Save API Key',
          })}
        </button>
        <button onClick={handleClear} className={styles.clearButton}>
          {translate({
            id: 'fastnear.apiKeyManager.clear',
            message: 'Clear API Key',
          })}
        </button>
      </div>

      {saved && (
        <div className={styles.successMessage}>
          {translate(
            {
              id: 'fastnear.apiKeyManager.savedState',
              message: 'API key {state} successfully.',
            },
            {
              state: apiKey
                ? translate({
                    id: 'fastnear.apiKeyManager.savedState.saved',
                    message: 'saved',
                  })
                : translate({
                    id: 'fastnear.apiKeyManager.savedState.cleared',
                    message: 'cleared',
                  }),
            }
          )}
        </div>
      )}

      {apiKey && (
        <div className={styles.example}>
          <h4>
            {translate({
              id: 'fastnear.apiKeyManager.exampleUsage',
              message: 'Example Usage:',
            })}
          </h4>
          <pre className={styles.codeBlock}>
{`curl "https://rpc.mainnet.fastnear.com?apiKey=${apiKey}" \\
  -H "Content-Type: application/json" \\
  --data '{"method":"block","params":{"finality":"final"},"id":1,"jsonrpc":"2.0"}'`}
          </pre>
        </div>
      )}
    </div>
  );
}
