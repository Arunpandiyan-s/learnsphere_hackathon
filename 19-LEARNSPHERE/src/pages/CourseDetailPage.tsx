import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Play,
  Clock,
  Users,
  Star,
  BookOpen,
  CheckCircle,
  Lock,
  FileText,
  Image,
  HelpCircle,
  Search,
  Download,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { mockCourses, mockLessons, mockReviews, mockEnrollments } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { Lesson, LessonType } from '@/types';
import { cn } from '@/lib/utils';

const getLessonIcon = (type: LessonType) => {
  switch (type) {
    case 'video': return Play;
    case 'document': return FileText;
    case 'image': return Image;
    case 'quiz': return HelpCircle;
    default: return BookOpen;
  }
};

import { PaymentModal } from '@/components/courses/PaymentModal';
import { enrollCourse } from '@/api/trackingApi';
import { apiClient } from '@/api/apiClient';

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [searchLesson, setSearchLesson] = useState('');

  // Review State
  const [reviewsList, setReviewsList] = useState(mockReviews.filter((r) => r.courseId === courseId));
  const [userRating, setUserRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Payment State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);

  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourseData() {
      try {
        const res = await apiClient.get(`/api/v1/courses/${courseId}`);
        setCourse(res.data);
        // Assuming lessons come from a separate API or we'll just mock it empty for now if not available
        setLessons(mockLessons.filter((l) => l.courseId === courseId));

        if (isAuthenticated) {
          const myCoursesRes = await apiClient.get('/api/v1/courses/my-courses');
          const myEnrollment = myCoursesRes.data.find((e: any) => e.course_id === courseId);
          if (myEnrollment) {
            setEnrollment({
              progress: myEnrollment.progress_percent,
              status: myEnrollment.status,
            });
          }
        }
      } catch (err) {
        console.error("Course fetch error, reverting to mock offline mode:", err);
        const fallbackCourse = mockCourses.find(c => c.id === courseId);
        if (fallbackCourse) {
          setCourse(fallbackCourse);
          setLessons(mockLessons.filter((l) => l.courseId === courseId));
        }
      } finally {
        setLoading(false);
      }
    }
    fetchCourseData();
  }, [courseId, isAuthenticated]);

  // Check if user has access (either enrolled or just purchased in this session)
  const hasAccess = enrollment || isPurchased;

  if (loading) {
    return <div className="container py-12 text-center mt-20">Loading course...</div>;
  }

  if (!course) {
    return (
      <div className="container py-12 text-center mt-20">
        <h1 className="mb-4 text-2xl font-bold">Course not found</h1>
        <Button asChild>
          <Link to="/courses">Back to Courses</Link>
        </Button>
      </div>
    );
  }

  const handleEnroll = async () => {
    try {
      if (!courseId) return;
      await enrollCourse(courseId);
      toast.success('Successfully enrolled in the course!');
      // Re-fetch enrollment to trigger UI update
      try {
        const myCoursesRes = await apiClient.get('/api/v1/courses/my-courses');
        const myEnrollment = myCoursesRes.data.find((e: any) => e.course_id === courseId);
        if (myEnrollment) {
          setEnrollment({
            progress: myEnrollment.progress_percent,
            status: myEnrollment.status,
          });
        }
        navigate(`/course/${courseId}/learn`);
      } catch (err) {
        // Mock success fallback mapping 
        setEnrollment({ progress: 0, status: "in_progress" });
        navigate(`/course/${courseId}/learn`);
      }
    } catch (err: any) {
      console.warn("Enroll endpoint crash, simulating local enrollment...", err);
      toast.success('Offline mode: Locally simulated enrollment!');
      setEnrollment({ progress: 0, status: "in_progress" });
      navigate(`/course/${courseId}/learn`);
    }
  };

  const handlePurchase = () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/course/${courseId}`);
      return;
    }
    setShowPaymentModal(true);
  };

  const onPaymentConfirm = () => {
    setShowPaymentModal(false);
    setIsPurchased(true);
    toast.success('Payment successful! You can now start learning.');
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Calculate completed lessons based on enrollment progress
  const completedLessonsCount = enrollment
    ? Math.ceil((enrollment.progress / 100) * lessons.length)
    : 0;

  const incompleteLessonsCount = lessons.length - completedLessonsCount;

  const filteredLessons = lessons.filter((lesson) =>
    lesson.title.toLowerCase().includes(searchLesson.toLowerCase())
  );

  const handleLessonClick = (lesson: Lesson) => {
    navigate(`/course/${courseId}/learn`, {
      state: { lessonId: lesson.id }
    });
  };

  const handleReviewSubmit = () => {
    if (userRating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (!reviewComment.trim()) {
      toast.error('Please write a review comment');
      return;
    }

    setIsSubmittingReview(true);

    // Simulate API call
    setTimeout(() => {
      const newReview = {
        id: `r-${Date.now()}`,
        courseId: courseId!,
        userId: user?.id || 'guest',
        userName: user?.name || 'Guest User',
        userAvatar: user?.avatar,
        rating: userRating,
        comment: reviewComment,
        createdAt: new Date().toISOString(),
      };

      setReviewsList([newReview, ...reviewsList]);
      setUserRating(0);
      setReviewComment('');
      setIsSubmittingReview(false);
      toast.success('Review submitted successfully!');
    }, 1000);
  };

  return (
    <div className="pt-24 pb-7 md:pt-28 md:pb-12">
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={onPaymentConfirm}
        price={course.price || 0}
        courseTitle={course.title}
      />
      <div className="container">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-primary" asChild>
            <Link to="/my-courses">
              <ArrowLeft className="h-4 w-4" />
              Back to My Courses
            </Link>
          </Button>
        </div>
        {/* Course Overview Section - Horizontal Layout */}
        <div className="mb-6 rounded-xl border border-border bg-card overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_320px]">
            {/* Left - Course Cover */}
            <div className="hidden lg:block">
              <img
                src={course.image}
                alt={course.title}
                className="h-full w-full object-cover min-h-40"
              />
            </div>

            {/* Middle - Course Info */}
            <div className="p-6 flex flex-col justify-between">
              <div>
                {/* Course Label */}
                <Badge className="w-fit mb-2">Course</Badge>

                {/* Course Title */}
                <h1 className="text-2xl font-bold mb-3">{course.title}</h1>

                {/* Short Description */}
                <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>

                {/* Mobile Course Image */}
                <div className="lg:hidden mt-4 rounded-lg overflow-hidden">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="h-40 w-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Right - Progress and Stats */}
            <div className="p-6 border-l border-border">
              {/* Progress Percentage */}
              <div className="mb-4 text-center">
                <p className="text-2xl font-bold">{enrollment?.progress || 0}%</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>

              {/* Progress Bar */}
              <Progress value={enrollment?.progress || 0} className="mb-6 h-2" />

              {/* Stat Cards - Horizontal Row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="border border-border rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Content</p>
                  <p className="text-lg font-bold mt-1">{lessons.length}</p>
                </div>
                <div className="border border-border rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="text-lg font-bold mt-1">{completedLessonsCount}</p>
                </div>
                <div className="border border-border rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Incomplete</p>
                  <p className="text-lg font-bold mt-1">{incompleteLessonsCount}</p>
                </div>
              </div>

              {/* CTA Button */}
              {hasAccess && (
                <Button className="w-full mt-4" size="sm" asChild>
                  <Link to={`/course/${course.id}/learn`}>
                    <Play className="mr-2 h-4 w-4" />
                    {enrollment?.status === 'yet_to_start' ? 'Start Learning' : 'Continue Learning'}
                  </Link>
                </Button>
              )}

              {!hasAccess && (
                <>
                  {course.accessRule === 'payment' && course.price ? (
                    <Button className="w-full mt-4" size="sm" onClick={handlePurchase}>
                      Buy Now (₹{course.price})
                    </Button>
                  ) : course.accessRule === 'invitation' ? (
                    <Button className="w-full mt-4" size="sm" variant="outline" disabled>
                      Invitation Only
                    </Button>
                  ) : isAuthenticated ? (
                    <Button className="w-full mt-4" size="sm" onClick={handleEnroll}>
                      Enroll Now - Free
                    </Button>
                  ) : (
                    <Button className="w-full mt-4" size="sm" asChild>
                      <Link to={`/login?redirect=/course/${courseId}`}>Sign In to Enroll</Link>
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>


        {/* Tabs */}
        <Tabs defaultValue="overview" className="mt-8">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Course Overview</TabsTrigger>
            <TabsTrigger value="reviews">Ratings and Reviews ({reviewsList.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Content Header with Search */}
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-semibold">{lessons.length} Contents</h3>
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search content"
                    value={searchLesson}
                    onChange={(e) => setSearchLesson(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Lessons List */}
              <div className="rounded-xl border border-border bg-card divide-y divide-border">
                {filteredLessons.length > 0 ? (
                  filteredLessons.map((lesson, index) => {
                    const Icon = getLessonIcon(lesson.type);
                    const isCompleted = index < completedLessonsCount;
                    const isInProgress = !isCompleted && index === completedLessonsCount;
                    const isLocked = !enrollment && !isCompleted;

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => !isLocked && handleLessonClick(lesson)}
                        disabled={isLocked}
                        className={cn(
                          "flex w-full items-center justify-between gap-4 px-6 py-4 transition-colors text-left",
                          isLocked ? "opacity-60 cursor-not-allowed" : "hover:bg-muted/50 cursor-pointer"
                        )}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {/* Lesson Number */}
                          <span className="text-sm font-semibold text-muted-foreground"># {index + 1}</span>

                          {/* Lesson Title */}
                          <p className={cn(
                            "text-sm font-medium",
                            isCompleted ? "text-muted-foreground" : "text-primary"
                          )}>
                            {lesson.title}
                          </p>
                        </div>

                        {/* Status Indicator */}
                        <div className="flex items-center gap-3">
                          {isCompleted ? (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success/10">
                              <CheckCircle className="h-5 w-5 text-success" />
                            </div>
                          ) : isInProgress ? (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary">
                              <div className="h-2 w-2 rounded-full bg-primary" />
                            </div>
                          ) : (
                            <div className="h-6 w-6 rounded-full border-2 border-muted-foreground" />
                          )}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Search className="mb-3 h-8 w-8 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">No content found</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reviews">
            <div className="space-y-6 flex flex-col pt-4">

              {/* Rating Summary Header matched to wireframe */}
              <div className="flex items-center gap-4 py-4 border-b border-border">
                <div className="text-4xl font-bold">{course?.rating?.toFixed(1) || "4.5"}</div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "h-6 w-6",
                        star <= Math.round(course?.rating || 4.5)
                          ? "fill-warning text-warning"
                          : "text-muted"
                      )}
                    />
                  ))}
                </div>
                {/* The wireframe shows an 'Add Review' button next to the stars */}
                <Button className="ml-4 rounded-full" variant="secondary" size="sm" onClick={() => {
                  if (!isAuthenticated) navigate(`/login?redirect=/course/${courseId}`);
                }}>
                  Add Review
                </Button>
              </div>

              {/* Add Review section (wireframe shows logged in user with input box) */}
              {isAuthenticated && (
                <div className="flex flex-col gap-3 py-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 ring-1 ring-border">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback>{user?.name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-sm">{user?.name || 'Logged in user name'}</span>
                  </div>
                  <div className="ml-11 flex flex-col gap-2">
                    <Textarea
                      placeholder="Write your review...."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="resize-none flex-1 border-muted bg-transparent focus-visible:ring-1 focus-visible:ring-primary h-[80px]"
                    />
                    {reviewComment.trim() && (
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button key={star} onClick={() => setUserRating(star)} type="button">
                              <Star className={cn("h-5 w-5", star <= userRating ? "fill-warning text-warning" : "text-muted")} />
                            </button>
                          ))}
                        </div>
                        <Button size="sm" onClick={handleReviewSubmit} disabled={isSubmittingReview}>Submit Review</Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!isAuthenticated && (
                <div className="flex flex-col py-4 border-b border-border text-center">
                  <p className="mb-2 text-sm text-muted-foreground">Please sign in to leave a review</p>
                  <Button variant="outline" className="w-fit mx-auto" asChild>
                    <Link to={`/login?redirect=/course/${courseId}`}>Sign In</Link>
                  </Button>
                </div>
              )}

              {/* Reviews List */}
              <div className="flex flex-col gap-6 pt-4">
                {reviewsList.map(review => (
                  <div key={review.id} className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 ring-1 ring-border">
                        <AvatarImage src={review.userAvatar} />
                        <AvatarFallback>{review.userName[0]}</AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-sm">{review.userName}</span>
                      <div className="flex items-center gap-1 ml-auto">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={cn("h-3 w-3", star <= review.rating ? "fill-warning text-warning" : "text-muted")} />
                        ))}
                      </div>
                    </div>
                    <div className="ml-11 rounded-lg border border-primary/20 bg-muted/20 p-4 text-sm text-foreground my-1">
                      {review.comment}
                    </div>
                  </div>
                ))}

                {reviewsList.length === 0 && (
                  <p className="text-muted-foreground text-sm py-4">No reviews yet.</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
