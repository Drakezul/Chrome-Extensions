const tsFiles = "src/ts/**/*.ts";
const buildDir = "./build/";
const resources = "src/resources/**/*.*";
const jsFiles = "src/js/**/*.js";
const htmlFiles = "src/html/**/*.html";

var gulp = require("gulp");
var ts = require("gulp-typescript");

var tsProject = ts.createProject({
    noImplicitAny: true,
    target: "ES6"
});

gulp.task("tsc", function () {
    return gulp.src(tsFiles)
        .pipe(tsProject())
        .js.pipe(gulp.dest(buildDir));
});

gulp.task("deploy", gulp.series('tsc', function (done) {
    gulp.src(resources)
        .pipe(gulp.dest(buildDir));
    gulp.src(jsFiles)
        .pipe(gulp.dest(buildDir));
    gulp.src(htmlFiles)
        .pipe(gulp.dest(buildDir));
    done();
}));

gulp.task("default", gulp.series('deploy', function (done) {
    gulp.watch(tsFiles, gulp.series("deploy"));
    gulp.watch(resources, gulp.series("deploy"));
    gulp.watch(htmlFiles, gulp.series("deploy"));
    done();
}));