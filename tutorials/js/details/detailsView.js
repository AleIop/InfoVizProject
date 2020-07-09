function DishDetailsView({dish, addControl: [addAction, addMessage],
  onCancel: [cancelAction, cancelMessage], price, guests, inMenu}) {


    return h("fragment",
            h("img", {src: dish.image}),
            h("div", h("button", {onclick: addAction, disabled: inMenu}, addMessage),
              h("button", {onclick: cancelAction}, cancelMessage)),
            h("p", "Dish type:", h("span", dish.dishTypes[0])),
            h("p", "Dish title:", h("span", dish.title)),
            h("p", "Price:", h("span", price * guests)),
            h("p", "Recipee:", h("ol",
              dish.analyzedInstructions.length != 0 ? dish.analyzedInstructions[0].steps.map(i => h("li", i.step)) : "-"
              )
            ),
            h("a", {href: dish.sourceUrl}, "More details"),
            h("p", "Ingredients: ", dish.extendedIngredients.map(i => h("span", i.name + ", ")))
    );

}
