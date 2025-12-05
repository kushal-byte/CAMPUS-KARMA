import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Calendar, MapPin, Users, Image as ImageIcon, X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface Event {
  id: string;
  title: string;
  description: string;
  location_name: string;
  start_time: string;
  end_time: string;
  banner_image_url?: string;
  attendances: { count: number }[];
}

const AdminEvents = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    registrationLink: '',
    locationName: '',
    latitude: '',
    longitude: '',
    radiusMeters: '100',
    startTime: '',
    endTime: '',
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*, attendances(count)')
        .order('start_time', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return null;

    setUploading(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `events/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('event-selfies')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('event-selfies')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      toast.error('Failed to upload image: ' + error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    setCreating(true);
    try {
      let bannerUrl: string | null = null;
      
      if (imageFile) {
        bannerUrl = await uploadImage();
      }

      const { error } = await supabase.from('events').insert({
        title: form.title,
        description: form.description,
        registration_link: form.registrationLink || null,
        location_name: form.locationName,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        radius_meters: parseInt(form.radiusMeters),
        start_time: form.startTime,
        end_time: form.endTime,
        banner_image_url: bannerUrl,
        created_by_id: user.id,
      });

      if (error) throw error;

      toast.success('Event created successfully!');
      setDialogOpen(false);
      resetForm();
      fetchEvents();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create event');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      locationName: '',
      latitude: '',
      longitude: '',
      radiusMeters: '100',
      startTime: '',
      endTime: '',
    });
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Event Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage campus events & hackathons</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Event / Hackathon</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateEvent} className="space-y-4 mt-4">
              {/* Banner Image Upload */}
              <div className="space-y-2">
                <Label>Banner Image</Label>
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Banner preview"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <Input
                      id="banner-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <Label
                      htmlFor="banner-image"
                      className="flex flex-col items-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Click to upload event banner (max 5MB)
                      </span>
                    </Label>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Campus Hackathon 2025"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  rows={4}
                  placeholder="Describe the event, agenda, prizes (for hackathons), etc."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationLink">Registration Link</Label>
                <Input
                  id="registrationLink"
                  type="url"
                  placeholder="https://forms.google.com/... (optional)"
                  value={form.registrationLink}
                  onChange={(e) => setForm({ ...form, registrationLink: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Add a link for students to register for the event
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="locationName">Location Name *</Label>
                <Input
                  id="locationName"
                  placeholder="e.g., Main Auditorium, Block A"
                  value={form.locationName}
                  onChange={(e) => setForm({ ...form, locationName: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    placeholder="28.6139"
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    placeholder="77.2090"
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="radiusMeters">Geofence Radius (m)</Label>
                  <Input
                    id="radiusMeters"
                    type="number"
                    value={form.radiusMeters}
                    onChange={(e) => setForm({ ...form, radiusMeters: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Date & Time *</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Date & Time *</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={creating || uploading} className="flex-1">
                  {creating || uploading ? 'Creating...' : 'Create Event'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={creating || uploading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-40 bg-muted rounded-t-lg"></div>
              <CardHeader>
                <div className="h-5 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : events.length === 0 ? (
        <Card className="shadow-soft">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No events yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first event or hackathon to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((event) => (
            <Card
              key={event.id}
              className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer overflow-hidden"
              onClick={() => navigate(`/admin/events/${event.id}`)}
            >
              {event.banner_image_url && (
                <div className="relative h-40 bg-muted">
                  <img
                    src={event.banner_image_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {!event.banner_image_url && (
                <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-primary/30" />
                </div>
              )}
              <CardHeader>
                <CardTitle className="line-clamp-2">{event.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div>{format(new Date(event.start_time), 'PPp')}</div>
                    <div className="text-muted-foreground">
                      to {format(new Date(event.end_time), 'PPp')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{event.location_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{event.attendances?.[0]?.count || 0} attendees</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminEvents;