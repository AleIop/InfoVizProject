class DinnerModel{

  constructor() {
    var rootReducer = Redux.combineReducers(
      {numberOfGuests: numberOfGuests, dishes: dishes});
    this.store = Redux.createStore(rootReducer, persistedState);
    // Update stored state when model changes
    this.addObserver(() => localStorage.setItem('reduxState',
      JSON.stringify(this.store.getState())));
  }

  setNumberOfGuests(x) {
    if (x >= 1) {
      this.store.dispatch({type: 'SET_NO_GUESTS', numberOfGuests: x});
    } else {
      console.error(`Invalid number of guests: ${x}`)
    }
  }

  getNumberOfGuests() {
    return model.store.getState().numberOfGuests;
  }

  addToMenu(dish) {
    if (model.isInMenu(dish)) {
      console.error(`${dish.title} is already present in the menu.`);
    } else {
      // Add price
      dish.price = model.computeDishPrice(dish);
      model.store.dispatch({type: 'ADD_DISH', dish: dish});
    }
  }

  computeDishPrice(dish) {
    let price = 0;
    dish.extendedIngredients.forEach(ing =>
       price += ing.amount.toFixed(2) * model.getNumberOfGuests());
    return price;
  }

  getMenu() {
    return model.store.getState().dishes
      .sort((a, b) => model.computeDishIndex(a) - model.computeDishIndex(b));
  }

  getMenuPrice() {
    return model.getMenu().reduce((a, cv) =>
          a + cv.price, 0)
  }

  isInMenu(dish) {
    return model.getMenu().some(d => d.id == dish.id);
  }

  addObserver(callback){
    this.store.subscribe(callback);
  }

  searchDishes(dishType, freeText) {
    // Replace variables in case they are falsy (e.g. empty string, null, undefined)
    dishType = dishType || "";
    freeText = freeText || "";
    return this.retrieve(`recipes/search?type=${dishType}&query=${freeText}`)
    .then(data => data.results)          // leave out the unimportant parts of the response data;
  }

  getDishDetails(dish_id) {
    return this.retrieve(`recipes/${dish_id}/information`);
  }

  computeDishIndex(dish) {
    var dishTypes = dish.dishTypes;
    if (dishTypes.includes("starter")) {
      return 0;
    }
    if (dishTypes.includes("main course")) {
      return 1;
    }
    if (dishTypes.includes("dessert")) {
      return 2;
    }
  }

  computeShoppingList() {
    var shList = [];
    model.getMenu().forEach(dish =>
      dish.extendedIngredients.forEach(ing => {
        // Check for duplicates
        var existing = shList.filter(i => i.name == ing.name);
        if (existing.length != 0) {
          existing[0].amount += ing.amount;
        } else {
          shList.push({ name: ing.name, aisle: ing.aisle, amount: ing.amount});
        }
      })
    );
    // Sort by ingredient name
    shList.sort((ing1, ing2 ) => {
      if (ing1.name < ing2.name) return -1;
      if (ing1.name > ing2.name) return 1;
      return 0;
    });
    // Sort by supermarket aile
    shList.sort((ing1, ing2 ) => {
      if (ing1.aisle < ing2.aisle) return -1;
      if (ing1.aisle > ing2.aisle) return 1;
      return 0;
    });
    return shList;
  }

  retrieve(query) {
    const controller = new AbortController();
    const ret = fetch(ENDPOINT + query, {
      signal: controller.signal,
      "method": "GET",
      "headers": {
        'X-Mashape-Key': API_KEY
      }
    })
    .then(response => response.json())   // from headers to response data
    .catch(error => console.error(error.message));
    ret.abort = () => controller.abort();
    return ret;
  }

  removeFromMenu(dish) {
    model.store.dispatch({type: 'REMOVE_DISH', dish: dish});
  }

}

// Reducer for number of guests
function numberOfGuests(state = 1, action) {
  if (action.type === 'SET_NO_GUESTS') {
    return action.numberOfGuests;
  } else {
    return state;
  }
}

// Reducer for dishes
function dishes(state = [], action) {
  switch (action.type) {
    case 'ADD_DISH':
      return [...state, action.dish];
    case 'REMOVE_DISH':
      return [...state].filter(dish => dish.id != action.dish.id);
    default:
      return [...state];

  }
  if (action.type === 'ADD_DISH') {
    return [...state, action.dish];
  } else {
    return [...state];
  }
}
