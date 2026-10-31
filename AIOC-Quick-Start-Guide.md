# AIOC (All-In-One-Cable) — Quick Start & Software Configuration Guide

> **Purpose of this document**
> This is a knowledge base for both people and AI agents. An agent that has
> this document should be able to answer: *"I have an AIOC and radio X. I want to
> do Y on computer Z. What software do I install and how do I set it up?"*
>
> **Document version:** 2026-10-31 (rev 3: community research, AIOC Toolkit) · Written for AIOC firmware **v1.4.1**
> (still the latest release on 2026-10-31) and hardware rev 1.0–1.2.

---

## 0. Instructions for AI Agents (read first)

1. **Work out four things first.** Ask only for the ones the user hasn't told you:
   - **Goal**: what they want to do (programming, APRS, Winlink, SSTV, AllStar node, …).
   - **OS**: Windows, Linux (including Raspberry Pi), macOS, Android, or iPhone/iPad.
   - **Radio**: brand and model. The AIOC uses the Kenwood-style **K1** 2-pin plug.
   - **AIOC firmware version**, if it matters for the task. Features like VPTT and aioc-util need v1.3.0 or newer.
2. **Use the Decision Table (Section 3)** to pick the software, then go to the recipe for that software.
3. **PTT is the most common problem.** If the radio doesn't key, use the PTT Troubleshooting Flow (Section 6).
4. **How sure each statement is.** Statements are tagged:
   - **[Official]**: from the AIOC GitHub README, the release notes or the firmware source (skuep/AIOC).
   - **[Tool docs]**: from the aioc-util documentation or the other software's own docs.
   - **[Community]**: reported by AIOC users in GitHub issues, the AllStarLink forum, the DigiPi group, or published guides (G1LRO, DL-Nordwest, M0AWS). These are real-world results, but not guaranteed for every setup.
   - **[Typical]**: commonly used settings that are known to work in general. Menu names may differ between software versions, so tell the user to check them on their screen.
5. **Safety and legal.** Transmitting needs an amateur radio licence. Tell users to transmit into a dummy load, or on low power on a clear simplex frequency, while they test. Never suggest settings that break band plans or ID rules.
6. **Don't invent menu paths.** If a menu item isn't covered here, describe what the setting does (for example "choose the AIOC as the audio input") instead of guessing its exact name.

---

## 1. What the AIOC Is

The AIOC is a small open-source PCB with a **USB-C** socket. It plugs straight
into a handheld radio's **Kenwood K1 connector** (3.5 mm + 2.5 mm plugs). It replaces
three things: a programming cable, a sound-card interface (like a SignaLink or Digirig),
and a PTT interface. **[Official]**

When plugged into a computer it shows up as a USB composite device with these parts:

| Function | Shows up as | Used for |
|---|---|---|
| **USB sound card** | "All-In-One-Cable" / "AIOC Audio" (1 mono input, 1 mono output) | RX audio from the radio to the PC, TX audio from the PC to the radio |
| **Virtual serial port (CDC-ACM)** | Windows: `COMx` · Linux: `/dev/ttyACMx` · macOS: `/dev/cu.usbmodemXXXX` | Radio programming (CHIRP etc.) **and** serial PTT |
| **CM108-compatible HID** | Linux: `/dev/hidrawX` | CM108-style PTT (GPIO3) and COS input (fw ≥ 1.2.0); configuration interface (fw ≥ 1.3.0) |
| **DFU runtime** | — | Firmware updates without opening the case (fw ≥ 1.2.0) |

Key facts **[Official]**:

- **USB VID:PID = `1209:7388`**. In bootloader (DFU) mode it shows up as the STM32 bootloader, `0483:df11`.
- USB strings: Manufacturer `AIOC`, Product `All-In-One-Cable`.
- MCU: STM32F302, with the built-in ADC/DAC used as the sound card.
- Works on **Windows, Linux and macOS** without drivers. Android works through USB OTG for audio.
- Supported sample rates: **48000 Hz (preferred)**, 32000, 24000, 22050 (for APRSdroid), 16000, 12000, 11025, 8000.
- Supports **dual-PTT** radios (PTT1 and PTT2 outputs).
- Default PTT1 sources: **CM108 GPIO3** OR **serial `DTR=1 AND RTS=0`**. Both work at the same time.
- Default PTT2 source: CM108 GPIO4.
- Default COS: the **Virtual COS** (VCOS, based on RX audio level) is reported as the CM108 **Volume Down** button.

### Hardware revisions and firmware compatibility
| Hardware | Firmware | Notes |
|---|---|---|
| **rev 1.0 / 1.1** (most units sold 2023–2025) | 1.2.0, **1.3.0 (safest)**, 1.4.x | **[Community]** Some rev 1.0 units on fw 1.4.x **hang with PTT stuck on**, or show audio "Code 10" errors inside Windows VMs (GitHub #120, #138, still open). If that happens, flash **v1.3.0**. |
| **rev 1.2** (from Sept 2025) | **1.4.0 or newer required** **[Official]** | Adds: external hardware COS input, a split PTT/UART pad (lets you separate CAT serial from PTT), adjustable RX gain 1–16×, TX boost (line level). |
| **G1LRO "dual-COS" AIOC / URC** | ships with 1.3.0 | **[Community]** Has a solder jumper: **LOGIC COS** (Tidradio H3 new firmware, SA818 modules) or **SPK COS** (Baofeng/Quansheng speaker-based COS). |

> **The hardware revision is printed on the PCB.** Use only the official `aioc-fw-x.y.z.bin` builds for the STM32F302.
> **[Community]** Boards built with an STM32F373 (it appears in an old BOM) don't enumerate (error -71) and need the MCU replaced (GitHub #122).

### Tested radios **[Official]**
- Baofeng UV-5R (CHIRP + APRS)
- Wouxun UV-9D Mate (CHIRP + APRS)
- BTECH UV-6X2 / 6X2 (CHIRP)
- Quansheng UV-K5 (stock firmware, Egzumer custom firmware, Quansheng Dock)

**Also reported working [Community]:** Baofeng UV-82, BF-888, Puxing PX-888(D), Wouxun KG-UV9D Plus,
Retevis RT85, Explorer QRZ-1, Tidradio H3, and the **Kenwood TH-F6A** (set the jack to **SP/MIC** mode: Menu 9).
Users have also wired the AIOC by hand to mobile and HF radios' data/mic ports: **Yaesu FT-817ND / FT-857D /
FT-7800R** (audio, PTT and CAT serial), Xiegu G90, and a Radtel RT-950 Pro through a Kenwood adapter. Note that
CAT serial data could trigger PTT on rev 1.0 boards (GitHub #34). Hardware rev 1.2's split PTT/UART pad fixes this.

**In general [Typical]:** any HT with a Kenwood-style 2-pin K1 jack. That includes most Baofeng
(UV-5R family, BF-888S, UV-82 *(UV-82 has a dual-PTT variant)*), Quansheng (UV-K5/K6/K5(8)/UV-5R Plus),
BTECH, Wouxun, TIDRADIO, Radtel, Retevis, Abbree, Puxing and Kenwood HTs with the K1 jack. Radios with
**other connectors** (Yaesu, Icom, Motorola multi-pin, Baofeng/BTECH "screw-on" UV-5X-style plugs,
Anytone/Alinco single-plug) **do not fit** without an adapter.

### Limitations (tell users before they buy or try)
- **Only audio through the mic/speaker jack.** The K1 jack carries filtered, de-emphasised speaker audio
  and a mic input. So **9600 baud packet, M17, DMR, D-STAR, or any mode that needs "flat"
  discriminator/modulator audio will not work** through the K1 jack. 1200 baud AFSK packet/APRS, VARA FM
  (narrow), SSTV, fldigi modes and voice all work well.
- **SSB digital modes (FT8, JS8, FreeDV)** need an SSB radio. With an FM HT these programs *run*, but
  they won't reach the normal FT8/JS8 users on HF/SSB.
- **APRSdroid has no PTT control.** Use the AIOC **Virtual PTT (VPTT)** (fw ≥ 1.3.0) or the radio's VOX.
- **iPhone/iPad apps can only use the AIOC as a sound card**: iOS doesn't let apps reach the serial or HID parts.
  Transmitting therefore needs **VPTT**. **[Community]**
- **Budget HTs switch between TX and RX slowly.** Packet works, but with more retries than on a mobile rig. **[Community]**
- **Settings are erased when you flash new firmware.** Re-apply your aioc-util settings after an update. **[Official]**

---

## 2. First-Time Setup (every user)

### 2.1 Plug in
1. **Turn the radio OFF**, then push the AIOC firmly into the K1 jack. Both plugs must go all the way in.
2. Connect the USB-C cable to the computer, phone or Raspberry Pi.
3. Turn the radio on and set it to the frequency you want.

### 2.2 Check that the computer sees it
| OS | How to check |
|---|---|
| **Windows** | Device Manager → *Ports (COM & LPT)* shows a new **COMx**. *Sound settings* shows "All-In-One-Cable" as both input (microphone) and output (speaker). |
| **Linux** | `lsusb` shows `1209:7388`. `arecord -l` / `aplay -l` show the card. `ls /dev/ttyACM*` shows the serial port. `ls /dev/hidraw*` shows the HID. |
| **macOS** | System Settings → Sound shows "All-In-One-Cable". `ls /dev/cu.usbmodem*` shows the serial port. |
| **Android** | Needs a USB-C OTG connection. Apps that use the system audio input will use the AIOC once it's connected. |

### 2.3 OS audio settings (important)
- **Do NOT make the AIOC the default system playback device.** If you do, system sounds (notifications,
  YouTube, beeps) go out over the radio, and with VPTT turned on they **will key the transmitter**.
  Keep your normal speakers as the default and pick the AIOC only inside the radio software.
- **Windows:** in Sound Control Panel → AIOC device → *Properties*:
  - *Advanced*: set the format to **1 channel, 16 bit, 48000 Hz**.
  - Turn off "Audio enhancements" and the "Communications → reduce other sounds" ducking.
  - *Listen* tab: make sure "Listen to this device" is **off**.
- **Linux (PipeWire/PulseAudio):** use `pavucontrol` to set levels. Many programs (Direwolf, ALSA-based)
  can talk to ALSA directly (`plughw:CARD,0`). That avoids resampling.
- **macOS:** Audio MIDI Setup → AIOC → set the format to 48,000 Hz.

### 2.4 Setting audio levels (all digital modes)
**[Typical]**
- **RX (radio to PC):** set the **radio's volume knob** to about 30–50% (some VARA FM users go up to about 75%; G1LRO suggests about 50% for AllStar nodes) **[Community]**. Adjust it until the program's level
  meter shows a strong but un-clipped signal. Direwolf, for example, should show "audio level" around 30–70 on a received packet.
  On hardware rev 1.2 with fw ≥ 1.4.0, you can also raise the AIOC's internal RX gain (1×–16×) with aioc-util.
- **TX (PC to radio):** start the **OS output volume for the AIOC at about 30–50%**. Too high causes over-deviation
  and distortion, and decoders will fail. Listen on a second radio, or check how other stations decode you.
  On hardware rev 1.2 there is a TX "boost" for line-level inputs (not needed for normal HTs).
- **Radio settings:** turn **VOX OFF** (unless you are deliberately using VOX). Turn off keypad beeps and
  roger beeps. Turn **battery save OFF**: it clips the start of incoming packets. **[Community]**
  **Squelch:** for packet/APRS with Direwolf or Soundmodem, **squelch open (0)** often decodes better, because
  slow Baofeng squelch cuts off the first part of a packet and the software modem does its own carrier detection. **[Community]**
  For VOX-style setups (VPTT/VCOS, AllStarLink, SvxLink, EchoLink), squelch must be **closed** when the channel is idle. Set the
  **TOT (time-out timer)** longer than your longest transmission (SSTV and Winlink can last more than 2 minutes).

### 2.5 Linux permissions (do this once)
Programs that open `/dev/ttyACM*` or `/dev/hidraw*` need permission to use them:

```bash
# Serial port access
sudo usermod -aG dialout $USER     # (Arch/Fedora may use group "uucp")
# Audio
sudo usermod -aG audio $USER

# udev rule for the AIOC HID (CM108 PTT / config) + stop ModemManager grabbing the serial port
sudo tee /etc/udev/rules.d/91-aioc.rules >/dev/null <<'EOF'
SUBSYSTEM=="hidraw", ATTRS{idVendor}=="1209", ATTRS{idProduct}=="7388", MODE="0666"
SUBSYSTEM=="tty",    ATTRS{idVendor}=="1209", ATTRS{idProduct}=="7388", ENV{ID_MM_DEVICE_IGNORE}="1", SYMLINK+="aioc", MODE="0666"
EOF
sudo udevadm control --reload && sudo udevadm trigger
# log out/in (for group changes), then unplug/replug the AIOC
```
After this, the serial port is also available as **`/dev/aioc`**. That name doesn't change when ttyACM numbers do.
The aioc-util project also ships a ready-made udev rule (`udev/rules.d/91-aioc.rules`). **[Tool docs]**

> **ModemManager** (on Ubuntu, Debian desktop, Fedora) may probe new ttyACM devices and send AT commands
> to them. That causes programming failures or random PTT. The `ID_MM_DEVICE_IGNORE` rule above prevents it.
> You can also run `sudo systemctl disable --now ModemManager` if you don't use a cellular modem.

---

## 3. Decision Table — "What software do I need?"

| User wants to… | Windows | Linux / Raspberry Pi | macOS | Android | Section |
|---|---|---|---|---|---|
| **Program channels / memories** | CHIRP | CHIRP | CHIRP | — | 5.1 |
| **Flash custom firmware (Quansheng UV-K5)** | Web flasher (Chrome) / k5prog | Web flasher / k5prog | Web flasher | — | 5.2 |
| **Send/receive APRS (with a map)** | Direwolf + APRSIS32 / YAAC / PinPoint | Direwolf + YAAC / Xastir | Direwolf + YAAC | APRSdroid (+VPTT) | 5.3–5.5 |
| **APRS iGate / digipeater** | Direwolf | Direwolf (headless Pi) | Direwolf | — | 5.3 |
| **Packet TNC (KISS/AGW) for other apps** | Direwolf, UZ7HO Soundmodem | Direwolf, QtSoundModem | Direwolf | — | 5.3, 5.6 |
| **Packet BBS / node / terminal** | Direwolf + QtTermTCP / EasyTerm / BPQ32 | Direwolf + Paracon / QtTermTCP / LinBPQ / Linpac | Direwolf + QtTermTCP | — | 5.7 |
| **Winlink email over VHF/UHF** | Winlink Express + VARA FM / packet | Pat + Direwolf (packet) or VARA FM (Wine) | Pat + Direwolf | — | 5.8 |
| **VARA FM keyboard chat** | VarAC / VARA Chat | VarAC under Wine | — | — | 5.8 |
| **SSTV (send/receive pictures, ISS SSTV)** | MMSSTV | QSSTV | Black Cat SSTV / MultiScan | Robot36 (RX only) | 5.9 |
| **Text/forms for ARES/EmComm (NBEMS)** | fldigi + flmsg + flamp | fldigi + flmsg + flamp | fldigi | — | 5.10 |
| **FT8 / JS8 (non-standard on FM)** | WSJT-X / JS8Call | WSJT-X / JS8Call | WSJT-X / JS8Call | — | 5.11 |
| **AllStarLink node (HT as node radio)** | — | **AllStarLink 3** (Debian / Pi) | — | — | 5.12 |
| **EchoLink link / simplex node / repeater controller** | EchoLink (Sysop mode) | **SvxLink** | — | — | 5.13 |
| **PTT from scripts / generic rig control** | Hamlib (rigctl/rigctld) | Hamlib, aioc-util | Hamlib | — | 5.14 |
| **All-in-one Pi data station (APRS, Winlink, packet, SSTV in a web UI)** | — | **DigiPi** (Raspberry Pi image) | — | — | 5.15 |
| **Winlink / packet from an iPhone or iPad** | — | — | — | iOS: RadioMail, Packet Commander (+VPTT) | 5.16 |
| **Mesh / off-grid networking over packet** | Reticulum via Direwolf KISS | Reticulum (RNS, NomadNet, Sideband) via Direwolf KISS | Reticulum | Sideband | 5.17 |
| **AllStar-style linking on GMRS** | — | GMRSLive (AllStar-based) | — | — | 5.12 |
| **Wire to a mobile/HF rig (audio + PTT + CAT)** | WSJT-X/fldigi + CAT | same | same | — | 5.18 |
| **Fox hunt beacon (no PC)** | AIOC Toolkit or aioc-util (to set it up) | same | same | — | 7.4 |
| **Change AIOC settings (PTT source, VPTT/VCOS, gain)** | **AIOC Toolkit** (Chrome/Edge) | AIOC Toolkit or aioc-util | AIOC Toolkit or aioc-util | — | 7 |
| **Update AIOC firmware** | **AIOC Toolkit** (Flash Firmware tab) | dfu-util or AIOC Toolkit | dfu-util or AIOC Toolkit | — | 9 |
| **Record or monitor RX audio, scanner logging** | Audacity / any recorder | Audacity / arecord / rtl-style tools | Audacity | Any recorder | 2.4 |

---

## 4. PTT Methods (understand this before any recipe)

The AIOC can key the radio (PTT1) in several ways, and they can be combined. **[Official]**

| Method | How software triggers it | Best for | Default? |
|---|---|---|---|
| **CM108 HID GPIO3** | Software that supports "CM108 PTT" (Direwolf, AllStarLink, SvxLink, Hamlib `-P CM108`, QtSoundModem on Linux) | Linux; the most reliable method | ✅ on |
| **Serial `DTR=1 AND RTS=0`** | Software sets DTR high and RTS low on the AIOC COM port | Windows/macOS programs with COM-port PTT | ✅ on |
| **Serial DTR only** (`SERIALDTR`) | Software that raises DTR but also leaves RTS high | Programs that can't keep RTS low | needs aioc-util |
| **Serial RTS only** (`SERIALRTS`) | Software that keys with RTS | Programs that only do RTS PTT | needs aioc-util |
| **Serial NOT-DTR AND RTS** (`SERIALNDTRRTS`) | Reverse logic | Rare | needs aioc-util |
| **Virtual PTT (VPTT)** | **No PTT control needed.** The AIOC keys whenever the software plays audio above a threshold (like a very fast, clean VOX inside the AIOC) | APRSdroid, any app without PTT | needs aioc-util, fw ≥ 1.3.0 |

> **Before firmware 1.2.0**, PTT was "DTR=1" only. That keyed the radio during CHIRP programming. Firmware ≥ 1.2.0
> changed it to DTR=1 AND RTS=0. **[Official]**
>
> **UART lockout:** by default, while PTT1 is active, serial data from the radio is ignored. This lets the
> AIOC work as both a programming cable and a sound card. You can change this in the `SERIAL_CTRL` register. **[Official]**

**Rule of thumb for agents:**
1. If the software offers **CM108 PTT**, use it.
2. Otherwise use the **COM port with "DTR" PTT** and keep RTS off/low.
3. If the radio still doesn't key, see Section 6.

---

## 5. Software Recipes

> In the examples, replace `N0CALL` with the user's callsign. Replace `COM5`, `/dev/ttyACM0`, `/dev/hidraw0`, and
> `plughw:1,0` with the user's actual devices (see Section 2.2).

### 5.1 CHIRP — programming radios (Windows / Linux / macOS)
**[Official]** CHIRP works the same way it does with a normal programming cable. No driver is needed.
1. Install **CHIRP-next** from chirpmyradio.com. Linux: pipx/flatpak; macOS: the .app.
2. Plug the AIOC into the radio and turn the radio on. It must be on a **normal channel/VFO screen** (not in a menu).
3. CHIRP → **Radio → Download from Radio** → select the AIOC port (`COMx`, `/dev/ttyACM0`, or
   `/dev/cu.usbmodem…`) → choose Vendor/Model → OK.
4. Edit the channels → **Radio → Upload to Radio**.

Tips **[Typical]**:
- Always **download first and save a backup `.img`** before uploading.
- Quansheng UV-K5 on **stock firmware**: use the "Quansheng UV-K5" driver. On **Egzumer/other custom firmware**: use the
  matching CHIRP driver module that the firmware author provides (in CHIRP: *Help → Developer mode → File → Load module*),
  or use the driver that comes with newer CHIRP builds if it lists that firmware.
- **[Community] Windows: radio stays transmitting after a CHIRP read.** Early firmware (before 1.2.0) did this because Windows changes
  DTR/RTS when the port closes. Update the AIOC to ≥ 1.2.0. If the red LED stays on, unplug and replug the USB.
- **[Community]** If a read fails once, try again. The first attempt after plugging in sometimes fails, and wiggling the plug fixes it (contact problem).
- If you get "radio did not respond": re-seat the plug, check the radio is on, choose the exact model (e.g. UV-5R vs.
  UV-5R Plus / UV-5RM are different radios), try lower volume, and turn VOX off.
- Baofeng **UV-5RM / UV-5R Mini / UV-17** and similar newer models may need a specific CHIRP model or the vendor's own
  software. The AIOC still works as the cable for them.
- **Vendor programming software** (Baofeng/BTECH/Radtel/TIDRADIO tools) works too: choose the AIOC COM port.
  **RT Systems** software may only work with RT Systems' own cables.

### 5.2 Quansheng UV-K5 firmware flashing
**[Official]** Firmware v1.4.0 doubled the serial buffer, specifically to fix problems flashing firmware on some HTs.
Make sure the AIOC is on v1.4.x before you start.

**[Typical]**
1. Turn the radio off. **Hold PTT while turning it on** to enter bootloader mode (the flashlight LED turns on, the screen stays blank).
2. Use a web flasher in Chrome/Edge (Web Serial). The Egzumer project links to one. You can also use a command-line tool such as `k5prog`/`uvk5` tools.
3. Choose the AIOC serial port, load the `.bin`, and flash.
4. Warn the user: **flashing custom firmware is at their own risk.** They should keep a backup of the stock firmware and calibration (CHIRP/K5 tools can dump calibration).

### 5.3 Direwolf — APRS, packet TNC, iGate, digipeater (Windows / Linux / macOS)
Direwolf is the core "software TNC". Most APRS and packet programs connect to it through **AGW (port 8000)** or **KISS-TCP (port 8001)**.

**Install [Typical]:** Linux `sudo apt install direwolf`. Windows: zip from GitHub releases (wb2osz/direwolf). macOS: `brew install direwolf`.

**Find the audio device:**
- Linux: `arecord -l`, e.g. `card 1: AllInOneCable [All-In-One-Cable], device 0` → `plughw:1,0` (or by name `plughw:CARD=AllInOneCable,DEV=0`; check the exact card ID in `arecord -l`).
- Windows: start Direwolf once. It lists the audio devices with numbers; use the AIOC's number.

**Minimal `direwolf.conf` [Official settings + Typical extras]:**
```conf
# --- Audio ---
ADEVICE plughw:1,0        # Linux  (Windows: ADEVICE 3 3   <- the AIOC input/output numbers Direwolf lists)
ARATE 48000
ACHANNELS 1

# --- Channel 0 ---
CHANNEL 0
MYCALL N0CALL-10
MODEM 1200

# --- PTT: pick ONE ---
PTT CM108                 # Linux: CM108 HID PTT (recommended). Auto-detects; or "PTT CM108 /dev/hidraw0"
#PTT /dev/ttyACM0 DTR -RTS  # Linux serial PTT
#PTT COM5 DTR -RTS          # Windows serial PTT
#PTT /dev/cu.usbmodem1101 DTR -RTS   # macOS serial PTT

# --- Ports for client apps ---
AGWPORT 8000
KISSPORT 8001
```
**[Official]** Direwolf may print **warnings when using CM108 PTT with the AIOC**. They are harmless (see direwolf issue #448).

**Add-ons [Typical]:**
```conf
# Position beacon (every 30 min, path WIDE1-1,WIDE2-1). Use your own lat/long.
PBEACON delay=1 every=30 overlay=S symbol="digi" lat=42^37.14N long=071^20.83W power=5 height=20 gain=3 comment="AIOC + HT" via=WIDE1-1,WIDE2-1

# RX-only iGate (needs internet + APRS-IS passcode)
IGSERVER noam.aprs2.net        # euro.aprs2.net / asia.aprs2.net / aunz.aprs2.net
IGLOGIN N0CALL-10 12345

# Fill-in digipeater (WIDE1-1 only) — only if appropriate locally
DIGIPEAT 0 0 ^WIDE1-1$ ^WIDE1-1$
```
**[Community] Direwolf gotchas reported by AIOC users:**
- `PTT CM108 3 -3`: the trailing `-3` **inverts** the PTT, so the radio stays keyed. Use `PTT CM108` or `PTT CM108 3`.
- If you use CM108 PTT, comment out any old `DCD` line that points at the same device.
- Serial form that works on a Raspberry Pi: `PTT /dev/ttyACM0 DTR -RTS` (the order `-RTS DTR` works too).
- Windows "pre filter size" warnings at 48000 Hz: harmless. You can also try `ARATE 24000`, or Direwolf 1.6 instead of a development build.
- PTT that **stays on** after the first transmission, or a "crashing" AIOC while transmitting, is almost always RF feedback (Section 8).

Start it with: `direwolf -c direwolf.conf` (add `-t 0` to turn off colours in logs).
Test: `direwolf` shows decoded packets with the audio level. Send a beacon and check it on aprs.fi.

**APRS frequencies [Typical]:** 144.390 MHz (North America), 144.800 MHz (Europe/Africa), 145.175 MHz (Australia),
144.640 MHz (China), 144.660 MHz (Japan), 145.825 MHz (ISS digipeater, worldwide). Users must check their local band plan.

### 5.4 APRS client programs (use Direwolf as the modem)
All of these connect to a Direwolf running on the same machine. Direwolf does the audio and PTT.

| Program | OS | Connection setting **[Typical]** |
|---|---|---|
| **YAAC** (Java) | Win/Linux/macOS | *File → Configure → Expert mode → Ports → Add → "AGWPE"*, host `localhost`, port `8000` (or "KISS over TCP" `8001`) |
| **Xastir** | Linux/macOS | *Interface → Interface Control → Add → "Networked AGWPE"*, host `localhost`, port `8000` |
| **APRSIS32** | Windows (runs in Wine) | *Configure → Ports → New Port → type "AGW"*, `127.0.0.1:8000` (or KISS TCP `8001`) |
| **PinPoint APRS** | Windows | TNC type "AGWPE", `127.0.0.1:8000` |
| **UI-View32** (legacy) | Windows | AGWPE mode via Direwolf AGW port |
| **APRS Messenger / others** | Windows | AGW or KISS-TCP to Direwolf |

YAAC also has its own built-in sound-card modem. Direwolf decodes better and handles AIOC PTT more reliably, so it is the recommended choice.

### 5.5 APRSdroid — APRS on Android
**[Official]** The AIOC supports the fixed **22050 Hz** sample rate that APRSdroid needs (the actual rate is 22052 Hz, an error of about 90 ppm, which doesn't matter for APRS).
APRSdroid has **no PTT control**, so for transmitting **turn on Virtual PTT** in the AIOC first (one-time setup on a PC with fw ≥ 1.3.0):
```bash
./aioc-util.py --ptt1 VPTT --store
# keep CM108 + serial PTT working too:
./aioc-util.py --ptt1 "VPTT|CM108GPIO3|SERIALDTRNRTS" --store
```
APRSdroid setup **[Typical]**:
1. Connect the AIOC to the phone with a USB-C OTG cable/adapter.
2. APRSdroid → *Preferences → Connection Protocol: "AFSK"* (audio modem). Set the callsign/SSID and passcode (passcode only needed for APRS-IS).
3. Turn off "high-quality demodulator" if the phone is slow. Keep the phone's media volume moderate.
4. Make sure no other app plays sound (with VPTT on, any sound will key the radio). Turn on Do Not Disturb.

Other Android apps **[Typical]**: **Robot36** (SSTV RX), **DroidSSTV**, and any voice recorder. Apps need to use the USB audio input. Most do automatically once the AIOC is connected.

### 5.6 UZ7HO Soundmodem (Windows) / QtSoundModem (Linux, Windows)
A software modem like Direwolf (AFSK 1200, and others). It provides AGW (8000) and KISS (8100) ports.
**[Typical]**
- *Settings → Devices*: Input device = AIOC microphone, Output device = AIOC speakers.
  **UZ7HO Soundmodem doesn't accept sample rates above 12000. Use 12000**, which the AIOC supports. **[Community]**
- PTT: *PTT Port* = the AIOC COM port. **Tick "Swap COM pins for PTT"**: Soundmodem keys RTS by default, and swapping makes it use DTR, which matches the AIOC. Leave "Dual PTT" unticked. **[Community, GitHub #11]**
  - If it still doesn't key, change the AIOC PTT source to `SERIALDTR` (Section 6), or to `VPTT`.
- QtSoundModem on Linux can also use **CM108 PTT** (choose the hidraw device / CM108 option if your version has it).
- Modem: AFSK AX.25 1200bd for normal VHF packet/APRS.

### 5.7 Packet BBS, nodes and terminals
All of these use a Direwolf (or Soundmodem) TNC through AGW or KISS. **[Typical]**

| Program | OS | Notes |
|---|---|---|
| **QtTermTCP** | Win/Linux/macOS | Setup → AGW: host 127.0.0.1, port 8000. Connect to BBSes/nodes. |
| **Paracon** | Win/Linux/macOS (Python) | AGWPE client, 127.0.0.1:8000. Simple multi-session packet terminal. |
| **EasyTerm / Outpost** | Windows | Outpost (used by EmComm/ARES packet messaging) can use AGWPE or KISS. |
| **BPQ32 / LinBPQ** | Win / Linux | Node + BBS + chat. `PORT` block with `DRIVER=UZ7HO` (AGW to Direwolf/Soundmodem) or KISS over TCP (`TYPE=ASYNC`, `PROTOCOL=KISS`, `IPADDR=127.0.0.1`, `TCPPORT=8001`). |
| **Linux AX.25 stack + Linpac / JNOS** | Linux | `kissattach` to the Direwolf pseudo-terminal (`direwolf -p` creates `/tmp/kisstnc`), or use `tncattach`. |

### 5.8 Winlink email — Winlink Express, Pat, VARA FM, packet
#### 5.8.1 Winlink Express (Windows) with VARA FM
**[Official]** In VARA FM, set **PTT pin to "DTR only"** so that VARA produces the DTR/RTS pattern the AIOC expects.

**[Typical] Setup:**
1. Install **Winlink Express** and **VARA FM** (from the Rosmodem site; the free mode is speed-limited, a paid licence unlocks full speed).
2. Open VARA FM → *Settings → SoundCard*: Device Input = AIOC microphone, Device Output = AIOC speakers.
3. VARA FM → *Settings → PTT*: **COM port** = AIOC COM, **Pin = DTR only**.
4. Choose **Narrow** (VARA FM 1200) for most HTs. Wide (9600) usually won't work through K1 audio (see Limitations).
5. Adjust the RX level so VARA's meter sits in the green. Adjust TX drive (VARA → *Tune*, plus Windows output volume) to the lowest level that gives reliable connections.
6. Winlink Express → *Open Session: "VARA FM Winlink"* → *Settings* → leave host 127.0.0.1, ports 8300/8301 → find a gateway with *Channel Selection* → *Start*.
7. Set the radio's **TOT** to the maximum or turn it off. Use low or medium power to keep the HT cool.

#### 5.8.2 Winlink Express with packet (1200 baud)
**[Typical]** Run Direwolf (5.3) or UZ7HO Soundmodem → Winlink Express → *Open Session: "Packet Winlink"* →
*Settings*: TNC type **KISS**, connection **TCP**, host `127.0.0.1`, port `8001` (Direwolf KISS) / `8100` (UZ7HO).

#### 5.8.3 Pat (Linux, macOS, Windows, Raspberry Pi)
**[Typical]** Pat is a Winlink client in a single program with a web UI.
```bash
pat configure        # set mycall, secure_login_password, locator
```
- **Packet through Direwolf (AGWPE):** in `config.json` set `"ax25": {"engine": "agwpe", ...}` and `"agwpe": {"addr": "localhost:8000"}`.
  Connect: `pat connect ax25:///GATEWAYCALL-10` (or use the web UI: `pat http`, then open http://localhost:8080).
- **Linux kernel AX.25 instead:** `kissattach` the Direwolf PTY, then `"engine": "linux"` with `"port": "wl2k"`.
- **VARA FM:** run VARA FM under Wine (with the AIOC as the sound card and COM PTT "DTR only"), then in Pat set
  `"varafm": {"addr": "localhost:8300"}` and connect with `pat connect varafm:///GATEWAYCALL`.

#### 5.8.4 VarAC / VARA Chat (keyboard chat over VARA)
**[Typical]** Install VARA FM first and set it up as in 5.8.1. In VarAC (or VARA Chat), choose **VARA FM** as the modem.
VarAC connects to VARA's TCP ports. PTT stays inside VARA (DTR only). VarAC can also do its own PTT/CAT, but leave that **off** so VARA does the keying.

### 5.9 SSTV — slow-scan TV pictures
**[Typical]**
| Program | OS | Audio | PTT |
|---|---|---|---|
| **MMSSTV** | Windows | *Option → Setup → Misc → Sound card*: AIOC in/out | *Setup → TX → PTT port*: AIOC COM. If it doesn't key, change the AIOC to `SERIALDTR`/`SERIALRTS` or `VPTT` (Section 6). |
| **QSSTV** | Linux | *Options → Configuration → Sound*: ALSA/PulseAudio AIOC | *CAT* tab: Hamlib "Dummy" with PTT via serial **DTR** on `/dev/ttyACM0`, or Hamlib CM108 if offered; otherwise VPTT. |
| **Black Cat SSTV / MultiScan 3B** | macOS | Choose AIOC in/out | Use AIOC VPTT (simplest) |
| **Robot36** | Android | USB audio | RX only |

Tips: RX-only use (for example **ISS SSTV events on 145.800 MHz FM**) needs no PTT setup at all. Turn squelch **off**
or set it low for weak satellite signals. Watch for HT overheating on long transmissions, and set TOT ≥ 3 minutes.

### 5.10 fldigi / flmsg / flamp — NBEMS EmComm text and forms over FM
**[Typical]**
1. *Configure → Sound card → Audio → Devices*: PortAudio (or PulseAudio) → Capture **and** Playback = AIOC. Sample rate: Native/48000.
2. PTT, choose one:
   - *Configure → Rig Control → **CM108 / C-Media PTT*** (newer fldigi versions): choose the AIOC HID, **GPIO 3**.
   - *Configure → Rig Control → **GPIO / Hardware PTT***: "Use separate serial port PTT", device = AIOC COM/ttyACM, check **Use DTR** (DTR = +V), leave **RTS unchecked**. Click *Initialize*.
     If it doesn't key: set the AIOC source to `SERIALDTR` (Section 6).
   - Or use Hamlib with `ptt_type=CM108`.
3. Common FM modes: **MT63-2000L** (the usual ARES/NBEMS FM mode), **8PSK**, **Olivia**. Use the waterfall to centre the signal at about 1500 Hz.
4. **flmsg** (ICS-213 and other forms) and **flamp** (multicast files) work through fldigi. Set their "fldigi" connection to the defaults (XML-RPC 127.0.0.1:7362).

### 5.11 WSJT-X / JS8Call (FT8, FT4, JS8 — non-standard on FM)
**[Typical]** These are normally SSB modes. On an FM HT they work only between stations that also use FM
(for example local 2 m FM experiments). Setup:
- *Settings → Radio*: Rig **None**. **PTT Method: DTR**. Port: the AIOC COM/ttyACM.
  (If it doesn't key, use `SERIALDTR` on the AIOC, or choose PTT "VOX" with AIOC VPTT turned on.)
- *Settings → Audio*: Input/Output = AIOC, mono.
- Keep TX audio low (a clean single tone). FM capture effect works against weak signals.

### 5.12 AllStarLink 3 (ASL3) — HT as an AllStar node radio
**[Official + Tool docs]** The AIOC emulates a CM108, so ASL3 can drive PTT and read COS from it directly.
ASL3 recognises the AIOC's own USB ID `1209:7388`. You only need to **uncomment it** in `res_usbradio.conf`.

**Steps:**
1. Install ASL3 (Debian 12 / Raspberry Pi OS image from allstarlink.org). Set up your node number and password with `asl-menu`.
2. Install the AIOC udev rule (Section 2.5) so Asterisk can open the HID.
3. Allow the AIOC USB ID:
   ```ini
   ; /etc/asterisk/res_usbradio.conf
   [general]
   usb_devices = 1209:7388    ; AIOC (all in one cable)
   ```
   *(Alternative: change the AIOC to look like a C-Media CM108 with `./aioc-util.py --set-usb 0x0d8c 0x000c --store`. You then need `--open-usb 0x0d8c 0x000c` to configure it later.)*
4. Set the Virtual COS (squelch detection from RX audio) hang time. **The timing registers count in 1/16 ms: value = milliseconds × 16**
   (confirmed from the firmware defaults and G1LRO's script, where 1500 ms = `0x5DC0`). **[Official + Community]**
   ```bash
   ./aioc-util.py --vcos-timctrl 24000 --store      # 1500 ms hang time (G1LRO's recommendation)
   ```
   *(The aioc-util README example `--vcos-timctrl 1500` sets about 94 ms.)* If speech drops out between words, raise it.
   If the COS opens on noise, raise the threshold (`--vcos-lvlctrl`, default 256). G1LRO suggests a threshold of about 1500 for noisy radios.
   Make sure the radio's **squelch is closed** when the channel is idle. VCOS opens on audio level.
   **Better: hardware COS.** Rev 1.2 or G1LRO dual-COS boards can read the radio's real squelch: `./aioc-util.py --enable-hwcos --store`.
   **The easy way [Community]:** G1LRO's script does steps 3–6 for you (it edits `res_usbradio.conf`, `simpleusb.conf` and `rpt.conf`, and backs them up first):
   ```bash
   wget -O customize.sh https://raw.githubusercontent.com/G1LRO/AIOC-ASL3-Config/main/customize.sh
   sudo bash customize.sh
   ```
5. In `asl-menu` **[Official example]**:
   - Device type: `usbradio` (menu 2 > A1 > N4 > I2) (or `simpleusb`, which also works well for HT nodes)
   - Duplex type: `1` (menu 2 > A1 > N5)
6. Edit `usbradio.conf` (menu 6 > H). The official example is for a Puxing PX-888; it suits most HTs as a starting point:
   ```ini
   rxboost = 0
   rxsqhyst = 500
   carrierfrom = usbinvert
   ctcssfrom = no
   rxdemod = speaker
   txprelim = no
   invertptt = no
   ```
   (For `simpleusb.conf`, the equivalents are `carrierfrom = usbinvert`, `ctcssfrom = no`.)
   **[Community] `simpleusb-tune-menu` settings from G1LRO:** I = PTT mode (`active LOW` in his older guide), J = COS from `usbinvert`
   (VCOS) or `usb` (active high; his newer guide uses this with hardware COS), L = CTCSS from `no`.
   **COS stuck open:** swap `usb` and `usbinvert`, or raise the VCOS threshold. **COS never opens:** swap them, or lower the threshold.
7. Run `radio-tune-menu` (usbradio) or `simpleusb-tune-menu` (simpleusb) to set RX and TX levels: **V** checks COS, **e** runs an echo test,
   **2/3** set the levels, **W** writes. Then restart Asterisk: `sudo systemctl restart asterisk`.
8. Test with the parrot node (**Hubnet Parrot 40894**) or connect to a hub. Use **low power** and a separate antenna setup: RF getting into the USB cable is the most common problem (Section 8).

**Fixes reported on the AllStarLink forum [Community]:**
| Symptom | Fix |
|---|---|
| `asl-menu` says it can't find the audio device | Uncomment `usb_devices = 1209:7388` in `res_usbradio.conf` (M0AWS lost a day on this) |
| COS works but **no RX audio** | `ctcssfrom` was set: change it to `ctcssfrom = no` |
| Node keys over and over | Make sure `duplex = 1` in `rpt.conf` |
| PTT stuck on while the node transmits | RF feedback: use 1 W instead of 5 W, a short USB cable, clip-on ferrites, and the antenna away from the Pi |
| Tail of about 3 s or keying by itself | Check the VCOS hang time and threshold; set the radio's squelch higher |
| Full-duplex repeater | Two AIOCs and two radios (one RX, one TX) have been shown working (F1FQN video) |

**HamVOIP / GMRSLive** (older AllStar-based systems) only recognise C-Media IDs. Use the `--set-usb 0x0d8c 0x000c` option above
(G1LRO's `aioc.py` / `aioc-revert.py` scripts do the same). On GMRS, follow your local GMRS rules. GMRS is not amateur radio.

### 5.13 SvxLink (Linux) and EchoLink (Windows)
#### SvxLink — simplex node, repeater controller, EchoLink link
**[Typical]** Use the AIOC HID for both PTT and squelch:
```ini
# /etc/svxlink/svxlink.conf
[Rx1]
TYPE=Local
AUDIO_DEV=alsa:plughw:1
AUDIO_CHANNEL=0
SQL_DET=HIDRAW
HID_DEVICE=/dev/hidraw0
HID_SQL_PIN=VOL_DN          # AIOC VCOS is on CM108 "Volume Down"; use !VOL_DN if logic is inverted
# Alternative: SQL_DET=VOX (VOX_FILTER_DEPTH / VOX_THRESH) or CTCSS

[Tx1]
TYPE=Local
AUDIO_DEV=alsa:plughw:1
AUDIO_CHANNEL=0
PTT_TYPE=Hidraw
HID_DEVICE=/dev/hidraw0
HID_PTT_PIN=GPIO3
# Alternative serial PTT: PTT_TYPE=SerialPin, PTT_PORT=/dev/aioc, PTT_PIN=DTR!RTS
```
For EchoLink, turn on `ModuleEchoLink` and set the callsign/password in `ModuleEchoLink.conf`. Forward **UDP 5198–5199** and **TCP 5200** on the router.

#### EchoLink (Windows, Sysop mode)
**[Typical]**
- *Tools → Sysop Settings → RX Ctrl*: **VOX** (adjust the threshold), or COS via serial isn't available with the AIOC. VOX is the standard choice.
- *TX Ctrl*: **Serial** keying on the AIOC COM port. EchoLink may assert RTS (or both lines). Set the AIOC PTT source to match (`SERIALRTS` or `SERIALDTR`), or simply use **VPTT** (Section 6).
- *Audio*: input/output = AIOC. Needs a validated EchoLink account and UDP 5198–5199 forwarded.

### 5.14 Hamlib / scripts / generic PTT
**[Typical]**
```bash
# CM108 PTT via HID (Linux)
rigctl -m 1 -p /dev/hidraw0 -P CM108 T 1     # key
rigctl -m 1 -p /dev/hidraw0 -P CM108 T 0     # unkey

# Serial DTR PTT, forcing RTS low
rigctl -m 1 -p /dev/ttyACM0 -P DTR -C rts_state=OFF T 1

# rigctld for programs that speak to Hamlib over network (port 4532)
rigctld -m 1 -p /dev/hidraw0 -P CM108
```
**aioc-util** can also key directly (fw ≥ 1.3) **[Tool docs]**:
```bash
./aioc-util.py --set-ptt1-state on
./aioc-util.py --set-ptt1-state off
```
Python with pyserial (default AIOC logic):
```python
import serial, time
s = serial.Serial('/dev/ttyACM0')   # or 'COM5'
s.rts = False; s.dtr = True         # PTT ON  (DTR=1, RTS=0)
time.sleep(2)
s.dtr = False                       # PTT OFF
```

### 5.15 DigiPi (Raspberry Pi all-in-one data station)
**[Community]** DigiPi is a ready-made Raspberry Pi image with a web UI for APRS, digipeater/iGate, packet node, Winlink (Pat), SSTV and more.
Older DigiPi versions don't support the AIOC directly. Users got it working by editing **every** Direwolf config
(`direwolf.tnc.conf`, `direwolf.digipeater.conf`, `direwolf.node.conf`, `direwolf.winlink.conf`, `direwolf.tracker.conf`, `direwolf.tnc300b.conf`):
```conf
ADEVICE plughw:0,0 plughw:0,0     # or the AIOC's card number from arecord -l
PTT CM108                         # or: PTT /dev/ttyACM0 DTR -RTS   (do NOT add a trailing -3; it inverts PTT)
# comment out any old DCD line
```
Then `sudo remount`, edit the files, run `sudo ./saveconfigs.sh`, and `sudo reboot`. Put ferrites on **both ends** of the USB cable.
Check whether newer DigiPi releases support the AIOC natively before you edit anything.

### 5.16 iPhone / iPad (RadioMail, Packet Commander)
**[Community, Dec 2025]** iOS apps can only use the AIOC as a **USB sound card** (Apple doesn't let apps reach USB serial or HID).
The **RadioMail** (Winlink) and **Packet Commander** apps have built-in packet modems that work with the AIOC when you turn on **Virtual PTT**:
```bash
./aioc-util.py --ptt1 "VPTT|CM108GPIO3|SERIALDTRNRTS" --store     # needs AIOC fw 1.4.1 (aioc-util failed on older fw)
```
Use a USB-C iPhone/iPad, or Apple's Lightning-to-USB camera adapter. Mute all other sounds on the device, because any sound will key the radio.

### 5.17 Reticulum (RNS, NomadNet, Sideband, MeshChat) over packet
**[Typical]** Reticulum can use a KISS TNC. Run Direwolf (5.3) and add a TCP KISS interface to `~/.reticulum/config`:
```ini
[[Direwolf AIOC]]
  type = TCPClientInterface
  interface_enabled = True
  kiss_framing = True
  target_host = 127.0.0.1
  target_port = 8001
```
(Or point a `KISSInterface` at a Direwolf pseudo-terminal created with `direwolf -p`.) 1200 baud is slow but enough for messages.
**[Community]** One user reported trouble linking Reticulum to Direwolf over TCP. If it misbehaves, try the PTY/`KISSInterface` route.
Follow your country's amateur rules: no encryption is a common licence condition. Check how Reticulum is configured before transmitting.

### 5.18 Mobile / HF radios (wiring the AIOC to a data or mic port)
**[Community]** The AIOC is just a USB sound card, serial port and PTT on a small board, so builders wire it to other radios:
- Take the signals from the pads, or from a K1 socket on a pigtail: audio out to the radio, audio in from the radio, PTT, UART TX/RX and ground (see the pinout in the AIOC README).
- **Yaesu FT-817ND / FT-857D / FT-7800R:** working audio, PTT and **CAT** have been shown using cheap CT-39A (data) and CT-62 (CAT) cables (GitHub #137). If CAT doesn't respond, **swap RX and TX**.
- On **hardware rev 1.0/1.1**, the UART and PTT share one contact, so CAT data can key PTT. Use rev 1.2 and cut the split pad, or leave PTT disconnected and key with CAT.
- For line-level data ports on rev 1.2: `--audio-tx-boost on` and raise `--audio-rx-gain`.
- Icom CI-V (single-wire bus) does **not** work without extra circuitry (GitHub #109, unresolved).
- Prefer a ready-made interface for your rig if you aren't comfortable with soldering. Wrong wiring can damage the radio or the AIOC.

---

## 6. PTT Troubleshooting Flow

```
Radio does not transmit when the software "keys"?
│
├─ 1. Is the plug fully seated? Is the radio on, VOX off, not locked, not on a TX-inhibited channel?
│      Quick hardware test: AIOC Toolkit → Configure → Manual PTT State → PTT 1 ON.
│      If the radio keys here, the cable is fine and the problem is the software's PTT setting.
│
├─ 2. Does the software support CM108 PTT? → use it (Linux: check /dev/hidraw permissions, Section 2.5)
│
├─ 3. Using COM-port PTT:
│     ├─ Software set to "DTR" (RTS off)? → should work with defaults.
│     ├─ Software sets BOTH DTR and RTS, or RTS stays high (common on Linux, where opening a port raises both)
│     │      → aioc-util --ptt1 "CM108GPIO3|SERIALDTR" --store
│     ├─ Software only keys RTS
│     │      → aioc-util --ptt1 "CM108GPIO3|SERIALRTS" --store
│     └─ VARA FM → set "Pin: DTR only"
│
├─ 4. Software has no PTT at all (APRSdroid, some Mac apps)
│      → aioc-util --ptt1 "VPTT|CM108GPIO3|SERIALDTRNRTS" --store
│
└─ 5. Radio keys but stays keyed / keys during CHIRP programming
       → you changed PTT to SERIALDTR/SERIALRTS: put it back to defaults for programming:
         aioc-util --defaults --store
       → check the TX audio isn't triggering VPTT (system sounds, a VPTT threshold that's too low)
```

> ⚠️ **Note for agents:** after setting PTT to plain `SERIALDTR` or `SERIALRTS`, **CHIRP programming may key the radio**,
> because CHIRP toggles those lines. Tell the user to switch back with `--defaults --store` before programming,
> or to keep a second AIOC for programming.

---

## 7. Configuring the AIOC Itself (AIOC Toolkit / aioc-util)

Every `aioc-util` command in this guide has a matching control in the browser-based **AIOC Toolkit** (https://g1lro.github.io/aioc-toolkit/). For example, `--ptt1 VPTT` is **PTT Sources → Auto PTT1 (VPTT)**, and `--store` is **Store to Flash**. Point customers who don't use the command line to the Toolkit. **[Tool docs]**

### 7.1 Requirements **[Tool docs]**
- AIOC **firmware ≥ 1.3.0** (tested with 1.3 and 1.4.1; 1.2 does **not** work).
- **Command line:** `aioc-util` by Hrafnkell Eiríksson TF3HR — https://github.com/hrafnkelle/aioc-util
- **Browser tools (no install; Chrome or Edge 89+ on a desktop; on Linux the udev rule from 2.5 must be installed):**
  - **AIOC Toolkit by G1LRO: https://g1lro.github.io/aioc-toolkit/ (recommended).** **[Tool docs]** It does both settings and firmware flashing, built on aioc-util and webdfu (source: https://github.com/G1LRO/aioc-toolkit).
    - **Configure** tab: **Connect (WebHID)** finds the AIOC even when its USB ID has been changed (checks the "AIOC" magic register). It shows:
      - live **GPIO Status** (PTT1/PTT2 out, Vol+, Vol−/VCOS, mute buttons)
      - **Manual PTT State** on/off, to test keying without other software
      - **PTT Sources** (with **Swap PTT1/PTT2** and **Auto PTT1 (VPTT)**)
      - **CM108 Button Sources**
      - **COS Mode** (Virtual or Hardware COS)
      - **Audio Settings** (RX gain 1–16×, TX boost)
      - **AutoPTT & VCOS Thresholds** (level and timing; timing is ms × 16)
      - **Foxhunt (CW Beacon)**
      - **USB VID / PID Override**: **Fill CM108 IDs** = `0x0D8C`/`0x000C` for AllStar/HamVOIP
      - **Device Actions**: **Store to Flash**, **Recall from Flash**, **Load Defaults**, **Reboot Device**
      - **Raw Register Dump**
    - **Flash Firmware** tab: covered in 9.2.
    - Always press **Apply**, then **Store to Flash**, or changes are lost when the AIOC is unplugged. A USB ID change only takes effect after **Store** and then **Reboot**.
  - Older single-purpose pages: https://aioc-util.tf3hr.net/ (TF3HR) and https://g1lro.github.io/aioc-util/ (G1LRO). **[Community]**
  - **Recommend the Toolkit to non-technical customers**: no Python, no hidapi.dll, no Zadig.

**Install (Linux/macOS):**
```bash
git clone https://github.com/hrafnkelle/aioc-util.git
cd aioc-util
python3 -m venv venv && source venv/bin/activate
pip install hid
# Linux: sudo cp udev/rules.d/91-aioc.rules /etc/udev/rules.d/ && sudo udevadm control --reload && sudo udevadm trigger
# Debian/Pi may need: sudo apt install libhidapi-hidraw0 libhidapi-libusb0
```
**Windows:** same venv steps in PowerShell (`.\venv\Scripts\activate`). Download `hidapi.dll` from the libusb/hidapi releases and put it next to `aioc-util.py`. Run with `python aioc-util.py …`.

### 7.2 Common commands **[Tool docs]**
| Task | Command |
|---|---|
| Show all registers | `./aioc-util.py --dump` |
| Factory defaults (and save) | `./aioc-util.py --defaults --store` |
| List PTT sources | `./aioc-util.py --list-ptt-sources` |
| Set PTT1 source | `./aioc-util.py --ptt1 "CM108GPIO3|SERIALDTR" --store` |
| Virtual PTT on PTT1 | `./aioc-util.py --ptt1 VPTT --store` (or `--auto-ptt1`) |
| Swap PTT1/PTT2 (dual-PTT radios) | `./aioc-util.py --swap-ptt --store` |
| VPTT/VCOS threshold and tail | `./aioc-util.py --vptt-lvlctrl 0x80 --vptt-timctrl 320 --vcos-lvlctrl 0xff --vcos-timctrl 24000 --store` (timing = ms × 16: 320 = 20 ms, 24000 = 1.5 s) |
| RX gain (HW rev ≥ 1.2, fw ≥ 1.4) | `./aioc-util.py --audio-rx-gain 4x --store` (1x/2x/4x/8x/16x) |
| TX boost for line-level (HW rev ≥ 1.2) | `./aioc-util.py --audio-tx-boost on --store` |
| Show audio settings | `./aioc-util.py --audio-get-settings` |
| Hardware COS input (HW rev ≥ 1.2) | `./aioc-util.py --enable-hwcos --store` (back to VCOS: `--enable-vcos`) |
| Pretend to be a CM108 (HamVOIP etc.) | `./aioc-util.py --set-usb 0x0d8c 0x000c --store` |
| Configure after changing USB ID | `./aioc-util.py --open-usb 0x0d8c 0x000c --dump` |
| Several AIOCs | `--list-devices`, then `--open-serialnum <SN> …` |
| Reboot | `./aioc-util.py --reboot` |

> Without `--store`, changes are lost at the next power cycle. **Flashing firmware erases all stored settings.** **[Official]**

### 7.3 Register reference (for advanced users and agents) **[Official — firmware settings.h]**
| Reg | Name | Purpose | Default |
|---|---|---|---|
| 0x00 | MAGIC | Reads "AIOC" | — |
| 0x08 | USBID | VID (low 16 bits) / PID (high 16 bits) | `1209:7388` |
| 0x24 | AIOC_IOMUX0 | PTT1 source bitmask | CM108GPIO3 \| SERIALDTRNRTS |
| 0x25 | AIOC_IOMUX1 | PTT2 source bitmask | CM108GPIO4 |
| 0x44–0x47 | CM108_IOMUX0–3 | CM108 buttons VolUp / VolDn / PlayMute / RecMute source | VolUp = IN2, **VolDn = VCOS**, others none |
| 0x60 | SERIAL_CTRL | UART lockout while PTT active | lockout on PTT1 |
| 0x72 | AUDIO_RX | RX gain 1×–16× | 1× |
| 0x78 | AUDIO_TX | TX boost | off |
| 0x82 / 0x84 | VPTT_LVLCTRL / TIMCTRL | Virtual PTT threshold / tail time (ms × 16) | 16 / 0x140 (= 20 ms) |
| 0x92 / 0x94 | VCOS_LVLCTRL / TIMCTRL | Virtual COS threshold / tail time (ms × 16) | 256 / 0xC80 (= 200 ms) |
| 0xA0–0xA5 | FOXHUNT_CTRL, MSG0–3 | Fox-hunt interval, WPM, volume, 16-char message | disabled |

PTT source bits: `CM108GPIO1=0x1, GPIO2=0x2, GPIO3=0x4, GPIO4=0x8, SERIALDTR=0x100, SERIALRTS=0x200, SERIALDTRNRTS=0x400, SERIALNDTRRTS=0x800, VPTT=0x1000`.
Button sources: `IN1=0x10000, IN2=0x20000, VCOS=0x1000000`.
Commands: `WRITESTROBE=0x01, DEFAULTS=0x10, REBOOT=0x20, RECALL=0x40, STORE=0x80`.
Register access uses HID feature reports with the layout `<BBBL>`: (report 0, command, address, value).

### 7.4 Fox-hunt beacon mode (fw ≥ 1.4.0) **[Official + Tool docs]**
The AIOC can send a Morse ID on its own, with only USB power (for example from a power bank). No computer is needed once it's configured.
```bash
./aioc-util.py --foxhunt-message "DE N0CALL FOX" --foxhunt-wpm 20 --foxhunt-interval 60 --foxhunt-volume 32000 --store
./aioc-util.py --foxhunt-get-settings --foxhunt-get-message   # check
./aioc-util.py --foxhunt-interval 0 --store                   # disable
```
Message up to 16 characters · interval 0–255 s (0 = off) · WPM 0–255 · volume 0–65535.
Users must follow local rules for unattended beacons and station identification.

---

## 8. Known Issues and Fixes

| Symptom | Cause | Fix |
|---|---|---|
| USB disconnects, garbled audio, PC "beeps" or freezes **only while transmitting** | **RF feedback.** With a stock (monopole) antenna, the USB cable becomes the radio's counterpoise ("tiger tail"). **[Official]** | Lower TX power. Add a **counterpoise/tiger-tail**. Use an **external or balanced antenna** (e.g. a dipole) away from the PC. Put **clip-on ferrites** on the USB cable. Use a short USB cable. **[Community]** Going from 5 W to **1 W** fixed it for several users. Others moved the AIOC onto a short **pigtail** away from the radio, or used a coax extension so the antenna sits 1 m or more away. |
| Radio doesn't key | PTT method mismatch | Section 6 |
| Radio stays keyed / keys at random | Linux ModemManager probing the port; PTT source set to DTR/RTS only; system sounds with VPTT | udev ignore rule (2.5); `--defaults --store`; don't make the AIOC the default audio device |
| CHIRP: "Radio did not respond" | Wrong model, plug not seated, radio in a menu, old firmware | Re-seat, choose the exact model, update the AIOC to ≥ 1.2.0 (for the DTR&!RTS fix) |
| Intermittent RX/TX audio, PTT works sometimes | TRS plug contact / solder joint (on DIY units), or plug not fully inserted | Re-seat. On DIY builds, re-flow the TRS tab joints while pressing the contact sideways **[Official]** |
| Decodes fail, audio sounds distorted | TX level too high (over-deviation) or RX clipping | Lower the OS output volume; lower the radio volume; RX gain back to 1× |
| Can't hear anything in software | Squelch closed / volume zero / wrong input device | Open squelch, raise the radio volume, choose the AIOC input in the software |
| Stuttering TX audio on macOS | Old firmware | Update to ≥ v1.4.0 (macOS fix) **[Official]** |
| UV-K5 firmware flash fails partway | Serial buffer limits in old firmware | Update the AIOC to ≥ v1.4.0 **[Official]** |
| Direwolf CM108 warnings | Upstream Direwolf behaviour | Harmless; ignore (direwolf issue #448) **[Official]** |
| Linux "permission denied" on /dev/ttyACM0 or /dev/hidraw | User not in dialout/plugdev; no udev rule | Section 2.5 |
| aioc-util "Unexpected magic" / can't open | fw < 1.3, USB ID was changed, or Windows missing hidapi.dll | Update firmware; use `--open-usb`; add hidapi.dll; or use the AIOC Toolkit in the browser (7.1), which finds AIOCs with changed USB IDs |
| aioc-util `module 'hid' has no attribute 'Device'` / `No module named 'hid'` | Wrong Python package (Debian's `python3-hid`/`hidapi`) | Use a venv and `pip install hid`; remove the apt package **[Community]** |
| **Rev 1.0 board hangs with PTT stuck on after updating to 1.4.x**, or audio "Code 10" in a Windows VM | Firmware bug on old hardware (GitHub #120/#138) | Flash **v1.3.0** **[Community]** |
| Android: audio app freezes, volume keys stop working, AIOC keeps reconnecting | Seen on **Android 11** phones; Android 12+ was fine (GitHub #121) | Try another phone or Android version **[Community]** |
| APRSdroid ignores the AIOC (works in other apps) | APRSdroid bug with USB microphones on some phones (aprsdroid #149) | Try the "Lesser AudioSwitch" app to force USB audio routing **[Community]** |
| S-meter noise floor rises when the AIOC is plugged in | Ground loop / PC noise on the USB cable | Antenna on coax at least 1 m away from the HT, clip-on ferrites, a **USB isolator**, or run from a laptop on battery **[Community]** |
| HF rig hears S9 noise with the AIOC plugged in | PC/USB noise; some radios (e.g. RT-950 Pro) are very sensitive | Ferrites, a USB isolator, a different PC; test with another radio **[Community]** |
| Device not seen at all | **Charge-only USB-C cable**, or the board is stuck in DFU mode (no firmware) | Use a data cable; flash firmware (Section 9) **[Community]** |

**[Community] Contact/solder fault finder for DIY or repaired units (DL-Nordwest):**
| Symptom | Check |
|---|---|
| Can't read or write the radio | Driver / COM port selection |
| Can write but **can't read** the radio | Solder joint at the 2.5 mm **ring** |
| RX audio very quiet | Solder joint at the 3.5 mm **ring**; PC volume |
| No RX audio at all | 2.5 mm **tip** / **sleeve** joints; radio volume; input device |
| Radio transmits all the time | Short between the 2.5 mm and 3.5 mm **sleeves** (or the plugs were soldered the wrong way round) |
| Works only when the plug is twisted | Cracked TRS solder joint: re-flow it while pressing the contact (Section 8) |

---

## 9. Firmware Update

### 9.1 Releases **[Official]**
Download `aioc-fw-x.y.z.bin` from https://github.com/skuep/AIOC/releases
| Version | Date | Highlights |
|---|---|---|
| **v1.4.1** | 2025-09-27 | Fixes LED blink speed and LED interrupt priority |
| **v1.4.0** | 2025-09-26 | macOS TX stutter fix; bigger serial buffer (HT firmware flashing); HW rev 1.2 support; RX gain 1–16×; TX boost; **Fox-hunt mode** |
| v1.3.0 | 2025-01-02 | HID config system (new protocol; older scripts don't work); Virtual PTT / Virtual COS; hardware COS input; bigger serial buffer |
| v1.2.0 | 2023-03-19 | **CM108 PTT**; live DFU updates; serial PTT changed to DTR=1 & RTS=0 |

**Hardware rev 1.2 needs firmware ≥ 1.4.0.** **[Official]**

### 9.2 Updating firmware that is already ≥ 1.2.0 (no case opening) **[Official]**
```bash
dfu-util -d 1209:7388 -a 0 -s 0x08000000:leave -D aioc-fw-1.4.1.bin
```
The AIOC reboots into the bootloader, flashes, and restarts on its own.
- **Linux/macOS:** install `dfu-util` (`apt install dfu-util` / `brew install dfu-util`). You may need `sudo` or the `plugdev` group.
- **Windows:** dfu-util needs a **libusb/WinUSB driver** for the DFU interface. Use **Zadig** to install WinUSB for the AIOC DFU interface / "STM32 BOOTLOADER" device. (See the guide linked in the AIOC README: yeswolf.github.io/dfu.)
  **[Community]** dfu-util on Windows 11 often hangs or reports `LIBUSB_ERROR_NOT_SUPPORTED` (GitHub #28). Easiest fixes: use the AIOC Toolkit in the browser (below), or a Linux PC or Raspberry Pi.
- **Browser flashing with the AIOC Toolkit (easiest, especially on Windows)** **[Tool docs]**:
  1. Download the `.bin` from the **Latest Firmware** box (**Download Firmware** link) on https://g1lro.github.io/aioc-toolkit/ → **Flash Firmware** tab. Browsers can't fetch GitHub release files directly, so you save the file and then select it.
  2. **Put the AIOC in bootloader mode first** (9.3, step 1: short the two outer header pins, then plug in). The Toolkit doesn't switch modes itself and blocks flashing while the AIOC is in normal "DFU runtime" mode. In bootloader mode it shows up as `0483:df11`.
  3. Connect, check **Device Status**, choose the file, start **Flash Firmware** and watch the **Log**. Remove the short and replug when it's done.
  Flash only official `aioc-fw-x.y.z.bin` files. A failed flash can be recovered by repeating these steps.
- **Alternative browser flasher (plain WebDFU) [Community, used in G1LRO's guide]:** with the AIOC in bootloader mode, open
  https://devanlai.github.io/webdfu/dfu-util/ → **Connect** → choose **STM32 Bootloader** → **Internal Flash** → pick the `.bin` → **Download**.

### 9.3 First programming / unbricking **[Official]**
1. **Short the two outermost pins** of the programming header on the PCB (this is BOOT mode).
2. Connect USB-C. The device shows up as the STM32 bootloader.
3. `dfu-util -a 0 -s 0x08000000:leave -D aioc-fw-x.y.z.bin`
4. Remove the short, unplug, and plug back in.

After any update: **re-apply your aioc-util settings** (they are erased).

### 9.4 Which firmware do I have?
The USB descriptor doesn't report the firmware version. Practical checks:
- aioc-util or the AIOC Toolkit can connect → ≥ 1.3.0. Audio settings / fox-hunt can be read → ≥ 1.4.0.
- If unsure, just flash the latest release (9.2). That is the recommended fix for most issues.

---

## 10. Ready-Made Answers (FAQ for agents)

**Q: Do I need drivers?**
No. Windows 10/11, Linux, and macOS use their built-in USB audio and CDC serial drivers. Only firmware updates on Windows need a WinUSB driver (Zadig).

**Q: Which COM port is it?**
Unplug the AIOC and plug it back in while watching Device Manager → Ports. The new COMx is the AIOC. Linux: `/dev/ttyACM0` (or `/dev/aioc` with the udev rule). macOS: `/dev/cu.usbmodem…`.

**Q: Can I program and do digital modes with the same cable?**
Yes. The serial port does programming and the sound card does digital modes. Don't run both programs at the same time on the same COM port.

**Q: Can I use it with a mobile/base radio?**
Only if the radio has a K1-type jack or you use an adapter cable to its data/mic port. On HW rev 1.2, turn on `--audio-tx-boost on` for line-level inputs and raise the RX gain for line-level outputs.

**Q: Does it work on Raspberry Pi?**
Yes. Direwolf, AllStarLink 3, SvxLink, Pat, QtSoundModem and LinBPQ all run on Raspberry Pi OS. Use the CM108 PTT and the udev rule.

**Q: Does it work with iPhone/iPad?**
Partly. iOS sees the AIOC only as a sound card. **RadioMail** (Winlink) and **Packet Commander** have shown it working with AIOC fw 1.4.1 and **Virtual PTT** turned on (Section 5.16). CHIRP programming and serial or CM108 PTT are not possible on iOS.

**Q: Can I use voice (talk through the computer)?**
Yes. Choose the AIOC as microphone/speaker in a VoIP or linking app (AllStarLink, SvxLink, EchoLink, Mumble bridges). Voice PTT needs CM108/serial control or VPTT.

**Q: My radio has two PTTs (dual-band HT)?**
PTT1 is the CM108 GPIO3/serial default and PTT2 is CM108 GPIO4. Use `--swap-ptt` or `--ptt2` to change them.

**Q: Is 9600 baud packet supported?**
Not through the K1 jack (the audio is filtered). Use 1200 baud AFSK or VARA FM Narrow.

---

## 11. Reference Links
- AIOC project (hardware, firmware, README): https://github.com/skuep/AIOC
- AIOC releases: https://github.com/skuep/AIOC/releases
- AIOC Discord: linked from the GitHub README
- aioc-util (CLI): https://github.com/hrafnkelle/aioc-util · Web version: https://aioc-util.tf3hr.net/
- G1LRO AIOC + ASL3 guide (current): https://g1lro.uk/?p=1593 · older guide: https://g1lro.uk/?p=676 · scripts: https://github.com/G1LRO/AIOC-ASL3-Config
- **AIOC Toolkit (configure + flash in the browser):** https://g1lro.github.io/aioc-toolkit/ · source: https://github.com/G1LRO/aioc-toolkit
- Older browser tools: G1LRO config https://g1lro.github.io/aioc-util/ · WebDFU flasher https://devanlai.github.io/webdfu/dfu-util/
- AllStarLink forum, AIOC as a CM108 alternative: https://community.allstarlink.org/t/aioc-now-working-well-as-an-alternative-to-cm108-to-make-a-node-without-soldering/21225
- M0AWS AllStar node build with an AIOC: https://m0aws.co.uk/?cat=408
- DL-Nordwest AIOC series (German), part 4 troubleshooting: https://dl-nordwest.com/index.php/2024/09/22/aioc-der-wunderadapter-fuer-handfunkgeraete-teil-4-fehlersuche/
- DigiPi + AIOC fix (Google Group): https://groups.google.com/g/digipi/c/1NfZeLpsT4M
- AIOC GitHub issues (search before asking): https://github.com/skuep/AIOC/issues
- Videos: Ham Radio Dude (https://www.youtube.com/watch?v=xRCmXQYRLE0), Temporarily Offline (https://www.youtube.com/watch?v=RZjoPNe634o), AllStar node builds (https://youtu.be/7LB6D2FLGZk, https://youtu.be/k0iP4dECx6A)
- German 4-part AIOC article (DL-Nordwest): linked from the AIOC README
- Direwolf: https://github.com/wb2osz/direwolf
- CHIRP: https://chirpmyradio.com
- AllStarLink: https://www.allstarlink.org
- Winlink: https://winlink.org · Pat: https://getpat.io · VARA: https://rosmodem.wordpress.com
- APRSdroid: https://aprsdroid.org · YAAC: https://www.ka2ddo.org/ka2ddo/YAAC.html · Xastir: https://xastir.org
- SvxLink: https://www.svxlink.org · fldigi/NBEMS: http://www.w1hkj.org
- Quansheng Dock: https://github.com/nicsure/QuanshengDock · Egzumer firmware: https://github.com/egzumer/uv-k5-firmware-custom

---

## Appendix A — Retailer Section (fill in)
- **Hardware revision you ship:** `____` (rev 1.2 has RX gain, TX boost and hardware COS; it needs fw ≥ 1.4.0)
- **Firmware pre-loaded:** `____`
- **Enclosure / fit notes for specific radios:** `____`
- **Warranty and support contact:** `____`
- **Included accessories (USB-C cable, ferrite, etc.):** `____`
