import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Copy, Save, Sparkles, Loader2, Calendar } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

type PostType = 'hackathon' | 'event' | 'project' | 'achievement';

interface AttendedEvent {
  id: string;
  title: string;
  description: string;
  location_name: string;
  start_time: string;
}

const LinkedIn = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [postType, setPostType] = useState<PostType>('achievement');
  const [details, setDetails] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [generatedPost, setGeneratedPost] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch attended events (approved attendance)
  const { data: attendedEvents } = useQuery({
    queryKey: ['attended-events', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendances')
        .select(`
          event_id,
          events (
            id,
            title,
            description,
            location_name,
            start_time
          )
        `)
        .eq('user_id', user?.id)
        .eq('status', 'approved');
      
      if (error) throw error;
      return data?.map(a => a.events).filter(Boolean) as AttendedEvent[];
    },
    enabled: !!user,
  });

  // Handle URL params for event linking
  useEffect(() => {
    const eventId = searchParams.get('eventId');
    if (eventId && attendedEvents) {
      const event = attendedEvents.find(e => e.id === eventId);
      if (event) {
        setSelectedEventId(eventId);
        setPostType('event');
        setDetails(`Event: ${event.title}\nDate: ${format(new Date(event.start_time), 'MMMM dd, yyyy')}\nLocation: ${event.location_name}\n\nDescription: ${event.description}`);
        setSearchParams({});
      }
    }
  }, [searchParams, attendedEvents]);

  // Handle event selection
  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId);
    if (eventId && attendedEvents) {
      const event = attendedEvents.find(e => e.id === eventId);
      if (event) {
        setPostType('event');
        setDetails(`Event: ${event.title}\nDate: ${format(new Date(event.start_time), 'MMMM dd, yyyy')}\nLocation: ${event.location_name}\n\nDescription: ${event.description}`);
      }
    }
  };

  // Fetch saved posts
  const { data: savedPosts } = useQuery({
    queryKey: ['generated-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generated_posts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Generate post mutation
  const generatePost = async () => {
    if (!details.trim()) {
      toast({
        title: 'Details Required',
        description: 'Please provide details about your achievement',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-linkedin-post', {
        body: { postType, details }
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      setGeneratedPost(data.post);
      toast({
        title: 'Post Generated!',
        description: 'Your LinkedIn post is ready',
      });
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate post',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Save post mutation
  const savePostMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase
        .from('generated_posts')
        .insert({
          user_id: user!.id,
          content,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-posts'] });
      toast({
        title: 'Post Saved',
        description: 'Your post has been saved successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Save Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied!',
        description: 'Post copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">LinkedIn Post Generator</h1>
        <p className="text-muted-foreground mt-1">Create professional posts for your achievements</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Generator Card */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Generate Post
            </CardTitle>
            <CardDescription>
              Select a post type and provide details about your achievement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Event Selector */}
            {attendedEvents && attendedEvents.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="event-select" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Link to Event (Optional)
                </Label>
                <Select value={selectedEventId} onValueChange={handleEventSelect}>
                  <SelectTrigger id="event-select">
                    <SelectValue placeholder="Select an attended event..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None - Custom Post</SelectItem>
                    {attendedEvents.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title} ({format(new Date(event.start_time), 'MMM dd')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select an event you attended to auto-fill details
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="post-type">Post Type</Label>
              <Select value={postType} onValueChange={(value) => setPostType(value as PostType)}>
                <SelectTrigger id="post-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hackathon">🏆 Hackathon</SelectItem>
                  <SelectItem value="event">🎯 Event</SelectItem>
                  <SelectItem value="project">💻 Project</SelectItem>
                  <SelectItem value="achievement">⭐ Achievement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="details">Details</Label>
              <Textarea
                id="details"
                placeholder="Describe your achievement, project, or event participation..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>

            <Button 
              onClick={generatePost} 
              disabled={isGenerating || !details.trim()}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Post
                </>
              )}
            </Button>

            {generatedPost && (
              <div className="space-y-3 pt-4 border-t">
                <Label>Generated Post</Label>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{generatedPost}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(generatedPost)}
                    className="flex-1"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    onClick={() => savePostMutation.mutate(generatedPost)}
                    disabled={savePostMutation.isPending}
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Saved Posts Card */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Saved Posts
            </CardTitle>
            <CardDescription>
              Your previously generated posts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {savedPosts && savedPosts.length > 0 ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {savedPosts.map((post) => (
                  <div key={post.id} className="bg-muted p-4 rounded-lg space-y-2">
                    <p className="text-sm whitespace-pre-wrap line-clamp-4">{post.content}</p>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(post.content)}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                      <span className="text-xs text-muted-foreground ml-auto self-center">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No saved posts yet. Generate your first post!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LinkedIn;
