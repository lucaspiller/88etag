server:
	supervisor -w .,lib server.js

dev:
	coffee --watch --join lib/88etag.js --compile src/*.coffee

deploy:
	git push -f origin HEAD:gh-pages
