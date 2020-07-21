#!/usr/bin/env node

const program = require('commander');
const path = require('path');
const fs = require('fs-extra');

const packageJSON = require('../package.json');

program
    .version(packageJSON.version, '-v, --version')
    .on('--help', () => {
        console.log('\nExamples:');
        console.log('  # 通过模板创建项目');
        console.log('  $ mp-gulpfile create my-project');
    });

// mp-gulpfile create: 通过模板创建项目
program
    .command('create <project-name>')
    .description('通过模板创建项目')
    .action((name, cmd) => {
        const input = path.resolve(__dirname, '../template');
        const ouput = path.resolve(process.cwd(), name);
        fs.copySync(input, ouput, {
            overwrite: false,
            errorOnExist: true,
            filter: (src, dest) =>
                !/\.DS_Store|package-lock\.json|node_modules/g.test(src),
        });
        console.log(`创建项目 ${name} 成功`);
        process.exit(0);
    });

// unknown commands
program.on('command:*', () => {
    console.error(`无效的命令: ${program.name()} ${program.args.join(' ')}`);
    console.log(`请执行 ${program.name()} --help 查询帮助`);
    process.exit(1);
});

// 解析参数
program.parse(process.argv);

// 默认显示帮助
if (program.args.length === 0) program.help();
