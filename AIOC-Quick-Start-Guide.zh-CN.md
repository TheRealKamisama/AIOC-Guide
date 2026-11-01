# AIOC（All-In-One-Cable）快速入门与软件配置指南

> **本文档的用途**
> 这是一份同时供人和 AI 助手（Agent）使用的知识库。拿到本文档的 AI 助手应能回答：
> *“我有一个 AIOC 和某款电台，想在某台电脑上做某件事，要装什么软件、怎么设置？”*
>
> **文档版本：** 2026-10-31（第 3 版：社区资料、AIOC Toolkit）· 适用于 AIOC 固件 **v1.4.1**
> （截至 2026-10-31 仍是最新版）及硬件版本 rev 1.0–1.2。英文原版为准，本文为简体中文译本。

---

## 0. 给 AI 助手的说明（请先读）

1. **先弄清四件事。** 只问用户还没告诉你的：
   - **目标**：想做什么（写频、APRS、Winlink、SSTV、AllStar 节点……）。
   - **系统**：Windows、Linux（含树莓派）、macOS、Android，或 iPhone/iPad。
   - **电台**：品牌和型号。AIOC 使用建伍（Kenwood）式 **K1** 两针插头。
   - **AIOC 固件版本**（如果和任务有关）。VPTT、aioc-util 等功能需要 v1.3.0 或更新版本。
2. **用决策表（第 3 节）** 选软件，再去看该软件的配置步骤。
3. **PTT 是最常见的问题。** 电台不发射时，按 PTT 故障排查流程（第 6 节）处理。
4. **每条信息的可信程度。** 文中用标签标注来源：
   - **[Official]** ：来自 AIOC 的 GitHub README、发布说明或固件源码（skuep/AIOC）。
   - **[Tool docs]** ：来自 aioc-util 文档或其他软件自己的文档。
   - **[Community]** ：AIOC 用户在 GitHub issues、AllStarLink 论坛、DigiPi 群组或公开教程（G1LRO、DL-Nordwest、M0AWS）中的报告。这些是真实使用结果，但不保证适用于所有环境。
   - **[Typical]** ：通常可用的常见设置。不同软件版本的菜单名称可能不同，请让用户对照自己的屏幕确认。
5. **安全与合规。** 发射需要业余无线电执照（在中国为业余无线电台执照及相应操作证书）。测试时请让用户接假负载，或在空闲的直频频率上用小功率发射。不要建议违反频率规划或呼号识别规定的设置。
6. **不要编造菜单路径。** 本文没写到的菜单项，请描述这个设置的作用（例如“把 AIOC 选为音频输入”），不要猜它的确切名称。

---

## 1. AIOC 是什么

AIOC 是一块带 **USB-C** 接口的小型开源电路板，直接插在手台的 **建伍 K1 接口**（3.5 mm + 2.5 mm 双插头）上。它一个顶三个：写频线、声卡接口（类似 SignaLink 或 Digirig）和 PTT 接口。 **[Official]**

插到电脑上后，它会被识别为一个包含以下部分的 USB 复合设备：

| 功能 | 显示为 | 用途 |
|---|---|---|
| **USB 声卡** | “All-In-One-Cable” / “AIOC Audio”（1 路单声道输入，1 路单声道输出） | 电台接收音频送到电脑，电脑发射音频送到电台 |
| **虚拟串口（CDC-ACM）** | Windows：`COMx` · Linux：`/dev/ttyACMx` · macOS：`/dev/cu.usbmodemXXXX` | 电台写频（CHIRP 等） **以及** 串口 PTT |
| **CM108 兼容 HID** | Linux：`/dev/hidrawX` | CM108 式 PTT（GPIO3）和 COS 输入（固件 ≥ 1.2.0）；配置接口（固件 ≥ 1.3.0） |
| **DFU 运行时** | — | 不拆壳即可升级固件（固件 ≥ 1.2.0） |

关键参数 **[Official]** ：

- **USB VID:PID =** `1209:7388`。在引导（DFU）模式下显示为 STM32 引导程序 `0483:df11`。
- USB 字符串：厂商 `AIOC`，产品 `All-In-One-Cable`。
- 主控：STM32F302，用其内置 ADC/DAC 做声卡。
- 在 **Windows、Linux 和 macOS** 上免驱。Android 可通过 USB OTG 使用音频功能。
- 支持的采样率：**48000 Hz（推荐）**、32000、24000、22050（供 APRSdroid 使用）、16000、12000、11025、8000。
- 支持 **双 PTT** 电台（PTT1 和 PTT2 两路输出）。
- PTT1 默认触发源：**CM108 GPIO3** 或 **串口** `DTR=1 且 RTS=0`，两者同时有效。
- PTT2 默认触发源：CM108 GPIO4。
- 默认 COS：**虚拟 COS**（VCOS，根据接收音频电平判断）通过 CM108 的 **音量减（Volume Down）** 按键上报。

### 硬件版本与固件兼容性
| 硬件 | 固件 | 说明 |
|---|---|---|
| **rev 1.0 / 1.1**（2023–2025 年售出的大多数） | 1.2.0、**1.3.0（最稳妥）**、1.4.x | **[Community]** 部分 rev 1.0 板子升级到 1.4.x 后会 **卡死且 PTT 一直按下**，或在 Windows 虚拟机中出现音频“代码 10”错误（GitHub #120、#138，尚未解决）。遇到这种情况请刷回 **v1.3.0**。 |
| **rev 1.2**（2025 年 9 月起） | **必须 1.4.0 或更新** **[Official]** | 新增：外部硬件 COS 输入、可切断的 PTT/UART 分离焊盘（可把 CAT 串口与 PTT 分开）、接收增益 1–16× 可调、发射增强（线路电平）。 |
| **G1LRO “双 COS” AIOC / URC** | 出厂 1.3.0 | **[Community]** 板上有焊接跳线：**LOGIC COS**（Tidradio H3 新固件、SA818 模块）或 **SPK COS**（宝锋/泉盛这类通过喇叭音频判断的 COS）。 |

> **硬件版本印在电路板上。** 只能使用为 STM32F302 编译的官方 `aioc-fw-x.y.z.bin` 固件。
> **[Community]** 用 STM32F373 焊出来的板子（旧版物料清单里出现过）无法枚举（错误 -71），需要更换主控芯片（GitHub #122）。

### 已测试的电台 **[Official]**
- 宝锋 Baofeng UV-5R（CHIRP + APRS）
- 欧讯 Wouxun UV-9D Mate（CHIRP + APRS）
- BTECH UV-6X2 / 6X2（CHIRP）
- 泉盛 Quansheng UV-K5（原厂固件、Egzumer 第三方固件、Quansheng Dock）

**用户报告可用的其他机型** **[Community]** ：宝锋 UV-82、BF-888、普星 Puxing PX-888(D)、欧讯 KG-UV9D Plus、
Retevis RT85、Explorer QRZ-1、Tidradio H3，以及 **建伍 TH-F6A**（需把接口设为 **SP/MIC** 模式：菜单 9）。
也有用户把 AIOC 手工接到车台和短波电台的数据/话筒口上：**八重洲 Yaesu FT-817ND / FT-857D / FT-7800R**（音频、PTT 和 CAT 串口）、协谷 Xiegu G90，以及通过建伍转接头连接的 Radtel RT-950 Pro。注意：在 rev 1.0 板子上，CAT 串口数据可能触发 PTT（GitHub #34），硬件 rev 1.2 的 PTT/UART 分离焊盘可解决此问题。

**一般来说** **[Typical]** ：任何带建伍式两针 K1 接口的手台都可以。包括大多数宝锋
（UV-5R 系列、BF-888S、UV-82 *（UV-82 有双 PTT 版本）*）、泉盛（UV-K5/K6/K5(8)/UV-5R Plus）、
BTECH、欧讯、TIDRADIO、Radtel、Retevis、Abbree、普星以及带 K1 接口的建伍手台。使用 **其他接口** 的电台
（八重洲、艾可慕 Icom、摩托罗拉多针接口、宝锋/BTECH 螺纹式 UV-5X 插头、Anytone/Alinco 单插头）**无法直接插上**，需要转接头。

### 局限（购买或尝试前请告知用户）
- **只能通过话筒/喇叭接口传音频。** K1 接口传的是经过滤波和去加重的喇叭音频以及话筒输入。因此 **9600 波特分组、M17、DMR、D-STAR，或任何需要“平坦”鉴频器/调制器音频的模式都无法** 通过 K1 接口工作。1200 波特 AFSK 分组/APRS、VARA FM（窄带）、SSTV、fldigi 各模式和语音都能很好地工作。
- **SSB 数字模式（FT8、JS8、FreeDV）** 需要 SSB 电台。用 FM 手台时这些软件 *能运行*，但联系不到短波 SSB 上的普通 FT8/JS8 用户。
- **APRSdroid 没有 PTT 控制。** 请使用 AIOC 的 **虚拟 PTT（VPTT）**（固件 ≥ 1.3.0）或电台的声控（VOX）。
- **iPhone/iPad 应用只能把 AIOC 当声卡用**：iOS 不允许应用访问串口和 HID 部分，所以发射必须用 **VPTT**。 **[Community]**
- **廉价手台收发切换慢。** 分组通信可以用，但重传比车台多。 **[Community]**
- **刷新固件会清除设置。** 升级后请重新应用你的 aioc-util 设置。 **[Official]**

---

## 2. 首次设置（所有用户）

### 2.1 连接
1. **先关闭电台**，再把 AIOC 用力插进 K1 接口，两个插头都要插到底。
2. 用 USB-C 线连接电脑、手机或树莓派。
3. 打开电台，调到要用的频率。

### 2.2 确认电脑已识别
| 系统 | 检查方法 |
|---|---|
| **Windows** | 设备管理器 → *端口（COM 和 LPT）* 出现一个新的 **COMx**。*声音设置* 里输入（麦克风）和输出（扬声器）都有“All-In-One-Cable”。 |
| **Linux** | `lsusb` 显示 `1209:7388`。`arecord -l` / `aplay -l` 显示声卡。`ls /dev/ttyACM*` 显示串口。`ls /dev/hidraw*` 显示 HID。 |
| **macOS** | 系统设置 → 声音 中有“All-In-One-Cable”。`ls /dev/cu.usbmodem*` 显示串口。 |
| **Android** | 需要 USB-C OTG 连接。连接后，使用系统音频输入的应用会自动使用 AIOC。 |

### 2.3 系统音频设置（重要）
- **不要把 AIOC 设为系统默认播放设备。** 否则系统声音（通知、视频、提示音）都会从电台发出去；如果开了 VPTT，它们 **会让电台发射**。请保留你平时的扬声器为默认设备，只在电台软件里选择 AIOC。
- **Windows：** 声音控制面板 → AIOC 设备 → *属性*：
  - *高级*：格式设为 **1 声道、16 位、48000 Hz**。
  - 关闭“音频增强”，以及“通信 → 降低其他声音”的自动闪避。
  - *侦听* 选项卡：确认“侦听此设备” **未勾选**。
- **Linux（PipeWire/PulseAudio）：** 用 `pavucontrol` 调电平。很多程序（Direwolf 及基于 ALSA 的程序）可直接使用 ALSA（`plughw:CARD,0`），可避免重采样。
- **macOS：** 音频 MIDI 设置 → AIOC → 格式设为 48,000 Hz。

### 2.4 调整音频电平（所有数字模式）
**[Typical]**
- **接收（电台 → 电脑）：** 把 **电台音量旋钮** 开到大约 30–50%（部分 VARA FM 用户开到约 75%；G1LRO 建议 AllStar 节点用约 50%） **[Community]** 。调到软件电平表显示信号强但不削波为止。例如 Direwolf 收到一包数据时，“audio level”应在 30–70 左右。
  在硬件 rev 1.2 且固件 ≥ 1.4.0 时，还可以用 aioc-util 提高 AIOC 内部接收增益（1×–16×）。
- **发射（电脑 → 电台）：** 系统里 AIOC 的 **输出音量先设为约 30–50%**。太大会频偏过大、失真，对方解不出来。可用另一台电台监听，或看其他电台能否解码你的信号。
  硬件 rev 1.2 有发射“增强”（boost）功能，用于线路电平输入（普通手台不需要）。
- **电台设置：** 关闭 **声控 VOX**（除非你有意使用 VOX）。关闭按键音和尾音。关闭 **省电模式**：它会截掉收到数据包的开头。 **[Community]**
  **静噪：** 用 Direwolf 或 Soundmodem 收分组/APRS 时，**静噪全开（0 级）** 往往解码更好，因为宝锋的静噪打开慢，会切掉数据包开头，而软件调制解调器本身会做载波检测。 **[Community]**
  对类似 VOX 的方案（VPTT/VCOS、AllStarLink、SvxLink、EchoLink），信道空闲时静噪必须是 **关闭** 的（无信号时静音）。把 **发射限时（TOT）** 设得比你最长的一次发射更长（SSTV 和 Winlink 可能超过 2 分钟）。

### 2.5 Linux 权限（只需设置一次）
打开 `/dev/ttyACM*` 或 `/dev/hidraw*` 的程序需要权限：

```bash
# 串口权限
sudo usermod -aG dialout $USER     # (Arch/Fedora 可能是 "uucp" 组)
# 音频
sudo usermod -aG audio $USER

# AIOC HID 的 udev 规则（CM108 PTT / 配置）+ 防止 ModemManager 占用串口
sudo tee /etc/udev/rules.d/91-aioc.rules >/dev/null <<'EOF'
SUBSYSTEM=="hidraw", ATTRS{idVendor}=="1209", ATTRS{idProduct}=="7388", MODE="0666"
SUBSYSTEM=="tty",    ATTRS{idVendor}=="1209", ATTRS{idProduct}=="7388", ENV{ID_MM_DEVICE_IGNORE}="1", SYMLINK+="aioc", MODE="0666"
EOF
sudo udevadm control --reload && sudo udevadm trigger
# 注销并重新登录（使组生效），然后拔插 AIOC
```
设置后，串口还可以用 **`/dev/aioc`** 访问。ttyACM 编号变化时这个名字不变。
aioc-util 项目也自带现成的 udev 规则（`udev/rules.d/91-aioc.rules`）。 **[Tool docs]**

> **ModemManager**（Ubuntu、Debian 桌面版、Fedora 上常见）可能会探测新的 ttyACM 设备并向其发送 AT 指令，导致写频失败或随机触发 PTT。上面的 `ID_MM_DEVICE_IGNORE` 规则可以避免。
> 如果你不用蜂窝网络调制解调器，也可以运行 `sudo systemctl disable --now ModemManager`。

---

## 3. 决策表：“我需要什么软件？”

| 用户想要…… | Windows | Linux / 树莓派 | macOS | Android | 章节 |
|---|---|---|---|---|---|
| **写频（频道/存储）** | CHIRP | CHIRP | CHIRP | — | 5.1 |
| **刷第三方固件（泉盛 UV-K5）** | 网页刷机工具（Chrome）/ k5prog | 网页刷机工具 / k5prog | 网页刷机工具 | — | 5.2 |
| **收发 APRS（带地图）** | Direwolf + APRSIS32 / YAAC / PinPoint | Direwolf + YAAC / Xastir | Direwolf + YAAC | APRSdroid（+VPTT） | 5.3–5.5 |
| **APRS iGate 网关 / 数字中继** | Direwolf | Direwolf（无界面树莓派） | Direwolf | — | 5.3 |
| **给其他软件用的分组 TNC（KISS/AGW）** | Direwolf、UZ7HO Soundmodem | Direwolf、QtSoundModem | Direwolf | — | 5.3、5.6 |
| **分组 BBS / 节点 / 终端** | Direwolf + QtTermTCP / EasyTerm / BPQ32 | Direwolf + Paracon / QtTermTCP / LinBPQ / Linpac | Direwolf + QtTermTCP | — | 5.7 |
| **在 VHF/UHF 上收发 Winlink 邮件** | Winlink Express + VARA FM / 分组 | Pat + Direwolf（分组）或 VARA FM（Wine） | Pat + Direwolf | — | 5.8 |
| **VARA FM 键盘聊天** | VarAC / VARA Chat | Wine 下运行 VarAC | — | — | 5.8 |
| **SSTV（收发图片、国际空间站 SSTV）** | MMSSTV | QSSTV | Black Cat SSTV / MultiScan | Robot36（仅接收） | 5.9 |
| **应急通信文本/表单（NBEMS）** | fldigi + flmsg + flamp | fldigi + flmsg + flamp | fldigi | — | 5.10 |
| **FT8 / JS8（FM 上非标准用法）** | WSJT-X / JS8Call | WSJT-X / JS8Call | WSJT-X / JS8Call | — | 5.11 |
| **AllStarLink 节点（手台作节点电台）** | — | **AllStarLink 3**（Debian / 树莓派） | — | — | 5.12 |
| **EchoLink 链路 / 直频节点 / 中继控制器** | EchoLink（Sysop 模式） | **SvxLink** | — | — | 5.13 |
| **用脚本控制 PTT / 通用电台控制** | Hamlib（rigctl/rigctld） | Hamlib、aioc-util | Hamlib | — | 5.14 |
| **树莓派一体化数据站（网页界面里做 APRS、Winlink、分组、SSTV）** | — | **DigiPi**（树莓派镜像） | — | — | 5.15 |
| **用 iPhone 或 iPad 收发 Winlink / 分组** | — | — | — | iOS：RadioMail、Packet Commander（+VPTT） | 5.16 |
| **基于分组的 Mesh / 离网组网** | Reticulum，经 Direwolf KISS | Reticulum（RNS、NomadNet、Sideband），经 Direwolf KISS | Reticulum | Sideband | 5.17 |
| **GMRS 上的 AllStar 式联网** | — | GMRSLive（基于 AllStar） | — | — | 5.12 |
| **接车台/短波电台（音频 + PTT + CAT）** | WSJT-X/fldigi + CAT | 同左 | 同左 | — | 5.18 |
| **猎狐信标（无需电脑）** | AIOC Toolkit 或 aioc-util（用于设置） | 同左 | 同左 | — | 7.4 |
| **修改 AIOC 设置（PTT 源、VPTT/VCOS、增益）** | **AIOC Toolkit**（Chrome/Edge） | AIOC Toolkit 或 aioc-util | AIOC Toolkit 或 aioc-util | — | 7 |
| **升级 AIOC 固件** | **AIOC Toolkit**（Flash Firmware 选项卡） | dfu-util 或 AIOC Toolkit | dfu-util 或 AIOC Toolkit | — | 9 |
| **录制或监听接收音频、扫描记录** | Audacity / 任意录音软件 | Audacity / arecord / rtl 类工具 | Audacity | 任意录音应用 | 2.4 |

---

## 4. PTT 方式（看任何配置步骤之前请先理解）

AIOC 可以用多种方式让电台发射（PTT1），这些方式可以组合使用。 **[Official]**

| 方式 | 软件如何触发 | 适合 | 默认？ |
|---|---|---|---|
| **CM108 HID GPIO3** | 支持“CM108 PTT”的软件（Direwolf、AllStarLink、SvxLink、Hamlib `-P CM108`、Linux 上的 QtSoundModem） | Linux；最可靠的方式 | ✅ 开启 |
| **串口** `DTR=1 且 RTS=0` | 软件在 AIOC 的 COM 口上把 DTR 置高、RTS 置低 | 用 COM 口 PTT 的 Windows/macOS 软件 | ✅ 开启 |
| **仅串口 DTR**（`SERIALDTR`） | 软件拉高 DTR，但 RTS 也保持高电平 | 无法保持 RTS 为低的软件 | 需用 aioc-util 设置 |
| **仅串口 RTS**（`SERIALRTS`） | 软件用 RTS 控制发射 | 只支持 RTS PTT 的软件 | 需用 aioc-util 设置 |
| **串口 非DTR 且 RTS**（`SERIALNDTRRTS`） | 反向逻辑 | 很少用到 | 需用 aioc-util 设置 |
| **虚拟 PTT（VPTT）** | **软件无需 PTT 控制。** 只要软件播放的音频超过阈值，AIOC 就让电台发射（相当于 AIOC 内部一个非常快、干净的声控） | APRSdroid，任何没有 PTT 的应用 | 需用 aioc-util 设置，固件 ≥ 1.3.0 |

> **固件 1.2.0 之前**，PTT 只看“DTR=1”，导致 CHIRP 写频时电台会发射。固件 ≥ 1.2.0 改为 DTR=1 且 RTS=0。 **[Official]**
>
> **UART 锁定：** 默认情况下，PTT1 有效期间会忽略电台发来的串口数据，这样 AIOC 能同时当写频线和声卡用。可在 `SERIAL_CTRL` 寄存器中修改。 **[Official]**

**给 AI 助手的经验法则：**
1. 软件支持 **CM108 PTT** 就用它。
2. 否则用 **COM 口的“DTR”PTT**，并保持 RTS 关闭/为低。
3. 电台还是不发射，看第 6 节。

---

## 5. 软件配置步骤

> 示例中请把 `N0CALL` 换成用户的呼号，把 `COM5`、`/dev/ttyACM0`、`/dev/hidraw0` 和 `plughw:1,0` 换成用户实际的设备（见 2.2 节）。

### 5.1 CHIRP：给电台写频（Windows / Linux / macOS）
**[Official]** CHIRP 的用法和普通写频线完全一样，不需要驱动。
1. 从 chirpmyradio.com 安装 **CHIRP-next**。Linux：pipx/flatpak；macOS：.app 安装包。
2. 把 AIOC 插到电台上并开机。电台要停在 **普通的信道/频率界面**（不要停在菜单里）。
3. CHIRP → **Radio → Download from Radio**（从电台读取）→ 选择 AIOC 的端口（`COMx`、`/dev/ttyACM0` 或 `/dev/cu.usbmodem…`）→ 选择厂商/型号 → OK。
4. 编辑信道 → **Radio → Upload to Radio**（写入电台）。

提示 **[Typical]** ：
- 写入之前，一定 **先读取并保存一份备份** `.img`。
- 泉盛 UV-K5 **原厂固件**：用“Quansheng UV-K5”驱动。**Egzumer 或其他第三方固件**：用固件作者提供的对应 CHIRP 驱动模块（在 CHIRP 中：*Help → Developer mode → File → Load module*），或在较新的 CHIRP 里选择列出该固件的驱动。
- **[Community]** **Windows：CHIRP 读频后电台一直在发射。** 早期固件（1.2.0 之前）会这样，因为 Windows 关闭端口时会改变 DTR/RTS。请把 AIOC 升级到 ≥ 1.2.0。如果红灯一直亮，拔插一下 USB。
- **[Community]** 读频失败一次就再试一次。刚插上后的第一次偶尔会失败，晃一下插头就好（接触问题）。
- 如果提示“radio did not respond”（电台无响应）：重新插好插头、确认电台已开机、选择准确的型号（例如 UV-5R 与 UV-5R Plus / UV-5RM 是不同的电台）、调低音量、关闭 VOX。
- 宝锋 **UV-5RM / UV-5R Mini / UV-17** 等较新型号可能需要特定的 CHIRP 型号或厂家自己的写频软件。AIOC 仍然可以当它们的写频线。
- **厂家写频软件**（宝锋/BTECH/Radtel/TIDRADIO 的工具）也能用：选择 AIOC 的 COM 口即可。**RT Systems** 软件可能只认 RT Systems 自家的线。

### 5.2 泉盛 UV-K5 刷固件
**[Official]** 固件 v1.4.0 把串口缓冲区加倍，专门解决部分手台刷固件失败的问题。开始前请确认 AIOC 已是 v1.4.x。

**[Typical]**
1. 关闭电台。**按住 PTT 再开机** 进入引导模式（手电灯亮，屏幕不亮）。
2. 在 Chrome/Edge 中使用网页刷机工具（Web Serial）。Egzumer 项目里有链接。也可以用 `k5prog`/`uvk5` 等命令行工具。
3. 选择 AIOC 的串口，加载 `.bin` 文件，开始刷写。
4. 提醒用户：**刷第三方固件风险自负。** 应保留原厂固件和校准数据的备份（CHIRP/K5 工具可以导出校准数据）。

### 5.3 Direwolf：APRS、分组 TNC、iGate、数字中继（Windows / Linux / macOS）
Direwolf 是核心的“软件 TNC”。大多数 APRS 和分组软件通过 **AGW（端口 8000）** 或 **KISS-TCP（端口 8001）** 连接它。

**安装** **[Typical]** ：Linux `sudo apt install direwolf`。Windows：从 GitHub releases（wb2osz/direwolf）下载 zip。macOS：`brew install direwolf`。

**找到音频设备：**
- Linux：`arecord -l`，例如 `card 1: AllInOneCable [All-In-One-Cable], device 0` → `plughw:1,0`（或按名称 `plughw:CARD=AllInOneCable,DEV=0`；请在 `arecord -l` 中确认准确的声卡 ID）。
- Windows：先运行一次 Direwolf，它会列出带编号的音频设备，使用 AIOC 的编号。

**最小** `direwolf.conf` **[Official settings + Typical extras]** ：
```conf
# --- 音频 ---
ADEVICE plughw:1,0        # Linux  (Windows: ADEVICE 3 3   <- Direwolf 列出的 AIOC 输入/输出编号)
ARATE 48000
ACHANNELS 1

# --- 通道 0 ---
CHANNEL 0
MYCALL N0CALL-10
MODEM 1200

# --- PTT：只选一种 ---
PTT CM108                 # Linux: CM108 HID PTT（推荐）。自动识别；或写 "PTT CM108 /dev/hidraw0"
#PTT /dev/ttyACM0 DTR -RTS  # Linux 串口 PTT
#PTT COM5 DTR -RTS          # Windows 串口 PTT
#PTT /dev/cu.usbmodem1101 DTR -RTS   # macOS 串口 PTT

# --- 给客户端软件用的端口 ---
AGWPORT 8000
KISSPORT 8001
```
**[Official]** 在 AIOC 上使用 CM108 PTT 时，Direwolf 可能会打印 **警告**，这些警告无害（见 direwolf issue #448）。

**附加功能** **[Typical]** ：
```conf
# 位置信标（每 30 分钟，路径 WIDE1-1,WIDE2-1）。请填你自己的经纬度。
PBEACON delay=1 every=30 overlay=S symbol="digi" lat=42^37.14N long=071^20.83W power=5 height=20 gain=3 comment="AIOC + HT" via=WIDE1-1,WIDE2-1

# 仅接收的 iGate（需要联网 + APRS-IS 验证码）
IGSERVER noam.aprs2.net        # euro.aprs2.net / asia.aprs2.net / aunz.aprs2.net
IGLOGIN N0CALL-10 12345

# 补盲数字中继（只转发 WIDE1-1）—— 仅在当地合适时开启
DIGIPEAT 0 0 ^WIDE1-1$ ^WIDE1-1$
```
**[Community]** **AIOC 用户报告的 Direwolf 常见坑：**
- `PTT CM108 3 -3`：末尾的 `-3` 会 **反转** PTT，电台会一直发射。请用 `PTT CM108` 或 `PTT CM108 3`。
- 使用 CM108 PTT 时，注释掉指向同一设备的旧 `DCD` 配置行。
- 在树莓派上可用的串口写法：`PTT /dev/ttyACM0 DTR -RTS`（写成 `-RTS DTR` 也可以）。
- Windows 下 48000 Hz 时出现“pre filter size”警告：无害。也可以试试 `ARATE 24000`，或用 Direwolf 1.6 正式版代替开发版。
- 第一次发射后 PTT **一直按住**，或发射时 AIOC“崩溃”，几乎都是射频回授（见第 8 节）。

启动：`direwolf -c direwolf.conf`（加 `-t 0` 可关闭日志颜色）。
测试：`direwolf` 会显示解出的数据包和音频电平。发一个信标，然后在 aprs.fi 上查看。

**APRS 频率** **[Typical]** ：144.390 MHz（北美）、144.800 MHz（欧洲/非洲）、145.175 MHz（澳大利亚）、
**144.640 MHz（中国）**、144.660 MHz（日本）、145.825 MHz（国际空间站数字中继，全球）。用户须确认当地的频率规划。

### 5.4 APRS 客户端软件（用 Direwolf 作调制解调器）
以下软件都连接同一台电脑上运行的 Direwolf，由 Direwolf 负责音频和 PTT。

| 软件 | 系统 | 连接设置 **[Typical]** |
|---|---|---|
| **YAAC**（Java） | Win/Linux/macOS | *File → Configure → Expert mode → Ports → Add → “AGWPE”*，主机 `localhost`，端口 `8000`（或“KISS over TCP” `8001`） |
| **Xastir** | Linux/macOS | *Interface → Interface Control → Add → “Networked AGWPE”*，主机 `localhost`，端口 `8000` |
| **APRSIS32** | Windows（也可在 Wine 下运行） | *Configure → Ports → New Port → 类型“AGW”*，`127.0.0.1:8000`（或 KISS TCP `8001`） |
| **PinPoint APRS** | Windows | TNC 类型“AGWPE”，`127.0.0.1:8000` |
| **UI-View32**（老软件） | Windows | 经 Direwolf 的 AGW 端口使用 AGWPE 模式 |
| **APRS Messenger 等** | Windows | 用 AGW 或 KISS-TCP 连接 Direwolf |

YAAC 也自带声卡调制解调器，但 Direwolf 解码更好、对 AIOC PTT 的支持更可靠，所以推荐用 Direwolf。

### 5.5 APRSdroid：在 Android 上玩 APRS
**[Official]** AIOC 支持 APRSdroid 需要的固定 **22050 Hz** 采样率（实际为 22052 Hz，误差约 90 ppm，对 APRS 没有影响）。
APRSdroid **没有 PTT 控制**，所以要发射，需先在 AIOC 上 **开启虚拟 PTT**（在电脑上一次性设置，固件 ≥ 1.3.0）：
```bash
./aioc-util.py --ptt1 VPTT --store
# 同时保留 CM108 + 串口 PTT：
./aioc-util.py --ptt1 "VPTT|CM108GPIO3|SERIALDTRNRTS" --store
```
APRSdroid 设置 **[Typical]** ：
1. 用 USB-C OTG 线/转接头把 AIOC 接到手机上。
2. APRSdroid → *Preferences → Connection Protocol：“AFSK”*（音频调制解调器）。设置呼号/SSID 和验证码（只有用 APRS-IS 才需要验证码）。
3. 手机性能较弱时，关闭“high-quality demodulator”（高质量解调器）。手机媒体音量设为中等。
4. 确保没有其他应用发出声音（开了 VPTT 后任何声音都会让电台发射）。打开勿扰模式。

其他 Android 应用 **[Typical]** ：**Robot36**（SSTV 接收）、**DroidSSTV** 以及任意录音应用。应用需要使用 USB 音频输入，连接 AIOC 后大多数会自动切换。

### 5.6 UZ7HO Soundmodem（Windows）/ QtSoundModem（Linux、Windows）
和 Direwolf 类似的软件调制解调器（AFSK 1200 等），提供 AGW（8000）和 KISS（8100）端口。
**[Typical]**
- *Settings → Devices*：输入设备 = AIOC 麦克风，输出设备 = AIOC 扬声器。
  **UZ7HO Soundmodem 不接受高于 12000 的采样率，请用 12000**，AIOC 支持这个采样率。 **[Community]**
- PTT：*PTT Port* = AIOC 的 COM 口。**勾选“Swap COM pins for PTT”**：Soundmodem 默认用 RTS 发射，交换后改用 DTR，和 AIOC 匹配。“Dual PTT”不要勾选。 **[Community, GitHub #11]**
  - 仍不发射的话，把 AIOC 的 PTT 源改为 `SERIALDTR`（第 6 节），或改为 `VPTT`。
- Linux 上的 QtSoundModem 也可以用 **CM108 PTT**（如果你的版本有，选择 hidraw 设备 / CM108 选项）。
- 调制方式：普通 VHF 分组/APRS 用 AFSK AX.25 1200bd。

### 5.7 分组 BBS、节点和终端
以下软件都通过 AGW 或 KISS 使用 Direwolf（或 Soundmodem）作 TNC。 **[Typical]**

| 软件 | 系统 | 说明 |
|---|---|---|
| **QtTermTCP** | Win/Linux/macOS | Setup → AGW：主机 127.0.0.1，端口 8000。可连接 BBS/节点。 |
| **Paracon** | Win/Linux/macOS（Python） | AGWPE 客户端，127.0.0.1:8000。简单的多会话分组终端。 |
| **EasyTerm / Outpost** | Windows | Outpost（应急通信/ARES 分组消息常用）可以用 AGWPE 或 KISS。 |
| **BPQ32 / LinBPQ** | Win / Linux | 节点 + BBS + 聊天。`PORT` 段用 `DRIVER=UZ7HO`（以 AGW 连 Direwolf/Soundmodem），或 KISS over TCP（`TYPE=ASYNC`、`PROTOCOL=KISS`、`IPADDR=127.0.0.1`、`TCPPORT=8001`）。 |
| **Linux AX.25 协议栈 + Linpac / JNOS** | Linux | 用 `kissattach` 连接 Direwolf 的伪终端（`direwolf -p` 会创建 `/tmp/kisstnc`），或使用 `tncattach`。 |

### 5.8 Winlink 邮件：Winlink Express、Pat、VARA FM、分组
#### 5.8.1 Winlink Express（Windows）+ VARA FM
**[Official]** 在 VARA FM 中把 **PTT 引脚（PTT pin）设为“DTR only”**，这样 VARA 产生的 DTR/RTS 状态正是 AIOC 需要的。

**[Typical]** **设置步骤：**
1. 安装 **Winlink Express** 和 **VARA FM**（来自 Rosmodem 网站；免费模式限速，购买授权后解除限速）。
2. 打开 VARA FM → *Settings → SoundCard*：Device Input = AIOC 麦克风，Device Output = AIOC 扬声器。
3. VARA FM → *Settings → PTT*：**COM 口** = AIOC 的 COM，**Pin = DTR only**。
4. 大多数手台选 **Narrow**（VARA FM 1200）。Wide（9600）通常无法通过 K1 音频工作（见“局限”）。
5. 调整接收电平，让 VARA 的电平表在绿色区。把发射驱动（VARA → *Tune*，加上 Windows 输出音量）调到能稳定连通的最低值。
6. Winlink Express → *Open Session：“VARA FM Winlink”* → *Settings* → 主机保持 127.0.0.1，端口 8300/8301 → 用 *Channel Selection* 找一个网关 → *Start*。
7. 把电台的 **TOT** 设到最大或关闭。用小功率或中功率，避免手台过热。

#### 5.8.2 Winlink Express + 分组（1200 波特）
**[Typical]** 运行 Direwolf（5.3）或 UZ7HO Soundmodem → Winlink Express → *Open Session：“Packet Winlink”* →
*Settings*：TNC 类型 **KISS**，连接方式 **TCP**，主机 `127.0.0.1`，端口 `8001`（Direwolf KISS）/ `8100`（UZ7HO）。

#### 5.8.3 Pat（Linux、macOS、Windows、树莓派）
**[Typical]** Pat 是一个单程序的 Winlink 客户端，带网页界面。
```bash
pat configure        # 设置 mycall、secure_login_password、locator
```
- **通过 Direwolf 走分组（AGWPE）：** 在 `config.json` 中设置 `"ax25": {"engine": "agwpe", ...}` 和 `"agwpe": {"addr": "localhost:8000"}`。
  连接：`pat connect ax25:///GATEWAYCALL-10`（或使用网页界面：运行 `pat http`，然后打开 http://localhost:8080）。
- **改用 Linux 内核 AX.25：** 用 `kissattach` 连接 Direwolf 的 PTY，然后设置 `"engine": "linux"` 和 `"port": "wl2k"`。
- **VARA FM：** 在 Wine 下运行 VARA FM（AIOC 作声卡，COM 口 PTT 设为“DTR only”），然后在 Pat 中设置 `"varafm": {"addr": "localhost:8300"}`，用 `pat connect varafm:///GATEWAYCALL` 连接。

#### 5.8.4 VarAC / VARA Chat（通过 VARA 键盘聊天）
**[Typical]** 先按 5.8.1 安装并设置好 VARA FM。在 VarAC（或 VARA Chat）中选择 **VARA FM** 作调制解调器。
VarAC 连接 VARA 的 TCP 端口，PTT 仍由 VARA 控制（DTR only）。VarAC 自己也能做 PTT/CAT，但请保持 **关闭**，让 VARA 负责发射。

### 5.9 SSTV：慢扫描电视图片
**[Typical]**
| 软件 | 系统 | 音频 | PTT |
|---|---|---|---|
| **MMSSTV** | Windows | *Option → Setup → Misc → Sound card*：输入/输出选 AIOC | *Setup → TX → PTT port*：AIOC 的 COM。不发射的话，把 AIOC 改为 `SERIALDTR`/`SERIALRTS` 或 `VPTT`（第 6 节）。 |
| **QSSTV** | Linux | *Options → Configuration → Sound*：ALSA/PulseAudio 选 AIOC | *CAT* 选项卡：Hamlib “Dummy”，PTT 经串口 **DTR**（`/dev/ttyACM0`），如有 Hamlib CM108 选项也可用；否则用 VPTT。 |
| **Black Cat SSTV / MultiScan 3B** | macOS | 输入/输出选 AIOC | 用 AIOC 的 VPTT（最简单） |
| **Robot36** | Android | USB 音频 | 仅接收 |

提示：只接收（例如 **国际空间站 SSTV 活动，145.800 MHz FM**）完全不需要设置 PTT。接收微弱的卫星信号时，把静噪 **关闭** 或调低。长时间发射时注意手台过热，TOT 设为 ≥ 3 分钟。

### 5.10 fldigi / flmsg / flamp：通过 FM 传应急通信文本和表单（NBEMS）
**[Typical]**
1. *Configure → Sound card → Audio → Devices*：PortAudio（或 PulseAudio）→ Capture **和** Playback 都选 AIOC。采样率：Native/48000。
2. PTT，任选一种：
   - *Configure → Rig Control →* **CM108 / C-Media PTT**（较新的 fldigi 版本）：选择 AIOC 的 HID，**GPIO 3**。
   - *Configure → Rig Control →* **GPIO / Hardware PTT**：“Use separate serial port PTT”，设备 = AIOC 的 COM/ttyACM，勾选 **Use DTR**（DTR = +V），**不要勾选 RTS**。点击 *Initialize*。
     不发射的话：把 AIOC 的 PTT 源设为 `SERIALDTR`（第 6 节）。
   - 或用 Hamlib，设置 `ptt_type=CM108`。
3. 常用 FM 模式：**MT63-2000L**（ARES/NBEMS 在 FM 上的常用模式）、**8PSK**、**Olivia**。用瀑布图把信号放在约 1500 Hz 处。
4. **flmsg**（ICS-213 等表单）和 **flamp**（组播文件）通过 fldigi 工作。把它们的“fldigi”连接设为默认值（XML-RPC 127.0.0.1:7362）。

### 5.11 WSJT-X / JS8Call（FT8、FT4、JS8：在 FM 上属非标准用法）
**[Typical]** 这些通常是 SSB 模式。在 FM 手台上只能和同样用 FM 的电台互通（例如本地 2 米 FM 实验）。设置：
- *Settings → Radio*：Rig 选 **None**。**PTT Method：DTR**。Port：AIOC 的 COM/ttyACM。
  （不发射的话，把 AIOC 设为 `SERIALDTR`，或 PTT 选“VOX”并开启 AIOC 的 VPTT。）
- *Settings → Audio*：输入/输出 = AIOC，单声道。
- 发射音量要低（干净的单音）。FM 的捕获效应对弱信号不利。

### 5.12 AllStarLink 3（ASL3）：手台作 AllStar 节点电台
**[Official + Tool docs]** AIOC 模拟 CM108，所以 ASL3 可以直接用它控制 PTT 和读取 COS。
ASL3 认识 AIOC 自己的 USB ID `1209:7388`，只需在 `res_usbradio.conf` 中 **取消注释** 即可。

**步骤：**
1. 安装 ASL3（allstarlink.org 提供的 Debian 12 / 树莓派 OS 镜像）。用 `asl-menu` 设置节点号和密码。
2. 安装 AIOC 的 udev 规则（2.5 节），让 Asterisk 能打开 HID。
3. 允许 AIOC 的 USB ID：
   ```ini
   ; /etc/asterisk/res_usbradio.conf
   [general]
   usb_devices = 1209:7388    ; AIOC (all in one cable)
   ```
   *（另一种做法：用* `./aioc-util.py --set-usb 0x0d8c 0x000c --store` *把 AIOC 伪装成 C-Media CM108。之后再配置它时需要加* `--open-usb 0x0d8c 0x000c`*。）*
4. 设置虚拟 COS（根据接收音频判断静噪）的保持时间。**时间寄存器以 1/16 毫秒计：数值 = 毫秒 × 16**
   （由固件默认值和 G1LRO 的脚本确认，1500 毫秒 = `0x5DC0`）。 **[Official + Community]**
   ```bash
   ./aioc-util.py --vcos-timctrl 24000 --store      # 1500 毫秒保持时间（G1LRO 的推荐值）
   ```
   *（aioc-util README 中的示例* `--vcos-timctrl 1500` *只有约 94 毫秒。）* 如果说话时字与字之间断掉，就调大。
   如果 COS 被噪声打开，就提高阈值（`--vcos-lvlctrl`，默认 256）。G1LRO 建议噪声大的电台把阈值设在 1500 左右。
   确保信道空闲时电台的 **静噪是关闭的**。VCOS 根据音频电平打开。
   **更好的办法：硬件 COS。** rev 1.2 或 G1LRO 双 COS 板可以读取电台真实的静噪状态：`./aioc-util.py --enable-hwcos --store`。
   **省事的办法** **[Community]** ：G1LRO 的脚本会帮你完成第 3–6 步（它会修改 `res_usbradio.conf`、`simpleusb.conf` 和 `rpt.conf`，并先做备份）：
   ```bash
   wget -O customize.sh https://raw.githubusercontent.com/G1LRO/AIOC-ASL3-Config/main/customize.sh
   sudo bash customize.sh
   ```
5. 在 `asl-menu` 中 **[Official example]** ：
   - 设备类型：`usbradio`（菜单 2 > A1 > N4 > I2）（或 `simpleusb`，手台节点用它也很好）
   - 双工类型：`1`（菜单 2 > A1 > N5）
6. 编辑 `usbradio.conf`（菜单 6 > H）。官方示例针对普星 PX-888，作为大多数手台的起点都合适：
   ```ini
   rxboost = 0
   rxsqhyst = 500
   carrierfrom = usbinvert
   ctcssfrom = no
   rxdemod = speaker
   txprelim = no
   invertptt = no
   ```
   （`simpleusb.conf` 中对应的是 `carrierfrom = usbinvert`、`ctcssfrom = no`。）
   **[Community]** **G1LRO 给出的** `simpleusb-tune-menu` **设置：** I = PTT 模式（他的旧教程中为 `active LOW`），J = COS 来源 `usbinvert`（VCOS）或 `usb`（高电平有效；他的新教程在硬件 COS 时用这个），L = CTCSS 来源 `no`。
   **COS 一直打开：** 在 `usb` 和 `usbinvert` 之间切换，或提高 VCOS 阈值。**COS 一直不打开：** 切换两者，或降低阈值。
7. 运行 `radio-tune-menu`（usbradio）或 `simpleusb-tune-menu`（simpleusb）设置收发电平：**V** 检查 COS，**e** 做回声测试，**2/3** 调电平，**W** 保存。然后重启 Asterisk：`sudo systemctl restart asterisk`。
8. 用鹦鹉节点（**Hubnet Parrot 40894**）测试，或连接一个枢纽节点。用 **小功率**，天线和电脑分开放：射频窜入 USB 线是最常见的问题（第 8 节）。

**AllStarLink 论坛上报告的解决办法** **[Community]** ：
| 现象 | 解决 |
|---|---|
| `asl-menu` 提示找不到音频设备 | 在 `res_usbradio.conf` 中取消注释 `usb_devices = 1209:7388`（M0AWS 为此折腾了一整天） |
| COS 正常但 **没有接收音频** | 设置了 `ctcssfrom`：改为 `ctcssfrom = no` |
| 节点反复发射 | 确认 `rpt.conf` 中 `duplex = 1` |
| 节点发射时 PTT 卡住 | 射频回授：用 1 W 而不是 5 W、短 USB 线、卡扣磁环，天线远离树莓派 |
| 尾音约 3 秒或自己发射 | 检查 VCOS 保持时间和阈值；把电台静噪调高 |
| 全双工中继 | 有人用两个 AIOC 和两台电台（一收一发）实现了（F1FQN 的视频） |

**HamVOIP / GMRSLive**（较早的基于 AllStar 的系统）只认 C-Media 的 ID。请用上面的 `--set-usb 0x0d8c 0x000c` 选项（G1LRO 的 `aioc.py` / `aioc-revert.py` 脚本作用相同）。在 GMRS 上请遵守当地 GMRS 规定，GMRS 不属于业余无线电。

### 5.13 SvxLink（Linux）和 EchoLink（Windows）
#### SvxLink：直频节点、中继控制器、EchoLink 链路
**[Typical]** PTT 和静噪都用 AIOC 的 HID：
```ini
# /etc/svxlink/svxlink.conf
[Rx1]
TYPE=Local
AUDIO_DEV=alsa:plughw:1
AUDIO_CHANNEL=0
SQL_DET=HIDRAW
HID_DEVICE=/dev/hidraw0
HID_SQL_PIN=VOL_DN          # AIOC 的 VCOS 在 CM108 "Volume Down" 上；逻辑相反时用 !VOL_DN
# 也可以用：SQL_DET=VOX (VOX_FILTER_DEPTH / VOX_THRESH) 或 CTCSS

[Tx1]
TYPE=Local
AUDIO_DEV=alsa:plughw:1
AUDIO_CHANNEL=0
PTT_TYPE=Hidraw
HID_DEVICE=/dev/hidraw0
HID_PTT_PIN=GPIO3
# 串口 PTT 写法：PTT_TYPE=SerialPin, PTT_PORT=/dev/aioc, PTT_PIN=DTR!RTS
```
如需 EchoLink，启用 `ModuleEchoLink`，并在 `ModuleEchoLink.conf` 中填写呼号和密码。在路由器上转发 **UDP 5198–5199** 和 **TCP 5200**。

#### EchoLink（Windows，Sysop 模式）
**[Typical]**
- *Tools → Sysop Settings → RX Ctrl*：**VOX**（调整阈值）。AIOC 不支持通过串口提供 COS，所以一般用 VOX。
- *TX Ctrl*：在 AIOC 的 COM 口上用 **Serial** 控制发射。EchoLink 可能拉高 RTS（或两根线都拉高）。把 AIOC 的 PTT 源设为对应的 `SERIALRTS` 或 `SERIALDTR`，或者直接用 **VPTT**（第 6 节）。
- *Audio*：输入/输出 = AIOC。需要已验证的 EchoLink 账号，并转发 UDP 5198–5199。

### 5.14 Hamlib / 脚本 / 通用 PTT
**[Typical]**
```bash
# 通过 HID 的 CM108 PTT（Linux）
rigctl -m 1 -p /dev/hidraw0 -P CM108 T 1     # 发射
rigctl -m 1 -p /dev/hidraw0 -P CM108 T 0     # 停止发射

# 串口 DTR PTT，强制 RTS 为低
rigctl -m 1 -p /dev/ttyACM0 -P DTR -C rts_state=OFF T 1

# rigctld：供通过网络连接 Hamlib 的软件使用（端口 4532）
rigctld -m 1 -p /dev/hidraw0 -P CM108
```
**aioc-util** 也可以直接控制发射（固件 ≥ 1.3） **[Tool docs]** ：
```bash
./aioc-util.py --set-ptt1-state on
./aioc-util.py --set-ptt1-state off
```
用 Python + pyserial（AIOC 默认逻辑）：
```python
import serial, time
s = serial.Serial('/dev/ttyACM0')   # 或 'COM5'
s.rts = False; s.dtr = True         # PTT 按下 (DTR=1, RTS=0)
time.sleep(2)
s.dtr = False                       # PTT 松开
```

### 5.15 DigiPi（树莓派一体化数据站）
**[Community]** DigiPi 是一个现成的树莓派镜像，在网页界面里提供 APRS、数字中继/iGate、分组节点、Winlink（Pat）、SSTV 等功能。
旧版 DigiPi 不直接支持 AIOC。用户的做法是修改 **每一个** Direwolf 配置文件
（`direwolf.tnc.conf`、`direwolf.digipeater.conf`、`direwolf.node.conf`、`direwolf.winlink.conf`、`direwolf.tracker.conf`、`direwolf.tnc300b.conf`）：
```conf
ADEVICE plughw:0,0 plughw:0,0     # 或 arecord -l 中 AIOC 的声卡编号
PTT CM108                         # 或：PTT /dev/ttyACM0 DTR -RTS   （不要在末尾加 -3，那会反转 PTT）
# 注释掉旧的 DCD 行
```
然后 `sudo remount`，修改文件，运行 `sudo ./saveconfigs.sh`，再 `sudo reboot`。USB 线 **两端** 都加磁环。
修改前请先查看新版 DigiPi 是否已原生支持 AIOC。

### 5.16 iPhone / iPad（RadioMail、Packet Commander）
**[Community, Dec 2025]** iOS 应用只能把 AIOC 当 **USB 声卡** 用（苹果不允许应用访问 USB 串口或 HID）。
**RadioMail**（Winlink）和 **Packet Commander** 应用内置分组调制解调器，开启 **虚拟 PTT** 后可以配合 AIOC 使用：
```bash
./aioc-util.py --ptt1 "VPTT|CM108GPIO3|SERIALDTRNRTS" --store     # 需要 AIOC 固件 1.4.1（旧固件上 aioc-util 设置失败）
```
使用 USB-C 接口的 iPhone/iPad，或苹果的 Lightning 转 USB 相机转换器。把设备上其他声音全部静音，因为任何声音都会让电台发射。

### 5.17 通过分组运行 Reticulum（RNS、NomadNet、Sideband、MeshChat）
**[Typical]** Reticulum 可以使用 KISS TNC。运行 Direwolf（5.3），并在 `~/.reticulum/config` 中添加一个 TCP KISS 接口：
```ini
[[Direwolf AIOC]]
  type = TCPClientInterface
  interface_enabled = True
  kiss_framing = True
  target_host = 127.0.0.1
  target_port = 8001
```
（也可以把 `KISSInterface` 指向 `direwolf -p` 创建的 Direwolf 伪终端。）1200 波特很慢，但发消息够用。
**[Community]** 有用户报告 Reticulum 通过 TCP 连接 Direwolf 时有问题。遇到异常可以改用 PTY/`KISSInterface` 方式。
请遵守本国业余无线电规定：很多执照条件禁止加密。发射前请检查 Reticulum 的配置。

### 5.18 车台 / 短波电台（把 AIOC 接到数据口或话筒口）
**[Community]** AIOC 本质上就是一块集成了 USB 声卡、串口和 PTT 的小板，所以有动手能力的用户会把它接到其他电台上：
- 从焊盘或尾线上的 K1 插座引出信号：送往电台的音频、来自电台的音频、PTT、UART TX/RX 和地（引脚定义见 AIOC README）。
- **八重洲 FT-817ND / FT-857D / FT-7800R：** 已有人用便宜的 CT-39A（数据）和 CT-62（CAT）线实现了音频、PTT 和 **CAT**（GitHub #137）。CAT 没反应时，**交换 RX 和 TX**。
- 在 **硬件 rev 1.0/1.1** 上，UART 和 PTT 共用一个触点，所以 CAT 数据可能触发 PTT。请用 rev 1.2 并切断分离焊盘，或不接 PTT、改用 CAT 控制发射。
- rev 1.2 接线路电平数据口时：`--audio-tx-boost on`，并调高 `--audio-rx-gain`。
- 艾可慕 Icom 的 CI-V（单线总线）不加额外电路 **无法** 工作（GitHub #109，尚未解决）。
- 如果不熟悉焊接，建议买现成的专用接口。接错线可能损坏电台或 AIOC。

---

## 6. PTT 故障排查流程

```
软件已经“按下发射”，但电台没有发射？
│
├─ 1. 插头插到底了吗？电台开机了吗？VOX 关了吗？没有锁键？不是禁止发射的信道？
│      快速硬件测试：AIOC Toolkit → Configure → Manual PTT State → PTT 1 ON。
│      如果这里电台能发射，说明线没问题，问题出在软件的 PTT 设置上。
│
├─ 2. 软件支持 CM108 PTT 吗？→ 用它（Linux：检查 /dev/hidraw 权限，见 2.5 节）
│
├─ 3. 使用 COM 口 PTT 时：
│     ├─ 软件设为 "DTR"（RTS 关闭）？→ 默认设置就应该能用。
│     ├─ 软件同时拉高 DTR 和 RTS，或 RTS 一直为高（Linux 上常见，打开端口时两根线都会拉高）
│     │      → aioc-util --ptt1 "CM108GPIO3|SERIALDTR" --store
│     ├─ 软件只用 RTS 发射
│     │      → aioc-util --ptt1 "CM108GPIO3|SERIALRTS" --store
│     └─ VARA FM → 设置 "Pin: DTR only"
│
├─ 4. 软件完全没有 PTT（APRSdroid、部分 Mac 软件）
│      → aioc-util --ptt1 "VPTT|CM108GPIO3|SERIALDTRNRTS" --store
│
└─ 5. 电台能发射，但松不开 / 写频时也会发射
       → 你把 PTT 改成了 SERIALDTR/SERIALRTS：写频前恢复默认：
         aioc-util --defaults --store
       → 检查发射音频是否误触发 VPTT（系统声音、VPTT 阈值太低）
```

> ⚠️ **给 AI 助手的提醒：** 把 PTT 改为单独的 `SERIALDTR` 或 `SERIALRTS` 后，**CHIRP 写频时电台可能会发射**，因为 CHIRP 会切换这两根线。请让用户在写频前用 `--defaults --store` 恢复默认，或者专门留一个 AIOC 用于写频。

---

## 7. 配置 AIOC 本身（AIOC Toolkit / aioc-util）

本文中每一条 `aioc-util` 命令，在浏览器版 **AIOC Toolkit**（https://g1lro.github.io/aioc-toolkit/）里都有对应的控件。例如 `--ptt1 VPTT` 对应 **PTT Sources → Auto PTT1 (VPTT)**，`--store` 对应 **Store to Flash**。不会用命令行的客户，请推荐他们用 Toolkit。 **[Tool docs]**

### 7.1 使用条件 **[Tool docs]**
- AIOC **固件 ≥ 1.3.0**（已在 1.3 和 1.4.1 上测试；1.2 **不能** 用）。
- **命令行：** TF3HR（Hrafnkell Eiríksson）开发的 `aioc-util` —— https://github.com/hrafnkelle/aioc-util
- **浏览器工具（免安装；需要电脑上的 Chrome 或 Edge 89+；Linux 上必须先安装 2.5 节的 udev 规则）：**
  - **G1LRO 的 AIOC Toolkit：https://g1lro.github.io/aioc-toolkit/（推荐）。** **[Tool docs]** 同时支持修改设置和刷固件，基于 aioc-util 和 webdfu 开发（源码：https://github.com/G1LRO/aioc-toolkit）。
    - **Configure** 选项卡：**Connect (WebHID)** 即使 AIOC 的 USB ID 被改过也能找到它（通过读取“AIOC”识别寄存器）。功能包括：
      - 实时 **GPIO Status**（PTT1/PTT2 输出、Vol+、Vol−/VCOS、静音键）
      - **Manual PTT State** 开/关，不用其他软件就能测试发射
      - **PTT Sources**（含 **Swap PTT1/PTT2** 和 **Auto PTT1 (VPTT)**）
      - **CM108 Button Sources**
      - **COS Mode**（虚拟 COS 或硬件 COS）
      - **Audio Settings**（接收增益 1–16×、发射增强）
      - **AutoPTT & VCOS Thresholds**（电平和时间；时间 = 毫秒 × 16）
      - **Foxhunt (CW Beacon)**（猎狐 CW 信标）
      - **USB VID / PID Override**：**Fill CM108 IDs** = `0x0D8C`/`0x000C`，用于 AllStar/HamVOIP
      - **Device Actions**：**Store to Flash**、**Recall from Flash**、**Load Defaults**、**Reboot Device**
      - **Raw Register Dump**（原始寄存器）
    - **Flash Firmware** 选项卡：见 9.2 节。
    - 每次都要先点 **Apply** 再点 **Store to Flash**，否则拔下 AIOC 后设置会丢失。修改 USB ID 要在 **Store** 之后再 **Reboot** 才生效。
  - 较早的单一功能网页：https://aioc-util.tf3hr.net/（TF3HR）和 https://g1lro.github.io/aioc-util/（G1LRO）。 **[Community]**
  - **推荐不熟悉技术的客户使用 Toolkit**：不需要 Python、hidapi.dll 或 Zadig。

**安装（Linux/macOS）：**
```bash
git clone https://github.com/hrafnkelle/aioc-util.git
cd aioc-util
python3 -m venv venv && source venv/bin/activate
pip install hid
# Linux: sudo cp udev/rules.d/91-aioc.rules /etc/udev/rules.d/ && sudo udevadm control --reload && sudo udevadm trigger
# Debian/树莓派可能需要: sudo apt install libhidapi-hidraw0 libhidapi-libusb0
```
**Windows：** 在 PowerShell 中执行同样的虚拟环境步骤（`.\venv\Scripts\activate`）。从 libusb/hidapi 的 releases 下载 `hidapi.dll`，放在 `aioc-util.py` 旁边。用 `python aioc-util.py …` 运行。

### 7.2 常用命令 **[Tool docs]**
| 任务 | 命令 |
|---|---|
| 显示所有寄存器 | `./aioc-util.py --dump` |
| 恢复出厂默认（并保存） | `./aioc-util.py --defaults --store` |
| 列出 PTT 源 | `./aioc-util.py --list-ptt-sources` |
| 设置 PTT1 源 | `./aioc-util.py --ptt1 "CM108GPIO3|SERIALDTR" --store` |
| PTT1 使用虚拟 PTT | `./aioc-util.py --ptt1 VPTT --store`（或 `--auto-ptt1`） |
| 交换 PTT1/PTT2（双 PTT 电台） | `./aioc-util.py --swap-ptt --store` |
| VPTT/VCOS 阈值和保持时间 | `./aioc-util.py --vptt-lvlctrl 0x80 --vptt-timctrl 320 --vcos-lvlctrl 0xff --vcos-timctrl 24000 --store`（时间 = 毫秒 × 16：320 = 20 毫秒，24000 = 1.5 秒） |
| 接收增益（硬件 rev ≥ 1.2，固件 ≥ 1.4） | `./aioc-util.py --audio-rx-gain 4x --store`（1x/2x/4x/8x/16x） |
| 线路电平发射增强（硬件 rev ≥ 1.2） | `./aioc-util.py --audio-tx-boost on --store` |
| 查看音频设置 | `./aioc-util.py --audio-get-settings` |
| 硬件 COS 输入（硬件 rev ≥ 1.2） | `./aioc-util.py --enable-hwcos --store`（改回 VCOS：`--enable-vcos`） |
| 伪装成 CM108（HamVOIP 等） | `./aioc-util.py --set-usb 0x0d8c 0x000c --store` |
| 改过 USB ID 后再配置 | `./aioc-util.py --open-usb 0x0d8c 0x000c --dump` |
| 多个 AIOC | 先 `--list-devices`，再 `--open-serialnum <SN> …` |
| 重启 | `./aioc-util.py --reboot` |

> 不加 `--store`，下次断电后修改就会丢失。**刷固件会清除所有已保存的设置。** **[Official]**

### 7.3 寄存器参考（供高级用户和 AI 助手使用） **[Official — firmware settings.h]**
| 寄存器 | 名称 | 作用 | 默认值 |
|---|---|---|---|
| 0x00 | MAGIC | 读出“AIOC” | — |
| 0x08 | USBID | VID（低 16 位）/ PID（高 16 位） | `1209:7388` |
| 0x24 | AIOC_IOMUX0 | PTT1 源位掩码 | CM108GPIO3 \| SERIALDTRNRTS |
| 0x25 | AIOC_IOMUX1 | PTT2 源位掩码 | CM108GPIO4 |
| 0x44–0x47 | CM108_IOMUX0–3 | CM108 按键 音量+ / 音量− / 播放静音 / 录音静音 的来源 | 音量+ = IN2，**音量− = VCOS**，其余无 |
| 0x60 | SERIAL_CTRL | PTT 有效时锁定 UART | PTT1 时锁定 |
| 0x72 | AUDIO_RX | 接收增益 1×–16× | 1× |
| 0x78 | AUDIO_TX | 发射增强 | 关 |
| 0x82 / 0x84 | VPTT_LVLCTRL / TIMCTRL | 虚拟 PTT 阈值 / 保持时间（毫秒 × 16） | 16 / 0x140（= 20 毫秒） |
| 0x92 / 0x94 | VCOS_LVLCTRL / TIMCTRL | 虚拟 COS 阈值 / 保持时间（毫秒 × 16） | 256 / 0xC80（= 200 毫秒） |
| 0xA0–0xA5 | FOXHUNT_CTRL, MSG0–3 | 猎狐间隔、速度、音量、16 字符消息 | 关闭 |

PTT 源位：`CM108GPIO1=0x1, GPIO2=0x2, GPIO3=0x4, GPIO4=0x8, SERIALDTR=0x100, SERIALRTS=0x200, SERIALDTRNRTS=0x400, SERIALNDTRRTS=0x800, VPTT=0x1000`。
按键来源：`IN1=0x10000, IN2=0x20000, VCOS=0x1000000`。
命令：`WRITESTROBE=0x01, DEFAULTS=0x10, REBOOT=0x20, RECALL=0x40, STORE=0x80`。
寄存器通过 HID 特性报告访问，格式为 `<BBBL>`：（报告 0、命令、地址、数值）。

### 7.4 猎狐信标模式（固件 ≥ 1.4.0） **[Official + Tool docs]**
AIOC 只需 USB 供电（例如充电宝）就能自己发送摩尔斯电码识别。设置好以后不需要电脑。
```bash
./aioc-util.py --foxhunt-message "DE N0CALL FOX" --foxhunt-wpm 20 --foxhunt-interval 60 --foxhunt-volume 32000 --store
./aioc-util.py --foxhunt-get-settings --foxhunt-get-message   # 检查
./aioc-util.py --foxhunt-interval 0 --store                   # 关闭
```
消息最多 16 个字符 · 间隔 0–255 秒（0 = 关闭）· 速度 0–255 WPM · 音量 0–65535。
用户须遵守当地关于无人值守信标和电台识别的规定。

---

## 8. 已知问题与解决办法

| 现象 | 原因 | 解决 |
|---|---|---|
| **只在发射时** USB 断开、音频乱码、电脑“叮咚”响或卡死 | **射频回授。** 使用原装（单极）天线时，USB 线成了电台的地网（“虎尾线”）。 **[Official]** | 降低发射功率。加 **地网/虎尾线**。用远离电脑的 **外接或平衡天线**（如偶极天线）。在 USB 线上加 **卡扣磁环**。用短 USB 线。 **[Community]** 好几位用户把功率从 5 W 降到 **1 W** 就好了。也有人用一小段 **尾线** 把 AIOC 引离电台，或用同轴延长线让天线离开 1 米以上。 |
| 电台不发射 | PTT 方式不匹配 | 第 6 节 |
| 电台一直发射 / 随机发射 | Linux 的 ModemManager 在探测端口；PTT 源被设成了仅 DTR/RTS；开了 VPTT 时有系统声音 | udev 忽略规则（2.5）；`--defaults --store`；不要把 AIOC 设为默认音频设备 |
| CHIRP：“Radio did not respond” | 型号不对、插头没插好、电台停在菜单里、固件太旧 | 重新插好，选准确型号，把 AIOC 升级到 ≥ 1.2.0（DTR 且非 RTS 修复） |
| 收发音频时有时无，PTT 时灵时不灵 | TRS 插头接触 / 焊点问题（自焊板），或插头没插到底 | 重新插好。自焊板可以在侧向按压触点的同时重新熔化 TRS 焊片的焊点 **[Official]** |
| 解码失败，声音失真 | 发射电平太高（频偏过大）或接收削波 | 调低系统输出音量；调低电台音量；接收增益改回 1× |
| 软件里什么都听不到 | 静噪关着 / 音量为零 / 输入设备选错 | 打开静噪，调大电台音量，在软件里选择 AIOC 输入 |
| macOS 上发射音频断断续续 | 固件旧 | 升级到 ≥ v1.4.0（含 macOS 修复） **[Official]** |
| UV-K5 刷固件中途失败 | 旧固件串口缓冲区不够 | 把 AIOC 升级到 ≥ v1.4.0 **[Official]** |
| Direwolf 的 CM108 警告 | Direwolf 本身的行为 | 无害，忽略即可（direwolf issue #448） **[Official]** |
| Linux 上 /dev/ttyACM0 或 /dev/hidraw“permission denied” | 用户不在 dialout/plugdev 组；没有 udev 规则 | 2.5 节 |
| aioc-util“Unexpected magic”/ 打不开 | 固件 < 1.3、USB ID 被改过，或 Windows 缺少 hidapi.dll | 升级固件；用 `--open-usb`；添加 hidapi.dll；或用浏览器里的 AIOC Toolkit（7.1），它能找到 USB ID 被改过的 AIOC |
| aioc-util 报 `module 'hid' has no attribute 'Device'` / `No module named 'hid'` | Python 包装错了（Debian 的 `python3-hid`/`hidapi`） | 用虚拟环境并 `pip install hid`；卸载 apt 安装的包 **[Community]** |
| **rev 1.0 板升级到 1.4.x 后卡死、PTT 一直按下**，或在 Windows 虚拟机里音频报“代码 10” | 旧硬件上的固件缺陷（GitHub #120/#138） | 刷回 **v1.3.0** **[Community]** |
| Android：音频应用卡住、音量键失灵、AIOC 反复重连 | 出现在 **Android 11** 手机上；Android 12 及以上正常（GitHub #121） | 换一台手机或其他 Android 版本 **[Community]** |
| APRSdroid 不用 AIOC（其他应用正常） | 部分手机上 APRSdroid 对 USB 麦克风的缺陷（aprsdroid #149） | 试试“Lesser AudioSwitch”应用强制使用 USB 音频 **[Community]** |
| 插上 AIOC 后 S 表底噪升高 | 地环路 / 电脑噪声经 USB 线进入 | 用同轴线让天线离手台至少 1 米、加卡扣磁环、用 **USB 隔离器**，或让笔记本用电池供电 **[Community]** |
| 短波电台插上 AIOC 后有 S9 噪声 | 电脑/USB 噪声；部分电台（如 RT-950 Pro）非常敏感 | 磁环、USB 隔离器、换一台电脑；用另一台电台对比测试 **[Community]** |
| 完全识别不到设备 | **只能充电的 USB-C 线**，或板子停在 DFU 模式（没有固件） | 换数据线；刷固件（第 9 节） **[Community]** |

**[Community]** **自焊或维修板的接触/焊点故障查找表（来自 DL-Nordwest）：**
| 现象 | 检查 |
|---|---|
| 无法读写电台 | 驱动 / COM 口选择 |
| 能写入但 **读不出** 电台 | 2.5 mm **环（ring）** 的焊点 |
| 接收音频很小 | 3.5 mm **环（ring）** 的焊点；电脑音量 |
| 完全没有接收音频 | 2.5 mm **尖（tip）** / **套（sleeve）** 的焊点；电台音量；输入设备 |
| 电台一直发射 | 2.5 mm 和 3.5 mm 的 **套（sleeve）** 之间短路（或两个插头焊反了） |
| 只有拧着插头才正常 | TRS 焊点开裂：一边按压触点一边重新熔焊（第 8 节） |

---

## 9. 固件升级

### 9.1 版本 **[Official]**
从 https://github.com/skuep/AIOC/releases 下载 `aioc-fw-x.y.z.bin`
| 版本 | 日期 | 主要变化 |
|---|---|---|
| **v1.4.1** | 2025-09-27 | 修复 LED 闪烁速度和 LED 中断优先级 |
| **v1.4.0** | 2025-09-26 | 修复 macOS 发射卡顿；更大的串口缓冲区（手台刷固件）；支持硬件 rev 1.2；接收增益 1–16×；发射增强；**猎狐模式** |
| v1.3.0 | 2025-01-02 | HID 配置系统（新协议，旧脚本不可用）；虚拟 PTT / 虚拟 COS；硬件 COS 输入；更大的串口缓冲区 |
| v1.2.0 | 2023-03-19 | **CM108 PTT**；在线 DFU 升级；串口 PTT 改为 DTR=1 且 RTS=0 |

**硬件 rev 1.2 需要固件 ≥ 1.4.0。** **[Official]**

### 9.2 升级已是 ≥ 1.2.0 的固件（不用拆壳） **[Official]**
```bash
dfu-util -d 1209:7388 -a 0 -s 0x08000000:leave -D aioc-fw-1.4.1.bin
```
AIOC 会自动重启进入引导程序、刷写，然后自行重启。
- **Linux/macOS：** 安装 `dfu-util`（`apt install dfu-util` / `brew install dfu-util`）。可能需要 `sudo` 或加入 `plugdev` 组。
- **Windows：** dfu-util 需要给 DFU 接口安装 **libusb/WinUSB 驱动**。用 **Zadig** 给 AIOC 的 DFU 接口 /“STM32 BOOTLOADER”设备安装 WinUSB。（参见 AIOC README 中链接的教程：yeswolf.github.io/dfu。）
  **[Community]** Windows 11 上的 dfu-util 经常卡住或报 `LIBUSB_ERROR_NOT_SUPPORTED`（GitHub #28）。最简单的办法：用浏览器里的 AIOC Toolkit（见下文），或换一台 Linux 电脑或树莓派。
- **用 AIOC Toolkit 在浏览器中刷写（最简单，尤其适合 Windows）** **[Tool docs]** ：
  1. 在 https://g1lro.github.io/aioc-toolkit/ → **Flash Firmware** 选项卡的 **Latest Firmware** 框里，通过 **Download Firmware** 链接下载 `.bin`。浏览器不能直接读取 GitHub 发布的文件，所以要先保存文件再选择它。
  2. **先让 AIOC 进入引导模式**（9.3 第 1 步：短接排针最外侧的两个针脚，再插上 USB）。Toolkit 不会自己切换模式，AIOC 处于普通“DFU 运行时”模式时会阻止刷写。进入引导模式后它显示为 `0483:df11`。
  3. 连接，查看 **Device Status**，选择文件，点击 **Flash Firmware** 开始刷写并观察 **Log**。完成后去掉短接，重新插拔。
  只刷官方的 `aioc-fw-x.y.z.bin` 文件。刷写失败可以重复以上步骤恢复。
- **另一个浏览器刷写工具（原版 WebDFU）** **[Community, used in G1LRO's guide]** ：AIOC 处于引导模式时，打开 https://devanlai.github.io/webdfu/dfu-util/ → **Connect** → 选择 **STM32 Bootloader** → **Internal Flash** → 选择 `.bin` → **Download**。

### 9.3 首次刷写 / 救砖 **[Official]**
1. **短接电路板编程排针最外侧的两个针脚**（这是 BOOT 模式）。
2. 插上 USB-C。设备显示为 STM32 引导程序。
3. `dfu-util -a 0 -s 0x08000000:leave -D aioc-fw-x.y.z.bin`
4. 去掉短接，拔下再插上。

任何升级之后：**重新应用你的 aioc-util 设置**（它们会被清除）。

### 9.4 怎么知道我的固件版本？
USB 描述符里不报告固件版本。实用的判断方法：
- aioc-util 或 AIOC Toolkit 能连上 → ≥ 1.3.0。能读出音频设置 / 猎狐设置 → ≥ 1.4.0。
- 不确定的话，直接刷最新版（9.2）。这是解决大多数问题的推荐做法。

---

## 10. 常见问题（供 AI 助手直接使用）

**问：需要装驱动吗？**
不需要。Windows 10/11、Linux 和 macOS 都用系统自带的 USB 音频和 CDC 串口驱动。只有在 Windows 上升级固件时才需要 WinUSB 驱动（Zadig）。

**问：哪个 COM 口是它？**
在设备管理器 → 端口 中观察，拔下 AIOC 再插上，新出现的 COMx 就是 AIOC。Linux：`/dev/ttyACM0`（装了 udev 规则后也可用 `/dev/aioc`）。macOS：`/dev/cu.usbmodem…`。

**问：写频和数字模式能用同一根线吗？**
可以。串口负责写频，声卡负责数字模式。只是不要让两个软件同时占用同一个 COM 口。

**问：能用在车台/基地台上吗？**
只有电台带 K1 类接口，或用转接线接到它的数据口/话筒口才行。在硬件 rev 1.2 上，线路电平输入请开启 `--audio-tx-boost on`，线路电平输出请调高接收增益。

**问：能在树莓派上用吗？**
能。Direwolf、AllStarLink 3、SvxLink、Pat、QtSoundModem 和 LinBPQ 都能在树莓派 OS 上运行。使用 CM108 PTT 和 udev 规则。

**问：能用 iPhone/iPad 吗？**
部分可以。iOS 只把 AIOC 识别为声卡。**RadioMail**（Winlink）和 **Packet Commander** 已在 AIOC 固件 1.4.1 + 开启 **虚拟 PTT** 的情况下验证可用（5.16 节）。在 iOS 上无法用 CHIRP 写频，也无法使用串口或 CM108 PTT。

**问：能用电脑通话（语音）吗？**
能。在 VoIP 或联网应用（AllStarLink、SvxLink、EchoLink、Mumble 桥接）里把 AIOC 选为麦克风/扬声器即可。语音 PTT 需要 CM108/串口控制或 VPTT。

**问：我的电台有两个 PTT（双段手台）？**
PTT1 默认是 CM108 GPIO3/串口，PTT2 是 CM108 GPIO4。用 `--swap-ptt` 或 `--ptt2` 修改。

**问：支持 9600 波特分组吗？**
通过 K1 接口不支持（音频经过滤波）。请用 1200 波特 AFSK 或 VARA FM 窄带。

---

## 11. 参考链接
- AIOC 项目（硬件、固件、README）：https://github.com/skuep/AIOC
- AIOC 发布版本：https://github.com/skuep/AIOC/releases
- AIOC Discord：见 GitHub README 中的链接
- aioc-util（命令行）：https://github.com/hrafnkelle/aioc-util · 网页版：https://aioc-util.tf3hr.net/
- G1LRO 的 AIOC + ASL3 教程（最新）：https://g1lro.uk/?p=1593 · 旧版教程：https://g1lro.uk/?p=676 · 脚本：https://github.com/G1LRO/AIOC-ASL3-Config
- **AIOC Toolkit（在浏览器中配置 + 刷固件）：** https://g1lro.github.io/aioc-toolkit/ · 源码：https://github.com/G1LRO/aioc-toolkit
- 较早的浏览器工具：G1LRO 配置页 https://g1lro.github.io/aioc-util/ · WebDFU 刷写工具 https://devanlai.github.io/webdfu/dfu-util/
- AllStarLink 论坛，AIOC 替代 CM108：https://community.allstarlink.org/t/aioc-now-working-well-as-an-alternative-to-cm108-to-make-a-node-without-soldering/21225
- M0AWS 用 AIOC 搭建 AllStar 节点：https://m0aws.co.uk/?cat=408
- DL-Nordwest AIOC 系列（德语），第 4 部分故障排查：https://dl-nordwest.com/index.php/2024/09/22/aioc-der-wunderadapter-fuer-handfunkgeraete-teil-4-fehlersuche/
- DigiPi + AIOC 修改方法（Google 群组）：https://groups.google.com/g/digipi/c/1NfZeLpsT4M
- AIOC GitHub issues（提问前先搜索）：https://github.com/skuep/AIOC/issues
- 视频：Ham Radio Dude（https://www.youtube.com/watch?v=xRCmXQYRLE0）、Temporarily Offline（https://www.youtube.com/watch?v=RZjoPNe634o）、AllStar 节点搭建（https://youtu.be/7LB6D2FLGZk 、https://youtu.be/k0iP4dECx6A）
- DL-Nordwest 四篇 AIOC 文章（德语）：见 AIOC README 中的链接
- Direwolf：https://github.com/wb2osz/direwolf
- CHIRP：https://chirpmyradio.com
- AllStarLink：https://www.allstarlink.org
- Winlink：https://winlink.org · Pat：https://getpat.io · VARA：https://rosmodem.wordpress.com
- APRSdroid：https://aprsdroid.org · YAAC：https://www.ka2ddo.org/ka2ddo/YAAC.html · Xastir：https://xastir.org
- SvxLink：https://www.svxlink.org · fldigi/NBEMS：http://www.w1hkj.org
- Quansheng Dock：https://github.com/nicsure/QuanshengDock · Egzumer 固件：https://github.com/egzumer/uv-k5-firmware-custom

---

## Appendix A — 零售商信息（待填写）
- **你出售的硬件版本：** `____`（rev 1.2 有接收增益、发射增强和硬件 COS；需要固件 ≥ 1.4.0）
- **预装固件：** `____`
- **外壳 / 特定电台的适配说明：** `____`
- **保修与售后联系方式：** `____`
- **随附配件（USB-C 线、磁环等）：** `____`
