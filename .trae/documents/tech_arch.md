# 小红书运营周报看板 - 技术架构文档

## 1. 架构概述

### 1.1 技术选型

| 分类      | 技术           | 版本    | 选型理由                         |
| :------ | :----------- | :---- | :--------------------------- |
| 框架      | Vue          | 3.4+  | 现代化前端框架，Composition API，性能优异 |
| 语言      | TypeScript   | 5.4+  | 类型安全，增强代码可维护性                |
| 样式      | Tailwind CSS | 3.4+  | 原子化CSS，快速构建UI                |
| UI组件    | Element Plus | 2.6+  | Vue 3生态成熟的UI库                |
| Excel解析 | xlsx         | 0.18+ | 支持多种格式Excel/CSV解析            |
| 图表      | Chart.js     | 4.4+  | 轻量级图表库，易于集成                  |

### 1.2 架构风格

采用**组件化架构**，将页面分解为多个独立组件，通过props和事件进行通信。使用Vue 3 Composition API进行状态管理。

***

## 2. 目录结构

```
src/
├── components/           # 组件目录
│   ├── StatCard.vue     # 统计卡片组件
│   ├── ContentCompare.vue # 内容类型对比组件
│   ├── HotRanking.vue   # 爆款排行榜组件
│   ├── DataTable.vue    # 详细数据表格组件
│   ├── OperationAdvice.vue # 运营建议组件
│   └── FileUpload.vue   # 文件上传组件
├── types/               # 类型定义
│   └── index.ts         # 数据类型定义
├── utils/               # 工具函数
│   ├── parser.ts        # Excel/CSV解析工具
│   └── analyzer.ts      # 数据分析工具
├── data/                # 模拟数据
│   └── mockData.ts      # 初始模拟数据
├── App.vue              # 根组件
├── main.ts              # 入口文件
└── style.css            # 全局样式
```

***

## 3. 核心组件设计

### 3.1 StatCard 组件

**功能**: 展示单一统计数据卡片

**props**:

| 属性       | 类型               | 说明     |
| :------- | :--------------- | :----- |
| title    | string           | 卡片标题   |
| value    | string \| number | 显示数值   |
| subtext  | string           | 副标题/说明 |
| gradient | string           | 渐变颜色类名 |

**设计要点**:

* 渐变色背景

* 数值居中显示

* 响应式卡片宽度

### 3.2 ContentCompare 组件

**功能**: 对比视频和图文笔记数据

**props**:

| 属性        | 类型           | 说明       |
| :-------- | :----------- | :------- |
| videoData | ContentStats | 视频笔记统计数据 |
| imageData | ContentStats | 图文笔记统计数据 |
| insight   | string       | 数据洞察文字   |

**设计要点**:

* 左右两栏布局

* 展示曝光量、观看量、点赞数、评论数

* 底部展示数据洞察建议

### 3.3 HotRanking 组件

**功能**: 爆款笔记排行榜

**props**:

| 属性    | 类型      | 说明        |
| :---- | :------ | :-------- |
| notes | Note\[] | 笔记列表（已排序） |

**设计要点**:

* 按曝光量降序排列

* 爆款标记（🔥）

* 显示曝光、点赞、评论数据

### 3.4 DataTable 组件

**功能**: 详细数据表格展示

**props**:

| 属性   | 类型      | 说明     |
| :--- | :------ | :----- |
| data | Note\[] | 笔记数据列表 |

**设计要点**:

* 支持滚动

* 表头固定

* 爆款行高亮

### 3.5 OperationAdvice 组件

**功能**: 运营建议展示

**props**:

| 属性             | 类型        | 说明     |
| :------------- | :-------- | :----- |
| keepAdvice     | string\[] | 继续保持建议 |
| optimizeAdvice | string\[] | 优化方向建议 |

**设计要点**:

* 两栏布局

* 图标区分两类建议

### 3.6 FileUpload 组件

**功能**: 数据文件上传

**events**:

| 事件       | 参数            | 说明        |
| :------- | :------------ | :-------- |
| uploaded | data: Note\[] | 文件解析成功后触发 |

**设计要点**:

* 拖拽上传支持

* 支持CSV和Excel格式

* 上传状态反馈

***

## 4. 数据结构定义

### 4.1 Note 接口

```typescript
interface Note {
  id: string;           // 唯一标识
  title: string;        // 笔记标题
  type: '视频' | '图文'; // 体裁
  exposure: number;     // 曝光量
  view: number;         // 观看量
  clickRate: number;    // 点击率
  like: number;         // 点赞数
  comment: number;      // 评论数
  collect: number;      // 收藏数
  share: number;        // 分享数
  date?: string;        // 发布日期
}
```

### 4.2 ContentStats 接口

```typescript
interface ContentStats {
  count: number;        // 数量
  exposure: number;     // 总曝光量
  view: number;         // 总观看量
  like: number;         // 总点赞数
  comment: number;      // 总评论数
}
```

### 4.3 Stats 接口

```typescript
interface Stats {
  totalExposure: number;    // 总曝光量
  totalView: number;        // 总观看量
  totalInteraction: number; // 总互动数
  newFollowers: number;     // 新增粉丝
  totalFollowers: number;   // 总粉丝数
}
```

***

## 5. 数据分析逻辑

### 5.1 统计计算

```typescript
// 计算总曝光量
totalExposure = notes.reduce((sum, note) => sum + note.exposure, 0)

// 计算总观看量
totalView = notes.reduce((sum, note) => sum + note.view, 0)

// 计算总互动数（点赞+评论+收藏+分享）
totalInteraction = notes.reduce((sum, note) => 
  sum + note.like + note.comment + note.collect + note.share, 0)
```

### 5.2 内容类型对比

```typescript
// 过滤视频和图文笔记
const videoNotes = notes.filter(note => note.type === '视频')
const imageNotes = notes.filter(note => note.type === '图文')

// 分别计算统计数据
videoStats = {
  count: videoNotes.length,
  exposure: videoNotes.reduce((sum, n) => sum + n.exposure, 0),
  view: videoNotes.reduce((sum, n) => sum + n.view, 0),
  like: videoNotes.reduce((sum, n) => sum + n.like, 0),
  comment: videoNotes.reduce((sum, n) => sum + n.comment, 0)
}

// 计算占比
videoExposureRatio = (videoStats.exposure / totalExposure) * 100
imageExposureRatio = (imageStats.exposure / totalExposure) * 100
```

### 5.3 爆款判定

```typescript
// 按曝光量降序排序
sortedNotes = [...notes].sort((a, b) => b.exposure - a.exposure)

// 取前3名作为爆款
hotNotes = sortedNotes.slice(0, 3)
```

### 5.4 运营建议生成

根据数据分析结果，自动生成运营建议：

1. **继续保持**：

   * 曝光量占比高的内容类型

   * 互动量高的内容主题

2. **优化方向**：

   * 表现较差的内容类型建议

   * 点击率优化建议

   * 互动提升建议

***

## 6. 文件解析流程

```
用户上传文件
      │
      ▼
  读取文件内容
      │
      ▼
  判断文件类型
     /   \
    /     \
  CSV    Excel
    \     /
     \   /
      ▼
  解析数据为Note数组
      │
      ▼
  验证数据完整性
      │
      ▼
  触发uploaded事件
```

### 6.1 支持的文件格式

| 格式    | 扩展名   | MIME类型                                                            |
| :---- | :---- | :---------------------------------------------------------------- |
| CSV   | .csv  | text/csv                                                          |
| Excel | .xlsx | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet |
| Excel | .xls  | application/vnd.ms-excel                                          |

### 6.2 数据验证规则

* 必须包含列：笔记标题、体裁、曝光、观看、点赞、评论、收藏、分享

* 体裁列只能为"视频"或"图文"

* 数值列必须为数字类型

***

## 7. 样式设计

### 7.1 颜色方案

| 用途    | 颜色                | 渐变   |
| :---- | :---------------- | :--- |
| 主标题   | #1f2937           | -    |
| 副标题   | #6b7280           | -    |
| 统计卡片1 | #ef4444 → #f97316 | 红色渐变 |
| 统计卡片2 | #3b82f6 → #8b5cf6 | 蓝色渐变 |
| 统计卡片3 | #ec4899 → #8b5cf6 | 紫色渐变 |
| 统计卡片4 | #06b6d4 → #22c55e | 青色渐变 |
| 统计卡片5 | #f97316 → #fbbf24 | 橙色渐变 |
| 表格背景  | #ffffff           | -    |
| 表格行悬停 | #f3f4f6           | -    |
| 爆款高亮  | #fffbeb           | -    |

### 7.2 字体规范

| 元素   | 字体大小 | 字重  |
| :--- | :--- | :-- |
| 页面标题 | 24px | 700 |
| 卡片标题 | 14px | 500 |
| 卡片数值 | 32px | 700 |
| 表格表头 | 14px | 600 |
| 表格内容 | 14px | 400 |
| 建议文字 | 14px | 400 |

***

## 8. 部署与运行

### 8.1 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问地址
http://localhost:5173
```

### 8.2 生产构建

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

### 8.3 环境要求

* Node.js >= 18.0.0

* npm >= 9.0.0

***

## 9. 安全考虑

### 9.1 文件上传安全

* 限制文件大小（最大10MB）

* 验证文件类型白名单

* 防止恶意文件上传

### 9.2 数据处理安全

* 输入数据格式验证

* 防止XSS攻击（使用v-html时注意）

* 数值范围校验

### 9.3 隐私保护

* 本地数据处理，不上传服务器

* 不存储用户上传的数据

* 仅在浏览器内存中处理

