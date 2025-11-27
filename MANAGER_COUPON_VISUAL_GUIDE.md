# Manager Coupon Access - Visual Guide

## 1. Manager Dashboard - Coupon Section

```
┌─────────────────────────────────────────────────────────────┐
│  Coupon/Reward Status                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌─────────┐│
│  │  🎁       │  │  ✅       │  │  ⏳       │  │  📈    ││
│  │ Generated │  │ Claimed   │  │ Unclaimed │  │Claim%  ││
│  │    45     │  │    38     │  │     7     │  │ 84.4%  ││
│  └────────────┘  └────────────┘  └────────────┘  └─────────┘│
│                                                             │
│  [👁️ View Coupon Details (45)]                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 2. Expanded Coupon Details Table

```
┌────────────────────────────────────────────────────────────────────┐
│ View Coupon Details                                                │
├─────────────┬─────────────────────┬─────────────┬──────────────────┤
│ Coupon ID   │ Generated Date      │ Phone       │ Status           │
├─────────────┼─────────────────────┼─────────────┼──────────────────┤
│ 12345... 📋 │ Nov 27, 10:30 AM    │ 966500.... │ ✅ Claimed       │
│ 23456... 📋 │ Nov 27, 09:15 AM    │ 966501.... │ ⏳ Pending       │
│ 34567... 📋 │ Nov 27, 08:45 AM    │ 966502.... │ ✅ Claimed       │
│ 45678... 📋 │ Nov 26, 04:20 PM    │ 966503.... │ ⏳ Pending       │
│ 56789... 📋 │ Nov 26, 02:10 PM    │ 966504.... │ ✅ Claimed       │
└─────────────┴─────────────────────┴─────────────┴──────────────────┘
```

## 3. Coupon Detail Modal

```
┌──────────────────────────────────────────────────────┐
│ Coupon Details                                    ✕  │
├──────────────────────────────────────────────────────┤
│                                                      │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Coupon ID                                        │ │
│ │ 12345678-abcd-ef01-2345-6789abcdef01      [📋]  │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ Generated    │ Nov 27, 2024, 10:30 AM                │
│ Status       │ ✅ Claimed                            │
│                                                      │
│ Phone Number │ 966 50 1234567                        │
│ Reward Type  │ Free Coffee                           │
│ Claimed On   │ Nov 27, 2024, 11:15 AM                │
│                                                      │
│                [     Close     ]                     │
└──────────────────────────────────────────────────────┘
```

## 4. Full Table View with All Columns

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Coupon ID              │ Generated Date        │ Phone  │ Reward    │ Status │
├─────────────────────────────────────────────────────────────────────────────┤
│ a1b2c3d4... [📋]       │ Nov 27, 2024 10:30 AM │ 966... │ Free Tea  │ ✅     │
│ b2c3d4e5... [📋]       │ Nov 27, 2024 09:15 AM │ 966... │ Discount  │ ⏳     │
│ c3d4e5f6... [📋]       │ Nov 27, 2024 08:45 AM │ 966... │ Coffee    │ ✅     │
│ d4e5f6g7... [📋]       │ Nov 26, 2024 04:20 PM │ 966... │ Discount  │ ⏳     │
│ e5f6g7h8... [📋]       │ Nov 26, 2024 02:10 PM │ 966... │ Tea       │ ✅     │
│ f6g7h8i9... [📋]       │ Nov 26, 2024 12:45 PM │ 966... │ Coffee    │ ✅     │
│ g7h8i9j0... [📋]       │ Nov 25, 2024 03:30 PM │ 966... │ Discount  │ ⏳     │
│ h8i9j0k1... [📋]       │ Nov 25, 2024 01:00 PM │ 966... │ Tea       │ ✅     │
│ i9j0k1l2... [📋]       │ Nov 24, 2024 11:20 AM │ 966... │ Coffee    │ ✅     │
│ j0k1l2m3... [📋]       │ Nov 24, 2024 09:50 AM │ 966... │ Discount  │ ⏳     │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 5. Coupon Data Example

### Coupon in Pending Status
```json
{
  "id": "12345678-abcd-ef01-2345-6789abcdef01",
  "phoneNumber": "966501234567",
  "campaign": {
    "rewardType": "free_coffee"
  },
  "createdAt": "2024-11-27T10:30:00Z",
  "isClaimed": false,
  "claimedAt": null
}
```

**Display to Manager**:
- Coupon ID: `12345678-abcd-ef01-2345-6789abcdef01`
- Generated: `Nov 27, 2024, 10:30 AM`
- Phone: `966 50 1234567`
- Reward: `Free Coffee`
- Status: `⏳ Pending`
- Claimed: `-`

### Coupon in Claimed Status
```json
{
  "id": "abcdef01-2345-6789-abcd-ef0123456789",
  "phoneNumber": "966509876543",
  "campaign": {
    "rewardType": "discount_10_percent"
  },
  "createdAt": "2024-11-27T09:15:00Z",
  "isClaimed": true,
  "claimedAt": "2024-11-27T10:45:00Z"
}
```

**Display to Manager**:
- Coupon ID: `abcdef01-2345-6789-abcd-ef0123456789`
- Generated: `Nov 27, 2024, 09:15 AM`
- Phone: `966 50 9876543`
- Reward: `10% Off on A-Stop`
- Status: `✅ Claimed`
- Claimed: `Nov 27, 2024, 10:45 AM`

## 6. Manager Workflow

### Scenario: Verify Customer Coupon
```
1. Customer calls: "Can you check my coupon status?"
   ↓
2. Manager goes to Dashboard
   ↓
3. Sees "Coupon/Reward Status" section
   ↓
4. Clicks "View Coupon Details"
   ↓
5. Searches for customer's phone: 966501234567
   ↓
6. Finds coupon in table
   ↓
7. Clicks "View" to see full details
   ↓
8. Confirms with customer: "Your coupon ID is 12345... 
                            generated on Nov 27 at 10:30 AM
                            Status: Pending (not yet claimed)"
   ↓
9. Customer can claim at counter
```

### Scenario: Track Redemptions
```
1. Manager wants to see which coupons were redeemed today
   ↓
2. Opens Dashboard and clicks "View Coupon Details"
   ↓
3. Looks at "Status" column
   ↓
4. Finds all "✅ Claimed" entries with today's date
   ↓
5. Can copy IDs for reconciliation: [📋] button
   ↓
6. Can share data with accounting/headquarters
```

### Scenario: Unclaimed Coupon Alert
```
1. Manager notices "Unclaimed" count is high
   ↓
2. Clicks "View Coupon Details"
   ↓
3. Filters by "⏳ Pending" status
   ↓
4. Sees old dates → might not be redeemed
   ↓
5. Can follow up with customers or extend dates
```

## 7. Key Information Available to Manager

✅ **Unique Coupon IDs** - UUID format for tracking
✅ **Generation Dates** - When coupon was created (with time)
✅ **Phone Numbers** - Customer contact for verification
✅ **Reward Types** - What can be redeemed (tea, coffee, discount)
✅ **Claim Status** - Is it pending or already claimed?
✅ **Claimed Dates** - When it was redeemed (if claimed)
✅ **Copy Functionality** - Easy to copy IDs for systems
✅ **Modal Details** - Full information on demand

## 8. Access Control

```
Manager A
├─ Can see coupons for Station A ✅
├─ Cannot see coupons for Station B ❌
└─ Cannot create/delete stations ❌

Admin
├─ Can see coupons for ALL stations ✅
├─ Can see which station generated each coupon ✅
├─ Can add/remove stations ✅
└─ Can view global coupon analytics ✅
```

---

## Summary

Managers now have complete visibility into:
1. 📊 Quick stats on coupon activity
2. 🔍 Detailed table of all coupons with key info
3. 📋 Unique IDs they can copy for tracking
4. 📅 Exact dates coupons were generated
5. 📱 Customer phone numbers for verification
6. ✅ Claim status for each coupon
7. 🎁 What reward type each coupon offers

**Result**: Full transparency and control over coupon redemptions at their station!
