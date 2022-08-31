# scale-recipe

## Export build to recipes.cashweaver.com

``` shell
npm run build:release \
  && ./node_modules/.bin/browserify build/src/main.js --standalone scale-recipe -o bundle.js \
  && cp bundle.js ~/proj/recipes/static/js/scale-recipe/
```
