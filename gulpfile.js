'use strict'

const gulp = require('gulp')

const browserify = require('browserify')
const tsify = require('tsify')
const babelify = require('babelify')
const source = require('vinyl-source-stream')
const buffer = require('vinyl-buffer')
const gutil = require('gulp-util')
const sourcemaps = require('gulp-sourcemaps')
const browserSync = require('browser-sync').create()
const bower = require('gulp-bower')
const sass = require('gulp-sass')

gulp.task('bower', function () {
  return bower({cwd: 'docs'})
})

gulp.task('sass', function () {
  return gulp.src('./docs/scss/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./docs/css'))
})

const optionsRamlOas = {'standalone': 'raml_oas'}
const bRamlOas = browserify(optionsRamlOas)
gulp.task('bundleRamlOas', function () {
  return bRamlOas
    .add([
      'src/raml_oas/view_model.ts'
    ])
    .plugin(tsify, { target: 'es6' })
    .transform(babelify, { extensions: [ '.tsx', '.ts' ] })
    .bundle()
  // log errors if they happen
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source('raml_oas.js'))
  // optional, remove if you don't need to buffer file contents
    .pipe(buffer())
  // optional, remove if you dont want sourcemaps
  // loads map from browserify file
    .pipe(sourcemaps.init({loadMaps: true}))
  // Add transformation tasks to the pipeline here.
    .pipe(sourcemaps.write('./')) // writes .map file
    .pipe(gulp.dest('./docs/js'))
    .pipe(browserSync.stream({once: true}))
})

const optionsVisualization = {'standalone': 'visualization'}
const bVisualization = browserify(optionsVisualization)
gulp.task('bundleVisualization', function () {
  return bVisualization
    .add([
      'src/visualization/view_model.ts'
    ])
    .plugin(tsify, { target: 'es6' })
    .transform(babelify, { extensions: [ '.tsx', '.ts' ] })
    .bundle()
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source('visualization.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./docs/js'))
    .pipe(browserSync.stream({once: true}))
})

const optionsDiff = {'standalone': 'diff'}
const bDiff = browserify(optionsDiff)
gulp.task('bundleDiff', function () {
  return bDiff
    .add([
      'src/diff/view_model.ts'
    ])
    .plugin(tsify, { target: 'es6' })
    .transform(babelify, { extensions: [ '.tsx', '.ts' ] })
    .bundle()
  // log errors if they happen
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source('diff.js'))
  // optional, remove if you don't need to buffer file contents
    .pipe(buffer())
  // optional, remove if you dont want sourcemaps
  // loads map from browserify file
    .pipe(sourcemaps.init({loadMaps: true}))
  // Add transformation tasks to the pipeline here.
    .pipe(sourcemaps.write('./')) // writes .map file
    .pipe(gulp.dest('./docs/js'))
    .pipe(browserSync.stream({once: true}))
})


gulp.task('serveRamlOas', gulp.series(
  'sass',
  'bower',
  'bundleRamlOas',
  function () {
    return browserSync.init({
      server: 'docs',
      startPath: '/raml_oas.html'
    })
  }
))

gulp.task('serveVisualization', gulp.series(
  'sass',
  'bower',
  'bundleVisualization',
  function () {
    return browserSync.init({
      server: 'docs',
      startPath: '/visualization.html'
    })
  }
))

gulp.task('serveDiff', gulp.series(
  'sass',
  'bower',
  'bundleDiff',
  function () {
    return browserSync.init({
      server: 'docs',
      startPath: '/diff.html'
    })
  }
))

// Bundle all the demos
gulp.task('bundle', gulp.series(
  'sass',
  'bower',
  'bundleRamlOas',
  'bundleVisualization',
  'bundleDiff'
))
