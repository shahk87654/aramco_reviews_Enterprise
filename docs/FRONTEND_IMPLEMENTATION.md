# Frontend Implementation Guide - Aramco Reviews Enterprise

## Overview

This document covers the complete frontend implementation for the Aramco Reviews Enterprise system, including customer review pages, manager dashboards, and admin dashboards.

## Project Structure

```
frontend/src/
├── app/
│   ├── station/
│   │   └── [stationId]/
│   │       ├── page.tsx                 # Station landing page
│   │       ├── review/
│   │       │   └── page.tsx             # Review form
│   │       └── success/
│   │           └── page.tsx             # Success page
│   ├── manager/
│   │   ├── login/
│   │   │   └── page.tsx                 # Manager login
│   │   ├── dashboard/
│   │   │   └── page.tsx                 # Manager dashboard
│   │   ├── reviews/
│   │   │   ├── page.tsx                 # Reviews list
│   │   │   └── [reviewId]/
│   │   │       └── page.tsx             # Review details
│   │   └── ai-summary/
│   │       └── page.tsx                 # AI summary page
│   ├── admin/
│   │   ├── login/
│   │   │   └── page.tsx                 # Admin login
│   │   ├── dashboard/
│   │   │   └── page.tsx                 # Global admin dashboard
│   │   ├── stations/
│   │   │   ├── page.tsx                 # Stations management
│   │   │   └── [id]/
│   │   │       └── form-builder/
│   │   │           └── page.tsx         # Form builder
│   │   ├── managers/
│   │   │   └── page.tsx                 # Managers management
│   │   ├── reviews/
│   │   │   └── page.tsx                 # Global reviews view
│   │   ├── ai-insights/
│   │   │   └── page.tsx                 # AI insights
│   │   └── settings/
│   │       └── page.tsx                 # System settings
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── StarRating.tsx                   # Reusable star rating
│   ├── TopNavigation.tsx                # Navigation bar
│   ├── Alert.tsx                        # Alert component
│   ├── Card.tsx                         # Card wrapper
│   ├── ReviewSubmissionForm.tsx         # Original form (kept for compatibility)
│   ├── ManagerDashboard.tsx             # Original dashboard (kept for compatibility)
│   └── layouts/
│       └── DashboardLayout.tsx          # Dashboard layout wrapper
└── globals.css                           # Global styles with Aramco branding
```

## Key Features Implemented

### 1. Public Customer Review Pages ✅

**Station Landing Page** (`/station/{stationId}`)
- Clean header with station info
- Station photo banner
- "Rate Your Experience" CTA
- Contact information (phone, address)
- Info cards (quick to complete, anonymous, mobile-friendly)

**Review Form Page** (`/station/{stationId}/review`)
- Progress bar showing completion percentage
- Overall experience rating (5-star)
- Category ratings (6 categories):
  - Washroom
  - Staff Behaviour
  - Fuel Quality
  - Cleanliness
  - Convenience Store
  - Safety & Security
- Text feedback (optional)
- Photo upload (up to 5 photos)
- Sticky submit button at bottom
- Mobile-first, touch-friendly design

**Success Page** (`/station/{stationId}/success`)
- Large green checkmark
- Thank you message
- QR code for sharing
- Auto-close in 5 seconds
- Option to close window or go back

### 2. Manager Dashboard ✅

**Manager Login** (`/manager/login`)
- Email/password authentication
- Show/hide password toggle
- Forgot password link
- Demo credentials displayed

**Manager Dashboard** (`/manager/dashboard`)
- Top navigation with manager name
- Station selector dropdown
- Key metrics cards:
  - Average Rating
  - Reviews Today/Week/Month
  - Negative Alerts count
  - Positive sentiment ratio
- Charts:
  - Line graph: Ratings over time
  - Bar chart: Category breakdown
  - Pie chart: Sentiment distribution
  - Progress bars: Review volume
- Recent activity feed

**Reviews List** (`/manager/reviews`)
- Searchable and filterable reviews table
- Filters: date range, rating, sentiment, category, has images
- Review cards showing:
  - Star ratings (large)
  - Category scores
  - Sentiment tag
  - Alert tags
  - Photos indicator
  - Time submitted
- View details button for each review

**Review Details** (`/manager/reviews/{reviewId}`)
- Overall rating display
- Category-by-category breakdown
- Full feedback text
- Photo gallery (lightbox ready)
- AI summary of review
- Detected issues (if any)
- Action buttons:
  - Send Response
  - Mark as Addressed
  - Archive

**AI Summary** (`/manager/ai-summary`)
- Last 7 days analysis
- Key insights cards
- Rating trend chart
- Top complaints list
- Top positive mentions list
- Suggested improvement actions with priority levels

### 3. Admin Dashboard ✅

**Admin Login** (`/admin/login`)
- Similar to manager login
- Admin-specific branding
- Demo credentials

**Global Dashboard** (`/admin/dashboard`)
- Global metrics:
  - Total Reviews (all stations)
  - Global Average Rating
  - Active Stations count
  - Critical Alerts
- Charts:
  - Review trends (volume + rating over time)
  - Regional performance comparison
  - Category performance across stations
- Station Performance Leaderboard:
  - Top 5 stations by rating
  - Station info, reviews count, status badges

**Stations Management** (`/admin/stations`)
- Add new station form
- Stations table with:
  - Name, Code, Region
  - Total reviews, Average rating
  - Assigned manager
  - Edit, Delete, Form Builder buttons
- Search and filter capabilities

**Form Builder** (`/admin/stations/{id}/form-builder`)
- Drag-and-drop interface (ready for enhancement)
- Component library (sidebar):
  - Star rating
  - Category rating
  - Text field
  - Large text
  - Photo upload
  - Dropdown
- Form preview mode
- Field editing (label, required flag)
- Reorder fields (up/down)
- Delete fields
- Save form versioning ready

**Managers Management** (`/admin/managers`)
- Add new manager form
- Manager cards showing:
  - Name, Email
  - Assigned stations
  - Last login
  - Status (active/inactive)
- Actions:
  - Assign stations
  - Toggle status
  - Delete
- Search and filter

**Global Reviews** (`/admin/reviews`)
- All reviews from all stations
- Comprehensive filters:
  - By station
  - By sentiment
  - By rating
  - By date range
- Review cards with full details
- AI flags visible

**AI Insights** (`/admin/ai-insights`)
- System Health Score
- Critical Issues count
- Sentiment ratio
- Top Complaints Analysis (detailed with trends)
- Top Positive Mentions
- Regional Risk Assessment (with risk scores)
- Category Performance Trends
- AI Recommended Actions with:
  - Priority levels (Critical, High, Medium)
  - Specific recommendations
  - Expected impact
  - Expected improvement metrics

**System Settings** (`/admin/settings`)
- Alert Keywords configuration
- Rating rules setup
- Notification settings:
  - Email alerts toggle
  - WhatsApp integration toggle
  - WhatsApp API key management
- Branding settings:
  - Primary color picker
  - Logo URL
- API Keys management:
  - View existing keys
  - Revoke keys
  - Generate new keys

## Shared Components

### TopNavigation
- Responsive navigation bar
- Logo and branding
- Role-based menu items (Manager vs Admin)
- Profile dropdown with logout
- Mobile-friendly menu

### StarRating
- Interactive 5-star rating
- Configurable sizes (sm, md, lg)
- Hover preview
- Disabled state

### Card
- Reusable card wrapper
- Optional hover effect
- Consistent spacing and styling

### Alert
- Three types: error, success, info
- Dismissible option
- Icon indicators
- Color-coded

## Styling & Design

### Aramco Branding
- Primary Color: Green (#16a34a)
- Secondary: Gray scale
- Accent: Amber (for ratings)
- Red (for alerts/negative)

### Responsive Design
- Mobile-first approach
- Full tablet support
- Desktop optimization
- Touch-friendly buttons and inputs
- Optimized spacing for all screen sizes

### Typography
- Bold section headers
- Clean sans-serif (system fonts)
- Text sizes:
  - Headers: text-xl to text-4xl
  - Body: text-base
  - Details: text-sm
  - Labels: text-xs

## Getting Started

### Installation

```bash
cd frontend
npm install
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## API Integration

All components are ready for API integration. Replace mock data with actual API calls:

```typescript
// Example
const response = await axios.get(`/api/stations/${stationId}`, {
  headers: { Authorization: `Bearer ${token}` },
});
```

### Mock Data Locations
- Station landing: `/station/[stationId]/page.tsx` line ~30
- Manager dashboard: `/manager/dashboard/page.tsx` line ~30
- Admin dashboard: `/admin/dashboard/page.tsx` line ~25
- All review lists and detail pages have mock data ready to replace

## Testing Demo URLs

Once running locally:

- **Station Landing**: http://localhost:3000/station/ASS-001
- **Review Form**: http://localhost:3000/station/ASS-001/review
- **Manager Login**: http://localhost:3000/manager/login
- **Manager Dashboard**: http://localhost:3000/manager/dashboard
- **Admin Login**: http://localhost:3000/admin/login
- **Admin Dashboard**: http://localhost:3000/admin/dashboard

## Future Enhancements

1. **Form Builder Drag-Drop**: Implement full drag-and-drop functionality
2. **Real API Integration**: Connect to backend API
3. **Authentication**: Implement NextAuth with actual backend
4. **WebSocket Real-time Updates**: Live review notifications
5. **CSV Export**: Export reviews and reports
6. **Scheduling**: Schedule report generation
7. **Custom Themes**: Allow admin to customize colors
8. **Email Templates**: Customizable alert emails
9. **Multi-language**: i18n support for Arabic/English
10. **Dark Mode**: Theme toggle

## Components Ready for Enhancement

- Form Builder (ready for library integration like react-beautiful-dnd)
- Charts (all using Recharts, ready for more chart types)
- Tables (can add sorting, pagination)
- Modals (Alert component can be extended to Modal)
- Date Pickers (currently basic, can add calendar library)

## Performance Considerations

- All pages use dynamic routes for scalability
- Images are optimized for web
- No blocking operations
- Efficient re-renders with proper state management
- Lazy loading ready

## Accessibility

- Semantic HTML
- ARIA labels ready to add
- Color contrast compliant
- Keyboard navigation support
- Focus management

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

**Last Updated**: January 2024
**Version**: 1.0.0
