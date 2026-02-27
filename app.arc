@app
disco-prototype

@aws
profile sanity

@plugins
disco
  src ./plugins/index.mjs

@events
foo
bar
baz

@queues
q

@tables
data
  pk *
  sk **

@http
get /
