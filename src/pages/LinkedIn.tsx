import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

const LinkedIn = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">LinkedIn Post Generator</h1>
        <p className="text-muted-foreground mt-1">Create professional posts for your achievements</p>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Post Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">LinkedIn post generation features coming soon!</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LinkedIn;