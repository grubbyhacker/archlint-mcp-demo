.PHONY: presubmit

presubmit:
	npm test
	npm run archlint:check
