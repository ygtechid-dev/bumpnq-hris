#!/bin/bash
set -e

FILE="node_modules/react-native/React/Views/RCTWrapperViewController.m"

# Pastikan patch-package terinstall
if ! npx --no-install patch-package --help >/dev/null 2>&1; then
  echo "📦 patch-package belum ada. Menginstall..."
  yarn add patch-package postinstall-postinstall --dev
  echo "⚙️ Menambahkan script postinstall ke package.json"
  if ! grep -q "\"postinstall\"" package.json; then
    # Tambahkan script postinstall
    tmpfile=$(mktemp)
    jq '.scripts.postinstall = "patch-package"' package.json > "$tmpfile" && mv "$tmpfile" package.json
  fi
fi

if [ ! -f "$FILE" ]; then
  echo "❌ File $FILE tidak ditemukan. Pastikan react-native sudah terinstall."
  exit 1
fi

# Tambahkan import UIKit kalau belum ada
if ! grep -q "<UIKit/UIKit.h>" "$FILE"; then
  echo "✅ Menambahkan import UIKit ke $FILE"
  sed -i '' '1i\
#import <UIKit/UIKit.h>
' "$FILE"
fi

# Tambahkan initWithCoder kalau belum ada
if ! grep -q "initWithCoder" "$FILE"; then
  echo "✅ Menambahkan initWithCoder ke $FILE"
  cat <<'EOF' >> "$FILE"

- (instancetype)initWithCoder:(NSCoder *)coder
{
  self = [super initWithCoder:coder];
  if (self) {
    _bridge = nil;
  }
  return self;
}
EOF
fi

# Buat patch package
npx patch-package react-native

echo "🎉 Fix RCTWrapperViewController selesai!"
