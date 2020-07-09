class SummaryController {

  constructor(model, root, whenDone){
    const update= ()=> h("SummaryView", {ingredients: model.computeShoppingList, guests: model.getNumberOfGuests, price: model.getMenuPrice, whenDone}).render(root);
    model.addObserver(update);
    update();  // initial rendering
  }
}
