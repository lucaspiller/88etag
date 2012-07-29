server:
	python -m SimpleHTTPServer

dev:
	# npm -g install coffee-script
	coffee --require `pwd`/util/modulize.coffee --watch --bare --output lib/ --compile src/

minify:
	# npm install -g requirejs
	r.js -o name=88etag out=88etag.min.js baseUrl=lib

deploy:
	git push -f origin HEAD:gh-pages
