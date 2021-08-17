// Sass configuration
var gulp = require('gulp');
var sass = require('gulp-sass')(require('node-sass'));

gulp.task('sass', function(cb) {
  gulp
    // watch for changes to any .scss files in this directory
    .src('*.scss')
    // take any such changed files and run them through gulp-sass
    .pipe(sass())
    // put the output css files, named after their original scss file, in this directory
    .pipe(
      gulp.dest(function(f) {
        return f.base;
      })
    );
  cb();
});

// run the sass task on startup
gulp.task(
  'default',
  gulp.series('sass', function(cb) {
    gulp.watch('*.scss', gulp.series('sass'));
    cb();
  })
);
