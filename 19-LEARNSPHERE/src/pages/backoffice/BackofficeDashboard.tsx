import { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  PlayCircle,
  CheckCircle,
  Settings2,
  ChevronDown,
  Search,
  Filter,
  X,
  Calendar,
  BookOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { StatCard } from '@/components/ui/stat-card';
import { toast } from 'sonner';

// Available columns for customization
const availableColumns = [
  { key: 'sNo', label: 'S.No.' },
  { key: 'courseName', label: 'Course Name' },
  { key: 'participantName', label: 'Participant Name' },
  { key: 'enrolledDate', label: 'Enrolled Date' },
  { key: 'startDate', label: 'Start Date' },
  { key: 'timeSpent', label: 'Time Spent' },
  { key: 'completionPercentage', label: 'Completion Percentage' },
  { key: 'completedDate', label: 'Completed Date' },
  { key: 'status', label: 'Status' },
];

export default function BackofficeDashboard() {
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'sNo',
    'courseName',
    'participantName',
    'enrolledDate',
    'startDate',
    'timeSpent',
    'completionPercentage',
    'completedDate',
    'status',
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const [metrics, setMetrics] = useState({
    total_participants: 0,
    yet_to_start: 0,
    in_progress: 0,
    completed: 0
  });

  const [userData, setUserData] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('neon_auth_token');
      if (!token) return;

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

      // Fetch Metrics
      const metricsRes = await fetch(`${API_BASE_URL}/api/v1/dashboard/metrics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (metricsRes.ok) {
        setMetrics(await metricsRes.json());
      }

      // Fetch Progress Data
      const progressRes = await fetch(`${API_BASE_URL}/api/v1/dashboard/learner-progress`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (progressRes.ok) {
        const progressData = await progressRes.json();
        const mappedData = progressData.map((d: any, index: number) => ({
          id: index + 1,
          sNo: index + 1,
          courseName: d.course_name,
          participantName: d.learner_name,
          enrolledDate: d.enrolled_date ? new Date(d.enrolled_date).toLocaleDateString() : '-',
          startDate: d.start_date ? new Date(d.start_date).toLocaleDateString() : '-',
          timeSpent: `${Math.floor(d.time_spent / 60)}:${(d.time_spent % 60).toString().padStart(2, '0')}`,
          completionPercentage: Math.round(d.completion_percentage),
          completedDate: d.status === 'completed' && d.updated_at ? new Date(d.updated_at).toLocaleDateString() : '-',
          status: d.status
        }));
        setUserData(mappedData);
      }
    } catch (err) {
      console.error("Dashboard pull failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // 30 sec polling
    return () => clearInterval(interval);
  }, []);

  const courseOptions = Array.from(new Set(userData.map(u => u.courseName)));

  const stats = [
    {
      title: 'Total Participants',
      value: metrics.total_participants,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Yet to Start',
      value: metrics.yet_to_start,
      icon: Clock,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      title: 'In Progress',
      value: metrics.in_progress,
      icon: PlayCircle,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Completed',
      value: metrics.completed,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  const filteredUsers = userData.filter((user) => {
    const matchesSearch =
      user.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.courseName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesCourse = courseFilter === 'all' || user.courseName === courseFilter;

    return matchesSearch && matchesStatus && matchesCourse;
  });

  const activeFiltersCount =
    (statusFilter !== 'all' ? 1 : 0) +
    (courseFilter !== 'all' ? 1 : 0);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCourseFilter('all');
  };

  const toggleColumn = (columnKey: string) => {
    setVisibleColumns((prev) =>
      prev.includes(columnKey)
        ? prev.filter((key) => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25 transition-colors">
            Completed
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-accent/10 text-accent border-accent/30 hover:bg-accent/20 transition-colors">
            In Progress
          </Badge>
        );
      case 'yet_to_start':
        return (
          <Badge className="bg-muted text-muted-foreground border-muted hover:bg-muted/80 transition-colors">
            Yet to Start
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {loading && (
        <div className="flex justify-center items-center py-4 bg-muted/20 border-b border-border/50 rounded-lg animate-pulse">
          <span className="text-muted-foreground font-medium text-sm flex gap-2">
            <Clock className="w-4 h-4 animate-spin" /> Fetching real-time LMS data from Neon...
          </span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your courses and learners
        </p>
      </div>

      {/* Overview Section */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Participants"
          value={metrics.total_participants}
          icon={Users}
          variant="purple"
          description="Active learners"
        />
        <StatCard
          title="Yet to Start"
          value={metrics.yet_to_start}
          icon={Clock}
          variant="orange"
          description="Pending enrollment"
        />
        <StatCard
          title="In Progress"
          value={metrics.in_progress}
          icon={PlayCircle}
          variant="blue"
          description="Learning now"
        />
        <StatCard
          title="Completed"
          value={metrics.completed}
          icon={CheckCircle}
          variant="green"
          description="Courses finished"
        />
      </div>

      {/* Users Section */}
      <div className="space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between sticky top-[4rem] z-20 bg-background/95 backdrop-blur-sm py-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span className="h-6 w-1 rounded-full bg-gradient-to-b from-blue-500 to-violet-500 shadow-md" />
            Learner Progress
          </h2>

          <div className="flex flex-1 items-center gap-2 md:max-w-xl md:justify-end">
            {/* Search Input */}
            <div className="relative flex-1 md:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                placeholder="Search learners or courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-card/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all hover:bg-card/80"
              />
            </div>

            {/* Filter Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "gap-2 border-border/50 bg-card/50 hover:bg-card hover:border-primary/30 transition-all",
                    activeFiltersCount > 0 && "border-primary/50 text-primary bg-primary/5"
                  )}
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[320px] p-4 backdrop-blur-xl bg-card/95 border-border/50 shadow-xl">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold leading-none">Filter View</h4>
                    {activeFiltersCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-auto p-0 text-xs text-muted-foreground hover:text-destructive"
                      >
                        Reset all
                      </Button>
                    )}
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Status</label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full bg-background/50">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="yet_to_start">Yet to Start</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                        Course
                      </label>
                      <Select value={courseFilter} onValueChange={setCourseFilter}>
                        <SelectTrigger className="w-full bg-background/50">
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Courses</SelectItem>
                          {courseOptions.map(course => (
                            <SelectItem key={course} value={course}>{course}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Columns Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-border/50 bg-card/50 hover:bg-card hover:border-primary/30 transition-all">
                  <Settings2 className="h-4 w-4" />
                  View
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 backdrop-blur-xl bg-card/95 border-border/50 shadow-xl">
                <DropdownMenuLabel>Visible Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {availableColumns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.key}
                    checked={visibleColumns.includes(column.key)}
                    onCheckedChange={() => toggleColumn(column.key)}
                    className="focus:bg-primary/10 focus:text-primary"
                  >
                    {column.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filter Summary Tags */}
        {(activeFiltersCount > 0 || searchQuery) && (
          <div className="flex flex-wrap items-center gap-2">
            {searchQuery && (
              <Badge variant="secondary" className="gap-1 bg-background border border-border/50 pl-2 pr-1 py-1">
                Search: {searchQuery}
                <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 hover:bg-muted rounded-full" onClick={() => setSearchQuery('')}>
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {statusFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1 bg-background border border-border/50 pl-2 pr-1 py-1">
                Status: {statusFilter.replace('_', ' ')}
                <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 hover:bg-muted rounded-full" onClick={() => setStatusFilter('all')}>
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {courseFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1 bg-background border border-border/50 pl-2 pr-1 py-1">
                Course: {courseFilter}
                <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 hover:bg-muted rounded-full" onClick={() => setCourseFilter('all')}>
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-6 text-muted-foreground hover:text-foreground">
              Clear all
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {/* Header Row (Hidden on mobile, visible on desktop) */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 bg-muted/20 rounded-lg border border-border/40 backdrop-blur-sm">
            {visibleColumns.includes('sNo') && <div className="col-span-1">#</div>}
            {visibleColumns.includes('courseName') && <div className="col-span-2">Course</div>}
            {visibleColumns.includes('participantName') && <div className="col-span-2">Participant</div>}

            {visibleColumns.includes('enrolledDate') && <div className="col-span-1">Enrolled</div>}
            {visibleColumns.includes('startDate') && <div className="col-span-1">Start</div>}
            {visibleColumns.includes('timeSpent') && <div className="col-span-1">Time</div>}

            {visibleColumns.includes('completionPercentage') && <div className="col-span-2">Progress</div>}

            {visibleColumns.includes('completedDate') && <div className="col-span-1">Completed</div>}

            {visibleColumns.includes('status') && <div className="col-span-1 text-right">Status</div>}
          </div>

          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className="group relative grid grid-cols-1 md:grid-cols-12 gap-4 items-center rounded-2xl border border-border/50 bg-card/50 p-4 transition-all duration-300 hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5 hover:bg-card/80"
              >
                {/* Glow Effect on Hover */}
                <div className="absolute inset-x-0 -bottom-px h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                {/* S.No */}
                {visibleColumns.includes('sNo') && (
                  <div className="hidden md:block col-span-1 text-sm font-medium text-muted-foreground">
                    {user.sNo.toString().padStart(2, '0')}
                  </div>
                )}

                {/* Course Name */}
                {visibleColumns.includes('courseName') && (
                  <div className="col-span-1 md:col-span-2">
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1" title={user.courseName}>
                      {user.courseName}
                    </h3>
                    <div className="mt-1 flex gap-2 text-xs text-muted-foreground md:hidden">
                      <span>{user.enrolledDate}</span>
                    </div>
                  </div>
                )}

                {/* Participant */}
                {visibleColumns.includes('participantName') && (
                  <div className="col-span-1 md:col-span-2 flex items-center gap-3">
                    <div className="relative h-8 w-8 overflow-hidden rounded-full ring-2 ring-border/50 transition-all group-hover:ring-primary/30 shrink-0">
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-700 to-rose-900 text-[10px] font-bold text-white">
                        {user.participantName.charAt(0)}
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-foreground truncate">{user.participantName}</span>
                      <span className="text-[10px] text-muted-foreground">Student</span>
                    </div>
                  </div>
                )}

                {/* Enrolled Date */}
                {visibleColumns.includes('enrolledDate') && (
                  <div className="col-span-1 hidden md:block text-xs text-muted-foreground">
                    {user.enrolledDate}
                  </div>
                )}

                {/* Start Date */}
                {visibleColumns.includes('startDate') && (
                  <div className="col-span-1 hidden md:block text-xs text-muted-foreground">
                    {user.startDate}
                  </div>
                )}

                {/* Time Spent */}
                {visibleColumns.includes('timeSpent') && (
                  <div className="col-span-1 hidden md:block text-xs font-medium text-foreground/80">
                    {user.timeSpent} <span className="text-muted-foreground font-normal">hrs</span>
                  </div>
                )}

                {/* Progress */}
                {visibleColumns.includes('completionPercentage') && (
                  <div className="col-span-1 md:col-span-2 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-muted-foreground">
                        {user.completionPercentage === 100 ? 'Done' :
                          user.completionPercentage > 0 ? 'Active' : 'Pending'}
                      </span>
                      <span className="font-bold text-foreground">{user.completionPercentage}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/50">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-1000 ease-out",
                          user.completionPercentage === 100 ? "bg-gradient-to-r from-emerald-500 to-green-500" :
                            user.completionPercentage > 0 ? "bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800" :
                              "bg-muted"
                        )}
                        style={{ width: `${user.completionPercentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Completed Date */}
                {visibleColumns.includes('completedDate') && (
                  <div className="col-span-1 hidden md:block text-xs text-muted-foreground">
                    {user.completedDate}
                  </div>
                )}

                {/* Status Badge */}
                {visibleColumns.includes('status') && (
                  <div className="col-span-1 flex md:justify-end">
                    {getStatusBadge(user.status)}
                  </div>
                )}
              </div>
            ))


          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border/50">
              <Search className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-lg font-medium">No results found</p>
              <p className="text-sm">Try adjusting your filters or search terms.</p>
              <Button variant="link" onClick={clearFilters} className="mt-2 text-primary">
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div >
  );
}
