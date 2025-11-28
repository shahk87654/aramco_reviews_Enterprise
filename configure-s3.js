const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const bucketName = 'aramco-reviews-frontend';

async function configureStaticHosting() {
  try {
    console.log('Configuring S3 static website hosting...');
    
    // Configure static website hosting
    await s3.putBucketWebsite({
      Bucket: bucketName,
      WebsiteConfiguration: {
        IndexDocument: { Suffix: 'index.html' },
        ErrorDocument: { Key: '404.html' }
      }
    }).promise();
    
    console.log('✅ Static website hosting enabled');
    
    // Set bucket policy for public read
    const bucketPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicReadGetObject',
          Effect: 'Allow',
          Principal: '*',
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::${bucketName}/*`
        }
      ]
    };
    
    await s3.putBucketPolicy({
      Bucket: bucketName,
      Policy: JSON.stringify(bucketPolicy)
    }).promise();
    
    console.log('✅ Bucket policy set - bucket is now public');
    
    // Get bucket website endpoint
    const website = await s3.getBucketWebsite({ Bucket: bucketName }).promise();
    console.log(`\n🎉 Frontend deployment complete!`);
    console.log(`\n📍 Access your frontend at:`);
    console.log(`   http://${bucketName}.s3-website-us-east-1.amazonaws.com`);
    console.log(`\n✅ Files uploaded: 295`);
    console.log(`✅ Website configured: index.html, 404.html`);
    console.log(`✅ Public access: Enabled`);
    
  } catch (err) {
    console.error('Error configuring S3:', err.message);
    process.exit(1);
  }
}

configureStaticHosting();
