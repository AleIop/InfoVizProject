class DishDetailsContainer {

  constructor(model, root, onAdd, onCancel) {
    this.model = model;
    this.root = root;
    [this.onAddCallback, this.onAddLabel] = onAdd;
    [this.onCancelCallback, this.onCancelLabel] = onCancel;
    model.addObserver(() => this.currentDish ?
    this.createDishDisplay(this.currentDish).render(root) : null);
  }

  createDishDisplay(dish){
    return h("DishDetailsView", {dish: dish, price: model.computeDishPrice(dish),
      guests: model.getNumberOfGuests(), inMenu: model.isInMenu(dish),
      onCancel: [this.onCancelCallback, this.onCancelLabel],
      addControl: [ () => {
        model.addToMenu(dish);
        this.onAddCallback();
      }, this.onAddLabel]});
    }

  render(id){
    renderPromise(model.getDishDetails(id),
    dish => {
      this.currentDish = dish;
      return this.createDishDisplay(dish);
    }, this.root)
  }

}
