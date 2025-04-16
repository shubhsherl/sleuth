.PHONY: dev build package clean

# Development build
dev:
	pnpm run dev --verbose

# Production build
build:
	pnpm run build
	zip -r build/sleuth-prod.zip build/chrome-mv3-prod

# Package the extension
package:
	pnpm run package

# Clean build artifacts
clean:
	rm -rf build/
	rm -rf .plasmo/
