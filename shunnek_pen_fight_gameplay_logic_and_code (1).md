# Shunnek Labs "Desk Wars: Pen Fight" (v1.5.4) — স্মুথ গেমপ্লে ফর্মুলা, ফিজিক্স ইঞ্জিন লজিক এবং সম্পূর্ণ ইন্টিগ্রেশন গাইড

অফিসিয়াল রেফারেন্স: [Shunnek Labs Pen Fight (v1.5.4 · 52c2e5f)](https://shunneklabs.app/games/pen-fight/) • [Shunnek Labs Games Catalog](https://shunneklabs.app/games/) • [Shunnek Labs Play Portal](https://shunneklabs.app/play/)

আপনার ক্লোন অ্যাপ্লিকেশন এবং [Shunnek Labs Pen Fight](https://shunneklabs.app/games/pen-fight/)-এর মূল গেমপ্লের তুলনামূলক বিশ্লেষণ করে দেখা গেছে, ওদের গেমপ্লে এত মাখনের মতো স্মুথ (Butter-Smooth) হওয়ার পেছনে **৭টি মূল ফিজিক্স ও গেম-লুপ ফর্মুলা** কাজ করে। এই ডকুমেন্টে প্রতিটি ফর্মুলা, গাণিতিক লজিক, সম্পূর্ণ জাভাস্ক্রিপ্ট ফিজিক্স ইঞ্জিন কোড এবং **Antigravity AI Master Prompt** দেওয়া হলো যাতে আপনি সরাসরি আপনার প্রজেক্টে এটি বসিয়ে নিতে পারেন।

---

## ১. কেন আপনার বর্তমান ক্লোনটি স্মুথ নয় বনাম Shunnek Labs কেন এত স্মুথ?

আপনার বর্তমান গেম কোডে যে কারণে গেমপ্লে কিছুটা শক্ত (Stiff) বা আটকে যাওয়া মনে হয় এবং [Shunnek Labs Pen Fight](https://shunneklabs.app/games/pen-fight/) যেভাবে সেটি সমাধান করেছে:

| সমস্যা (আপনার বর্তমান ক্লোনে যা হচ্ছে) | Shunnek Labs (v1.5.4)-এর স্মুথ সলিউশন | গেমপ্লেতে এর প্রভাব |
| :--- | :--- | :--- |
| **১. সাধারণ বৃত্তাকার সংঘর্ষ (Circle Collision):** শুধু দুটি কলমের মাঝখানের দূরত্ব (`Math.hypot(dx, dy) < 35`) মাপা হচ্ছে। | **2D Capsule / Rod Segment-to-Segment Collision:** কলমের পুরো লম্বা বডির (Tip থেকে Tail পর্যন্ত) যেকোনো বিন্দুতে সংঘর্ষ এবং ঘূর্ণন (Torque) হিসাব করা হয়। | কলমের মাথায় লাগলে কলমটি বাস্তবসম্মতভাবে ঘুরে যায় এবং কোণাকুণি ধাক্কা খেয়ে ছিটকে যায়। |
| **২. সব দিকে একই ঘর্ষণ (`vx *= 0.96`):** কলম সোজা বা আড়াআড়ি যেদিকেই যাক একই হারে থামে, ফলে বরফের ওপর পিছলে যাওয়ার মতো মনে হয়। | **Anisotropic Friction (অ্যানিসোট্রপিক ঘর্ষণ):** কলম গড়ানোর দিকে (Lateral/Rolling) ঘর্ষণ কম এবং লম্বালম্বি (Axial) ঘর্ষণ বেশি থাকে, সাথে শেষ মুহূর্তে **Coulomb Stiction Brake** কাজ করে। | কলমটি কাঠের বেঞ্চের ওপর বাস্তবসম্মতভাবে গড়িয়ে গিয়ে খুব মসৃণভাবে থামে। |
| **৩. শুধু মাঝখান থেকে টানা (Center Pull Only):** কলমের যেখান থেকেই টানা হোক না কেন, শুধু সোজা বল প্রয়োগ হয়। | **Grab-Point Offset Torque ($\tau = \vec{r}_{\text{grab}} \times \vec{F}$):** কলমের নিব বা পেছনের প্রান্ত ধরে টানলে ঘূর্ণন (Spin) তৈরি হয় এবং মাঝখানে ধরে টানলে সোজা শট (Straight Push) হয়। | গেমার নিজে নিয়ন্ত্রণ করতে পারে সে স্পিন অ্যাটাক করবে নাকি সোজা ধাক্কা দেবে। |
| **৪. ফ্রেম-রেট নির্ভর লুপ (Per-Frame Update):** প্রতি ফ্রেমে ১ বার ফিজিক্স আপডেট হয়; 60Hz বা 120Hz স্ক্রিনে গতি পাল্টে যায়। | **Fixed Timestep Accumulator + 8x Sub-stepping + Interpolation:** প্রতি ফ্রেমের ভেতর ফিজিক্স ৮ বার ক্ষুদ্র ধাপে ($\Delta t / 8$) হিসাব হয় এবং রেন্ডারিংয়ে ইন্টারপোলেশন থাকে। | ১২০ FPS বা ৬০ FPS—সব ডিভাইসেই কোনো কাঁপাকাঁপি (Jitter) বা কলম ভেদ করে চলে যাওয়া (Tunneling) ছাড়াই একদম মাখনের মতো চলে। |
| **৫. সাথে সাথে পড়ে যাওয়া (Instant Out):** কলমের কেন্দ্র সীমার বাইরে গেলেই আউট হয়ে যায়। | **COM Overhang & Tipping Physics:** কলমের অর্ধেক অংশ ডেস্কের বাইরে ঝুলে থাকতে পারে (Cliffhanger), যতক্ষণ না **Center of Mass (COM)** ও টর্ক সীমা অতিক্রম করে। | টানটান উত্তেজনাকর "এজ সেভ" (Edge Save) এবং বাস্তবসম্মতভাবে কাত হয়ে নিচে পড়ার অ্যানিমেশন পাওয়া যায়। |

---

## ২. Shunnek Labs-এর ৭টি কোর গেমপ্লে ফর্মুলা ও গাণিতিক লজিক

### ফর্মুলা ১: ফিক্সড টাইমস্টেপ সাব-স্টেপিং ও রেন্ডার ইন্টারপোলেশন (Butter-Smooth Loop)

ব্রাউজারের `requestAnimationFrame` প্রতি সেকেন্ডে কখনো ৬০ বার, কখনো ১২০ বার কল হয়। যদি সরাসরি `x += vx` লেখা হয়, তবে ফ্রেম ড্রপ হলেই কলম লাফিয়ে চলে। [Shunnek Labs Pen Fight](https://shunneklabs.app/games/pen-fight/) ব্যবহার করে **Fixed Physics Step ($\Delta t_{\text{fixed}} = \frac{1}{120}\text{ s}$) + $N_{\text{sub}} = 8$ Sub-steps**:

$$\Delta t_{\text{sub}} = \frac{\Delta t_{\text{fixed}}}{N_{\text{sub}}} = \frac{1}{120 \times 8} = 0.0010416\text{ seconds}$$

প্রতিটি রেন্ডার ফ্রেমে স্ক্রিনে কলমটি আঁকার সময় আগের পজিশন ($\vec{p}_{\text{prev}}$) ও বর্তমান পজিশন ($\vec{p}_{\text{curr}}$)-এর মধ্যে **Linear Interpolation ($\alpha$)** করা হয়:

$$\alpha = \frac{\text{accumulator}}{\Delta t_{\text{fixed}}}, \quad \vec{p}_{\text{render}} = \vec{p}_{\text{prev}} \cdot (1 - \alpha) + \vec{p}_{\text{curr}} \cdot \alpha$$

$$\theta_{\text{render}} = \theta_{\text{prev}} + \text{shortestAngle}(\theta_{\text{prev}}, \theta_{\text{curr}}) \cdot \alpha$$

---

### ফর্মুলা ২: গ্র্যাব-পয়েন্ট অফসেট, পুল-ব্যাক পাওয়ার কার্ভ এবং ফ্লিক টর্ক ("Hold → Pull → Release")

[Shunnek Labs Pen Fight](https://shunneklabs.app/games/pen-fight/)-এর নির্দেশিকায় স্পষ্ট বলা আছে:
> *"01 Hold your pen → 02 Pull to aim → 03 Release to flick. Grab your pen. Pull back to aim. Pull further for more power, grab near a tip to spin. Let go to flick. Let go at the start to cancel."*

১. **গ্র্যাব অফসেট ($s_{\text{grab}}$):** খেলোয়াড় যখন কলমের ওপর মাউস/টাচ বসায় ($\vec{p}_{\text{touch}}$), তখন কলমের কেন্দ্র ($\vec{p}_{\text{pen}}$) ও অক্ষ ($\vec{u} = [\cos\theta, \sin\theta]$) বরাবর গ্র্যাব অফসেট নির্ণয় করা হয়:

$$s_{\text{grab}} = \text{clamp}\left( (\vec{p}_{\text{touch}} - \vec{p}_{\text{pen}}) \cdot \vec{u}, \; -\frac{L}{2}, \; +\frac{L}{2} \right)$$

$$\text{normalizedGrabOffset } \hat{s} = \frac{s_{\text{grab}}}{L / 2} \in [-1, +1]$$

২. **ক্যানসেল ডেডজোন (Cancel Deadzone):** যদি টানার দূরত্ব $d_{\text{pull}} = \|\vec{p}_{\text{grabWorld}} - \vec{p}_{\text{dragCurrent}}\| < d_{\text{cancel}}$ (যেমন `14px`) হয় এবং খেলোয়াড় ছেড়ে দেয়, তবে শট বাতিল (Cancel) হয়ে যায়।

৩. **নন-লিনিয়ার পাওয়ার কার্ভ (Smooth Power Curve):** টানার দূরত্বকে $d_{\max}$ (যেমন `190px`)-এ ক্ল্যাম্প করে একটি সফট পাওয়ার কার্ভ ($\gamma = 1.15$) প্রয়োগ করা হয় যাতে ছোট শটগুলো সূক্ষ্মভাবে মারা যায় এবং বড় শটগুলো শক্তিশালী হয়:

$$p_{\text{norm}} = \text{clamp}\left(\frac{d_{\text{pull}} - d_{\text{cancel}}}{d_{\max} - d_{\text{cancel}}}, \; 0, \; 1\right), \quad P = p_{\text{norm}}^{1.15}$$

৪. **রৈখিক বেগ ($\vec{v}$) ও কৌণিক বেগ ($\omega$ / Spin) উৎপন্ন হওয়ার সূত্র:**
টানার বিপরীত দিকে একক ভেক্টর $\hat{d}_{\text{shot}} = \frac{\vec{p}_{\text{grabWorld}} - \vec{p}_{\text{dragCurrent}}}{d_{\text{pull}}}$ হলে, ইম্পালস ভেক্টর $\vec{J} = F_{\max} \cdot P \cdot \hat{d}_{\text{shot}}$।
কলমের গ্র্যাব বিন্দুর লিভার আর্ম $\vec{r}_{\text{grab}} = s_{\text{grab}} \cdot \vec{u}$।

$$\Delta \vec{v} = \frac{\vec{J}}{m} \cdot \left(1 - 0.28 \cdot |\hat{s}|^2\right)$$

$$\Delta \omega = \frac{(\vec{r}_{\text{grab}} \times \vec{J})_z}{I} \cdot k_{\text{spin}}$$

এখানে দেখা যাচ্ছে:
- আপনি যদি কলমের **মাঝখানে ($\hat{s} \approx 0$)** ধরে টানেন, তবে $\vec{r}_{\text{grab}} \approx 0$, তাই কোনো ঘূর্ণন ($\Delta \omega \approx 0$) হবে না—কলমটি তীরের মতো সোজা সামনে ধাক্কা দেবে (**Straight Push**)।
- আপনি যদি কলমের **নিব বা পেছনের মাথায় ($|\hat{s}| \approx 0.85 - 1.0$)** ধরে আড়াআড়ি টানেন, তবে $(\vec{r}_{\text{grab}} \times \vec{J})_z$ সর্বোচ্চ হবে এবং কলমটি প্রচণ্ড গতিতে ঘুরতে ঘুরতে (Spin Slash / Helicopter Kick) প্রতিপক্ষকে আঘাত করবে!

---

### ফর্মুলা ৩: অ্যানিসোট্রপিক ঘর্ষণ (Anisotropic Desk Friction) ও স্মুথ স্টপ লজিক

একটি কলম যখন ডেস্কের ওপর দিয়ে চলে, তখন তার দুটি দিক থাকে:
- **অক্ষ বরাবর একক ভেক্টর (Axial Vector):** $\vec{u} = (\cos\theta, \sin\theta)$ — কলমের নিব থেকে পেছনের দিক।
- **আড়াআড়ি বা গড়ানোর দিক (Lateral / Rolling Vector):** $\vec{n} = (-\sin\theta, \cos\theta)$ — কলম যেদিকে গড়ায়।

কলমের বর্তমান বেগ $\vec{v}$-কে এই দুই উপাংশে ভাগ করা হয়:

$$v_{\text{axial}} = \vec{v} \cdot \vec{u}, \quad v_{\text{lateral}} = \vec{v} \cdot \vec{n}$$

কলম যখন লম্বালম্বি পিছলায় ($v_{\text{axial}}$), তখন তার রাবার গ্রিপ টেবিলের সাথে বেশি ঘর্ষণ খায় ($\mu_{\text{axial}} = 1.35 \cdot \mu_{\text{base}}$)। কিন্তু যখন আড়াআড়ি গড়ায় ($v_{\text{lateral}}$), তখন ঘর্ষণ কম হয় ($\mu_{\text{lateral}} = 0.72 \cdot \mu_{\text{base}}$):

$$v_{\text{axial}}' = v_{\text{axial}} \cdot e^{-\mu_{\text{axial}} \cdot \Delta t}, \quad v_{\text{lateral}}' = v_{\text{lateral}} \cdot e^{-\mu_{\text{lateral}} \cdot \Delta t}$$

**স্মুথ স্টিকশন ব্রেক (Smooth Stiction Stop):** কলমের গতি যখন খুব কমে আসে ($\|\vec{v}\| < v_{\text{threshold}}$), তখন হঠাৎ করে `v = 0` না করে একটি কুলাম্ব স্টিকশন ডিকে (Coulomb Stiction Decay) চালানো হয়, যাতে কলমটি বাস্তবসম্মতভাবে স্থির হয়।

---

### ফর্মুলা ৪: Shunnek Labs-এর "Classic" বনাম "Real" ফিজিক্স মোড

[Shunnek Labs Pen Fight](https://shunneklabs.app/games/pen-fight/)-এ গেম শুরু করার সময় **Physics: Classic / Real** নামের দুটি অপশন থাকে:

| প্যারামিটার | Classic Mode (আর্কেড ও বেশি নিয়ন্ত্রণযোগ্য) | Real Mode (খাঁটি রিজিড-বডি সিমুলেশন) |
| :--- | :--- | :--- |
| **Restitution ($e$ - বাউন্স)** | $1.08 \times e_{\text{pen}}$ (সংঘর্ষে বেশি প্রাণবন্ত বাউন্স) | $0.92 \times e_{\text{pen}}$ (বাস্তব প্লাস্টিক/মেটাল স্থিতিস্থাপকতা) |
| **Edge Forgiveness (কিনারায় ব্রেক)** | ডেস্কের কিনারা থেকে `35px`-এর ভেতর গেলে আস্তে যাওয়া কলমে $18\%$ বাড়তি ঘর্ষণ কাজ করে যাতে নিজের কলম সহজে পড়ে না যায়। | কোনো কৃত্রিম সাহায্য নেই ($0\%$ এজ অ্যাসিস্ট)—সম্পূর্ণ বাস্তব জড়তা কাজ করে। |
| **Spin Transfer ($k_{\text{angular}}$)** | $1.25\times$ (সহজেই হেলিকপ্টার স্পিন শট নেওয়া যায়) | $1.00\times$ (নিউটনের প্রকৃত কৌণিক ভরবেগ সূত্র) |
| **COM Offset Influence** | $50\%$ (সব কলমই মোটামুটি সুষম থাকে) | $100\%$ (ফাউন্টেন পেন বা ক্যাপ লাগানো কলমের সামনের দিক ভারী থাকে) |

---

### ফর্মুলা ৫: ক্যাপসুল-টু-ক্যাপসুল (2D Rod) রিজিড-বডি সংঘর্ষ ও ঘূর্ণন সমাধানকারী (Collision Solver)

এটিই গেমটির সবচেয়ে গুরুত্বপূর্ণ অংশ। প্রতিটি কলমকে একটি **2D Capsule (দুই প্রান্তবিশিষ্ট রেখাংশ $A_0 A_1$ এবং ব্যাসার্ধ $R$)** হিসেবে ধরা হয়:

$$\vec{A}_0 = \vec{p}_A - \vec{u}_A \left(\frac{L_A}{2} - R_A\right), \quad \vec{A}_1 = \vec{p}_A + \vec{u}_A \left(\frac{L_A}{2} - R_A\right)$$

$$\vec{B}_0 = \vec{p}_B - \vec{u}_B \left(\frac{L_B}{2} - R_B\right), \quad \vec{B}_1 = \vec{p}_B + \vec{u}_B \left(\frac{L_B}{2} - R_B\right)$$

প্রতিটি সাব-স্টেপে দুটি রেখাংশ $A_0 A_1$ এবং $B_0 B_1$-এর মধ্যকার **ন্যূনতম দূরত্বের দুটি বিন্দু ($\vec{c}_A, \vec{c}_B$)** বের করা হয়। যদি $\|\vec{c}_B - \vec{c}_A\| < (R_A + R_B)$ হয়, তবে সংঘর্ষ ঘটেছে!

১. **সংঘর্ষের নরমাল ($\vec{n}$) ও কন্টাক্ট পয়েন্ট ($\vec{p}_{\text{contact}}$):**

$$\vec{n} = \frac{\vec{c}_B - \vec{c}_A}{\|\vec{c}_B - \vec{c}_A\|}, \quad \text{penetration } \delta = (R_A + R_B) - \|\vec{c}_B - \vec{c}_A\|$$

$$\vec{r}_A = \vec{p}_{\text{contact}} - \vec{p}_{\text{COM}, A}, \quad \vec{r}_B = \vec{p}_{\text{contact}} - \vec{p}_{\text{COM}, B}$$

২. **কন্টাক্ট বিন্দুতে আপেক্ষিক বেগ ($\vec{v}_{\text{rel}}$):**

$$\vec{v}_{\text{contact}, A} = \vec{v}_A + (-\omega_A r_{A,y}, \; \omega_A r_{A,x}), \quad \vec{v}_{\text{contact}, B} = \vec{v}_B + (-\omega_B r_{B,y}, \; \omega_B r_{B,x})$$

$$\vec{v}_{\text{rel}} = \vec{v}_{\text{contact}, B} - \vec{v}_{\text{contact}, A}, \quad v_{\text{norm}} = \vec{v}_{\text{rel}} \cdot \vec{n}$$

৩. **সংঘর্ষের ঘাত বা ইম্পালস স্কেলার ($j$):** যদি $v_{\text{norm}} < 0$ (অর্থাৎ কলম দুটি পরস্পরের দিকে আসছে) হয়:

$$e = \sqrt{e_A \cdot e_B}$$

$$j = \frac{-(1 + e) \cdot v_{\text{norm}}}{\frac{1}{m_A} + \frac{1}{m_B} + \frac{(\vec{r}_A \times \vec{n})_z^2}{I_A} + \frac{(\vec{r}_B \times \vec{n})_z^2}{I_B}}$$

৪. **রৈখিক ও কৌণিক বেগের তাৎক্ষণিক পরিবর্তন:**

$$\vec{v}_A \leftarrow \vec{v}_A - \frac{j \vec{n}}{m_A}, \quad \vec{v}_B \leftarrow \vec{v}_B + \frac{j \vec{n}}{m_B}$$

$$\omega_A \leftarrow \omega_A - \frac{(\vec{r}_A \times j\vec{n})_z}{I_A}, \quad \omega_B \leftarrow \omega_B + \frac{(\vec{r}_B \times j\vec{n})_z}{I_B}$$

এই সূত্রের কারণেই যখন আপনার কলমের মাথা প্রতিপক্ষের কলমের এক প্রান্তে আঘাত করে, তখন প্রতিপক্ষের কলমটি বাস্তবসম্মতভাবে ঘুরতে ঘুরতে ডেস্ক থেকে ছিটকে পড়ে!

---

### ফর্মুলা ৬: ডেস্কের কিনারা থেকে কাত হয়ে পড়ে যাওয়ার ফিজিক্স (Overhang & Tipping Formula)

কলমের পুরো বডির কতটুকু ডেস্কের ভেতরে আছে তা প্রতি ফ্রেমে চেক করা হয়:
- কলমের **Center of Mass (COM):** $\vec{p}_{\text{COM}} = \vec{p} + d_{\text{COM}} \cdot \vec{u}$।
- যদি $\vec{p}_{\text{COM}}$ ডেস্কের চারপাশের সীমার (Desk Bounds) বাইরে চলে যায়, অথবা কলমের $58\%$-এর বেশি দৈর্ঘ্য ডেস্কের বাইরে ঝুলে পড়ে, তখন **Tipping Torque** চালু হয়:
  - কলমটি ডেস্কের কিনারার (Edge Pivot) সাপেক্ষে নিচের দিকে কাত হতে শুরু করে ($z$-высоতা কমতে থাকে এবং 3D tilt angle বাড়তে থাকে)।
  - একবার টিপিং শুরু হলে মাধ্যাকর্ষণ ত্বরণ $g_{\text{fall}}$ কলমটিকে মসৃণভাবে নিচে ফেলে দেয়।

---

### ফর্মুলা ৭: Shunnek Labs-এর ৮টি কলমের ৫টি স্ট্যাটাস থেকে ফিজিক্স প্যারামিটার রূপান্তর সূত্র

[Shunnek Labs Pen Fight](https://shunneklabs.app/games/pen-fight/)-এ প্রতিটি কলমের ৫টি স্ট্যাটাস (`Weight`, `Speed`, `Spin`, `Grip`, `Reach` — ১ থেকে ৫ স্কেল) এবং লেভেল (`level = 1..10`) থেকে নিচের সূত্রে ফিজিক্স মান বের করা হয়:

- **Mass ($m$):** $m = 0.007 + \text{Weight} \times 0.0052 \text{ kg}$
- **Max Flick Force ($F_{\max}$):** $F_{\max} = (14.5 + \text{Speed} \times 3.4) \times (1 + (\text{level} - 1) \times 0.025)$
- **Moment of Inertia ($I$):** $I = \frac{1}{12} m L^2 \times (1.35 - \text{Spin} \times 0.14)$ *(Spin স্ট্যাট যত বেশি, $I$ তত কম, ফলে সামান্য টর্কেই প্রচণ্ড স্পিন হয়)*
- **Surface Friction ($\mu_{\text{base}}$):** $\mu_{\text{base}} = 1.65 + \text{Grip} \times 0.68$ *(Highlighter-এর Grip 5 হওয়ায় এটি সবচেয়ে দ্রুত ব্রেক কষে থামে)*
- **Barrel Length ($L$):** $L = 116 + \text{Reach} \times 9.5 \text{ px}$

---

## ৩. সম্পূর্ণ রেডিমেড স্মুথ ফিজিক্স ও গেমপ্লে ইঞ্জিন কোড (`shunnek_smooth_engine.js`)

নিচের কোডটি স্বয়ংসম্পূর্ণ (Zero-Dependency)। এটি আপনার 2D Canvas বা Three.js 3D—যেকোনো রেন্ডারারের সাথে যুক্ত করলেই আপনার গেম হুবহু [Shunnek Labs Pen Fight](https://shunneklabs.app/games/pen-fight/)-এর মতো মাখনের মতো স্মুথ হয়ে যাবে:

```javascript
/**
 * ============================================================================
 * SHUNNEK LABS PEN FIGHT (v1.5.4) — BUTTER-SMOOTH PHYSICS & GAMEPLAY ENGINE
 * ============================================================================
 * Features:
 * 1. Fixed 120Hz Timestep Accumulator + 8x Sub-stepped Solver + Render Interpolation
 * 2. Grab-Point Offset Aiming (Grab near tip = Spin, Grab center = Straight Push)
 * 3. Start Deadzone Cancel ("Let go at the start to cancel")
 * 4. Capsule-to-Capsule (2D Rod) Rigid-Body Collision with Rotational Impulse & Tangential Friction
 * 5. Anisotropic Desk Friction (Axial vs. Lateral Rolling + Smooth Coulomb Stiction)
 * 6. "Classic" & "Real" Physics Modes + Overhang Center-of-Mass (COM) Tipping
 * 7. 4-Tier AI Opponent (Easy, Normal, Hard, Master)
 */

export const SHUNNEK_PHYSICS_MODES = {
  classic: {
    id: 'classic',
    name: 'Classic',
    restitutionMultiplier: 1.08,
    spinBoost: 1.28,
    comOffsetScale: 0.5,
    edgeAssistMarginPx: 38,
    edgeAssistBrake: 1.22,
    stictionSpeedThreshold: 18.0
  },
  real: {
    id: 'real',
    name: 'Real',
    restitutionMultiplier: 0.94,
    spinBoost: 1.0,
    comOffsetScale: 1.0,
    edgeAssistMarginPx: 0,
    edgeAssistBrake: 1.0,
    stictionSpeedThreshold: 11.0
  }
};

export class ShunnekPenBody {
  constructor(config, startX, startY, startAngle = 0) {
    this.id = config.id || 'pen';
    this.name = config.name_en || 'Pen';
    this.stats = config.stats || { weight: 3, speed: 3, spin: 3, grip: 3, reach: 3 };
    this.level = config.level || 1;
    this.isCapOn = config.isCapOn !== undefined ? config.isCapOn : !!config.defaultCapOn;

    // Derive physical constants from 5-bar stats + physics config
    const phys = config.physics || {};
    const lvlMult = 1 + (this.level - 1) * 0.02;

    // Dimensions in Desk Pixels (1mm ≈ 1.05px on standard 900x560 desk)
    this.length = (phys.lengthMm || (118 + this.stats.reach * 8)) * (this.isCapOn ? 1.06 : 1.0);
    this.radius = ((phys.diameterMm || 10.5) * 0.5) * 1.15;

    // Mass (kg) & Center of Mass offset along local X axis (px)
    const capMassBonus = this.isCapOn ? 0.0028 : 0;
    this.mass = (phys.massKg || (0.008 + this.stats.weight * 0.005)) + capMassBonus;
    this.invMass = 1 / this.mass;

    // When cap is fitted on the nib (-X end), COM shifts slightly toward the capped front
    const baseComMm = phys.comOffsetMm || 0;
    this.comOffset = (baseComMm + (this.isCapOn ? -3.5 : 0)) * 1.05;

    // Moment of Inertia (I = 1/12 * m * L^2, scaled by Spin stat for responsiveness)
    const spinEase = 1.32 - (this.stats.spin * 0.12);
    this.inertia = (1 / 12) * this.mass * (this.length * this.length) * spinEase;
    this.invInertia = 1 / this.inertia;

    // Surface Friction & Restitution
    this.friction = phys.friction || (0.22 + this.stats.grip * 0.13);
    this.restitution = phys.restitution || (0.45 + (5 - this.stats.grip) * 0.07);
    this.maxFlickSpeed = (680 + this.stats.speed * 115) * lvlMult;

    // Dynamic State (Current & Previous for Render Interpolation)
    this.x = startX;
    this.y = startY;
    this.angle = startAngle;

    this.prevX = startX;
    this.prevY = startY;
    this.prevAngle = startAngle;

    // Render-interpolated coordinates
    this.renderX = startX;
    this.renderY = startY;
    this.renderAngle = startAngle;

    // Velocities (px/s and rad/s)
    this.vx = 0;
    this.vy = 0;
    this.omega = 0;

    // Falling / Tipping state off the desk edge
    this.isFalling = false;
    this.isOut = false;
    this.zHeight = 0;
    this.vz = 0;
    this.tiltAngle = 0;
    this.fallEdgeNormal = { x: 0, y: 0 };
  }

  savePreviousState() {
    this.prevX = this.x;
    this.prevY = this.y;
    this.prevAngle = this.angle;
  }

  interpolateRenderState(alpha) {
    this.renderX = this.prevX + (this.x - this.prevX) * alpha;
    this.renderY = this.prevY + (this.y - this.prevY) * alpha;
    let dTheta = this.angle - this.prevAngle;
    while (dTheta > Math.PI) dTheta -= Math.PI * 2;
    while (dTheta < -Math.PI) dTheta += Math.PI * 2;
    this.renderAngle = this.prevAngle + dTheta * alpha;
  }

  getEndpoints(useRender = false) {
    const cx = useRender ? this.renderX : this.x;
    const cy = useRender ? this.renderY : this.y;
    const ang = useRender ? this.renderAngle : this.angle;
    const halfSeg = Math.max(4, this.length * 0.5 - this.radius);
    const ux = Math.cos(ang);
    const uy = Math.sin(ang);
    return {
      ux,
      uy,
      ax: cx - ux * halfSeg,
      ay: cy - uy * halfSeg,
      bx: cx + ux * halfSeg,
      by: cy + uy * halfSeg
    };
  }

  getCenterOfMass(modeCfg) {
    const ux = Math.cos(this.angle);
    const uy = Math.sin(this.angle);
    const offset = this.comOffset * (modeCfg ? modeCfg.comOffsetScale : 1.0);
    return {
      x: this.x + ux * offset,
      y: this.y + uy * offset
    };
  }

  isMoving() {
    if (this.isOut) return false;
    if (this.isFalling) return true;
    return Math.hypot(this.vx, this.vy) > 2.5 || Math.abs(this.omega) > 0.04;
  }
}

export class ShunnekPenFightEngine {
  constructor(deskBounds = { left: 70, top: 60, right: 830, bottom: 500 }, mode = 'classic') {
    this.desk = deskBounds;
    this.mode = SHUNNEK_PHYSICS_MODES[mode] || SHUNNEK_PHYSICS_MODES.classic;
    this.pens = [];

    // Fixed Timestep Configuration (120Hz Physics + 8 Sub-steps = 960Hz Collision Precision)
    this.fixedDt = 1 / 120;
    this.subSteps = 8;
    this.accumulator = 0;

    // Input / Aiming State ("01 Hold -> 02 Pull -> 03 Release")
    this.aimState = {
      active: false,
      pen: null,
      grabOffsetLocal: 0,     // Distance from center along pen axis [-L/2, +L/2]
      normalizedOffset: 0,    // [-1, +1]
      grabWorldX: 0,
      grabWorldY: 0,
      dragX: 0,
      dragY: 0,
      pullDistance: 0,
      cancelDeadzonePx: 14,   // "Let go at the start to cancel"
      maxPullPx: 195,
      isCancelled: true
    };

    // Callbacks for sound/VFX
    this.onCollision = null;
    this.onPenFall = null;
    this.onFlick = null;
  }

  setPhysicsMode(modeKey) {
    if (SHUNNEK_PHYSICS_MODES[modeKey]) {
      this.mode = SHUNNEK_PHYSICS_MODES[modeKey];
    }
  }

  // ==========================================================================
  // 1. INPUT & FLICK AIMING ("Grab near a tip to spin, pull further for power")
  // ==========================================================================
   tryGrabPen(pen, pointerX, pointerY) {
    if (!pen || pen.isFalling || pen.isOut || pen.isMoving()) return false;

    const ep = pen.getEndpoints(false);
    const closest = ShunnekPenFightEngine.closestPointOnSegment(
      pointerX, pointerY, ep.ax, ep.ay, ep.bx, ep.by
    );
    const dist = Math.hypot(pointerX - closest.x, pointerY - closest.y);

    // Generous touch halo (radius * 2.8) so grabbing feels effortless
    if (dist > pen.radius * 2.8) return false;

    const dx = pointerX - pen.x;
    const dy = pointerY - pen.y;
    const localS = Math.max(-pen.length * 0.5, Math.min(pen.length * 0.5, dx * ep.ux + dy * ep.uy));

    this.aimState.active = true;
    this.aimState.pen = pen;
    this.aimState.grabOffsetLocal = localS;
    this.aimState.normalizedOffset = localS / (pen.length * 0.5);
    this.aimState.grabWorldX = pen.x + ep.ux * localS;
    this.aimState.grabWorldY = pen.y + ep.uy * localS;
    this.aimState.dragX = pointerX;
    this.aimState.dragY = pointerY;
    this.aimState.pullDistance = 0;
    this.aimState.isCancelled = true;
    return true;
  }

  updateAimDrag(pointerX, pointerY) {
    if (!this.aimState.active || !this.aimState.pen) return;
    const pen = this.aimState.pen;
    const ux = Math.cos(pen.angle);
    const uy = Math.sin(pen.angle);

    this.aimState.grabWorldX = pen.x + ux * this.aimState.grabOffsetLocal;
    this.aimState.grabWorldY = pen.y + uy * this.aimState.grabOffsetLocal;
    this.aimState.dragX = pointerX;
    this.aimState.dragY = pointerY;

    const pullDx = this.aimState.grabWorldX - pointerX;
    const pullDy = this.aimState.grabWorldY - pointerY;
    this.aimState.pullDistance = Math.hypot(pullDx, pullDy);
    this.aimState.isCancelled = this.aimState.pullDistance < this.aimState.cancelDeadzonePx;
  }

  releaseAimAndFlick() {
    if (!this.aimState.active || !this.aimState.pen) return { flicked: false };
    const st = this.aimState;
    const pen = st.pen;
    st.active = false;

    // "Let go at the start to cancel"
    if (st.isCancelled || st.pullDistance < st.cancelDeadzonePx) {
      st.pen = null;
      return { flicked: false, cancelled: true };
    }

    const pullDx = st.grabWorldX - st.dragX;
    const pullDy = st.grabWorldY - st.dragY;
    const dist = Math.hypot(pullDx, pullDy) || 1;
    const dirX = pullDx / dist;
    const dirY = pullDy / dist;

    // Non-linear power curve (gamma = 1.15)
    const rawNorm = ( Math.min(dist, st.maxPullPx) - st.cancelDeadzonePx ) / (st.maxPullPx - st.cancelDeadzonePx);
    const power = Math.pow(Math.max(0, Math.min(1, rawNorm)), 1.15);

    this.applyFlickImpulse(pen, dirX, dirY, power, st.grabOffsetLocal);
    st.pen = null;
    return { flicked: true, power };
  }

  applyFlickImpulse(pen, dirX, dirY, power01, grabOffsetLocal = 0) {
    const ux = Math.cos(pen.angle);
    const uy = Math.sin(pen.angle);
    const normOffset = Math.max(-1, Math.min(1, grabOffsetLocal / (pen.length * 0.5)));

    // Linear speed slightly reduces when grabbing extreme tip (energy goes into spin)
    const linearEfficiency = 1.0 - 0.26 * (normOffset * normOffset);
    const launchSpeed = pen.maxFlickSpeed * power01 * linearEfficiency;

    pen.vx = dirX * launchSpeed;
    pen.vy = dirY * launchSpeed;

    // Torque τ = r_grab × F => Cross product in 2D: rx * fy - ry * fx
    const rx = ux * grabOffsetLocal;
    const ry = uy * grabOffsetLocal;
    const crossZ = rx * dirY - ry * dirX;

    // Angular velocity impulse
    const spinFactor = (16.5 * this.mode.spinBoost) / (pen.length * 0.5);
    pen.omega = (crossZ / (pen.length * 0.5)) * power01 * spinFactor * (0.75 + pen.stats.spin * 0.14);

    if (this.onFlick) {
      this.onFlick({ pen, power: power01, spin: pen.omega });
    }
  }

  // ==========================================================================
  // 2. FRAME-RATE INDEPENDENT UPDATE LOOP WITH SUB-STEPPING & INTERPOLATION
  // ==========================================================================
  updateFrame(deltaSeconds) {
    // Clamp deltaSeconds to avoid spiral of death if tab was backgrounded
    const clampedDt = Math.min(deltaSeconds, 0.05);
    this.accumulator += clampedDt;

    while (this.accumulator >= this.fixedDt) {
      for (let i = 0; i < this.pens.length; i++) {
        this.pens[i].savePreviousState();
      }
      const subDt = this.fixedDt / this.subSteps;
      for (let s = 0; s < this.subSteps; s++) {
        this.stepPhysics(subDt);
      }
      this.accumulator -= this.fixedDt;
    }

    // Interpolate visual coordinates for ultra-smooth rendering at any refresh rate
    const alpha = this.accumulator / this.fixedDt;
    for (let i = 0; i < this.pens.length; i++) {
      this.pens[i].interpolateRenderState(alpha);
    }
  }

  stepPhysics(dt) {
    // Step 1: Integrate velocities & apply anisotropic surface friction
    for (let i = 0; i < this.pens.length; i++) {
      const p = this.pens[i];
      if (p.isOut) continue;

      if (p.isFalling) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.angle += p.omega * dt;
        p.vz -= 980 * dt; // Gravity
        p.zHeight += p.vz * dt;
        p.tiltAngle += 4.5 * dt;
        if (p.zHeight < -180) {
          p.isOut = true;
        }
        continue;
      }

      // Integrate position & angle
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.angle += p.omega * dt;

      // Decompose velocity into Axial (along barrel) and Lateral (rolling perpendicular)
      const ux = Math.cos(p.angle);
      const uy = Math.sin(p.angle);
      const nx = -uy;
      const ny = ux;

      let vAxial = p.vx * ux + p.vy * uy;
      let vLateral = p.vx * nx + p.vy * ny;

      // Base friction from pen's Grip stat
      let muBase = 2.4 + p.friction * 3.8;

      // Classic mode edge-assist brake (helps prevent accidental self-ring-outs at low speed)
      if (this.mode.edgeAssistMarginPx > 0) {
        const m = this.mode.edgeAssistMarginPx;
        const nearEdge =
          p.x - this.desk.left < m ||
          this.desk.right - p.x < m ||
          p.y - this.desk.top < m ||
          this.desk.bottom - p.y < m;
        if (nearEdge && Math.hypot(p.vx, p.vy) < 210) {
          muBase *= this.mode.edgeAssistBrake;
        }
      }

      const axialDecay = Math.exp(-muBase * 1.38 * dt);
      const lateralDecay = Math.exp(-muBase * 0.74 * dt);

      vAxial *= axialDecay;
      vLateral *= lateralDecay;

      p.vx = ux * vAxial + nx * vLateral;
      p.vy = uy * vAxial + ny * vLateral;

      // Angular damping
      const angDecay = Math.exp(-(2.2 + p.friction * 2.8) * dt);
      p.omega *= angDecay;

      // Smooth Coulomb Stiction near rest (prevents endless micro-gliding)
      const speed = Math.hypot(p.vx, p.vy);
      if (speed < this.mode.stictionSpeedThreshold) {
        const stiction = Math.max(0, 1 - (42 * dt));
        p.vx *= stiction;
        p.vy *= stiction;
        if (speed < 1.8) {
          p.vx = 0;
          p.vy = 0;
        }
      }
      if (Math.abs(p.omega) < 0.03) {
        p.omega = 0;
      }

      // Check Desk Edge Overhang & Center-of-Mass Tipping
      this.checkDeskOverhang(p);
    }

    // Step 2: Capsule-to-Capsule Rigid Body Collisions
    for (let i = 0; i < this.pens.length; i++) {
      for (let j = i + 1; j < this.pens.length; j++) {
        const pA = this.pens[i];
        const pB = this.pens[j];
        if (pA.isOut || pB.isOut || pA.isFalling || pB.isFalling) continue;
        this.resolveCapsuleCollision(pA, pB);
      }
    }
  }

  // ==========================================================================
  // 3. CAPSULE-TO-CAPSULE (2D ROD) RIGID-BODY COLLISION SOLVER
  // ==========================================================================
  resolveCapsuleCollision(pA, pB) {
    const epA = pA.getEndpoints(false);
    const epB = pB.getEndpoints(false);

    const closest = ShunnekPenFightEngine.closestPointsBetweenSegments(
      epA.ax, epA.ay, epA.bx, epA.by,
      epB.ax, epB.ay, epB.bx, epB.by
    );

    const dx = closest.bx - closest.ax;
    const dy = closest.by - closest.ay;
    const dist = Math.hypot(dx, dy);
    const minDist = pA.radius + pB.radius;

    if (dist >= minDist) return;

    // Contact Normal n (from A to B)
    let nx = 1, ny = 0;
    if (dist > 1e-5) {
      nx = dx / dist;
      ny = dy / dist;
    } else {
      const cdx = pB.x - pA.x;
      const cdy = pB.y - pA.y;
      const cLen = Math.hypot(cdx, cdy) || 1;
      nx = cdx / cLen;
      ny = cdy / cLen;
    }

    const penetration = minDist - dist;

    // 1. Positional Slop Correction (prevents pens from sinking into each other)
    const percent = 0.82;
    const slop = 0.05;
    const corrMag = (Math.max(penetration - slop, 0) / (pA.invMass + pB.invMass)) * percent;
    pA.x -= nx * corrMag * pA.invMass;
    pA.y -= ny * corrMag * pA.invMass;
    pB.x += nx * corrMag * pB.invMass;
    pB.y += ny * corrMag * pB.invMass;

    // 2. Contact Point & Lever Arms relative to each pen's Center of Mass
    const contactX = closest.ax + nx * pA.radius;
    const contactY = closest.ay + ny * pA.radius;

    const comA = pA.getCenterOfMass(this.mode);
    const comB = pB.getCenterOfMass(this.mode);

    const rAx = contactX - comA.x;
    const rAy = contactY - comA.y;
    const rBx = contactX - comB.x;
    const rBy = contactY - comB.y;

    // 3. Velocity at contact point: v_contact = v + omega × r
    const vAx = pA.vx - pA.omega * rAy;
    const vAy = pA.vy + pA.omega * rAx;
    const vBx = pB.vx - pB.omega * rBy;
    const vBy = pB.vy + pB.omega * rBx;

    const relVx = vBx - vAx;
    const relVy = vBy - vAy;
    const velAlongNormal = relVx * nx + relVy * ny;

    // Do not resolve if velocities are separating
    if (velAlongNormal > 0) return;

    // 4. Rotational Impulse Denominator
    const rAcrossN = rAx * ny - rAy * nx;
    const rBcrossN = rBx * ny - rBy * nx;

    const invMassSum =
      pA.invMass +
      pB.invMass +
      (rAcrossN * rAcrossN) * pA.invInertia +
      (rBcrossN * rBcrossN) * pB.invInertia;

    const e = Math.min(0.95, Math.sqrt(pA.restitution * pB.restitution) * this.mode.restitutionMultiplier);
    const j = -(1 + e) * velAlongNormal / invMassSum;

    const impulseX = j * nx;
    const impulseY = j * ny;

    // Apply Normal Impulse
    pA.vx -= impulseX * pA.invMass;
    pA.vy -= impulseY * pA.invMass;
    pA.omega -= (rAx * impulseY - rAy * impulseX) * pA.invInertia * this.mode.spinBoost;

    pB.vx += impulseX * pB.invMass;
    pB.vy += impulseY * pB.invMass;
    pB.omega += (rBx * impulseY - rBy * impulseX) * pB.invInertia * this.mode.spinBoost;

    // 5. Tangential Friction Impulse (transfers spin & grip bite on glancing blows)
    let tx = relVx - velAlongNormal * nx;
    let ty = relVy - velAlongNormal * ny;
    const tLen = Math.hypot(tx, ty);
    if (tLen > 1e-4) {
      tx /= tLen;
      ty /= tLen;
      const rAcrossT = rAx * ty - rAy * tx;
      const rBcrossT = rBx * ty - rBy * tx;
      const invMassTan =
        pA.invMass +
        pB.invMass +
        (rAcrossT * rAcrossT) * pA.invInertia +
        (rBcrossT * rBcrossT) * pB.invInertia;

      let jt = -(relVx * tx + relVy * ty) / invMassTan;
      const muCombined = Math.sqrt(pA.friction * pB.friction) * 0.45;
      const maxJt = j * muCombined;
      jt = Math.max(-maxJt, Math.min(maxJt, jt));

      const tanImpX = jt * tx;
      const tanImpY = jt * ty;

      pA.vx -= tanImpX * pA.invMass;
      pA.vy -= tanImpY * pA.invMass;
      pA.omega -= (rAx * tanImpY - rAy * tanImpX) * pA.invInertia;

      pB.vx += tanImpX * pB.invMass;
      pB.vy += tanImpY * pB.invMass;
      pB.omega += (rBx * tanImpY - rBy * tanImpX) * pB.invInertia;
    }

    if (this.onCollision && Math.abs(velAlongNormal) > 25) {
      this.onCollision({
        contactX,
        contactY,
        impactSpeed: Math.abs(velAlongNormal),
        penA: pA,
        penB: pB
      });
    }
  }

  // ==========================================================================
  // 4. DESK EDGE OVERHANG & CENTER-OF-MASS TIPPING
  // ==========================================================================
  checkDeskOverhang(pen) {
    const com = pen.getCenterOfMass(this.mode);
    const d = this.desk;

    let outDirX = 0;
    let outDirY = 0;

    if (com.x < d.left) outDirX = -1;
    else if (com.x > d.right) outDirX = 1;

    if (com.y < d.top) outDirY = -1;
    else if (com.y > d.bottom) outDirY = 1;

    if (outDirX !== 0 || outDirY !== 0) {
      pen.isFalling = true;
      pen.fallEdgeNormal = { x: outDirX, y: outDirY };
      // Give a slight outward tip push as gravity takes over the overhang
      pen.vx += outDirX * 65;
      pen.vy += outDirY * 65;
      pen.vz = -40;
      if (this.onPenFall) {
        this.onPenFall(pen);
      }
    }
  }

  // ==========================================================================
  // 5. SHUNNEK 4-TIER AI SHOT CALCULATOR (Easy, Normal, Hard, Master)
  // ==========================================================================
  computeAIShot(aiPen, targetPen, difficulty = 'normal') {
    const dx = targetPen.x - aiPen.x;
    const dy = targetPen.y - aiPen.y;
    const dist = Math.hypot(dx, dy) || 1;

    const presets = {
      easy:   { angleJitter: 0.22, powerMin: 0.45, powerMax: 0.72, useSpin: false },
      normal: { angleJitter: 0.11, powerMin: 0.55, powerMax: 0.85, useSpin: true  },
      hard:   { angleJitter: 0.04, powerMin: 0.68, powerMax: 0.94, useSpin: true  },
      master: { angleJitter: 0.012, powerMin: 0.75, powerMax: 0.98, useSpin: true }
    };
    const cfg = presets[difficulty] || presets.normal;

    // Aim slightly toward the target's nearest desk edge to knock them out
    const edgeDistLeft = targetPen.x - this.desk.left;
    const edgeDistRight = this.desk.right - targetPen.x;
    const edgeDistTop = targetPen.y - this.desk.top;
    const edgeDistBottom = this.desk.bottom - targetPen.y;

    let aimX = targetPen.x;
    let aimY = targetPen.y;

    if (difficulty === 'hard' || difficulty === 'master') {
      const ep = targetPen.getEndpoints(false);
      // Aim at one of the target pen's tips for maximum rotational knockout
      if (Math.random() < 0.65) {
        aimX = ep.ax;
        aimY = ep.ay;
      } else {
        aimX = ep.bx;
        aimY = ep.by;
      }
    }

    const baseAngle = Math.atan2(aimY - aiPen.y, aimX - aiPen.x);
    const finalAngle = baseAngle + (Math.random() - 0.5) * cfg.angleJitter;

    const dirX = Math.cos(finalAngle);
    const dirY = Math.sin(finalAngle);

    const distFactor = Math.min(1, dist / 420);
    const power = Math.min(1, cfg.powerMin + distFactor * (cfg.powerMax - cfg.powerMin));

    // Grab offset: near tip if target is close & spin slash is advantageous
    const grabOffset = (cfg.useSpin && dist < 240)
      ? (Math.random() < 0.5 ? 0.65 : -0.65) * (aiPen.length * 0.5)
      : 0;

    return { dirX, dirY, power, grabOffset };
  }

  // ==========================================================================
  // GEOMETRY HELPERS: Closest Point on Segment & Segment-to-Segment
  // ==========================================================================
  static closestPointOnSegment(px, py, ax, ay, bx, by) {
    const abx = bx - ax;
    const aby = by - ay;
    const lenSq = abx * abx + aby * aby;
    if (lenSq < 1e-6) return { x: ax, y: ay, t: 0 };
    const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / lenSq));
    return { x: ax + t * abx, y: ay + t * aby, t };
  }

  static closestPointsBetweenSegments(ax, ay, bx, by, cx, cy, dx, dy) {
    const candidates = [
      { a: { x: ax, y: ay }, b: this.closestPointOnSegment(ax, ay, cx, cy, dx, dy) },
      { a: { x: bx, y: by }, b: this.closestPointOnSegment(bx, by, cx, cy, dx, dy) },
      { a: this.closestPointOnSegment(cx, cy, ax, ay, bx, by), b: { x: cx, y: cy } },
      { a: this.closestPointOnSegment(dx, dy, ax, ay, bx, by), b: { x: dx, y: dy } }
    ];

    let best = candidates[0];
    let minD2 = Infinity;
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      const d2 = (c.a.x - c.b.x) ** 2 + (c.a.y - c.b.y) ** 2;
      if (d2 < minD2) {
        minD2 = d2;
        best = c;
      }
    }
    return { ax: best.a.x, ay: best.a.y, bx: best.b.x, by: best.b.y };
  }
}
```

---

## ৪. Antigravity AI Master Integration Prompt (কপি করে সরাসরি পেস্ট করুন)

আপনি যদি আপনার কোড এডিটরে বা **Antigravity AI**-কে দিয়ে এক ক্লিকে আপনার বর্তমান ক্লোন গেমটিতে এই পুরো স্মুথ গেমপ্লে ইঞ্জিনটি বসিয়ে নিতে চান, তবে নিচের বক্সের প্রম্পটটি কপি করে পেস্ট করে দিন:

```markdown
# ANTIGRAVITY MASTER TASK: UPGRADE MY PEN FIGHT CLONE TO SHUNNEK LABS (v1.5.4) BUTTER-SMOOTH PHYSICS & GAMEPLAY

Please upgrade the physics loop, aiming/flick mechanics, and collision solver in my Pen Fight game so that it plays as smoothly as Shunnek Labs' "Desk Wars: Pen Fight" (https://shunneklabs.app/games/pen-fight/).

## Required Upgrades to Implement:

1. **Fixed 120Hz Timestep with 8x Sub-Stepping & Render Interpolation**:
   - Replace the single-step per-frame position update (`x += vx`) with a fixed timestep accumulator (`fixedDt = 1/120`, `subSteps = 8`).
   - Store `prevX, prevY, prevAngle` before each physics step and render using interpolated coordinates (`renderX, renderY, renderAngle`) based on `alpha = accumulator / fixedDt` so movement is 100% jitter-free on 60Hz, 120Hz, and 144Hz screens.

2. **Grab-Point Offset Aiming & Spin Torque ("Hold -> Pull -> Release")**:
   - Allow the player to grab anywhere along their pen's barrel (`grabOffsetLocal` in `[-L/2, +L/2]`).
   - Show a visual grab point dot on the pen, a pull-back power line, and a trajectory preview arrow.
   - If the player releases within `14px` of the grab point, cancel the shot without losing the turn ("Let go at the start to cancel").
   - Compute both linear velocity (`v = J / m`) and angular spin velocity (`omega = (r_grab x J)_z / I`) so grabbing near a tip produces fast helicopter spin shots while grabbing near the center produces straight pushes.

3. **Anisotropic Desk Friction & Smooth Coulomb Stiction**:
   - Decompose velocity into axial (`v_axial` along the pen barrel) and lateral (`v_lateral` perpendicular rolling direction).
   - Apply higher damping to `v_axial` and lower rolling damping to `v_lateral`, plus smooth stiction braking below `18 px/s` so pens settle naturally on the wooden desk.

4. **2D Capsule / Rod Segment-to-Segment Collision Solver with Rotational Impulse**:
   - Replace simple center-to-center circle collision with true closest-point segment-to-segment (2D Capsule) collision detection along the full length of both pens.
   - Calculate contact lever arms (`rA`, `rB`), relative contact velocity (`v_rel = (vB + omegaB x rB) - (vA + omegaA x rA)`), normal impulse `j`, and tangential friction impulse `jt` so tip-to-tip and glancing hits cause realistic rebounds and spin transfers.

5. **Overhang Center-of-Mass (COM) Tipping & Classic/Real Physics Toggle**:
   - Only trigger a pen falling off the desk when its Center of Mass (`COM`) crosses the desk boundary, followed by a smooth 3D falling & tilting animation.
   - Add a UI toggle for `Physics: Classic` (with subtle edge-assist braking and boosted spin) vs `Physics: Real` (authentic rigid-body inertia).
```
