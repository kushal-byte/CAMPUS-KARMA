import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, Calendar, FileText, GraduationCap } from 'lucide-react';


const Home = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const features = [
    {
      icon: ShoppingBag,
      title: 'Student Marketplace',
      description: 'Buy and sell textbooks, calculators, and more',
      path: '/marketplace',
      color: 'text-primary',
    },
    {
      icon: Calendar,
      title: 'Event Attendance',
      description: 'Check in to campus events and track participation',
      path: '/events',
      color: 'text-accent',
    },
    {
      icon: FileText,
      title: 'LinkedIn Assistant',
      description: 'Generate professional posts for your achievements',
      path: '/linkedin',
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="space-y-8">

      <div className="text-center py-12 gradient-subtle rounded-2xl shadow-soft">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary mb-6">
          <GraduationCap className="w-12 h-12 text-primary-foreground" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Welcome back, {profile?.name}! 👋
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Your all-in-one platform for campus marketplace, event tracking, and professional networking
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Card
            key={feature.path}
            className="shadow-soft hover:shadow-medium transition-all duration-300 cursor-pointer group hover:bg-black dark:hover:bg-white"
            onClick={() => navigate(feature.path)}
          >
            <CardHeader>
              <feature.icon className={`w-12 h-12 mb-4 ${feature.color} group-hover:scale-110 transition-transform`} />
              <CardTitle className="group-hover:text-white dark:group-hover:text-black transition-colors">
                {feature.title}
              </CardTitle>
              <CardDescription className="group-hover:text-gray-300 dark:group-hover:text-gray-600 transition-colors">
                {feature.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full group-hover:bg-white group-hover:text-black dark:group-hover:bg-black dark:group-hover:text-white transition-colors"
              >
                Explore →
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Home;