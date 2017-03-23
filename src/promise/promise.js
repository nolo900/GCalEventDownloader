function addOne(val) {
	return new Promise(function(resolve, reject) {
		resolve(val + 1);
	});
}

function addTwo(val) {
	return new Promise(function(resolve, reject) {
		resolve(val + 2);
	});
}

function addThree(val) {
	return new Promise(function(resolve, reject) {
		resolve(val + 3);
	});
}

addOne()
	.then(addTwo)
	.then(addThree)
	.then(val => { console.log('value', val) })
	.catch(err => { console.log('error', err)});

