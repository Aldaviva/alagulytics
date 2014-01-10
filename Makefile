JSL := jsl
NPM := npm

all:

.PHONY: lint
lint:
	@find lib -name "*.js" | xargs $(JSL) --conf=tools/jsl.conf --nofilelisting --nologo --nosummary *.js

install-deps:
	@$(NPM) install
