# Bloomberg-lite Trading UI

A responsive React web application with a professional trading interface featuring dark theme, dense tables, real-time data displays, and comprehensive API integration.

## Features

- **Dark Theme**: Professional Bloomberg-inspired dark UI
- **Sidebar Navigation**: Easy access to Dashboard, Positions, Orders, Watch List, Analytics, and Settings
- **Status Bar**: Displays "Paper Trading" mode indicator and connection status
- **Dense Tables**: Efficient data display for positions, orders, and market watch lists
- **Loading States**: Smooth loading spinners for all async operations
- **Empty States**: User-friendly messages when no data is available
- **Toast Notifications**: Success and error messages for user feedback
- **Responsive Design**: Adapts to desktop, tablet, and mobile screens
- **Centralized API**: All API calls managed through `/src/lib/api.ts`

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# API Base URL
VITE_API_BASE=https://api.example.com

# Authentication Token (sent as X-Auth-Token header)
VITE_AUTH_TOKEN=your-auth-token-here
```

See `.env.example` for reference.

## Project Structure

```
/src
  /app
    /components
      - Sidebar.tsx          # Left navigation sidebar
      - TopBar.tsx           # Top status bar with indicators
      - Dashboard.tsx        # Account summary dashboard
      - PositionsTable.tsx   # Portfolio positions table
      - OrdersTable.tsx      # Orders history table
      - WatchList.tsx        # Market symbols watch list
    - App.tsx                # Main application layout
  /lib
    - api.ts                 # Centralized API helper with auth
```

## API Helper

The `/src/lib/api.ts` file centralizes all API requests with:
- Automatic `X-Auth-Token` header injection
- Query parameter support
- Error handling
- TypeScript types

Example usage:
```typescript
import { api } from '../lib/api';

const data = await api.getPositions();
```

## Mock Data

The application uses mock data for demonstration purposes. In production, replace the mock responses in `/src/lib/api.ts` with actual API calls to your trading backend.

## Key Components

### Dashboard
Displays account summary cards with:
- Total portfolio value
- Cash balance
- Buying power
- Today's P&L

### Positions Table
Shows current holdings with:
- Symbol and name
- Quantity and prices
- Market value
- Unrealized P&L

### Orders Table
Displays order history with:
- Order ID and symbol
- Type (LIMIT, MARKET, STOP)
- Side (BUY/SELL)
- Status and fill information

### Watch List
Market data for tracked symbols with:
- Current price
- Price change
- Volume

## Toast System

Uses Sonner for notifications:
```typescript
import { toast } from 'sonner';

toast.success('Action completed');
toast.error('Something went wrong');
```

## Development

```bash
npm install
npm run dev
```

## Technologies

- React 18
- TypeScript
- Tailwind CSS 4.0
- Lucide React (icons)
- Sonner (toast notifications)
- Vite (build tool)
