require("./_harness.js");
const A = global.ALGOS || [];
const ids = new Set(A.map(a => a.id));
console.log("ALGOS " + A.length + " 唯一 " + ids.size);
