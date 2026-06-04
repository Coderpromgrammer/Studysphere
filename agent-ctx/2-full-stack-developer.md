---
Task ID: 2
Agent: full-stack-developer
Task: Rebuild StudySphere with AI Quiz Maker, Clerk auth, remove focus/journal/grain

Work Log:
- Deleted /api/focus/route.ts, /api/journal/route.ts, /api/auth/route.ts (old features removed)
- Updated Prisma schema: removed JournalEntry and FocusSession models, added Quiz and QuizQuestion models, added clerkId to User model
- Installed @clerk/nextjs package
- Created .env.local with Clerk keys (publishable + secret)
- Created src/middleware.ts with Clerk middleware (public routes: /, /sign-in, /sign-up, /api/*)
- Updated src/app/layout.tsx: wrapped with ClerkProvider, removed grain-overlay div
- Created src/app/sign-in/[[...sign-in]]/page.tsx with Clerk's default SignIn component
- Created src/app/sign-up/[[...sign-up]]/page.tsx with Clerk's default SignUp component
- Created src/app/api/quiz/route.ts (GET, POST, DELETE, PATCH for quizzes)
- Created src/app/api/quiz/generate/route.ts (AI-powered quiz generation via z-ai-web-dev-sdk)
- Created src/app/api/user/sync/route.ts (syncs Clerk users to our DB via upsert)
- Rebuilt src/app/page.tsx with new tabs: Dashboard, Quiz Maker, AI Chat, Profile
- Dashboard: shows quiz stats, mood check-in, recent quizzes, motivational quotes
- Quiz Maker: AI-powered quiz generation with topic/difficulty/count selectors, quiz-taking interface with scoring, quiz history
- AI Chat: kept existing chat panel, updated to use Clerk userId
- Profile: shows Clerk user info, preferences, study style, UserButton for account management
- Landing page: shown for unauthenticated users with sign-in button via SignInButton
- Ran Prisma db push with force-reset to apply new schema
- Fixed ESLint errors: moved fetchQuizHistory to useCallback, restructured user sync to avoid setState-in-effect issues
- All API routes tested and working (user sync, mood, chat, quiz)
- Lint passes with only 1 warning (custom font loading)

Stage Summary:
- StudySphere rebuilt with AI Quiz Maker as main feature
- Clerk authentication replaces custom auth (SignIn/SignUp pages with default UI)
- Focus and Journal features completely removed
- Grain overlay removed from layout
- New Prisma schema with Quiz/QuizQuestion models
- User sync API for Clerk-to-DB mapping
- All API routes functional and tested
- App running on port 3000 with 200 status
