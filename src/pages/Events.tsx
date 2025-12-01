import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

const Events = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Campus Events</h1>
        <p className="text-muted-foreground mt-1">Check in to events and track your attendance</p>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Event Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Event listing and check-in features coming soon!</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Events;