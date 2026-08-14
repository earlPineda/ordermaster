# Start the Avenue Café Ordering System (Express + Vite) on http://localhost:3000
# This script works around the '&' character in the folder path, which breaks
# `npm run dev` on Windows (cmd.exe interprets '&' as a command separator).

$ErrorActionPreference = 'Stop'

# Change into the directory this script resides in (handles the '&' path safely)
Set-Location -LiteralPath $PSScriptRoot

# Optional: free the port if it is already in use
$existing = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($existing) {
    $existing.OwningProcess | Sort-Object -Unique | ForEach-Object {
        Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Freed port 3000."
}

Write-Host "Starting Avenue Café Ordering System on http://localhost:3000 ..."
& node (Join-Path $PSScriptRoot "node_modules\tsx\dist\cli.mjs") (Join-Path $PSScriptRoot "server.ts")
