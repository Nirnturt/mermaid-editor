# Contributing | 贡献指南

[English](#english) | [中文](#chinese)

---

## English

Thank you for your interest in contributing to Mermaid Editor! This document provides guidelines for contributing to the project.

### 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/mermaid-editor.git
   cd mermaid-editor
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Start the development server**:
   ```bash
   npm run dev
   ```

### 🔧 Development Guidelines

#### Code Style
- Follow TypeScript best practices
- Use ESLint rules provided in the project
- Format code consistently (consider using Prettier)
- Add meaningful comments for complex logic
- Use semantic commit messages

#### Commit Messages
Follow the conventional commit format:
```
type(scope): description

Examples:
feat(export): add PDF export functionality
fix(editor): resolve syntax highlighting issue
docs(readme): update installation instructions
style(ui): improve mobile responsive design
```

#### Branch Naming
- `feat/feature-name` - for new features
- `fix/bug-description` - for bug fixes
- `docs/documentation-update` - for documentation updates
- `refactor/component-name` - for code refactoring

### 🐛 Bug Reports

When reporting bugs, please include:

1. **Clear description** of the issue
2. **Steps to reproduce** the problem
3. **Expected behavior** vs actual behavior
4. **Environment details**:
   - Browser and version
   - Operating system
   - Node.js version (if relevant)
5. **Screenshots or error logs** if applicable

### ✨ Feature Requests

For feature requests, please:

1. **Check existing issues** to avoid duplicates
2. **Describe the feature** clearly
3. **Explain the use case** and benefits
4. **Provide mockups or examples** if possible

### 🔀 Pull Requests

#### Before Creating a Pull Request
- Ensure your code follows the style guidelines
- Test your changes thoroughly
- Update documentation if necessary
- Add or update tests for new features

#### Pull Request Process
1. Create a new branch for your changes
2. Make your changes with clear, focused commits
3. Push your branch to your fork
4. Create a pull request with:
   - Clear title and description
   - Reference to related issues
   - Screenshots for UI changes
   - Test instructions

#### Review Process
- Maintainers will review your PR
- Address any feedback or requested changes
- Once approved, your PR will be merged

### 🧪 Testing

Currently, the project doesn't have a comprehensive testing framework, but this is planned for future development. When contributing:

- Test your changes manually across different browsers
- Verify mobile responsiveness
- Test export functionality with various diagram types
- Check theme switching and internationalization

### 📚 Documentation

Help improve documentation by:
- Fixing typos or unclear explanations
- Adding examples for complex features
- Translating content to other languages
- Creating tutorials or guides

### 🎨 Design Guidelines

When contributing UI/UX improvements:
- Follow the existing design system
- Ensure accessibility standards are met
- Test on both desktop and mobile devices
- Consider both light and dark themes
- Maintain consistency with shadcn/ui components

### 💬 Communication

- Use GitHub Issues for bug reports and feature requests
- Be respectful and constructive in discussions
- Help other contributors when possible

---

## Chinese

感谢您对 Mermaid Editor 项目的贡献兴趣！本文档提供了参与项目贡献的指导方针。

### 🚀 开始贡献

1. **Fork 项目仓库** 到您的 GitHub 账户
2. **克隆您的 fork** 到本地：
   ```bash
   git clone https://github.com/your-username/mermaid-editor.git
   cd mermaid-editor
   ```
3. **安装依赖**：
   ```bash
   npm install
   ```
4. **启动开发服务器**：
   ```bash
   npm run dev
   ```

### 🔧 开发规范

#### 代码风格
- 遵循 TypeScript 最佳实践
- 使用项目提供的 ESLint 规则
- 保持代码格式一致性（建议使用 Prettier）
- 为复杂逻辑添加有意义的注释
- 使用语义化的提交信息

#### 提交信息格式
遵循约定式提交格式：
```
type(scope): description

示例：
feat(export): 添加 PDF 导出功能
fix(editor): 修复语法高亮问题
docs(readme): 更新安装说明
style(ui): 改进移动端响应式设计
```

#### 分支命名
- `feat/feature-name` - 新功能
- `fix/bug-description` - 错误修复
- `docs/documentation-update` - 文档更新
- `refactor/component-name` - 代码重构

### 🐛 错误报告

报告错误时，请包含：

1. **清晰的问题描述**
2. **重现步骤**
3. **预期行为** vs 实际行为
4. **环境详情**：
   - 浏览器及版本
   - 操作系统
   - Node.js 版本（如果相关）
5. **截图或错误日志**（如果适用）

### ✨ 功能请求

提出功能请求时，请：

1. **检查现有 issues** 避免重复
2. **清晰描述功能**
3. **解释使用场景** 和好处
4. **提供原型图或示例**（如果可能）

### 🔀 Pull Request

#### 创建 Pull Request 前
- 确保代码遵循风格指导
- 彻底测试您的更改
- 必要时更新文档
- 为新功能添加或更新测试

#### Pull Request 流程
1. 为您的更改创建新分支
2. 进行清晰、专注的提交
3. 将分支推送到您的 fork
4. 创建 pull request，包含：
   - 清晰的标题和描述
   - 相关 issue 的引用
   - UI 更改的截图
   - 测试说明

#### 审核流程
- 维护者将审核您的 PR
- 处理任何反馈或请求的更改
- 批准后，您的 PR 将被合并

### 🧪 测试

目前项目还没有完整的测试框架，但这在未来开发计划中。贡献时：

- 在不同浏览器中手动测试您的更改
- 验证移动端响应性
- 测试各种图表类型的导出功能
- 检查主题切换和国际化功能

### 📚 文档

通过以下方式改进文档：
- 修复拼写错误或不清晰的解释
- 为复杂功能添加示例
- 将内容翻译成其他语言
- 创建教程或指南

### 🎨 设计指南

贡献 UI/UX 改进时：
- 遵循现有设计系统
- 确保满足无障碍性标准
- 在桌面和移动设备上测试
- 考虑浅色和深色主题
- 保持与 shadcn/ui 组件的一致性

### 💬 交流沟通

- 使用 GitHub Issues 进行错误报告和功能请求
- 在讨论中保持尊重和建设性
- 尽可能帮助其他贡献者

### 🙏 致谢

每一个贡献都很珍贵，无论大小。感谢您帮助改进 Mermaid Editor！ 