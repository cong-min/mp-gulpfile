# 微信小程序 gulpfile 最佳实践

## 一、开发模式对比

### 1、小程序标准开发模式

- 支持 `wxml` `wxss` `js` 三种格式的页面代码
- 依赖文件可以有两个来源：
  1. 手动将所需依赖源代码文件拷贝至项目路径中
  2. 通过 `npm` 安装依赖，再手动点击微信开发者工具的 `构建npm` 按钮构建出依赖文件（将构建至 `miniprogram_npm` 文件夹）

![小程序标准开发模式](https://github.com/cong-min/MarkdownPhotos/blob/master/mp-gulpfile/mpbz.png?raw=true)

### 2、小程序官方 TS 开发模式

可参考：[微信小程序开放文档 · TypeScript 支持](https://developers.weixin.qq.com/miniprogram/dev/devtools/edit.html#TypeScript-支持)

- 通过 `tsc` 命令将 `.ts` 文件编译为 `.js` ，以支持 `TypeScript` 语法

![小程序官方 TS 开发模式](https://github.com/cong-min/MarkdownPhotos/blob/master/mp-gulpfile/mpts.png?raw=true)

### 3、小程序搭配 gulpfile 最佳实践的开发模式

- 在该开发模式下有两个路径：
  - 开发路径
  - (构建后)小程序路径
- 通过 `gulp` 工具可实现：
  - 将 `.ts` 文件编译为 `.js` 、 `.less` 文件编译为 `.wxss` ，以支持 `TypeScript` 、 `Less` 语法
  - 支持 `sourcemaps` 方便错误调试与定位
  - 压缩图片，减少小程序代码包大小
  - 分析代码，依赖自动提取，支持提取普通 `npm` 包与[小程序专用 `npm` 包](https://developers.weixin.qq.com/miniprogram/dev/devtools/npm.html#发布小程序-npm-包的约束)
  - 其余文件将直接拷贝至目标路径

![小程序搭配 gulpfile 最佳实践的开发模式](https://github.com/cong-min/MarkdownPhotos/blob/master/mp-gulpfile/mpgulpfile.png?raw=true)

该开发模式下最佳实践的 `gulpfile.js` 文件详细内容可以查阅 https://github.com/cong-min/mp-gulpfile/blob/master/gulpfile.js ，以及对应的项目模板 https://github.com/cong-min/mp-gulpfile/tree/master/template 。

接下来是对各功能点配置改进的思考与讲解。

## 二、小程序 gulpfile 最佳实践配置

### 1、支持 TS

使用 `gulp-typescript` 插件，创建 `tsconfig.json` 配置文件，可让 `.ts` 编译为 `.js` 文件：

```js
const gulp = require('gulp');
const gulpTs = require('gulp-typescript');
const tsProject = gulpTs.createProject('tsconfig.json');

const ts = () => gulp.src('src/**/*.ts')
    .pipe(tsProject()) // 编译ts
    .pipe(gulp.dest('dist'));
```

### 2、支持 Less

使用 `gulp-less` 插件，可让 `.less` 编译为 `.wxss` 文件：

```js
const gulpLess = require('gulp-less');
const rename = require('gulp-rename');

const less = () => gulp.src('src/**/*.less')
    .pipe(gulpLess()) // 编译less
    .pipe(rename({ extname: '.wxss' }))
    .pipe(gulp.dest('dist'));
```

### 3、压缩图片

小程序主包目前只支持最多 `2M` 的大小，而图片通常是占用空间最多的资源。因为在项目中对图片大小进行压缩很有必要的。

使用 `gulp-image` 插件，可压缩图片大小且能保证画质：

```js
const gulpImage = require('gulp-image');
const cache = require('gulp-cache');

const image = () => gulp.src('src/**/*.{png,jpg,jpeg,gif,svg}')
    .pipe(cache(gulpImage())) // 压缩图片并缓存
    .pipe(gulp.dest('dist'));
```

**为什么压缩插件使用 `gulp-image` 而不使用 `gulp-imagemin` ？**

![压缩图片对比](https://github.com/cong-min/MarkdownPhotos/blob/master/mp-gulpfile/gulpimage.png?raw=true)

<!--
|  | gulp-image | gulp-imagemin |
|--|------------|---------------|
| NPM下载量 | 约 `4000` 次/月 | 约 `12000` 次/月 |
| 默认压缩引擎 | pngquant-bin + zopflipng-bin、 mozjpeg、gifsicle、svgo | imagemin |
| 测试压缩效果（原图 **`38.58`** KB） | **`11.21`** KB ( **8.61**s 压缩到 **29**%)  | **`23.19`** KB ( **6.43**s 压缩到 **60.1**%)  |

> 测试耗时数据来源于本地环境，不算严谨仅做对比
-->

根据对比可得出，在默认配置下 `gulp-image` 的压缩效果更优，因此这里选用了 `gulp-image` 作为图片压缩插件。

### 4、依赖分析与提取

在 [微信小程序开放文档 · npm 支持](https://developers.weixin.qq.com/miniprogram/dev/devtools/npm.html#原理介绍) 中可以找到了关于小程序官方提取 `npm` 依赖的原理介绍：

> 1、首先 `node_modules` 目录不会参与编译、上传和打包中，所以小程序想要使用 `npm` 包必须走一遍 `“构建 npm”` 的过程，在最外层的 `node_modules` 的同级目录下会生成一个 `miniprogram_npm` 目录，里面会存放构建打包后的 `npm` 包，也就是小程序真正使用的 `npm` 包。
>
> 2、构建打包分为两种：小程序 `npm` 包会直接拷贝构建文件生成目录下的所有文件到 `miniprogram_npm` 中；其他 `npm` 包则会从入口 `js` 文件开始走一遍依赖分析和打包过程（类似 `webpack`）。
>
> 3、寻找 `npm` 包的过程和 `npm` 的实现类似，从依赖 `npm` 包的文件所在目录开始逐层往外找，直到找到可用的 `npm` 包或是小程序根目录为止。

> 使用 `npm` 包时如果只引入包名，则默认寻找包名下的 `index.js` 文件或者 `index` 组件

根据这个原理，我开发了一个用以小程序提取 `npm` 依赖包的 `gulp` 插件 [gulp-mp-npm](https://github.com/cong-min/gulp-mp-npm) ，有以下特点：

- 依赖分析，仅会提取使用到的依赖与组件
- 支持提取普通 `npm` 包与[小程序专用 `npm` 包](https://developers.weixin.qq.com/miniprogram/dev/devtools/npm.html#发布小程序-npm-包的约束)
- 不会对依赖进行编译与打包（交给微信开发者工具或者其他 `gulp` 插件完成）
- 兼容官方方案及原理，同时支持自定义 `npm` 输出文件夹

具体详见可在另一篇文章中看到：[小程序提取npm依赖包gulp插件方案设计](#) 。

![gulp-mp-npm](https://github.com/cong-min/MarkdownPhotos/blob/master/mp-gulpfile/mpnpm.png?raw=true)

使用 `gulp-mp-npm` 插件，可实现 `npm` 依赖的自动分析与按需提取：

```js
const mpNpm = require('gulp-mp-npm');

const js = () => gulp.src('src/**/*.js')
    .pipe(mpNpm()) // 分析提取 js 中用到的依赖
    .pipe(gulp.dest('dist'));
```

通常在 `ts` / `js` / `less` / `wxss` / `json` 等文件中都会有可能使用到 `npm` 依赖。因此，插件 `gulp-mp-npm` 在上述 5 个 `tasks` 中都需执行。

```js
const ts = () => gulp.src('src/**/*.ts')
    .pipe(tsProject()) // 编译ts
    .pipe(mpNpm()) // 分析提取 ts 中用到的依赖
    .pipe(gulp.dest('dist'));
```

```js
const json = () => gulp.src('src/**/*.json')
    .pipe(mpNpm()) // 分析提取 json 中用到的 npm 组件
    .pipe(gulp.dest('dist'));
```

> 分析 `.json` 文件是因为插件会尝试读取小程序页面配置中 `usingComponents` 字段，提取使用的 `npm` 小程序组件

其余 `less` `wxss` 文件的依赖分析提取同理，此处省略。

### 5、拷贝其余文件

对于没有经过任何 `task` 的文件则直接拷贝至目标路径：

```js
const changed = require('gulp-changed');

const copy = () => gulp.src(['src/**',
    '!src/**/*.ts', '!src/**/*.js', '!src/**/*.json',
    '!src/**/*.less', '!src/**/*.wxss',
    '!src/**/*.{png,jpg,jpeg,gif,svg}'])
    .pipe(changed('dist')) // 过滤掉已存在未改变的文件
    .pipe(gulp.dest('dist'));
```

### 6、Source Map

Source Map 便于开发者在调试时定位编译压缩前代码的错误位置。

在 [微信小程序开放文档 · npm 支持](https://developers.weixin.qq.com/miniprogram/dev/framework/usability/debug.html#Source-Map) 可以找到关于 Source Map 的说明：

> 如果使用外部的编译脚本对源文件进行处理，只需将对应生成的 Source Map 文件放置在源文件的相同目录下。
> 开发者工具会读取、解析 Source Map 文件，并进行将其上传。
> 后续可以在小程序后台的运营中心可以利用上传的 Source Map 文件进行错误分析。
>
> **Source Map 文件不计入代码包大小计算。**
>
> 开发版代码包中由于包含了 `.map` 文件，实际代码包大小会比体验版和正式版大。

使用 `gulp-sourcemaps` 插件，可为参与编译的 `.ts` 、 `.less` 文件开启Source Map ：

```js
const sourcemaps = require('gulp-sourcemaps');

/* 以 ts 为例, less 同理 */
const ts = () => gulp.src('src/**/*.ts')
    .pipe(sourcemaps.init())
    .pipe(tsProject()) // 编译ts
    .pipe(mpNpm()) // 分析提取 ts 中用到的依赖
    .pipe(sourcemaps.write('.')) // 以 .map 文件形式导出至同级目录
    .pipe(gulp.dest('dist'));
```

Source Map 构建后目录为：（`.map` 文件不计入代码包大小）

```
├── page.js
├── page.js.map
├── page.wxss
├── page.wxss.map
```

### 7、watch 增量构建

默认情况下 `gulp` 的 `task` 是单次执行的，某个文件变化后 `gulp.watch` 会重新执行整个 `task` 来完成构建，这样会导致未变化的文件重复构建，效能较低。

可采取以下两个措施对效率优化：

**① 正确的使用 `gulp.watch`**

为每一个文件路径不一样的 `task` 创建 `watch`:

```js
/* 以 ts / less / image 为例, js / json / wxss / copy 同理 */
gulp.watch('src/**/*.ts', ts);
gulp.watch('src/**/*.less', less);
gulp.watch('src/**/*.{png,jpg,jpeg,gif,svg}', image);
...
```

**② `gulp.src` 参数 `since` 与 `gulp.lastRun` 搭配使用**

[gulp.lastRun](https://gulpjs.com/docs/en/api/lastrun) 方法将返回当前运行进程中成功完成 `task` 的最后一次时间戳。将其作为 [gulp.src](https://gulpjs.com/docs/en/api/src) 方法的参数 `since` 传入，可实现跳过自上次成功完成任务以来没有更改的文件，完成增量构建，加快执行时间。

```js
/* 以 ts / less / image 为例, js / json / wxss / copy 同理 */
const ts = () => gulp.src(
    'src/**/*.ts',
    { since: gulp.lastRun(ts) }
)...

const less = () => gulp.src(
    'src/**/*.less',
    { since: gulp.lastRun(less) }
)...

const image = () => gulp.src(
    'src/**/*.{png,jpg,jpeg,gif,svg}',
    { since: gulp.lastRun(image) }
)...
```

**增量构建改进前后效果对比：**（在拥有多个 `ts` 文件的实际项目中，使用 `gulp.watch` 监听修改一个 `ts` 文件后再次构建的时长）

![增量构建改进前后效果对比](https://github.com/cong-min/MarkdownPhotos/blob/master/mp-gulpfile/gulpwatch.png?raw=true)

### 8、导出 task

[gulp.task](https://gulpjs.com/docs/en/api/task) 在官方文档中已经声明不再推荐使用该方法，取而代之的是 [创建 `Task`](https://gulpjs.com/docs/en/getting-started/creating-tasks) 中提倡的将 `task` 直接导出：

```js
/** `gulp build`
 * 构建
 * */
const build = gulp.series(
    clear,
    gulp.parallel(
        copy,
        ts,
        js,
        json,
        less,
        wxss,
        image,
    ),
);

/** `gulp` or `gulp dev`
 * 构建并监听
 * */
const dev = gulp.series(
    build,
    watch,
);

// `gulp --tasks` list tasks
module.exports = {
    clear,
    copy,
    ts,
    less,
    image,
    build,
    watch,
    dev,
    default: dev,
};
```
