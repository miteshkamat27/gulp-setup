const { src, dest, watch, parallel, series } = require('gulp');
const sass = require('gulp-sass');
const ejs = require('gulp-ejs');
const rename = require('gulp-rename');
const eslint = require('gulp-eslint');
const mocha = require('gulp-mocha');
const sync = require('browser-sync').create();
const uglify = require('gulp-uglify');
const cleanCSS = require('gulp-clean-css');

function copy(cb){
  src('routes/*.js')
    .pipe(dest('copies'));

  cb();
}

function generateCSS(cb){
  src('./sass/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(dest('./public/stylesheets'))
    .pipe(sync.stream());

  cb();
}

function minifyCSS(cb){
  src('./public/stylesheets/*.css')
    .pipe(cleanCSS())
    .pipe(dest('./public/css'));
  
    cb();
}

function generateHTML(cb){
  src('./views/index.ejs')
    .pipe(ejs({
      title: 'Gulp : Task runner'
    }))
    .pipe(rename({
      extname: ".html"
    }))
    .pipe(dest('./public'));

  cb();
}

function runLinter(cb){
  return src(['**/*.js', '!node_modules/**'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .on('end', function(){
      cb();
    });
}

function uglifyJS(cb){
  src(['**/*.js', '!node_modules/**', '!**/*.test.js'])
    .pipe(uglify())
    .pipe(dest('./public/javascripts'));

  cb();
}

function runTests(cb){
  return src(['**/*.test.js'])
    .pipe(mocha())
    .on('error', function(){
      cb(new Error('Test failed'));
    })
    .on('end', function(){
      cb();
    });
}

function watchFiles(cb){
  watch('./views/**.ejs', generateHTML);
  watch('./sass/**/*.scss', generateCSS);
  watch(['**/*.js', '!node_modules/**'], parallel(runLinter, runTests));

  cb();
}

function browserSync(cb){
  sync.init({
    server:{
      baseDir: './public'
    }
  });

  watch('./views/**.ejs', generateHTML);
  watch('./sass/**.scss', generateCSS);
  watch('./public/**.html').on('change',sync.reload);

  cb();
}

exports.copy = copy;
exports.css = generateCSS;
exports.minifyCSS = minifyCSS;
exports.html = generateHTML;
exports.lint = runLinter;
exports.minifyJS = uglifyJS;
exports.test = runTests;
exports.watch = watchFiles;
exports.sync = browserSync;

exports.default = series(runLinter, parallel(generateCSS, generateHTML), runTests);