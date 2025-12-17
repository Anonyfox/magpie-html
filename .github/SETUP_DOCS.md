# Documentation Setup

## Enabling GitHub Pages

Once the repository is created on GitHub:

### 1. Enable the GitHub Actions Workflow

Rename the workflow file:
```bash
mv .github/workflows/docs.yml.disabled .github/workflows/docs.yml
git add .github/workflows/docs.yml
git commit -m "Enable documentation deployment"
git push
```

### 2. Configure GitHub Pages

1. Go to repository **Settings** → **Pages**
2. Under **Source**, select: **GitHub Actions**
3. The documentation will be automatically deployed on every push to `main`

### 3. Access Documentation

After the first deployment, your docs will be available at:
- **https://anonyfox.github.io/magpie-html**

## Local Development

Generate and preview documentation locally:

```bash
# Generate documentation
npm run docs

# Serve documentation locally
npm run docs:serve
# Then open http://localhost:3000
```

## Customization

- **typedoc.json** - TypeDoc configuration
- **typedoc-custom.css** - Custom styling (brand colors, spacing)

The documentation is automatically generated from your TSDoc comments in the code.

