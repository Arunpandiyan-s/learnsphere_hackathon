/**
 * Profile Service - Backend REST API Integration
 * 
 * Saves and retrieves user profile data from the backend Postgres Database.
 */

// Use the environment variable for the base API URL, or fallback to the same host
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface UserProfile {
    displayName: string;
    username: string;
    email: string;
    phone: string;
    bio: string;
    location: string;
    interests: string;
    updatedAt: string;
}

/**
 * Save user profile data to the backend database.
 */
export async function saveProfile(email: string, profileData: Omit<UserProfile, 'email' | 'updatedAt'>): Promise<void> {
    const dataToSave = {
        ...profileData,
        email,
    };

    // Get the JWT token from local storage (or wherever it's stored)
    const token = localStorage.getItem('neon_auth_token') || '';

    const response = await fetch(`${API_BASE_URL}/api/v1/profile`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSave)
    });

    if (!response.ok) {
        throw new Error('Failed to save profile');
    }
}

/**
 * Get user profile data from the backend database.
 * Returns null if no profile exists yet or if there's an error.
 */
export async function getProfile(email: string): Promise<UserProfile | null> {
    try {
        const token = localStorage.getItem('neon_auth_token') || '';

        const response = await fetch(`${API_BASE_URL}/api/v1/profile?email=${encodeURIComponent(email)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            return await response.json() as UserProfile;
        }

        return null;
    } catch (error) {
        console.error('Failed to fetch profile:', error);
        return null;
    }
}
