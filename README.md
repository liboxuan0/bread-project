# 免费面包分享预约网站

一个基于 Next.js + TypeScript + Tailwind CSS + Supabase 的面包分享预约平台。

## 技术栈

- **前端框架**: Next.js 14
- **编程语言**: TypeScript
- **样式**: Tailwind CSS
- **数据库**: Supabase
- **Node 版本**: 18+

## 项目结构

```
.
├── app/                          # Next.js App Router
│   ├── layout.tsx               # 根布局
│   ├── page.tsx                 # 首页 (/)
│   ├── globals.css              # 全局样式
│   ├── bread/
│   │   └── [id]/
│   │       └── page.tsx         # 面包详情页 (/bread/[id])
│   └── admin/
│       ├── login/
│       │   └── page.tsx         # 管理员登录 (/admin/login)
│       ├── bread-shares/
│       │   └── page.tsx         # 面包分享管理 (/admin/bread-shares)
│       └── reservations/
│           └── page.tsx         # 预约管理 (/admin/reservations)
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.ts
└── .env.example
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local` 并填入 Supabase 相关信息：

```bash
cp .env.example .env.local
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000` 查看应用。

## 页面说明

- **首页** (`/`): 展示所有可用的面包分享列表
- **面包详情** (`/bread/[id]`): 查看面包详情和预约
- **管理员登录** (`/admin/login`): 管理员账户登录
- **面包分享管理** (`/admin/bread-shares`): 发布和管理面包分享
- **预约管理** (`/admin/reservations`): 查看和管理用户预约

## 下一步

- [ ] 配置 Supabase 数据库和认证
- [ ] 实现用户认证功能
- [ ] 创建数据库相关的 hooks 和服务
- [ ] 实现业务逻辑（创建、更新、删除面包分享）
- [ ] 实现预约功能
- [ ] 添加表单验证和错误处理
- [ ] 部署到生产环境
