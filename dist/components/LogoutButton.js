"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LogoutButton;
const react_1 = require("react");
const react_2 = require("@heroui/react");
const navigation_1 = require("next/navigation");
function LogoutButton() {
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const router = (0, navigation_1.useRouter)();
    const handleLogout = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/auth/logout', {
                method: 'POST'
            });
            if (!response.ok) {
                throw new Error('Failed to logout');
            }
            // Redirect to login page
            router.push('/auth/login');
        }
        catch (error) {
            console.error('Logout error:', error);
            setIsLoading(false);
        }
    };
    return (<react_2.Button onPress={handleLogout} disabled={isLoading} className="text-quinary border border-quaternary rounded-full px-4 py-2
                transition-all duration-300 ease-in-out
                hover:bg-red-500 hover:text-white hover:border-red-500
                active:bg-red-700 active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed">
      {isLoading ? 'Logging out...' : 'Logout'}
    </react_2.Button>);
}
