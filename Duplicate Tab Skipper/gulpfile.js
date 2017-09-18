const tsFiles = "src/ts/**/*.ts";
const buildDir = "./build";
const resources = "src/resources/**/*.*";
const jsFiles = "src/js/**/*.js";

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

gulp.task("default", ["deploy", "tsc"], function () {
    gulp.watch(tsFiles, ["deploy", "tsc"]);
});


gulp.task("deploy", function () {
    gulp.src(resources)
        .pipe(gulp.dest("./build/"));
    gulp.src(jsFiles)
        .pipe(gulp.dest("./build/"));
});