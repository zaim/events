test:
	mocha

api: api.json
	jshint $<

api.json:
	node scripts/generate.js > $@

.PHONY: test api
