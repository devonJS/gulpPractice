/**
 * Created by devon on 7/21/15.
 */
var gulp = require('gulp');
var path = require('path');
var merge = require('merge-stream');

var jshint = require('gulp-jshint');
var changed = require('gulp-changed');
var imagemin = require('gulp-imagemin');
var minifyHTML = require('gulp-minify-html');
var concat = require('gulp-concat');
var stripDebug = require('gulp-strip-debug');
var uglify = require('gulp-uglify');
var del = require('del');
var rename = require('gulp-rename');

gulp.task('jshint', function() {
   gulp.src('./src/scripts/*.js')
       .pipe(jshint())
       .pipe(jshint.reporter('default'));
});

gulp.task('imagemin', function() {
    var imgSrc = './src/images/**/*',
        imgDst = './build/images';

    gulp.src(imgSrc)
        .pipe(changed(imgDst))
        .pipe(imagemin())
        .pipe(gulp.dest(imgDst));
});

gulp.task('htmlpage', function() {
    var htmlSrc = './src/views/*.html',
        htmlDst = './build';

    //Gulp src checks if anything has changed between the src and the dst, this minifies html then replaces it in the htmlDst
    gulp.src(htmlSrc)
        .pipe(changed(htmlDst))
        .pipe(minifyHTML())
        .pipe(gulp.dest(htmlDst))
});

gulp.task('scripts', function() {
    //var jsfiles = [];
    //var srcPath = './src/';

    //jsfiles.push(gulp.src([path.join(srcPath, '**/*.js')]));
    //return merge(jsfiles)
    gulp.src(['./src/scripts/*.js','./src/assets/**/*.js'])
        .pipe(concat('script.js'))
        //.pipe(gulp.dest('./build/scripts/'))
        //.pipe(rename('script.min.js'))
        .pipe(stripDebug())
        .pipe(uglify())
        .pipe(gulp.dest('./build/scripts/'));
});

gulp.task('clean', function(cb) {
    del(['./build/scripts'], cb);
});

//gulp.task('watch', function() {
//    gulp.watch(['./src/scripts/*.js', './src/assets/**/*.js'], ['jshint', 'scripts']);
//});

gulp.task('build', ['clean'], function() {
    gulp.start('jshint','imagemin', 'htmlpage', 'scripts');
});