'use strict'

const gulp = require('gulp')

const browserify = require('browserify')
const tsify = require('tsify')
const watchify = require('watchify')
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

const options = {'standalone': 'raml_oas'}
const b = watchify(browserify(options))

gulp.task('bundleRamlOas', function () {
  return b
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

gulp.task('bundleVisualization', function () {
  return b
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
    .pipe(sourcemaps.write('./')) // writes .map file
    .pipe(gulp.dest('./docs/js'))
    .pipe(browserSync.stream({once: true}))
})


gulp.task('serveRamlOas', gulp.series('bower', 'bundleRamlOas', function () {
  return browserSync.init({
    server: 'docs',
    startPath: '/raml_oas.html'
  })
}))

gulp.task('serveVisualization', gulp.series('bower', 'bundleVisualization', function () {
  return browserSync.init({
    server: 'docs',
    startPath: '/visualization.html'
  })
}))
