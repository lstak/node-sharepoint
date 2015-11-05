var gulp = require('gulp');
var uglify = require('gulp-uglify');
var jslint = require('gulp-jslint');
var ts = require('gulp-typescript');
var mocha = require('gulp-mocha');

gulp.task('minifyjs', function () {
	return gulp.src('src/*.js')
		.pipe(uglify())
		.pipe(gulp.dest('./dist/'));
});

gulp.task('movefiles', function () {
	return gulp.src('src/SAML.xml')
		.pipe(gulp.dest('./dist/'));
})

gulp.task('jslint', function () {
	return gulp.src(['./src/*.js'])
        .pipe(jslint({
			node: true
		}))
        .on('error', function (error) {
            console.error(String(error));
        });
});

gulp.task('ts', function () {
	return gulp.src('./src/*.ts')
		.pipe(ts())
		.pipe(gulp.dest('./dist/'));
});

gulp.task('run-tests', function () {
	return gulp.src('test/**/*.js', { read: false })
		.pipe(mocha({ reporter: 'spec' }));
});

gulp.task('default', ['minifyjs', 'movefiles', 'ts']);