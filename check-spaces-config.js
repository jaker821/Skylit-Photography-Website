#!/usr/bin/env node

/**
 * DigitalOcean Spaces Configuration Checker
 * 
 * This script checks if your Spaces environment variables are properly configured.
 * 
 * Usage:
 *   node check-spaces-config.js
 */

require('dotenv').config();

console.log('\n🔍 DigitalOcean Spaces Configuration Check\n');
console.log('='.repeat(60));

// Check if all required variables are set
const requiredVars = [
  'SPACES_ENDPOINT',
  'SPACES_REGION', 
  'SPACES_BUCKET',
  'SPACES_ACCESS_KEY',
  'SPACES_SECRET_KEY',
  'SPACES_CDN_URL'
];

let allSet = true;
let errors = [];

console.log('\n📋 Environment Variables:\n');

requiredVars.forEach(varName => {
  const value = process.env[varName];
  const isSet = !!value;
  const icon = isSet ? '✅' : '❌';
  
  console.log(`${icon} ${varName.padEnd(20)} : ${isSet ? 'SET' : 'NOT SET'}`);
  
  if (!isSet) {
    allSet = false;
    errors.push(`${varName} is not set`);
  }
});

console.log('\n' + '='.repeat(60));

// If all variables are set, validate their format
if (allSet) {
  console.log('\n✅ All required variables are set!\n');
  
  console.log('📦 Configuration Details:\n');
  console.log(`   Endpoint: ${process.env.SPACES_ENDPOINT}`);
  console.log(`   Region:   ${process.env.SPACES_REGION}`);
  console.log(`   Bucket:   ${process.env.SPACES_BUCKET}`);
  console.log(`   CDN URL:  ${process.env.SPACES_CDN_URL}`);
  console.log(`   Access Key: ${process.env.SPACES_ACCESS_KEY.substring(0, 10)}...`);
  console.log(`   Secret Key: ${process.env.SPACES_SECRET_KEY.substring(0, 10)}...`);
  
  // Validate format
  console.log('\n🔍 Validation Checks:\n');
  
  // Check endpoint format
  const endpointRegex = /^[a-z0-9]+\.digitaloceanspaces\.com$/;
  if (endpointRegex.test(process.env.SPACES_ENDPOINT)) {
    console.log('✅ Endpoint format is correct');
  } else {
    console.log('⚠️  Endpoint format looks wrong');
    console.log('   Expected: <region>.digitaloceanspaces.com');
    console.log(`   Got: ${process.env.SPACES_ENDPOINT}`);
    errors.push('Endpoint format incorrect');
  }
  
  // Check if region matches endpoint
  const regionFromEndpoint = process.env.SPACES_ENDPOINT.split('.')[0];
  if (regionFromEndpoint === process.env.SPACES_REGION) {
    console.log('✅ Region matches endpoint');
  } else {
    console.log('⚠️  Region does not match endpoint');
    console.log(`   Endpoint region: ${regionFromEndpoint}`);
    console.log(`   SPACES_REGION: ${process.env.SPACES_REGION}`);
    console.log('   These should match!');
    errors.push('Region mismatch');
  }
  
  // Check CDN URL format
  const cdnRegex = /^https:\/\/[a-zA-Z0-9-]+\.[a-z0-9]+\.cdn\.digitaloceanspaces\.com$/;
  if (cdnRegex.test(process.env.SPACES_CDN_URL)) {
    console.log('✅ CDN URL format is correct');
  } else {
    console.log('⚠️  CDN URL format looks wrong');
    console.log('   Expected: https://<bucket>.<region>.cdn.digitaloceanspaces.com');
    console.log(`   Got: ${process.env.SPACES_CDN_URL}`);
    errors.push('CDN URL format incorrect');
  }
  
  // Check if bucket name in CDN URL matches SPACES_BUCKET
  const bucketFromCDN = process.env.SPACES_CDN_URL.split('/')[2].split('.')[0];
  if (bucketFromCDN === process.env.SPACES_BUCKET) {
    console.log('✅ Bucket name matches CDN URL');
  } else {
    console.log('⚠️  Bucket name does not match CDN URL');
    console.log(`   CDN bucket: ${bucketFromCDN}`);
    console.log(`   SPACES_BUCKET: ${process.env.SPACES_BUCKET}`);
    console.log('   These should match!');
    errors.push('Bucket name mismatch');
  }
  
  // Check Access Key format
  if (process.env.SPACES_ACCESS_KEY.startsWith('DO00')) {
    console.log('✅ Access Key format looks correct');
  } else {
    console.log('⚠️  Access Key format looks unusual');
    console.log('   Expected: Should start with DO00');
    console.log(`   Got: ${process.env.SPACES_ACCESS_KEY.substring(0, 4)}...`);
    errors.push('Access Key format may be incorrect');
  }
  
} else {
  console.log('\n❌ Missing required environment variables!\n');
}

// Test AWS SDK connection (optional)
console.log('\n' + '='.repeat(60));

if (allSet && errors.length === 0) {
  console.log('\n🚀 Configuration looks good! Testing connection...\n');
  
  try {
    const AWS = require('aws-sdk');
    
    const s3Client = new AWS.S3({
      endpoint: new AWS.Endpoint(process.env.SPACES_ENDPOINT),
      accessKeyId: process.env.SPACES_ACCESS_KEY,
      secretAccessKey: process.env.SPACES_SECRET_KEY,
      region: process.env.SPACES_REGION,
      s3ForcePathStyle: true,
      signatureVersion: 'v4'
    });
    
    // Try to list buckets (this will fail if credentials are wrong)
    s3Client.listBuckets((err, data) => {
      if (err) {
        console.log('❌ Connection test FAILED\n');
        console.log('Error:', err.code);
        console.log('Message:', err.message);
        console.log('\nPossible causes:');
        console.log('  - Access Key or Secret Key is incorrect');
        console.log('  - Keys have been revoked or expired');
        console.log('  - Network connectivity issue');
        console.log('\nSolution:');
        console.log('  1. Go to DigitalOcean → Spaces Object Storage → Access Keys');
        console.log('  2. Generate new Spaces keys');
        console.log('  3. Update your .env file');
        console.log('  4. Run this script again');
      } else {
        console.log('✅ Connection test SUCCESSFUL!\n');
        console.log(`Found ${data.Buckets.length} Space(s):`);
        data.Buckets.forEach(bucket => {
          const icon = bucket.Name === process.env.SPACES_BUCKET ? '👉' : '  ';
          console.log(`${icon} - ${bucket.Name}`);
        });
        
        if (data.Buckets.some(b => b.Name === process.env.SPACES_BUCKET)) {
          console.log('\n✅ Your configured bucket exists!');
          console.log('\n🎉 Everything looks perfect! You should be able to upload photos.');
        } else {
          console.log('\n⚠️  Your configured bucket was NOT found!');
          console.log(`   SPACES_BUCKET is set to: ${process.env.SPACES_BUCKET}`);
          console.log('   But this bucket does not exist in your account.');
          console.log('\nSolution:');
          console.log('  1. Check the bucket name spelling');
          console.log('  2. Or create a Space with this name');
        }
      }
      
      console.log('\n' + '='.repeat(60) + '\n');
    });
    
  } catch (testError) {
    console.log('⚠️  Could not test connection (aws-sdk not installed?)');
    console.log('   This is OK - just means the connection test was skipped.');
    console.log('   Your configuration still looks good based on the checks above.');
    console.log('\n' + '='.repeat(60) + '\n');
  }
  
} else {
  console.log('\n📝 Action Required:\n');
  
  if (!allSet) {
    console.log('1. Create a .env file in your project root');
    console.log('2. Copy the contents from env-template.txt');
    console.log('3. Fill in your actual DigitalOcean Spaces credentials');
    console.log('4. Run this script again: node check-spaces-config.js');
  }
  
  if (errors.length > 0) {
    console.log('\n⚠️  Configuration Errors Found:\n');
    errors.forEach((error, i) => {
      console.log(`   ${i + 1}. ${error}`);
    });
    console.log('\n   Please fix these issues and run the script again.');
  }
  
  console.log('\n📚 Helpful Resources:');
  console.log('   - YOUR-SPACES-SETUP-GUIDE.md');
  console.log('   - SPACES-TROUBLESHOOTING-CHECKLIST.md');
  console.log('   - env-template.txt');
  
  console.log('\n' + '='.repeat(60) + '\n');
}

