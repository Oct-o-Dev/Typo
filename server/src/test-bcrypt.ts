import bcrypt from 'bcryptjs';

const runTest = async () => {
  try {
    const myPassword = 'password123';
    console.log('--- Bcrypt Isolation Test ---');
    console.log('Plaintext password:', myPassword);

    // Step 1: Hash the password, just like in registration
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(myPassword, salt);
    console.log('Generated Hash:', hashedPassword);

    // Step 2: Compare the original password to the new hash
    const isMatch = await bcrypt.compare(myPassword, hashedPassword);
    console.log('---');
    console.log('Did the passwords match?', isMatch); // This MUST be true
    console.log('---');

    if (isMatch) {
      console.log('✅ TEST PASSED: The bcryptjs library is working correctly.');
    } else {
      console.log('❌ TEST FAILED: The bcryptjs library is broken or corrupted.');
    }
  } catch (error) {
    console.error('An error occurred during the test:', error);
  }
};

runTest();
