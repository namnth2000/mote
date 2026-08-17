# Mote - Deployment Guide

> Mục tiêu: deploy Mote theo thứ tự đơn giản, ít chi phí và chỉ trả tiền cho store khi thật sự cần.

## 1. Deployment Strategy

```text
Web / PWA
↓
Windows
↓
Android APK
↓
Google Play
↓
iOS App Store
```

Nguyên tắc:

- Launch Web trước để validation.
- Không mua tài khoản store ngay từ đầu.
- Windows và Android có thể phát hành trực tiếp từ website.
- iOS giai đoạn đầu dùng Web/PWA.
- Chỉ phát hành native iOS khi đã có người dùng thật.


# 2. Deploy Web MVP lên Cloudflare Pages

## 2.1. Mục tiêu production

Production URL của Mote:

```text
https://mote.namnth.com
```

Mote được host tại root của domain này, vì vậy mọi production build phải dùng:

```text
--base-href /
```

Không dùng `--base-href /mote/`. Giá trị `/mote/` chỉ phù hợp khi deploy vào
subpath như `username.github.io/mote/`.

## 2.2. Phân biệt hai thư mục `web` và `build/web`

```text
web/        Source template, manifest, favicon và SQLite Web asset.
build/web/  Website đã compile, sẵn sàng upload lên hosting.
```

Cloudflare Pages phải nhận **nội dung của `build/web/`**, không phải thư mục
`web/` ở root project.

Sau một build hợp lệ, `build/web/` cần có ít nhất:

```text
index.html
main.dart.js
flutter_bootstrap.js
flutter_service_worker.js
manifest.json
sqlite3.wasm
drift_worker.dart.js
assets/
icons/
```

## 2.3. Lệnh build production

Chạy từ root repository:

```bash
flutter clean
flutter pub get
dart format --output=none --set-exit-if-changed .
flutter analyze
flutter test
flutter build web --release --base-href /
```

Nếu chỉ cần build nhanh sau khi code đã được kiểm tra:

```bash
flutter pub get
flutter build web --release --base-href /
```

Output cần deploy:

```text
build/web/
```

Có thể kiểm tra local trước khi upload:

```bash
python -m http.server 8080 --directory build/web
```

Sau đó mở:

```text
http://localhost:8080
```

## 2.4. Chọn cách deploy

| Cách | Phù hợp khi | Khuyến nghị |
| --- | --- | --- |
| Manual Direct Upload | Muốn đưa MVP lên nhanh từ máy local | Tốt cho lần deploy đầu |
| GitHub Actions + Wrangler | Muốn tự build, test và deploy khi push `main` | **Khuyến nghị cho Mote** |
| Cloudflare Git Integration | Muốn Cloudflare tự build repository | Dùng được, nhưng Flutter SDK phải được cài trong build |

Cloudflare không cho chuyển một Pages project đã tạo bằng Direct Upload sang
Git Integration, và cũng không cho chuyển project Git Integration sang Direct
Upload. Tuy nhiên, project Direct Upload vẫn có thể nhận deployment tự động từ
GitHub Actions qua Wrangler.

## 2.5. Cách A - Manual Direct Upload

### Bước 1 - Build trên máy local

```bash
flutter build web --release --base-href /
```

### Bước 2 - Tạo Pages project

1. Mở Cloudflare Dashboard.
2. Chọn **Workers & Pages**.
3. Chọn **Create application**.
4. Chọn **Pages** rồi chọn **Drag and drop your files**.
5. Đặt tên project, ví dụ `mote`.
6. Kéo nguyên thư mục `build/web` vào vùng upload.
7. Chọn **Deploy site**.

Nếu upload file ZIP, hãy ZIP **nội dung bên trong** `build/web`, để
`index.html` nằm ở root của ZIP. Không tạo cấu trúc `web/index.html` bên trong
ZIP.

### Bước 3 - Các lần deploy tiếp theo

1. Build lại `build/web`.
2. Mở Pages project trong Cloudflare.
3. Chọn **Create deployment**.
4. Upload lại toàn bộ `build/web`.

Không copy riêng `main.dart.js`, vì Flutter build còn phụ thuộc service worker,
asset manifest, SQLite WASM, Drift worker và các file version đi kèm.

## 2.6. Cách B - GitHub Actions build và deploy bằng Wrangler

Đây là cách khuyến nghị. GitHub Actions cài đúng Flutter version, chạy test,
build `build/web`, sau đó Wrangler upload output lên Cloudflare Pages.

### Bước 1 - Tạo Cloudflare Pages project

Tạo project `mote` bằng Direct Upload như phần 2.5 và deploy một lần, hoặc tạo
project bằng Wrangler:

```bash
npx wrangler login
npx wrangler pages project create mote
```

`mote` ở đây là **Pages project name**, không phải custom domain. Nếu project
thực tế có tên khác, thay `mote` trong workflow bên dưới.

### Bước 2 - Tạo API token

Trong Cloudflare Dashboard:

1. Mở **My Profile > API Tokens**.
2. Chọn **Create Token**.
3. Cấp quyền Cloudflare Pages Edit cho account chứa Pages project.
4. Lưu token ngay khi Cloudflare hiển thị.
5. Lấy Account ID trong Cloudflare Dashboard.

Không commit API token hoặc Account ID trực tiếp vào workflow.

### Bước 3 - Thêm GitHub Actions secrets

Trong GitHub repository `namnth2000/mote`:

```text
Settings
> Secrets and variables
> Actions
> New repository secret
```

Tạo hai secret:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

### Bước 4 - Tạo workflow

Tạo file:

```text
.github/workflows/deploy-cloudflare-pages.yml
```

Nội dung:

```yaml
name: Deploy Mote to Cloudflare Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  deployments: write

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout source
        uses: actions/checkout@v4

      - name: Set up Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: "3.29.3"
          channel: stable
          cache: true

      - name: Install dependencies
        run: flutter pub get

      - name: Analyze
        run: flutter analyze

      - name: Test
        run: flutter test

      - name: Build Web release
        run: flutter build web --release --base-href /

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy build/web --project-name=mote --branch=main
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

Workflow chạy tự động khi push vào `main`. Có thể chạy thủ công tại GitHub:

```text
Actions > Deploy Mote to Cloudflare Pages > Run workflow
```

Nếu workflow báo không tìm thấy Pages project, kiểm tra lại giá trị
`--project-name=mote` và Cloudflare account chứa project.

## 2.7. Cách C - Cloudflare Git Integration và Build Command

### Có dùng được không?

Có, nhưng Cloudflare Pages build image không cài sẵn Flutter SDK. Build command
phải tải đúng Flutter SDK trước khi chạy `flutter build`. Điều này làm build đầu
tiên chậm hơn và phụ thuộc vào việc tải Flutter từ GitHub.

Với Mote, GitHub Actions ở phần 2.6 ổn định và dễ debug hơn. Chỉ dùng cách này
khi muốn toàn bộ CI chạy trong Cloudflare.

### Cấu hình Git Integration

1. Mở **Workers & Pages > Create application > Pages**.
2. Chọn **Connect to Git**.
3. Chọn GitHub và repository `namnth2000/mote`.
4. Chọn production branch `main`.
5. Cấu hình build như sau:

```text
Framework preset: None
Root directory: để trống, mặc định là repository root
Build output directory: build/web
```

Build command:

```bash
if [ ! -d "$HOME/flutter" ]; then git clone https://github.com/flutter/flutter.git --depth 1 --branch 3.29.3 "$HOME/flutter"; fi && export PATH="$HOME/flutter/bin:$PATH" && flutter config --enable-web && flutter pub get && flutter analyze && flutter test && flutter build web --release --base-href /
```

Các file bắt buộc cho Drift Web phải được commit vào Git:

```text
lib/core/database/app_database.g.dart
web/sqlite3.wasm
web/drift_worker.dart.js
```

Không commit `build/web`. Cloudflare sẽ tạo thư mục này sau khi build.

Nếu build timeout hoặc tải Flutter SDK không ổn định, chuyển sang GitHub Actions
+ Wrangler ở phần 2.6. Vì Pages project Git Integration không thể đổi sang Direct
Upload, hãy tạo Pages project mới nếu muốn đổi mô hình hoàn toàn.

## 2.8. Gắn custom domain `mote.namnth.com`

Thực hiện sau khi Pages project đã có ít nhất một deployment thành công:

1. Mở **Workers & Pages**.
2. Chọn Pages project của Mote.
3. Chọn **Custom domains**.
4. Chọn **Set up a custom domain**.
5. Nhập `mote.namnth.com`.
6. Chọn **Continue** rồi **Activate domain**.

Nếu zone `namnth.com` đang được quản lý trong cùng Cloudflare account,
Cloudflare thường tự tạo DNS record cần thiết. Kiểm tra lại tại **DNS > Records**:

```text
Type: CNAME
Name: mote
Target: <pages-project>.pages.dev
Proxy status: Proxied
```

Nếu DNS được quản lý ở nơi khác, tạo CNAME tương tự tại DNS provider. Luôn thêm
custom domain trong Pages dashboard trước, không chỉ tự tạo CNAME, để Cloudflare
cấp certificate và liên kết hostname đúng với Pages project.

Chờ trạng thái custom domain chuyển sang **Active**, sau đó kiểm tra:

```text
https://mote.namnth.com
```

## 2.9. PWA và manifest

File nguồn:

```text
web/manifest.json
```

Vì Mote chạy tại root của `mote.namnth.com`, cấu hình phù hợp là:

```json
{
  "name": "Mote - Markdown Notes",
  "short_name": "Mote",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FAFAF8",
  "theme_color": "#F4C95D"
}
```

Sau mỗi deployment lớn, nếu browser vẫn hiển thị bản cũ, đóng toàn bộ tab Mote
rồi mở lại hoặc clear site data/service worker trước khi kết luận deployment lỗi.

## 2.10. Production smoke test

Sau mỗi deployment, kiểm tra trực tiếp trên `https://mote.namnth.com`:

- Trang mở không trắng và không có lỗi console.
- Logo, icon và font tải thành công.
- Tạo note, sửa note và reload không mất dữ liệu.
- Search, Trash, Restore và Hidden hoạt động.
- Markdown, table, code block và Mermaid render đúng.
- Copy và bốn lựa chọn export hoạt động.
- Light/Dark và VI/EN persist qua reload.
- Desktop và Mobile Web không bị horizontal overflow.
- PWA có thể Add to Home Screen trên thiết bị hỗ trợ.

## 2.11. Tài liệu tham khảo

- Cloudflare Pages Direct Upload:
  https://developers.cloudflare.com/pages/get-started/direct-upload/
- Cloudflare Pages Git Integration:
  https://developers.cloudflare.com/pages/configuration/git-integration/
- Cloudflare Pages build configuration:
  https://developers.cloudflare.com/pages/configuration/build-configuration/
- Cloudflare Pages custom domains:
  https://developers.cloudflare.com/pages/configuration/custom-domains/
- Cloudflare Wrangler Action:
  https://github.com/cloudflare/wrangler-action


# 3. Windows

## Build

Trên Windows:

```bash
flutter clean
flutter pub get
flutter build windows --release
```

Output thường nằm trong:

```text
build/windows/x64/runner/Release/
```

## Package

Có 2 lựa chọn:

### Portable

Zip toàn bộ thư mục release:

```text
Mote-Windows-x64.zip
```

Người dùng tải về, giải nén và chạy.

### Installer

Tạo installer:

```text
MoteSetup.exe
```

Có thể dùng tool đóng gói Windows phù hợp ở bước sau.

MVP có thể bắt đầu bằng bản portable để giảm công việc.

## Distribution

Upload release lên:

```text
GitHub Releases
```

Sau đó trên website:

```text
mote.namnth.com/download
```

có nút:

```text
Download for Windows
```

## Version

Đặt tên file rõ ràng:

```text
Mote-1.0.0-Windows-x64.zip
```

## Test

Kiểm tra:

- Windows 11
- Create/Edit/Delete note
- Local database
- Restart app không mất dữ liệu
- Image paste/drag-drop
- Export Markdown
- Scrollspy
- Dark mode

## Chi phí

```text
0 đồng
```

nếu phát hành trực tiếp qua GitHub Releases hoặc website.

# 4. Android APK

## Build

```bash
flutter clean
flutter pub get
flutter build apk --release
```

Output:

```text
build/app/outputs/flutter-apk/app-release.apk
```

Đổi tên:

```text
Mote-1.0.0-Android.apk
```

## Signing

Trước khi phát hành public, tạo Android signing key và cấu hình release signing.

Không commit:

```text
keystore
password
key.properties
```

vào public repository.

Dùng `.gitignore`.

## Distribution

Upload APK lên:

- GitHub Releases
- Website Mote

Ví dụ:

```text
mote.namnth.com/download/android
```

## User Flow

```text
Download APK
↓
Allow install from browser/file manager
↓
Install Mote
```

Android có thể hiện cảnh báo vì app không được cài từ Google Play.

## Test

Kiểm tra ít nhất:

- Android phone thật
- Create/Edit/Search note
- Local storage
- App restart
- Theme
- Mobile editor
- Clipboard
- Image
- Export

## Chi phí

```text
0 đồng
```

nếu phát hành APK trực tiếp.


# 5. Google Play

Chỉ làm khi:

- Mote đã có người dùng.
- APK hoạt động ổn định.
- Muốn distribution chuyên nghiệp hơn.
- Muốn update dễ hơn cho người dùng.

## Build

Google Play ưu tiên Android App Bundle:

```bash
flutter build appbundle --release
```

Output:

```text
build/app/outputs/bundle/release/app-release.aab
```

## Chuẩn bị

Cần:

- App icon
- App name
- Description
- Screenshots
- Privacy Policy
- Version
- Release notes
- Signing configuration

## Release Flow

```text
Flutter
↓
Build AAB
↓
Google Play Console
↓
Internal testing
↓
Closed/Open testing nếu cần
↓
Production
```

## Chi phí

Phát sinh phí đăng ký Google Play Developer.

Không cần trả phí này trong giai đoạn MVP nếu vẫn phân phối APK trực tiếp.


# 6. iOS giai đoạn đầu - PWA

Không phát hành native iOS ngay.

Người dùng iPhone:

```text
Safari
↓
mote.namnth.com
↓
Share
↓
Add to Home Screen
```

Khi cấu hình PWA đúng, Mote có thể:

- Có app icon.
- Mở dạng standalone.
- Không hiện thanh browser như tab thông thường.

Đây là lựa chọn mặc định cho iOS trong giai đoạn validation.

## Chi phí

```text
0 đồng
```


# 7. Native iOS sau validation

Chỉ làm khi:

- Web/PWA đã có người dùng thật.
- Có nhu cầu native iOS rõ ràng.
- Mote đủ ổn định để phát hành trên App Store.

## Yêu cầu

Cần:

- macOS
- Xcode
- Flutter iOS environment
- Apple Developer account
- App signing
- App Store Connect

## Build

```bash
flutter clean
flutter pub get
flutter build ios --release
```

Hoặc archive bằng Xcode để upload App Store.

## Release Flow

```text
Flutter
↓
Xcode Archive
↓
App Store Connect
↓
TestFlight
↓
App Review
↓
App Store
```

## TestFlight

Trước khi public:

```text
Internal Test
↓
TestFlight
↓
Fix
↓
Production
```

## Chi phí

Phát sinh phí Apple Developer Program theo năm.

Không cần trả khoản này ở giai đoạn MVP.


# 8. Release Versioning

Dùng Semantic Versioning:

```text
MAJOR.MINOR.PATCH
```

Ví dụ:

```text
1.0.0
1.1.0
1.1.1
```

Trong Flutter:

```yaml
version: 1.0.0+1
```

Trong đó:

```text
1.0.0 = version name
1 = build number
```

Mỗi release phải tăng build number.


# 9. Release Checklist

Trước mỗi release:

- [ ] `flutter analyze` không có lỗi nghiêm trọng.
- [ ] Test các chức năng chính.
- [ ] Test migration database nếu schema thay đổi.
- [ ] Không mất note cũ sau update.
- [ ] Kiểm tra Light/Dark.
- [ ] Kiểm tra VI/EN.
- [ ] Kiểm tra Markdown render.
- [ ] Kiểm tra Table.
- [ ] Kiểm tra Code Block.
- [ ] Kiểm tra Mermaid.
- [ ] Kiểm tra Scrollspy Desktop.
- [ ] Kiểm tra Search.
- [ ] Kiểm tra Trash.
- [ ] Kiểm tra Hidden.
- [ ] Kiểm tra Export.
- [ ] Update version.
- [ ] Update release notes.
- [ ] Không commit secrets/signing keys.


# 10. Suggested Release Flow

## MVP

```text
Develop
↓
Manual QA
↓
Web/PWA
↓
mote.namnth.com
```

## Sau khi Web ổn

```text
Web
+
Windows Release
+
Android APK
```

Tất cả vẫn có thể phát hành mà chưa cần app store.

## Khi có người dùng thật

```text
Google Play
↓
Native iOS
↓
App Store
```


# 11. Cost Strategy

| Platform | Cách phát hành ban đầu | Chi phí thêm |
| --- | --- | --- |
| Web | Cloudflare Pages | Free |
| PWA iOS/Android | Web | Free |
| Windows | GitHub Releases / Website | Free |
| Android | APK direct download | Free |
| Google Play | Store | Paid account |
| iOS native | App Store | Paid developer account |

Mục tiêu giai đoạn đầu:

```text
Web + PWA + Windows + Android APK
=
Gần như 0 chi phí deployment
```

Chỉ trả phí store khi distribution thực sự tạo thêm giá trị.


# 12. Deployment Order

```text
1. Web
2. PWA
3. Windows
4. Android APK
5. Google Play
6. Native iOS
7. App Store
```

Không làm tất cả cùng lúc.

Web là production target đầu tiên và là nơi validation Mote trước khi đầu tư thời gian và chi phí cho các store.
