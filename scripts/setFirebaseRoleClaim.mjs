import process from 'node:process';

const SUPPORTED_ROLES = [
  'admin',
  'manager',
  'project_manager',
  'site_manager',
  'supervisor',
  'contractor',
  'owner',
  'supplier',
  'worker',
  'general_worker',
  'skilled_worker',
  'foreman',
];

const ROLE_BUCKETS = {
  admin: 'admin',
  manager: 'user',
  project_manager: 'user',
  site_manager: 'user',
  supervisor: 'user',
  contractor: 'user',
  owner: 'owner',
  supplier: 'supplier',
  worker: 'worker',
  general_worker: 'worker',
  skilled_worker: 'worker',
  foreman: 'worker',
};

const REVIEWER_ROLES = new Set(['admin', 'manager', 'project_manager', 'site_manager', 'supervisor', 'contractor']);

async function main() {
  const [, , emailArg, roleArg] = process.argv;
  const email = String(emailArg || '').trim().toLowerCase();
  const role = String(roleArg || '').trim().toLowerCase();

  if (!email || !role) {
    console.error('Usage: node scripts/setFirebaseRoleClaim.mjs <email> <role>');
    process.exit(1);
  }

  if (!SUPPORTED_ROLES.includes(role)) {
    console.error(`Unsupported role: ${role}`);
    console.error(`Supported roles: ${SUPPORTED_ROLES.join(', ')}`);
    process.exit(1);
  }

  let initializeApp;
  let applicationDefault;
  let getAuth;
  try {
    ({ initializeApp, applicationDefault } = await import('firebase-admin/app'));
    ({ getAuth } = await import('firebase-admin/auth'));
  } catch (error) {
    console.error('Missing firebase-admin dependency. Run: npm install firebase-admin --save-dev');
    process.exit(1);
  }

  initializeApp({ credential: applicationDefault() });

  const auth = getAuth();
  const user = await auth.getUserByEmail(email);
  const roleBucket = ROLE_BUCKETS[role] || 'worker';
  const claims = {
    role,
    roleBucket,
    canReview: REVIEWER_ROLES.has(role),
    admin: role === 'admin',
    platformOwner: role === 'admin',
  };

  await auth.setCustomUserClaims(user.uid, claims);
  console.log(`Updated ${email} (${user.uid}) with claims: ${JSON.stringify(claims)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
