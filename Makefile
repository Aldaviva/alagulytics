JSL := jsl
MOCHA := node_modules/mocha/bin/mocha
NODE := node
NPM := npm

TEST_REPORTER := spec

all:

.PHONY: lint
lint:
	@find lib -name "*.js" | xargs $(JSL) --conf=tools/jsl.conf --nofilelisting --nologo --nosummary *.js

install-deps:
	@$(NPM) install

.PHONY: test
test: lint
	@if [ -d ".pid" ]; then cat .pid | xargs kill -INT; fi; exit 0

	@rm -rf test/tempData .pid
	@$(NODE) $(MOCHA) --reporter $(TEST_REPORTER) --bail --slow 1000 test/suites
	@rm -rf test/tempData .pid