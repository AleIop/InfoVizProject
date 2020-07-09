class SidebarController{

  constructor(model, root){
    new SidebarView(model, root,
                      dish => model.removeFromMenu(dish),
                      diff => model.setNumberOfGuests(model.getNumberOfGuests() + diff))
    .render();
  }

}
