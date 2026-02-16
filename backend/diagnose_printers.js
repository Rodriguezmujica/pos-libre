const { exec } = require('child_process');

const cmd = 'powershell -Command "Get-Printer | Select-Object Name,PortName,PrinterStatus,JobCount,DriverName | ConvertTo-Json"';

exec(cmd, (error, stdout, stderr) => {
    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log('STDOUT:', stdout);
    if (stderr) console.error('STDERR:', stderr);
});
