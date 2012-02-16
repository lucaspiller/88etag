server:
	python -m SimpleHTTPServer

dev:
	coffee -c -o lib -w src

deploy:
	git push -f origin HEAD:gh-pages
