$certDir = Join-Path $PSScriptRoot '..\.cert'
$pfxPath = Join-Path $certDir 'backend-local.pfx'
$password = ConvertTo-SecureString 'localquest-dev' -AsPlainText -Force
$extraHosts = @()

if ($env:LOCALQUEST_DEV_CERT_HOSTS) {
  $extraHosts = $env:LOCALQUEST_DEV_CERT_HOSTS.Split(',') |
    ForEach-Object { $_.Trim() } |
    Where-Object { $_ }
}

$dnsNames = @('localhost') + $extraHosts

New-Item -ItemType Directory -Force -Path $certDir | Out-Null

$cert = New-SelfSignedCertificate `
  -Subject 'CN=localhost' `
  -DnsName $dnsNames `
  -CertStoreLocation 'Cert:\CurrentUser\My' `
  -FriendlyName 'LocalQuest Backend Dev'

Export-PfxCertificate `
  -Cert $cert `
  -FilePath $pfxPath `
  -Password $password | Out-Null

Write-Output "Generated dev certificate: $pfxPath"
Write-Output "DNS names: $($dnsNames -join ', ')"
