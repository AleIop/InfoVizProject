class SearchController{

  constructor(model, root, whenDone, onAdd) {
    const view = new SearchView(model, root, whenDone);
    view.render();

    // Add event listener for search button and dishes
    root.addEventListener("click", function(event) {
      if (event.target == view.searchButton) {
        view.updateSearchResults(view);
      } else if (view.isDishRepresentation(event.target)) {
        // Add dish to menu
        var dish_id = event.target.parentNode.id;
        onAdd(dish_id);
      }
    });

    // Add event listener for search textControl
    root.addEventListener("input", function(event) {
      if (event.target == view.textControl) {
        clearTimeout(this.timerId);
        this.timerId = setTimeout(view.updateSearchResults, 500, view);
      }
    });

  }

}
