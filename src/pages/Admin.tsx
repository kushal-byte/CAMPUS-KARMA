import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, Users, ShoppingBag, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AdminDashboard from './admin/AdminDashboard';
import AdminUsers from './admin/AdminUsers';
import AdminListings from './admin/AdminListings';
import AdminEvents from './admin/AdminEvents';

const Admin = () => {
  const { isStaff } = useAuth();
  const [activeTab, setActiveTab] = useState(isStaff ? 'events' : 'dashboard');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Portal</h1>
        <p className="text-muted-foreground mt-1">Manage your Campus Karma platform</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {!isStaff && (
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-muted">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="listings" className="gap-2">
              <ShoppingBag className="w-4 h-4" />
              Listings
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2">
              <Calendar className="w-4 h-4" />
              Events
            </TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="dashboard">
          <AdminDashboard />
        </TabsContent>

        <TabsContent value="users">
          <AdminUsers />
        </TabsContent>

        <TabsContent value="listings">
          <AdminListings />
        </TabsContent>

        <TabsContent value="events">
          <AdminEvents />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;