# Changelog | 更新日志

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup with Next.js 15 and TypeScript
- Real-time Mermaid diagram editor with CodeMirror 6
- Live preview with responsive design
- Export functionality (SVG, PNG, PDF)
- Theme switching (Light/Dark/System)
- Internationalization (English/Chinese)
- Mobile-optimized tabbed interface
- Desktop split-screen layout
- File size estimation for exports

### Features
- 📝 Real-time Mermaid code editing and preview
- 🌙 Theme support with system preference detection
- 🌐 English/Chinese interface switching
- 📤 Multiple export formats (SVG, PNG, PDF)
- 📏 Flexible PNG export sizes (1x, 1.5x, 2x, 3x)
- 📊 Real-time file size and dimension preview
- 📱 Responsive design for mobile and desktop
- ⚡ Performance optimizations with lazy loading
- 🛡️ Error recovery mechanisms

### Technical Improvements
- Optimized PNG export with edge clipping prevention
- Enhanced SVG export with proper ViewBox and fonts
- Animation performance improvements
- Memory leak fixes
- State management optimization with Zustand
- TypeScript strict mode compliance

### Performance
- Lazy loading of components
- Efficient rendering with requestAnimationFrame
- Optimized state updates to minimize re-renders
- Proper cleanup of animation frames and event listeners

## [0.1.0] - 2024-12-XX

### Added
- Initial release of Mermaid Editor
- Core editing and preview functionality
- Basic export capabilities
- Responsive design foundation

---

## 中文版本

本项目的所有重要更改都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)，
项目遵循 [语义化版本](https://semver.org/spec/v2.0.0.html)。

## [未发布]

### 新增功能
- 使用 Next.js 15 和 TypeScript 进行初始项目设置
- 集成 CodeMirror 6 的实时 Mermaid 图表编辑器
- 响应式设计的实时预览
- 导出功能（SVG、PNG、PDF）
- 主题切换（浅色/深色/跟随系统）
- 国际化支持（英文/中文）
- 移动端优化的标签页界面
- 桌面端分屏布局
- 导出文件大小估算

### 功能特点
- 📝 Mermaid 代码实时编辑与预览
- 🌙 主题支持，可检测系统偏好
- 🌐 英文/中文界面切换
- 📤 多种导出格式（SVG、PNG、PDF）
- 📏 灵活的 PNG 导出尺寸（1x、1.5x、2x、3x）
- 📊 实时文件大小和尺寸预览
- 📱 移动端和桌面端响应式设计
- ⚡ 懒加载性能优化
- 🛡️ 错误恢复机制

### 技术改进
- 优化 PNG 导出，防止边缘裁剪
- 增强 SVG 导出，包含适当的 ViewBox 和字体
- 动画性能改进
- 内存泄漏修复
- 使用 Zustand 优化状态管理
- TypeScript 严格模式合规

### 性能优化
- 组件懒加载
- 使用 requestAnimationFrame 高效渲染
- 优化状态更新以最小化重新渲染
- 适当清理动画帧和事件监听器

## [0.1.0] - 2024-12-XX

### 新增
- Mermaid Editor 初始发布
- 核心编辑和预览功能
- 基础导出功能
- 响应式设计基础 