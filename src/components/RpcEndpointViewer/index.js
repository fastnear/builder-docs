import React from 'react';
import styles from './styles.module.css';

/**
 * RPCViewer component to display Redocly documentation in an iframe
 *
 * @param {Object} props
 * @param {string} props.endpoint - The Redocly endpoint (e.g., 'account/view_account')
 * @param {Object} props.params - URL parameters to pass to the Redocly viewer
 * @param {string} props.height - Optional height override (default: 900px)
 */
export default function RpcEndpointViewer({ endpoint, params = {}, height = '900px' }) {
  // Determine base URL based on environment
  // Mike: reminder to self, running Redocly locally is "redocly preview" in the project root. (cli)
  const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://127.0.0.1:4000/rpcs/'
    : 'https://fastnear.redocly.app/rpcs/';

  // Build the full URL with parameters
  let url = `${baseUrl}${endpoint}`;

  // Add any parameters as query string
  if (Object.keys(params).length > 0) {
    const queryString = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    url = `${url}?${queryString}`;
    console.log('url debug', url)
  }

  return (
    <div className={styles.viewerContainer}>
      <iframe
        src={url}
        className={styles.viewer}
        style={{ height }}
        allowFullScreen
      />
    </div>
  );
}
