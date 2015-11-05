var gulp = require('gulp');
var uglify = require('gulp-uglify');

gulp.task('minifyjs', function () {
	return gulp.src('src/*.js')
		.pipe(uglify())
		.pipe(gulp.dest('./dist/'));
});

gulp.task('movefiles',function(){
	return gulp.src('src/SAML.xml')
	.pipe(gulp.dest('./dist/'));
})

gulp.task('default', ['minifyjs','movefiles']);