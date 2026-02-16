import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Calendar, MapPin, Clock, Camera, FileText, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { format, isBefore, isAfter, isWithinInterval } from 'date-fns';
import { toast } from 'sonner';

interface Event {
  id: string;
  title: string;
  description: string;
  location_name: string;
  location_link: string | null;
  start_time: string;
  end_time: string;
  banner_image_url: string | null;
}

interface Attendance {
  id: string;
  check_in_time: string | null;
  check_out_time: string | null;
  selfie_url: string | null;
  certificate_url: string | null;
  status: string;
}

interface EventRegistration {
  id: string;
  proof_url: string;
  team_members: string | null;
  team_size: number;
  status: 'pending' | 'approved' | 'rejected';
}

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [registration, setRegistration] = useState<EventRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [teamMembers, setTeamMembers] = useState('');
  const [teamSize, setTeamSize] = useState('1');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEventAndAttendance();
    }
  }, [id, user]);

  const fetchEventAndAttendance = async () => {
    try {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData as Event);

      if (user) {
        const { data: attendanceData } = await supabase
          .from('attendances')
          .select('*')
          .eq('event_id', id)
          .eq('user_id', user.id)
          .maybeSingle();

        setAttendance(attendanceData);

        const { data: registrationData } = await supabase
          .from('event_registrations' as any)
          .select('*')
          .eq('event_id', id)
          .eq('user_id', user.id)
          .maybeSingle();

        setRegistration(registrationData as any);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load event');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File, bucket: string, folder: string) => {
    const fileExt = file.name.split('.').pop();
    let fileName;
    if (bucket === 'registration-proofs') {
      fileName = `${user!.id}/${folder}/${Date.now()}.${fileExt}`;
    } else {
      fileName = `${folder}/${user!.id}/${Date.now()}.${fileExt}`;
    }

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleCheckIn = async () => {
    if (!user || !event) return;

    if (!selfieFile) {
      toast.error('Please upload a selfie to check in');
      return;
    }

    setUploading(true);

    try {
      // Upload selfie
      const selfieUrl = await uploadFile(selfieFile, 'event-selfies', event.id);

      // Upload certificate if provided
      let certificateUrl = null;
      if (certificateFile) {
        certificateUrl = await uploadFile(certificateFile, 'event-certificates', event.id);
      }

      // Create or update attendance
      const { error } = await supabase
        .from('attendances')
        .upsert({
          event_id: event.id,
          user_id: user.id,
          check_in_time: new Date().toISOString(),
          selfie_url: selfieUrl,
          certificate_url: certificateUrl,
          status: 'pending',
        });

      if (error) throw error;

      toast.success('Check-in successful! Waiting for admin approval.');
      setShowCheckInDialog(false);
      fetchEventAndAttendance();
    } catch (error: any) {
      toast.error(error.message || 'Failed to check in');
    } finally {
      setUploading(false);
    }
  };

  const handleRegister = async () => {
    if (!user || !event) return;

    if (!proofFile) {
      toast.error('Please upload a registration proof');
      return;
    }

    setUploading(true);

    try {
      // Upload proof
      const proofUrl = await uploadFile(proofFile, 'registration-proofs', event.id);

      // Create registration
      const { error } = await supabase
        .from('event_registrations' as any)
        .insert({
          event_id: event.id,
          user_id: user.id,
          proof_url: proofUrl,
          team_members: teamMembers,
          team_size: parseInt(teamSize) || 1,
          status: 'pending',
        });

      if (error) throw error;

      toast.success('Registration successful! Waiting for approval.');
      setShowRegisterDialog(false);
      fetchEventAndAttendance();
    } catch (error: any) {
      console.error('Registration Error:', error);
      toast.error(error.message || 'Failed to register');
    } finally {
      setUploading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!user || !event || !attendance) return;

    try {
      const { error } = await supabase
        .from('attendances')
        .update({ check_out_time: new Date().toISOString() })
        .eq('id', attendance.id);

      if (error) throw error;

      toast.success('Check-out successful!');
      fetchEventAndAttendance();
    } catch (error: any) {
      toast.error(error.message || 'Failed to check out');
    }
  };

  const isEventLive = () => {
    if (!event) return false;
    const now = new Date();
    return isWithinInterval(now, {
      start: new Date(event.start_time),
      end: new Date(event.end_time),
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
      approved: { label: 'Approved', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="animate-pulse">
          <div className="h-64 bg-muted"></div>
        </Card>
      </div>
    );
  }

  if (!event) return null;

  const statusBadge = attendance ? getStatusBadge(attendance.status) : (registration ? getStatusBadge(registration.status) : null);
  const StatusIcon = statusBadge?.icon;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate('/events')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Events
      </Button>

      {/* Event Banner */}
      <Card className="shadow-medium overflow-hidden">
        <div className="aspect-video bg-gradient-subtle">
          {event.banner_image_url ? (
            <img
              src={event.banner_image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Calendar className="w-24 h-24 text-muted-foreground" />
            </div>
          )}
        </div>

        <CardContent className="pt-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
            <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Start Time</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(event.start_time), 'MMM dd, yyyy • h:mm a')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">End Time</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(event.end_time), 'MMM dd, yyyy • h:mm a')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg sm:col-span-2">
              <MapPin className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Location</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">{event.location_name}</p>
                  {event.location_link && (
                    <a
                      href={event.location_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                    >
                      (View Map)
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Registration Status */}
          {registration && !attendance && (
            <Card className="bg-secondary/30 border-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {StatusIcon && <StatusIcon className="w-5 h-5" />}
                  Registration Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge variant="outline" className={statusBadge?.color}>
                  {statusBadge?.label}
                </Badge>
                {registration.status === 'pending' && (
                  <p className="text-sm text-muted-foreground">
                    Your registration proof is under review.
                  </p>
                )}
                {registration.status === 'approved' && (
                  <p className="text-sm text-muted-foreground">
                    Your registration is approved! You can check in when the event starts.
                  </p>
                )}
                {registration.status === 'rejected' && (
                  <p className="text-sm text-red-600">
                    Your registration was rejected. Please contact the admin.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Attendance Status */}
          {attendance && (
            <Card className="bg-secondary/30 border-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {StatusIcon && <StatusIcon className="w-5 h-5" />}
                  Attendance Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge variant="outline" className={statusBadge.color}>
                  {statusBadge.label}
                </Badge>

                {attendance.check_in_time && (
                  <div>
                    <p className="text-sm font-semibold">Checked In</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(attendance.check_in_time), 'MMM dd, yyyy • h:mm a')}
                    </p>
                  </div>
                )}

                {attendance.check_out_time && (
                  <div>
                    <p className="text-sm font-semibold">Checked Out</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(attendance.check_out_time), 'MMM dd, yyyy • h:mm a')}
                    </p>
                  </div>
                )}

                {/* Generate LinkedIn Post Button for Approved Attendance */}
                {attendance.status === 'approved' && (
                  <Button
                    variant="outline"
                    className="w-full mt-3"
                    onClick={() => navigate(`/linkedin?eventId=${event.id}`)}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate LinkedIn Post
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Check-in/out Buttons */}
          <div className="flex gap-3">
            {!attendance && isEventLive() && registration?.status === 'approved' && (
              <Button className="flex-1" onClick={() => setShowCheckInDialog(true)}>
                <Camera className="w-4 h-4 mr-2" />
                Check In
              </Button>
            )}

            {!attendance && !registration && (
              <Button className="flex-1" onClick={() => setShowRegisterDialog(true)}>
                <FileText className="w-4 h-4 mr-2" />
                Register for Event
              </Button>
            )}

            {attendance && !attendance.check_out_time && isEventLive() && (
              <Button className="flex-1" onClick={handleCheckOut} variant="outline">
                Check Out
              </Button>
            )}

            {!isEventLive() && !attendance && (
              <div className="flex-1 p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  {isBefore(new Date(), new Date(event.start_time)) && !registration
                    ? 'Register now to participate!'
                    : isBefore(new Date(), new Date(event.start_time))
                      ? 'Event has not started yet'
                      : 'This event has ended'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Check-in Dialog */}
      <Dialog open={showCheckInDialog} onOpenChange={setShowCheckInDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Check In to Event</DialogTitle>
            <DialogDescription>
              Upload a selfie to confirm your attendance. You can also upload a participation certificate if available.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="selfie">Selfie (Required) *</Label>
              <Input
                id="selfie"
                type="file"
                accept="image/*"
                onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
                required
              />
              <p className="text-sm text-muted-foreground">
                Take a selfie at the event venue
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="certificate">Participation Certificate (Optional)</Label>
              <Input
                id="certificate"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
              />
              <p className="text-sm text-muted-foreground">
                Upload your certificate if you have one
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                📍 Simulated Check-in: No real location tracking. Just confirm you're at the venue.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCheckInDialog(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button onClick={handleCheckIn} disabled={uploading || !selfieFile}>
              {uploading ? 'Uploading...' : 'Check In'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Registration Dialog */}
      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Register for Event</DialogTitle>
            <DialogDescription>
              Upload your registration proof (email/payment screenshot) and list team members if applicable.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="proof">Registration Proof (Screenshot) *</Label>
              <Input
                id="proof"
                type="file"
                accept="image/*"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamSize">Number of Team Members</Label>
              <Input
                id="teamSize"
                type="number"
                min="1"
                placeholder="1"
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team">Team Members Details (USNs / Names)</Label>
              <Input
                id="team"
                placeholder="e.g., 1BN23CS001, 1BN23CS002"
                value={teamMembers}
                onChange={(e) => setTeamMembers(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Leave empty if individual or if details are in the proof
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRegisterDialog(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button onClick={handleRegister} disabled={uploading || !proofFile}>
              {uploading ? 'Uploading...' : 'Submit Registration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventDetail;
