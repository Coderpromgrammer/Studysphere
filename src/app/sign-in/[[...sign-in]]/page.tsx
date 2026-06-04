import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-softly-bg relative overflow-hidden">
      <div className="absolute top-10 left-[5%] w-72 h-72 bg-softly-coral/15 blob-shape blur-3xl animate-softly-float" />
      <div className="absolute top-40 right-[10%] w-56 h-56 bg-softly-lavender/25 blob-shape blur-3xl animate-softly-float" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-20 left-[30%] w-64 h-64 bg-softly-sage/25 blob-shape blur-3xl animate-softly-float" style={{ animationDelay: '4s' }} />
      <div className="relative z-10">
        <SignIn />
      </div>
    </div>
  )
}
