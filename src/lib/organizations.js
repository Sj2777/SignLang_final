// HandSpeak Partner Organizations & Membership Directory
// Offline-first: all data stored in IndexedDB, with localStorage fallback.

const DEFAULT_ORGANIZATIONS = [
  {
    id: 'org_islrtc',
    name: 'Indian Sign Language Research and Training Centre (ISLRTC)',
    category: 'Apex Government Body & National Research',
    contact_num: '+91 11 2638 7558',
    email: 'islrtcnewdelhi@gmail.com',
    address: 'Module 403-405, 4th Floor, NSIC Business Park, Okhla Estate, New Delhi 110020',
    description: 'National nodal agency for Indian Sign Language development, interpreter certification, and standardized sign curricula.',
    verified: true,
    isDefault: true,
    website: 'https://islrtc.nic.in',
  },
  {
    id: 'org_nad',
    name: 'National Association of the Deaf (NAD) India',
    category: 'Deaf Rights & Community Advocacy',
    contact_num: '+91 98108 55410',
    email: 'nadindia@gmail.com',
    address: '12/A, Institutional Area, Vasant Kunj, New Delhi 110070',
    description: 'Premier national civil rights organization advocating for equal access, education, and social justice for the deaf community.',
    verified: true,
    isDefault: true,
  },
  {
    id: 'org_aifd',
    name: 'All India Federation of the Deaf (AIFD)',
    category: 'Vocational Training & Welfare',
    contact_num: '+91 11 2331 4627',
    email: 'aifd.india@gmail.com',
    address: '18, Suraj Parkash Marg, Near ITO, New Delhi 110002',
    description: 'Pioneering organization providing skill development, sign education, and rehabilitation across multiple state chapters.',
    verified: true,
    isDefault: true,
  },
  {
    id: 'org_pad',
    name: 'Pune Association of the Deaf (PAD)',
    category: 'Regional Community Chapter',
    contact_num: '+91 94220 12345',
    email: 'contact@punedeaf.org',
    address: 'Shivajinagar, Near Modern College, Pune, Maharashtra 411005',
    description: 'Active community chapter hosting weekly practice circles, peer mentorship, and youth leadership workshops.',
    verified: true,
    isDefault: true,
  },
];

/**
 * Returns all APPROVED organizations (default verified + approved registered orgs).
 * Pending orgs are NOT shown to learners.
 */
export function getRegisteredOrganizations() {
  const dynamicOrgs = [];

  try {
    const raw = localStorage.getItem('handspeak_accounts');
    if (raw) {
      const accounts = JSON.parse(raw);
      for (const [email, acc] of Object.entries(accounts)) {
        if (acc?.user_metadata?.account_type === 'organization') {
          const orgId = acc.id || 'org_' + email.replace(/[^a-zA-Z0-9]/g, '_');
          const status = acc.user_metadata?.org_status || 'pending';

          // Only show approved orgs in the learner directory
          if (status !== 'approved') continue;

          dynamicOrgs.push({
            id: orgId,
            name: acc.user_metadata?.name || acc.name || email.split('@')[0],
            category: 'Registered Community Partner',
            contact_num: acc.user_metadata?.contact_num || 'Contact on email',
            email: acc.email || email,
            address: acc.user_metadata?.address || 'India',
            description: 'Registered organization mentor on HandSpeak.',
            verified: true,
            isDefault: false,
          });
        }
      }
    }
  } catch (e) {
    console.warn('Could not load dynamic organizations:', e);
  }

  const existingNames = new Set(dynamicOrgs.map((o) => o.name.toLowerCase()));
  const filteredDefaults = DEFAULT_ORGANIZATIONS.filter(
    (d) => !existingNames.has(d.name.toLowerCase())
  );

  return [...filteredDefaults, ...dynamicOrgs];
}

/**
 * Returns ALL registered org accounts regardless of status.
 * Used by org admin panels and admin review.
 */
export function getAllOrgAccounts() {
  const orgs = [];
  try {
    const accounts = JSON.parse(localStorage.getItem('handspeak_accounts') || '{}');
    for (const [email, acc] of Object.entries(accounts)) {
      if (acc?.user_metadata?.account_type === 'organization') {
        const orgId = acc.id || 'org_' + email.replace(/[^a-zA-Z0-9]/g, '_');
        orgs.push({
          id: orgId,
          name: acc.user_metadata?.name || email.split('@')[0],
          email: acc.email || email,
          contact_num: acc.user_metadata?.contact_num || '',
          address: acc.user_metadata?.address || '',
          status: acc.user_metadata?.org_status || 'pending',
        });
      }
    }
  } catch {}
  return orgs;
}

/**
 * Approve a registered organization (admin/super-admin action).
 */
export function approveOrganization(orgEmail) {
  try {
    const accounts = JSON.parse(localStorage.getItem('handspeak_accounts') || '{}');
    const normalizedEmail = orgEmail.trim().toLowerCase();
    if (accounts[normalizedEmail]) {
      accounts[normalizedEmail].user_metadata = {
        ...(accounts[normalizedEmail].user_metadata || {}),
        org_status: 'approved',
      };
      localStorage.setItem('handspeak_accounts', JSON.stringify(accounts));
      window.dispatchEvent(new CustomEvent('handspeak_org_updated'));
      return true;
    }
  } catch {}
  return false;
}

/**
 * Reject a registered organization.
 */
export function rejectOrganization(orgEmail) {
  try {
    const accounts = JSON.parse(localStorage.getItem('handspeak_accounts') || '{}');
    const normalizedEmail = orgEmail.trim().toLowerCase();
    if (accounts[normalizedEmail]) {
      accounts[normalizedEmail].user_metadata = {
        ...(accounts[normalizedEmail].user_metadata || {}),
        org_status: 'rejected',
      };
      localStorage.setItem('handspeak_accounts', JSON.stringify(accounts));
      window.dispatchEvent(new CustomEvent('handspeak_org_updated'));
      return true;
    }
  } catch {}
  return false;
}

/**
 * Get current learner's registered organization membership.
 * Returns { orgId, orgName, status: 'pending'|'approved' } or null.
 */
export function getLearnerMembership(userId) {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(`handspeak_learner_org_${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Register a learner with an organization (creates a pending request).
 * The org must approve the request from their dashboard.
 */
export function registerLearnerToOrg(userId, org, userProfile = {}) {
  if (!userId || !org?.id) throw new Error('User ID and Organization are required.');

  const membership = {
    orgId: org.id,
    orgName: org.name,
    orgEmail: org.email,
    orgContact: org.contact_num,
    registeredAt: new Date().toISOString(),
    status: org.isDefault ? 'approved' : 'pending', // Default orgs auto-approve
  };

  try {
    // 1. Save to learner's personal profile
    localStorage.setItem(`handspeak_learner_org_${userId}`, JSON.stringify(membership));

    // 2. Add learner to organization's member roster with status
    const rosterKey = `handspeak_org_members_${org.id}`;
    const existing = JSON.parse(localStorage.getItem(rosterKey) || '[]');
    const filtered = existing.filter((m) => m.userId !== userId);
    filtered.push({
      userId,
      name: userProfile?.name || 'HandSpeak Learner',
      email: userProfile?.email || '',
      registeredAt: membership.registeredAt,
      status: membership.status,
    });
    localStorage.setItem(rosterKey, JSON.stringify(filtered));

    return membership;
  } catch (err) {
    console.error('Failed to register learner with organization:', err);
    throw err;
  }
}

/**
 * Get all membership requests for an organization (for org admin dashboard).
 */
export function getOrgMemberRequests(orgId) {
  if (!orgId) return [];
  try {
    const rosterKey = `handspeak_org_members_${orgId}`;
    return JSON.parse(localStorage.getItem(rosterKey) || '[]');
  } catch {
    return [];
  }
}

/**
 * Approve a learner membership request.
 */
export function approveMemberRequest(orgId, learnerId) {
  try {
    const rosterKey = `handspeak_org_members_${orgId}`;
    const members = JSON.parse(localStorage.getItem(rosterKey) || '[]');
    const updated = members.map((m) =>
      m.userId === learnerId ? { ...m, status: 'approved', approvedAt: new Date().toISOString() } : m
    );
    localStorage.setItem(rosterKey, JSON.stringify(updated));

    // Update learner's membership status too
    const membershipKey = `handspeak_learner_org_${learnerId}`;
    const membership = JSON.parse(localStorage.getItem(membershipKey) || 'null');
    if (membership && membership.orgId === orgId) {
      localStorage.setItem(membershipKey, JSON.stringify({ ...membership, status: 'approved' }));
    }
    window.dispatchEvent(new CustomEvent('handspeak_org_updated'));
    return true;
  } catch {
    return false;
  }
}

/**
 * Reject a learner membership request.
 */
export function rejectMemberRequest(orgId, learnerId) {
  try {
    const rosterKey = `handspeak_org_members_${orgId}`;
    const members = JSON.parse(localStorage.getItem(rosterKey) || '[]');
    const updated = members.map((m) =>
      m.userId === learnerId ? { ...m, status: 'rejected', rejectedAt: new Date().toISOString() } : m
    );
    localStorage.setItem(rosterKey, JSON.stringify(updated));

    // Remove from learner's active membership if rejected
    const membershipKey = `handspeak_learner_org_${learnerId}`;
    const membership = JSON.parse(localStorage.getItem(membershipKey) || 'null');
    if (membership && membership.orgId === orgId) {
      localStorage.removeItem(membershipKey);
    }
    window.dispatchEvent(new CustomEvent('handspeak_org_updated'));
    return true;
  } catch {
    return false;
  }
}

/**
 * Unregister a learner from an organization.
 */
export function unregisterLearnerFromOrg(userId, orgId) {
  if (!userId) return;
  try {
    localStorage.removeItem(`handspeak_learner_org_${userId}`);
    if (orgId) {
      const rosterKey = `handspeak_org_members_${orgId}`;
      const existing = JSON.parse(localStorage.getItem(rosterKey) || '[]');
      localStorage.setItem(rosterKey, JSON.stringify(existing.filter((m) => m.userId !== userId)));
    }
  } catch (err) {
    console.warn('Failed to unregister learner:', err);
  }
}

/**
 * Get count of APPROVED members in an organization.
 */
export function getOrgMemberCount(orgId) {
  if (!orgId) return 0;
  try {
    const members = JSON.parse(localStorage.getItem(`handspeak_org_members_${orgId}`) || '[]');
    return members.filter((m) => m.status === 'approved').length;
  } catch {
    return 0;
  }
}
