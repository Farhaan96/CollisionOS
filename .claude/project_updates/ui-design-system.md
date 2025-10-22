# CollisionOS UI Design System
**Created**: 2025-10-22
**Status**: In Development
**Version**: 1.0

## Executive Summary

This document defines the comprehensive design system for CollisionOS, a professional collision repair shop management system. The design emphasizes clarity, data-richness, and workflow efficiency for auto body shop environments.

---

## 1. Design Philosophy

### Core Principles
1. **Professional & Trustworthy**: Instills confidence in shop owners and insurance partners
2. **Data-Rich**: Surface actionable information without overwhelming users
3. **Workflow-Focused**: Minimize clicks, optimize for daily tasks
4. **Industry-Appropriate**: Colors and metaphors aligned with automotive/collision repair
5. **Role-Adapted**: Tailored interfaces for owners, managers, receptionists, technicians

### Target Users
- **Shop Owners**: Need KPIs, financials, high-level overview
- **Managers**: Need workflow management, scheduling, parts tracking
- **Receptionists**: Need customer intake, scheduling, quick searches
- **Technicians**: Need job lists, status updates, photo capture

---

## 2. Research Findings

### Industry Analysis (AutoLeap, Shopmonkey, Mitchell, CCC ONE)

**AutoLeap** (4.7/5 UI Rating):
- Clean card-based layouts
- Blue/green professional palette
- Prominent KPI cards with trend indicators
- Kanban-style workflow boards
- Excellent mobile responsiveness

**Shopmonkey**:
- Dark mode with high contrast
- Orange accent color for CTAs
- Rich data tables with inline editing
- Timeline views for repair progress
- Status badges with color-coding

**Mitchell/CCC ONE**:
- Traditional blue color scheme (trust/insurance)
- Dense information layout (professional users)
- Tabbed interfaces for complex data
- Integrated photo galleries
- PDF preview integration

**Key Takeaways**:
1. Blue/green dominates (trust, professionalism)
2. Card-based dashboards are standard
3. Status color-coding is critical
4. Timeline/progress visualizations enhance UX
5. Photo management is essential
6. Mobile apps are increasingly expected

---

## 3. Color Palette

### Primary Colors

**Primary Blue** - Trust, Professionalism, Insurance Industry
- `main`: `#1976D2` (Blue 700)
- `light`: `#42A5F5` (Blue 400)
- `dark`: `#1565C0` (Blue 800)
- `contrastText`: `#FFFFFF`

**Secondary Teal** - Automotive, Modern, Fresh
- `main`: `#00897B` (Teal 600)
- `light`: `#26A69A` (Teal 400)
- `dark`: `#00695C` (Teal 800)
- `contrastText`: `#FFFFFF`

### Status Colors

**Success** - Green (Completed, Approved, On Track)
- `main`: `#2E7D32` (Green 800)
- `light`: `#4CAF50` (Green 500)
- `dark`: `#1B5E20` (Green 900)

**Warning** - Amber/Orange (In Progress, Needs Attention)
- `main`: `#F57C00` (Orange 700)
- `light`: `#FF9800` (Orange 500)
- `dark`: `#E65100` (Orange 900)

**Error** - Red (Urgent, Delayed, Critical)
- `main`: `#C62828` (Red 800)
- `light`: `#E53935` (Red 600)
- `dark`: `#B71C1C` (Red 900)

**Info** - Light Blue (Informational, Parts Status)
- `main`: `#0288D1` (Light Blue 700)
- `light`: `#03A9F4` (Light Blue 500)
- `dark`: `#01579B` (Light Blue 900)

### Workflow Status Colors

| Status | Color | Hex | Use Case |
|--------|-------|-----|----------|
| **Intake** | Gray | `#757575` | New ROs awaiting assessment |
| **Estimating** | Blue | `#1976D2` | Creating/reviewing estimates |
| **Waiting for Approval** | Purple | `#7B1FA2` | Awaiting customer/insurance OK |
| **Parts Needed** | Orange | `#F57C00` | Waiting for parts to arrive |
| **In Production** | Teal | `#00897B` | Active repair work |
| **Quality Check** | Indigo | `#303F9F` | Final inspection |
| **Ready for Pickup** | Green | `#2E7D32` | Completed, awaiting delivery |
| **Delivered** | Dark Green | `#1B5E20` | Customer picked up |
| **Cancelled** | Red | `#C62828` | Cancelled/abandoned |

### Parts Status Colors

| Status | Color | Icon | Description |
|--------|-------|------|-------------|
| **Needed** | Red | `RadioButtonUnchecked` | Part required but not ordered |
| **Sourcing** | Orange | `Search` | Searching for best price/availability |
| **Ordered** | Blue | `ShoppingCart` | Purchase order submitted |
| **Backordered** | Purple | `Schedule` | Delayed by supplier |
| **Received** | Teal | `LocalShipping` | Part arrived at shop |
| **Installed** | Green | `CheckCircle` | Part installed on vehicle |

### Background Colors

**Light Mode**:
- `default`: `#F5F5F5` (Gray 100)
- `paper`: `#FFFFFF`
- `elevated`: `#FAFAFA` (Gray 50)

**Dark Mode**:
- `default`: `#121212` (Near Black)
- `paper`: `#1E1E1E` (Dark Gray)
- `elevated`: `#2C2C2C` (Lighter Dark Gray)

### Neutral Grays

- `50`: `#FAFAFA`
- `100`: `#F5F5F5`
- `200`: `#EEEEEE`
- `300`: `#E0E0E0`
- `400`: `#BDBDBD`
- `500`: `#9E9E9E`
- `600`: `#757575`
- `700`: `#616161`
- `800`: `#424242`
- `900`: `#212121`

---

## 4. Typography

### Font Family

**Primary**: `Inter`, `system-ui`, `-apple-system`, `Segoe UI`, `Roboto`, `Helvetica Neue`, `Arial`, sans-serif

**Monospace** (for RO numbers, VINs): `Roboto Mono`, `Courier New`, monospace

### Type Scale

| Variant | Size | Weight | Line Height | Use Case |
|---------|------|--------|-------------|----------|
| `h1` | 2.5rem (40px) | 700 | 1.2 | Page titles |
| `h2` | 2rem (32px) | 700 | 1.3 | Section headers |
| `h3` | 1.75rem (28px) | 600 | 1.4 | Card titles |
| `h4` | 1.5rem (24px) | 600 | 1.4 | Subsection headers |
| `h5` | 1.25rem (20px) | 500 | 1.5 | Small headers |
| `h6` | 1rem (16px) | 500 | 1.6 | Captions, labels |
| `body1` | 1rem (16px) | 400 | 1.5 | Main content |
| `body2` | 0.875rem (14px) | 400 | 1.43 | Secondary content |
| `subtitle1` | 1rem (16px) | 500 | 1.75 | Emphasized text |
| `subtitle2` | 0.875rem (14px) | 500 | 1.57 | Small emphasis |
| `caption` | 0.75rem (12px) | 400 | 1.66 | Hints, metadata |
| `overline` | 0.75rem (12px) | 700 | 2.66 | Labels (uppercase) |
| `button` | 0.875rem (14px) | 600 | 1.75 | Button text |

### Font Weights

- **Regular**: 400
- **Medium**: 500
- **Semi-Bold**: 600
- **Bold**: 700

---

## 5. Spacing & Layout

### Spacing Scale (8px base unit)

```
0: 0px
1: 8px    (0.5rem)
2: 16px   (1rem)
3: 24px   (1.5rem)
4: 32px   (2rem)
5: 40px   (2.5rem)
6: 48px   (3rem)
8: 64px   (4rem)
10: 80px  (5rem)
12: 96px  (6rem)
```

### Grid System

- **Container Max Width**: `xl` (1920px for large monitors)
- **Grid Columns**: 12 (Material-UI standard)
- **Gutter**: `24px` (3 spacing units)

### Layout Patterns

**Dashboard Layout**:
```
┌─────────────────────────────────────┐
│ Header (Title + Actions)            │ 64px height
├─────────────────────────────────────┤
│ KPI Cards (4 columns)               │ Auto height
├─────────────────────────────────────┤
│ Job Board (horizontal columns)      │ Min 600px
├─────────────────────────────────────┤
│ Additional Widgets                  │ Auto height
└─────────────────────────────────────┘
```

**Detail Page Layout**:
```
┌─────────────────────────────────────┐
│ Header Card (RO info + actions)     │ Auto height
├─────────────────────────────────────┤
│ Tabs Navigation                     │ 48px
├─────────────────────────────────────┤
│ Tab Content                         │ Min 500px
│ (Parts Workflow, Claim Info, etc.)  │
└─────────────────────────────────────┘
```

### Border Radius

- **Small**: `4px` (Chips, small buttons)
- **Medium**: `8px` (Cards, inputs)
- **Large**: `12px` (Modals, large cards)
- **X-Large**: `16px` (Hero cards, special elements)

### Elevation (Shadows)

- **Level 0**: None (flat elements)
- **Level 1**: `0 1px 3px rgba(0,0,0,0.12)` (Subtle lift)
- **Level 2**: `0 4px 6px rgba(0,0,0,0.1)` (Cards)
- **Level 3**: `0 10px 20px rgba(0,0,0,0.15)` (Modals)
- **Level 4**: `0 20px 40px rgba(0,0,0,0.2)` (Dropdowns, popovers)

---

## 6. Component Library

### Core Components

#### 1. **KPI Card**
- **Purpose**: Display key metrics with trend indicators
- **Elements**: Label, value, trend arrow, change percentage
- **Variants**: Simple, with chart, with comparison
- **Size**: Fixed height (120px), responsive width

#### 2. **Status Badge**
- **Purpose**: Visual status indicators
- **Variants**: Filled, outlined, dot
- **Sizes**: Small (20px), medium (24px), large (32px)
- **Colors**: Mapped to status colors

#### 3. **Data Card**
- **Purpose**: Container for related information
- **Elements**: Header, content area, actions (optional)
- **Variants**: Simple, elevated, outlined
- **Padding**: `24px` (3 spacing units)

#### 4. **Action Button**
- **Purpose**: Primary and secondary actions
- **Variants**: Contained, outlined, text
- **Sizes**: Small, medium, large
- **States**: Default, hover, active, disabled, loading

#### 5. **Search Bar**
- **Purpose**: Global and contextual search
- **Features**: Autocomplete, recent searches, quick filters
- **Variants**: Compact, expanded, with filters

#### 6. **Timeline**
- **Purpose**: Visualize repair workflow progress
- **Elements**: Milestones, dates, status indicators
- **Variants**: Vertical, horizontal
- **Interactive**: Clickable milestones for details

#### 7. **Parts Card**
- **Purpose**: Display part information in workflow
- **Elements**: Description, part number, quantity, price, status
- **Features**: Drag-and-drop, selection, quick actions
- **States**: Default, selected, dragging

#### 8. **Customer Info Panel**
- **Purpose**: Display customer contact details
- **Elements**: Name, phone, email, address
- **Features**: Quick call, quick email, edit button
- **Responsive**: Stacks on mobile

#### 9. **Vehicle Info Panel**
- **Purpose**: Display vehicle details
- **Elements**: Year/make/model, VIN, color, license plate
- **Features**: VIN decoder, quick search
- **Visual**: Car icon with color indicator

#### 10. **Photo Gallery**
- **Purpose**: Display damage/progress photos
- **Features**: Lightbox, zoom, annotations, thumbnails
- **Upload**: Drag-and-drop, camera integration
- **Organization**: Before/after, by date, by category

#### 11. **Data Table**
- **Purpose**: Display tabular data with actions
- **Features**: Sorting, filtering, pagination, row selection
- **Responsive**: Stacks to cards on mobile
- **Density**: Comfortable (default), compact, spacious

#### 12. **Form Input**
- **Variants**: Text, number, date, select, autocomplete
- **States**: Default, focus, error, disabled
- **Features**: Validation, helper text, character count
- **Styling**: Outlined (default), filled

#### 13. **Modal Dialog**
- **Purpose**: Focused user interactions
- **Sizes**: Small (400px), medium (600px), large (800px), full
- **Elements**: Title, content, actions
- **Features**: Backdrop, close button, keyboard shortcuts

#### 14. **Toast Notification**
- **Purpose**: Feedback for user actions
- **Variants**: Success, error, warning, info
- **Duration**: 3s (default), 5s (errors), persistent (critical)
- **Position**: Top-right (desktop), top-center (mobile)
- **Features**: Dismissible, action button (undo, view)

#### 15. **Loading Skeleton**
- **Purpose**: Placeholder while content loads
- **Variants**: Text, card, table row, circular (avatar)
- **Animation**: Pulse or shimmer
- **Color**: Light gray in light mode, dark gray in dark mode

---

## 7. Data Visualization

### Chart Types

**Line Chart** - Trends over time
- Revenue trend, cycle time trend, job volume
- **Library**: Recharts or Chart.js
- **Colors**: Primary blue (main line), secondary teal (comparison)

**Bar Chart** - Comparisons
- Monthly revenue, technician productivity, parts usage
- **Orientation**: Vertical (default), horizontal (long labels)
- **Colors**: Primary palette with status colors for categories

**Pie/Donut Chart** - Proportions
- Job status distribution, parts supplier breakdown
- **Variant**: Donut (preferred for better readability)
- **Colors**: Status colors mapped to categories

**Gauge/Progress Chart** - Capacity/completion
- Shop utilization, RO completion progress
- **Variants**: Circular, linear (progress bar)
- **Colors**: Green (good), orange (warning), red (critical)

### Chart Styling

- **Grid Lines**: Light gray (`#E0E0E0`), subtle
- **Axes**: Dark gray (`#616161`), medium weight
- **Tooltips**: White background, subtle shadow, rounded corners
- **Legend**: Horizontal (default), vertical (if space constrained)
- **Responsive**: Auto-resize, maintain aspect ratio

---

## 8. Iconography

### Icon Library
**Primary**: Material-UI Icons (Material Symbols)
**Fallback**: Heroicons or Lucide Icons

### Icon Strategy

**Functional Icons** (navigation, actions):
- Size: 20px (small), 24px (medium), 32px (large)
- Color: Inherit from text color
- Stroke: Medium weight

**Status Icons** (workflow, parts):
- Size: 16px (inline), 24px (standalone)
- Color: Match status color
- Filled variant for active states

**Industry Icons** (collision repair specific):
- Car icon for vehicles
- Wrench for technicians/labor
- Dollar sign for financial
- Calendar for scheduling
- Clipboard for ROs/estimates
- Box for parts/inventory
- Phone for customer contact

### Icon Usage Guidelines

1. **Always pair with text** for primary actions (accessibility)
2. **Icon-only** acceptable for well-known actions (close, more, edit)
3. **Consistent mapping**: Same icon for same concept across app
4. **Size consistency**: Don't mix sizes within same context
5. **Color consistency**: Use theme colors, avoid arbitrary colors

---

## 9. Responsive Breakpoints

| Breakpoint | Size | Device | Layout Strategy |
|------------|------|--------|-----------------|
| `xs` | 0-599px | Phone | Single column, stacked cards |
| `sm` | 600-959px | Tablet (portrait) | 2 columns, condensed nav |
| `md` | 960-1279px | Tablet (landscape), small laptop | 3-4 columns, sidebar nav |
| `lg` | 1280-1919px | Desktop | 4-6 columns, full features |
| `xl` | 1920px+ | Large monitor | Up to 12 columns, expansive layout |

### Responsive Patterns

**Navigation**:
- **Desktop**: Permanent sidebar (240px) or top bar
- **Tablet**: Collapsible sidebar or bottom tab bar
- **Mobile**: Bottom tab bar or hamburger menu

**Data Tables**:
- **Desktop**: Full table with all columns
- **Tablet**: Hide less critical columns, show on expand
- **Mobile**: Card layout instead of table

**Dashboards**:
- **Desktop**: 4 KPI cards in row, multi-column job board
- **Tablet**: 2 KPI cards in row, 2-column job board
- **Mobile**: 1 KPI card per row, vertical job list

**Forms**:
- **Desktop**: 2-3 column layout for efficiency
- **Tablet**: 2 column layout
- **Mobile**: Single column, full-width inputs

---

## 10. Accessibility

### WCAG 2.1 AA Compliance

**Color Contrast**:
- Text on background: Minimum 4.5:1 (normal text), 3:1 (large text)
- Interactive elements: Minimum 3:1 against background

**Keyboard Navigation**:
- All interactive elements accessible via keyboard
- Visible focus indicators (2px solid primary color)
- Logical tab order
- Keyboard shortcuts for common actions (optional)

**Screen Reader Support**:
- Semantic HTML elements
- ARIA labels for icon-only buttons
- ARIA live regions for dynamic content updates
- Alt text for all images (damage photos, logos)

**Motion & Animation**:
- Respect `prefers-reduced-motion` setting
- Disable animations for users who prefer reduced motion
- Subtle animations only (no spinning, flashing)

---

## 11. Animation & Transitions

### Timing Functions

- **Ease-Out**: `cubic-bezier(0.0, 0.0, 0.2, 1)` - Elements entering screen
- **Ease-In**: `cubic-bezier(0.4, 0.0, 1, 1)` - Elements leaving screen
- **Ease-In-Out**: `cubic-bezier(0.4, 0.0, 0.2, 1)` - Elements moving

### Duration

- **Fast**: 150ms (micro-interactions, hover states)
- **Medium**: 250ms (most transitions, modal open/close)
- **Slow**: 400ms (page transitions, complex animations)

### Use Cases

**Hover States**: 150ms ease-out
- Button background color
- Card elevation
- Link underline

**Modal/Dialog**: 250ms ease-in-out
- Backdrop fade-in
- Content slide-up/scale
- Close animation

**Loading States**: Infinite pulse/shimmer
- Skeleton screens
- Loading spinners
- Progress indicators

**Drag-and-Drop**: Real-time, no delay
- Part cards moving between columns
- Visual feedback on drop zones

---

## 12. Dark Mode Strategy

### Implementation Approach

**Theme Toggle**: User preference stored in localStorage
**Default**: Light mode (professional, daytime use)
**Dark Mode**: Optional for users who prefer it

### Dark Mode Palette

**Background**:
- `default`: `#121212`
- `paper`: `#1E1E1E`
- `elevated`: `#2C2C2C`

**Text**:
- `primary`: `rgba(255,255,255,0.95)`
- `secondary`: `rgba(255,255,255,0.70)`
- `disabled`: `rgba(255,255,255,0.50)`

**Dividers**: `rgba(255,255,255,0.12)`

**Status Colors**: Same as light mode (maintain recognizability)

### Dark Mode Considerations

1. **Reduce bright whites**: Use `#E0E0E0` instead of `#FFFFFF`
2. **Increase elevation contrast**: Lighter surfaces on top
3. **Maintain color meaning**: Status colors stay consistent
4. **Test photo visibility**: Ensure damage photos are visible
5. **Syntax highlighting**: For any code/data displays

---

## 13. Loading & Empty States

### Loading States

**Full Page Load**:
- Skeleton screens matching page layout
- Progress bar at top (linear, indeterminate)
- Avoid blocking entire screen

**Component Load**:
- Skeleton placeholders (cards, table rows)
- Shimmer animation (subtle, not distracting)
- Maintain layout to prevent content shift

**Inline Load**:
- Circular spinner for buttons ("Saving...")
- Linear progress for file uploads
- Pulse animation for avatars/images

### Empty States

**No Data**:
- Icon (relevant to context)
- Friendly message ("No repair orders yet")
- Call-to-action button ("Create Your First RO")
- Muted colors (not alarming)

**Search No Results**:
- Magnifying glass icon
- Message ("No results for 'ABC123'")
- Suggestions ("Try searching by customer name or VIN")
- Button to clear filters

**Error State**:
- Warning icon
- Clear error message
- Retry button or next steps
- Support contact (if critical)

---

## 14. Mobile-Specific Considerations

### Touch Targets

**Minimum Size**: 44x44px (Apple HIG), 48x48px (Material Design)
**Spacing**: 8px between adjacent targets
**Hit Area**: Extend beyond visual boundary if needed

### Mobile Navigation

**Bottom Tab Bar** (preferred for mobile apps):
- 4-5 main sections (Dashboard, Jobs, Parts, Customers, More)
- Icons with labels
- Active state clearly indicated

**Mobile Gestures**:
- Swipe to delete (e.g., remove part from list)
- Pull to refresh (reload data)
- Swipe between tabs (alternative to tapping)
- Long press for additional options

### Mobile Optimizations

1. **Larger Text**: Minimum 14px for body text
2. **Simplified Forms**: Fewer fields, smart defaults
3. **Optimized Images**: Compress photos, lazy load
4. **Offline Mode**: Cache critical data locally
5. **Reduce Modals**: Use slide-up sheets instead

---

## 15. Implementation Roadmap

### Phase 1: Foundation (Week 1)
- ✅ Create design system document (this file)
- Update Material-UI theme configuration
- Build core component library (KPI Card, Status Badge, Data Card)
- Implement dark mode toggle
- Test color contrast and accessibility

### Phase 2: Dashboard Overhaul (Week 1-2)
- Redesign KPI cards with trend indicators
- Add data visualization charts (revenue, job status)
- Enhance job board visual hierarchy
- Add quick action buttons
- Implement loading skeletons

### Phase 3: RO Pages (Week 2)
- Redesign RO list table with better filters
- Enhance RO detail page tabs
- Improve parts workflow visual design
- Add timeline component for repair progress
- Polish photo gallery

### Phase 4: Forms & Inputs (Week 2-3)
- Standardize form layouts
- Improve validation feedback
- Add autocomplete components
- Enhance date/time pickers
- Mobile-optimize forms

### Phase 5: Polish & Testing (Week 3)
- Add subtle animations and transitions
- Implement all empty states
- Comprehensive responsive testing
- Accessibility audit
- Performance optimization

---

## 16. Design Tokens

### Colors (CSS Variables)

```css
:root {
  /* Primary */
  --color-primary-main: #1976D2;
  --color-primary-light: #42A5F5;
  --color-primary-dark: #1565C0;

  /* Secondary */
  --color-secondary-main: #00897B;
  --color-secondary-light: #26A69A;
  --color-secondary-dark: #00695C;

  /* Status */
  --color-success: #2E7D32;
  --color-warning: #F57C00;
  --color-error: #C62828;
  --color-info: #0288D1;

  /* Neutrals */
  --color-gray-50: #FAFAFA;
  --color-gray-100: #F5F5F5;
  --color-gray-200: #EEEEEE;
  --color-gray-300: #E0E0E0;
  --color-gray-400: #BDBDBD;
  --color-gray-500: #9E9E9E;
  --color-gray-600: #757575;
  --color-gray-700: #616161;
  --color-gray-800: #424242;
  --color-gray-900: #212121;

  /* Spacing */
  --spacing-1: 8px;
  --spacing-2: 16px;
  --spacing-3: 24px;
  --spacing-4: 32px;
  --spacing-5: 40px;
  --spacing-6: 48px;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.12);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 20px rgba(0,0,0,0.15);
  --shadow-xl: 0 20px 40px rgba(0,0,0,0.2);
}
```

---

## 17. File Structure

### Recommended Organization

```
src/
├── theme/
│   ├── index.js                  # Main theme config
│   ├── palette.js                # Color definitions
│   ├── typography.js             # Font settings
│   ├── components.js             # Component overrides
│   └── darkTheme.js              # Dark mode overrides
├── components/
│   ├── Common/
│   │   ├── KPICard.jsx
│   │   ├── StatusBadge.jsx
│   │   ├── DataCard.jsx
│   │   ├── ActionButton.jsx
│   │   ├── SearchBar.jsx
│   │   ├── Timeline.jsx
│   │   ├── PhotoGallery.jsx
│   │   ├── DataTable.jsx
│   │   └── LoadingSkeleton.jsx
│   ├── RO/
│   │   ├── ROHeader.jsx
│   │   ├── ROTimeline.jsx
│   │   └── ROStatusBadge.jsx
│   ├── Parts/
│   │   ├── PartCard.jsx
│   │   ├── PartsWorkflowBoard.jsx
│   │   └── PartStatusBadge.jsx
│   └── Customer/
│       ├── CustomerInfoPanel.jsx
│       └── VehicleInfoPanel.jsx
└── pages/
    ├── Dashboard/
    ├── RO/
    ├── Parts/
    ├── Customers/
    └── Reports/
```

---

## Conclusion

This design system provides a comprehensive foundation for the CollisionOS UI overhaul. By following these guidelines, we ensure:

1. **Consistency**: Unified visual language across all pages
2. **Accessibility**: WCAG 2.1 AA compliance
3. **Scalability**: Design tokens and component library for easy updates
4. **Professionalism**: Industry-appropriate colors and metaphors
5. **Efficiency**: Workflow-optimized layouts for daily tasks

**Next Steps**:
1. Implement Material-UI theme configuration
2. Build core component library
3. Redesign Dashboard
4. Update RO pages
5. Polish and test

---

**Document Version**: 1.0
**Last Updated**: 2025-10-22
**Author**: Claude Code (Orchestrator Agent)
**Review Status**: Draft - Awaiting User Approval
