var gulp = require('gulp');
var nunjucks = require('gulp-nunjucks-render');
var markdown = require('gulp-markdown');
var fs = require('fs');
var path = require('path');
var im = require("imagemagick");
var async = require('async');
var Q = require('q');
var mkdirp = require('mkdirp');
var rename = require("gulp-rename");
var gm = require('gm');
var merge = require('merge-stream');
var postsDir = 'dist/partials';
var albumsDir = './dist/static/img/albums/';

function fnameToDate(name) {
	var date = name.split('.')[0].split('-').map(function(t) {
		return parseInt(t);
	});
	return new Date(date[2], date[0], date[1]);
}

function isPic(image) {
	return image.split('.')[1] === 'jpg';
}

function getPosts() {
	return fs.readdirSync(postsDir).sort(function(f1, f2) {
		return fnameToDate(f1) < fnameToDate(f2) ? 1 : -1;
	}).map(function(name) {
		return {
			text: fs.readFileSync(path.join(postsDir, name), {
				encoding: 'utf8'
			}),
			name: name
		}
	});

}


gulp.task('index', function() {
	console.log("build index");
});

gulp.task('thumbnails', ['assets'], function() {
	var deferred = Q.defer();
	var albums = fs.readdirSync(albumsDir);
	async.mapSeries(albums, function(album, albumCallback) {
		var images = fs.readdirSync(path.join(albumsDir, album))
			.filter(isPic);

		var thumbDir = path.join(__dirname, albumsDir, album, 'nthumbs');
		mkdirp(thumbDir, function() {
			async.mapSeries(images, function(image, cb) {

				var dest = path.join(thumbDir, image);

				gm(path.join(albumsDir, album, image))
					.resize('160', '160', '^')
					.gravity('Center')
					.crop('160', '160')
					.write(dest, function(err) {
						if (err) console.log(err);
						cb(err, "woohoo");
						console.log("Converted", dest)
					});

			}, function(err, results) {
				albumCallback(null, results);
			});
		});

	}, function(err, results) {
		deferred.resolve();
	});

	return deferred;
});

gulp.task('albums', ['thumbnails'], function() {

	var albums = fs.readdirSync(albumsDir);

	albums.map(function(album) {

		albumPath = path.join(albumsDir, album);
		var pics = fs.readdirSync(albumPath).filter(isPic);
		gulp.src('templates/album.html')
			.pipe(nunjucks({
				album: album,
				pics: pics
			}))
			.pipe(rename(album + '.html'))
			.pipe(gulp.dest('dist/albums'));
	});


	nunjucks.nunjucks.configure(['templates/']);
	gulp.src('templates/albums.html')
		.pipe(nunjucks({
			albums: albums
		}))
		.pipe(gulp.dest('dist'));
});


gulp.task('markdown', ['blog'], function() {

	var posts = getPosts().map(function(p) {
		return p.text;
	});

	nunjucks.nunjucks.configure(['templates/']);

	return gulp.src('templates/index.html')
		.pipe(nunjucks({
			posts: posts
		}))
		.pipe(gulp.dest('dist'));

});


gulp.task('posts', function() {
	var posts = getPosts();

	nunjucks.nunjucks.configure(['templates/']);

	var streams = posts.map(function(post) {
		return gulp.src('templates/post.html')
			.pipe(nunjucks({
				post: post.text
			}))
			.pipe(rename(post.name))
			.pipe(gulp.dest('dist/posts'))
	});

	var merged = merge(streams[0], streams[1]);
	streams.slice(2).forEach(function(s) {
		merged.add(s);
	});
	return merged;
});

gulp.task('blog', function() {
	gulp.src('posts/*')
		.pipe(markdown())
		.pipe(gulp.dest(postsDir));
});

gulp.task('assets', function() {
	gulp.src('assets/**/*').pipe(gulp.dest('dist/static'));
});

gulp.task('about', function() {
	nunjucks.nunjucks.configure(['templates/']);
	gulp.src('templates/about.html')
		.pipe(nunjucks())
		.pipe(gulp.dest('dist'))
});

gulp.task('resume', function() {
	gulp.src('templates/resume.html').pipe(gulp.dest('dist'))
})



gulp.task('watch', function() {
	gulp.watch(['templates/*', 'posts/*'], ['blog', 'index', 'markdown']);
	gulp.watch('./assets/**/*', ['assets']);
	gulp.start('blog', 'index', 'assets', 'markdown', 'albums');
});


gulp.task('default', ['index', 'blog', 'markdown', 'albums', 'resume', 'about']);
gulp.task('text', ['blog', 'markdown', 'index', 'posts']);