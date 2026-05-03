'use client'

import { Card, CardContent, CardHeader, Typography, CircularProgress, Button } from '@mui/material';
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils';
import { Route } from 'next';
import { 
  Compass, 
  DollarSign, 
  Utensils, 
  Trees, 
  ShoppingBag, 
  Landmark, 
  Moon,
  Gauge,
  Users,
  User,
  Heart,
  UserPlus,
  ChevronRight,
  ChevronLeft,
  Check
} from 'lucide-react'
import { postOnboarding } from '@/lib/api';
import Cookies from 'js-cookie';
import type { Budget, Interest, Pace, TravelStyle } from "@/lib/types";

const budgetOptions: { value: Budget; label: string; description: string; icon: React.ReactNode }[] = [
  { value: 'low', label: 'Budget', description: 'Affordable options & local spots', icon: <DollarSign className="h-5 w-5" /> },
  { value: 'medium', label: 'Moderate', description: 'Balance of value & comfort', icon: <><DollarSign className="h-5 w-5" /><DollarSign className="h-5 w-5 -ml-3" /></> },
  { value: 'high', label: 'Luxury', description: 'Premium experiences & venues', icon: <><DollarSign className="h-5 w-5" /><DollarSign className="h-5 w-5 -ml-3" /><DollarSign className="h-5 w-5 -ml-3" /></> },
]

const interestOptions: { value: Interest; label: string; icon: React.ReactNode }[] = [
  { value: 'food', label: 'Food & Dining', icon: <Utensils className="h-5 w-5" /> },
  { value: 'nature', label: 'Nature & Parks', icon: <Trees className="h-5 w-5" /> },
  { value: 'shopping', label: 'Shopping', icon: <ShoppingBag className="h-5 w-5" /> },
  { value: 'culture', label: 'Culture & History', icon: <Landmark className="h-5 w-5" /> },
  { value: 'nightlife', label: 'Nightlife', icon: <Moon className="h-5 w-5" /> },
]

const paceOptions: { value: Pace; label: string; description: string }[] = [
  { value: 'relaxed', label: 'Relaxed', description: '2-3 activities per day' },
  { value: 'balanced', label: 'Balanced', description: '4-5 activities per day' },
  { value: 'packed', label: 'Packed', description: '6+ activities per day' },
]

const travelStyleOptions: { value: TravelStyle; label: string; icon: React.ReactNode }[] = [
  { value: 'solo', label: 'Solo', icon: <User className="h-5 w-5" /> },
  { value: 'couple', label: 'Couple', icon: <Heart className="h-5 w-5" /> },
  { value: 'family', label: 'Family', icon: <Users className="h-5 w-5" /> },
  { value: 'friends', label: 'Friends', icon: <UserPlus className="h-5 w-5" /> },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [budget, setBudget] = useState<Budget | null>(null)
  const [interests, setInterests] = useState<Interest[]>([])
  const [pace, setPace] = useState<Pace | null>(null)
  const [travelStyle, setTravelStyle] = useState<TravelStyle | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const toggleInterest = (interest: Interest) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    )
  }

  const canProceed = () => {
    switch (step) {
      case 1: return budget !== null
      case 2: return interests.length > 0
      case 3: return pace !== null
      case 4: return travelStyle !== null
      default: return false
    }
  }

  const handleComplete = async () => {
    if (!budget || interests.length === 0 || !pace || !travelStyle) return;

    setIsLoading(true);
    setError(null);

    // Read token from cookie
    const token = Cookies.get('token');
    const data = await postOnboarding({ budget, interests, pace, travelStyle }, token);
    setIsLoading(false);

    if (data.error) {
      setError(data.error || "Failed to save preferences");
      return;
    }

    router.push("/dashboard" as Route);
  } 

  return (
    <div className="min-h-svh bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-lg">
              <span role="img" aria-label="logo">🧳</span>
            </div>
            <span className="text-xl font-bold">Smart Trip</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Step {step} of 4</span>
          </div>
        </div>
      </header>
      {/* Progress bar */}
      <div className="w-full bg-muted h-1">
        <div 
          className="bg-primary h-1 transition-all duration-300"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>
      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl border-border/50 shadow-lg">
          {/* Step 1: Budget */}
          {step === 1 && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit mb-4">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>{"What's"} your travel budget?</Typography>
                <Typography variant="body2" color="text.secondary">
                  {"We'll"} recommend places that match your spending preferences
                </Typography>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-3">
                  {budgetOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setBudget(option.value)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                        budget === option.value
                          ? "border-primary bg-gray-300 text-gray-700"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-full",
                        budget === option.value ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                        {option.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{option.label}</div>
                        <div className="text-sm text-muted-foreground">{option.description}</div>
                      </div>
                      {budget === option.value && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </>
          )}
          {/* Step 2: Interests */}
          {step === 2 && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit mb-4">
                  <Landmark className="h-6 w-6 text-primary" />
                </div>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>What are you interested in?</Typography>
                <Typography variant="body2" color="text.secondary">
                  Select all that apply - we&apos;ll use these to personalize your recommendations
                </Typography>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {interestOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => toggleInterest(option.value)}
                      className={cn(
                        "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all",
                        interests.includes(option.value)
                          ? "border-primary bg-gray-300 text-gray-700"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-full",
                        interests.includes(option.value) ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                        {option.icon}
                      </div>
                      <span className="font-medium text-sm">{option.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  {interests.length === 0 ? 'Select at least one interest' : `${interests.length} selected`}
                </p>
              </CardContent>
            </>
          )}
          {/* Step 3: Pace */}
          {step === 3 && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit mb-4">
                  <Gauge className="h-6 w-6 text-primary" />
                </div>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>{"What's"} your travel pace?</Typography>
                <Typography variant="body2" color="text.secondary">
                  How many activities do you like to fit in a day?
                </Typography>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-3">
                  {paceOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setPace(option.value)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                        pace === option.value
                          ? "border-primary bg-gray-300 text-gray-700"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-full text-lg font-bold",
                        pace === option.value ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                        {option.value === 'relaxed' ? '2-3' : option.value === 'balanced' ? '4-5' : '6+'}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{option.label}</div>
                        <div className="text-sm text-muted-foreground">{option.description}</div>
                      </div>
                      {pace === option.value && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </>
          )}
          {/* Step 4: Travel Style */}
          {step === 4 && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>How do you usually travel?</Typography>
                <Typography variant="body2" color="text.secondary">
                  This helps us recommend activities suited for your group
                </Typography>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-3">
                  {travelStyleOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTravelStyle(option.value)}
                      className={cn(
                        "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
                        travelStyle === option.value
                          ? "border-primary bg-gray-300 text-gray-700"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center w-14 h-14 rounded-full",
                        travelStyle === option.value ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                        {option.icon}
                      </div>
                      <span className="font-semibold">{option.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </>
          )}
          {/* Error message */}
          {error && (
            <div className="px-6 pb-4">
              <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg text-center">
                {error}
              </p>
            </div>
          )}
          {/* Navigation */}
          <div className="px-6 pb-6 flex items-center justify-between">
            <Button
              variant="outlined"
              onClick={() => setStep(s => s - 1)}
              disabled={step === 1}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            
            {step < 4 ? (
              <Button
                variant="contained"
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
                className="gap-2"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleComplete}
                disabled={!canProceed() || isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <CircularProgress size={16} />
                    Saving...
                  </>
                ) : (
                  <>
                    Start Exploring
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>
      </main>
    </div>
  )
}
