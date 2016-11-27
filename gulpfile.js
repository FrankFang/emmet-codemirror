var gulp = require('gulp');
var rename = require('gulp-rename');
var browserify = require('gulp-browserify');

gulp.task('js', function() {
	return gulp.src('./plugin.js')
    .pipe(browserify({
      insertGlobals : true,
    }))
    .pipe(rename('emmet.js'))
    .pipe(gulp.dest('./dist'));
});

gulp.task('watch', function() {
  jsBundler.watch({sourceMap: true});
  gulp.watch(['./lib/**/*.js', './*.js'], ['js']);
});

gulp.task('default', ['js']);
