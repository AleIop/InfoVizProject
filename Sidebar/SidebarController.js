  class SidebarController {

  constructor(model, root){
    this.model = model;
    this.root = root;
    model.addObserver(this.update); //to be able to get the search results
    this.render();
    this.pageNumber = 0;
  }

  render() {
    h("div", {class: "text-center result-count"}, h("span", {}, "Search results will appear here.")).render(this.root);
  }

  //HERE WE HAVE ACCESS TO THE SEARCH RESULTS
  update(whatHappened) {
    if(whatHappened) {
      document.body.querySelector('#sidebar').scroll({
        top: 0,
        left: 0,
        behavior: "smooth"
      });

      // Clear resultsDiv and render search results
      h("fragment", {},
        h("div", {class: "text-center result-count"},
          h("span", {}, `Displaying results ${whatHappened.minRank} - ${(whatHappened.NStudiesFound <= 20)? whatHappened.searchResults.length : whatHappened.maxRank} out of ${whatHappened.NStudiesFound}`)),
        whatHappened.searchResults.map(res => model.createResultCard(res)),
        h('div', {id: "pageBtnDiv"},
          h('button', {
            id: 'previousPage',
            class: 'btn btn-outline-primary',
            onclick: e => {
              var newMin = whatHappened.minRank - 20;
              var newMax = whatHappened.minRank - 1;
              model.search(...whatHappened.param, newMin.toString(), newMax.toString());
            }}, 'Previous Page'),
          h('button', {
            id: 'nextPage',
            class: 'btn btn-outline-primary',
            onclick: e => {
              var newMin = whatHappened.maxRank + 1;
              var newMax = (whatHappened.NStudiesFound <= whatHappened.maxRank + 20) ? whatHappened.NStudiesFound : whatHappened.maxRank + 20;
              model.search(...whatHappened.param, newMin.toString(), newMax.toString());
            }}, 'Next Page')
        )
      ).render(document.body.querySelector('#sidebar'));


      //fix this
      if (whatHappened.searchResults.length < 20) {
        document.body.querySelector('#nextPage').setAttribute("disabled", "disabled");
        // document.body.querySelector('#nextPage').classList.add('disabled');

      } //what about when the results are exactly 20?
      else {
        document.body.querySelector('#nextPage').removeAttribute("disabled");
        // document.body.querySelector('#nextPage').classList.remove('disabled');
      }
      if (whatHappened.minRank == 1) {
        document.body.querySelector('#previousPage').setAttribute("disabled", "disabled");
        // document.body.querySelector('#previousPage').classList.add('disabled');
      }
      else {
        document.body.querySelector('#previousPage').removeAttribute("disabled");
        // document.body.querySelector('#previousPage').classList.remove('disabled');
      }


      document.body.querySelectorAll(".result-label").forEach(label => {
        if (label.textContent == "Has results") label.style.color = 'red';
        else label.style.color = '#6c757d';
      });

      var status = document.querySelectorAll('.status');
      status.forEach(el => {
        el.classList.add(el.textContent.replace(/ /g, '_').replace(",", ''));
        el.style.color = "red!important";
      });
    } else {
      h("div", {class: "text-center"},
        h("span", {class: "font-weight-bold"}, "No results to be shown.")
      ).render(document.body.querySelector('#sidebar'));
    }
  }
}
