$env:PYTHONPATH = "$PSScriptRoot\vendor;$PSScriptRoot"
$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
    $python = Get-Command py -ErrorAction SilentlyContinue
}

if (-not $python) {
    Write-Error "Python is not available on PATH. Install Python 3.11+ or activate your virtual environment."
    exit 1
}

& $python.Source "$PSScriptRoot\run.py"
