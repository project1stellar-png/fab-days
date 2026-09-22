# 晶圆厂日记 · Fab Days

一个像素风的半导体 CMP（化学机械研磨）工艺学习模拟。为了弄懂工艺工程师每天在做什么——怎么从数据里发现异常、怎么查原因、怎么验证——边玩边改出来的自学工具。

**在线试玩：** https://boisterous-marshmallow-041cc7.netlify.app （中文 / 日本語）

> 全部数值为教学用的设定，不是实际设备数据，也不是任何公司的工艺配方。

## 三个模式

| 模式 | 练什么 |
|---|---|
| 自主实验 | 自己调参数、换耗材、加工试片、量测、建立对照。先留基准、一次只改一项、重复确认、先核查量测。 |
| 剧情模式 | 六个固定案例：取证、提出假设、设计验证、纠正措施与再发防止。结案后有失分原因说明。 |
| 量产值班 | 两台机台连续生产。看 SPC 控制图发现“过程变了”，用有限的工时点确认原因，判定扣留批，管理耗材寿命。 |

另有：图表判读练习（九类现场常见图表，随机出题）、每关的参考解法、不剧透的“实验路径点评”、8D 报告练习模板（可导出）、FMEA 练习、术语手册（中 / 日 / 英）。

## 改版记录

游戏内的「改版记录」页（`changelog.html`）按“发现的现象 → 原因 → 对策 → 怎么确认”记录了每一版。每一条的起点都是试玩时遇到的一个具体问题，例如：

- 得了 70 分却不知道 30 分丢在哪里 → 逐项说明失分原因，实验后提示结果是否支持当前假设
- 一台机台换耗材后停产 6 天没被察觉 → 在四个位置显示“没有在生产、已停多少小时”
- 对话框打开时所有提示都看不到 → 提示气泡被模态层遮挡，修正并系统排查同类问题

## 关于开发方式

代码的编写和自动测试使用了 AI 工具（Claude Code）。问题由作者在试玩中发现，改进方向由作者决定，改完后由作者试玩确认。

## 技术

纯静态网页（HTML / CSS / JavaScript），无框架、无后端、无外部依赖；进度只保存在浏览器本地。可作为 PWA 离线使用。

本仓库是部署产物：脚本为压缩后的单行格式。修改后需要把 `sw.js` 里的 `CACHE` 版本号加一，离线缓存才会更新。

---

## 日本語

半導体の CMP（化学機械研磨）工程を題材にした、ドット絵の学習用シミュレーションです。プロセスエンジニアが日々何をしているのか——データからどう異常を見つけ、どう原因を調べ、どう検証するのか——を理解するために、自分で遊びながら改善してきた自習用ツールです。

- **自主実験**：パラメータ調整、消耗品交換、処理、測定、比較。ベースラインを先に取る、条件は一つずつ変える、繰り返して確認する、まず測定系を確認する。
- **ストーリーモード**：6 つのケース。エビデンス取得、仮説、検証設計、是正処置と再発防止。
- **量産シフト**：SPC 管理図で工程の変化を見つけ、限られた工数で原因を確認し、ホールドロットを判定する。

数値はすべて学習用の設定であり、実際の装置データではありません。コードの作成と自動テストには AI ツールを活用しています。問題の発見と改善方針の決定は作者が行いました。改版の経緯はゲーム内の「改版履歴」をご覧ください。

## English

A pixel-art learning simulation of the semiconductor CMP (chemical mechanical planarization) process, built for self-study: how a process engineer spots a change in the data, finds the cause, and verifies the fix. Three modes (hands-on lab, case stories, production shift with SPC charts), plus reference solutions, a step-by-step review of your own experiments, and an 8D report template.

All numbers are fictional teaching values, not real equipment data. The code and automated tests were written with AI tools; the author found the problems by play-testing and decided how to fix them. See the in-game changelog for the history.
