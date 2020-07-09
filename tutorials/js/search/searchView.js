class SearchView {

  constructor(model, root, whenDone) {
    this.root = root;
    this.model = model;
    [this.doneCallback, this.doneMessage] = whenDone;
  }

  render() {
    h("fragment",
      h("div", // search box
        this.textControl = h("input"), // free text search box
        this.typeControl = h("select", // dish type selector
          h("option", {value: ""}, "Choose:"),                             // empty first choice
          // the rest of the SELECT children are generated from an array:
          ["starter", "main course", "dessert"].map(opt => h("option", {value: opt}, opt))
        ),
        this.searchButton = h("button", "Search!") // search button
      ), // end of search box
      this.resultDiv = h("div"), // empty div for search results
      h("button", {class: "nav", onClick: event => this.doneCallback()}, this.doneMessage)
    ).render(this.root);
    this.updateSearchResults(this); // initially populate the resultDiv with nice dish images
}

  updateSearchResults(view) {
		renderPromise(
      model.searchDishes(view.typeControl.value, view.textControl.value),
      dishes => h("fragment", dishes.map(dish => view.createDishDisplay(dish))),
      view.resultDiv);
		}

  createDishDisplay(dish) {
    var imageUrl = dish.imageUrls[0];
    imageUrl = "https://spoonacular.com/recipeImages/" + imageUrl;
    return h("span", {id: dish.id, className: "dish", title: dish.title},
              h("img", {height: "100px",
                src: imageUrl}),
              h("span", dish.title))
  }

  isDishRepresentation(clickedNode) {
    var clickOnDish = event.target.parentNode.classList.contains("dish");
    if (clickOnDish) {
      var dish_id = clickedNode.parentNode.id;
      var dish_name = clickedNode.parentNode.lastElementChild.innerText;
      return true;
    } else {
      return false;
    }
  }
}
