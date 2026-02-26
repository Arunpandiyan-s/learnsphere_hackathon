export const mockCourses = [
    {
        id: "1",
        course_name: "Python Basics",
        title: "Python Basics", // keep title for backward compatibility strictly if needed, wait user explicitly asked: course_name only
        description: "Learn Python from scratch",
        image: "https://images.unsplash.com/photo-1526379095098-d400fd0bfce8?w=800&h=450&fit=crop",
        tags: ["Programming", "Python"],
        status: "published",
        totalLessons: 10,
        totalDuration: 120,
        viewsCount: 1500,
        enrolledCount: 500
    },
    {
        id: "2",
        course_name: "React Development",
        title: "React Development",
        description: "Frontend with React",
        image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop",
        tags: ["Frontend", "React"],
        status: "published",
        totalLessons: 15,
        totalDuration: 300,
        viewsCount: 3000,
        enrolledCount: 1200
    },
    {
        id: "3",
        course_name: "FastAPI Backend",
        title: "FastAPI Backend",
        description: "Build APIs using FastAPI",
        image: "https://images.unsplash.com/photo-1623282033815-40b05d96c903?w=800&h=450&fit=crop",
        tags: ["Backend", "Python", "API"],
        status: "published",
        totalLessons: 8,
        totalDuration: 180,
        viewsCount: 800,
        enrolledCount: 250
    }
];
