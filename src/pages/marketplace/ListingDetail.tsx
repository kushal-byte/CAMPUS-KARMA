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
import { ArrowLeft, Package, ShoppingCart, Check } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
    email: string;
    college?: string;
    branch?: string;
  };
}

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);

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

  const handleBuyNow = () => {
    if (!user) {
      toast.error('Please sign in to make a purchase');
      return;
    }

    if (listing?.seller_id === user.id) {
      toast.error('You cannot buy your own listing');
      return;
    }

    setShowPaymentDialog(true);
  };

  const handleConfirmPayment = async () => {
    if (!listing || !user) return;

    setProcessingPayment(true);

    try {
      // Create transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          listing_id: listing.id,
          buyer_id: user.id,
          amount: listing.expected_price,
          status: 'pending',
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      setTransactionId(transaction.id);
      toast.success('Transaction created! Complete payment to finalize.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create transaction');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!transactionId || !listing) return;

    setProcessingPayment(true);

    try {
      // Update transaction status to paid
      const { error: transactionError } = await supabase
        .from('transactions')
        .update({ status: 'paid' })
        .eq('id', transactionId);

      if (transactionError) throw transactionError;

      // Update listing status to sold and set buyer
      const { error: listingError } = await supabase
        .from('listings')
        .update({ status: 'sold', buyer_id: user?.id })
        .eq('id', listing.id);

      if (listingError) throw listingError;

      toast.success('Payment successful! This item is now yours.');
      setShowPaymentDialog(false);
      navigate('/profile');
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete payment');
    } finally {
      setProcessingPayment(false);
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
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index
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
                <Button className="w-full" size="lg" onClick={handleBuyNow}>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Buy Now
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
            </CardContent>
          </Card>

          {/* Seller Info */}
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Seller Information</h3>
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

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {transactionId ? 'Complete Payment' : 'Confirm Purchase'}
            </DialogTitle>
            <DialogDescription>
              {transactionId
                ? 'Click "Mark as Paid" to simulate payment completion.'
                : 'Review your purchase details before proceeding.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!transactionId ? (
              <>
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Item:</span>
                    <span className="font-semibold">{listing.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Seller:</span>
                    <span className="font-semibold">{listing.profiles.name}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-primary">₹{listing.expected_price}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  This is a simulated transaction. No real payment will be processed.
                </p>
              </>
            ) : (
              <div className="space-y-4">
                <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 flex items-start gap-3">
                  <Check className="w-5 h-5 text-accent mt-0.5" />
                  <div>
                    <p className="font-semibold text-accent">Transaction Created</p>
                    <p className="text-sm text-muted-foreground">
                      Your transaction is pending. Click "Mark as Paid" to complete the purchase.
                    </p>
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm font-mono text-muted-foreground">
                    Transaction ID: {transactionId.substring(0, 8)}...
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            {!transactionId ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowPaymentDialog(false)}
                  disabled={processingPayment}
                >
                  Cancel
                </Button>
                <Button onClick={handleConfirmPayment} disabled={processingPayment}>
                  {processingPayment ? 'Processing...' : 'Create Transaction'}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowPaymentDialog(false)}
                  disabled={processingPayment}
                >
                  Cancel
                </Button>
                <Button onClick={handleMarkAsPaid} disabled={processingPayment} className="bg-accent hover:bg-accent-hover">
                  {processingPayment ? 'Processing...' : 'Mark as Paid'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ListingDetail;
