class Filters {
  constructor(model, root) {
    this.model = model;
    this.root = root;
    this.types = ['Interventional',
					 'Observational'];
    this.statuses = ['Recruiting',
      'Active not recruiting',
      'Completed',
      'Not yet recruiting',
      'Enrolling by invitation',
      'Terminated'];
    //this.countries = ["All countries",
    //				 "Country 1",
    //				 "Country 2",
    //				 "Country 3"];
    this.countries2 = [];
    d3.tsv('./js/util/countries.tsv', (data, i) => {
      this.countries2.push(data.Name);
    }).then(() => this.render());

    $(document).on('click', '.dropdown-menu', function (e) {
      e.stopPropagation();
    });
  }

  render() {
    h('form', {id: 'form-filter', class: 'form-inline', onsubmit: e => {e.preventDefault(); this.searchModel();}},
      this.SearchBox('Condition or Disease'), //custom component with specific attributes
      this.SearchBox('Study Name'),	  //see further down
      this.SearchBox('Other Terms'),
      this.Dropdown('dd-type', 'Type', this.types),
      this.Dropdown('dd-status', 'Status', this.statuses),
      this.Dropdown('dd-country', 'Country', this.countries2),
      h('button', {type: 'submit', id: 'search', class: 'btn btn-outline-primary div-filter'}, 'Search')
    ).render(this.root);
  }

  // CUSTOM COMPONENTS FOR SEARCH INPUTS AND DROPDOWN MENUS
  SearchBox(place) {
    return h('input', {
      type: 'search',
      id: place.toLowerCase().replace(/\s/g, '_'),
      class: 'form-control div-filter',
      placeholder: place,
      'aria-label':'SearchBox'
    });
  }
  Dropdown(i, label, array) {
    return h('div', {
      id: '' + i,
      class: 'dropdown div-filter'},
    h('a', { //placeholder button in the dropdown
      class: 'btn btn-secondary dropdown-toggle',
      href: '#',
      role: 'button',
      'data-toggle': 'dropdown',
      'aria-haspopup': 'true',
      'aria-expanded': 'false',
      //onclick: e => { this.parent().toggleClass('show'); }
    }, label),
    h('div', {class: 'dropdown-menu', 'aria-labelledby': 'dropdownMenuLink'}, //option container
      array.map((element) => {
        return this.Option(element, i); //all the options
      })
    )
    );
  }
  Option(el, idParent) {
    return h('div', {class: 'dropdown-item'},
      h('input', {type: 'checkbox', class: 'dd-checkbox', id: el.replace(/\s/g, '_'), name: el.replace(/\s/g, '_'), onclick: e => {this.assignClassToParent(el.replace(/\s/g, '_'), idParent);}}),
      h('label', {class: 'dd-text', for: el.replace(/\s/g, '_'), title: el}, el)
    );
  }

  //HERE WE HAVE ACCESS TO THE SEARCH RESULTS (needs adding addObserver call)
  update(whatHappened) {
    if(whatHappened.searchResults) {
		  // Clear resultsDiv and render search results
    }
  }

  searchModel() {
    var disease = document.body.querySelector('#condition_or_disease');
    var study = document.body.querySelector('#study_name');
    var keyword = document.body.querySelector('#other_terms');
    var type = document.body.querySelector('#dd-type');
    var status = document.body.querySelector('#dd-status');
    var country = document.body.querySelector('#dd-country');

    //FOR DEBUGGING
    console.log([disease.value,
					 study.value,
					 keyword.value,
					 type.classList.value.replace('dropdown div-filter ', '').split(' '),
					 status.classList.value.replace('dropdown div-filter ', '').split(' '),
					 country.classList.value.replace('dropdown div-filter ', '').split(' ')]);

    this.model.search(disease.value,
						  study.value,
						  keyword.value,
						  type.classList.value.replace('dropdown div-filter ', '').split(' '),
						  status.classList.value.replace('dropdown div-filter ', '').split(' '),
              country.classList.value.replace('dropdown div-filter ', '').split(' '),
              "", "");
  }

  assignClassToParent(selectedItem, idDropdown) {
    if ($(document.getElementById(selectedItem)).prop('checked')) $('#'+idDropdown).addClass(selectedItem);
    else $('#'+idDropdown).removeClass(selectedItem);
  }

}
