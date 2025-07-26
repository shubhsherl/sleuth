.PHONY: dev dev-firefox build build-firefox package package-firefox clean all

# Build all extensions
all: clean build build-firefox

# Development build
dev:
	pnpm run dev --verbose

dev-firefox:
	pnpm run dev:firefox --verbose

# Production build
build:
	pnpm run build
	# Create a zip with files at root level, not in a directory
	cd build/chrome-mv3-prod && zip -r ../sleuth-chrome-prod.zip *
	cd ../..

build-firefox:
	pnpm run build:firefox
	# Create a zip with files at root level, not in a directory
	cd build/firefox-mv2-prod && zip -r ../sleuth-firefox-prod.zip *
	cd ../..

# Package the extension
package:
	pnpm run package

package-firefox:
	pnpm run package:firefox

# Clean build artifacts
clean:
	rm -rf build/
	rm -rf .plasmo/
