
const mongoose = require('mongoose');
const User = require('./src/models/User');

let passed = 0;
let failed = 0;

function check(label, condition) {
  if (condition) {
    console.log(`✅ ${label}`);
    passed++;
  } else {
    console.log(`❌ ${label}`);
    failed++;
  }
}

async function run() {
  // 1. Schema field checks
  const paths = User.schema.paths;
  check('username field exists and is required', paths.username && paths.username.isRequired);
  check('password field exists and is required', paths.password && paths.password.isRequired);
  check('role field defaults to "user"', paths.role.defaultValue === 'user');
  check('role field only allows admin/user', JSON.stringify(paths.role.enumValues) === JSON.stringify(['admin', 'user']));

  // 2. Validation checks
  const missingUsername = new User({ password: 'x' });
  const err1 = await missingUsername.validate().then(() => null).catch(e => e);
  check('validation fails when username is missing', !!err1 && !!err1.errors.username);

  const missingPassword = new User({ username: 'x' });
  const err2 = await missingPassword.validate().then(() => null).catch(e => e);
  check('validation fails when password is missing', !!err2 && !!err2.errors.password);

  const validUser = new User({ username: 'testadmin', password: 'PlainPass123!', role: 'admin' });
  const err3 = await validUser.validate().then(() => null).catch(e => e);
  check('validation passes with valid data', !err3);

  const saveHooks = User.schema.s.hooks._pres.get('save');
  const hashHook = saveHooks.find(h => !h.fn[Symbol.for('mongoose:built-in-middleware')]);
  check('custom pre-save hashing hook is registered', !!hashHook);

  const plainPassword = 'PlainPass123!';
  const fakeDoc = {
    password: plainPassword,
    isModified: () => true,
  };
  await hashHook.fn.call(fakeDoc);
  check('password gets hashed by the hook (no longer plaintext)', fakeDoc.password !== plainPassword);
  check('hashed password looks like a bcrypt hash', /^\$2[aby]\$\d{2}\$/.test(fakeDoc.password));


  const docWithHash = { password: fakeDoc.password };
  const isMatch = await User.schema.methods.comparePassword.call(docWithHash, plainPassword);
  const isWrongMatch = await User.schema.methods.comparePassword.call(docWithHash, 'WrongPassword');
  check('comparePassword returns true for the correct password', isMatch === true);
  check('comparePassword returns false for a wrong password', isWrongMatch === false);

  // 5. Hook skips re-hashing when password isn't modified
  const unchangedDoc = { password: 'already-hashed-value', isModified: () => false };
  await hashHook.fn.call(unchangedDoc);
  check('hook skips hashing when password is unchanged', unchangedDoc.password === 'already-hashed-value');

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run();