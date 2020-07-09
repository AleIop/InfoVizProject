class SidebarView {

  constructor(model, root, onDeleteClicked, changeInteger) {
    this.root = root;
    this.model = model;
    this.onDeleteClicked = onDeleteClicked;
    this.changeInteger = changeInteger;
    model.addObserver(() => this.update());
  }

  render() {
    // Number of guests
    h("fragment",
      h("div",
        h("button", {onClick: e => this.changeInteger(-1), disabled: model.getNumberOfGuests() <= 1}, "-"),
        h("span", model.getNumberOfGuests()),
        h("button", {onClick: e => this.changeInteger(1)}, "+")),
      // Dish
      h("table",
        h("tr", h("th", "Dish"), h("th", "Price")),
          model.getMenu()
          .map(dish =>
            h("tr", h("td", dish.title),
                    h("td", dish.price * model.getNumberOfGuests()),
                    h("td", h("button", { onClick: event => this.onDeleteClicked(dish)}, "x")))
          )
      )
    ).render(this.root);
    // Compute total price
    this.root.querySelector("table").appendChild(
      h("tr", h("td", "TOTAL"),
              h("td", model.getMenuPrice() * model.getNumberOfGuests())
      )
    );
  }

  update() {
    this.render();
  }

  getMinusButton() {
    return this.root.querySelector("#minusButton");
  }

  getPlusButton() {
    return this.root.querySelector("#plusButton");
  }
}
