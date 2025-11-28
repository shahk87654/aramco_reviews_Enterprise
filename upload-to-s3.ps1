# Upload frontend build to S3
$bucketName = "aramco-reviews-frontend"
$localPath = "frontend\.next"
$region = "us-east-1"

Write-Host "Uploading $localPath to s3://$bucketName/" -ForegroundColor Green

# Get all files recursively
$files = Get-ChildItem -Path $localPath -Recurse -File

$uploadCount = 0
foreach ($file in $files) {
    $relativePath = $file.FullName.Replace("$localPath\", "").Replace("\", "/")
    $s3Key = "/$relativePath"
    
    try {
        Write-S3Object -BucketName $bucketName -Key $s3Key -File $file.FullName -Region $region
        $uploadCount++
        if ($uploadCount % 10 -eq 0) {
            Write-Host "Uploaded $uploadCount files..." -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "Error uploading $relativePath : $_" -ForegroundColor Red
    }
}

Write-Host "✅ Upload complete! Uploaded $uploadCount files to S3" -ForegroundColor Green
Write-Host "Access your frontend at: http://$bucketName.s3-website-$region.amazonaws.com" -ForegroundColor Cyan
