import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Package, ShoppingCart, Check, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Listing {
  id: string;
  title: string;
  description: string;
  category: string;
  meetup_location?: string;
  mobile?: string;
  images: string[];
  original_price: number;
  expected_price: number;
  condition: string;
  status: string;
  created_at: string;
  seller_id: string;
  profiles: {
    name: string;
    email: string;
    college?: string;
    branch?: string;
  };
}

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchListing();
    }
  }, [id]);

  const fetchListing = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*, profiles!seller_id(name, email, college, branch)')
        .eq('id', id)
        .single();

      if (error) throw error;
      setListing(data as any);
      setLoading(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load listing');
      navigate('/marketplace');
    }
  };

  const handleInterest = () => {
    if (!user) {
      toast.error('Please sign in to view purchase details');
      return;
    }
    setShowLocationDialog(true);
  };

  const handleMarkAsSold = async () => {
    if (!listing || !user) return;
    setProcessingAction(true);

    try {
      const { error } = await supabase
        .from('listings')
        .update({ status: 'sold' })
        .eq('id', listing.id);

      if (error) throw error;

      toast.success('Listing marked as sold!');
      setListing({ ...listing, status: 'sold' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDelete = async () => {
    if (!listing) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listing.id);

      if (error) throw error;

      toast.success('Listing deleted successfully');
      navigate('/marketplace');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete listing');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

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

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="animate-pulse">
          <div className="h-96 bg-muted"></div>
        </Card>
      </div>
    );
  }

  if (!listing) {
    return null;
  }

  const isOwner = user?.id === listing.seller_id;
  const isAdmin = profile?.role === 'ADMIN';
  const isSold = listing.status === 'sold';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate('/marketplace')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Marketplace
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image Gallery */}
        <div className="space-y-4">
          <Card className="shadow-medium overflow-hidden">
            <div className="aspect-square bg-gradient-subtle">
              {listing.images.length > 0 ? (
                <img
                  src={listing.images[selectedImage]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-24 h-24 text-muted-foreground" />
                </div>
              )}
            </div>
          </Card>

          {listing.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {listing.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                    }`}
                >
                  <img
                    src={image}
                    alt={`${listing.title} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Listing Details */}
        <div className="space-y-6">
          <Card className="shadow-medium">
            <CardContent className="pt-6 space-y-4">
              <div>
                <h1 className="text-3xl font-bold mb-3">{listing.title}</h1>
                <div className="flex gap-2 mb-4">
                  <Badge variant="outline" className={getCategoryColor(listing.category)}>
                    {listing.category}
                  </Badge>
                  <Badge variant="outline" className={getConditionColor(listing.condition)}>
                    {listing.condition.replace('_', ' ')}
                  </Badge>
                  {isSold && (
                    <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                      SOLD
                    </Badge>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-4xl font-bold text-primary">
                    ₹{listing.expected_price}
                  </span>
                  <span className="text-xl text-muted-foreground line-through">
                    ₹{listing.original_price}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Save ₹{listing.original_price - listing.expected_price} (
                  {Math.round(((listing.original_price - listing.expected_price) / listing.original_price) * 100)}% off)
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{listing.description}</p>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground">
                  Listed on {format(new Date(listing.created_at), 'MMM dd, yyyy')}
                </p>
              </div>

              {!isOwner && !isSold && (
                <Button className="w-full" size="lg" onClick={handleInterest}>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  I'm Interested
                </Button>
              )}

              {isOwner && !isSold && (
                <Button
                  className="w-full mb-3"
                  size="lg"
                  onClick={handleMarkAsSold}
                  disabled={processingAction}
                >
                  <Check className="w-5 h-5 mr-2" />
                  Mark as Sold
                </Button>
              )}

              {isOwner && (
                <div className="bg-secondary/50 rounded-lg p-4">
                  <p className="text-sm text-secondary-foreground">
                    This is your listing. You cannot purchase it.
                  </p>
                </div>
              )}

              {isSold && !isOwner && (
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    This item has been sold.
                  </p>
                </div>
              )}

              {/* Delete Button for Owner or Admin */}
              {(isOwner || isAdmin) && (
                <Button
                  variant="destructive"
                  className="w-full mt-2"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Listing
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Seller Info */}
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Sold by</h3>
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12 border-2 border-primary">
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-lg">
                    {listing.profiles.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{listing.profiles.name}</p>
                  <p className="text-sm text-muted-foreground">{listing.profiles.email}</p>
                  {listing.profiles.college && (
                    <p className="text-sm text-muted-foreground">{listing.profiles.college}</p>
                  )}
                  {listing.profiles.branch && (
                    <p className="text-sm text-muted-foreground">{listing.profiles.branch}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Location Dialog */}
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Purchase Instructions</DialogTitle>
            <DialogDescription>
              Please meet the seller at the designated location to complete the purchase.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price to Pay (Cash):</span>
                <span className="font-bold text-primary">₹{listing.expected_price}</span>
              </div>
              <Separator />
              <div>
                <span className="text-muted-foreground block mb-1">Meetup Location:</span>
                <p className="font-medium text-foreground">
                  {listing.meetup_location || 'Contact seller for location'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Seller Contact:</span>
                <p className="font-medium text-foreground">
                  {listing.profiles.email}
                  {listing.mobile && (
                    <span className="block text-sm text-muted-foreground mt-1">
                      Phone: {listing.mobile}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm">
              <p>Note: Inspect the item before paying. This transaction is offline.</p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowLocationDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the listing and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ListingDetail;
