# Alankar by Gayatri - Android App Development Plan

## Executive Summary
Build a Flutter Android app that mirrors the deployed Vercel website functionality with offline-first capability, allowing catalog management from phone and customer browsing/enquiry via WhatsApp.

---

## Existing Assets (Reuse 100%)

### Backend APIs (Vercel - No Changes Needed)
| Endpoint | Purpose | Auth |
|----------|---------|------|
| `GET /api/products` | Fetch all products | Public |
| `POST /api/products` | Add/Edit product | Admin (x-admin-token) |
| `DELETE /api/products?id=` | Delete product | Admin |
| `GET /api/categories` | Fetch categories | Public |
| `POST /api/categories` | Add category | Admin |
| `DELETE /api/categories?name=` | Delete category | Admin |
| `GET /api/orders` | Fetch orders | Admin |
| `PUT /api/orders` | Update order status | Admin |
| `POST /api/order` | Submit enquiry | Public |
| `POST /api/upload` | Upload image (base64) | Public |
| `POST /api/auth` | Admin login | Public |
| `GET /api/settings` | Get settings | Public |
| `POST /api/settings` | Update settings | Admin |
| `POST /api/carts` | Create shared cart | Public |
| `GET /api/carts?id=` | Get shared cart | Public |

### Data Models (Exact Match)
- **Product**: id, name, category, price, origPrice, stock, desc, image, visible, featured
- **Category**: string name
- **Order**: id, date, name, phone, address, items, total, status
- **Settings**: admin_user, admin_pass, instagram_handle, whatsapp_number
- **Cart Item**: productId, qty

### UI/UX References
- Colors: Gold (#D4A843), Cream (#FDF6E3), Dark (#1A1A1A), Light theme variants
- Fonts: Cormorant Garamond (headings), Raleway (body)
- Category emojis: 📿💎⭕💍👑✨🌸
- Toast styles, modal patterns, card layouts

---

## App Architecture (Flutter)

```
lib/
├── main.dart                    # App entry, theme, routes
├── core/
│   ├── constants/               # API base URL, keys, enums
│   ├── theme/                   # AppTheme (dark/light matching website)
│   ├── network/                 # Dio client, interceptors, offline queue
│   ├── storage/                 # Drift database, secure storage
│   └── sync/                    # Sync engine, WorkManager tasks
├── data/
│   ├── models/                  # Product, Category, Order, CartItem, Settings
│   ├── repositories/            # ProductRepo, CategoryRepo, OrderRepo, CartRepo, SettingsRepo
│   └── datasources/             # Local (Drift), Remote (API)
├── features/
│   ├── auth/                    # Admin login, session management
│   ├── catalog/                 # Customer: home, product detail, search, filter
│   ├── cart/                    # Cart screen, add/remove, quantity, persist
│   ├── favorites/               # Wishlist screen, toggle
│   ├── enquiry/                 # Order form → WhatsApp + API
│   ├── share/                   # Share cart link + WhatsApp
│   ├── admin/
│   │   ├── dashboard/           # Stats + recent products
│   │   ├── products/            # CRUD + image upload
│   │   ├── categories/          # CRUD
│   │   ├── orders/              # List + status update
│   │   └── settings/            # Instagram, WhatsApp, password
│   └── splash/                  # Splash screen, init sync
├── shared/
│   ├── widgets/                 # Reusable: ProductCard, CategoryChip, Toast, Loading, EmptyState
│   └── extensions/              # String, Number, Date formatting
└── l10n/                        # Localization (English, Hindi optional)
```

---

## Development Phases

### Phase 1: Foundation (Week 1-2)
**Goal**: Runnable app with theme, local DB, API client, offline queue

- [ ] Flutter project setup (`flutter create alankar_app`)
- [ ] Dependencies: `drift`, `sqlite3_flutter_libs`, `dio`, `riverpod`, `cached_network_image`, `image_picker`, `flutter_secure_storage`, `workmanager`, `connectivity_plus`, `url_launcher`, `share_plus`, `go_router`
- [ ] Drift database schema (products, categories, cart, favorites, orders, settings, sync_queue)
- [ ] API client with Dio (base URL from Vercel, interceptors for auth, logging)
- [ ] Offline mutation queue (persist POST/PUT/DELETE when offline, replay on connectivity)
- [ ] Theme system (dark/light matching CSS variables exactly)
- [ ] App icon & splash screen from logo.jpg
- [ ] GoRouter setup (deep links for shared carts: `/cart/:cartId`)
- [ ] Secure storage for admin token + settings

### Phase 2: Customer Features (Week 2-3)
**Goal**: Full customer browsing experience offline-capable

- [ ] Splash screen → init sync → navigate to Home or SharedCart
- [ ] Home: Hero banner (logo + tagline), CategoryFilterChips (All, Favorites, categories), Search bar, ProductGrid
- [ ] ProductGrid: ProductCard (image/emoji, badge, name, category, price, origPrice, cart btn, wish btn)
- [ ] Pull-to-refresh on Home (triggers sync)
- [ ] ProductDetail screen (full image, details, add to cart, share)
- [ ] Cart screen: list items, quantity controls, remove, subtotal, total, "Share Cart", "Share WhatsApp", "Enquire Now"
- [ ] Favorites screen: grid of favorited products
- [ ] Share Cart: POST to `/api/carts` → copy deep link / open WhatsApp with link
- [ ] Share WhatsApp: Format message (same as web) → open WhatsApp
- [ ] Enquiry Flow: Modal form (name, phone, address) → submit to `/api/order` + open WhatsApp with formatted message → clear cart
- [ ] Offline indicators: "Synced" / "Pending sync" badge on Home/AppBar
- [ ] Empty states, loading skeletons, error toasts (matching website style)

### Phase 3: Admin Features (Week 3-4)
**Goal**: Complete catalog management from phone

- [ ] Admin Login screen (username/password → `/api/auth` → store token)
- [ ] AdminDrawer/BottomNav: Dashboard, Products, Categories, Categories, Categories, Orders, Settings, Logout
- [ ] Dashboard: 4 stat cards (total, active, categories, pending), RecentProductsTable (6 items)
- [ ] Products List: Table (image, name, category, price, stock, featured, visibility, actions)
- [ ] Product Form Modal: Add/Edit (name, category dropdown, price, origPrice, stock, desc, visibility, featured, image picker)
- [ ] Image Picker: Gallery/Camera → compress → base64 → `/api/upload` → preview → save to form
- [ ] Product Actions: Edit, Toggle Visibility, Delete (confirm dialog)
- [ ] Categories: List with delete, Add new (inline input)
- [ ] Orders: Table (id, date, name, phone, address, items, total, status dropdown)
- [ ] Order Status Update: Dropdown change → PUT `/api/orders` → refresh
- [ ] Settings: Instagram handle, WhatsApp number, Change Password → POST `/api/settings`
- [ ] Admin session persists across app restarts
- [ ] All admin mutations go through offline queue

### Phase 4: Sync & Polish (Week 4-5)
**Goal**: Production-ready, reliable offline-first experience

- [ ] WorkManager periodic sync (every 15 min when online)
- [ ] Connectivity listener → immediate sync on reconnect
- [ ] Sync Engine:
  - Push: Replay queued mutations (products, categories, orders, settings)
  - Pull: GET `/api/products`, `/api/categories`, `/api/orders`, `/api/settings` → upsert local
  - Conflict: Server-wins for products/categories; manual merge for concurrent product edits
- [ ] Image caching: `cached_network_image` with placeholder emoji per category
- [ ] Deep link handling: `app://cart/:cartId` → fetch `/api/carts?id=` → load into cart → show banner
- [ ] Push notifications (optional): FCM for new orders (requires backend change)
- [ ] Accessibility: Semantic labels, contrast, font scaling
- [ ] Hindi localization (optional): Strings for customer-facing text
- [ ] Performance: ListView.builder, image caching, debounced search
- [ ] Error boundaries: Graceful degradation when API down

### Phase 5: Build & Release (Week 5-6)
**Goal**: Distributable APK/AAB

- [ ] Debug APK for internal testing (`flutter build apk --debug`)
- [ ] Profile build for performance testing (`flutter build apk --profile`)
- [ ] Release build: `flutter build appbundle` (AAB for Play Store) or `flutter build apk --release`
- [ ] Signing config (keystore for release)
- [ ] Play Console listing (if publishing): screenshots, description, privacy policy
- [ ] Internal testing track → closed testing → production
- [ ] Or: Direct APK distribution (if not publishing to store)

---

## Key Technical Decisions

| Area | Choice | Rationale |
|------|--------|-----------|
| Framework | Flutter (Dart) | Single codebase, offline SQLite, great UI, iOS later |
| State | Riverpod | Type-safe, compile-safe, works offline |
| Local DB | Drift (SQLite) | Reactive, type-safe, migrations, works offline |
| Networking | Dio | Interceptors, offline queue, base64 upload |
| Images | cached_network_image + image_picker | Offline cache + camera/gallery |
| Background Sync | WorkManager + Connectivity | Reliable periodic + on-reconnect sync |
| Routing | GoRouter | Deep links, declarative, web-compatible |
| Auth Storage | flutter_secure_storage | Encrypted token + credentials |
| Theme | Custom ThemeData | Exact match to website CSS variables |

---

## Data Flow (Offline-First)

```
User Action (Add Product)
       │
       ▼
Local DB (Drift) ←── Optimistic Update ──→ UI Updates Immediately
       │
       ▼
Sync Queue (local table: id, endpoint, method, body, timestamp, retries)
       │
       ▼
[Online?] ──No──→ Wait for Connectivity
       │Yes
       ▼
WorkManager / Connectivity Listener
       │
       ▼
Replay Queue → API → Success? → Remove from Queue
                    │
                    └─No (retryable) → Increment retries, backoff
                    └─No (4xx) → Mark failed, notify user
```

---

## Testing Checklist

### Offline Scenarios
- [ ] Browse products without internet (cached)
- [ ] Add to cart offline → sync when online
- [ ] Add favorite offline → sync when online
- [ ] Admin: Add product offline → image queued → upload when online
- [ ] Admin: Edit product offline → sync when online
- [ ] Admin: Delete product offline → sync when online
- [ ] Place order offline → queue → submit when online
- [ ] Shared cart link opened offline → cached products shown

### Online Scenarios
- [ ] Pull-to-refresh updates products/categories
- [ ] Admin changes reflect immediately on customer side
- [ ] Order submitted → appears in admin orders
- [ ] Image upload → appears in product grid
- [ ] Settings change → updates social links

### Edge Cases
- [ ] Conflict: Same product edited on phone + web
- [ ] Large image upload on slow connection
- [ ] Token expiry → auto re-login prompt
- [ ] Corrupted local DB → graceful reset
- [ ] Deep link with invalid cartId

---

## Deliverables

1. **Source Code** - Complete Flutter project
2. **Debug APK** - For immediate testing on your phone
3. **Release AAB/APK** - For Play Store or direct distribution
4. **Keystore** - For future updates (keep secure)
5. **README** - Build/run instructions, API configuration
6. **API_URL Configuration** - Easy switch via `--dart-define` or `flavor`

---

## Configuration Required

```yaml
# lib/core/constants/api_config.dart
const String apiBaseUrl = 'https://YOUR_VERCEL_URL.vercel.app';  # Your deployed URL
const String appScheme = 'alankar';  # For deep links: alankar://cart/:cartId
```

---

## Next Steps

1. Confirm plan approval
2. Provide: Vercel URL, high-res logo, test admin credentials
3. Start Phase 1 implementation
4. Weekly demo APKs for feedback

---

**Estimated Duration**: 5-6 weeks for complete Android app
**Team**: 1 Flutter developer
**Dependencies**: Mac/Windows/Linux for development, Android phone for testing