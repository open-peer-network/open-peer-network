var result = {};
var user = g.V("1");

user.outPredicates().map(function (d) {
    result[d.id] = user.out(d.id).toValue();
});

g.emit(result);
