#!/bin/bash
set -e

echo "🔍 Mencari file .cpp & .h di ReactCommon..."
find node_modules/react-native/ReactCommon -type f \( -name "*.cpp" -o -name "*.h" \) | while read file; do
  # Tambahkan include <optional> jika belum ada
  if ! grep -q "<optional>" "$file"; then
    sed -i '' '1i\
#include <optional>
' "$file"
    echo "✅ Tambah <optional> di $file"
  fi

  # Tambahkan include <memory> jika belum ada
  if ! grep -q "<memory>" "$file"; then
    sed -i '' '1i\
#include <memory>
' "$file"
    echo "✅ Tambah <memory> di $file"
  fi

  # Ganti *ptr != nullptr jadi bool(*ptr)
  sed -i '' 's/\*config != nullptr/bool(*config)/g' "$file"
done

echo "⚙️ Memastikan semua Pods pakai C++17..."
PODFILE="ios/Podfile"
if ! grep -q "CLANG_CXX_LANGUAGE_STANDARD" "$PODFILE"; then
cat <<'EOF' >> "$PODFILE"

post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
      config.build_settings['CLANG_CXX_LIBRARY'] = 'libc++'
    end
  end
end
EOF
fi

echo "🧹 Bersihkan DerivedData & reinstall Pods..."
rm -rf ~/Library/Developer/Xcode/DerivedData
cd ios && rm -rf Pods && pod install && cd ..

echo "✅ Patch selesai. Silakan jalankan: npx react-native run-ios"
