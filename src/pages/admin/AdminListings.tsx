import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Package, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { TableRowSkeleton } from '@/components/skeletons/CardSkeletons';

interface Listing {
  id: string;
  title: string;
  category: string;
  status: string;
  expected_price: number;
  created_at: string;
  profiles: {
    name: string;
    email: string;
  };
}

const AdminListings = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    fetchListings();
  }, [statusFilter, categoryFilter]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('listings')
        .select('*, profiles!seller_id(name, email)')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'active' | 'sold');
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter as 'bag' | 'books' | 'calculator' | 'electronics' | 'others');
      }

      const { data, error } = await query;

      if (error) throw error;
      setListings((data as any) || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter((listing) =>
    listing.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      bag: 'bg-purple-100 text-purple-700 border-purple-200',
      calculator: 'bg-blue-100 text-blue-700 border-blue-200',
      books: 'bg-green-100 text-green-700 border-green-200',
      electronics: 'bg-orange-100 text-orange-700 border-orange-200',
      others: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return colors[category] || colors.others;
  };

  const getStatusColor = (status: string) => {
    return status === 'active'
      ? 'bg-green-100 text-green-700 border-green-200'
      : 'bg-red-100 text-red-700 border-red-200';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Listing Management</h2>
        <p className="text-muted-foreground">Monitor and manage marketplace listings</p>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>All Listings ({filteredListings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search listings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="bag">Bag</SelectItem>
                <SelectItem value="calculator">Calculator</SelectItem>
                <SelectItem value="books">Books</SelectItem>
                <SelectItem value="electronics">Electronics</SelectItem>
                <SelectItem value="others">Others</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TableRowSkeleton key={i} columns={7} />
                ))}
              </TableBody>
            </Table>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No listings found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredListings.map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell className="font-medium max-w-xs truncate">
                        {listing.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getCategoryColor(listing.category)}>
                          {listing.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ₹{listing.expected_price}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{listing.profiles.name}</div>
                          <div className="text-muted-foreground">{listing.profiles.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(listing.status)}>
                          {listing.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(listing.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/marketplace/${listing.id}`)}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
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

export default AdminListings;
