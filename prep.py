#!/usr/bin/python

from subprocess import check_output, call, CalledProcessError
import re

css = '/* LESS PREPROCESSOR OUTPUT, EDITS WILL BE OVERWRITTEN */' +\
    check_output('lessc styles/main.less'.split(' '))

open('styles/main.css', 'w').write(css)

data = open('dev.html').read().split('<!--WAT-->')
bef = data[0]
data = data[1].split('<!--ENDWAT-->')
scripts = data[0]
aft = data[1]

scripts = re.findall('src=[\"\']{1}(.+)[\"\']{1}', scripts)
print scripts

combined = []
for script in scripts:
    combined.append(open(script).read())

combined = '\n'.join(combined)

print len(combined)

open('scripts/combined.js', 'w').write(combined)

open('scripts/combined.min.js', 'w').write(check_output('uglifyjs scripts/combined.js'.split(' ')))

f = open('index.html', 'w')
f.write(bef)
f.write('<script type="text/javascript" src="scripts/combined.min.js"></script>')
f.write(aft)
