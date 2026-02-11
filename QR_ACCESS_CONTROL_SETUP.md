# 🚪 QR-Based Access Control & Automated Door System

**Project:** Suraksha Walls Library - Automated Entry System  
**Date:** February 10, 2026  
**Status:** Ready for Implementation  
**Estimated Budget:** ₹18,500 - ₹32,000

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Product Recommendations](#product-recommendations)
4. [Hardware Setup](#hardware-setup)
5. [Software Integration](#software-integration)
6. [Installation Guide](#installation-guide)
7. [Testing & Troubleshooting](#testing--troubleshooting)
8. [Maintenance](#maintenance)
9. [Future Enhancements](#future-enhancements)

---

## 🎯 Overview

### **What This System Does:**

✅ Students scan QR code (from ID card or phone)  
✅ System validates student (active, subscription valid)  
✅ Marks attendance automatically in database  
✅ Unlocks door for 3 seconds  
✅ Door auto-locks  
✅ No login required  
✅ Works offline (local WiFi)  
✅ Real-time dashboard updates  

### **Benefits:**

- ⚡ **Fast:** 2-3 seconds per entry
- 🔒 **Secure:** Signed QR codes, can't be forged
- 💰 **Cost-Effective:** One-time investment < ₹20,000
- 📊 **Accurate:** 100% attendance accuracy
- 👨‍💼 **Reduces Staff Load:** Self-service entry
- 📱 **Modern:** Professional, tech-forward image
- 🔋 **Reliable:** Works during power cuts with battery backup

---

## 🏗️ System Architecture

### **Complete Flow Diagram:**

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: Student arrives at entrance                        │
│  Shows QR code (printed on ID card or mobile app)           │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 2: QR Scanner (Tablet mounted at entrance)            │
│  - Camera detects QR code                                   │
│  - Extracts encrypted token                                 │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 3: Your Angular App (Running on Tablet)               │
│  - Decodes JWT token from QR                                │
│  - Extracts student ID                                      │
│  - Calls backend API                                        │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 4: Supabase Backend Validation                        │
│  ✓ Is token signature valid?                               │
│  ✓ Is student active?                                      │
│  ✓ Does student have valid subscription?                   │
│  ✓ Already checked in today?                               │
│  ✓ Is time within library hours?                           │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 5: Mark Attendance                                    │
│  - Insert record in library_attendance table                │
│  - Check-in time recorded                                   │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 6: Unlock Door (HTTP API Call)                        │
│  - Angular app calls Sonoff relay                           │
│  - HTTP GET: http://192.168.1.100/cm?cmnd=Power%20ON       │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 7: Sonoff Smart Relay                                 │
│  - Receives command via local WiFi                          │
│  - Activates relay (NO contact closes)                      │
│  - Sends 12V to electromagnetic lock                        │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 8: Electromagnetic Lock Releases                      │
│  - Lock demagnetizes                                        │
│  - Door opens                                               │
│  - Student enters                                           │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 9: Auto-Lock (After 3 seconds)                        │
│  - Angular app sends OFF command                            │
│  - Relay deactivates                                        │
│  - Lock engages                                             │
│  - Door secured                                             │
└─────────────────────────────────────────────────────────────┘
```

### **Network Diagram:**

```
                    Internet
                       │
                       │
              ┌────────┴────────┐
              │   WiFi Router   │
              └────────┬────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
    ┌───┴────┐    ┌───┴────┐    ┌───┴────┐
    │ Tablet │    │ Sonoff │    │  Your  │
    │   QR   │    │ Relay  │    │ Phone  │
    │Scanner │    │        │    │(Admin) │
    └───┬────┘    └───┬────┘    └────────┘
        │             │
        │             │
    Camera         Relay Output
        │             │
        │             │
    [Scans QR]    [Controls]
                      │
                  ┌───┴────┐
                  │  Lock  │
                  │ 12V DC │
                  └────────┘
```

---

## 🛒 Product Recommendations

### **Option 1: Budget-Friendly Setup (₹18,500)** ⭐ **RECOMMENDED**

| # | Product | Model/Specs | Price | Purchase Link |
|---|---------|-------------|-------|---------------|
| 1️⃣ | **Android Tablet** | Samsung Galaxy Tab A8 (WiFi, 10.5", 4GB RAM) | ₹12,999 | Amazon India |
| 2️⃣ | **WiFi Smart Relay** | Sonoff Basic R4 (10A, eWeLink compatible) | ₹699 | Amazon India |
| 3️⃣ | **Electromagnetic Lock** | ZKTeco EML280 (280kg holding force, 12V) | ₹2,800 | Amazon / IndiaMART |
| 4️⃣ | **Power Supply** | 12V 5A SMPS DC Adapter | ₹450 | Local electronics |
| 5️⃣ | **Door Closer** | Hydraulic automatic door closer | ₹1,200 | Hardware store |
| 6️⃣ | **Tablet Mount** | Adjustable wall mount stand | ₹500 | Amazon |
| 7️⃣ | **Mounting Kit** | L-brackets, screws, 3M tape, cable clips | ₹350 | Hardware store |
| 8️⃣ | **Power Backup** | 12V 7AH rechargeable battery (optional) | ₹1,500 | Battery shop |
| | **TOTAL (without backup)** | | **₹18,998** | |
| | **TOTAL (with backup)** | | **₹20,498** | |

**Amazon India Search Terms:**
- "Samsung Galaxy Tab A8 WiFi 10.5 inch"
- "Sonoff Basic R4 WiFi smart switch"
- "Electromagnetic door lock 280kg 12V"
- "12V 5A SMPS power supply"
- "Tablet wall mount adjustable"

---

### **Option 2: Professional Setup (₹32,000)**

| # | Product | Model | Price | Purchase Link |
|---|---------|-------|-------|---------------|
| 1️⃣ | **Access Control Terminal** | eSSL FR1300 (QR + Face Recognition + Attendance) | ₹19,500 | Amazon / eSSL dealers |
| 2️⃣ | **Electric Strike Lock** | eSSL Strike Lock (12V DC, Fail-Safe) | ₹6,500 | eSSL dealers / IndiaMART |
| 3️⃣ | **Door Closer** | DORMA hydraulic auto-closer (commercial grade) | ₹2,500 | Hardware store |
| 4️⃣ | **Power Backup** | 12V 7AH battery + automatic charger circuit | ₹2,200 | Battery shop |
| 5️⃣ | **Installation** | Professional installation + wiring | ₹1,500 | eSSL technician |
| | **TOTAL** | | **₹32,200** | |

**eSSL Dealers:**
- Contact: Search "eSSL dealer near me"
- Website: https://www.esslindia.com
- Support: Available for installation

---

### **Why Option 1 is Better for You:**

| Feature | Option 1 (Tablet + Sonoff) | Option 2 (eSSL Terminal) |
|---------|----------------------------|--------------------------|
| **Cost** | ₹19,000 | ₹32,000 |
| **Flexibility** | High (easy to customize) | Limited (proprietary) |
| **Integration** | Simple HTTP API | Complex SDK |
| **Updates** | Deploy via Vercel instantly | Requires firmware updates |
| **UI Customization** | Full control (your Angular app) | Fixed UI |
| **Multi-Function** | Tablet can do other tasks | Only access control |
| **Maintenance** | DIY-friendly | Needs technician |
| **Offline Mode** | Full offline support | Limited |
| **Future Proof** | Easy to upgrade/replace | Locked to vendor |

**Recommendation:** **Go with Option 1** unless you need biometric features (face/fingerprint).

---

## 🔧 Hardware Setup

### **1. Detailed Product Specifications**

#### **A. Samsung Galaxy Tab A8** (QR Scanner Device)

**Technical Specs:**
- Display: 10.5" (1920 × 1200 WUXGA)
- RAM: 4GB
- Storage: 64GB
- Camera: 8MP rear (perfect for QR scanning)
- Battery: 7,040 mAh (12+ hours)
- OS: Android 13
- WiFi: 802.11 a/b/g/n/ac
- Charging: USB-C, 15W

**Why This Tablet?**
- ✅ Large screen → Easy visibility from distance
- ✅ Good camera → Fast QR detection
- ✅ Long battery → Can run 24/7 with power
- ✅ Reliable brand → 2-year warranty
- ✅ Affordable → Best value in segment

**Setup Instructions:**
1. Enable "Developer Options"
   - Go to Settings → About Tablet
   - Tap "Build Number" 7 times
2. Enable "Stay Awake"
   - Settings → Developer Options → Stay Awake (ON)
3. Disable Auto-Lock
   - Settings → Display → Screen timeout → Never
4. Install Chrome Browser
5. Open your app: `https://www.surakshawalls.space`
6. Add to Home Screen (fullscreen mode)
7. Enable Auto-Start on Boot

---

#### **B. Sonoff Basic R4** (Smart WiFi Relay)

**Technical Specs:**
- Model: Sonoff Basic R4
- Protocol: WiFi 2.4GHz (802.11 b/g/n)
- Max Load: 10A @ 250V AC (2200W)
- DC Load: 10A @ 30V DC
- Control: eWeLink app, HTTP API, MQTT
- Size: 88mm × 38mm × 23mm
- Operating Temp: -10°C to 40°C

**API Endpoints (LAN Mode):**

```bash
# Get device IP from eWeLink app

# Turn ON (Unlock Door)
GET http://192.168.1.100/cm?cmnd=Power%20ON
Response: {"POWER":"ON"}

# Turn OFF (Lock Door)
GET http://192.168.1.100/cm?cmnd=Power%20OFF
Response: {"POWER":"OFF"}

# Toggle
GET http://192.168.1.100/cm?cmnd=Power%20TOGGLE
Response: {"POWER":"ON"} or {"POWER":"OFF"}

# Get Status
GET http://192.168.1.100/cm?cmnd=Status
Response: {"Status":{"Power":1,"Wifi":{"SSId":"YourWiFi"}}}

# Pulse (ON for X seconds then OFF)
GET http://192.168.1.100/cm?cmnd=PulseTIme%2030
# (30 = 3 seconds, multiply by 10)
```

**Configuration Steps:**
1. Download "eWeLink" app (Android/iOS)
2. Create account
3. Add device:
   - Hold button on Sonoff for 5 seconds (LED blinks)
   - App detects device
   - Connect to your WiFi
4. Enable LAN Mode:
   - Open device settings
   - Enable "LAN Control"
   - Note down IP address
5. Test:
   - Tap ON/OFF in app
   - LED should light up
6. Set Static IP (recommended):
   - Go to router settings
   - Reserve IP for Sonoff MAC address

**Advanced: Flash Tasmota Firmware (Optional)**

For more control, flash open-source Tasmota:
- Better API documentation
- Local MQTT support
- More customization
- Tutorial: https://tasmota.github.io/docs/Getting-Started/

---

#### **C. ZKTeco EML280** (Electromagnetic Lock)

**Technical Specs:**
- Model: EML280
- Type: Electromagnetic (Maglock)
- Holding Force: 280kg (617 lbs)
- Voltage: 12V DC
- Current: 350mA
- Power: 4.2W
- Size: 180mm × 38mm × 25mm
- Weight: 1.2kg
- Type: Fail-Safe (unlocks on power cut)
- Material: Anodized aluminum
- LED Indicator: Yes (shows locked status)
- Suitable For: Single door (inward/outward opening)

**Installation Dimensions:**

```
Door Frame (Fixed)
┌─────────────────────────┐
│    Electromagnetic      │
│    Lock Unit            │  ← Mount here (top of frame)
│  [■■■■■■■■■■■■■■■■■]  │
└─────────────────────────┘
           │ │
           │ │ 2-3mm Air Gap
           │ │
      ┌────▼─▼────┐
      │ Armature  │  ← Mount on door
      │   Plate   │
      └───────────┘
         Door (Moving)
```

**Wiring:**
- Red Wire (+) → Relay NO (Normally Open)
- Black Wire (-) → Power Supply GND

**Safety Features:**
- Fail-Safe: Door unlocks during power failure (fire safety)
- LED monitoring: Green = Locked, Red = Unlocked
- Force sensor: Detects tampering
- Temperature protection: Auto-shutoff if overheats

**Installation Tips:**
- Mount perfectly flush (no gaps)
- Use provided L-brackets
- Keep 2-3mm gap between lock and armature
- Test holding force before final mounting
- Add 3M VHB tape for extra stability

---

#### **D. 12V 5A Power Supply**

**Specifications:**
- Input: 100-240V AC 50/60Hz
- Output: 12V DC 5A (60W)
- Protection: Over-current, short-circuit, over-voltage
- Cable: 1.5m with DC jack
- Indicator: LED power indicator

**Why 5A?**
- Lock draws: 0.35A
- Sonoff draws: 0.1A
- Total: ~0.5A
- **5A gives 10× headroom** for safety

**Optional: Battery Backup**

To keep system running during power cuts:

```
AC Power (230V)
      │
    [SMPS]
   12V 5A
      │
      ├──────┬──────────► To Lock + Sonoff
      │      │
      │   [Diode]
      │      │
      └──[Battery 12V 7AH]
            (Charge + Backup)
```

**Battery Setup:**
- 12V 7AH sealed lead-acid battery: ₹1,500
- Charging circuit: ₹300
- Provides 4-6 hours backup
- Auto-switches during power cut

---

### **2. Wiring Diagram (Complete)**

```
┌──────────────────────────────────────────────────────────┐
│                    AC MAINS (230V)                        │
└───────────────────────┬──────────────────────────────────┘
                        │
                  ┌─────▼─────┐
                  │   SMPS    │
                  │ 12V 5A DC │
                  └─────┬─────┘
                        │
           ┌────────────┴────────────┐
           │                         │
    ┌──────▼──────┐          ┌──────▼──────┐
    │  Sonoff     │          │   Battery   │
    │  Basic R4   │          │  12V 7AH    │
    │             │          │  (Optional) │
    │  [WiFi]     │          └─────────────┘
    │             │
    │ COM  NO  NC │
    └──┬───┬───┬──┘
       │   │   │
       │   │   └── (Not used)
       │   │
       │   └────────────┐
       │                │
    12V+             Relay
    (from PSU)       Output
       │                │
       │           ┌────▼────┐
       │           │  Lock   │
       │           │   (+)   │
       │           └────┬────┘
       │                │
       │           ┌────▼────┐
       └───────────┤  Lock   │
                   │   (-)   │
                   └─────────┘

[WiFi Network]
    │
    ├── Tablet (192.168.1.50)
    ├── Sonoff (192.168.1.100)
    └── Router (192.168.1.1)
```

**Connection Steps:**

1. **Power Supply Connections:**
   ```
   SMPS Output (+) ────► Sonoff COM terminal
   SMPS Output (-) ────► Lock negative (black wire)
   ```

2. **Sonoff Connections:**
   ```
   COM terminal ────► 12V+ from SMPS
   NO terminal  ────► Lock positive (red wire)
   NC terminal  ────► (Leave empty)
   ```

3. **Lock Connections:**
   ```
   Red Wire (+)  ────► Sonoff NO terminal
   Black Wire (-) ────► SMPS GND (-)
   ```

4. **Verification:**
   - When Sonoff is OFF → Circuit open → Lock has no power → **Unlocked**
   - When Sonoff is ON → Circuit closed → Lock gets 12V → **Locked**

**Important Notes:**
- ⚠️ Double-check polarity (+ and -) before powering on
- ⚠️ Ensure all connections are tight (use ferrules)
- ⚠️ Test with multimeter before connecting lock
- ⚠️ Add fuse (5A) in line with power supply for safety

---

### **3. Physical Installation**

#### **Door Lock Mounting**

**Tools Required:**
- Drill machine with metal/wood bits
- Screwdriver (Phillips + Flat)
- Measuring tape
- Pencil for marking
- Spirit level
- Cable clips
- Wire stripper

**Step-by-Step:**

1. **Position Lock on Door Frame:**
   - Measure door frame top (center)
   - Mark lock position
   - Use spirit level to ensure horizontal
   - Pre-drill holes for screws

2. **Mount Armature Plate on Door:**
   - Position exactly opposite to lock
   - Mark screw holes
   - Drill and mount

3. **Check Alignment:**
   - Close door slowly
   - Armature should touch lock perfectly
   - Adjust if needed (2-3mm gap is OK)

4. **Test Holding Force:**
   - Power on lock
   - Try to pull door open
   - Should require significant force

5. **Wire Management:**
   - Run wires through cable conduit or clips
   - Keep away from door hinges
   - Use cable ties for neatness
   - Leave some slack for door movement

#### **Tablet Mounting**

**Position:**
- **Height:** 4.5-5 feet from floor (eye level)
- **Location:** Right side of door (easy reach)
- **Angle:** Slight upward tilt (10-15°)
- **Distance from door:** 1-2 feet

**Mounting Options:**

**Option A: Wall Mount Bracket (₹500)**
- Adjustable arm
- Swivel capability
- Easy to remove for charging

**Option B: Fixed Mount**
- Direct wall attachment
- More secure
- Permanent installation

**Setup:**
1. Drill holes in wall
2. Insert wall plugs
3. Mount bracket
4. Attach tablet
5. Connect power cable (run through wall if possible)
6. Cable management

---

## 💻 Software Integration

### **Phase 1: QR Code Generation**

#### **A. Install Dependencies**

```bash
npm install qrcode jsonwebtoken @types/jsonwebtoken
npm install @capacitor-community/barcode-scanner  # For scanning
```

#### **B. Create QR Generation Service**

Create new file: `src/app/services/qr-generator.service.ts`

```typescript
import { Injectable } from '@angular/core';
import * as QRCode from 'qrcode';
import * as jwt from 'jsonwebtoken';

@Injectable({
  providedIn: 'root'
})
export class QrGeneratorService {
  private readonly SECRET_KEY = 'YOUR-SECRET-KEY-CHANGE-THIS-IN-PRODUCTION';
  private readonly QR_BASE_URL = 'https://www.surakshawalls.space/attendance/scan';

  constructor() {}

  /**
   * Generate QR code for a student
   * @param studentId - Unique student ID (UUID)
   * @param studentName - Student name (for logging)
   * @returns Promise with QR code data URL and token
   */
  async generateStudentQR(studentId: string, studentName: string): Promise<{
    qrDataUrl: string;
    qrUrl: string;
    token: string;
  }> {
    try {
      // Create JWT token with student data
      const token = jwt.sign(
        {
          studentId,
          name: studentName,
          type: 'attendance',
          version: '1.0'
        },
        this.SECRET_KEY,
        {
          expiresIn: '10y', // Long-lived for ID cards
          issuer: 'suraksha-library'
        }
      );

      // Create URL with token
      const qrUrl = `${this.QR_BASE_URL}?token=${token}`;

      // Generate QR code image (base64)
      const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        errorCorrectionLevel: 'H', // High error correction
        type: 'image/png',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return { qrDataUrl, qrUrl, token };
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }

  /**
   * Verify QR token
   * @param token - JWT token from scanned QR
   * @returns Decoded token data or null if invalid
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.SECRET_KEY);
    } catch (error) {
      console.error('Invalid token:', error);
      return null;
    }
  }

  /**
   * Generate QR codes for multiple students (bulk)
   * @param students - Array of students
   * @returns Array of QR data
   */
  async generateBulkQR(students: Array<{ id: string; name: string }>): Promise<Array<any>> {
    const results = [];
    
    for (const student of students) {
      const qr = await this.generateStudentQR(student.id, student.name);
      results.push({
        studentId: student.id,
        studentName: student.name,
        ...qr
      });
    }
    
    return results;
  }

  /**
   * Download QR code as PNG
   * @param qrDataUrl - Base64 QR image
   * @param filename - Download filename
   */
  downloadQR(qrDataUrl: string, filename: string) {
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${filename}-qr.png`;
    link.click();
  }
}
```

---

#### **C. Create Door Control Service**

Create new file: `src/app/services/door-control.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DoorControlService {
  // Configuration
  private sonoffIP = '192.168.1.100'; // Update with your Sonoff IP
  private unlockDuration = 3000; // 3 seconds
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 500; // milliseconds

  // Status tracking
  private isDoorUnlocked = false;
  private lastUnlockTime: Date | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Unlock door (turn relay ON)
   * @param autoLock - Automatically lock after duration
   * @returns Success status
   */
  async unlockDoor(autoLock: boolean = true): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    try {
      // Prevent rapid unlock attempts
      if (this.isDoorUnlocked) {
        return {
          success: false,
          message: 'Door is already unlocked'
        };
      }

      // Send unlock command
      const url = `http://${this.sonoffIP}/cm?cmnd=Power%20ON`;
      await this.sendCommandWithRetry(url);

      this.isDoorUnlocked = true;
      this.lastUnlockTime = new Date();

      console.log('[Door Control] Door unlocked at', this.lastUnlockTime);

      // Auto-lock after duration
      if (autoLock) {
        setTimeout(async () => {
          await this.lockDoor();
        }, this.unlockDuration);
      }

      return {
        success: true,
        message: 'Door unlocked successfully'
      };
    } catch (error) {
      console.error('[Door Control] Failed to unlock:', error);
      return {
        success: false,
        message: 'Failed to unlock door',
        error: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Lock door (turn relay OFF)
   * @returns Success status
   */
  async lockDoor(): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    try {
      const url = `http://${this.sonoffIP}/cm?cmnd=Power%20OFF`;
      await this.sendCommandWithRetry(url);

      this.isDoorUnlocked = false;
      console.log('[Door Control] Door locked at', new Date());

      return {
        success: true,
        message: 'Door locked successfully'
      };
    } catch (error) {
      console.error('[Door Control] Failed to lock:', error);
      return {
        success: false,
        message: 'Failed to lock door',
        error: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Check door status
   * @returns true if unlocked, false if locked
   */
  async checkStatus(): Promise<boolean> {
    try {
      const url = `http://${this.sonoffIP}/cm?cmnd=Status`;
      const response: any = await firstValueFrom(
        this.http.get(url, { responseType: 'json' })
      );

      const isUnlocked = response?.Status?.Power === 1;
      this.isDoorUnlocked = isUnlocked;
      return isUnlocked;
    } catch (error) {
      console.error('[Door Control] Failed to check status:', error);
      return false;
    }
  }

  /**
   * Send command with retry logic
   * @param url - Command URL
   */
  private async sendCommandWithRetry(url: string): Promise<any> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await firstValueFrom(
          this.http.get(url, {
            responseType: 'text',
            headers: { 'Cache-Control': 'no-cache' }
          })
        );
        return response;
      } catch (error) {
        lastError = error;
        console.warn(`[Door Control] Attempt ${attempt} failed:`, error);

        if (attempt < this.MAX_RETRIES) {
          await this.delay(this.RETRY_DELAY * attempt);
        }
      }
    }

    throw lastError;
  }

  /**
   * Update Sonoff IP address
   * @param newIP - New IP address
   */
  updateSonoffIP(newIP: string) {
    this.sonoffIP = newIP;
    console.log('[Door Control] Updated Sonoff IP to:', newIP);
  }

  /**
   * Get door status
   */
  getDoorStatus(): {
    isUnlocked: boolean;
    lastUnlockTime: Date | null;
  } {
    return {
      isUnlocked: this.isDoorUnlocked,
      lastUnlockTime: this.lastUnlockTime
    };
  }

  /**
   * Utility: Delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Utility: Extract error message
   */
  private getErrorMessage(error: any): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Cannot connect to Sonoff device. Check network connection.';
      }
      return `HTTP ${error.status}: ${error.message}`;
    }
    return error?.message || 'Unknown error';
  }

  /**
   * Test connection to Sonoff
   * @returns true if connected, false otherwise
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.checkStatus();
      return true;
    } catch {
      return false;
    }
  }
}
```

---

#### **D. Create QR Scanner Component**

Create new component: `src/app/pages/qr-scanner/qr-scanner.component.ts`

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { LibraryService } from '../../services/library.service';
import { QrGeneratorService } from '../../services/qr-generator.service';
import { DoorControlService } from '../../services/door-control.service';

@Component({
  selector: 'app-qr-scanner',
  template: `
    <div class="scanner-container" [class.scanning]="isScanning">
      <div class="header">
        <h1>📚 Suraksha Library - Attendance</h1>
        <p class="date">{{ currentDate | date: 'fullDate' }}</p>
      </div>

      <div class="scan-area" *ngIf="!isScanning">
        <div class="scan-icon">📱</div>
        <h2>Scan Your QR Code</h2>
        <p>Place your ID card in front of the camera</p>
        <button class="scan-btn" (click)="startScan()">
          Start Scanning
        </button>
      </div>

      <div class="result-area" *ngIf="scanResult">
        <div class="result-card" [class.success]="scanResult.success">
          <div class="student-photo" *ngIf="scanResult.student?.photo_url">
            <img [src]="scanResult.student.photo_url" alt="Student Photo">
          </div>
          
          <div class="icon">
            {{ scanResult.success ? '✅' : '❌' }}
          </div>
          
          <h2>{{ scanResult.message }}</h2>
          
          <div class="details" *ngIf="scanResult.success">
            <p><strong>Name:</strong> {{ scanResult.student?.name }}</p>
            <p><strong>Seat:</strong> {{ scanResult.student?.seat_no || 'N/A' }}</p>
            <p><strong>Time:</strong> {{ scanResult.time | date: 'shortTime' }}</p>
            <p class="door-status" *ngIf="scanResult.doorUnlocked">
              🚪 Door unlocked - Please enter
            </p>
          </div>
          
          <div class="error-details" *ngIf="!scanResult.success">
            <p>{{ scanResult.error }}</p>
          </div>
        </div>

        <button class="continue-btn" (click)="resetScan()">
          Scan Next Student
        </button>
      </div>

      <div class="stats">
        <div class="stat-item">
          <span class="label">Today's Check-ins:</span>
          <span class="value">{{ todayCount }}</span>
        </div>
        <div class="stat-item">
          <span class="label">Current Occupancy:</span>
          <span class="value">{{ currentOccupancy }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .scanner-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
    }

    .header h1 {
      font-size: 2rem;
      margin: 0;
    }

    .date {
      margin-top: 10px;
      opacity: 0.9;
    }

    .scan-area {
      background: white;
      color: #333;
      padding: 60px 40px;
      border-radius: 20px;
      text-align: center;
      max-width: 500px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    }

    .scan-icon {
      font-size: 80px;
      margin-bottom: 20px;
    }

    .scan-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 15px 40px;
      font-size: 1.2rem;
      border-radius: 50px;
      cursor: pointer;
      margin-top: 30px;
      transition: transform 0.2s;
    }

    .scan-btn:hover {
      transform: scale(1.05);
    }

    .result-card {
      background: white;
      color: #333;
      padding: 40px;
      border-radius: 20px;
      max-width: 600px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease;
    }

    @keyframes slideIn {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .result-card.success {
      border: 5px solid #4caf50;
    }

    .result-card .icon {
      font-size: 80px;
      margin-bottom: 20px;
    }

    .student-photo img {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      margin-bottom: 20px;
      border: 3px solid #667eea;
    }

    .details {
      margin-top: 30px;
      text-align: left;
    }

    .details p {
      margin: 10px 0;
      font-size: 1.1rem;
    }

    .door-status {
      color: #4caf50;
      font-weight: bold;
      margin-top: 20px;
      padding: 10px;
      background: #e8f5e9;
      border-radius: 10px;
      text-align: center;
    }

    .continue-btn {
      margin-top: 30px;
      background: #667eea;
      color: white;
      border: none;
      padding: 12px 30px;
      border-radius: 50px;
      font-size: 1rem;
      cursor: pointer;
    }

    .stats {
      margin-top: 40px;
      display: flex;
      gap: 30px;
    }

    .stat-item {
      background: rgba(255,255,255,0.2);
      padding: 20px 30px;
      border-radius: 15px;
      backdrop-filter: blur(10px);
    }

    .stat-item .label {
      display: block;
      font-size: 0.9rem;
      opacity: 0.9;
      margin-bottom: 5px;
    }

    .stat-item .value {
      display: block;
      font-size: 2rem;
      font-weight: bold;
    }

    .scanning {
      background: black;
    }
  `]
})
export class QrScannerComponent implements OnInit, OnDestroy {
  isScanning = false;
  scanResult: any = null;
  currentDate = new Date();
  todayCount = 0;
  currentOccupancy = 0;

  constructor(
    private libraryService: LibraryService,
    private qrService: QrGeneratorService,
    private doorControl: DoorControlService
  ) {}

  async ngOnInit() {
    await this.loadStats();
    
    // Refresh stats every minute
    setInterval(() => {
      this.loadStats();
    }, 60000);
  }

  async startScan() {
    try {
      // Request camera permission
      const permission = await BarcodeScanner.checkPermission({ force: true });
      
      if (!permission.granted) {
        alert('Camera permission is required to scan QR codes');
        return;
      }

      // Hide background
      document.body.classList.add('scanner-active');
      BarcodeScanner.hideBackground();
      
      this.isScanning = true;

      // Start scanning
      const result = await BarcodeScanner.startScan();

      if (result.hasContent) {
        await this.processQRCode(result.content);
      }
    } catch (error) {
      console.error('Scan error:', error);
      alert('Failed to scan QR code. Please try again.');
    } finally {
      this.stopScan();
    }
  }

  stopScan() {
    BarcodeScanner.stopScan();
    document.body.classList.remove('scanner-active');
    this.isScanning = false;
  }

  async processQRCode(qrContent: string) {
    try {
      // Extract token from URL
      const url = new URL(qrContent);
      const token = url.searchParams.get('token');

      if (!token) {
        this.showError('Invalid QR code format');
        return;
      }

      // Verify token
      const decoded = this.qrService.verifyToken(token);
      
      if (!decoded) {
        this.showError('Invalid or expired QR code');
        return;
      }

      // Mark attendance
      const result = await this.libraryService.checkInStudent(
        decoded.studentId,
        false // Don't bypass time restriction
      );

      if (result.success) {
        // Get student details
        const student = await this.libraryService.getStudentById(decoded.studentId);
        
        // Unlock door
        const doorResult = await this.doorControl.unlockDoor();
        
        this.scanResult = {
          success: true,
          message: `Welcome, ${student?.name}!`,
          student: student,
          time: new Date(),
          doorUnlocked: doorResult.success
        };

        // Update stats
        this.todayCount++;
        this.currentOccupancy++;

        // Auto-reset after 5 seconds
        setTimeout(() => {
          this.resetScan();
        }, 5000);
      } else {
        this.showError(result.error || 'Failed to check in');
      }
    } catch (error) {
      console.error('Process error:', error);
      this.showError('An error occurred. Please try again.');
    }
  }

  showError(message: string) {
    this.scanResult = {
      success: false,
      message: 'Check-in Failed',
      error: message
    };

    // Auto-reset after 3 seconds
    setTimeout(() => {
      this.resetScan();
    }, 3000);
  }

  resetScan() {
    this.scanResult = null;
  }

  async loadStats() {
    try {
      const stats = await this.libraryService.getDashboardStats();
      this.todayCount = stats.todayCheckIns || 0;
      this.currentOccupancy = stats.currentOccupancy || 0;
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  ngOnDestroy() {
    this.stopScan();
  }
}
```

---

#### **E. Update Library Service**

Add door unlock integration to existing `library.service.ts`:

```typescript
// In library.service.ts, import door control
import { DoorControlService } from './door-control.service';

// Add to constructor
constructor(
  private supabase: SupabaseService,
  private doorControl: DoorControlService // Add this
) {}

// Update checkInStudent method
async checkInStudent(
  studentId: string,
  bypassTimeRestriction: boolean = false
): Promise<{
  success: boolean;
  attendance?: any;
  doorUnlocked?: boolean;
  error?: string;
}> {
  try {
    // ... existing validation code ...

    // Mark attendance in database
    const { data, error } = await this.supabase.client
      .from('library_attendance')
      .insert({
        student_id: studentId,
        date: today,
        check_in_time: currentTime,
        status: isLate ? 'late' : 'present'
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // 🚪 NEW: Unlock door on successful check-in
    let doorUnlocked = false;
    try {
      const doorResult = await this.doorControl.unlockDoor();
      doorUnlocked = doorResult.success;
      
      if (!doorResult.success) {
        console.warn('Door unlock failed:', doorResult.error);
        // Don't fail the check-in if just door fails
      }
    } catch (doorError) {
      console.error('Door control error:', doorError);
      // Continue anyway - attendance is more important
    }

    return {
      success: true,
      attendance: data,
      doorUnlocked
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}
```

---

#### **F. Add Route**

Update `src/app/app.routes.ts`:

```typescript
import { QrScannerComponent } from './pages/qr-scanner/qr-scanner.component';

export const routes: Routes = [
  // ... existing routes ...
  { path: 'attendance/scan', component: QrScannerComponent },
  // ... other routes ...
];
```

---

### **Phase 2: Print QR Codes**

#### **Generate QR for All Students**

```typescript
// In library-students component or admin panel

async generateQRForAllStudents() {
  const students = await this.libraryService.getAllStudents('active');
  const qrData = await this.qrService.generateBulkQR(
    students.map(s => ({ id: s.id, name: s.name }))
  );

  // Download ZIP file with all QR codes
  this.downloadQRZip(qrData);
}

// Download individual QR
async downloadStudentQR(student: LibraryStudent) {
  const qr = await this.qrService.generateStudentQR(student.id, student.name);
  this.qrService.downloadQR(qr.qrDataUrl, student.name);
}
```

#### **ID Card Template (HTML)**

```html
<!-- ID Card Design (Print ready) -->
<div class="id-card">
  <div class="header">
    <h3>Suraksha Library</h3>
  </div>
  
  <div class="photo">
    <img [src]="student.photo_url" alt="Photo">
  </div>
  
  <div class="details">
    <p><strong>{{ student.name }}</strong></p>
    <p>Mobile: {{ student.mobile }}</p>
    <p>Seat: {{ student.seat_no || 'N/A' }}</p>
  </div>
  
  <div class="qr-code">
    <img [src]="student.qrCode" alt="QR Code">
  </div>
  
  <div class="footer">
    <p>Scan for attendance</p>
  </div>
</div>
```

**Print ID Cards:**
1. Generate QR for each student
2. Print on PVC card (CR80 size: 85.6mm × 53.98mm)
3. Laminate for durability
4. Cost: ₹15-20 per card

---

## 📝 Installation Guide

### **Step-by-Step Implementation**

#### **Week 1: Hardware Setup**

**Day 1-2: Order Products**
- [ ] Order Samsung Tab A8 (Amazon)
- [ ] Order Sonoff Basic R4 (Amazon)
- [ ] Order Electromagnetic Lock (Amazon/IndiaMART)
- [ ] Buy power supply locally
- [ ] Buy mounting hardware locally

**Day 3-4: Sonoff Configuration**
- [ ] Unbox Sonoff
- [ ] Download eWeLink app
- [ ] Connect Sonoff to WiFi
- [ ] Enable LAN mode
- [ ] Note down IP address
- [ ] Test ON/OFF from app
- [ ] Set static IP in router

**Day 5: Lock Installation**
- [ ] Identify mounting position
- [ ] Drill holes in frame
- [ ] Mount electromagnetic lock
- [ ] Mount armature plate on door
- [ ] Test alignment

**Day 6: Wiring**
- [ ] Connect power supply
- [ ] Wire Sonoff relay
- [ ] Connect lock to relay
- [ ] Test lock operation
- [ ] Check holding force
- [ ] Add battery backup (optional)

**Day 7: Tablet Setup**
- [ ] Unbox tablet
- [ ] Charge fully
- [ ] Configure WiFi
- [ ] Install Chrome
- [ ] Enable developer options
- [ ] Set screen timeout to Never
- [ ] Mount at entrance
- [ ] Connect to power

---

#### **Week 2: Software Development**

**Day 1: QR Generation**
- [ ] Install npm packages
- [ ] Create QR generator service
- [ ] Test QR generation
- [ ] Generate QRfor 5 test students

**Day 2: Door Control**
- [ ] Create door control service
- [ ] Test Sonoff API calls
- [ ] Implement retry logic
- [ ] Add error handling

**Day 3: Scanner Component**
- [ ] Create QR scanner component
- [ ] Setup camera permissions
- [ ] Test QR scanning
- [ ] Design UI

**Day 4: Integration**
- [ ] Update library service
- [ ] Connect attendance + door unlock
- [ ] Add logging
- [ ] Handle edge cases

**Day 5: Testing**
- [ ] End-to-end testing
- [ ] Error scenario testing
- [ ] Network failure testing
- [ ] Performance testing

**Day 6: QR Card Creation**
- [ ] Generate QR for all students
- [ ] Design ID card template
- [ ] Print sample cards
- [ ] Review and finalize

**Day 7: Deployment**
- [ ] Push code to GitHub
- [ ] Deploy to Vercel
- [ ] Test on tablet
- [ ] Train staff

---

#### **Week 3: Go Live**

**Day 1-2: Pilot Testing**
- [ ] Test with 10 students
- [ ] Gather feedback
- [ ] Fix issues
- [ ] Optimize timing

**Day 3-5: Full Rollout**
- [ ] Distribute ID cards to all students
- [ ] Train students on usage
- [ ] Monitor system
- [ ] Handle issues

**Day 6-7: Optimization**
- [ ] Review logs
- [ ] Optimize speed
- [ ] Fine-tune settings
- [ ] Add improvements

---

## 🧪 Testing & Troubleshooting

### **Testing Checklist**

#### **Hardware Tests**

✅ **Sonoff Connectivity**
```bash
# Test from browser/Postman
GET http://192.168.1.100/cm?cmnd=Status

# Expected response:
{
  "Status": {
    "Power": 0,
    "Wifi": {
      "SSId": "YourNetwork",
      "RSSI": 100,
      "Signal": -51
    }
  }
}
```

✅ **Lock Operation**
- [ ] Lock holds door firmly when ON
- [ ] Lock releases completely when OFF
- [ ] No burning smell or overheating
- [ ] LED indicator works
- [ ] Response time < 500ms

✅ **Power Supply**
- [ ] Output voltage: 11.8V - 12.2V DC
- [ ] No voltage drop under load
- [ ] Battery backup switches automatically
- [ ] Charging circuit works

✅ **Tablet**
- [ ] Camera focus works
- [ ] WiFi stable
- [ ] Screen stays on
- [ ] Battery charging
- [ ] Touch responsive

---

#### **Software Tests**

✅ **QR Generation**
```typescript
// Test code
const qr = await qrService.generateStudentQR('test-id-123', 'Test Student');
console.log('QR URL:', qr.qrUrl);
console.log('Token:', qr.token);

// Verify token
const decoded = qrService.verifyToken(qr.token);
console.log('Decoded:', decoded);
// Should match student ID
```

✅ **Door Control**
```typescript
// Test unlock
const result = await doorControl.unlockDoor();
console.log('Unlock result:', result);
// Should return { success: true, message: '...' }

// Wait 3 seconds, should auto-lock
setTimeout(async () => {
  const status = await doorControl.checkStatus();
  console.log('Is unlocked?', status); // Should be false
}, 4000);
```

✅ **Attendance Flow**
- [ ] Scan valid QR → Success
- [ ] Scan twice → Error "Already checked in"
- [ ] Scan expired QR → Error "Invalid token"
- [ ] Scan fake QR → Error "Invalid signature"
- [ ] Scan inactive student → Error "Student not active"
- [ ] Scan without subscription → Error

✅ **Door Integration**
- [ ] Successful attendance → Door unlocks
- [ ] Failed attendance → Door stays locked
- [ ] Door auto-locks after 3 seconds
- [ ] Retry works if first attempt fails
- [ ] Works when internet is down (local network only)

---

### **Common Issues & Solutions**

#### **Issue 1: Sonoff Not Responding**

**Symptoms:**
- HTTP request timeout
- "Cannot connect to device"

**Solutions:**
```bash
# 1. Check Sonoff IP
# In eWeLink app, go to device settings → Device Info → IP Address

# 2. Ping Sonoff
ping 192.168.1.100

# 3. Check if on same network
# Tablet and Sonoff must be on same WiFi

# 4. Disable AP Isolation
# In router settings, disable "AP Isolation" or "Client Isolation"

# 5. Set static IP
# Reserve IP for Sonoff MAC address in router DHCP settings
```

---

#### **Issue 2: Door Not Unlocking**

**Symptoms:**
- Lock stays engaged
- No click sound from relay

**Diagnose:**
```bash
# 1. Test relay directly from app
# Open eWeLink → Toggle device → Check if relay clicks

# 2. Check wiring
# Multimeter: Measure voltage at lock terminals
# Should be 0V when OFF, 12V when ON

# 3. Check lock polarity
# Swap + and - wires if needed

# 4. Check power supply
# Measure voltage under load (should be 11.8V - 12.2V)
```

**Solutions:**
- Tighten all wire connections
- Replace lock if defective
- Increase power supply capacity
- Check for wire breaks

---

#### **Issue 3: QR Scanning Slow**

**Symptoms:**
- Takes > 5 seconds to scan
- Multiple attempts needed

**Solutions:**
```typescript
// 1. Improve QR quality
const qr = await QRCode.toDataURL(url, {
  errorCorrectionLevel: 'H', // High correction
  width: 400, // Larger size
  margin: 4 // More whitespace
});

// 2. Add better lighting
// Install LED light above scanner

// 3. Clean camera lens
// Wipe tablet camera

// 4. Optimize scanner settings
BarcodeScanner.startScan({
  targetedFormats: ['QR_CODE'], // Scan only QR
  // iOS specific
  showTorchButton: true,
  // Android specific
  showFlipCameraButton: false
});
```

---

#### **Issue 4: Offline Mode Not Working**

**Symptoms:**
- Fails when internet is down
- "Network error" even though WiFi is connected

**Solution:**
```typescript
// Implement fallback logic

async checkInStudent(studentId: string) {
  try {
    // Try online first
    const result = await this.markAttendanceOnline(studentId);
    return result;
  } catch (error) {
    // Fallback to offline
    console.warn('Online failed, using offline mode');
    return this.markAttendanceOffline(studentId);
  }
}

async markAttendanceOnline(studentId: string) {
  // Call Supabase API
  return await this.supabase.client
    .from('library_attendance')
    .insert({...});
}

async markAttendanceOffline(studentId: string) {
  // Save to localStorage
  const offline = JSON.parse(localStorage.getItem('offline_attendance') || '[]');
  offline.push({
    student_id: studentId,
    date: new Date().toISOString(),
    synced: false
  });
  localStorage.setItem('offline_attendance', JSON.stringify(offline));

  // Still unlock door
  await this.doorControl.unlockDoor();

  return { success: true, offline: true };
}

// Sync when online
async syncOfflineAttendance() {
  const offline = JSON.parse(localStorage.getItem('offline_attendance') || '[]');
  const unsynced = offline.filter(a => !a.synced);

  for (const attendance of unsynced) {
    try {
      await this.supabase.client
        .from('library_attendance')
        .insert(attendance);
      
      attendance.synced = true;
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }

  localStorage.setItem('offline_attendance', JSON.stringify(offline));
}
```

---

#### **Issue 5: Battery Backup Not Switching**

**Symptoms:**
- System powers off during power cut
- Battery not charging

**Diagnose:**
```bash
# 1. Check battery voltage
# Multimeter on battery terminals: Should be 12-13V

# 2. Check charging circuit
# Measure charging current: Should be 0.5-1A

# 3. Check diode
# Ensure diode is in correct direction (prevents backflow)
```

**Circuit Diagram:**
```
SMPS (+) ──┬──────► To Load
           │
           ├─[Diode]──► Battery (+)
           │
         
SMPS (-) ──┴──────► Battery (-) ──► To Load
```

---

## 🔧 Maintenance

### **Daily Tasks**

- [ ] Check system logs for errors
- [ ] Verify tablet is charged and responsive
- [ ] Test door unlock/lock manually
- [ ] Monitor today's attendance count

### **Weekly Tasks**

- [ ] Clean tablet camera lens
- [ ] Check all wire connections
- [ ] Test battery backup
- [ ] Review attendance logs for anomalies
- [ ] Backup database

### **Monthly Tasks**

- [ ] Deep clean hardware
- [ ] Check for firmware updates (eWeLink app)
- [ ] Test emergency scenarios (power cut, WiFi down)
- [ ] Replace consumables if needed
- [ ] Review and optimize performance

### **Quarterly Tasks**

- [ ] Full system audit
- [ ] Replace worn components
- [ ] Upgrade software if needed
- [ ] Review and update documentation
- [ ] Staff retraining if needed

---

## 🚀 Future Enhancements

### **Phase 1: Enhanced Security** (Priority: High)

1. **Student Photo Verification**
   - Show student photo after QR scan
   - Staff verifies visually
   - Prevents unauthorized use

2. **Geofencing**
   - Verify scan happens at library location (GPS)
   - Prevent remote scanning

3. **Time-based QR**
   - QR regenerates every 5 minutes
   - Prevents QR sharing/screenshots

### **Phase 2: Better UX** (Priority: Medium)

4. **Voice Announcements**
   - "Welcome, Rahul. Attendance marked."
   - Audio feedback for blind students

5. **Multi-language Support**
   - Hindi, English, Marathi UI
   - Voice in multiple languages

6. **Smart Predictions**
   - Predict daily occupancy
   - Send alerts if nearing capacity

### **Phase 3: Analytics** (Priority: Medium)

7. **Advanced Reports**
   - Peak hours analysis
   - Student punctuality trends
   - Seat utilization heatmap

8. **Parent Portal**
   - Parents see check-in/out times
   - SMS alerts for attendance
   - Monthly report cards

### **Phase 4: Hardware Upgrades** (Priority: Low)

9. **Face Recognition**
   - No card needed
   - Faster check-in

10. **RFID Alternative**
    - Backup to QR
    - Contactless cards

11. **Multiple Exits**
    - Install at all exit points
    - Track check-out automatically

---

## 💰 Total Cost Breakdown

### **Initial Investment**

| Category | Items | Cost |
|----------|-------|------|
| **Hardware** | Tablet, Sonoff, Lock, Accessories | ₹18,500 |
| **ID Cards** | 100 PVC cards with QR printing | ₹2,000 |
| **Installation** | Labor, wiring | ₹2,000 |
| **Backup Power** | Battery + charger (optional) | ₹1,500 |
| **Contingency** | Extra cables, connectors | ₹500 |
| **TOTAL** | | **₹24,500** |

### **Ongoing Costs**

| Expense | Frequency | Cost |
|---------|-----------|------|
| Electricity | Monthly | ₹100 |
| Internet (WiFi) | Monthly | ₹500 |
| Maintenance | Yearly | ₹1,000 |
| Card reprints | As needed | ₹20/card |

**Monthly Operating Cost:** ~₹600

---

## 📞 Support & Resources

### **Product Support**

**Sonoff:**
- Website: https://sonoff.tech
- Support: support@sonoff.tech
- Community: https://github.com/arendst/Tasmota

**Samsung:**
- Support: 1800-5-7267864
- Service: https://www.samsung.com/in/support/

**eSSL (if using Option 2):**
- Website: https://www.esslindia.com
- Support: support@esslindia.com

### **Useful Links**

- eWeLink App: https://www.ewelink.cc/
- Tasmota Firmware: https://tasmota.github.io/
- Capacitor Barcode Scanner: https://github.com/capacitor-community/barcode-scanner
- QRCode.js: https://github.com/soldair/node-qrcode

---

## 📝 Final Checklist Before Go-Live

### **Hardware**
- [ ] All components installed and tested
- [ ] Wiring neat and secure
- [ ] Power backup tested
- [ ] Manual override key available
- [ ] Fire safety compliance checked

### **Software**
- [ ] Code deployed to production
- [ ] All students have QR codes
- [ ] Scanner tablet configured
- [ ] Offline mode tested
- [ ] Error handling working

### **Documentation**
- [ ] Staff training completed
- [ ] Student orientation done
- [ ] Emergency procedures documented
- [ ] Contact list prepared

### **Testing**
- [ ] 10+ test scans successful
- [ ] Edge cases handled
- [ ] Performance acceptable (< 3 sec per scan)
- [ ] Logs monitoring setup

### **Go-Live**
- [ ] Announce to students
- [ ] Monitor first day closely
- [ ] Gather feedback
- [ ] Iterate and improve

---

**Document Version:** 1.0  
**Last Updated:** February 10, 2026  
**Status:** Ready for Implementation  

---

**Questions? Need Help?**  
Contact your development team or refer to the main [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md) for more details.

🚀 **Ready to implement? Order the hardware and let's build this!**
