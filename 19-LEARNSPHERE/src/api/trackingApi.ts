import axios from 'axios';

// Vite environment setup or fallback
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const api = axios.create({
    baseURL: `${BASE_URL}/api/v1`,
    withCredentials: true,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('neon_auth_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// -------------------------------------------------------------
// TRACKING API METHODS
// -------------------------------------------------------------

export const enrollCourse = async (courseId: string) => {
    // Using the native enroll route from courses.py mapped in backend
    const response = await api.post(`/courses/${courseId}/enroll`);
    return response.data;
};

export const startCourse = async (courseId: string) => {
    const response = await api.post('/tracking/course/start', {
        course_id: courseId,
    });
    return response.data;
};

export const updateLessonProgress = async (courseId: string, lessonId: string, percent: number) => {
    const response = await api.post('/tracking/lesson/progress', {
        course_id: courseId,
        lesson_id: lessonId,
        percent: percent,
    });
    return response.data;
};

export const submitQuiz = async (data: {
    courseId: string;
    quizId: string;
    score: number;
    totalQuestions: number;
    timeTakenSeconds: number;
}) => {
    const response = await api.post('/tracking/quiz/submit', {
        course_id: data.courseId,
        quiz_id: data.quizId,
        score: data.score,
        total_questions: data.totalQuestions,
        time_taken_seconds: data.timeTakenSeconds,
    });
    return response.data;
};

export const endLearningSession = async (data: {
    courseId: string;
    lessonId?: string;
    startedAt: Date;
    endedAt: Date;
}) => {
    const response = await api.post('/tracking/session/end', {
        course_id: data.courseId,
        lesson_id: data.lessonId,
        started_at: data.startedAt.toISOString(),
        ended_at: data.endedAt.toISOString(),
    });
    return response.data;
};

export const getMyPerformance = async () => {
    const response = await api.get('/tracking/performance/me');
    return response.data;
};
