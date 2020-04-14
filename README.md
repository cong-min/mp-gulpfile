# 微信小程序 gulpfile 最佳实践

## 快速开始

### 方式1、根据模板创建项目

```bash
# 安装 mp-gulpfile
$ npm i -g mp-gulpfile
# 根据模板创建项目
$ mp-gulpfile create my-project
# 安装依赖
$ cd my-project && npm i
```

### 方式2、拷贝 gulpfile 至项目中使用

将 [gulpfile.js](./gulpfile.js) 文件复制到小程序项目根目录下。

安装依赖

```bash
$ npm i -D del gulp gulp-cache gulp-changed gulp-if gulp-image gulp-less gulp-mp-npm gulp-rename gulp-sourcemaps gulp-typescript jsonfile miniprogram-api-typings typescript
```

## 启动服务

```bash
# 启动监听服务
$ npm start
# 单次构建
$ npm run build
```

将整个项目目录添加至微信开发者工具中，其中 `src` 为开发路径，`.miniprogram` 为生产路径。

## 更多

[细节介绍](Introduction.md)

## License

MIT