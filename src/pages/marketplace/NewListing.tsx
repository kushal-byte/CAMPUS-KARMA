import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload } from 'lucide-react';
import { toast } from 'sonner';

const NewListing = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'others',
    originalPrice: '',
    expectedPrice: '',
    condition: 'used',
    imageUrls: [''],
  });

  const handleImageUrlChange = (index: number, value: string) => {
    const newUrls = [...form.imageUrls];
    newUrls[index] = value;
    setForm({ ...form, imageUrls: newUrls });
  };

  const addImageUrlField = () => {
    if (form.imageUrls.length < 4) {
      setForm({ ...form, imageUrls: [...form.imageUrls, ''] });
    }
  };

  const removeImageUrlField = (index: number) => {
    const newUrls = form.imageUrls.filter((_, i) => i !== index);
    setForm({ ...form, imageUrls: newUrls.length > 0 ? newUrls : [''] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !profile) {
      toast.error('You must be logged in to create a listing');
      return;
    }

    const originalPrice = parseFloat(form.originalPrice);
    const expectedPrice = parseFloat(form.expectedPrice);

    if (isNaN(originalPrice) || isNaN(expectedPrice)) {
      toast.error('Please enter valid prices');
      return;
    }

    if (expectedPrice > originalPrice) {
      toast.error('Expected price cannot be higher than original price');
      return;
    }

    setLoading(true);

    try {
      const imageUrls = form.imageUrls.filter(url => url.trim() !== '');

      // First, ensure the profile exists
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError || !existingProfile) {
        // Create profile if it doesn't exist
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            role: 'STUDENT'
          });

        if (createProfileError) {
          console.error('Profile creation error:', createProfileError);
          toast.error('Failed to create user profile. Please try again.');
          return;
        }
      }

      const { error } = await supabase.from('listings').insert({
        title: form.title,
        description: form.description,
        category: form.category as any,
        original_price: originalPrice,
        expected_price: expectedPrice,
        condition: form.condition as any,
        images: imageUrls,
        seller_id: user.id,
      });

      if (error) throw error;

      toast.success('Listing created successfully!');
      navigate('/marketplace');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate('/marketplace')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Marketplace
      </Button>

      <div>
        <h1 className="text-3xl font-bold">Create New Listing</h1>
        <p className="text-muted-foreground mt-1">List your items for sale</p>
      </div>

      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>Listing Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Scientific Calculator TI-84"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your item, its condition, and why you're selling..."
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bag">Bag</SelectItem>
                    <SelectItem value="calculator">Calculator</SelectItem>
                    <SelectItem value="books">Books</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Condition *</Label>
                <Select value={form.condition} onValueChange={(value) => setForm({ ...form, condition: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="like_new">Like New</SelectItem>
                    <SelectItem value="used">Used</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="originalPrice">Original Price (₹) *</Label>
                <Input
                  id="originalPrice"
                  type="number"
                  step="0.01"
                  placeholder="1500"
                  value={form.originalPrice}
                  onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedPrice">Expected Price (₹) *</Label>
                <Input
                  id="expectedPrice"
                  type="number"
                  step="0.01"
                  placeholder="1200"
                  value={form.expectedPrice}
                  onChange={(e) => setForm({ ...form, expectedPrice: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Image URLs (Optional)</Label>
              {form.imageUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={url}
                    onChange={(e) => handleImageUrlChange(index, e.target.value)}
                  />
                  {form.imageUrls.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeImageUrlField(index)}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
              {form.imageUrls.length < 4 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addImageUrlField}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Add Another Image URL
                </Button>
              )}
              <p className="text-sm text-muted-foreground">
                You can add up to 4 image URLs
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Creating...' : 'Create Listing'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/marketplace')}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewListing;