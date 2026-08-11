// Standalone check for the product validation rules — no live server or DB needed.
// Run with: node test-product-validation.js

const productValidationRules = require('./src/validators/productValidator');
const { validationResult } = require('express-validator');

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

async function runValidation(body) {
  const req = { body };
  for (const rule of productValidationRules) {
    await rule.run(req);
  }
  return validationResult(req);
}

async function main() {
  // Valid payload
  let result = await runValidation({ name: 'Laptop', category: 'Electronics', price: 999.99, quantity: 5 });
  check('valid product passes with no errors', result.isEmpty());

  // Missing name
  result = await runValidation({ price: 10, quantity: 1 });
  check('missing name fails', !result.isEmpty() && result.array().some(e => e.path === 'name'));

  // category omitted entirely (optional) should still pass
  result = await runValidation({ name: 'Mouse', price: 10, quantity: 1 });
  check('omitted category is allowed (optional)', result.isEmpty());

  // category wrong type
  result = await runValidation({ name: 'Mouse', category: 123, price: 10, quantity: 1 });
  check('non-string category fails', !result.isEmpty() && result.array().some(e => e.path === 'category'));

  // price negative
  result = await runValidation({ name: 'Mouse', price: -5, quantity: 1 });
  check('negative price fails', !result.isEmpty() && result.array().some(e => e.path === 'price'));

  // price zero (must be > 0)
  result = await runValidation({ name: 'Mouse', price: 0, quantity: 1 });
  check('zero price fails (must be positive)', !result.isEmpty() && result.array().some(e => e.path === 'price'));

  // quantity negative
  result = await runValidation({ name: 'Mouse', price: 10, quantity: -1 });
  check('negative quantity fails', !result.isEmpty() && result.array().some(e => e.path === 'quantity'));

  // quantity zero should be allowed (non-negative)
  result = await runValidation({ name: 'Mouse', price: 10, quantity: 0 });
  check('zero quantity is allowed (non-negative)', result.isEmpty());

  // quantity as decimal should fail (must be integer)
  result = await runValidation({ name: 'Mouse', price: 10, quantity: 1.5 });
  check('decimal quantity fails (must be integer)', !result.isEmpty() && result.array().some(e => e.path === 'quantity'));

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
