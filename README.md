# scale-recipe

## Export build to [notes.cashpw.com](http://github.com/cashpw/notes.cashpw.com)

```shell
npm run build:release
./node_modules/.bin/browserify build/src/main.js --standalone scale-recipe -o ~/proj/notes.cashpw.com/static/js/scale-recipe/bundle.js
```
