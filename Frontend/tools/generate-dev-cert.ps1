$certDir = Join-Path $PSScriptRoot '..\.cert'
$pfxPath = Join-Path $certDir 'backend-local.pfx'
$password = ConvertTo-SecureString 'localquest-dev' -AsPlainText -Force

New-Item -ItemType Directory -Force -Path $certDir | Out-Null

$cert = New-SelfSignedCertificate `
  -Subject 'CN=localhost' `
  -DnsName 'localhost', '192.168.0.111' `
  -CertStoreLocation 'Cert:\CurrentUser\My' `
  -FriendlyName 'LocalQuest Backend Dev'

Export-PfxCertificate `
  -Cert $cert `
  -FilePath $pfxPath `
  -Password $password | Out-Null

Write-Output "Generated dev certificate: $pfxPath"
