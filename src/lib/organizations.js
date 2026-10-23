// HandSpeak Partner Organizations & Membership Directory

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
  },
];

/**
 * Returns all verified default organizations merged with any user accounts registered as organizations.
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
          dynamicOrgs.push({
            id: orgId,
            name: acc.user_metadata?.name || acc.name || email.split('@')[0],
            category: 'Registered Community Partner',
            contact_num: acc.user_metadata?.contact_num || acc.contact_num || 'Contact on email',
            email: acc.email || email,
            address: acc.user_metadata?.address || acc.address || 'India',
            description: 'Registered organization mentor on HandSpeak.',
            verified: true,
          });
        }
      }
    }
  } catch (e) {
    console.warn('Could not load dynamic organizations:', e);
  }

  // Deduplicate by name or email
  const existingNames = new Set(dynamicOrgs.map((o) => o.name.toLowerCase()));
  const filteredDefaults = DEFAULT_ORGANIZATIONS.filter(
    (d) => !existingNames.has(d.name.toLowerCase())
  );

  return [...dynamicOrgs, ...filteredDefaults];
}

/**
 * Get current learner's registered organization membership.
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
 * Register a learner with an organization.
 */
export function registerLearnerToOrg(userId, org, userProfile = {}) {
  if (!userId || !org?.id) throw new Error('User ID and Organization are required.');

  const membership = {
    orgId: org.id,
    orgName: org.name,
    orgEmail: org.email,
    orgContact: org.contact_num,
    registeredAt: new Date().toISOString(),
  };

  try {
    // 1. Save to learner's personal profile
    localStorage.setItem(`handspeak_learner_org_${userId}`, JSON.stringify(membership));

    // 2. Add learner to organization's member roster
    const rosterKey = `handspeak_org_members_${org.id}`;
    const existing = JSON.parse(localStorage.getItem(rosterKey) || '[]');
    const filtered = existing.filter((m) => m.userId !== userId);
    filtered.push({
      userId,
      name: userProfile?.name || 'HandSpeak Learner',
      email: userProfile?.email || '',
      registeredAt: membership.registeredAt,
    });
    localStorage.setItem(rosterKey, JSON.stringify(filtered));

    return membership;
  } catch (err) {
    console.error('Failed to register learner with organization:', err);
    throw err;
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
      const filtered = existing.filter((m) => m.userId !== userId);
      localStorage.setItem(rosterKey, JSON.stringify(filtered));
    }
  } catch (err) {
    console.warn('Failed to unregister learner:', err);
  }
}

/**
 * Get count of members in an organization.
 */
export function getOrgMemberCount(orgId) {
  if (!orgId) return 0;
  try {
    const rosterKey = `handspeak_org_members_${orgId}`;
    const members = JSON.parse(localStorage.getItem(rosterKey) || '[]');
    return members.length;
  } catch {
    return 0;
  }
}
