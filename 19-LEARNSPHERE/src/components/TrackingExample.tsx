import React, { useEffect, useState } from 'react';
import {
    enrollCourse,
    startCourse,
    updateLessonProgress,
    submitQuiz,
    endLearningSession,
    getMyPerformance
} from '../api/trackingApi';

export const TrackingExample: React.FC<{ courseId: string; lessonId: string }> = ({ courseId, lessonId }) => {
    const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
    const [performance, setPerformance] = useState<any>(null);

    // Example: Load performance on mount
    useEffect(() => {
        getMyPerformance()
            .then((data) => setPerformance(data))
            .catch((err) => console.error(err));
    }, []);

    // 1. Enroll Button specific action
    const handleEnroll = async () => {
        try {
            await enrollCourse(courseId);
            alert('Enrolled successfully!');
        } catch (error) {
            console.error('Enrollment Failed', error);
        }
    };

    // 2. Start specific action (course open)
    const handleStartLearning = async () => {
        try {
            await startCourse(courseId);
            setSessionStartTime(new Date());
            alert('Started course tracking!');
        } catch (error) {
            console.error('Start failed', error);
        }
    };

    // 3. Mark progress during/after video
    const handleCompleteLesson = async () => {
        try {
            // Sends exactly 100% completion status to backend
            await updateLessonProgress(courseId, lessonId, 100);
            alert('Lesson Completed!');
        } catch (error) {
            console.error('Failed to update progress', error);
        }
    };

    // 4. Submit specific quiz
    const handleQuizSubmit = async () => {
        try {
            await submitQuiz({
                courseId,
                quizId: lessonId, // Usually a sub-lesson/quiz ID
                score: 85,
                totalQuestions: 100,
                timeTakenSeconds: 120,
            });
            alert('Quiz Submitted & Tracked!');
        } catch (error) {
            console.error('Quiz submit failed', error);
        }
    };

    // 5. Leave button / Component Unmount
    const handleLeaveSession = async () => {
        if (sessionStartTime) {
            try {
                await endLearningSession({
                    courseId,
                    lessonId,
                    startedAt: sessionStartTime,
                    endedAt: new Date(),
                });
                alert('Learning Session Ended & Duration Tracked!');
                setSessionStartTime(null);
            } catch (error) {
                console.error('Failed to end session', error);
            }
        }
    };

    return (
        <div className="p-4 border rounded shadow-sm bg-white">
            <h3 className="text-lg font-bold">Tracking Engine Example</h3>

            <div className="mt-4 flex flex-col gap-2">
                <button onClick={handleEnroll} className="bg-blue-500 text-white px-4 py-2 rounded">
                    1. Enroll in Course
                </button>

                <button onClick={handleStartLearning} className="bg-green-500 text-white px-4 py-2 rounded">
                    2. Start Learning (Open Course)
                </button>

                <button onClick={handleCompleteLesson} className="bg-yellow-500 text-white px-4 py-2 rounded">
                    3. Complete Current Lesson
                </button>

                <button onClick={handleQuizSubmit} className="bg-purple-500 text-white px-4 py-2 rounded">
                    4. Submit Dummy Quiz
                </button>

                <button onClick={handleLeaveSession} className="bg-red-500 text-white px-4 py-2 rounded">
                    5. Leave Learning Session
                </button>
            </div>

            <div className="mt-6 border-t pt-4 text-sm mt-4">
                <p className="font-bold">Latest Analytic Data Detected:</p>
                <pre>{JSON.stringify(performance, null, 2)}</pre>
            </div>
        </div>
    );
};
