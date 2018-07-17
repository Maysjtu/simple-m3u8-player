const gulp = require('gulp');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const cssnano = require('gulp-cssnano');
const concat = require('gulp-concat');
const browserify = require('browserify');
const source = require('vinyl-source-stream');

// 编译并压缩js
gulp.task('convertJS', function(){
    return gulp.src('src/**/*.js')
        .pipe(babel({
            presets: ['es2015']
        }))
        // .pipe(uglify())
        .pipe(gulp.dest('dist/'))
});

// 合并并压缩css
gulp.task('convertCSS', function(){
    return gulp.src('app/css/*.css')
        .pipe(concat('app.css'))
        .pipe(cssnano())
        .pipe(rename(function(path){
            path.basename += '.min';
        }))
        .pipe(gulp.dest('dist/css'));
});

// 监视文件变化，自动执行任务
gulp.task('watch', function(){
    // gulp.watch('app/css/*.css', ['convertCSS']);
    gulp.watch('src/*.js', ['convertJS', 'browserify']);
});

// browserify
gulp.task("browserify", function () {
    let b = browserify({
        entries: "dist/index.js"
    });

    return b.bundle()
        .pipe(source("bundle.js"))
        .pipe(gulp.dest("dist/"));
});

gulp.task('start', ['convertJS', 'browserify', 'watch']);
gulp.task('build', ['convertJS', 'browserify']);