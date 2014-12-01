var gulp = require('gulp');
var nunjucks = require('gulp-nunjucks-render');
var markdown = require('gulp-markdown');
var fs = require('fs');
var path = require('path');


var postsDir = 'dist/posts';

function fnameToDate(name) {
	var date = name.split('.')[0].split('-').map(function(t) {
		return parseInt(t);
	});
	return new Date(date[2], date[0], date[1]);
}


gulp.task('index', function() {
	console.log("build index");
});


gulp.task('markdown', ['blog'], function() {

	var posts = fs.readdirSync(postsDir).sort(function(f1, f2) {
		return fnameToDate(f1) < fnameToDate(f2) ? 1 : -1;
	}).map(function(name) {
		return fs.readFileSync(path.join(postsDir, name), {
			encoding: 'utf8'
		});
	});

	nunjucks.nunjucks.configure(['templates/']);
	return gulp.src('templates/index.html')
		.pipe(nunjucks({
			posts: posts
		}))
		.pipe(gulp.dest('dist'));

});

gulp.task('blog', function() {

	gulp.src('posts/*')
		.pipe(markdown())
		.pipe(gulp.dest(postsDir));


});

gulp.task('assets', function() {
	console.log("copy assets");
	gulp.src('assets/**/*').pipe(gulp.dest('dist/static'));
});


gulp.task('watch', function() {
	gulp.watch(['templates/*', 'posts/*'], ['blog', 'index', 'markdown']);
	gulp.watch('./assets/**/*', ['assets']);
	gulp.start('blog', 'index', 'assets', 'markdown');
});


gulp.task('default', ['index', 'blog', 'markdown']);