import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Grid,
  List,
  Share2,
  Eye,
  Clock,
  Users,
  MessageCircle,
  Mail,
  Copy,
  MoreHorizontal,
  Trash2,
  BookOpen,
  Edit,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Course } from '@/types';
import { cn } from '@/lib/utils';
import { apiClient } from '@/api/apiClient';
import { mockCourses } from '@/data/mockCourses';

export default function BackofficeCoursesPage() {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [newCourseDialogOpen, setNewCourseDialogOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const navigate = useNavigate();

  const [courses, setCourses] = useState<any[]>([]); // Use any[] temporarily or refine Course matching

  const fetchCourses = async () => {
    try {
      const res = await apiClient.get('/api/v1/courses');
      // Normalize backend data to match UI representation temporarily if needed
      const mapped = res.data.map((c: any) => ({
        id: c.id,
        course_name: c.course_name,
        description: c.description || '',
        image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop', // Temporary placeholder
        tags: ['Draft'],
        status: 'published', // Just visually published
        visibility: 'everyone',
        totalLessons: 0,
        totalDuration: 0,
        viewsCount: 0,
        enrolledCount: 0
      }));
      setCourses(mapped);
    } catch (error) {
      console.error("Failed to fetch courses, loading local mock data:", error);
      toast.error('Backend unavailable. Loaded local mock data (Fallback Mode).');
      setCourses(mockCourses);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const filteredCourses = courses.filter((course) =>
    course.course_name.toLowerCase().includes(search.toLowerCase())
  );

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}:${mins.toString().padStart(2, '0')}` : `0:${mins.toString().padStart(2, '0')}`;
  };



  const handleCreateCourse = async () => {
    if (!newCourseName.trim()) return;

    try {
      console.log("CREATE COURSE CALLED");
      const payload = {
        course_name: newCourseName,
        description: newCourseDesc
      };

      console.log("REQUEST DATA", payload);
      const response = await apiClient.post('/api/v1/courses', payload);
      console.log("RESPONSE", response);
      console.log("DB COMMIT SUCCESS:", response.data);

      setNewCourseDialogOpen(false);
      setNewCourseName('');
      setNewCourseDesc('');
      toast.success('Course created successfully');

      // Real API Refresh
      navigate(`/backoffice/courses/${response.data.id}`);
    } catch (err: any) {
      console.error("Backend request failed, falling back to mock mode", err);
      toast.error(err.response?.data?.detail || "Falling back. Creating course locally...");

      const newCourseFallbackId = Math.random().toString(36).substring(7);
      const newMockCourse = {
        id: newCourseFallbackId,
        course_name: newCourseName,
        description: newCourseDesc,
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop",
        tags: ["Draft"],
        status: "published",
        totalLessons: 0,
        totalDuration: 0,
        viewsCount: 0,
        enrolledCount: 0
      };

      setCourses(prev => [...prev, newMockCourse]);
      setNewCourseDialogOpen(false);
      setNewCourseName('');
      setNewCourseDesc('');
      toast.success('Course created successfully in fallback mode');
    }
  };

  const handleCopyLink = (courseId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/course/${courseId}`);
    toast.success('Course link copied to clipboard');
  };

  const handleShareWhatsapp = (courseId: string) => {
    const url = encodeURIComponent(`${window.location.origin}/course/${courseId}`);
    const text = encodeURIComponent('Check out this amazing course!');
    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
  };

  const handleShareEmail = (courseId: string) => {
    const url = encodeURIComponent(`${window.location.origin}/course/${courseId}`);
    const subject = encodeURIComponent('Check out this course');
    const body = encodeURIComponent(`I found this great course and thought you might like it: ${window.location.origin}/course/${courseId}`);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`, '_blank');
  };

  const handleDelete = (courseId: string) => {
    setCourses(courses.filter((course) => course.id !== courseId));
    toast.success('Course deleted successfully');
  };

  const handleShare = (courseId: string) => {
    handleCopyLink(courseId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Courses</h1>
          <p className="text-muted-foreground">
            Manage your courses and content
          </p>
        </div>
        <Dialog open={newCourseDialogOpen} onOpenChange={setNewCourseDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Course
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Course Name *</Label>
                <Input
                  id="name"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="e.g. Advanced React Patterns"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={newCourseDesc}
                  onChange={(e) => setNewCourseDesc(e.target.value)}
                  placeholder="Course description"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setNewCourseDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCourse} disabled={!newCourseName.trim()}>
                Create Course
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and View Toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
            title="Kanban View"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
            title="List View"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Courses List View (Matching Prototype) */}
      {viewMode === 'list' ? (
        <div className="space-y-4">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-lg hover:border-primary/30"
            >
              {/* Background Image on Left Half */}
              <div
                className="absolute inset-y-0 left-0 w-1/3 bg-cover bg-center"
                style={{ backgroundImage: `url(${course.image})` }}
              >
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-card/80 to-card" />
              </div>

              {/* Content */}
              <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 p-5 pl-[35%]">
                {/* Course Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
                    {course.course_name}
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {course.tags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center text-xs text-accent font-medium"
                      >
                        {tag}
                        {index < course.tags.length - 1 && (
                          <span className="mx-1 text-muted-foreground">+</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center px-3 py-1 rounded-lg bg-muted/50">
                    <p className="font-bold text-foreground">{course.viewsCount || 0}</p>
                    <p className="text-xs text-muted-foreground">Views</p>
                  </div>
                  <div className="text-center px-3 py-1 rounded-lg bg-muted/50">
                    <p className="font-bold text-foreground">{course.totalLessons}</p>
                    <p className="text-xs text-muted-foreground">Contents</p>
                  </div>
                  <div className="text-center px-3 py-1 rounded-lg bg-muted/50">
                    <p className="font-bold text-foreground">{formatDuration(course.totalDuration)}</p>
                    <p className="text-xs text-muted-foreground">Duration</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-card/80 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground"
                    onClick={() => handleShare(course.id)}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-card/80 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground"
                    asChild
                  >
                    <Link to={`/backoffice/courses/${course.id}`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                </div>

                {/* Status Badge */}
                <div>
                  <Badge
                    className={cn(
                      "capitalize font-medium",
                      course.status === 'published'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25'
                        : 'bg-muted text-muted-foreground border-muted-foreground/30'
                    )}
                  >
                    {course.status}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Grid View (Kanban Style) */
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <Card
              key={course.id}
              className="group overflow-hidden transition-all hover:shadow-card-hover"
            >
              {/* Image */}
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={course.image}
                  alt={course.course_name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute right-2 top-2">
                  <Badge
                    className={cn(
                      "capitalize",
                      course.status === 'published'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 backdrop-blur-sm'
                        : 'bg-muted/80 text-muted-foreground backdrop-blur-sm'
                    )}
                  >
                    {course.status}
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <CardContent className="p-4">
                {/* Tags */}
                <div className="mb-2 flex flex-wrap gap-1">
                  {course.tags.slice(0, 3).map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center text-xs text-accent"
                    >
                      {tag}
                      {index < Math.min(course.tags.length, 3) - 1 && (
                        <span className="mx-1 text-muted-foreground">+</span>
                      )}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h3 className="mb-3 line-clamp-2 font-semibold">{course.course_name}</h3>

                {/* Stats */}
                <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {course.viewsCount || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {course.totalLessons}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDuration(course.totalDuration)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {course.enrolledCount} enrolled
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/backoffice/courses/${course.id}`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="cursor-pointer">
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem onClick={() => handleShareWhatsapp(course.id)} className="cursor-pointer">
                            <MessageCircle className="mr-2 h-4 w-4" />
                            WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShareEmail(course.id)} className="cursor-pointer">
                            <Mail className="mr-2 h-4 w-4" />
                            Gmail
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyLink(course.id)} className="cursor-pointer">
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Link
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link to={`/course/${course.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(course.id)}
                        className="text-destructive cursor-pointer"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {
        filteredCourses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No courses found</h3>
            <p className="text-muted-foreground">
              {search ? 'Try a different search term' : 'No courses available'}
            </p>
          </div>
        )
      }
    </div >
  );
}
