import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getRegisteredOrganizations,
  getLearnerMembership,
  registerLearnerToOrg,
  unregisterLearnerFromOrg,
} from '../../lib/organizations';
import styles from './OrganizationsPage.module.css';

export default function OrganizationsPage() {
  const { user } = useAuth();

  const activeUser = user || (() => {
    try {
      return JSON.parse(localStorage.getItem('handspeak_active_user'));
    } catch {
      return null;
    }
  })();

  const userId = activeUser?.id || (activeUser?.email ? 'usr_' + activeUser.email.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_') : 'guest');
  const userName = activeUser?.user_metadata?.name || activeUser?.email?.split('@')[0] || 'Learner';

  const [organizations, setOrganizations] = useState([]);
  const [learnerOrg, setLearnerOrg] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionNotice, setActionNotice] = useState('');

  const loadData = () => {
    const orgs = getRegisteredOrganizations();
    setOrganizations(orgs);
    setLearnerOrg(getLearnerMembership(userId));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, [userId]);

  const handleRegisterOrg = (org) => {
    try {
      const membership = registerLearnerToOrg(userId, org, {
        name: userName,
        email: activeUser?.email,
      });
      setLearnerOrg(membership);
      setActionNotice(`Successfully registered with ${org.name}! Your learning progress will now be shared with their mentors.`);
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  const handleUnregisterOrg = (orgId) => {
    try {
      unregisterLearnerFromOrg(userId, orgId);
      setLearnerOrg(null);
      setActionNotice('You have unregistered from this organisation.');
    } catch (err) {
      console.error('Unregister failed:', err);
    }
  };

  const filteredOrgs = organizations.filter((org) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      org.name?.toLowerCase().includes(query) ||
      org.category?.toLowerCase().includes(query) ||
      org.address?.toLowerCase().includes(query) ||
      org.description?.toLowerCase().includes(query)
    );
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Partner Organisations &amp; Deaf Communities</h1>
        <p>
          Connect directly with accredited Indian Sign Language training centres,
          schools, and advocacy mentors. Register with an organisation to collaborate,
          receive certified feedback, and join local practice circles.
        </p>
      </header>

      {actionNotice && (
        <div className={styles.toastSuccess}>
          <span>{actionNotice}</span>
          <button
            type="button"
            onClick={() => setActionNotice('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#065F46' }}
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      )}

      {learnerOrg && (
        <div className={styles.affiliationBanner}>
          <div className={styles.affiliationText}>
            <span style={{ fontSize: '1.5rem' }}>🏛️</span>
            <div>
              <strong>Enrolled Member:</strong> You are currently registered with{' '}
              <strong>{learnerOrg.orgName}</strong>
            </div>
          </div>
          <button
            type="button"
            className={styles.affiliationAction}
            onClick={() => handleUnregisterOrg(learnerOrg.orgId)}
          >
            Leave Organisation
          </button>
        </div>
      )}

      <div className={styles.searchBarContainer}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="🔍 Search organisations by name, city, or specialty..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className={styles.orgGrid}>
        {filteredOrgs.length > 0 ? (
          filteredOrgs.map((org) => {
            const isMember = learnerOrg?.orgId === org.id;

            return (
              <div
                key={org.id}
                className={`${styles.orgCard} ${isMember ? styles.orgCardRegistered : ''}`}
              >
                <div className={styles.orgCardTop}>
                  <div className={styles.orgHeaderRow}>
                    <h2 className={styles.orgName}>{org.name}</h2>
                    {org.verified && (
                      <span className={styles.verifiedBadge}>Verified Partner ✓</span>
                    )}
                  </div>

                  <span className={styles.orgCategory}>{org.category}</span>
                  <p className={styles.orgDescription}>{org.description}</p>

                  <div className={styles.orgContactDetails}>
                    <div className={styles.contactRow}>
                      <span className={styles.contactIcon}>📞</span>
                      <span className={styles.contactText}>
                        <a href={`tel:${org.contact_num}`}>{org.contact_num}</a>
                      </span>
                    </div>

                    <div className={styles.contactRow}>
                      <span className={styles.contactIcon}>✉️</span>
                      <span className={styles.contactText}>
                        <a href={`mailto:${org.email}`}>{org.email}</a>
                      </span>
                    </div>

                    <div className={styles.contactRow}>
                      <span className={styles.contactIcon}>📍</span>
                      <span className={styles.contactText}>{org.address}</span>
                    </div>
                  </div>
                </div>

                <div>
                  {isMember ? (
                    <button
                      type="button"
                      className={styles.orgRegisteredBtn}
                      onClick={() => handleUnregisterOrg(org.id)}
                    >
                      <span>Registered Member ✓</span>
                      <span style={{ fontSize: '0.85rem', opacity: 0.85 }}>
                        (Click to Leave)
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.orgRegisterBtn}
                      onClick={() => handleRegisterOrg(org)}
                    >
                      <span>Register to Organisation</span>
                      <span>➔</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className={styles.emptySearch}>
            <span>No organisations match your search for "{searchQuery}".</span>
          </div>
        )}
      </div>
    </div>
  );
}
