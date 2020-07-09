function renderPromise(promise, hyperscript, node) {
  if (this.cancelCallback) this.cancelCallback();
	let doCancel = false;

	const spinner = this.createSpinner();
	spinner.render(node);  // clears this.resultDiv of all its children, i.e. wipes the previous search results. Then adds the spinner

	promise.then(result => {
			if (doCancel) return;
			hyperscript(result).render(node);
		})
	  .catch(error => {
			if (doCancel) return;
			h("span", error.message).render(node);
		})
	  .finally(() => spinner.remove());

		this.cancelCallback = () => {doCancel = true;};
}

function createSpinner() {
	return h("div", {className: "spinnerClass"}, h("img", {height: 100, src: "http://cdn.lowgif.com/full/d9675675623d5f27-loading-gif-transparent-background-loading-gif.gif"}));
}
