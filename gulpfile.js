'use strict';

var gulp = require('gulp');

var browserify = require('browserify');
var tsify = require('tsify');
var watchify = require('watchify');
var babelify = require('babelify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var sourcemaps = require('gulp-sourcemaps');
var browserSync = require('browser-sync').create();
var bower = require('gulp-bower');
var sass = require('gulp-sass');
var child = require("child_process");

gulp.task('bower', function() {
    return bower({cwd: "docs"})
});

gulp.task('sass', function () {
    return gulp.src('./docs/scss/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./docs/css'));
});

const options = {"standalone":"amf_playground"};
const b = watchify(browserify(options));
function bundle() {
    return b
        .add([
            "src/playground/view_model.ts"
        ])
        .plugin(tsify, { target: 'es6' })
        .transform(babelify, { extensions: [ '.tsx', '.ts' ] })
        .bundle()
        // log errors if they happen
        .on('error', gutil.log.bind(gutil, 'Browserify Error'))
        .pipe(source('amf_playground.js'))
        // optional, remove if you don't need to buffer file contents
        .pipe(buffer())
        // optional, remove if you dont want sourcemaps
        .pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
        // Add transformation tasks to the pipeline here.
        .pipe(sourcemaps.write('./')) // writes .map file
        .pipe(gulp.dest('./docs/js'))
        .pipe(browserSync.stream({once: true}));
}


const optionsValidation = {"standalone":"amf_playground_validation"};
const bValidation = watchify(browserify(optionsValidation));
function bundleValidation() {
    return bValidation
        .add([
            "src/validation/view_model.ts"
        ])
        .plugin(tsify, { target: 'es5' })
        //.transform(babelify, { extensions: [ '.tsx', '.ts' ] })
        .bundle()
        // log errors if they happen
        .on('error', gutil.log.bind(gutil, 'Browserify Error'))
        .pipe(source('amf_playground_validation.js'))
        // optional, remove if you don't need to buffer file contents
        .pipe(buffer())
        // optional, remove if you dont want sourcemaps
        .pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
        // Add transformation tasks to the pipeline here.
        .pipe(sourcemaps.write('./')) // writes .map file
        .pipe(gulp.dest('./docs/js'))
        .pipe(browserSync.stream({once: true}));
}


const optionsDiff = {"standalone":"amf_playground_diff"};
const bDiff = watchify(browserify(optionsDiff));
function bundleDiff() {
    return bDiff
        .add([
            "src/diff/view_model.ts"
        ])
        .plugin(tsify, { target: 'es5' })
        //.transform(babelify, { extensions: [ '.tsx', '.ts' ] })
        .bundle()
        // log errors if they happen
        .on('error', gutil.log.bind(gutil, 'Browserify Error'))
        .pipe(source('amf_playground_diff.js'))
        // optional, remove if you don't need to buffer file contents
        .pipe(buffer())
        // optional, remove if you dont want sourcemaps
        .pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
        // Add transformation tasks to the pipeline here.
        .pipe(sourcemaps.write('./')) // writes .map file
        .pipe(gulp.dest('./docs/js'))
        .pipe(browserSync.stream({once: true}));
}

const optionsVocabs = {"standalone":"amf_playground_vocabs"};
const bVocabs = watchify(browserify(optionsVocabs));
function bundleVocabs() {
    return bVocabs
        .add([
            "src/vocabularies/view_model.ts"
        ])
        .plugin(tsify, { target: 'es5' })
        //.transform(babelify, { extensions: [ '.tsx', '.ts' ] })
        .bundle()
        // log errors if they happen
        .on('error', gutil.log.bind(gutil, 'Browserify Error'))
        .pipe(source('amf_playground_vocabs.js'))
        // optional, remove if you don't need to buffer file contents
        .pipe(buffer())
        // optional, remove if you dont want sourcemaps
        .pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
        // Add transformation tasks to the pipeline here.
        .pipe(sourcemaps.write('./')) // writes .map file
        .pipe(gulp.dest('./docs/js'))
        .pipe(browserSync.stream({once: true}));
}

const optionsCustomValidation = {"standalone":"amf_playground_custom_validation"};
const bCustomValidation = watchify(browserify(optionsCustomValidation));
function bundleCustomValidation() {
    return bCustomValidation
        .add([
            "src/custom_validation/view_model.ts"
        ])
        .plugin(tsify, { target: 'es5' })
        //.transform(babelify, { extensions: [ '.tsx', '.ts' ] })
        .bundle()
        // log errors if they happen
        .on('error', gutil.log.bind(gutil, 'Browserify Error'))
        .pipe(source('amf_playground_custom_validation.js'))
        // optional, remove if you don't need to buffer file contents
        .pipe(buffer())
        // optional, remove if you dont want sourcemaps
        .pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
        // Add transformation tasks to the pipeline here.
        .pipe(sourcemaps.write('./')) // writes .map file
        .pipe(gulp.dest('./docs/js'))
        .pipe(browserSync.stream({once: true}));
}


gulp.task('bundle_validation', bundleValidation); // so you can run `gulp js` to build the file
gulp.task('bundle_diff', bundleDiff); // so you can run `gulp js` to build the file
gulp.task('bundle_vocabs', bundleVocabs); // so you can run `gulp js` to build the file
gulp.task('bundle_custom_validation', bundleCustomValidation); // so you can run `gulp js` to build the file
gulp.task('bundle', bundle); // so you can run `gulp js` to build the file
b.on('update', bundle); // on any dep update, runs the bundler
b.on('log', gutil.log); // output build logs to terminal


gulp.task('serve', ["bower"], function () {
    bundle();
    browserSync.init({
        server: "docs",
        startPath: "/playground.html"
    });
});

gulp.task('serve_validation', ["bower"], function () {
    bundleValidation();
    browserSync.init({
        server: "docs",
        startPath: "/validation.html"
    });
});


gulp.task('serve_diff', ["bower"], function () {
    bundleDiff();
    browserSync.init({
        server: "docs",
        startPath: "/diff.html"
    });
});

gulp.task('serve_vocabs', ["bower"], function () {
    bundleVocabs();
    browserSync.init({
        server: "docs",
        startPath: "/vocabularies.html"
    });
});

gulp.task('serve_custom_validation', ["bower"], function () {
    bundleCustomValidation();
    browserSync.init({
        server: "docs",
        startPath: "/custom_validation.html"
    });
});
