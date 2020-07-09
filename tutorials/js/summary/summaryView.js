function SummaryView({ingredients, guests, price, whenDone:[doneCallback, doneMessage]}) {

  return h("fragment",
    // Shopping list
    h("div", "Shopping list:",
      h("table",
        h("tr", h("th", "Ingredient"), h("th", "Supermarket aisle"), h("th", "Amount")),
          ingredients()
          .map(ing =>
            h("tr", h("td", ing.name),
                    h("td", ing.aisle),
                    h("td", ing.amount * guests())
                  )
          ),
          h("tr", h("td", "TOTAL"), h("td"), h("td", price() * guests()))
      )
    ),
    // Number of guests
    h("div", "Dinner for ", h("span", guests()), " people"),
    h("button", {class: "nav", onClick: event => doneCallback()}, doneMessage)
  );
}
