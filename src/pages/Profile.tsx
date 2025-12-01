import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const Profile = () => {
  const { profile } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Card className="shadow-medium">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20 border-4 border-primary">
              <AvatarFallback className="bg-secondary text-secondary-foreground text-2xl">
                {profile?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{profile?.name}</CardTitle>
              <p className="text-muted-foreground">{profile?.email}</p>
              <Badge variant="outline" className="mt-2">{profile?.role}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile?.college && <div><span className="font-semibold">College:</span> {profile.college}</div>}
          {profile?.branch && <div><span className="font-semibold">Branch:</span> {profile.branch}</div>}
          {profile?.year && <div><span className="font-semibold">Year:</span> {profile.year}</div>}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;