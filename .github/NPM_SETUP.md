# npm Publishing Setup

## 🔑 One-Time Setup: Add NPM Token to GitHub

### 1. Generate an npm Access Token

1. Go to [npmjs.com](https://www.npmjs.com/)
2. Click your profile → **Access Tokens**
3. Click **Generate New Token** → **Classic Token**
4. Select **Automation** type (allows CI/CD publishing)
5. Copy the token (starts with `npm_...`)

### 2. Add Token to GitHub Secrets

1. Go to your GitHub repo: **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `NPM_TOKEN`
4. Value: Paste your npm token
5. Click **Add secret**

## 📦 Publishing a New Version

### Quick Release (Easiest!)

Just run one command and everything happens automatically:

```bash
# Patch release (0.0.1 → 0.0.2) - bug fixes
npm run release:patch

# Minor release (0.0.1 → 0.1.0) - new features
npm run release:minor

# Major release (0.0.1 → 1.0.0) - breaking changes
npm run release:major
```

These commands will:
- ✅ Run all checks (typecheck, lint)
- ✅ Bump version in package.json
- ✅ Create git commit and tag
- ✅ Push everything to GitHub
- ✅ Trigger automated npm publish

### Manual Release (Advanced)

If you want more control over the commit message:

```bash
# Patch release (0.0.1 → 0.0.2)
npm version patch -m "Release v%s: bug fixes and improvements"

# Minor release (0.0.1 → 0.1.0)
npm version minor -m "Release v%s: new features"

# Major release (0.0.1 → 1.0.0)
npm version major -m "Release v%s: breaking changes"

# Push everything including tags
git push && git push --tags
```

The `npm version` command will:
- ✅ Update version in `package.json`
- ✅ Create a git commit
- ✅ Create a git tag (e.g., `v1.0.0`)

When you push the tag, GitHub Actions will:
- ✅ Run all checks (typecheck, lint, test)
- ✅ Build the package
- ✅ Publish to npm with provenance
- ✅ Create a GitHub release

### Manual Publishing (Local)

If you need to publish manually (not recommended):

```bash
npm run check    # Verify everything works
npm run build    # Build the package
npm publish      # Publish to npm
```

## 🔍 Verify Publication

After the workflow completes:
- Check npm: https://www.npmjs.com/package/magpie-html
- Check GitHub releases: https://github.com/Anonyfox/magpie-html/releases
- Test installation: `npm install magpie-html@latest`

## 🚨 Troubleshooting

**"401 Unauthorized"**
- Check that NPM_TOKEN secret is set correctly
- Verify token hasn't expired
- Ensure token has "Automation" permissions

**"403 Forbidden"**
- Check that package name isn't taken
- Verify you have publish rights to the package
- For scoped packages (@username/package), ensure proper access

**"Version already exists"**
- You can't republish the same version
- Bump the version and try again
- Use `npm version patch` to increment

## 📝 Best Practices

1. **Always use `npm version`** - Don't manually edit package.json
2. **Test locally first** - Run `npm run check && npm run build`
3. **Write meaningful commit messages** - They appear in GitHub releases
4. **Keep CHANGELOG.md updated** - Document what changed
5. **Use semantic versioning** - MAJOR.MINOR.PATCH
   - MAJOR: Breaking changes
   - MINOR: New features (backwards compatible)
   - PATCH: Bug fixes

## 🔐 Security: npm Provenance

This workflow uses `--provenance` flag which:
- ✅ Cryptographically links package to source code
- ✅ Shows GitHub repo on npm package page
- ✅ Verifies package wasn't tampered with
- ✅ Improves supply chain security

