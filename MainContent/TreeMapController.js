class TreeMapController {

  constructor(model, root) {
    this.model = model;
    this.root = root;
    model.addObserver(this.update); //to be able to get the search results
    this.render();
  }

  render() {
    // Load tree map
    const runtime = new Runtime();
    const main = runtime.module(define, Inspector.into(this.root));
  }

  //HERE WE HAVE ACCESS TO THE SEARCH RESULTS
  update(whatHappened) {
    if(whatHappened.searchResults) {
      // Clear resultsDiv and render search results
    }
  }

}
