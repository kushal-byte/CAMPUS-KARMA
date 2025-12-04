import { ReactNode, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PageTransition from '@/components/PageTransition';
import { NavLink } from '@/components/NavLink';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Menu, 
  Home, 
  ShoppingBag, 
  Calendar, 
  FileText, 
  User, 
  ShieldCheck,
  LogOut,
  GraduationCap
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { profile, signOut, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: ShoppingBag, label: 'Marketplace', path: '/marketplace' },
    { icon: Calendar, label: 'Events', path: '/events' },
    { icon: FileText, label: 'LinkedIn Assistant', path: '/linkedin' },
    { icon: User, label: 'Profile', path: '/profile' },
    ...(isAdmin ? [{ icon: ShieldCheck, label: 'Admin', path: '/admin' }] : []),
  ];

  const NavLinks = ({ mobile = false }) => (
    <>
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all hover:bg-muted ${
            mobile ? 'text-base' : 'text-sm'
          }`}
          activeClassName="gradient-primary text-primary-foreground shadow-orange"
          onClick={() => mobile && setMobileMenuOpen(false)}
        >
          <item.icon className="w-5 h-5" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-sm shadow-soft">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full gradient-primary shadow-orange">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Campus Karma</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLinks />
            </nav>

            {/* Theme Toggle, Profile & Logout */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Avatar className="w-9 h-9 border-2 border-primary ring-2 ring-primary/20">
                <AvatarFallback className="bg-gray-900 text-orange-500 font-semibold">
                  {profile?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="hidden md:flex hover:bg-destructive/10 hover:text-destructive"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-card border-l border-border">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <Avatar className="w-12 h-12 border-2 border-primary ring-2 ring-primary/20">
                      <AvatarFallback className="bg-gray-900 text-orange-500 font-semibold text-lg">
                        {profile?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{profile?.name}</p>
                      <p className="text-sm text-muted-foreground">{profile?.email}</p>
                    </div>
                  </div>

                  <nav className="flex-1 flex flex-col gap-1">
                    <NavLinks mobile />
                  </nav>

                  <Button
                    variant="outline"
                    className="w-full mt-auto border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full">
        <div className="container max-w-7xl mx-auto p-4 md:p-6">
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </main>
    </div>
  );
};

export default AppLayout;