COFFEE = main.coffee
SRC = ./main.js
COMBINE = ../done.js
COMPRESS = ../done.min.js

$(COMBINE) : $(SRC)
	cat $^ > $@

	growlnotify -t 'auto-make' -m 'make start.'
	((java -jar /Applications/gcc/compiler.jar --compilation_level ADVANCED_OPTIMIZATIONS --output_wrapper "/* done.js v1.0 (c) 2013 Atsushi Mizoue. */!function(){%output%}();" --js $(COMBINE) --js_output_file $(COMPRESS)) && growlnotify -t 'auto-make' -m 'make complete.') || growlnotify -t 'auto-make' -m 'make error.'
#	rm -f $(COMBINE)

$(SRC) : $(COFFEE)
	coffee -cb $^

.PHONY: clean
clean :
	rm -f $(COMBINE) $(COMPRESS)
