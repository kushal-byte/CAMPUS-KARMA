import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShoppingBag, Calendar, FileText, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Stats {
  totalUsers: number;
  totalListings: number;
  totalEvents: number;
  totalPosts: number;
  activeListings: number;
  upcomingEvents: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {      
      const [users, listings, events, posts] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('listings').select('id, status', { count: 'exact' }),
        supabase.from('events').select('id, end_time', { count: 'exact' }),
        supabase.from('generated_posts').select('id', { count: 'exact', head: true }),
      ]);

      if (users.error) throw users.error;
      if (listings.error) throw listings.error;
      if (events.error) throw events.error;
      if (posts.error) throw posts.error;

      const activeListings = listings.data?.filter(l => l.status === 'active').length || 0;
      const upcomingEvents = events.data?.filter(e => new Date(e.end_time) > new Date()).length || 0;

      setStats({
        totalUsers: users.count || 0,
        totalListings: listings.count || 0,
        totalEvents: events.count || 0,
        totalPosts: posts.count || 0,
        activeListings,
        upcomingEvents,
      });
      
      setError(null); // Clear any previous errors
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to fetch dashboard data: ${errorMessage}`);
      // Set empty stats so component still renders
      setStats({
        totalUsers: 0,
        totalListings: 0,
        totalEvents: 0,
        totalPosts: 0,
        activeListings: 0,
        upcomingEvents: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Listings',
      value: stats?.activeListings || 0,
      subtitle: `of ${stats?.totalListings || 0} total`,
      icon: ShoppingBag,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Upcoming Events',
      value: stats?.upcomingEvents || 0,
      subtitle: `of ${stats?.totalEvents || 0} total`,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Generated Posts',
      value: stats?.totalPosts || 0,
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Dashboard Overview</h2>
        <p className="text-muted-foreground">Key metrics and statistics</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Dashboard Error</AlertTitle>
          <AlertDescription>
            {error}
            <br />
            <strong>Possible solutions:</strong>
            <ul className="mt-2 ml-4 list-disc">
              <li>Make sure you've run the database setup script</li>
              <li>Check that your user has admin role</li>
              <li>Verify Supabase connection</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="shadow-soft hover:shadow-medium transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                {stat.subtitle && (
                  <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminDashboard;
