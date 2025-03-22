"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
async function POST(request) {
    var _a, _b;
    try {
        const accessToken = (_a = request.cookies.get('access_token')) === null || _a === void 0 ? void 0 : _a.value;
        const accessTokenSecret = (_b = request.cookies.get('access_token_secret')) === null || _b === void 0 ? void 0 : _b.value;
        if (!accessToken || !accessTokenSecret) {
            return server_1.NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }
        // Parse the request body
        const data = await request.json();
        // Validate required fields
        const requiredFields = ['stationId', 'startDate', 'startTime', 'duration', 'operatingSystem', 'id'];
        const missingFields = requiredFields.filter(field => !data[field]);
        if (missingFields.length > 0) {
            return server_1.NextResponse.json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            }, { status: 400 });
        }
        // Log the data to the server console
        console.log('Schedule form submission received:');
        console.log('Station ID:', data.stationId);
        console.log('Start Date:', data.startDate);
        console.log('Start Time:', data.startTime);
        console.log('Duration:', data.duration);
        console.log('Operating System:', data.operatingSystem);
        console.log('User ID:', data.id);
        console.log('-----------------------------------');
        // TODO: Add your scheduling logic here
        // For example, saving to a database, checking for conflicts, etc.
        // Return a success response
        return server_1.NextResponse.json({
            success: true,
            message: 'Schedule submitted successfully'
        });
    }
    catch (error) {
        console.error('Error processing schedule submission:', error);
        // Return an error response
        return server_1.NextResponse.json({ success: false, message: 'Failed to process schedule submission' }, { status: 500 });
    }
}
