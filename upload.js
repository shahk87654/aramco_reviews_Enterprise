const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Initialize S3
const s3 = new AWS.S3({
  region: 'us-east-1'
});

const bucketName = 'aramco-reviews-frontend';
const buildDir = path.join(__dirname, 'frontend', '.next');

// Recursive function to upload files
async function uploadDirectory(dir, prefix = '') {
  const files = fs.readdirSync(dir);
  let uploadCount = 0;

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      uploadCount += await uploadDirectory(filePath, prefix ? `${prefix}/${file}` : file);
    } else {
      const key = prefix ? `${prefix}/${file}` : file;
      const fileContent = fs.readFileSync(filePath);
      
      try {
        await s3.putObject({
          Bucket: bucketName,
          Key: key,
          Body: fileContent,
          ContentType: getContentType(file)
        }).promise();
        
        uploadCount++;
        if (uploadCount % 20 === 0) {
          console.log(`Uploaded ${uploadCount} files...`);
        }
      } catch (err) {
        console.error(`Error uploading ${key}:`, err.message);
      }
    }
  }
  
  return uploadCount;
}

function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// Main execution
uploadDirectory(buildDir)
  .then(count => {
    console.log(`\n✅ Upload complete! Uploaded ${count} files to S3`);
    console.log(`Access your frontend at: http://${bucketName}.s3-website-us-east-1.amazonaws.com`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Upload failed:', err);
    process.exit(1);
  });
