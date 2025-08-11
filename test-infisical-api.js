const { InfisicalSDK } = require('@infisical/sdk');

async function testInfisicalAPI() {
  console.log('Testing Infisical SDK v4 API...');
  
  // Try to create an instance with your token
  const token = process.env.INFISICAL_TOKEN || 'st.6f7ae28a-1099-44fe-8aa1-50251b375779.2055eef73865548d90cb6b01bcd136bd.1f5f13f23c9893f76156b2cdb4da9294';
  
  try {
    console.log('\nTesting SDK initialization...');
    
    // Try the working pattern from our previous test
    const sdk = new InfisicalSDK({
      siteUrl: 'https://eu.infisical.com'
    });
    
    console.log('✓ SDK initialized');
    console.log('Available methods:', Object.getOwnPropertyNames(sdk));
    
    // Test secrets client
    const secretsClient = sdk.secrets();
    console.log('\nSecrets client methods:', Object.getOwnPropertyNames(secretsClient));
    console.log('Secrets client prototype:', Object.getOwnPropertyNames(Object.getPrototypeOf(secretsClient)));
    
    // Check if we need to authenticate first
    console.log('\nTesting authentication...');
    sdk.authenticate(token);
    console.log('✓ Authenticated with service token');
    
    // Try to list secrets
    console.log('\nTesting secrets listing...');
    const secretsResponse = await secretsClient.listSecrets({
      environment: 'Development',
      projectId: 'd758ed7c-5411-42a0-aebb-4f301c7a4199',
      secretPath: '/backend',
    });
    
    console.log('✓ Secrets fetched successfully:');
    console.log('Response type:', typeof secretsResponse);
    console.log('Response keys:', Object.keys(secretsResponse || {}));
    console.log('Full response:', JSON.stringify(secretsResponse, null, 2));
    
  } catch (error) {
    console.log('✗ Error:', error.message);
    console.log('Stack:', error.stack);
  }
}

testInfisicalAPI();
