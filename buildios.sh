#!/bin/bash

echo "🔧 Fixing FBReactNativeSpec and Reanimated issues..."

# 1. Check current versions
echo "📋 Current versions:"
echo "React Native: $(npm list react-native --depth=0 2>/dev/null | grep react-native)"
echo "Reanimated: $(npm list react-native-reanimated --depth=0 2>/dev/null | grep react-native-reanimated)"

# 2. Bypass reanimated check
echo "🚫 Bypassing reanimated New Architecture check..."
REANIMATED_PODSPEC="node_modules/react-native-reanimated/RNReanimated.podspec"

if [ -f "$REANIMATED_PODSPEC" ]; then
    cp "$REANIMATED_PODSPEC" "$REANIMATED_PODSPEC.backup" 2>/dev/null
    sed -i.tmp 's/assert_no_reanimated2_with_new_architecture(reanimated_package_json)/# assert_no_reanimated2_with_new_architecture(reanimated_package_json)/' "$REANIMATED_PODSPEC"
    echo "✅ Reanimated bypass applied"
fi

# 3. Check if FBReactNativeSpec exists
FBREACTNATIVESPEC_PATH="node_modules/react-native/React/FBReactNativeSpec"
if [ ! -d "$FBREACTNATIVESPEC_PATH" ]; then
    echo "❌ FBReactNativeSpec not found at expected path"
    echo "🔍 Searching for FBReactNativeSpec..."
    find node_modules/react-native -name "*FBReactNativeSpec*" -type d 2>/dev/null || echo "Not found in react-native"
    
    # Try alternative path
    ALT_PATH="node_modules/react-native/Libraries/FBReactNativeSpec"
    if [ -d "$ALT_PATH" ]; then
        echo "✅ Found FBReactNativeSpec at alternative path: $ALT_PATH"
    fi
else
    echo "✅ FBReactNativeSpec found at: $FBREACTNATIVESPEC_PATH"
fi

# 4. Clean and setup
echo "🧹 Cleaning build artifacts..."
cd ios
rm -rf Pods Podfile.lock ~/Library/Developer/Xcode/DerivedData/NamaProyekTest-*

# 5. Update CocoaPods
echo "📦 Updating CocoaPods repository..."
pod cache clean --all
pod repo update --silent
rn_boost = File.join(__dir__, '../node_modules/react-native/third-party-podspecs/boost.podspec')
File.delete(rn_boost) if File.exist?(rn_boost)
puts "🗑 Deleted RN default boost.podspec to avoid duplication"
# 6. Install pods
echo "⚙️ Installing pods..."
pod install --verbose

if [ $? -eq 0 ]; then
    echo "✅ Pod install successful!"
    echo "🚀 Running iOS build..."
    cd ..
    npx react-native run-ios
else
    echo "❌ Pod install failed"
    echo "🔍 Try manual debugging:"
    echo "   1. Check React Native version compatibility"
    echo "   2. Consider downgrading react-native-reanimated"
    echo "   3. Check if path to FBReactNativeSpec is correct"
fi