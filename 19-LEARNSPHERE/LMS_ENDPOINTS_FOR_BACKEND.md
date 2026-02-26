# AUTH ENDPOINTS

## Login
* URL: UNKNOWN (Uses Firebase SDK `signInWithEmailAndPassword`)
* Method: UNKNOWN
* File: src/contexts/AuthContext.tsx
* Function: login
* Request Body: email, password, role
* Response: UNKNOWN 
* Notes: App updates role locally via `localStorage` directly after login. Session maintained securely by Firebase.

## Register
* URL: UNKNOWN (Uses Firebase SDK `createUserWithEmailAndPassword`)
* Method: UNKNOWN
* File: src/contexts/AuthContext.tsx
* Function: register
* Request Body: email, password, name, role
* Response: UNKNOWN
* Notes: Registers basic criteria via auth SDK then assigns an external avatar URL and predefined `totalPoints: 20` using `updateStoredUserData`. Profile is optionally configured via `updateProfile`.

## Logout
* URL: UNKNOWN (Uses Firebase SDK `signOut`)
* Method: UNKNOWN
* File: src/contexts/AuthContext.tsx
* Function: logout
* Request Body: None
* Response: UNKNOWN
* Notes: Removes authenticated session locally and via SDK.

## Read Profile
* URL: UNKNOWN (Firebase Realtime DB `get`)
* Method: UNKNOWN
* File: src/api/profileService.ts
* Function: getProfile
* Request Body: email
* Response: `UserProfile` object (displayName, username, email, phone, bio, location, interests, updatedAt)
* Notes: Pulls from `users/{sanitizedEmail}/profile`.

## Update Profile
* URL: UNKNOWN (Firebase Realtime DB `set`)
* Method: UNKNOWN
* File: src/api/profileService.ts
* Function: saveProfile
* Request Body: email, profileData
* Response: null (Promise resolution)
* Notes: Writes to `users/{sanitizedEmail}/profile`.

---

# COURSE MANAGEMENT ENDPOINTS

## Create course
* URL: UNKNOWN
* Method: UNKNOWN
* File: src/pages/backoffice/CourseEditorPage.tsx / src/data/mockData.ts
* Function: UNKNOWN
* Request Body: UNKNOWN
* Response: UNKNOWN
* Notes: No backend API implemented. Application depends entirely on `mockCourses` interface and static variables.

## Update course
* URL: UNKNOWN
* Method: UNKNOWN
* File: src/pages/backoffice/CourseEditorPage.tsx
* Function: UNKNOWN
* Request Body: UNKNOWN
* Response: UNKNOWN
* Notes: Managed via purely local state manipulation in the editor.

## Delete course
* URL: UNKNOWN
* Method: UNKNOWN
* File: src/pages/backoffice/BackofficeCoursesPage.tsx
* Function: UNKNOWN
* Request Body: UNKNOWN
* Response: UNKNOWN
* Notes: Missing endpoint integration.

## Fetch courses
* URL: UNKNOWN
* Method: UNKNOWN
* File: src/pages/CoursesPage.tsx / src/pages/MyCoursesPage.tsx
* Function: UNKNOWN
* Request Body: None
* Response: UNKNOWN
* Notes: Courses load statically off `mockCourses` array without reaching externally.

## Enrollments
* URL: UNKNOWN
* Method: UNKNOWN
* File: src/pages/CourseDetailPage.tsx
* Function: handleEnroll / handlePurchase
* Request Body: courseId, userId (implied)
* Response: UNKNOWN
* Notes: Generates an automatic success toast message and updates local view without an API or database commitment. Evaluated using `mockEnrollments`.

---

# LEARNING PROGRESS ENDPOINTS

## lesson complete
* URL: UNKNOWN
* Method: UNKNOWN
* File: src/pages/CourseDetailPage.tsx
* Function: UNKNOWN
* Request Body: UNKNOWN
* Response: UNKNOWN
* Notes: Calculated based on preset mock progress percentages (e.g., `(enrollment.progress / 100) * lessons.length`). Lacks endpoint.

## progress update
* URL: UNKNOWN
* Method: UNKNOWN
* File: src/contexts/AuthContext.tsx 
* Function: addPoints
* Request Body: amount
* Response: UNKNOWN
* Notes: Persisted locally via `localStorage.setItem` using the key `user_${uid}`. Total points and ranking tracked exclusively on the device context.

## completion percentage
* URL: UNKNOWN
* Method: UNKNOWN
* File: src/pages/MyCoursesPage.tsx / src/pages/CourseDetailPage.tsx
* Function: UNKNOWN
* Request Body: UNKNOWN
* Response: UNKNOWN
* Notes: Uses static `mockEnrollments` completion stats.

## quiz score submit
* URL: UNKNOWN
* Method: UNKNOWN
* File: src/pages/QuizPage.tsx
* Function: handleNext -> getPointsEarned (indirectly adds to auth context)
* Request Body: UNKNOWN
* Response: UNKNOWN
* Notes: Completely client-side. The score resolves locally and modifies the user state via the `AuthContext` points tracking. No server payload submitted.

## performance metrics
* URL: UNKNOWN
* Method: UNKNOWN
* File: src/contexts/AuthContext.tsx
* Function: getProgressToNextBadge / getCurrentBadge
* Request Body: UNKNOWN
* Response: UNKNOWN
* Notes: Computed dynamically on load based sequentially on accumulated `totalPoints`.

---

# AI ASSISTANT ENDPOINTS

## AI chat endpoint
* URL: /api/qubrid/chat/completions (Proxys to https://platform.qubrid.com/api/v1/qubridai/chat/completions)
* Method: POST
* File: src/api/ai.ts
* Function: askAI
* Request Body: `model: string`, `messages: Array`, `max_tokens: number`, `temperature: number`, `top_p: number`, `stream: boolean`
* Response: `{ content }` or `{ choices: [{ message: { content } }] }`
* Notes: Calls out to Qubrid using a `fetchWithTimeout` wrapper. Requires API key token via Bearer authentication header.

## Prompt payload format
* Structure: Appends strict `SYSTEM_PROMPT` emphasizing learning-only queries and rules, plus last 10 `ChatMessage` dialogue iterations from localized state history, culminating in the current user prompt.

## Response structure
* Expected validation checks against `data.content` or alternative provider schemas natively supporting `data.choices[0].message.content`. Returns stripped text structure.

## Retry logic location
* File: src/api/ai.ts
* Function: Inside `askAI` loop using `attempt <= MAX_RETRIES` (2 loops, ~2s timeout blocks depending on 429/503 HTTP errors). 

---

# FIREBASE DATA USAGE (IMPORTANT)

Current paths storing/accessing data needing FastAPI + Postgres recreation:

* login: Utilizes `signInWithEmailAndPassword` module strictly checking against Firebase Identity mechanisms locally without proprietary backend queries.
* storing users: Firebase Authentication dictates UUID creation and basic auth factors. Firebase Realtime database targets the specific path structure at `users/{sanitizedEmail}/profile` to push manual changes (bio, extended details).
* storing progress: No Firebase backend paths exist for gamification/progress. Exclusively uses `updateStoredUserData` which leverages browser `localStorage`.
* storing courses: No Firebase usage detected for courses. Defined fully statically.

## Extra Authentication Details (🔐)

* where credentials are validated: Authenticated directly through the remote Firebase Authentication project scope.
* where token/session is stored: Firebase handles token persistence automatically. Parallel local state data is deposited in `localStorage.setItem('user_XYZ')` to track application-domain roles/points alongside the token scope. 
* how auth state is managed: Managed globally via `onAuthStateChanged` hook reacting centrally inside `AuthContext.tsx`. Emits state down implicitly throughout the application tree via context Provider wrappers.

---

# Backend Migration Summary

* Total auth endpoints: 0 explicit HTTP calls (5 Firebase interactions + native LocalStorage caching)
* Total course endpoints: 0 explicit (Relies 100% on frontend static variable mocks)
* Total progress endpoints: 0 explicit (Client calculates metrics directly)
* Total AI endpoints: 1 defined (Qubrid AI fetch via proxied base URL)
* Firebase usage summary: Dependent on Firebase Auth for base identity management. Realtime Database utilized essentially as a profile dictionary. Heavy architectural emphasis onto migrating gamification tracking to Postgres since neither Firebase nor any existing HTTP schema properly hosts `progress` context.
