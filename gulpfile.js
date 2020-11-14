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
      .plugin(tsify)
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

gulp.task('browserSyncReload', function (done) {
  browserSync.reload()
  done()
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
gulp.task('bundleCustomValidation', bundleHandler('custom_validation'))
gulp.task('bundleDiff', bundleHandler('diff'))
gulp.task('bundleLearnRaml', bundleHandler('learn_raml'))
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

gulp.task('serveCustomValidation', gulp.series(
  'css',
  'bundleCustomValidation',
  gulp.parallel(
    serveHandler('custom_validation'),
    watchHandler('custom_validation', 'bundleCustomValidation')
  )
))

gulp.task('serveDiff', gulp.series(
  'css',
  'bundleDiff',
  gulp.parallel(
    serveHandler('diff'),
    watchHandler('diff', 'bundleDiff')
  )
))

gulp.task('serveLearnRaml', gulp.series(
  'css',
  'bundleLearnRaml',
  gulp.parallel(
    serveHandler('learn_raml'),
    watchHandler('learn_raml', 'bundleLearnRaml')
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

/*
  Reloads RAML examples from "raml-org/raml-examples" and writes them
  into "docs/raml-examples.json". The JSON file is then used by
  the Load Modal to populate "Load RAML File" dropdown.
*/
gulp.task('reloadRamlExamples', async () => {
  const fs = require('fs')
  const path = require('path')
  const axios = require('axios')

  const apiBase = 'https://api.github.com/repos/raml-org/raml-examples'
  const ghExamples = []

  const commitsResp = await axios.get(`${apiBase}/commits`)
  const latestCommit = commitsResp.data[0].sha
  const filesResp = await axios.get(`${apiBase}/git/trees/${latestCommit}?recursive=1`)
  const ramlFiles = filesResp.data.tree.filter(el => {
    return el.type === 'blob' && el.path.endsWith('.raml')
  })
  ramlFiles.forEach(el => {
    ghExamples.push({
      name: el.path,
      url: `https://raw.githubusercontent.com/raml-org/raml-examples/master/${el.path}`
    })
  })
  fs.writeFileSync(
    path.join(__dirname, 'docs', 'raml-examples.json'),
    JSON.stringify(ghExamples, null, 2))
})

/* Bundle all the demos */
gulp.task('bundleAll', gulp.series(
  'css',
  'bundleRamlOas',
  'bundleVisualization',
  'bundleCustomValidation',
  'bundleDiff',
  'bundleLearnRaml',
  'bundleResolution',
  'reloadRamlExamples'
))

gulp.task('serve', gulp.series('serveLearnRaml'))
