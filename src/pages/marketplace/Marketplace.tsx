import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Package } from 'lucide-react';
import { toast } from 'sonner';
import { ListingCardSkeleton } from '@/components/skeletons/CardSkeletons';

interface Listing {
  id: string;
  title: string;
  description: string;
  category: string;
  images: string[];
  original_price: number;
  expected_price: number;
  condition: string;
  status: string;
  created_at: string;
  seller_id: string;
  profiles: {
    name: string;
  };
}

const Marketplace = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');

  useEffect(() => {
    fetchListings();
  }, [categoryFilter, conditionFilter, sortBy]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('listings')
        .select('*, profiles!seller_id(name)')
        .eq('status', 'active');

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter as any);
      }

      if (conditionFilter !== 'all') {
        query = query.eq('condition', conditionFilter as any);
      }

      if (sortBy === 'price_low') {
        query = query.order('expected_price', { ascending: true });
      } else if (sortBy === 'price_high') {
        query = query.order('expected_price', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
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
    listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.description.toLowerCase().includes(searchQuery.toLowerCase())
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

  const getConditionColor = (condition: string) => {
    const colors: Record<string, string> = {
      new: 'bg-green-100 text-green-700 border-green-200',
      like_new: 'bg-blue-100 text-blue-700 border-blue-200',
      used: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    };
    return colors[condition] || colors.used;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Student Marketplace</h1>
          <p className="text-muted-foreground mt-1">Buy and sell with fellow students</p>
        </div>
        <Button onClick={() => navigate('/marketplace/new')} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          New Listing
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-soft">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search listings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
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

            <Select value={conditionFilter} onValueChange={setConditionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conditions</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="like_new">Like New</SelectItem>
                <SelectItem value="used">Used</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest First</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Listings Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredListings.length === 0 ? (
        <Card className="shadow-soft">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No listings found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery ? 'Try adjusting your search or filters' : 'Be the first to create a listing!'}
            </p>
            <Button onClick={() => navigate('/marketplace/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Listing
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <Card
              key={listing.id}
              className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer group"
              onClick={() => navigate(`/marketplace/${listing.id}`)}
            >
              <div className="aspect-square bg-gradient-subtle rounded-t-lg overflow-hidden">
                {listing.images.length > 0 ? (
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold line-clamp-2 flex-1">{listing.title}</h3>
                </div>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className={getCategoryColor(listing.category)}>
                    {listing.category}
                  </Badge>
                  <Badge variant="outline" className={getConditionColor(listing.condition)}>
                    {listing.condition.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-primary">
                    ₹{listing.expected_price}
                  </span>
                  <span className="text-sm text-muted-foreground line-through">
                    ₹{listing.original_price}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Seller: {listing.profiles.name}
                </p>
              </CardContent>

              <CardFooter>
                <Button className="w-full" size="sm">
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Marketplace;