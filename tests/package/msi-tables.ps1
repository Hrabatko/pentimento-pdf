# Prints selected tables of the MSI installer as JSON (for tests/package/msi.spec.ts).
# Reads through Windows Installer (WindowsInstaller.Installer); installs nothing.
param([Parameter(Mandatory = $true)][string]$Msi)
$ErrorActionPreference = 'Stop'

$installer = New-Object -ComObject WindowsInstaller.Installer
$database = $installer.GetType().InvokeMember('OpenDatabase', 'InvokeMethod', $null, $installer, @($Msi, 0))

function Invoke-Member($target, [string]$name, [string]$kind, $arguments) {
	return $target.GetType().InvokeMember($name, $kind, $null, $target, $arguments)
}

function Read-Table([string]$sql) {
	$view = Invoke-Member $database 'OpenView' 'InvokeMethod' @($sql)
	Invoke-Member $view 'Execute' 'InvokeMethod' $null | Out-Null
	$rows = @()
	while ($true) {
		$record = Invoke-Member $view 'Fetch' 'InvokeMethod' $null
		if ($null -eq $record) { break }
		$count = Invoke-Member $record 'FieldCount' 'GetProperty' $null
		$row = @()
		for ($i = 1; $i -le $count; $i++) {
			$row += Invoke-Member $record 'StringData' 'GetProperty' @($i)
		}
		$rows += , $row
	}
	return , $rows
}

function Test-Table([string]$name) {
	$rows = Read-Table "SELECT ``Name`` FROM ``_Tables`` WHERE ``Name`` = '$name'"
	return $rows.Count -gt 0
}

$result = [ordered]@{
	registry  = Read-Table 'SELECT `Root`, `Key`, `Name`, `Value` FROM `Registry`'
	shortcuts = Read-Table 'SELECT `Shortcut`, `Name`, `Icon_` FROM `Shortcut`'
	icons     = Read-Table 'SELECT `Name` FROM `Icon`'
	property  = Read-Table 'SELECT `Property`, `Value` FROM `Property`'
	extension = Test-Table 'Extension'
}
$result | ConvertTo-Json -Depth 6 -Compress
