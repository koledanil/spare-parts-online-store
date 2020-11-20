"use strict";

// требуем плагины
const projectFolder = "build";
const sourceFolder = "source";

const plumber = require("gulp-plumber");
const { src, dest } = require("gulp");
const gulp = require("gulp");
const browserSync = require("browser-sync").create();
const fileInclude = require("gulp-file-include");
const fileDel = require("del");
const scssPre = require("gulp-sass");
const autoPrefixer = require("gulp-autoprefixer");
const mediaQueryOprimize = require("gulp-group-css-media-queries");
const cssClean = require("gulp-clean-css");
const fileRename = require("gulp-rename");
const jsOpti = require("gulp-uglify-es").default;
const imgOpti = require("gulp-imagemin");
const webpConvert = require("gulp-webp");
const webpInsert = require("gulp-webp-in-html");
const retinaInsert = require("gulp-img-retina");
const retinaPrefixDefault = {
  suffix: { 1: "", 2: "@2x" }, // префиксы, к-ые будут прописаны ретиной в html
};
const svgSpriteMake = require("gulp-svg-sprite");
const svgMin = require("gulp-imagemin");
const ttf2woff = require("gulp-ttf2woff");
const ttf2woff2 = require("gulp-ttf2woff2");
const codeMap = require("gulp-sourcemaps");

const ghPages = require("gulp-gh-pages");
const svgCheerio = require("gulp-cheerio");
const svgReplace = require("gulp-replace");

// создаем объект описывающий данные для скрипта
const path = {
  build: {
    html: projectFolder + "/",
    css: projectFolder + "/css/",
    js: projectFolder + "/js/",
    img: projectFolder + "/img/",
    fonts: projectFolder + "/fonts/",
  },
  source: {
    html: [sourceFolder + "/*.html", "!" + sourceFolder + "/_*.html"], // прописываем исключение ненужных html (все они помечены _name.html)
    scss: sourceFolder + "/sass/style.scss",
    js: sourceFolder + "/js/script.js",
    img: [
      sourceFolder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
      "!" + sourceFolder + "/img/**/_*.svg",
    ],
    fonts: sourceFolder + "/fonts/*.ttf",
  },
  watch: {
    html: sourceFolder + "/**/*.html",
    scss: sourceFolder + "/sass/**/*.scss",
    js: sourceFolder + "/js/**/*.js",
    img: sourceFolder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
  },
  destroy: "./" + projectFolder + "/",
};

// вывод в браузер
function browserSyncGo(params) {
  browserSync.init({
    server: {
      baseDir: "./" + projectFolder + "/",
    },
    port: 1911,
    notify: false,
  });
}

// функция обработки html
function htmlGo() {
  return src(path.source.html)
    .pipe(retinaInsert(retinaPrefixDefault))
    .pipe(webpInsert()) // добавляет в html код для webp-версий изображений
    .pipe(fileInclude()) // добавляет html файлы в другой html через @@include('имя файла')

    .pipe(dest(path.build.html))
    .pipe(browserSync.stream());
}

// функция обработки css
// вход style через include, остальные блоки отдельные файлы
function cssGo() {
  return src(path.source.scss)
    .pipe(plumber())
    .pipe(codeMap.init())
    .pipe(
      scssPre({
        outputStyle: "expanded",
      })
    )
    .pipe(mediaQueryOprimize())
    .pipe(
      autoPrefixer({
        overrideBrowserslist: ["last 5 versions"],
        cascade: true,
      })
    )
    .pipe(dest(path.build.css)) // выгрузка до оптимизации
    .pipe(cssClean())
    .pipe(
      fileRename({
        extname: ".min.css",
      })
    )
    .pipe(codeMap.write("."))
    .pipe(dest(path.build.css)) // после оптимизации, подключ. в финальный index
    .pipe(browserSync.stream());
}

// обработка JS
function jsGo() {
  return src(path.source.js)
    .pipe(fileInclude())
    .pipe(dest(path.build.js)) // выгрузка до оптимизации
    .pipe(jsOpti())
    .pipe(
      fileRename({
        extname: ".min.js",
      })
    )
    .pipe(dest(path.build.js)) // после оптимизации, подключ. в финальный index
    .pipe(browserSync.stream());
}

// функция обработки изображений: конвертация в Webp и оптимизация размера
function imgGo() {
  return src(path.source.img)
    .pipe(
      webpConvert({
        quality: 85,
      })
    )
    .pipe(dest(path.build.img))
    .pipe(src(path.source.img))
    .pipe(
      imgOpti({
        progressive: true,
        interlaced: true,
        optimizationLevel: 0, // от 0 до 7
        svgoPlugins: [{ removeViewBox: false }],
      })
    )
    .pipe(dest(path.build.img))
    .pipe(browserSync.stream());
}

function spriteMake() {
  return src([sourceFolder + "/img/iconsprite/_*.svg"])
    .pipe(
      svgMin({
        js2svg: {
          pretty: true,
        },
      })
    )
    .pipe(
      svgCheerio({
        run: function ($) {
          $("[fill]").removeAttr("fill");
          $("[stroke]").removeAttr("stroke");
          $("[style]").removeAttr("style");
        },
        parserOptions: { xmlMode: true },
      })
    )
    .pipe(svgReplace("&gt", ">"))
    .pipe(
      svgSpriteMake({
        mode: {
          symbol: {
            sprite: "../iconsprite/icons.svg",
            example: true,
          },
        },
      })
    )
    .pipe(dest(path.build.img));
}

// следим за изменения в файлах
function watchFiles(params) {
  gulp.watch([path.watch.html], htmlGo); // передаем путь из объекта и фукнцию которую надо применить при изменении файла
  gulp.watch([path.watch.scss], cssGo);
  gulp.watch([path.watch.js], jsGo);
  gulp.watch([path.watch.img], imgGo);
  gulp.watch([path.watch.img], spriteMake);
}

// удаляем все из папки билд
function destroyBuild(params) {
  return fileDel(path.destroy);
}

gulp.task("fontsConverter", function () {
  src(path.src.fonts).pipe(ttf2woff()).pipe(dest(path.build.fonts));

  return pipe(src(path.src.fonts))
    .pipe(ttf2woff2())
    .pipe(dest(path.build.fonts));
});

gulp.task("deploy", function () {
  return gulp.src("./build/**/*").pipe(ghPages());
});

function publishGitPage() {
  return gulp.src("./build/**/*").pipe(ghPages());
}

// оформляем серии для gulp
let build = gulp.series(
  destroyBuild,
  gulp.parallel(jsGo, htmlGo, cssGo, imgGo, spriteMake)
);
let watch = gulp.parallel(build, watchFiles, browserSyncGo);

// Соберет весь проект и обупдикует в gh-pages (ветка должна быть предварительно создана)
let publish = gulp.series(build, publishGitPage);

// оформляем экспорты
exports.publish = publish;
exports.gitpage = publishGitPage;
exports.sprite = spriteMake;
exports.img = imgGo;
exports.js = jsGo;
exports.css = cssGo;
exports.html = htmlGo;
exports.build = build;
exports.watch = watch;
exports.default = watch;
