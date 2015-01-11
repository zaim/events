test:
	mocha

api: lib/api.json
	jshint $<

lib/api.json:
	node scripts/generate.js > $@

.PHONY: test api
