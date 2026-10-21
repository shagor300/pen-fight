# Product Requirements Document (PRD): Desk Wars — Pen Fight (Mobile App Clone)

**টার্গেট প্ল্যাটফর্ম:** Android (`.apk` / `.aab`), iOS (`.ipa`), এবং Mobile Web (PWA)  
**টার্গেট আইডিই (IDE):** [Google Antigravity IDE](https://www.google.com/search?q=https%3A%2F%2Fantigravity.google%2Fproduct%2Fantigravity-ide%2F) (Agent-First Development Workflow)  
**রেফারেন্স গেম:** [Desk Wars: Pen Fight](https://www.google.com/search?q=https%3A%2F%2Fshunneklabs.app%2Fgames%2Fpen-fight%2F) ([Shunnek Games](https://www.google.com/search?q=https%3A%2F%2Fshunneklabs.app%2Fgames%2F))

## ১. প্রজেক্টের মূল লক্ষ্য ও সারসংক্ষেপ (Executive Summary)

এই প্রজেক্টের লক্ষ্য হলো [Shunnek Games](https://www.google.com/search?q=https%3A%2F%2Fshunneklabs.app%2Fgames%2F)-এর জনপ্রিয় ব্রাউজার গেম **[Desk Wars: Pen Fight](https://www.google.com/search?q=https%3A%2F%2Fshunneklabs.app%2Fgames%2Fpen-fight%2F)**-এর শতভাগ হুবহু (1:1) একটি নেটিভ মোবাইল অ্যাপ্লিকেশন তৈরি করা। গেমটির ভিজ্যুয়াল স্টাইল, ফিজিক্স ইঞ্জিনের আচরণ, কলমের ঘর্ষণ ও ঘূর্ণন (Spin), ডেস্ক ছোট হওয়ার মেকানিক্স (Desk Shrinking), ৮টি কলমের স্ট্যাটাস, XP প্রগ্রেশন এবং AI অপোনেন্টের লজিক রেফারেন্স গেমের মতোই হবে, সাথে মোবাইল ডিভাইসের জন্য নেটিভ হ্যাপটিক ভাইব্রেশন (Haptics), ফুলস্ক্রিন টাচ কন্ট্রোল এবং অফলাইন স্টোরেজ যুক্ত থাকবে।

## ২. প্রজেক্ট শুরুর আগে কম্পিউটারে যেসব টুলস ইনস্টল থাকতে হবে (Prerequisites)

[Google Antigravity IDE](https://www.google.com/search?q=https%3A%2F%2Fantigravity.google%2Fproduct%2Fantigravity-ide%2F)-তে প্রজেক্টটি ওপেন করে অটোমেটেড এজেন্ট দিয়ে বিল্ড করার আগে আপনার পিসিতে নিচের টুলসগুলো ইনস্টল করে নিতে হবে:

| টুল / সফটওয়্যার | ন্যূনতম ভার্সন | কেন প্রয়োজন | ডাউনলোড ও ডকুমেন্টেশন লিংক |
| :--- | :--- | :--- | :--- |
| **Google Antigravity IDE** | v2.0+ (Latest) | এজেন্টিক কোড জেনারেশন, টার্মিনাল অটোমেশন ও লাইভ প্রিভিউয়ের জন্য | [Download Google Antigravity](https://www.google.com/search?q=https%3A%2F%2Fantigravity.google%2Fdownload%2F) |
| **Node.js & npm** | v20.x LTS বা v22.x | জাভাস্ক্রিপ্ট ডিপেন্ডেন্সি, [Vite](https://www.google.com/search?q=https%3A%2F%2Fvite.dev%2Fguide%2F) এবং [Capacitor](https://www.google.com/search?q=https%3A%2F%2Fcapacitorjs.com%2Fdocs%2Fgetting-started) চালানোর জন্য | [Capacitor Environment Setup](https://www.google.com/search?q=https%3A%2F%2Fcapacitorjs.com%2Fdocs%2Fgetting-started%2Fenvironment-setup) |
| **Java Development Kit (JDK)** | JDK 17 বা JDK 21 | Android Gradle বিল্ড এবং APK/AAB কম্পাইল করার জন্য | [Install Android Studio \& SDK](https://www.google.com/search?q=https%3A%2F%2Fdeveloper.android.com%2Fstudio%2Finstall) |
| **Android Studio & SDK** | Latest Stable | Android SDK Platform-Tools (`adb`), Emulator এবং APK তৈরির জন্য | [Download Android Studio](https://www.google.com/search?q=https%3A%2F%2Fdeveloper.android.com%2Fstudio) |
| **Xcode & CocoaPods** *(শুধু macOS)* | Xcode 15+ | শুধুমাত্র iOS (`.ipa`) অ্যাপ বিল্ড ও সিমুলেটরে টেস্ট করার জন্য | [Capacitor iOS Documentation](https://www.google.com/search?q=https%3A%2F%2Fcapacitorjs.com%2Fdocs%2Fios) |

## ৩. টেকনোলজি স্ট্যাক ও ফ্রেমওয়ার্ক নির্বাচন (Technology Stack)

### ৩.১ প্রাইমারি আর্কিটেকচার (১০০% হুবহু ক্লোনের জন্য প্রস্তাবিত)
রেফারেন্স গেমটি ([Desk Wars: Pen Fight](https://www.google.com/search?q=https%3A%2F%2Fshunneklabs.app%2Fgames%2Fpen-fight%2F)) যেহেতু **PixiJS** এবং **Planck.js** দিয়ে তৈরি, তাই হুবহু একই ফিজিক্স ও ভিজ্যুয়াল আউটপুট পেতে **TypeScript + Vite + PixiJS + Planck.js + Ionic Capacitor** স্ট্যাক ব্যবহার করতে হবে:

| লেয়ার | প্যাকেজ / ফ্রেমওয়ার্ক | ভার্সন | বিস্তারিত কাজ |
| :--- | :--- | :--- | :--- |
| **App Bundler** | [Vite](https://www.google.com/search?q=https%3A%2F%2Fvite.dev%2Fguide%2F) (`vite`, `typescript`) | `^6.0.0` / `^8.0.0` | সুপার-ফাস্ট ডেভ সার্ভার এবং অপ্টিমাইজড প্রোডাকশন বান্ডলিং |
| **2D Renderer** | [PixiJS](https://www.google.com/search?q=https%3A%2F%2Fpixijs.com%2F8.x%2Fguides%2Fgetting-started%2Fintro) (`pixi.js`) | `^8.22.0` | 60–120 FPS WebGL/WebGPU রেন্ডারিং, স্প্রাইট, কালি ও শ্যাডো ইফেক্ট |
| **2D Physics Engine** | [Planck.js](https://www.google.com/search?q=https%3A%2F%2Fpiqnt.com%2Fplanck.js%2Fdocs%2Fhello-world) (`planck`) | `^1.4.2` | Box2D ফিজিক্স পোর্ট—রিজিড বডি, কলিশন, টর্ক ও ড্যাম্পিং গণনা |
| **Polygon & SVG** | `earcut`, `parse-svg-path` | `^3.2.4`, `^0.2.0` | কলমের কাস্টম শেপ ট্রায়াঙ্গুলেশন ও পলিগন হিটবক্স তৈরি |
| **Color & Events** | `@pixi/colord`, `eventemitter3` | `^2.9.6`, `^5.0.4` | ডাইনামিক কালার টিন্ট এবং গেম স্টেট ইভেন্ট বাস |
| **Device & Cache** | `ismobilejs`, `tiny-lru` | `^1.1.1`, `^11.4.7` | মোবাইল টাচ অপ্টিমাইজেশন এবং টেক্সচার ক্যাশিং |
| **Audio Engine** | Web Audio API / `howler` | `^2.2.4` | লো-ল্যাটেন্সি কলিশন সাউন্ড, স্লাইড সাউন্ড ও ব্যাকগ্রাউন্ড মিউজিক |
| **Typography** | `@fontsource/fredoka`, `@fontsource/nunito` | `^5.3.0` | অফলাইন বান্ডলড গেম ফন্ট (Fredoka হেডিংয়ের জন্য, Nunito বডির জন্য) |
| **Mobile Runtime** | [Capacitor](https://www.google.com/search?q=https%3A%2F%2Fcapacitorjs.com%2Fdocs%2F) (`@capacitor/core`, `@capacitor/android`, `@capacitor/ios`) | `^7.0.0` / `^8.0.0` | ওয়েব গেমকে নেটিভ Android ও iOS অ্যাপে রূপান্তর |
| **Native Plugins** | `@capacitor/haptics`, `@capacitor/status-bar`, `@capacitor/screen-orientation`, `@capacitor/preferences` | Latest | কলমে ধাক্কা লাগলে ভাইব্রেশন, ফুলস্ক্রিন মোড, ওরিয়েন্টেশন লক ও লোকাল সেভ |

### ৩.২ বিকল্প নেটিভ আর্কিটেকচার (যদি ডার্ট/ফ্লাটারে করতে চান)
যদি জাভাস্ক্রিপ্টের বদলে ডার্ট (Dart) ব্যবহার করতে চান, তবে [Flutter Flame Engine](https://www.google.com/search?q=https%3A%2F%2Fpub.dev%2Fpackages%2Fflame) এবং এর অফিশিয়াল Box2D ব্রিজ [Forge2D (flame\_forge2d)](https://www.google.com/search?q=https%3A%2F%2Fdocs.flame-engine.org%2Flatest%2Fbridge_packages%2Fflame_forge2d%2Fforge2d.html) ব্যবহার করা যাবে। তবে [Google Antigravity IDE](https://www.google.com/search?q=https%3A%2F%2Fantigravity.google%2Fproduct%2Fantigravity-ide%2F)-তে দ্রুততম সময়ে মূল গেমের ১০০% ক্লোন তৈরির জন্য **PixiJS + Planck.js + Capacitor** আর্কিটেকচারটিই প্রধান হিসেবে নিচে স্পেসিফাই করা হলো।

## ৪. কোর ফিজিক্স ইঞ্জিন এবং গাণিতিক লজিক (Physics & Math Specification)

[Google Antigravity IDE](https://www.google.com/search?q=https%3A%2F%2Fantigravity.google%2Fproduct%2Fantigravity-ide%2F) এজেন্টকে নিচের গাণিতিক ও ফিজিক্স নিয়মগুলো হুবহু কোডে ইমপ্লিমেন্ট করতে হবে:

### ৪.১ টপ-ডাউন ফিজিক্স ওয়ার্ল্ড সেটআপ (`PhysicsWorld.ts`)
* **গ্র্যাভিটি (Gravity):** যেহেতু এটি টেবিলের ওপর থেকে দেখা (Top-down view) গেম, তাই [Planck.js](https://www.google.com/search?q=https%3A%2F%2Fpiqnt.com%2Fplanck.js%2Fdocs%2Fhello-world) ওয়ার্ল্ডের গ্র্যাভিটি হবে শূন্য: `planck.Vec2(0, 0)`।
* **স্কেল ফ্যাক্টর (Pixels to Meters):** [Planck.js ইউনিট গাইড](https://www.google.com/search?q=https%3A%2F%2Fpiqnt.com%2Fplanck.js%2Fdocs%2Fapi-conventions%2Funits.html) অনুযায়ী ০.১ থেকে ১০ মিটারের মধ্যে বডি রাখলে ফিজিক্স সবচেয়ে নিখুঁত কাজ করে। তাই `SCALE = 100` (অর্থাৎ ১০০ পিক্সেল = ১ মিটার; একটি ১৫০ পিক্সেল লম্বা কলম ফিজিক্স ওয়ার্ল্ডে ১.৫ মিটার হবে)।
* **টাইম স্টেপ:** ফিক্সড টাইম স্টেপ `1 / 60` সেকেন্ড, `velocityIterations = 8`, এবং `positionIterations = 3`।

### ৪.২ পুল-ব্যাক (Pull-Back) এবং স্পিন বনাম স্ট্রেইট শট লজিক (`InputController.ts`)
* **গ্র্যাব পয়েন্ট নির্ধারণ:** খেলোয়াড় যখন নিজের কলমের ওপর টাচ করবে (`pointerdown`), তখন ফিজিক্স বডির ওপরের সেই নির্দিষ্ট বিন্দুটিকে `grabLocalPoint` হিসেবে সেভ করতে হবে।
* **ড্র্যাগ ভেক্টর ও ক্যানসেল থ্রেশহোল্ড:** টাচ ধরে পেছনে টানলে (`pointermove`):
  $$\vec{D} = \vec{P}_{\text{start}} - \vec{P}_{\text{current}}$$
  যদি $\|\vec{D}\| < 15\text{ px}$ হয়, তবে শট ক্যানসেল জোন হিসেবে গণ্য হবে এবং ছেড়ে দিলে চাল গণ্য হবে না। সর্বোচ্চ টানার দূরত্ব `MAX_PULL_PX = 180` পিক্সেলে ক্ল্যাম্প (Clamp) করতে হবে।
* **ইমপালস ও টর্ক প্রয়োগ (`pointerup`):** টাচ ছেড়ে দিলে কলমের `grabWorldPoint = body.getWorldPoint(grabLocalPoint)` বিন্দুতে ইমপালস প্রয়োগ করতে হবে:
  $$\vec{I} = \hat{D} \times \left(\frac{\|\vec{D}\|}{\text{MAX\_PULL\_PX}}\right) \times F_{\text{base}} \times M_{\text{speed}}$$
  ```typescript
  penBody.applyLinearImpulse(impulseVector, grabWorldPoint, true);
  ```
  * **স্পিন (Spin) মেকানিক:** যদি `grabLocalPoint` কলমের কেন্দ্র (`Center of Mass`) থেকে দূরে (যেমন কলমের নিব বা ক্যাপের দিকে) হয়, তবে `applyLinearImpulse` স্বয়ংক্রিয়ভাবে কৌণিক ভরবেগ বা টর্ক ($\tau = \vec{r} \times \vec{I}$) তৈরি করবে এবং কলমটি ঘুরতে ঘুরতে এগোবে। অতিরিক্ত নিয়ন্ত্রণের জন্য কলমের **Spin** স্ট্যাট অনুযায়ী কৌণিক বেগ (`angularVelocity`) গুণিতক যোগ করতে হবে।

### ৪.৩ অ্যানিসোট্রপিক ফ্রিকশন বা দিক-নির্ভর ঘর্ষণ (`Anisotropic Friction`)
বাস্তব কলমকে আড়াআড়ি (Sideways) টোকা দিলে সেটি গড়িয়ে অনেক দূর যায়, কিন্তু লম্বালম্বি (Lengthwise) ঠেললে দ্রুত থেমে যায়। প্রতি ফ্রেমে (`world.on('post-step')` বা আপডেট লুপে) প্রতিটি কলমের গতিবেগকে দুটি উপাংশে ভাগ করে আলাদা ড্যাম্পিং দিতে হবে:
* কলমের লম্বালম্বি একক ভেক্টর $\hat{u}_{\text{forward}} = (\cos\theta, \sin\theta)$ এবং আড়াআড়ি একক ভেক্টর $\hat{u}_{\text{lateral}} = (-\sin\theta, \cos\theta)$।
* লম্বালম্বি বেগ $v_f = \vec{v} \cdot \hat{u}_{\text{forward}}$ এবং আড়াআড়ি বেগ $v_l = \vec{v} \cdot \hat{u}_{\text{lateral}}$।
* লম্বালম্বি বেগের ওপর উচ্চ ফ্রিকশন (`forwardDrag = 0.90 * gripFactor`) এবং আড়াআড়ি বেগের ওপর কম ফ্রিকশন (`lateralDrag = 0.965 * gripFactor`) প্রয়োগ করে নতুন বেগ সেট করতে হবে।
* যখন রৈখিক বেগ $\|\vec{v}\| < 0.03\text{ m/s}$ এবং কৌণিক বেগ $|\omega| < 0.05\text{ rad/s}$ হবে, তখন কলমটিকে সম্পূর্ণ থামিয়ে (`setLinearVelocity(Vec2(0,0))`, `setAngularVelocity(0)`) টার্ন শেষ করতে হবে।

### ৪.৪ ডেস্ক থেকে পড়ে যাওয়া শনাক্তকরণ (`Boundary & Fall Logic`)
* ডেস্কের চারপাশে কোনো ফিজিক্স দেয়াল (Wall collider) থাকবে না, কারণ কলম ডেস্কের বাইরে পড়ে যেতে পারে।
* প্রতি ফ্রেমে প্রতিটি কলমের `center = penBody.getWorldCenter()` পরীক্ষা করা হবে।
* যদি `center.x < deskBounds.left` বা `center.x > deskBounds.right` বা `center.y < deskBounds.top` বা `center.y > deskBounds.bottom` হয়, তবে সাথে সাথে কলমটির স্টেট `FALLING` হয়ে যাবে:
  1. ফিজিক্স কলিশন নিষ্ক্রিয় (`fixture.setSensor(true)`) হবে।
  2. ৩৫০ মিলিসেকেন্ডের মধ্যে কলমের স্প্রাইটের `scale` ১.০ থেকে কমে ০.৪ হবে এবং `alpha` কমে ০ হবে (যেন মনে হয় টেবিল থেকে মেঝেতে পড়ে গেছে)।
  3. সাথে সাথে पडার সাউন্ড ইফেক্ট এবং মোবাইল ভাইব্রেশন ট্রিগার হবে।

## ৫. গেমের সম্পূর্ণ রুলস ও স্টেট মেশিন (Complete Game Rules)

[Desk Wars: Pen Fight](https://www.google.com/search?q=https%3A%2F%2Fshunneklabs.app%2Fgames%2Fpen-fight%2F)-এর সব নিয়ম নিচের টেবিল অনুযায়ী ইমপ্লিমেন্ট করতে হবে:

| রুল ক্যাটাগরি | গেমের সুনির্দিষ্ট নিয়ম ও শর্ত |
| :--- | :--- |
| **টার্ন সিস্টেম (Turn Order)** | প্রতি রাউন্ডে দুই খেলোয়াড় ১টি করে ফ্লিক পাবে। প্রথম রাউন্ডে Player 1 শুরু করলে দ্বিতীয় রাউন্ডে Player 2 (বা AI) আগে চাল দেবে। |
| **ইনঅ্যাক্টিভিটি টাইমার (Turn Timer)** | কারো টার্ন শুরু হওয়ার পর ১০ সেকেন্ড কোনো টাচ না করলে স্ক্রিনে ২০ সেকেন্ডের কাউন্টডাউন বার চালু হবে। মোট ৩০ সেকেন্ডের মধ্যে শট না নিলে চালটি মিস হবে এবং প্রতিপক্ষের টার্ন শুরু হবে। |
| **জয়ের শর্ত (Round Win)** | নিজের কলম ডেস্কে অক্ষত রেখে প্রতিপক্ষের কলমের কেন্দ্রবিন্দু ডেস্কের সীমানার বাইরে ফেলে দিলে ১ পয়েন্ট অর্জিত হবে। |
| **পরাজয়ের শর্ত (Self-KO / Double KO)** | নিজের চালে যদি শুধুমাত্র নিজের কলম পড়ে যায় **অথবা** ধাক্কা লেগে দুটি কলমই একই চালে ডেস্ক থেকে পড়ে যায়, তবে যে চাল দিয়েছে সে ওই রাউন্ডে হারবে (প্রতিপক্ষ ১ পয়েন্ট পাবে)। |
| **ড্র শর্ত (30-Turn Draw)** | একটি রাউন্ডে মোট ৩০টি চাল (উভয় মিলে ৩০ টার্ন) শেষ হওয়ার পরও যদি দুটি কলমই ডেস্কে থাকে, তবে রাউন্ডটি **Draw** ঘোষণা করা হবে (কেউ পয়েন্ট পাবে না)। |
| **ডেস্ক ছোট হওয়া (Desk Shrinking)** | ১ থেকে ১৫ নম্বর চাল পর্যন্ত ডেস্ক পূর্ণ আকারে (100%) থাকবে। এরপর **১৫, ১৯, ২৩ এবং ২৭তম চালের পর** ডেস্ক চারপাশ থেকে ৭% করে ছোট (Shrink) হবে। |
| **শ্রিংক ওয়ার্নিং (Shrink Warning)** | ডেস্ক ছোট হওয়ার ঠিক ১ চাল আগে (অর্থাৎ ১৫, ১৯, ২৩ ও ২৭তম চালের শুরুতে) ডেস্কের ভেতরে লাল রঙের ড্যাশড লাইন (`Dashed Red Line`) এবং সতর্কবার্তা দেখাতে হবে। |
| **ম্যাচ জয়ের ফরম্যাট** | সেটিংস থেকে পরিবর্তনযোগ্য ৩টি ফরম্যাট: **First to 3 wins** (ডিফল্ট), **First to 5 wins**, এবং **Endless Mode**। |

## ৬. ৮টি কলম, ৫টি স্ট্যাট এবং XP প্রগ্রেশন সিস্টেম

### ৬.১ কলমের ৫টি স্ট্যাট ও ফিজিক্স ফর্মুলা
প্রতিটি কলমের ১ থেকে ৫ স্টার রেটিংয়ের ৫টি স্ট্যাট থাকবে:
1. **Weight (ভর):** `mass = 0.8 + (weightStars * 0.25)` — বেশি হলে ধাক্কা দেওয়ার শক্তি বেশি হবে এবং প্রতিপক্ষের ধাক্কায় কম ছিটকে যাবে।
2. **Speed (গতি):** `impulseMultiplier = 0.85 + (speedStars * 0.08)` — একই টানে কলম কত দ্রুত ছুটবে।
3. **Spin (ঘূর্ণন):** `torqueMultiplier = 0.80 + (spinStars * 0.12)` — কলমের প্রান্তে ধরে টানলে কত তীব্রভাবে ঘুরবে।
4. **Grip (ঘর্ষণ/স্থায়িত্ব):** `dampingFactor = 1.0 + (gripStars * 0.06)` — বেশি গ্রিপ হলে কলম ডেস্কে দ্রুত থামবে এবং সহজে ছিটকে পড়বে না।
5. **Reach (দৈর্ঘ্য):** `lengthPx = 130 + (reachStars * 10)` — কলমটি কত লম্বা হবে (লম্বা কলম দিয়ে স্পিন শটে হিট করা সহজ)।

### ৬.২ ৮টি কলমের তালিকা ও স্ট্যাটাস টেবিল

| # | কলমের নাম (Pen Name) | Weight | Speed | Spin | Grip | Reach | ভিজ্যুয়াল বৈশিষ্ট্য |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| ১ | **Cheap Ballpoint** | 2★ | 4★ | 3★ | 3★ | 3★ | স্বচ্ছ প্লাস্টিক বডি ও নীল ক্যাপ (শুরুর কলম) |
| ২ | **Yellow Highlighter** | 3★ | 3★ | 2★ | 4★ | 2★ | চ্যাপ্টা ও চওড়া হলুদ বডি, ডেস্কে দারুণ গ্রিপ |
| ৩ | **Classic Fountain** | 4★ | 3★ | 3★ | 3★ | 4★ | কালো-সোনালী মেটাল নিব ও প্রিমিয়াম বডি |
| ৪ | **Gel Rollerball** | 2★ | 5★ | 4★ | 2★ | 3★ | রাবার গ্রিপসহ হালকা ও সবচেয়ে দ্রুতগতির কলম |
| ৫ | **Heavy Executive** | 5★ | 2★ | 2★ | 5★ | 3★ | ভারী মেটাল বডি, ধাক্কা দিয়ে সরানো সবচেয়ে কঠিন |
| ৬ | **Dual-Tip Marker** | 3★ | 3★ | 5★ | 2★ | 4★ | দুই প্রান্তে ক্যাপ, স্পিন শটের জন্য সবচেয়ে শক্তিশালী |
| ৭ | **Mechanical Pencil** | 1★ | 5★ | 4★ | 3★ | 4★ | চিকন ও হালকা পেন্সিল, নিখুঁত স্নাইপার শটের উপযোগী |
| ৮ | **Long Mod Spinner** | 4★ | 3★ | 5★ | 3★ | 5★ | সবচেয়ে লম্বা ব্যালেন্সড পেন-মড, সর্বোচ্চ রিচ ও স্পিন |

### ৬.৩ XP, লেভেল আপ ও কাস্টমাইজেশন (`ProgressionSystem.ts`)
* **XP অর্জন:** প্রতিটি ম্যাচ জয়ে **+100 XP** এবং পরাজয় বা ড্র-তে **+30 XP** যোগ হবে (কলম অনুযায়ী আলাদাভাবে `@capacitor/preferences`-এ সেভ থাকবে)।
* **লেভেল ১ থেকে ৫ (Lv1–Lv5):**
  * **Lv1 (0 XP):** বেস কলম।
  * **Lv2 (200 XP):** নতুন Ink Trail কালার আনলক + স্ট্যাট বোনাস (+2%)।
  * **Lv3 (500 XP):** কলমের গায়ে কাস্টম Sticker আনলক + স্ট্যাট বোনাস (+4%)।
  * **Lv4 (1000 XP):** নিওন/গোল্ডেন হিট ইফেক্ট আনলক + স্ট্যাট বোনাস (+6%)।
  * **Lv5 (2000 XP):** মাস্টার স্কিন ও কাস্টম অ্যারো ট্রেইল আনলক + স্ট্যাট বোনাস (+8%)।
* **Equal Levels অপশন:** সেটিংসে `Equal Levels: ON/OFF` টগল থাকবে। এটি `ON` থাকলে উভয় খেলোয়াড়ের কলমের লেভেল বোনাস সাময়িকভাবে বন্ধ থেকে Lv1 স্ট্যাটে সমান প্রতিযোগিতায় খেলা হবে।

## ৭. AI (কম্পিউটার অপোনেন্ট) লজিক (`AIController.ts`)

**vs Computer** মোডে ৩টি ডিফিকাল্টি লেভেল থাকবে এবং AI-এর কলমের লেভেল কখনোই খেলোয়াড়ের কলমের লেভেলের চেয়ে বেশি হবে না:

* **Easy AI:**
  * প্লেয়ারের কলমের কেন্দ্রের দিকে লক্ষ্য করে কিন্তু কোণের মধ্যে $\pm 18^\circ$ র‍্যান্ডম ভুল (Aim Variance) যোগ করে।
  * শক্তির পরিমাণ ৫০% থেকে ৭৫% এর মধ্যে র‍্যান্ডমাইজ করে এবং স্পিন শট ব্যবহার করে না।
* **Normal AI:**
  * প্লেয়ারের কলমের অবস্থান ও ডেস্কের কিনারার দূরত্ব হিসাব করে কোণের বিচ্যুতি মাত্র $\pm 6^\circ$ রাখে।
  * ৪০% ক্ষেত্রে কলমের প্রান্তে ধরে স্পিন শট দেয়।
* **Hard AI:**
  * রে-কাস্টিং ও ভেক্টর প্রজেকশন ব্যবহার করে দেখে প্লেয়ারের কলমের কোন প্রান্তে আঘাত করলে সেটি সবচেয়ে নিকটবর্তী ডেস্কের কিনারা দিয়ে বাইরে পড়ে যাবে।
  * নিজের কলম যেন ধাক্কা খেয়ে বা অতিরিক্ত গতিতে বাইরে না পড়ে যায়, সেজন্য `safeMaxImpulse` হিসাব করে শট নেয়।

## ৮. ভিজ্যুয়াল স্টাইল, UI/UX এবং মোবাইল অপ্টিমাইজেশন

* **ডেস্ক থিম (Desk Style):** সেটিংসে ২টি অপশন—**Clean desk** (পরিষ্কার উষ্ণ কাঠের টেক্সচার) এবং **Old school desk** (কাঠের ওপর খোদাই করা দাগ, কম্পাসের দাগ ও হালকা ডুডল)।
* **কলমের লুক (Pen Look):** ২টি অপশন—**Classic** (গাঢ় আউটলাইনযুক্ত কার্টুন/ভেক্টর স্টাইল) এবং **Real** (হাইলাইট ও ড্রপ-শ্যাডোযুক্ত বাস্তবসম্মত থ্রিডি শেডেড স্প্রাইট)।
* **কালার প্যালেট:**
  * ব্যাকগ্রাউন্ড/উড টোন: `#D7995B`, `#B87A3D`, `#F6EFE6` (সফট ক্রিম UI কার্ড)
  * টেক্সট ও বর্ডার: `#2C3539` (গাঢ় স্লেট)
  * অ্যাকসেন্ট কালার: `#FF7A00` (প্রাইমারি অ্যাকশন বাটন), `#E63946` (শ্রিংক ওয়ার্নিং ও ডেঞ্জার), `#2A9D8F` (ভিক্টোরি/XP বার)
* **মোবাইল হ্যাপটিক্স ও অডিও (`SoundAndHaptics.ts`):**
  * কলম টানার সময় হালকা টিক সাউন্ড।
  * দুটি কলমের সংঘর্ষের তীব্রতা (`collisionImpactVelocity`) অনুযায়ী ডাইনামিক ভলিউমে প্লাস্টিকের ঠোকাঠুকি সাউন্ড এবং `@capacitor/haptics` দিয়ে `ImpactStyle.Heavy` ভাইব্রেশন।
  * সেটিংস থেকে **Music Volume** এবং **SFX Volume** আলাদা স্লাইডারে নিয়ন্ত্রণ করা যাবে।

## ৯. প্রজেক্ট ফোল্ডার স্ট্রাকচার (Directory Structure)

[Google Antigravity IDE](https://www.google.com/search?q=https%3A%2F%2Fantigravity.google%2Fproduct%2Fantigravity-ide%2F) এজেন্ট নিচের ফোল্ডার স্ট্রাকচার অনুযায়ী প্রজেক্টটি তৈরি করবে:

```text
pen-fight-mobile/
├── android/                        # Capacitor Native Android Project
├── ios/                            # Capacitor Native iOS Project
├── public/
│   ├── assets/
│   │   ├── pens/                   # 8 pens (classic & real SVG/PNG sprites)
│   │   ├── desks/                  # clean_desk.png, old_school_desk.png
│   │   └── audio/                  # flick.mp3, hit_light.mp3, hit_heavy.mp3, slide.mp3, fall.mp3, bgm.mp3
├── src/
│   ├── main.ts                     # App entry, Capacitor init & PixiJS Application bootstrap
│   ├── config/
│   │   ├── pensConfig.ts           # 8 pens stats, dimensions, polygon vertices & unlock levels
│   │   └── gameConstants.ts        # Physics scale, shrink turns (15,19,23,27), timer constants
│   ├── core/
│   │   ├── GameManager.ts          # Turn loop, score tracking, round reset, win/loss/draw evaluation
│   │   ├── DeskManager.ts          # Desk bounds, shrinking animations & red dashed warning lines
│   │   └── ProgressionManager.ts   # XP calculation (+100/+30), level unlocks & @capacitor/preferences storage
│   ├── physics/
│   │   ├── PhysicsWorld.ts         # Planck.js World setup, collision listeners & step loop
│   │   └── AnisotropicFriction.ts  # Forward vs lateral velocity damping solver
│   ├── entities/
│   │   └── PenEntity.ts            # Combines Planck.Body with PixiJS Container (Classic/Real sprites + shadow)
│   ├── controllers/
│   │   ├── InputController.ts      # Touch/Mouse pull-back vector, cancel zone & aim guide arrow rendering
│   │   └── AIController.ts         # Easy, Normal, Hard shot calculation & delay timer
│   ├── audio/
│   │   └── SoundAndHaptics.ts      # Web Audio / Howler + @capacitor/haptics integration
│   └── ui/
│       ├── MainMenu.ts             # Mode selection (vs Computer, 2 Players, Online Coming Soon)
│       ├── PenSelectorModal.ts     # 8-pen carousel, 5-star stat bars, Classic/Real toggle & XP bar
│       ├── HUD.ts                  # Top scoreboard, turn indicator, 10s+20s countdown timer & turn counter
│       └── SettingsModal.ts        # Desk style, Pen look, First to 3/5/Endless, Equal Levels, Audio sliders
├── index.html
├── capacitor.config.ts
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## ১০. Google Antigravity IDE-তে বিল্ড করার ধাপে ধাপে নির্দেশনা (Execution Plan for Antigravity Agent)

আপনি [Google Antigravity IDE](https://www.google.com/search?q=https%3A%2F%2Fantigravity.google%2Fproduct%2Fantigravity-ide%2F) ওপেন করে এজেন্ট চ্যাট বা প্রম্পট বক্সে এই PRD ফাইলটি অ্যাটাচ করে নিচের ৬টি ধাপে বিল্ড করার নির্দেশ দেবেন:

1. **Phase 1 — Project Scaffolding & Dependencies:**
   ```bash
   npm create vite@latest pen-fight-mobile -- --template vanilla-ts
   cd pen-fight-mobile
   npm install pixi.js@^8.22.0 planck@^1.4.2 earcut@^3.2.4 @pixi/colord@^2.9.6 parse-svg-path@^0.2.0 eventemitter3@^5.0.4 ismobilejs@^1.1.1 tiny-lru@^11.4.7 howler @fontsource/fredoka @fontsource/nunito
   npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios @capacitor/haptics @capacitor/status-bar @capacitor/screen-orientation @capacitor/preferences
   npx cap init "Pen Fight" "com.shunneklabs.penfight.clone" --web-dir dist
   ```
2. **Phase 2 — Procedural Vector Assets & Physics Core:** বাহ্যিক ছবির জন্য অপেক্ষা না করে প্রথমে [PixiJS Graphics API](https://www.google.com/search?q=https%3A%2F%2Fpixijs.com%2F8.x%2Fguides%2Fgetting-started%2Fintro) দিয়ে ৮টি কলমের Classic ও Real ভেক্টর গ্রাফিক্স এবং ২টি ডেস্কের টেক্সচার প্রসিডিউরালি জেনারেট করতে বলুন, এবং [Planck.js](https://www.google.com/search?q=https%3A%2F%2Fpiqnt.com%2Fplanck.js%2Fdocs%2Fhello-world) দিয়ে পুল-ব্যাক স্পিন ও অ্যানিসোট্রপিক ফ্রিকশন চালু করুন।
3. **Phase 3 — Rules, Desk Shrinking & Turn Timer:** ১৫, ১৯, ২৩ ও ২৭ চালের ডেস্ক শ্রিংকিং, লাল ড্যাশড সতর্কবার্তা, ৩০ চালের ড্র এবং ১০+২০ সেকেন্ডের টার্ন টাইমার যুক্ত করুন।
4. **Phase 4 — AI Opponent, 8-Pen Selector & XP Progression:** Easy/Normal/Hard AI, ৮টি কলমের স্ট্যাটাস মেনু এবং `@capacitor/preferences` দিয়ে XP/Level সেভিং যুক্ত করুন।
5. **Phase 5 — Synthesized Audio & Native Haptics:** Web Audio API দিয়ে কলমের ক্লিক, স্লাইড ও পতনের শব্দ এবং `@capacitor/haptics` ভাইব্রেশন যুক্ত করুন।
6. **Phase 6 — Mobile APK Build & Verification:**
   ```bash
   npm run build
   npx cap add android
   npx cap sync android
   npx cap open android
   ```
   এরপর Android Studio থেকে সরাসরি আপনার ফোনে বা এমুলেটরে রান করুন অথবা `Build > Build Bundle(s) / APK(s) > Build APK(s)` ক্লিক করে `.apk` ফাইল এক্সপোর্ট করে নিন।
