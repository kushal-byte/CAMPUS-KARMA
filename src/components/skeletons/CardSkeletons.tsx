import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export function ListingCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-3/4" />
        <div className="flex gap-2 mt-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-7 w-20 mb-2" />
        <Skeleton className="h-4 w-28" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  );
}

export function EventCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <CardHeader className="pb-3">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-9 w-full mt-4" />
      </CardContent>
    </Card>
  );
}

export function ProfileSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  );
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className="h-5 w-full" />
        </td>
      ))}
    </tr>
  );
}

export function PostSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </CardFooter>
    </Card>
  );
}
