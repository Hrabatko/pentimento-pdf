# Prints the manifest and the file list of the Store package (.appx) as JSON
# (for tests/package/store.spec.ts). Reads the package as a zip; installs nothing.
param([Parameter(Mandatory = $true)][string]$Package)
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($Package)
try {
	$entry = $zip.Entries | Where-Object { $_.FullName -eq 'AppxManifest.xml' }
	$reader = New-Object System.IO.StreamReader($entry.Open())
	$manifest = $reader.ReadToEnd()
	$reader.Close()
	$files = @($zip.Entries | ForEach-Object { [System.Uri]::UnescapeDataString($_.FullName) })
} finally {
	$zip.Dispose()
}
[ordered]@{ manifest = $manifest; files = $files } | ConvertTo-Json -Depth 3 -Compress
