# Challenge App – UI Layer

A production-ready Next.js frontend for a Challenge App where users can join, create, and manage structured challenges (fitness, reading, wellness, productivity).

## Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **State/Auth**: React Context + JWT flow (Mocked)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Forms**: Native React state (extensible to React Hook Form)

## Features & Roles

### 1. Authentication
- Login/Register with mock JWT persistence.
- Role-based redirection after login.
- Protected layouts.

### 2. User Dashboard (Participant)
- Overview of active joined challenges.
- Stats tracking (Points, Active Challenges, Streak).
- Discovery feed for new challenges.

### 3. Organizer Dashboard
- View and manage created challenges.
- Participant approval flow for pending requests.
- Challenge creation wizard.

### 4. Admin Dashboard
- System-wide stats overview.
- User management table with role and status indicators.

### 5. Challenge UI
- **Discovery**: Search and filter available challenges.
- **Details**: View rules, leaderboard, and log activity.
- **Creation**: Multi-step wizard with validation.

## Project Structure

```text
/app
  /auth               # Login/Register/Verify
  /dashboard          # Role-based dashboards
  /challenges         # Discovery, Create, Detail
/components
  /ui                 # Reusable atomic components (Button, Input, Card)
/hooks                # Custom hooks (useAuth)
/services             # API service layer (currently Mock)
/types                # TypeScript definitions
/utils                # Helper functions (cn)
```

## Setup & Running

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Dev Server**:
   ```bash
   npm run dev
   ```

3. **Build for Production**:
   ```bash
   npm run build
   ```

## Backend Integration

The app uses a centralized Axios instance located at `services/axios-instance.ts`.

### 1. Configure the API URL
In development, update `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

### 2. Service Implementation Example
To connect a service to the backend, import `apiClient` and use it within your service methods:

```typescript
import apiClient from './axios-instance';
import { Challenge } from '../types';

export const challengeService = {
  getChallenges: async (): Promise<Challenge[]> => {
    const response = await apiClient.get<Challenge[]>('/challenges');
    return response.data;
  },
};
```

## Deployment (Vercel)

When deploying to Vercel, satisfy the following:

1. **Environment Variables**: Add `NEXT_PUBLIC_API_URL` in the Vercel Dashboard settings (Project Settings > Environment Variables). Set this to your production Spring Boot API URL (e.g., `https://api.yourchallengeapp.com/api/v1`).
2. **CORS**: Ensure your Spring Boot backend allows requests from your Vercel domain (e.g., `https://challenge-app-ui.vercel.app`).
3. **Build Command**: Use `npm run build`.
4. **Output Directory**: `.next`.
