import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, ExternalLink, Camera, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Attendance {
  id: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: 'pending' | 'approved' | 'rejected';
  selfie_url: string | null;
  certificate_url: string | null;
  profiles: {
    name: string;
    email: string;
  };
}

interface Event {
  id: string;
  title: string;
  description: string;
  location_name: string;
  start_time: string;
  end_time: string;
}

const EventAttendance = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      fetchEventAndAttendances();
    }
  }, [eventId]);

  const fetchEventAndAttendances = async () => {
    setLoading(true);
    try {
      const [eventRes, attendanceRes] = await Promise.all([
        supabase.from('events').select('*').eq('id', eventId).single(),
        supabase
          .from('attendances')
          .select('*, profiles(name, email)')
          .eq('event_id', eventId)
          .order('check_in_time', { ascending: false }),
      ]);

      if (eventRes.error) throw eventRes.error;
      if (attendanceRes.error) throw attendanceRes.error;

      setEvent(eventRes.data);
      setAttendances(attendanceRes.data as any);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (attendanceId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('attendances')
        .update({ status: newStatus as any })
        .eq('id', attendanceId);

      if (error) throw error;

      toast.success('Status updated successfully');
      fetchEventAndAttendances();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Check In', 'Check Out', 'Status'];
    const rows = attendances.map((a) => [
      a.profiles.name,
      a.profiles.email,
      a.check_in_time ? format(new Date(a.check_in_time), 'PPp') : 'N/A',
      a.check_out_time ? format(new Date(a.check_out_time), 'PPp') : 'N/A',
      a.status,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event?.title.replace(/\s+/g, '_')}_attendance.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      approved: 'bg-green-100 text-green-700 border-green-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/2"></div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Event not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/admin')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Events
      </Button>

      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{event.title}</CardTitle>
              <p className="text-muted-foreground mt-2">{event.description}</p>
              <div className="flex flex-wrap gap-4 mt-4 text-sm">
                <span>📍 {event.location_name}</span>
                <span>📅 {format(new Date(event.start_time), 'PPp')}</span>
              </div>
            </div>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Attendance Records ({attendances.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {attendances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No attendance records yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Files</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendances.map((attendance) => (
                    <TableRow key={attendance.id}>
                      <TableCell className="font-medium">
                        {attendance.profiles.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {attendance.profiles.email}
                      </TableCell>
                      <TableCell>
                        {attendance.check_in_time
                          ? format(new Date(attendance.check_in_time), 'PPp')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {attendance.check_out_time
                          ? format(new Date(attendance.check_out_time), 'PPp')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(attendance.status)}>
                          {attendance.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {attendance.selfie_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(attendance.selfie_url!, '_blank')}
                              className="text-primary"
                            >
                              <Camera className="w-4 h-4 mr-1" />
                              Selfie
                            </Button>
                          )}
                          {attendance.certificate_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(attendance.certificate_url!, '_blank')}
                              className="text-primary"
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              Cert
                            </Button>
                          )}
                          {!attendance.selfie_url && !attendance.certificate_url && (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={attendance.status}
                          onValueChange={(value) => handleStatusChange(attendance.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EventAttendance;
