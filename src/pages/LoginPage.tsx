import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { FileText, Chrome } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const { user, signInWithGoogle, isLoading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in failed:', error);
    } finally {
      setIsSigningIn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-secondary">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-secondary px-4">
      <div className="w-full max-w-md">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-primary mb-4">
            <FileText className="h-8 w-8 text-white" />
          </div>

          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            CollabEdit
          </h1>

          <p className="text-muted-foreground mt-2">
            Real-time collaborative text editor
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome back</CardTitle>

            <p className="text-muted-foreground">
              Sign in to start collaborating on documents
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
              size="lg"
            >
              <Chrome className="h-5 w-5 mr-2" />
              {isSigningIn ? 'Signing in...' : 'Continue with Google'}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              By signing in, you agree to our{' '}
              <a href="#" className="text-primary hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-primary hover:underline">
                Privacy Policy
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 text-center">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="p-4 rounded-lg bg-background/50">
              <div className="font-semibold text-foreground">Real-time</div>
              <div className="text-muted-foreground">Collaborate instantly</div>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <div className="font-semibold text-foreground">Offline</div>
              <div className="text-muted-foreground">Work anywhere</div>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <div className="font-semibold text-foreground">Secure</div>
              <div className="text-muted-foreground">Your data is safe</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}