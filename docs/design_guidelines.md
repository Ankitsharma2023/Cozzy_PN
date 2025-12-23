# X4PN VPN - Design Guidelines

## Design Approach
**Reference-Based Hybrid**: Drawing inspiration from successful Web3 applications (Uniswap, MetaMask, Base) combined with modern dashboard patterns (Linear, Notion). This product requires both trust/credibility and functional clarity for handling blockchain payments and VPN sessions.

**Core Principle**: "Powerful simplicity" - complex blockchain operations presented through clean, confidence-inspiring interfaces.

## Typography

**Font Stack:**
- Primary: Inter (Google Fonts) - UI elements, body text, data displays
- Accent: JetBrains Mono (Google Fonts) - wallet addresses, transaction IDs, technical data

**Hierarchy:**
- Hero/Page Titles: 3xl-4xl, font-bold
- Section Headers: xl-2xl, font-semibold
- Card Titles: lg, font-medium
- Body Text: base, font-normal
- Data/Stats: sm-base, font-medium (mono for numbers)
- Labels: sm, font-medium, uppercase tracking

## Layout System

**Spacing Primitives**: Use Tailwind units of 4, 6, 8, 12, 16 (e.g., p-4, gap-6, mb-8, py-12, space-y-16)

**Grid Structure:**
- Main dashboard: 12-column grid with sidebar navigation
- Cards: 2-3 column responsive grid (lg:grid-cols-3 md:grid-cols-2)
- Data tables: Full-width with horizontal scroll on mobile

**Container Strategy:**
- Dashboard sections: max-w-7xl mx-auto
- Forms/Modals: max-w-2xl
- Data displays: w-full with inner padding

## Component Library

### Navigation
**Sidebar Navigation** (Left-aligned, persistent):
- Logo at top with gradient effect
- Primary nav items: Dashboard, Sessions, Nodes, Earnings, Settings
- Wallet connection status at bottom
- Active state: subtle background fill with accent border-left
- Width: 64 on desktop, collapsible to icon-only on tablet

### Dashboard Cards
**Stat Cards** (Key metrics):
- Grid layout showing: USDC Balance, X4PN Balance, Active Sessions, Total Earned
- Large number display with label below
- Icon with gradient background in corner
- Subtle border with hover lift effect
- Micro-trend indicators (up/down arrows for changes)

**Session Status Card**:
- Current connection state with pulsing indicator
- Timer showing session duration
- Cost meter with real-time updates
- Large "Connect/Disconnect" button
- Server location with flag icon
- Transfer speed indicators

### Wallet Integration
**Connection Component**:
- "Connect Wallet" button (large, prominent) when disconnected
- Connected state shows: truncated address (0x1234...5678), network badge, balance preview
- Dropdown on click: Full address, copy button, disconnect option
- Network indicator: Base badge with chain icon

### Data Tables
**Sessions History Table**:
- Columns: Date/Time, Duration, Server, Cost (USDC), Earned (X4PN), Status
- Alternating row backgrounds for readability
- Status badges: Active (green), Completed (gray), Failed (red)
- Sortable headers
- Pagination at bottom

**Node Operator Dashboard**:
- Table showing: Node ID, Status, Uptime, Earnings (USDC), Earnings (X4PN), Active Users
- Status indicator dots (green/red)
- Action buttons in last column

### Forms & Inputs
**Deposit USDC Modal**:
- Large input field with USDC icon
- Max button (deposit all available)
- Balance preview below input
- "Approve" then "Deposit" two-step flow
- Transaction status indicator

**Input Fields**:
- Floating labels
- Icon prefix where appropriate ($ for USDC, token icon for X4PN)
- Clear validation states (success green, error red)
- Helper text below field

### Buttons & CTAs
**Primary Actions**: Large rounded buttons with gradient effects
- "Connect to VPN" - hero button, pulsing glow when active
- "Deposit USDC" - solid with hover lift
- "Withdraw Earnings" - outline with fill on hover

**Secondary Actions**: Ghost buttons or links with subtle hover underline

**Status Indicators**: 
- Pill-shaped badges for Active/Inactive/Pending
- Pulsing dot animations for "live" states

### Data Visualization
**Balance Displays**:
- Large number with token icon
- Secondary text showing USD equivalent
- Change percentage with trend indicator

**Session Timer**:
- Digital clock-style display using mono font
- Cost accumulating in real-time below
- Progress bar showing estimated remaining time based on balance

**Earnings Chart**:
- Simple line chart showing earnings over time
- USDC (solid line) vs X4PN (dashed line)
- Tooltips on hover

## Page Layouts

### Main Dashboard
- Hero section: Wallet status + Quick actions (Connect, Deposit)
- 4-column stat cards grid (USDC, X4PN, Sessions, Earnings)
- Current session card (large, prominent if connected)
- Recent activity table
- Sidebar navigation throughout

### Connect Page
- Server selection grid (3 columns): Server cards with flag, location, latency, rate
- Filter controls: Region, Speed, Price
- Selected server highlighted
- Large "Connect" button fixed at bottom on mobile

### Node Operator View
- Registration form (if not registered)
- Node status dashboard with uptime monitor
- Earnings breakdown (USDC vs X4PN)
- Active sessions table
- Configuration management section

### Landing Page (Marketing)
Sections (6-8 total):
1. **Hero**: Bold headline "Pay-Per-Minute VPN Powered by Blockchain" + wallet connect button + hero image (abstract network visualization)
2. **Value Props**: 3-column grid - Pay-as-you-go, Earn while you browse, True privacy
3. **How It Works**: 3-step visual flow with icons and arrows
4. **Economics**: Side-by-side comparison (Traditional VPN vs X4PN) in table format
5. **Token Info**: USDC (payments) vs X4PN (rewards) explanation with graphics
6. **For Node Operators**: Earnings potential with calculator widget
7. **Roadmap**: Timeline visual
8. **CTA + Footer**: "Start Earning Today" with newsletter signup

## Images

### Hero Section
**Large hero image**: Abstract network/blockchain visualization with purple/blue gradient overlay. Nodes connected by glowing lines suggesting decentralized network. Semi-transparent to allow text overlay. Position: Full-width background with centered content overlay.

### Value Props Section
**Icon illustrations**: Use icon library (Heroicons) for: Dollar sign (pay-per-minute), Coins (earn rewards), Shield (privacy). No custom images needed.

### Dashboard
**Server location images**: Small flag icons for country identification (use emoji flags or icon library). No large images.

### Empty States
**Illustrations for**: No sessions yet, No earnings yet, Wallet not connected. Simple line art style consistent with overall aesthetic.

## Animations

Use sparingly:
- Wallet connection: Smooth modal slide-in
- Session active: Subtle pulsing glow on status indicator
- Button hovers: Gentle lift (translate-y-1) + shadow increase
- Card hovers: Slight scale (scale-105)
- Number counters: Animated count-up on page load for stats
- Page transitions: Fade between routes

Avoid: Scroll animations, parallax, excessive motion

## Design Principles

1. **Trust First**: Use established Web3 patterns for wallet interactions, clear transaction confirmations, visible security indicators
2. **Data Clarity**: Numbers are prominent, labels are clear, states are obvious
3. **Progressive Disclosure**: Complex features revealed as needed, simple by default
4. **Responsive Density**: Dense data displays on desktop, card-based stacking on mobile
5. **Blockchain Transparency**: Every action shows gas cost, confirmation states, transaction links