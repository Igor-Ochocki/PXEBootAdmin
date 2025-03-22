"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = UserPhoto;
const react_1 = require("react");
const image_1 = __importDefault(require("next/image"));
const navigation_1 = require("next/navigation");
const handleAuthError_1 = require("@/utils/handleAuthError");
function UserPhoto() {
    const [photoUrl, setPhotoUrl] = (0, react_1.useState)(null);
    const router = (0, navigation_1.useRouter)();
    (0, react_1.useEffect)(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch('/api/user', {
                    // Add cache: 'no-store' to prevent caching
                    cache: 'no-store'
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    console.log(errorData);
                    if (errorData.error.includes('401')) {
                        await (0, handleAuthError_1.handleAuthError)();
                        router.push('/auth/login');
                        return;
                    }
                    throw new Error(errorData.error || 'Failed to fetch user data');
                }
                const data = await response.json();
                console.log('User data received:', data);
                if (data.photo_urls) {
                    const firstKey = Object.keys(data.photo_urls)[0];
                    setPhotoUrl(data.photo_urls[firstKey]);
                }
            }
            catch (error) {
                console.error('Error fetching user photo:', error);
                // If there's an error that wasn't handled above, redirect to login
                router.push('/auth/login');
            }
        };
        fetchUserData();
    }, [router]);
    return (<div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-quaternary">
      {photoUrl ? (<image_1.default src={photoUrl} alt="User photo" fill className="object-cover"/>) : (<div className="w-full h-full bg-quaternary/20 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-quaternary/40 animate-pulse"/>
        </div>)}
    </div>);
}
