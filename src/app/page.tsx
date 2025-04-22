import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-surface">
      <div className="max-w-5xl w-full text-center space-y-10">
        <div className="space-y-5 animate-gentle-slide">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Split<span className="text-primary">Squad</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            The simplest way to split expenses with friends and family
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card
            className="card-hover-effect border border-gray-200 shadow-sm animate-subtle-scale"
            style={{ animationDelay: '100ms' }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <rect width="16" height="20" x="4" y="2" rx="2"></rect>
                    <path d="M8 10h8"></path>
                    <path d="M8 14h8"></path>
                    <path d="M8 18h5"></path>
                  </svg>
                </span>
                Track Expenses
              </CardTitle>
              <CardDescription>Easily log and categorize shared expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-center justify-center bg-gray-50 rounded-md overflow-hidden">
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent"></div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary/60 relative z-10"
                  >
                    <rect width="16" height="20" x="4" y="2" rx="2"></rect>
                    <path d="M8 10h8"></path>
                    <path d="M8 14h8"></path>
                    <path d="M8 18h5"></path>
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="card-hover-effect border border-gray-200 shadow-sm animate-subtle-scale"
            style={{ animationDelay: '200ms' }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M3 12h18"></path>
                    <path d="M3 18h18"></path>
                    <path d="M19 6v12"></path>
                    <path d="M5 6v12"></path>
                  </svg>
                </span>
                Split Fairly
              </CardTitle>
              <CardDescription>Divide expenses equally or custom shares</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-center justify-center bg-gray-50 rounded-md overflow-hidden">
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent"></div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary/60 relative z-10"
                  >
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M3 12h18"></path>
                    <path d="M3 18h18"></path>
                    <path d="M19 6v12"></path>
                    <path d="M5 6v12"></path>
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="card-hover-effect border border-gray-200 shadow-sm animate-subtle-scale"
            style={{ animationDelay: '300ms' }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
                    <path d="M12 17V7"></path>
                  </svg>
                </span>
                Settle Balances
              </CardTitle>
              <CardDescription>See who owes what with smart balance calculation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-center justify-center bg-gray-50 rounded-md overflow-hidden">
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent"></div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary/60 relative z-10"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
                    <path d="M12 17V7"></path>
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div
          className="flex flex-col sm:flex-row gap-4 justify-center pt-6 animate-gentle-slide"
          style={{ animationDelay: '400ms' }}
        >
          <Button
            asChild
            size="lg"
            className="text-lg gradient-primary hover:opacity-90 focus-ring shadow-md shadow-primary/20"
          >
            <Link href="/dashboard">Get Started</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="text-lg border-gray-300 hover:bg-gray-50 focus-ring"
          >
            <Link href="/about">Learn More</Link>
          </Button>
        </div>

        <div
          className="pt-10 text-xs text-gray-500 animate-soft-fade"
          style={{ animationDelay: '600ms' }}
        >
          <p>Simplify expense sharing with friends, roommates, and travel groups</p>
        </div>
      </div>
    </main>
  );
}
