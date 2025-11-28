const AWS = require('aws-sdk');
const fs = require('fs');

const s3 = new AWS.S3({
  region: 'us-east-1'
});

const bucketName = 'aramco-reviews-frontend';

async function uploadFiles() {
  try {
    console.log('Uploading index.html and 404.html...');
    
    // Upload index.html
    const indexHtml = fs.readFileSync('./index.html', 'utf8');
    await s3.putObject({
      Bucket: bucketName,
      Key: 'index.html',
      Body: indexHtml,
      ContentType: 'text/html',
      CacheControl: 'max-age=3600'
    }).promise();
    
    console.log('✅ Uploaded index.html');
    
    // Upload 404.html
    const notFoundHtml = fs.readFileSync('./404.html', 'utf8');
    await s3.putObject({
      Bucket: bucketName,
      Key: '404.html',
      Body: notFoundHtml,
      ContentType: 'text/html',
      CacheControl: 'max-age=3600'
    }).promise();
    
    console.log('✅ Uploaded 404.html');
    
    console.log('\n🎉 Frontend is now live!');
    console.log('\n📍 Access at: http://aramco-reviews-frontend.s3-website-us-east-1.amazonaws.com');
    console.log('\n✅ Status:\n  - Frontend: Ready\n  - Backend API: http://ec2-3-226-97-116.compute-1.amazonaws.com:3000\n  - Database: Connected');
    
  } catch (err) {
    console.error('Error uploading files:', err.message);
    process.exit(1);
  }
}

uploadFiles();
