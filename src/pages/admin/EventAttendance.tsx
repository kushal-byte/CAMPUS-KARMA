import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, ExternalLink, Camera, FileText, Users, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

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

interface EventRegistration {
  id: string;
  proof_url: string;
  team_members: string | null;
  team_size: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
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
  const { isStaff } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [activeTab, setActiveTab] = useState<'attendance' | 'registration'>('attendance');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      fetchEventAndAttendances();
    }
  }, [eventId]);

  const fetchEventAndAttendances = async () => {
    setLoading(true);
    try {
      const [eventRes, attendanceRes, registrationRes] = await Promise.all([
        supabase.from('events').select('*').eq('id', eventId).single(),
        supabase
          .from('attendances')
          .select('*, profiles(name, email)')
          .eq('event_id', eventId)
          .order('check_in_time', { ascending: false }),
        supabase
          .from('event_registrations' as any)
          .select('*, profiles(name, email)')
          .eq('event_id', eventId)
          .order('created_at', { ascending: false }),
      ]);

      if (eventRes.error) throw eventRes.error;
      if (attendanceRes.error) throw attendanceRes.error;
      if (registrationRes.error) console.error('Registration fetch error:', registrationRes.error);

      setEvent(eventRes.data);
      setAttendances(attendanceRes.data as any);
      setRegistrations(registrationRes.data as any || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (table: 'attendances' | 'event_registrations', id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from(table as any)
        .update({ status: newStatus as any })
        .eq('id', id);

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
    toast.success('Attendance CSV exported successfully');
  };

  const exportRegistrationsToCSV = () => {
    const headers = ['Name', 'Email', 'Team Size', 'Team Members', 'Proof URL', 'Status', 'Submitted At'];
    const rows = registrations.map((r) => [
      r.profiles.name,
      r.profiles.email,
      r.team_size?.toString() || '1',
      r.team_members || 'Individual',
      r.proof_url,
      r.status,
      format(new Date(r.created_at), 'PPp'),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell?.replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event?.title.replace(/\s+/g, '_')}_registrations.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Registrations CSV exported successfully');
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
            <div className="flex gap-2">
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Attendance
              </Button>
              <Button onClick={exportRegistrationsToCSV} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Registrations
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="flex space-x-2 border-b">
        <Button
          variant={activeTab === 'attendance' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('attendance')}
          className="rounded-b-none"
        >
          Attendance ({attendances.length})
        </Button>
        <Button
          variant={activeTab === 'registration' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('registration')}
          className="rounded-b-none"
        >
          Registrations ({registrations.length})
        </Button>
      </div>

      {activeTab === 'attendance' ? (
        <Card className="shadow-soft rounded-tl-none">
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
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
                            onValueChange={(value) => handleStatusChange('attendances', attendance.id, value)}
                            disabled={isStaff}
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
      ) : (
        <Card className="shadow-soft rounded-tl-none">
          <CardHeader>
            <CardTitle>Registration Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {registrations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No registration requests yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Team Size</TableHead>
                      <TableHead>Team Members</TableHead>
                      <TableHead>Submitted On</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Proof</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations.map((reg) => (
                      <TableRow key={reg.id}>
                        <TableCell className="font-medium">
                          {reg.profiles.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {reg.profiles.email}
                        </TableCell>
                        <TableCell>
                          {reg.team_size || 1}
                        </TableCell>
                        <TableCell className="max-w-xs truncate" title={reg.team_members || 'Individual'}>
                          {reg.team_members ? (
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-muted-foreground" />
                              {reg.team_members}
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">Individual</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(reg.created_at), 'MMM dd, p')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(reg.status)}>
                            {reg.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(reg.proof_url, '_blank')}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Proof
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={reg.status}
                            onValueChange={(value) => handleStatusChange('event_registrations', reg.id, value)}
                            disabled={isStaff}
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
      )}
    </div>
  );
};

export default EventAttendance;
