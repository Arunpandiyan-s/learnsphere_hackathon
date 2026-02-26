# Endpoint Mapping Report

## Endpoint 1
* URL: `/api/qubrid/chat/completions` (Proxied to `https://platform.qubrid.com/api/v1/qubridai/chat/completions`)
* Method: POST
* File: `src/api/ai.ts`
* Line: 128
* Function: `askAI`
* Request Type: `fetch` (via internal `fetchWithTimeout` wrapper)
* Purpose: Sends user chat messages to the Qubrid AI platform (Llama 3.3 70B Instruct) to receive learning assistance and responses.

---

# Firebase Usage Mapping

## Firebase Auth 1: Sign In
* Method: `signInWithEmailAndPassword`
* File: `src/contexts/AuthContext.tsx`
* Line: 109
* Function: `login`
* Purpose: Authenticates an existing user utilizing their email and password.

## Firebase Auth 2: Registration
* Method: `createUserWithEmailAndPassword`
* File: `src/contexts/AuthContext.tsx`
* Line: 119
* Function: `register`
* Purpose: Registers a new user account with an email and password in Firebase Authentication.

## Firebase Auth 3: Update Profile
* Method: `updateProfile`
* File: `src/contexts/AuthContext.tsx`
* Line: 122
* Function: `register`
* Purpose: Updates the newly registered user's profile with a display name and a default avatar photo URL.

## Firebase Auth 4: Sign Out
* Method: `signOut`
* File: `src/contexts/AuthContext.tsx`
* Line: 146
* Function: `logout`
* Purpose: Logs out the currently authenticated user and clears the session.

## Firebase Auth 5: Auth State Listener
* Method: `onAuthStateChanged`
* File: `src/contexts/AuthContext.tsx`
* Line: 80
* Function: `useEffect` inside `AuthProvider`
* Purpose: Subscribes to authentication state changes across the application to manage the user session and local state globally.

## Firebase Realtime Database 1: Save Profile
* Method: `set`
* Path: `users/{sanitizedEmail}/profile`
* File: `src/api/profileService.ts`
* Line: 51
* Function: `saveProfile`
* Purpose: Saves or overwrites user profile settings and biography directly into the Firebase Realtime Database.

## Firebase Realtime Database 2: Get Profile
* Method: `get`
* Path: `users/{sanitizedEmail}/profile`
* File: `src/api/profileService.ts`
* Line: 62
* Function: `getProfile`
* Purpose: Retrieves a user's persistent profile data from the Firebase Realtime Database during app load.

---
**Total Endpoints / API Interactions Found:** 8 (1 standard HTTP API Endpoint, 7 Firebase SDK Integrations)
