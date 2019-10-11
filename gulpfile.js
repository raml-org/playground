'use strict'

const gulp = require('gulp')

const browserify = require('browserify')
const tsify = require('tsify')
const babelify = require('babelify')
const source = require('vinyl-source-stream')
const buffer = require('vinyl-buffer')
const sourcemaps = require('gulp-sourcemaps')
const browserSync = require('browser-sync').create()
const sass = require('gulp-sass')
const cleanCSS = require('gulp-clean-css')
const log = require('fancy-log')

function bundleHandler (name) {
  return function bundle () {
    return browserify({ standalone: name })
      .add([
        `./src/${name}/view_model.ts`
      ])
      .plugin(tsify, { target: 'es6' })
      .transform(babelify, { extensions: ['.tsx', '.ts'] })
      .bundle().on('error', log)
      .pipe(source(`${name}.js`))
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('./docs/js'))
      .pipe(browserSync.stream({ once: true }))
  }
}

function serveHandler (name) {
  return function serve () {
    return browserSync.init({
      server: 'docs',
      startPath: `/${name}.html`
    })
  }
}

function watchHandler (name, bundlerName) {
  return function watch () {
    gulp.watch(
      [
        `./src/${name}/*.ts`,
        './src/main/*.ts',
        './src/view_models/*.ts'
      ],
      gulp.series(bundlerName, 'browserSyncReload')
    )
    gulp.watch(
      './docs/scss/**/*.scss',
      gulp.series('css', 'browserSyncReload')
    )
  }
}

gulp.task('browserSyncReload', function () {
  return browserSync.reload()
})

gulp.task('css', function () {
  return gulp
    .src('./docs/scss/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(cleanCSS({ level: { 2: { all: true } } }))
    .pipe(gulp.dest('./docs/css'))
})

/* Bundlers */
gulp.task('bundleRamlOas', bundleHandler('raml_oas'))
gulp.task('bundleVisualization', bundleHandler('visualization'))
gulp.task('bundleResolution', bundleHandler('resolution'))

/* Servers  */
gulp.task('serveRamlOas', gulp.series(
  'css',
  'bundleRamlOas',
  gulp.parallel(
    serveHandler('raml_oas'),
    watchHandler('raml_oas', 'bundleRamlOas')
  )
))

gulp.task('serveVisualization', gulp.series(
  'css',
  'bundleVisualization',
  gulp.parallel(
    serveHandler('visualization'),
    watchHandler('visualization', 'bundleVisualization')
  )
))

gulp.task('serveResolution', gulp.series(
  'css',
  'bundleResolution',
  gulp.parallel(
    serveHandler('resolution'),
    watchHandler('resolution', 'bundleResolution')
  )
))


/* Bundle all the demos */
gulp.task('bundleAll', gulp.series(
  'css',
  'bundleRamlOas',
  'bundleVisualization',
  'bundleResolution'
))
