import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { format, isBefore, isAfter } from 'date-fns';
import { toast } from 'sonner';
import { EventCardSkeleton } from '@/components/skeletons/CardSkeletons';

interface Event {
  id: string;
  title: string;
  description: string;
  location_name: string;
  start_time: string;
  end_time: string;
  banner_image_url: string | null;
  created_at: string;
}

const Events = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const getEventStatus = (startTime: string, endTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isBefore(now, start)) {
      return { label: 'Upcoming', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    } else if (isAfter(now, end)) {
      return { label: 'Completed', color: 'bg-gray-100 text-gray-700 border-gray-200' };
    } else {
      return { label: 'Live Now', color: 'bg-green-100 text-green-700 border-green-200' };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Campus Events</h1>
        <p className="text-muted-foreground mt-1">Check in to events and track your attendance</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : events.length === 0 ? (
        <Card className="shadow-soft">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No events yet</h3>
            <p className="text-muted-foreground text-center">
              Check back later for upcoming campus events
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const status = getEventStatus(event.start_time, event.end_time);
            return (
              <Card
                key={event.id}
                className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer group overflow-hidden"
                onClick={() => navigate(`/events/${event.id}`)}
              >
                <div className="aspect-video bg-gradient-subtle overflow-hidden">
                  {event.banner_image_url ? (
                    <img
                      src={event.banner_image_url}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Calendar className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="line-clamp-2 flex-1">{event.title}</CardTitle>
                  </div>
                  <Badge variant="outline" className={status.color}>
                    {status.label}
                  </Badge>
                </CardHeader>

                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{format(new Date(event.start_time), 'MMM dd, yyyy • h:mm a')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="line-clamp-1">{event.location_name}</span>
                  </div>
                  <Button className="w-full mt-4" size="sm">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Events;
