import React, { useState, useEffect } from 'react';
import styles from './styles.module.css';

/**
 * ApiKeyManager component for managing FastNEAR API keys
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
      // Save to both keys for compatibility
      localStorage.setItem('fastnear:apiKey', apiKey);
      localStorage.setItem('fastnear_api_key', apiKey);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleClear = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fastnear:apiKey');
      localStorage.removeItem('fastnear_api_key');
      setApiKey('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className={styles.container}>
      <h3>API Key Configuration</h3>
      <p className={styles.description}>
        Set your FastNEAR API key here. It will be automatically included in all RPC documentation examples.
      </p>
      
      <div className={styles.inputGroup}>
        <input
          type={showKey ? 'text' : 'password'}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your FastNEAR API key"
          className={styles.input}
        />
        <button
          onClick={() => setShowKey(!showKey)}
          className={styles.toggleButton}
          type="button"
        >
          {showKey ? '🙈' : '👁️'}
        </button>
      </div>

      <div className={styles.buttonGroup}>
        <button onClick={handleSave} className={styles.saveButton}>
          Save API Key
        </button>
        <button onClick={handleClear} className={styles.clearButton}>
          Clear API Key
        </button>
      </div>

      {saved && (
        <div className={styles.successMessage}>
          ✅ API key {apiKey ? 'saved' : 'cleared'} successfully!
        </div>
      )}

      {apiKey && (
        <div className={styles.example}>
          <h4>Example Usage:</h4>
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