var gulp = require('gulp');
var uglify = require('gulp-uglify');
var jslint = require('gulp-jslint');
var ts = require('gulp-typescript');
var mocha = require('gulp-mocha');
var rimraf = require('gulp-rimraf');

gulp.task('run-tests', ['build'], function () {
	return gulp.src('test/**/*.js', { read: false })
		.pipe(mocha({ reporter: 'spec' }));
});

var minifyjs = function () {
	var js = gulp.src(['!src/**/*.d.ts','src/**/*.ts'])
		.pipe(ts({
			removeComments:true,
			target:"ES5",
			module:"amd",
			declaration:true,
			noImplicitAny:true
		}))
		.pipe(gulp.dest('./temp/'))
		.on('end', function () {
			gulp.src('temp/*.js')
				// .pipe(jslint({
				// 	node:true,
				// 	nomen:true,
				// 	unparam:true, //TODO: Remove After Development
				// 	passfail:false, //TODO: Remove After Development
				// 	devel:true //TODO: Remove After Development
				// }))
				.pipe(uglify())
				.pipe(gulp.dest('./dist'));
		});
	gulp.src('src/**/*.xml')
		.pipe(gulp.dest('./temp/'))
		.on('end', function () {
			return gulp.src('temp/*.xml')
				.pipe(gulp.dest('./dist'));
		});
	return js;
};
gulp.task('build', ['clean'], function () {
	return minifyjs();
});

gulp.task('clean', function () {
	return gulp.src('./{dist,temp}/**/*', { read: false })
		.pipe(rimraf());
});

gulp.task('default', ['build']);