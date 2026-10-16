import useOnlineStatus from '../../hooks/useOnlineStatus';
import styles from './OnlineStatus.module.css';

export default function OnlineStatus() {
  const isOffline = useOnlineStatus();

  return (
    <div
      className={`${styles.status} ${isOffline ? styles.offline : styles.online}`}
      role="status"
      aria-label={isOffline ? 'You are offline' : 'You are online'}
    >
      <span className={styles.dot} aria-hidden="true" />
      {isOffline ? 'Offline' : 'Online'}
    </div>
  );
}
