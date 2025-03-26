import { AMTManager } from "./src/lib/utils/amtManager.js";
async function main() {
    try {
        // Initialize AMT manager with extended configuration
        const amtManager = new AMTManager({
            host: 's8', // Use the hostname directly
            username: 'admin',
            password: 'your_password',
            timeout: 10000, // 10 second timeout
            retries: 3, // Retry failed connections 3 times
            verifySSL: false, // Disable SSL verification for development
            protocol: 'http', // Use HTTP instead of HTTPS
            forceIPv4: true, // Force IPv4 connections
            port: 16992 // Use the correct port
        });
        // Test connection first
        console.log('Testing connection to AMT device...');
        const isConnected = await amtManager.testConnection();
        if (!isConnected) {
            throw new Error('Failed to establish connection to AMT device');
        }
        console.log('Successfully connected to AMT device');
        // Get current power state
        console.log('Getting current power state...');
        const powerState = await amtManager.getPowerState();
        console.log('Current power state:', powerState);
        // Power off the device
        console.log('Powering off device...');
        await amtManager.powerOff();
        console.log('Device powered off successfully');
        // Wait 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000));
        // Power on the device
        console.log('Powering on device...');
        await amtManager.powerOn();
        console.log('Device powered on successfully');
        // Wait 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000));
        // Reset the device
        console.log('Resetting device...');
        await amtManager.reset();
        console.log('Device reset successfully');
    }
    catch (error) {
        console.error('Error occurred:', error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
}
// Run the main function
main();
