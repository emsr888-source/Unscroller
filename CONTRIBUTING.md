# Contributing to Unscroller

Thank you for your interest in contributing! This document provides guidelines for contributing to Unscroller.

## Getting Started

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/your-username/unscroller.git
   cd unscroller
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

1. Make your changes in the appropriate directory:
   - `apps/mobile/` - React Native app
   - `apps/desktop/` - Electron app
   - `apps/backend/` - NestJS backend
   - `packages/policy-engine/` - Core policy compiler
   - `policy/` - Provider rules

2. **Test your changes**:
   ```bash
   npm run lint
   npm run test
   npm run build
   ```

3. **Commit with clear messages**:
   ```bash
   git commit -m "feat: add new provider support for LinkedIn"
   ```

   Use conventional commit format:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `refactor:` - Code refactoring
   - `test:` - Adding tests
   - `chore:` - Maintenance tasks

4. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a Pull Request** on GitHub

## Code Style

- **TypeScript**: Use strict mode
- **React**: Functional components with hooks
- **Naming**:
  - Components: PascalCase
  - Functions/variables: camelCase
  - Constants: UPPER_SNAKE_CASE
- **Files**: kebab-case for utilities, PascalCase for components

### Linting

```bash
npm run lint
```

Auto-fix issues:
```bash
npm run lint -- --fix
```

## Adding a New Provider

1. **Update policy.json**:
   ```json
   "linkedin": {
     "start": "https://www.linkedin.com/messaging/",
     "allow": ["/messaging", "/in/"],
     "block": ["/feed"],
     "dom": {
       "hide": ["a[href='/feed']"]
     },
     "quick": {
       "dm": "https://www.linkedin.com/messaging/",
       "profile": "https://www.linkedin.com/in/"
     }
   }
   ```

2. **Add provider to mobile** (`apps/mobile/src/constants/providers.ts`):
   ```typescript
   {
     id: 'linkedin',
     name: 'LinkedIn',
     icon: '💼',
     color: '#0077B5',
   }
   ```

3. **Add provider to desktop** (`apps/desktop/src/renderer/app.ts`)

4. **Test**:
   - Verify blocking works
   - Check quick actions
   - Test on all platforms

5. **Update docs**:
   - Add to README.md
   - Update FEATURES.md

## Pull Request Guidelines

- **Title**: Clear and descriptive
- **Description**:
  - What changed?
  - Why was it necessary?
  - How was it tested?
- **Screenshots**: If UI changes, include screenshots
- **Breaking changes**: Clearly note any breaking changes
- **Tests**: Add tests if applicable

### PR Checklist

- [ ] Code follows project style guide
- [ ] Tests pass (`npm run test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Documentation updated
- [ ] Commit messages are clear
- [ ] No sensitive data (API keys, secrets) committed

## Testing

### Unit Tests

```bash
cd packages/policy-engine
npm test
```

### Integration Tests

```bash
cd apps/backend
npm test
```

### Manual Testing

- Test on iOS simulator
- Test on Android emulator
- Test desktop app
- Verify policy enforcement

## Reporting Issues

Use GitHub Issues with:
- **Bug reports**: Steps to reproduce, expected vs actual behavior
- **Feature requests**: Use case, proposed solution
- **Questions**: Tag with `question` label

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- No harassment or discrimination

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Unscroller!** 🙏
